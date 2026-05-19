import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMainContext } from '../main/context';
import {
  getRenderableDoors,
  loadDoorsForZone,
  normalizeZoneVersion,
} from '../spire/door-loader';
import {
  CAMERA_FLY_SPEED_DEFAULT,
  CAMERA_FLY_SPEED_MIN,
  clampFlySpeed,
} from '../../viewer/common/cameraSettings';

const ZoneContext = React.createContext({});
export const useZoneContext = () => React.useContext(ZoneContext);

const isPreviewValidationEnabled = () => {
  if (typeof window === 'undefined' || !window.__spireSagePreview) {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.has('sageValidation') || params.has('sageValidateZones');
};

const runMovementProbe = (gameController) => {
  if (!isPreviewValidationEnabled()) {
    return null;
  }
  const cameraController = gameController?.CameraController;
  const camera = cameraController?.camera;
  if (!camera?.position) {
    return null;
  }

  const before = camera.position.clone();
  const originalSpeed = camera.speed;
  const testSpeed = clampFlySpeed(
    Math.max(CAMERA_FLY_SPEED_DEFAULT, Number(originalSpeed) + 1)
  );
  gameController?.ZoneController?.setFlySpeed?.(testSpeed);
  const appliedSpeed = camera.speed;
  cameraController.movementKeys.add('forward');
  cameraController.applyKeyboardMovement(1);
  cameraController.movementKeys.delete('forward');
  cameraController.stopCameraMotion();
  const after = camera.position.clone();
  camera.position.copyFrom(before);
  gameController?.ZoneController?.setFlySpeed?.(originalSpeed);

  return {
    before: { x: before.x, y: before.y, z: before.z },
    after : { x: after.x, y: after.y, z: after.z },
    appliedSpeed,
    distance: after.subtract(before).length(),
    originalSpeed,
    restoredSpeed: camera.speed,
    speed: camera.speed,
    speedSettingApplied: Math.abs(appliedSpeed - testSpeed) < 0.001,
    testSpeed,
    effectiveSpeed: window.__spireSageCameraStats?.effectiveSpeed ?? null,
  };
};

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const hasBoundaryMaterial = (material) => {
  if (!material) {
    return false;
  }

  const materialName = `${material.name ?? ''}`;
  return (
    /^m000\d+$/i.test(materialName) ||
    material.metadata?.gltf?.extras?.boundary === true ||
    material.metadata?.extras?.boundary === true
  );
};

const hasPassThroughMaterial = (material) => {
  if (!material) {
    return false;
  }

  return (
    material.metadata?.gltf?.extras?.passThrough === true ||
    material.metadata?.extras?.passThrough === true
  );
};

const hasHiddenZoneMaterial = (material) => {
  if (!material) {
    return false;
  }
  if (hasBoundaryMaterial(material) || hasPassThroughMaterial(material)) {
    return true;
  }
  return material.subMaterials?.some?.(hasHiddenZoneMaterial) === true;
};

const isActiveBoundaryMesh = (mesh) => {
  if (!mesh || mesh.isDisposed?.() || mesh._isDisposed) {
    return false;
  }
  if (
    mesh.isEnabled?.() === false ||
    mesh.isVisible === false ||
    mesh.visibility === 0
  ) {
    return false;
  }

  const meshName = `${mesh.name ?? ''}`;
  if (/^m000\d+/i.test(meshName) || /-boundary$/i.test(meshName)) {
    return true;
  }

  const material = mesh.material;
  if (hasBoundaryMaterial(material)) {
    return true;
  }
  return material?.subMaterials?.some?.(hasBoundaryMaterial) === true;
};

const collectSpawnVisualStats = async (gameController) => {
  if (!isPreviewValidationEnabled()) {
    return null;
  }

  const spawnController = gameController?.SpawnController;
  if (typeof spawnController?.collectSpawnVisualStats !== 'function') {
    return null;
  }

  const deadline = Date.now() + 5000;
  let visualStats = null;
  do {
    await wait(250);
    visualStats = spawnController.collectSpawnVisualStats();
    const texturesReady =
      visualStats.texturelessSpawnCount === 0 &&
      visualStats.pendingTextureCount === 0;
    const animationsReady =
      visualStats.tPoseRiskCount === 0 &&
      visualStats.nonPlayingAnimationCount === 0;
    const groundReady =
      (visualStats.belowGroundSpawnCount ?? 0) === 0 &&
      (visualStats.aboveGroundSpawnCount ?? 0) === 0;
    if (texturesReady && animationsReady && groundReady) {
      return visualStats;
    }
  } while (Date.now() < deadline);

  return visualStats;
};

const getMaterialSlots = (material) => {
  if (!material) {
    return [];
  }
  if (material.subMaterials?.length) {
    return material.subMaterials.filter(Boolean);
  }
  return [material];
};

const getMaterialTextures = (material) => {
  if (!material) {
    return [];
  }

  const textures = [];
  const addTexture = (texture) => {
    if (texture && !textures.includes(texture)) {
      textures.push(texture);
    }
  };

  addTexture(material.albedoTexture);
  addTexture(material._albedoTexture);
  addTexture(material.diffuseTexture);
  addTexture(material._diffuseTexture);
  addTexture(material.emissiveTexture);
  addTexture(material._emissiveTexture);

  const activeTextures =
    typeof material.getActiveTextures === 'function'
      ? material.getActiveTextures()
      : [];
  activeTextures.forEach(addTexture);

  return textures;
};

const isTextureReady = (texture) => {
  if (!texture) {
    return false;
  }
  if (typeof texture.isReady === 'function') {
    return texture.isReady();
  }
  if (typeof texture.isReady === 'boolean') {
    return texture.isReady;
  }
  if (typeof texture._texture?.isReady === 'boolean') {
    return texture._texture.isReady;
  }
  return true;
};

const getDoorModelName = (mesh) => {
  const dataReferenceName = mesh.dataReference?.name;
  if (dataReferenceName) {
    return `${dataReferenceName}`.toLowerCase();
  }
  return `${mesh.name ?? ''}`.replace(/_\d+$/i, '').toLowerCase();
};

const collectDoorVisualStatsNow = (gameController) => {
  const doorNode = gameController?.ZoneController?.doorNode;
  const doorMeshes = (doorNode?.getChildMeshes?.(false) ?? []).filter(isVisibleMesh);
  const stats = {
    doorMeshCount: doorMeshes.length,
    materialSlotCount: 0,
    texturedSlotCount: 0,
    readyTextureCount: 0,
    pendingTextureCount: 0,
    fallbackTextureCount: 0,
    tinyTextureCount: 0,
    onePixelTextureCount: 0,
    texturelessDoorCount: 0,
    texturelessSamples: [],
    pendingTextureSamples: [],
    fallbackTextureSamples: [],
    tinyTextureSamples: [],
    onePixelTextureSamples: [],
  };

  for (const mesh of doorMeshes) {
    const modelName = getDoorModelName(mesh);
    const missingModelTextures =
      window.__spireSageMissingModelTextures?.[`/eq/objects/${modelName}.glb`] ?? [];
    if (missingModelTextures.length > 0) {
      stats.fallbackTextureCount += missingModelTextures.length;
      if (stats.fallbackTextureSamples.length < 10) {
        stats.fallbackTextureSamples.push({
          mesh: mesh.name,
          modelName,
          textures: missingModelTextures.slice(0, 12),
        });
      }
    }

    const materialSlots = getMaterialSlots(mesh.material);
    let doorTexturedSlots = 0;
    stats.materialSlotCount += materialSlots.length;

    for (const material of materialSlots) {
      const textures = getMaterialTextures(material);
      if (textures.length === 0) {
        continue;
      }

      doorTexturedSlots++;
      stats.texturedSlotCount++;
      for (const texture of textures) {
        if (isTextureReady(texture)) {
          stats.readyTextureCount++;
        } else {
          stats.pendingTextureCount++;
          if (stats.pendingTextureSamples.length < 10) {
            stats.pendingTextureSamples.push({
              mesh: mesh.name,
              modelName,
              material: material.name,
              texture: texture.name ?? texture.url,
            });
          }
        }

        const size = texture.getSize?.();
        const width = Number(size?.width ?? 0);
        const height = Number(size?.height ?? 0);
        const textureSample = {
          mesh: mesh.name,
          modelName,
          material: material.name,
          texture : texture.name ?? texture.url,
          width,
          height,
        };
        if ((width > 0 && width <= 8) || (height > 0 && height <= 8)) {
          stats.tinyTextureCount++;
          if (stats.tinyTextureSamples.length < 10) {
            stats.tinyTextureSamples.push(textureSample);
          }
        }
        if ((width > 0 && width <= 1) || (height > 0 && height <= 1)) {
          stats.onePixelTextureCount++;
          if (stats.onePixelTextureSamples.length < 10) {
            stats.onePixelTextureSamples.push(textureSample);
          }
        }
      }
    }

    if (materialSlots.length > 0 && doorTexturedSlots === 0) {
      stats.texturelessDoorCount++;
      if (stats.texturelessSamples.length < 10) {
        stats.texturelessSamples.push({
          mesh: mesh.name,
          modelName,
          materials: materialSlots.map((material) => material.name),
        });
      }
    }
  }

  return stats;
};

const collectDoorVisualStats = async (gameController, expectedDoorCount) => {
  if (!isPreviewValidationEnabled()) {
    return null;
  }

  const deadline = Date.now() + 5000;
  let visualStats = null;
  do {
    await wait(250);
    visualStats = collectDoorVisualStatsNow(gameController);
    const doorCountReady =
      expectedDoorCount === 0 || visualStats.doorMeshCount >= expectedDoorCount;
    const texturesReady =
      visualStats.texturelessDoorCount === 0 &&
      visualStats.pendingTextureCount === 0 &&
      visualStats.fallbackTextureCount === 0 &&
      visualStats.onePixelTextureCount === 0 &&
      (expectedDoorCount === 0 || visualStats.texturedSlotCount > 0);
    if (doorCountReady && texturesReady) {
      return visualStats;
    }
  } while (Date.now() < deadline);

  return visualStats;
};

const getMaterialNames = (material) => {
  if (!material) {
    return [];
  }
  if (material.subMaterials?.length) {
    return material.subMaterials
      .map((subMaterial) => subMaterial?.name)
      .filter(Boolean)
      .slice(0, 48);
  }
  return material.name ? [material.name] : [];
};

const isVisibleMesh = (mesh) => {
  if (!mesh || mesh.isDisposed?.() || mesh._isDisposed) {
    return false;
  }
  if (
    mesh.isEnabled?.(true) === false ||
    mesh.isEnabled?.() === false ||
    mesh.isVisible === false ||
    mesh.visibility === 0
  ) {
    return false;
  }
  if (mesh.name === 'skyBox' || mesh.id === 'skyBox') {
    return false;
  }
  return typeof mesh.getTotalVertices !== 'function' || mesh.getTotalVertices() > 0;
};

const findRootNode = (node) => {
  let current = node;
  while (current?.parent) {
    current = current.parent;
  }
  return current ?? node;
};

const collectGeometryArtifactStats = (gameController) => {
  if (!isPreviewValidationEnabled()) {
    return null;
  }

  const meshes = gameController?.currentScene?.meshes ?? [];
  const oversizedMeshes = [];
  const hiddenMaterialLeaks = [];
  for (const mesh of meshes) {
    if (!isVisibleMesh(mesh)) {
      continue;
    }

    if (hasHiddenZoneMaterial(mesh.material)) {
      hiddenMaterialLeaks.push({
        id: mesh.id,
        name: mesh.name,
        materialNames: getMaterialNames(mesh.material),
      });
    }

    let minimumWorld = null;
    let maximumWorld = null;
    try {
      mesh.computeWorldMatrix?.(true);
      mesh.refreshBoundingInfo?.(true, true);
      const boundingBox = mesh.getBoundingInfo?.()?.boundingBox;
      minimumWorld = boundingBox?.minimumWorld;
      maximumWorld = boundingBox?.maximumWorld;
    } catch (_e) {
      continue;
    }
    if (!minimumWorld || !maximumWorld) {
      continue;
    }

    const size = {
      x: Math.abs(maximumWorld.x - minimumWorld.x),
      y: Math.abs(maximumWorld.y - minimumWorld.y),
      z: Math.abs(maximumWorld.z - minimumWorld.z),
    };
    const maxDimension = Math.max(size.x, size.y, size.z);
    if (maxDimension < 1200) {
      continue;
    }

    const rootNode = findRootNode(mesh);
    oversizedMeshes.push({
      id: mesh.id,
      name: mesh.name,
      parentId: mesh.parent?.id ?? null,
      parentName: mesh.parent?.name ?? null,
      rootId: rootNode?.id ?? null,
      rootName: rootNode?.name ?? null,
      materialNames: getMaterialNames(mesh.material),
      maxDimension,
      min: {
        x: minimumWorld.x,
        y: minimumWorld.y,
        z: minimumWorld.z,
      },
      max: {
        x: maximumWorld.x,
        y: maximumWorld.y,
        z: maximumWorld.z,
      },
      spawnModel: mesh.babylonSpawn?.modelName ?? rootNode?.babylonSpawn?.modelName ?? null,
      spawnName:
        mesh.babylonSpawn?.spawn?.name ??
        rootNode?.babylonSpawn?.spawn?.name ??
        rootNode?.metadata?.spawn?.name ??
        null,
      hiddenBoundary:
        mesh.metadata?.hiddenBoundary === true ||
        rootNode?.metadata?.hiddenBoundary === true,
      metadataKeys: Object.keys(mesh.metadata ?? {}).slice(0, 12),
      rootMetadataKeys: Object.keys(rootNode?.metadata ?? {}).slice(0, 12),
      visibility: mesh.visibility,
      isVisible: mesh.isVisible,
      enabled: mesh.isEnabled?.(true) ?? mesh.isEnabled?.() ?? null,
    });
  }

  oversizedMeshes.sort((a, b) => b.maxDimension - a.maxDimension);
  return {
    hiddenMaterialLeakCount: hiddenMaterialLeaks.length,
    hiddenMaterialLeaks: hiddenMaterialLeaks.slice(0, 20),
    oversizedMeshCount: oversizedMeshes.length,
    oversizedMeshes: oversizedMeshes.slice(0, 40),
  };
};

const emitZoneValidation = async ({
  selectedZone,
  spawnPoints,
  gridPoints,
  doorPoints,
  doorLoad,
  gameController,
}) => {
  if (typeof window === 'undefined' || !window.__spireSagePreview) {
    return;
  }

  const zoneSpawnsNode = gameController?.currentScene?.getNodeById?.('zone-spawns');
  const sceneChildren = zoneSpawnsNode?.getChildren?.() ?? [];
  const rootIds = sceneChildren
    .filter((child) => child?.metadata?.spawnRoot === true)
    .map((child) => child.id);
  const lodProxyCount = sceneChildren.filter(
    (child) => child?.metadata?.onlyOccluded === false
  ).length;
  const movement = runMovementProbe(gameController);
  const spawnStats = window.__spireSageSpawnStats ?? null;
  const canvasStats = window.__spireSageCanvasStats ?? null;
  const visualStats = await collectSpawnVisualStats(gameController);
  const renderableDoorPoints = Array.isArray(doorLoad?.renderableDoors)
    ? doorLoad.renderableDoors
    : getRenderableDoors(doorPoints);
  const visibleDoorCount = renderableDoorPoints.length;
  const hiddenDoorCount = doorLoad?.invisibleDoors?.length ??
    Math.max(0, doorPoints.length - visibleDoorCount);
  const doorVisualStats = await collectDoorVisualStats(
    gameController,
    visibleDoorCount
  );
  const geometryStats = collectGeometryArtifactStats(gameController);
  const boundaryMeshes =
    gameController?.currentScene?.meshes?.filter?.(isActiveBoundaryMesh) ?? [];
  const canvasPass =
    !!canvasStats &&
    canvasStats.attributeWidth === canvasStats.innerWidth &&
    canvasStats.attributeHeight === canvasStats.innerHeight &&
    Math.abs((canvasStats.boundsWidth ?? 0) - canvasStats.innerWidth) <= 1 &&
    Math.abs((canvasStats.boundsHeight ?? 0) - canvasStats.innerHeight) <= 1 &&
    canvasStats.cssWidth === '100vw' &&
    canvasStats.cssHeight === '100vh';
  const movementPass =
    !!movement &&
    Number.isFinite(movement.distance) &&
    movement.speedSettingApplied === true &&
    movement.distance >= CAMERA_FLY_SPEED_MIN &&
    Number(movement.effectiveSpeed ?? 0) >= CAMERA_FLY_SPEED_MIN;
  const spawnPass =
    !!spawnStats &&
    spawnStats.requested > 0 &&
    spawnStats.loaded === spawnStats.requested &&
    rootIds.length === spawnStats.loaded &&
    new Set(rootIds).size === rootIds.length &&
    lodProxyCount === 0 &&
    (spawnStats.missingAssetCount ?? 0) === 0 &&
    (spawnStats.unresolvedModelCount ?? 0) === 0 &&
    (spawnStats.fallbackCount ?? 0) === 0;
  const texturePass =
    !!visualStats &&
    visualStats.spawnCount === (spawnStats?.loaded ?? 0) &&
    visualStats.materialSlotCount > 0 &&
    visualStats.texturedSlotCount > 0 &&
    visualStats.texturelessSpawnCount === 0 &&
    visualStats.pendingTextureCount === 0 &&
    (visualStats.belowGroundSpawnCount ?? 0) === 0 &&
    (visualStats.aboveGroundSpawnCount ?? 0) === 0 &&
    (visualStats.onePixelTextureCount ?? 0) === 0 &&
    (visualStats.fallbackTextureCount ?? 0) === 0;
  const animationPass =
    !!visualStats &&
    visualStats.skeletonSpawnCount > 0 &&
    visualStats.animatedSkeletonSpawnCount === visualStats.skeletonSpawnCount &&
    visualStats.tPoseRiskCount === 0 &&
    visualStats.nonPlayingAnimationCount === 0;
  const boundaryPass =
    gameController?.settings?.importBoundary === true ||
    boundaryMeshes.length === 0;
  const geometryPass = (geometryStats?.hiddenMaterialLeakCount ?? 0) === 0;
  const doorPass =
    doorPoints.length === 0 ||
    (
      doorLoad?.loadedMeshes === visibleDoorCount &&
      (doorLoad?.missingModels?.length ?? 0) === 0 &&
      !!doorVisualStats &&
      doorVisualStats.doorMeshCount === doorLoad.loadedMeshes &&
      (visibleDoorCount === 0 || doorVisualStats.materialSlotCount > 0) &&
      (visibleDoorCount === 0 || doorVisualStats.texturedSlotCount > 0) &&
      doorVisualStats.texturelessDoorCount === 0 &&
      doorVisualStats.pendingTextureCount === 0 &&
      doorVisualStats.fallbackTextureCount === 0 &&
      doorVisualStats.onePixelTextureCount === 0
    );
  const report = {
    zone: selectedZone?.short_name ?? null,
    longName: selectedZone?.long_name ?? null,
    requestedSpawns: spawnPoints.length,
    gridPathPoints: gridPoints.length,
    doors: {
      loaded       : doorLoad?.loadedMeshes ?? 0,
      hidden       : hiddenDoorCount,
      missingModels: doorLoad?.missingModels ?? [],
      requested    : doorPoints.length,
      visibleRequested: visibleDoorCount,
      visuals      : doorVisualStats,
    },
    canvas: canvasStats,
    camera: window.__spireSageCameraStats ?? null,
    cameraFraming: window.__spireSageCameraFraming ?? null,
    movement,
    spawns: spawnStats,
    visuals: visualStats,
    geometry: geometryStats,
    rootNodeCount: rootIds.length,
    rootNodeIdsAreUnique: new Set(rootIds).size === rootIds.length,
    lodProxyCount,
    boundaryMeshCount: boundaryMeshes.length,
    boundaryMeshes: boundaryMeshes.map((mesh) => mesh.name).slice(0, 20),
    sceneMeshCount: gameController?.currentScene?.meshes?.length ?? 0,
    pass: {
      canvas: canvasPass,
      movement: movementPass,
      spawns: spawnPass,
      textures: texturePass,
      animations: animationPass,
      boundary: boundaryPass,
      geometry: geometryPass,
      doors: doorPass,
      all: canvasPass && movementPass && spawnPass && texturePass && animationPass && boundaryPass && geometryPass && doorPass,
    },
    timestamp: new Date().toISOString(),
  };

  window.__spireSageLastZoneValidation = report;
  window.__spireSageValidationReports =
    window.__spireSageValidationReports ?? [];
  window.__spireSageValidationReports.push(report);
  console.log('[SageValidation] zone-ready', JSON.stringify(report));
  window.dispatchEvent(
    new CustomEvent('spire-sage-zone-validation-ready', { detail: report })
  );
};

export const ZoneProvider = ({ children }) => {
  const { selectedZone, Spire, gameController } = useMainContext();
  const [spawns, setSpawns] = useState([]);
  const [doors, setDoors] = useState([]);
  const refreshRunRef = useRef(0);

  const loadCallback = useCallback(
    async (
      { type, spawn } = {
        type : 'refresh',
        spawn: null,
      }
    ) => {
      if (type === 'create') {
        if (!spawn) {
          return;
        }
        await gameController.SpawnController.addSpawns([spawn], true);
        setSpawns(s => [...s, spawn]);
      } else if (type === 'updateSpawn') {
        setSpawns(spawns => spawns.map(s => s.id === spawn.id ? spawn : s));
        gameController.SpawnController.updateSpawn(spawn);
      } else if (type === 'deleteSpawn') {
        setSpawns(spawns => spawns.filter(s => s.id !== spawn.id));
        gameController.SpawnController.deleteSpawn(spawn);
      } else if (type === 'refresh') {
        const refreshRun = ++refreshRunRef.current;
        const zoneShortName = selectedZone.short_name;
        const zoneController = gameController.ZoneController;
        if (
          zoneController.zoneName &&
          zoneController.zoneName !== zoneShortName
        ) {
          return;
        }
        const zoneVersion = normalizeZoneVersion(selectedZone);
        const zoneId = Number(selectedZone.zoneidnumber ?? selectedZone.id ?? 0);
        const [spawnResult, gridResult, doorResult] = await Promise.allSettled([
          Spire.Spawn.getByZone(selectedZone.short_name, zoneVersion),
          zoneId
            ? Spire.Grid
              ? Spire.Grid.getById(zoneId)
              : fetch(
                `${Spire.SpireApi.getBaseV1Path()}/grid_entries?where=zoneid__${zoneId
                }&orderBy=gridid.number&limit=100000`
              ).then((a) => a.json())
            : Promise.resolve([]),
          loadDoorsForZone({
            Spire,
            selectedZone: {
              ...selectedZone,
              version: zoneVersion,
            },
            gameController,
          }),
        ]);

        if (spawnResult.status === 'rejected') {
          console.warn('Error loading zone spawns', spawnResult.reason);
        }
        if (gridResult.status === 'rejected') {
          console.warn('Error loading zone grid entries', gridResult.reason);
        }
        if (doorResult.status === 'rejected') {
          console.warn('Error loading zone doors', doorResult.reason);
        }

        const spawnPoints =
          spawnResult.status === 'fulfilled' && Array.isArray(spawnResult.value)
            ? spawnResult.value
            : [];
        const gridPoints =
          gridResult.status === 'fulfilled' && Array.isArray(gridResult.value)
            ? gridResult.value
            : [];
        const doorPoints =
          doorResult.status === 'fulfilled' && Array.isArray(doorResult.value?.doors)
            ? doorResult.value.doors
            : [];
        const doorLoad =
          doorResult.status === 'fulfilled'
            ? {
              invisibleDoors : doorResult.value?.invisibleDoors ?? [],
              loadedMeshes   : doorResult.value?.loadedMeshes ?? 0,
              missingModels  : doorResult.value?.missingModels ?? [],
              renderableDoors: doorResult.value?.renderableDoors ?? [],
            }
            : {
              invisibleDoors : [],
              loadedMeshes   : 0,
              missingModels  : [],
              renderableDoors: [],
            };
        if (
          refreshRun !== refreshRunRef.current ||
          zoneController.zoneName !== zoneShortName
        ) {
          return;
        }

        const gridEntriesByGridId = new Map();
        for (const path of gridPoints) {
          if (!path.gridid) {
            continue;
          }
          if (!gridEntriesByGridId.has(path.gridid)) {
            gridEntriesByGridId.set(path.gridid, []);
          }
          gridEntriesByGridId.get(path.gridid).push(path);
        }

        for (const spawn of spawnPoints) {
          const grid = gridEntriesByGridId.get(spawn.pathgrid);
          if (grid?.length) {
            spawn.grid = grid;
          }
        }
        setSpawns(spawnPoints);
        setDoors(doorPoints);
        await gameController.SpawnController.addSpawns(spawnPoints);
        if (
          refreshRun !== refreshRunRef.current ||
          zoneController.zoneName !== zoneShortName
        ) {
          return;
        }
        await emitZoneValidation({
          selectedZone,
          spawnPoints,
          gridPoints,
          doorPoints,
          doorLoad,
          gameController,
        });
      }
    },
    [gameController, selectedZone, Spire]
  );

  useEffect(() => {
    if (
      !Spire ||
      !selectedZone ||
      !gameController
    ) {
      return;
    }
    const zoneController = gameController.ZoneController;
    const skipImmediate =
      zoneController.zoneLoaded &&
      zoneController.zoneName &&
      zoneController.zoneName !== selectedZone.short_name;
    zoneController.addLoadCallback(loadCallback, { skipImmediate });
    return () => {
      zoneController.removeLoadCallback(loadCallback);
    };
  }, [gameController, loadCallback, selectedZone, Spire]);

  return (
    <ZoneContext.Provider
      value={{
        spawns,
        setSpawns,
        doors,
        setDoors,
        loadCallback,
      }}
    >
      {children}
    </ZoneContext.Provider>
  );
};
