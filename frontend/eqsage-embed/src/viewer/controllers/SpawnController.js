import BABYLON from '@bjs';
import assimpjs from '../../modules/assimp';
import raceData from '../common/raceData.json';
import { GameControllerChild } from './GameControllerChild';
import { BabylonSpawn } from '../models/BabylonSpawn';
import { GlobalStore } from '../../state';
import { getEQFile, getEQFileExists } from 'sage-core/util/fileHandler';
import {
  GLOBAL_VERSION,
  PREVIEW_CHARACTER_CACHE_VERSION,
  processGlobal,
} from '../../components/zone/processZone';
import { locateStaticAsset } from '../../static-assets';
import { createGltfTransformIo, loadGltfTransformModules } from '../../util/gltf-transform';

const {
  AbstractMesh,
  Color3,
  Vector3,
  DynamicTexture,
  Texture,
  TransformNode,
  Mesh,
  PBRMaterial,
  StandardMaterial,
  PointLight,
  PointerDragBehavior,
  PointerEventTypes,
  SceneLoader,
  VertexBuffer,
  GLTF2Export,
  STLExport,
  MeshBuilder,
} = BABYLON;

const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));

const isUsableWorldY = (value) =>
  Number.isFinite(value) && Math.abs(value) < 1000000;

const POSE_ANIMATION_PATTERN = /^(?:Clone of )?pos$/i;
const POST_LOAD_GROUND_CLEARANCE = 0.03;

const PREVIEW_MODEL_ALIASES = {
  iks: 'ikm',
  ivf: 'huf',
  ivm: 'hum',
  pre: 'launch',
  ship: 'launch',
  ske: 'lskmesh',
  tpn: 'tpnbod',
  wol: 'wolmesh',
  wom: 'wolmesh',
};

/**
 * @typedef {import('@babylonjs/core').AssetContainer} AssetContainer
 */
class SpawnController extends GameControllerChild {
  /**
   * @type {Object.<number, BabylonSpawn>}
   */
  spawns = {};

  loadCallbacks = [];
  clickCallbacks = [];

  /**
   * @type {Object.<string, Promise<AssetContainer>}
   */
  assetContainers = {};

  assetFallbacks = {};
  missingAssets = {};

  /**
   * @type {Mesh}
   */
  baseSphere = null;

  /**
   * @type {Mesh}
   */
  zoneSpawnsNode = null;

  tubePath = [];
  pathPoints = [];
  spawnLoadToken = 0;
  selectedSpawnId = null;
  targetRing = null;
  targetRingMaterial = null;
  postLoadGroundSnapTimers = [];

  addClickCallback = (cb) => {
    this.clickCallbacks.push(cb);
  };
  removeClickCallback = (cb) => {
    this.clickCallbacks = this.clickCallbacks.filter((l) => l !== cb);
  };

  /** @type {import('@babylonjs/core').Octree<AbstractMesh>} */

  constructor() {
    super();
    this.onDragBehavior = this.onDragBehavior.bind(this);
    this.sceneMouseDown = this.sceneMouseDown.bind(this);
    this.renderCallback = this.renderCallback.bind(this);
  }

  pointerObserver = null;

  dispose() {
    this.spawnLoadToken++;
    this.assetContainers = {};
    this.clearPostLoadGroundSnapTimers();
    this.clearSpawnSelection();
    if (this.currentScene) {
      this.currentScene.unregisterBeforeRender(this.renderCallback);
      if (this.pointerObserver) {
        this.currentScene.onPointerObservable.remove(this.pointerObserver);
      }
    }
    this.pointerObserver = null;
    for (const spawn of Object.values(this.spawns)) {
      spawn.dispose();
    }
    this.baseSphere?.dispose();
    this.sphereMat?.dispose();
    this.zoneSpawnsNode?.dispose();
    this.baseSphere = null;
    this.sphereMat = null;
    this.targetRingMaterial?.dispose?.();
    this.targetRingMaterial = null;
    this.spawns = {};
    this.zoneSpawnsNode = null;
  }

  clearPostLoadGroundSnapTimers() {
    for (const timer of this.postLoadGroundSnapTimers) {
      clearTimeout(timer);
    }
    this.postLoadGroundSnapTimers = [];
  }

  normalizeLoadedSpawnsToGround(options = {}) {
    for (const spawn of Object.values(this.spawns)) {
      if (!spawn?.rootNode || spawn.rootNode.isDisposed?.()) {
        continue;
      }
      spawn.normalizeAnimatedGroundPose?.(options);
    }
  }

  normalizeLoadedSpawnsAfterRender(loadToken, options = {}) {
    if (loadToken !== this.spawnLoadToken) {
      return;
    }

    const normalize = () => {
      if (loadToken !== this.spawnLoadToken) {
        return;
      }
      this.normalizeLoadedSpawnsToGround(options);
    };

    if (
      typeof window !== 'undefined' &&
      typeof window.requestAnimationFrame === 'function'
    ) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(normalize);
      });
      return;
    }

    normalize();
  }

  schedulePostLoadGroundSnap(loadToken) {
    this.clearPostLoadGroundSnapTimers();

    const passes = [
      { delay: 0, options: {} },
      {
        delay  : 250,
        options: { clearance: POST_LOAD_GROUND_CLEARANCE, onlyRaise: true },
      },
      {
        delay  : 1000,
        options: { clearance: POST_LOAD_GROUND_CLEARANCE, onlyRaise: true },
      },
      {
        delay  : 2500,
        options: { clearance: POST_LOAD_GROUND_CLEARANCE, onlyRaise: true },
      },
    ];

    this.postLoadGroundSnapTimers = passes.map(({ delay, options }) =>
      setTimeout(() => {
        this.normalizeLoadedSpawnsAfterRender(loadToken, options);
      }, delay)
    );
  }

  clearSpawnSelection({ clearPath = true } = {}) {
    this.selectedSpawnId = null;
    if (this.targetRing) {
      this.ZoneController?.glowLayer?.removeIncludedOnlyMesh?.(this.targetRing);
      this.targetRing.dispose();
      this.targetRing = null;
    }
    if (clearPath) {
      this.showSpawnPath([]);
    }
  }

  getSpawnVisual(spawn) {
    if (!spawn) {
      return null;
    }
    const spawnId =
      spawn.__spireSpawnId ??
      spawn.id ??
      spawn.spawn2_id ??
      spawn.spawn_id;
    return this.spawns[spawnId] ?? null;
  }

  getSpawnSelectionRadius(babylonSpawn) {
    const meshes =
      typeof babylonSpawn?.getVisibleModelMeshes === 'function'
        ? babylonSpawn.getVisibleModelMeshes()
        : [
          babylonSpawn?.rootNode,
          ...(babylonSpawn?.rootNode?.getChildMeshes?.(false) ?? []),
        ].filter(Boolean);
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minZ = Number.POSITIVE_INFINITY;
    let maxZ = Number.NEGATIVE_INFINITY;

    for (const mesh of meshes) {
      try {
        mesh.computeWorldMatrix?.(true);
        mesh.refreshBoundingInfo?.(true, true);
        const box = mesh.getBoundingInfo?.()?.boundingBox;
        const minimum = box?.minimumWorld;
        const maximum = box?.maximumWorld;
        if (
          Number.isFinite(minimum?.x) &&
          Number.isFinite(maximum?.x) &&
          Number.isFinite(minimum?.z) &&
          Number.isFinite(maximum?.z)
        ) {
          minX = Math.min(minX, minimum.x);
          maxX = Math.max(maxX, maximum.x);
          minZ = Math.min(minZ, minimum.z);
          maxZ = Math.max(maxZ, maximum.z);
        }
      } catch (_error) {}
    }

    const width = maxX - minX;
    const depth = maxZ - minZ;
    const measuredRadius = Math.max(width, depth) * 0.6;
    if (!Number.isFinite(measuredRadius) || measuredRadius <= 0) {
      return 4;
    }
    return Math.min(Math.max(measuredRadius, 2.5), 18);
  }

  getSpawnGroundY(babylonSpawn) {
    const groundY =
      typeof babylonSpawn?.getGroundReferenceWorldY === 'function'
        ? babylonSpawn.getGroundReferenceWorldY()
        : null;
    if (isUsableWorldY(groundY)) {
      return groundY;
    }
    const metadataGround = Number(babylonSpawn?.rootNode?.metadata?.spawnGroundY);
    if (isUsableWorldY(metadataGround)) {
      return metadataGround;
    }
    const rootY = Number(babylonSpawn?.rootNode?.position?.y);
    return Number.isFinite(rootY) ? rootY : 0;
  }

  getTargetRingPath(center, radius, y, segments = 72) {
    const path = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (Math.PI * 2 * i) / segments;
      path.push(
        new Vector3(
          center.x + Math.cos(angle) * radius,
          y,
          center.z + Math.sin(angle) * radius
        )
      );
    }
    return path;
  }

  getTargetRingMaterial() {
    const materialDisposed =
      typeof this.targetRingMaterial?.isDisposed === 'function'
        ? this.targetRingMaterial.isDisposed()
        : this.targetRingMaterial?.isDisposed === true;
    if (!this.targetRingMaterial || materialDisposed) {
      this.targetRingMaterial = new StandardMaterial(
        'spawn-target-ring-material',
        this.currentScene
      );
      this.targetRingMaterial.diffuseColor = new Color3(1, 0.82, 0.15);
      this.targetRingMaterial.emissiveColor = new Color3(1, 0.68, 0.05);
    }
    return this.targetRingMaterial;
  }

  showTargetRing(spawn) {
    const babylonSpawn = this.getSpawnVisual(spawn);
    const root = babylonSpawn?.rootNode;
    if (!this.currentScene || !root) {
      return;
    }
    if (this.targetRing) {
      this.ZoneController?.glowLayer?.removeIncludedOnlyMesh?.(this.targetRing);
      this.targetRing.dispose();
      this.targetRing = null;
    }

    const radius = this.getSpawnSelectionRadius(babylonSpawn);
    const groundY = this.getSpawnGroundY(babylonSpawn);
    const path = this.getTargetRingPath(root.position, radius, groundY + 0.08);
    const ring = MeshBuilder.CreateTube(
      'spawn-target-ring',
      {
        path,
        radius         : 0.16,
        sideOrientation: Mesh.DOUBLESIDE,
      },
      this.currentScene
    );
    ring.id = 'spawn-target-ring';
    ring.material = this.getTargetRingMaterial();
    ring.isPickable = false;
    ring.forceRenderingWhenOccluded = true;
    if (AbstractMesh?.OCCLUSION_TYPE_OPTIMISTIC !== undefined) {
      ring.occlusionType = AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC;
    }
    ring.metadata = {
      targetRing: true,
      spawnId   : spawn.__spireSpawnId ?? spawn.id,
    };
    if (this.zoneSpawnsNode) {
      ring.parent = this.zoneSpawnsNode;
    }
    this.ZoneController?.glowLayer?.addIncludedOnlyMesh?.(ring);
    this.targetRing = ring;
  }

  selectSpawn(spawn, { showPath = true } = {}) {
    if (!spawn || spawn.gridIdx !== undefined) {
      return;
    }
    this.selectedSpawnId =
      spawn.__spireSpawnId ??
      spawn.id ??
      spawn.spawn2_id ??
      spawn.spawn_id ??
      null;
    this.showTargetRing(spawn);
    if (showPath) {
      this.showSpawnPath(spawn.pathgrid ? spawn.grid ?? [] : []);
    }
  }

  setupSpawnController() {
    this.sphereMat = new StandardMaterial(
      'zone-spawns-material',
      this.currentScene
    );
    this.pointerObserver = this.currentScene.onPointerObservable.add(
      this.sceneMouseDown
    );
    this.currentScene.unregisterBeforeRender(this.renderCallback);
    this.currentScene.registerBeforeRender(this.renderCallback);
  }

  onDragBehavior() {
    const scene = this.currentScene;
    if (!scene) {
      return;
    }
    const zoneMesh = scene.getMeshByName('zone');
    if (!zoneMesh) {
      return;
    }

    const node = this.planeDragTarget;

    if (!node) {
      return;
    }
    const pickResult = scene.pick(
      scene.pointerX,
      scene.pointerY,
      (m) => m === zoneMesh,
      false,
      this.CameraController.camera,
      (p0, p1, p2, ray) => {
        const p0p1 = p0.subtract(p1);
        const p2p1 = p2.subtract(p1);
        const normal = Vector3.Cross(p0p1, p2p1);
        return Vector3.Dot(ray.direction, normal) > 0;
      }
    );

    // Check if the ray intersects with the specific mesh
    if (pickResult.hit && pickResult.pickedMesh === zoneMesh) {
      const hitPoint = pickResult.pickedPoint;
      node.position.set(hitPoint.x, hitPoint.y + 5, hitPoint.z);
      node.resetPlane();
      this.tubePath[node.metadata.idx] = new Vector3(
        hitPoint.x,
        hitPoint.y + 5,
        hitPoint.z
      );
      this.updateTube();
    }
  }

  npcLight(spawn) {
    let light = this.currentScene?.getLightById('spawn-light');

    if (!light) {
      // Create the light if it doesn't exist
      light = new PointLight(
        'spawn-light',
        new Vector3(0, 0, 0),
        this.currentScene
      );
    }

    // Set light properties
    light.intensity = 500.0;
    light.diffuse = new Color3(1, 0.84, 0); // Gold color
    light.range = 300;
    light.radius = 50;

    if (!spawn) {
      // If there's no spawn, dispose of the light
      if (light) {
        light.dispose();
      }
      return;
    }

    const spawnMesh = this.spawns[spawn.id]?.rootNode;
    if (spawnMesh) {
      // Attach the light to the spawn mesh's position
      light.position = spawnMesh.position;
    } else {
      // If spawnMesh doesn't exist, dispose of the light
      if (light) {
        light.dispose();
      }
    }
  }
  dynamicPlanes = [];

  renderCallback() {
    for (const plane of this.dynamicPlanes) {
      const distance = this.currentScene.activeCamera.position
        .subtract(plane.position)
        .length();

      // Scale factor based on distance (adjust multiplier as needed)
      const scaleFactor = Math.max(distance / 160, 0.5); // Minimum scale factor to avoid too small billboards

      // Apply the scaling
      plane.scaling = new Vector3(scaleFactor, scaleFactor, scaleFactor);
    }
  }

  updateTube() {
    const scene = this.currentScene;
    const tube = scene.getMeshById('spawn-path');

    if (tube) {
      MeshBuilder.CreateTube(
        'tube',
        {
          path    : this.tubePath,
          radius  : 0.5,
          instance: tube,
        },
        scene
      );
    }
  }

  createGridNode(tube, point, tubeMaterial, idx, selectedIdx, updateCallback) {
    const scene = this.currentScene;
    if (!scene) {
      return;
    }
    const name = `box${idx}`;
    // Create box with initial size, will scale later
    const selected = idx === selectedIdx;
    const size = selected ? 4 : 3;
    const box = MeshBuilder.CreateBox(
      name,
      { height: size, width: size, depth: size },
      scene
    );
    box.parent = tube;
    box.position = point;
    box.material = tubeMaterial;
    box.metadata = {
      emissiveColor: selected ? new Color3(1, 0.5, 0) : new Color3(0, 0.5, 1),
      idx,
    };
    this.ZoneController.glowLayer.addIncludedOnlyMesh(box);

    // Create a dynamic texture for the label
    const dynamicTexture = new DynamicTexture(
      `dynamicTexture${idx}`,
      { width: 256, height: 256 },
      scene,
      false
    );
    dynamicTexture.hasAlpha = true;

    // Define the text, font, and colors
    const text = (idx + 1).toString();
    const font = 'bold 150px Arial';
    const textColor = 'white';
    const outlineColor = '#000';

    // Manual outline by drawing black text at slightly offset positions
    const offset = 4;
    dynamicTexture.drawText(
      text,
      50 - offset,
      140 - offset,
      font,
      outlineColor,
      null,
      true
    );
    dynamicTexture.drawText(
      text,
      50 + offset,
      140 - offset,
      font,
      outlineColor,
      null,
      true
    );
    dynamicTexture.drawText(
      text,
      50 - offset,
      140 + offset,
      font,
      outlineColor,
      null,
      true
    );
    dynamicTexture.drawText(
      text,
      50 + offset,
      140 + offset,
      font,
      outlineColor,
      null,
      true
    );

    // Draw the white text on top
    dynamicTexture.drawText(text, 50, 135, font, textColor, null, true);

    // Create a plane for the billboard
    const plane = MeshBuilder.CreatePlane(
      `labelPlane${idx}`,
      { width: 6, height: 6 },
      scene
    );
    plane.material = new StandardMaterial(`labelMat${idx}`, scene);
    plane.material.diffuseTexture = dynamicTexture;
    plane.material.emissiveColor = new Color3(1, 1, 1); // Set emissive color to make it visible in dark scenes
    plane.material.backFaceCulling = false; // Ensure the texture is visible from all angles
    this.ZoneController.glowLayer.addIncludedOnlyMesh(plane);
    plane.metadata = {
      emissiveColor: selected ? new Color3(1, 0.5, 0) : new Color3(0, 0, 0),
      occludedColor: new Color3(1, 1, 1),
      spawn        : {
        gridIdx: idx,
      },
    };
    const db = new PointerDragBehavior();
    plane.onDragStart = () => {
      this.planeDragTarget = box;
    };
    plane.onDragEnd = () => {
      updateCallback(this.pathPoints[idx], box.position);
    };
    db.onDragStartObservable.add(plane.onDragStart);
    db.onDragEndObservable.add(plane.onDragEnd);
    db.onDragObservable.add(this.onDragBehavior);

    db.attach(plane);
    plane.db = db;

    // Position the plane above the box
    plane.position = new Vector3(0, 1 + size, 0);
    plane.parent = box;
    plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
    plane.forceRenderingWhenOccluded = true;
    plane.occlusionType = AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC;
    plane.isPickable = true;
    box.resetPlane = () => {
      plane.position = new Vector3(0, 1 + size, 0);
    };
    this.dynamicPlanes.push(plane);
  }

  showSpawnPath(coords, selectedIdx, updateCallback = () => {}) {
    if (!this.currentScene) {
      return;
    }
    for (const plane of this.dynamicPlanes) {
      plane.db?.detach();
      plane.db?.onDragStartObservable.removeCallback(plane.onDragStart);
      plane.db?.onDragEndObservable.removeCallback(plane.onDragEnd);
      plane.db?.onDragObservable.removeCallback(this.onDragBehavior);
    }
    this.dynamicPlanes = [];

    if (this.currentScene.getMeshById('spawn-path')) {
      this.currentScene.getMeshById('spawn-path').dispose();
    }
    this.pathPoints = [];
    this.tubePath = [];
    if (!coords || coords.length === 0) {
      return;
    }
    const path = coords.map((a) => new Vector3(a.y, a.z, a.x));
    this.pathPoints = coords;
    this.tubePath = path;
    if (path.length <= 1) {
      return;
    }
    const tube = MeshBuilder.CreateTube(
      'tube',
      {
        path,
        radius         : 0.5,
        sideOrientation: Mesh.DOUBLESIDE,
        updatable      : true,
      },
      this.currentScene
    );

    tube.id = 'spawn-path';
    const tubeMaterial = new StandardMaterial(
      'tubeMaterial',
      this.currentScene
    );
    tubeMaterial.emissiveColor = new Color3(0, 0.5, 1); // A bright color for glowing effect
    tube.material = tubeMaterial;
    this.ZoneController.glowLayer.addIncludedOnlyMesh(tube);
    tube.metadata = {
      emissiveColor: new Color3(0, 0.5, 1),
    };

    if (!window.__spireSagePreview) {
      // Place editable grid nodes only in standalone Sage. In Spire preview,
      // path markers can look like duplicate spawn stand-ins.
      for (let i = 0; i < path.length; i++) {
        this.createGridNode(
          tube,
          path[i],
          tubeMaterial,
          i,
          selectedIdx,
          updateCallback
        );
      }
    }
  }

  /**
   * @param {PointerInfo} e
   */
  sceneMouseDown(pointerInfo) {
    switch (pointerInfo.type) {
      case PointerEventTypes.POINTERDOWN:
        const spawn = pointerInfo.pickInfo.pickedMesh?.metadata?.spawn;
        if (
          pointerInfo.pickInfo.hit &&
          spawn &&
          typeof spawn === 'object'
        ) {
          this.selectSpawn(spawn);
          this.clickCallbacks.forEach((c) =>
            c(spawn)
          );
        }

        if (
          pointerInfo.pickInfo.hit &&
          (pointerInfo.pickInfo.pickedMesh?.metadata?.debug ?? null) !== null
        ) {
          console.log(
            'Hit debug mesh. METADATA:',
            pointerInfo.pickInfo.pickedMesh?.metadata
          );
        }
        break;
      default:
        break;
    }
  }

  /**
   *
   * @param {string} modelName
   * @returns {Promise<AssetContainer>}
   */
  async loadAssetContainerFromEQ(folder, file) {
    const fileBuffer = await this.gc.loadEQGltfFile?.(folder, file);
    if (!fileBuffer) {
      return null;
    }
    const rawData = ArrayBuffer.isView(fileBuffer)
      ? fileBuffer
      : new Uint8Array(fileBuffer);
    return SceneLoader.LoadAssetContainerAsync(
      '',
      rawData,
      this.currentScene,
      undefined,
      '.glb'
    );
  }

  getCachedAssetContainer(folder, file) {
    const key = `${folder}/${file}`;
    if (!this.assetContainers[key]) {
      this.assetContainers[key] = this.loadAssetContainerFromEQ(
        folder,
        file
      ).catch((e) => {
        console.warn(`Error loading asset container ${key}`, e);
        return null;
      });
    }
    return this.assetContainers[key];
  }

  async getFirstAssetContainer(folder, files, originalName, options = {}) {
    const { aliasFiles = [], optional = false } = options;
    const requestedFile = `${originalName}.glb`;
    const aliasFileSet = new Set(aliasFiles);
    for (const file of files) {
      const container = await this.getCachedAssetContainer(folder, file);
      if (container) {
        if (file !== requestedFile && !aliasFileSet.has(file)) {
          this.assetFallbacks[originalName] = file;
          console.warn(
            `Using fallback asset ${file} for missing ${originalName}.glb`
          );
        }
        return container;
      }
    }
    if (!optional) {
      this.missingAssets[originalName] = files;
    }
    return null;
  }

  getAssetContainer(modelName, secondary = false, options = {}) {
    const key = `model/${modelName}/${
      secondary ? 'secondary' : options.optional ? 'optional' : 'primary'
    }`;
    if (!this.assetContainers[key]) {
      const allowFallbackModels =
        !window.__spireSagePreview && !window.__spireSageStrictSpawnModels;
      const previewAlias =
        !secondary && window.__spireSagePreview
          ? PREVIEW_MODEL_ALIASES[modelName]
          : null;
      const files = secondary
        ? [`${modelName}.glb`]
        : previewAlias
          ? [`${previewAlias}.glb`]
        : allowFallbackModels
          ? [
            `${modelName}.glb`,
            'hum.glb',
            'all.glb',
            'bea.glb',
            'zom.glb',
          ]
          : [`${modelName}.glb`];
      this.assetContainers[key] = this.getFirstAssetContainer(
        'models',
        files,
        modelName,
        {
          aliasFiles: previewAlias ? [`${previewAlias}.glb`] : [],
          optional  : secondary || !!options.optional,
        }
      );
    }
    return this.assetContainers[key];
  }

  clearAssetContainer() {
    this.assetContainers = {};
    this.assetFallbacks = {};
    this.missingAssets = {};
  }

  getObjectAssetContainer(objectName, path = 'objects') {
    if (!this.assetContainers[objectName]) {
      this.assetContainers[objectName] = SceneLoader.LoadAssetContainerAsync(
        `/eq/${path}/`,
        `${objectName}.glb`,
        this.currentScene,
        undefined,
        '.glb'
      ).catch(() => {});
    }
    return this.assetContainers[objectName];
  }

  secondaryHelm = (name) => {
    return [
      'bam',
      'baf',
      'erm',
      'erf',
      'elf',
      'elm',
      'gnf',
      'gnm',
      'trf',
      'trm',
      'hum',
      'huf',
      'daf',
      'dam',
      'dwf',
      'dwm',
      'haf',
      'ikf',
      'ikm',
      'ham',
      'hif',
      'him',
      'hof',
      'hom',
      'ogm',
      'ogf',
      'orc',
      'gia',
      'yak',
      'kem',
      'kef',
      'tri',
      'tun',
      'ghu',
      'zof',
      'zom',
    ].some((l) => name.startsWith(l));
  };

  skipTextureSwap(modelName) {
    return ['tri', 'tun', 'els', 'rhi', 'ogs', 'aelobject02'].some((l) =>
      modelName.startsWith(l)
    );
  }

  wearsRobe(modelName) {
    return [
      'daf01',
      'dam01',
      'erf01',
      'erm01',
      'gnf01',
      'gnm01',
      'huf01',
      'hum01',
      'ikf01',
      'ikm01',
      'hif01',
      'him01',
    ].includes(modelName);
  }

  async exportSTL() {
    const clone = this.modelExport.rootNode.clone();
    clone.skeleton = this.modelExport.skeleton?.clone();
    const children = clone.getChildMeshes().filter(m => m.name !== 'nameplate').map((c) => {
      c?.clone();
      c?.makeGeometryUnique();
      return c;
    });
    clone.makeGeometryUnique();
    const position = clone.getPositionData(true, true);
    clone.setVerticesData(VertexBuffer.PositionKind, position);
    STLExport.CreateSTL(
      [clone, ...children],
      true,
      `${this.modelExport?.modelName}`,
      undefined,
      undefined,
      false
    );
    clone.dispose();
  }

  async exportFBX(imgCompression) {
    const glb = await this.exportModel(false, false, imgCompression);
    assimpjs({
      locateFile: locateStaticAsset,
      print   : console.log,
      printErr: console.error,
    }).then((ajs) => {
      const fileList = new ajs.FileList();
      fileList.AddFile('model.glb', glb);
      const result = ajs.ConvertFileList(fileList, 'fbx');
      window.rr = result;
      if (result.IsSuccess()) {
        const bin = result.GetFile(0).GetContent();
        const assetBlob = new Blob([bin]);
        const assetUrl = URL.createObjectURL(assetBlob);
        const link = document.createElement('a');
        link.href = assetUrl;
        link.download = `${this.modelExport?.modelName}.fbx`;
        link.click();
      }
    });
  }

  async exportModel(
    withAnimations = true,
    download = true,
    imgCompression = 'png'
  ) {
    GlobalStore.actions.setLoading(true);
    GlobalStore.actions.setLoadingTitle(
      `Exporting model ${this.modelExport?.modelName} with animations ${withAnimations}`
    );
    GlobalStore.actions.setLoadingText('LOADING, PLEASE WAIT...');

    let originalPosition;
    if (!withAnimations) {
      const position = this.modelExport.rootNode.getPositionData(true, true);
      originalPosition = this.modelExport.rootNode.getPositionData(
        false,
        false
      );
      this.modelExport.rootNode.setVerticesData(
        VertexBuffer.PositionKind,
        position
      );
      this.modelExport.rootNode.skeleton = null;
    }

    return GLTF2Export.GLBAsync(
      this.currentScene,
      this.modelExport?.modelName,
      {
        shouldExportNode(node) {
          if (node.name === 'nameplate') {
            return false;
          }
          while (node.parent) {
            node = node.parent;
          }
          return node.id === 'model_export';
        },
        shouldExportAnimation() {
          return withAnimations;
        },
      }
    )
      .then(async (glb) => {
        if (!withAnimations) {
          this.modelExport.rootNode.skeleton = this.modelExport.skeleton;
          this.modelExport.rootNode.setVerticesData(
            VertexBuffer.PositionKind,
            originalPosition
          );
        }

        GlobalStore.actions.setLoadingTitle(
          `Optimizing model ${this.modelExport?.modelName}`
        );
        GlobalStore.actions.setLoadingText('Applying GLB optimizations');
        const blob = Object.values(glb.glTFFiles)[0];
        const arr = new Uint8Array(await blob.arrayBuffer());
        const io = await createGltfTransformIo();
        const { dedup, prune, textureCompress } =
          await loadGltfTransformModules();
        const doc = await io.readBinary(arr);
        await doc.transform(
          dedup(),
          prune(),
          textureCompress({
            targetFormat: imgCompression,
          })
        ).catch(e => {
          console.log('Error optimizing glb', e);
        });
        const bin = await io.writeBinary(doc);
        if (download) {
          const assetBlob = new Blob([bin]);
          const assetUrl = URL.createObjectURL(assetBlob);
          const link = document.createElement('a');
          link.href = assetUrl;
          link.download = `${this.modelExport?.modelName}.glb`;
          link.click();
        }
        return bin;
      })
      .finally(() => {
        GlobalStore.actions.setLoading(false);
      });
  }
  backgroundContainer = null;
  async addBackgroundMesh(blobUrl, { x, y, z }) {
    this.currentScene.getMeshByName('__root__')?.dispose();
    const container = await SceneLoader.LoadAssetContainerAsync(
      '',
      blobUrl,
      this.gc.currentScene,
      undefined,
      '.glb'
    );
    container.addAllToScene();
    const node = this.currentScene.getMeshByName('__root__');

    if (node) {
      node.position.set(x, y, z);
      node.getChildMeshes().forEach((mesh) => {
        if (!mesh.name.includes('MDF')) {
          setTimeout(() => {
            if (mesh.material && mesh.material instanceof BABYLON.PBRMaterial) {
              if (mesh.material.albedoTexture) {
                mesh.material.albedoTexture.uScale = -1;
              }
            }
          }, 1000);
        }
      });
    }
  }

  async addObject(modelName, path) {
    GlobalStore.actions.setLoading(true);
    GlobalStore.actions.setLoadingTitle(`Loading ${modelName}`);
    GlobalStore.actions.setLoadingText('Loading, please wait...');
    this.disposeModel();

    const assetContainer = await this.getObjectAssetContainer(modelName, path);
    if (!assetContainer) {
      GlobalStore.actions.setLoading(false);

      console.warn(`Cannot instantiate ${modelName}`);
      return;
    }
    const instanceContainer = assetContainer.instantiateModelsToScene();
    const animationGroups = instanceContainer.animationGroups;
    animationGroups.forEach((ag) => {
      ag.name = ag.name.replace('Clone of ', '');
    });
    let rootNode = instanceContainer.rootNodes[0];
    if (!rootNode) {
      console.log('No root node for container model', modelName);
      GlobalStore.actions.setLoading(false);
      return;
    }
    rootNode.id = 'model_export';
    rootNode.name = modelName;
    rootNode.position.setAll(0);
    rootNode.scaling.set(1, 1, 1);
    rootNode.rotationQuaternion = null;
    rootNode.rotation.setAll(0);

    const instanceSkeleton = instanceContainer.skeletons[0];
    const skeletonRoot = rootNode.getChildren(undefined, true)[0];
    const merged = Mesh.MergeMeshes(
      rootNode.getChildMeshes(false),
      false,
      true,
      undefined,
      true,
      true
    );

    if (merged) {
      skeletonRoot.parent = merged;
      skeletonRoot.skeleton = instanceSkeleton;
      if (skeletonRoot.skeleton) {
        skeletonRoot.skeleton.name = 'export_model_skeleton';
      }
      rootNode.dispose();
      rootNode = merged;
      rootNode.skeleton = skeletonRoot.skeleton;
      rootNode.id = 'model_export';
      rootNode.name = modelName;
      rootNode.computeWorldMatrix(true);
      rootNode.refreshBoundingInfo();
    }
    rootNode.position.y = 0;
    if (this.modelExport?.modelName !== modelName) {
      this.CameraController.camera.setTarget(rootNode.position.clone());
    }
    if (this.modelExport?.modelName !== modelName) {
      this.doResetCamera = true;
    }

    const hasMorphTargets = rootNode
      .getChildMeshes()
      .some(mesh => mesh.morphTargetManager !== null);

    if (hasMorphTargets) {
      rootNode.visibility = 0;
    }
    this.modelExport = {
      modelName,
      rootNode,
      animationGroups,
      skeleton: skeletonRoot.skeleton,
    };
    GlobalStore.actions.setLoading(false);
    
    return this.modelExport;
  }

  async createItem(item) {
    try {
      const container = await this.getObjectAssetContainer(item, 'items');

      if (!container) {
        console.log('Did not load item model', item);
        return;
      }

      const instanceContainer = container.instantiateModelsToScene();
      instanceContainer.animationGroups?.forEach((ag) =>
        this.currentScene.removeAnimationGroup(ag)
      );
      let rootNode = instanceContainer.rootNodes[0];
      const merged = Mesh.MergeMeshes(
        rootNode.getChildMeshes(false),
        false,
        true,
        undefined,
        true,
        true
      );
      if (merged) {
        rootNode.dispose();
        rootNode = merged;
        rootNode.skeleton = container.skeletons[0];
      }
      return rootNode;
    } catch (e) {
      console.warn(e);
      return null;
    }
  }

  disposeModel() {
    if (this.modelExport) {
      this.modelExport.rootNode.dispose();
      this.modelExport.animationGroups.forEach((a) => a.dispose());
      this.modelExport.skeleton?.dispose?.();
    }
    this.currentScene.meshes.forEach((m) => {
      if (m.id === 'model_export') {
        m.dispose();
      }
    });
    this.currentScene.animationGroups.forEach((ag) => {
      ag.dispose();
    });
    this.currentScene.skeletons.forEach((s) => {
      s.dispose();
    });
  }

  async addExportModel(
    modelName,
    headIdx = 0,
    texture = -1,
    primary = null,
    secondary = null,
    secondaryPoint = false,
    npc = false
  ) {
    const wearsRobe = this.wearsRobe(modelName);
    GlobalStore.actions.setLoading(true);
    GlobalStore.actions.setLoadingTitle(`Loading ${modelName}`);
    GlobalStore.actions.setLoadingText('Loading, please wait...');
    this.modelName = modelName;
    this.disposeModel();

    const assetContainer =
      await window.gameController.SpawnController.getAssetContainer(modelName);
    const instanceContainer = assetContainer?.instantiateModelsToScene();
    if (!instanceContainer) {
      console.log('Did not instantiate models to scene', modelName);
      return;
    }
    const animationGroups = instanceContainer.animationGroups;
    animationGroups.forEach((ag) => {
      ag.name = ag.name.replace('Clone of ', '');
    });
    let rootNode = instanceContainer.rootNodes[0];
    if (!rootNode) {
      console.log('No root node for container model', modelName);
      GlobalStore.actions.setLoading(false);
      return;
    }
    rootNode.refreshBoundingInfo();
    rootNode.id = 'model_export';
    rootNode.name = modelName;
    rootNode.position.setAll(0);
    rootNode.scaling.set(1, 1, 1);
    rootNode.rotationQuaternion = null;
    rootNode.rotation.setAll(0);

    const instanceSkeleton = instanceContainer.skeletons[0];
    const skeletonRoot = rootNode.getChildren(undefined, true)[0];
    const newModel =
      rootNode.getChildTransformNodes()[0]?.metadata?.gltf?.extras?.newModel ??
      false;
    const variation = headIdx.toString().padStart(2, '0') ?? '00';
    const container = await this.getAssetContainer(
      `${rootNode.name.slice(0, 3)}he${variation}`,
      true
    );
    let sec = null;
    if (container) {
      try {
        const secondaryModel = container.instantiateModelsToScene();
        const secondaryRootNode = secondaryModel.rootNodes[0];

        secondaryRootNode.getChildMeshes().forEach((m) => {
          m.parent = rootNode;
        });
        sec = secondaryModel;
      } catch (e) {
        console.warn('Err', e);
      }
    }
    const merged = Mesh.MergeMeshes(
      rootNode.getChildMeshes(false),
      true,
      true,
      undefined,
      true,
      true
    );

    sec?.dispose();

    if (merged) {
      skeletonRoot.parent = merged;
      skeletonRoot.skeleton = instanceSkeleton;
      skeletonRoot.skeleton.name = 'export_model_skeleton';
      rootNode.dispose();
      rootNode = merged;
      rootNode.rotation.y = Math.PI;
      rootNode.skeleton = skeletonRoot.skeleton;
      rootNode.id = 'model_export';
      rootNode.name = modelName;
    }
    // rootNode.position.y = (initialHeight / 2);

    /**
     * @type {MultiMaterial}
     */
    const multiMat = merged.material;
    // if (wearsRobe) {
    //   texture += 10;
    // }
    if (npc && texture !== -1 && !this.skipTextureSwap(modelName)) {
      for (const [idx, mat] of Object.entries(multiMat.subMaterials)) {
        if (!mat?._albedoTexture) {
          continue;
        }

        const isVariationTexture = wearsRobe && texture >= 10;
        let text = isVariationTexture ? texture - 10 : texture;
        if (mat.name.startsWith('clk')) {
          text += 4;
        } else if (wearsRobe) {
          continue;
        }
        const prefix = mat.name.slice(0, mat.name.length - 4);
        const suffix = mat.name.slice(mat.name.length - 4, mat.name.length);
        const textVer = suffix.slice(0, 2);
        const textNum = suffix.slice(2, 4);
        const thisText = text.toString().padStart(2, '0');
        let newFullName = `${prefix}${thisText}${textNum}`;
        const isHead = newFullName.includes(`he${thisText}`);

        if (isHead && newModel) {
          newFullName = `${prefix}sk${textNum}`;
        } else if (isHead && this.secondaryHelm(modelName)) {
          continue;
        }

        if (thisText !== textVer && npc) {
          const exists = await getEQFileExists('textures', `${newFullName}.png`);
          if (!exists) {
            console.log('Texture did not exist, skipping', newFullName);
            continue;
          }
          multiMat.subMaterials[idx]._albedoTexture = new Texture(
            newFullName,
            window.gameController.currentScene,
            mat._albedoTexture.noMipMap,
            mat._albedoTexture.invertY,
            mat._albedoTexture.samplingMode
          );
        }
      }
    }

    rootNode.scaling.z = -1;

    if (primary) {
      const primaryHeld = await this.createItem(primary);
      if (primaryHeld) {
        const transformNode = skeletonRoot
          .getChildTransformNodes()
          .find((a) => a.name.includes('r_point'));
        const primaryBone = skeletonRoot.skeleton.bones.find(
          (b) => b.name === 'r_point'
        );
        if (primaryBone && transformNode) {
          primaryHeld.attachToBone(primaryBone);
          primaryHeld.parent = transformNode;
          primaryHeld.rotationQuaternion = null;
          primaryHeld.rotation.setAll(0);
          primaryHeld.scaling.setAll(1);
          primaryHeld.name = primary;
        } else {
          primaryHeld.dispose();
        }
      }
    }

    if (secondary) {
      const secondaryHeld = await this.createItem(secondary);
      if (secondaryHeld) {
        const secondaryBone = skeletonRoot.skeleton.bones.find(
          (b) => b.name === (secondaryPoint ? 'shield_point' : 'l_point')
        );
        const transformNode = rootNode
          .getChildTransformNodes()
          .find((a) =>
            a.name.includes(secondaryPoint ? 'shield_point' : 'l_point')
          );
        // Some item type check here for shield_point
        if (secondaryBone && transformNode) {
          secondaryHeld.attachToBone(secondaryBone);
          secondaryHeld.parent = transformNode;
          secondaryHeld.rotationQuaternion = null;
          secondaryHeld.rotation.setAll(0);
          secondaryHeld.scaling.setAll(1);
          secondaryHeld.name = secondary;
        } else {
          secondaryHeld.dispose();
        }
      }
    }
    if (this.modelExport?.modelName !== modelName) {
      this.doResetCamera = true;
    }

    this.modelExport = {
      modelName,
      rootNode,
      animationGroups,
      skeleton: skeletonRoot.skeleton,
    };
    GlobalStore.actions.setLoading(false);
    return this.modelExport;
  }

  async addSpawn(modelName, models) {
    let loaded = 0;
    for (const [_idx, spawnEntry] of Object.entries(models)) {
      try {
        const babylonSpawn = new BabylonSpawn(
          spawnEntry,
          modelName,
          this.zoneSpawnsNode,
          this.sphereMat
        );
        if (await babylonSpawn.initializeSpawn()) {
          this.spawns[spawnEntry.__spireSpawnId ?? spawnEntry.id] = babylonSpawn;
          loaded++;
        }
      } catch (error) {
        console.warn(
          `Error loading spawn model ${modelName} spawn ${spawnEntry?.id}: ${
            error?.message ?? error
          }\n${error?.stack ?? ''}`
        );
      }
      await yieldToBrowser();
    }
    return loaded;
  }

  async deleteSpawn(spawn) {
    this.spawns[spawn.id]?.dispose();
  }

  resolveSpawnModel(npcType) {
    if (!npcType) {
      return null;
    }
    const model = raceData.find((r) => r.id === npcType.race);
    const gender =
      npcType.gender !== undefined &&
      npcType.gender !== null &&
      npcType.gender !== ''
        ? `${Number(npcType.gender)}`
        : null;
    const realModel = [
      gender ? model?.[gender] : null,
      model?.['2'],
      model?.['0'],
      model?.['1'],
    ].find(Boolean);
    if (realModel) {
      return realModel.toLowerCase();
    }
    return window.__spireSagePreview ? null : 'hum';
  }

  async updateSpawn(spawn) {
    const firstSpawn = spawn.spawnentries?.[0]?.npc_type;
    const newSpawn = {
      ...firstSpawn,
      ...spawn,
    };
    this.spawns[spawn.id]?.dispose();
    const realModel = this.resolveSpawnModel(firstSpawn);
    if (!realModel) {
      console.warn('Cannot update spawn without a resolved NPC model', spawn);
      return;
    }
    this.addSpawn(realModel, [newSpawn]);
  }

  getMaterialTexture(material) {
    return material?.albedoTexture ??
      material?._albedoTexture ??
      material?.diffuseTexture ??
      material?._diffuseTexture ??
      material?.emissiveTexture ??
      material?._emissiveTexture ??
      null;
  }

  getMaterialSlots(material) {
    if (!material) {
      return [];
    }
    if (Array.isArray(material.subMaterials)) {
      return material.subMaterials.filter(Boolean);
    }
    return [material];
  }

  isTextureReady(texture) {
    if (!texture) {
      return false;
    }
    if (typeof texture.isReady === 'function') {
      return texture.isReady();
    }
    if (typeof texture.isReady === 'boolean') {
      return texture.isReady;
    }
    if (texture._texture && typeof texture._texture.isReady === 'boolean') {
      return texture._texture.isReady;
    }
    return true;
  }

  isAnimationGroupPlaying(animationGroup) {
    return animationGroup?.isPlaying === true ||
      animationGroup?._isStarted === true ||
      animationGroup?._animatables?.some((animatable) => !animatable.paused) === true;
  }

  isPoseAnimationGroup(animationGroup) {
    return POSE_ANIMATION_PATTERN.test(`${animationGroup?.name ?? ''}`);
  }

  collectSpawnVisualStats() {
    const stats = {
      spawnCount: Object.keys(this.spawns).length,
      materialSlotCount: 0,
      texturedSlotCount: 0,
      readyTextureCount: 0,
      pendingTextureCount: 0,
      fallbackTextureCount: 0,
      tinyTextureCount: 0,
      onePixelTextureCount: 0,
      belowGroundSpawnCount: 0,
      aboveGroundSpawnCount: 0,
      texturelessSpawnCount: 0,
      skeletonSpawnCount: 0,
      animatedSkeletonSpawnCount: 0,
      tPoseRiskCount: 0,
      nonPlayingAnimationCount: 0,
      animationGroupCount: 0,
      playingAnimationGroupCount: 0,
      byModel: {},
      texturelessSamples: [],
      pendingTextureSamples: [],
      fallbackTextureSamples: [],
      tinyTextureSamples: [],
      onePixelTextureSamples: [],
      belowGroundSamples: [],
      aboveGroundSamples: [],
      animationRiskSamples: [],
    };

    for (const [spawnId, spawn] of Object.entries(this.spawns)) {
      const root = spawn.rootNode;
      if (!root || root.isDisposed?.()) {
        continue;
      }

      const modelName = spawn.modelName ?? 'unknown';
      if (!stats.byModel[modelName]) {
        stats.byModel[modelName] = {
          spawns: 0,
          materialSlotCount: 0,
          texturedSlotCount: 0,
          readyTextureCount: 0,
          pendingTextureCount: 0,
          fallbackTextureCount: 0,
          tinyTextureCount: 0,
          onePixelTextureCount: 0,
          belowGroundSpawnCount: 0,
          aboveGroundSpawnCount: 0,
          texturelessSpawnCount: 0,
          skeletonSpawnCount: 0,
          animatedSkeletonSpawnCount: 0,
          tPoseRiskCount: 0,
          nonPlayingAnimationCount: 0,
          animationGroupCount: 0,
          playingAnimationGroupCount: 0,
        };
      }
      const modelStats = stats.byModel[modelName];
      modelStats.spawns++;
      const missingModelTextures =
        window.__spireSageMissingModelTextures?.[`/eq/models/${modelName}.glb`] ?? [];
      if (missingModelTextures.length > 0) {
        stats.fallbackTextureCount += missingModelTextures.length;
        modelStats.fallbackTextureCount += missingModelTextures.length;
        if (stats.fallbackTextureSamples.length < 10) {
          stats.fallbackTextureSamples.push({
            spawnId,
            modelName,
            textures: missingModelTextures.slice(0, 12),
          });
        }
      }

      const expectedGroundY = Number(
        root.metadata?.spawnGroundY ?? spawn.spawn?.z ?? spawn.spawnEntry?.z
      );
      if (Number.isFinite(expectedGroundY)) {
        spawn.normalizeToSpawnGround?.(expectedGroundY);
      }

      const meshes = [root, ...(root.getChildMeshes?.(false) ?? [])]
        .filter((mesh) =>
          mesh?.name !== 'nameplate' &&
          mesh?.id !== 'textPlane' &&
          mesh?.metadata?.hiddenBoundary !== true &&
          mesh?.isVisible !== false &&
          mesh?.visibility !== 0 &&
          mesh?.isEnabled?.() !== false &&
          typeof mesh.getTotalVertices === 'function' &&
          mesh.getTotalVertices() > 0
        );
      const materialSlots = [];
      const materialIds = new Set();
      for (const mesh of meshes) {
        for (const material of this.getMaterialSlots(mesh.material)) {
          const materialId = material.uniqueId ?? material.name;
          if (materialId !== undefined && materialIds.has(materialId)) {
            continue;
          }
          if (materialId !== undefined) {
            materialIds.add(materialId);
          }
          materialSlots.push(material);
        }
      }

      let spawnTexturedSlots = 0;
      let spawnPendingTextures = 0;
      stats.materialSlotCount += materialSlots.length;
      modelStats.materialSlotCount += materialSlots.length;
      for (const material of materialSlots) {
        const texture = this.getMaterialTexture(material);
        if (!texture) {
          continue;
        }
        spawnTexturedSlots++;
        stats.texturedSlotCount++;
        modelStats.texturedSlotCount++;
        if (this.isTextureReady(texture)) {
          stats.readyTextureCount++;
          modelStats.readyTextureCount++;
        } else {
          spawnPendingTextures++;
          stats.pendingTextureCount++;
          modelStats.pendingTextureCount++;
          if (stats.pendingTextureSamples.length < 10) {
            stats.pendingTextureSamples.push({
              spawnId,
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
          spawnId,
          modelName,
          material: material.name,
          texture : texture.name ?? texture.url,
          width,
          height,
        };
        if ((width > 0 && width <= 8) || (height > 0 && height <= 8)) {
          stats.tinyTextureCount++;
          modelStats.tinyTextureCount++;
          if (stats.tinyTextureSamples.length < 10) {
            stats.tinyTextureSamples.push(textureSample);
          }
        }
        if ((width > 0 && width <= 1) || (height > 0 && height <= 1)) {
          stats.onePixelTextureCount++;
          modelStats.onePixelTextureCount++;
          if (stats.onePixelTextureSamples.length < 10) {
            stats.onePixelTextureSamples.push(textureSample);
          }
        }
      }
      if (materialSlots.length > 0 && spawnTexturedSlots === 0) {
        stats.texturelessSpawnCount++;
        modelStats.texturelessSpawnCount++;
        if (stats.texturelessSamples.length < 10) {
          stats.texturelessSamples.push({
            spawnId,
            modelName,
            materials: materialSlots.map((material) => material.name),
          });
        }
      }

      const spawnGroundY = Number(
        root.metadata?.spawnGroundY ?? spawn.spawn?.z ?? spawn.spawnEntry?.z
      );
      if (Number.isFinite(spawnGroundY) && meshes.length > 0) {
        let minimumWorldY =
          typeof spawn.getGroundReferenceWorldY === 'function'
            ? spawn.getGroundReferenceWorldY()
            : null;
        if (!isUsableWorldY(minimumWorldY)) {
          minimumWorldY = Number.POSITIVE_INFINITY;
          for (const mesh of meshes) {
            try {
              mesh.computeWorldMatrix?.(true);
              mesh.refreshBoundingInfo?.(true, true);
              const meshMinimumY =
                mesh.getBoundingInfo?.()?.boundingBox?.minimumWorld?.y;
              if (isUsableWorldY(meshMinimumY)) {
                minimumWorldY = Math.min(minimumWorldY, meshMinimumY);
              }
            } catch (_error) {}
          }
        }
        if (!isUsableWorldY(minimumWorldY)) {
          continue;
        }

        const floorPenetration = spawnGroundY - minimumWorldY;
        if (Number.isFinite(floorPenetration) && floorPenetration > 0.25) {
          stats.belowGroundSpawnCount++;
          modelStats.belowGroundSpawnCount++;
          if (stats.belowGroundSamples.length < 10) {
            stats.belowGroundSamples.push({
              spawnId,
              modelName,
              floorPenetration,
              minimumWorldY,
              spawnGroundY,
            });
          }
        }

        const floorGap = minimumWorldY - spawnGroundY;
        if (Number.isFinite(floorGap) && floorGap > 0.25) {
          stats.aboveGroundSpawnCount++;
          modelStats.aboveGroundSpawnCount++;
          if (stats.aboveGroundSamples.length < 10) {
            stats.aboveGroundSamples.push({
              spawnId,
              modelName,
              name: spawn.spawn?.name ?? spawn.spawnEntry?.name,
              minimumWorldY,
              spawnGroundY,
              floorGap,
              groundOffsetY: root.metadata?.groundOffsetY ?? null,
            });
          }
        }
      }

      const hasSkeleton =
        !!root.skeleton || meshes.some((mesh) => !!mesh?.skeleton);
      const animationGroups = spawn.animationGroups ?? [];
      const playableGroups = animationGroups.filter(
        (animationGroup) =>
          !this.isPoseAnimationGroup(animationGroup) &&
          animationGroup?.targetedAnimations?.length > 0
      );
      const playingGroups = playableGroups.filter((animationGroup) =>
        this.isAnimationGroupPlaying(animationGroup)
      );
      stats.animationGroupCount += playableGroups.length;
      modelStats.animationGroupCount += playableGroups.length;
      stats.playingAnimationGroupCount += playingGroups.length;
      modelStats.playingAnimationGroupCount += playingGroups.length;

      if (hasSkeleton) {
        stats.skeletonSpawnCount++;
        modelStats.skeletonSpawnCount++;
        if (playableGroups.length === 0) {
          stats.tPoseRiskCount++;
          modelStats.tPoseRiskCount++;
          if (stats.animationRiskSamples.length < 10) {
            stats.animationRiskSamples.push({
              spawnId,
              modelName,
              reason: 'skeleton-without-animation-groups',
            });
          }
        } else if (playingGroups.length === 0) {
          stats.nonPlayingAnimationCount++;
          modelStats.nonPlayingAnimationCount++;
          if (stats.animationRiskSamples.length < 10) {
            stats.animationRiskSamples.push({
              spawnId,
              modelName,
              reason: 'animation-groups-not-playing',
              animationGroups: playableGroups.map((group) => group.name),
            });
          }
        } else {
          stats.animatedSkeletonSpawnCount++;
          modelStats.animatedSkeletonSpawnCount++;
        }
      }

      if (spawnPendingTextures > 0 && stats.pendingTextureSamples.length < 10) {
        stats.pendingTextureSamples.push({
          spawnId,
          modelName,
          pendingTextures: spawnPendingTextures,
        });
      }
    }

    return stats;
  }

  async addSpawns(spawns, skipDispose = false) {
    if (!this.currentScene) {
      return;
    }
    const loadToken = ++this.spawnLoadToken;

    this.zoneSpawnsNode = this.currentScene?.getNodeById('zone-spawns');
    if (!this.zoneSpawnsNode) {
      this.zoneSpawnsNode = new TransformNode('zone-spawns', this.currentScene);
    }
    this.zoneSpawnsNode.setEnabled(true);
    this.zoneSpawnsNode.id = 'zone-spawns';
    this.clearPostLoadGroundSnapTimers();
    if (!skipDispose) {
      this.clearSpawnSelection();
      this.zoneSpawnsNode.getChildren().forEach((c) => c.dispose());
      this.spawns = {};
      this.assetFallbacks = {};
      this.missingAssets = {};
    }

    if (!this.gc.settings.showSpawns || spawns.length === 0) {
      this.zoneSpawnsNode.setEnabled(!!this.gc.settings.showSpawns);
      if (typeof window !== 'undefined' && window.__spireSagePreview) {
        const stats = {
          requested    : spawns.length,
          sourceCount  : spawns.length,
          modelGroups  : 0,
          loaded       : 0,
          lodProxyCount: 0,
          rootNodeCount: 0,
          sceneChildren: this.zoneSpawnsNode?.getChildren?.().length ?? 0,
          fallbackCount: Object.keys(this.assetFallbacks).length,
          missingAssetCount: Object.keys(this.missingAssets).length,
          skippedNoNpcType: 0,
          unresolvedModelCount: 0,
          unresolvedModelSpawns: [],
        };
        window.__spireSageSpawnStats = stats;
        console.log('[SageSpawns] loaded', JSON.stringify(stats));
      }
      return;
    }

    const spawnList = {};
    const unresolvedModelSpawns = [];
    let skippedNoNpcType = 0;
    let count = 0;
    for (const spawn of spawns) {
      if (
        spawn.id !== 10787 && // Guard Mezzt
        //  spawn.id !== 10811 && // Tubal Weaver
        // spawn.id !== 10783 // && // POD
        spawn.id !== 10847 // connie link
      ) {
        if (import.meta.env.VITE_LOCAL_DEV === 'true') {
          // continue;
        }
      }
      const firstSpawn = spawn.spawnentries?.[0]?.npc_type;
      if (!firstSpawn) {
        skippedNoNpcType++;
        continue;
      }
      const realModel = this.resolveSpawnModel(firstSpawn);
      if (!realModel) {
        unresolvedModelSpawns.push({
          gender: firstSpawn.gender,
          race  : firstSpawn.race,
          spawnId: spawn.id,
        });
        continue;
      }
      if (!spawnList[realModel]) {
        spawnList[realModel] = [];
      }
      const spawnPointId =
        spawn.id ??
        spawn.spawn2_id ??
        spawn.spawn_id ??
        `${firstSpawn.id}_${count}`;
      count++;
      spawnList[realModel].push({
        ...firstSpawn,
        ...spawn,
        id: spawnPointId,
        npcTypeId: firstSpawn.id,
        __spireSpawnId: spawnPointId,
      });
    }

    this.actions.setLoading(true);
    this.actions.setLoadingTitle('Loading Spawns');
    let loadedCount = 0;
    this.actions.setLoadingText(`Loaded ${loadedCount} of ${count} spawns`);

    this.actions.setLoading(true);

    // Preprocess globalload
    this.actions.setLoadingTitle('Loading Global Dependencies');

    const existingMetadata = await getEQFile('data', 'global.json', 'json');

    const previewGlobalCacheReady =
      !window.__spireSagePreview ||
      (
        existingMetadata?.spireCharacterModels === true &&
        existingMetadata?.spireCharacterTextures === true &&
        existingMetadata?.spireCharacterCacheVersion === PREVIEW_CHARACTER_CACHE_VERSION
      );
    if (existingMetadata?.version !== GLOBAL_VERSION || !previewGlobalCacheReady) {
      await processGlobal(
        this.gc.settings,
        this.gc.rootFileSystemHandle,
        false,
        this.gc,
        (stage, detail = '') => {
          this.actions.setLoadingTitle('Loading Global Dependencies');
          this.actions.setLoadingText(detail ? `${stage}: ${detail}` : stage);
        }
      );
    }

    try {
      for (const [modelName, models] of Object.entries(spawnList)) {
        if (loadToken !== this.spawnLoadToken) {
          return;
        }
        this.actions.setLoadingText(
          `Loaded ${loadedCount} of ${count} spawns`
        );
        const loadedForModel = await this.addSpawn(modelName, models);
        if (loadToken !== this.spawnLoadToken) {
          return;
        }
        loadedCount += loadedForModel;
        this.actions.setLoadingText(
          `Loaded ${loadedCount} of ${count} spawns`
        );
        await yieldToBrowser();
      }
    } finally {
      if (typeof window !== 'undefined' && window.__spireSagePreview) {
        const sceneChildren = this.zoneSpawnsNode?.getChildren?.() ?? [];
        const stats = {
          requested: count,
          sourceCount: spawns.length,
          modelGroups: Object.keys(spawnList).length,
          loaded: loadedCount,
          lodProxyCount: sceneChildren.filter(
            (child) => child?.metadata?.onlyOccluded === false
          ).length,
          rootNodeCount: sceneChildren.filter(
            (child) => child?.metadata?.spawnRoot === true
          ).length,
          sceneChildren: sceneChildren.length,
          fallbackCount: Object.keys(this.assetFallbacks).length,
          fallbackModels: { ...this.assetFallbacks },
          missingAssetCount: Object.keys(this.missingAssets).length,
          missingAssets: { ...this.missingAssets },
          skippedNoNpcType,
          unresolvedModelCount: unresolvedModelSpawns.length,
          unresolvedModelSpawns,
        };
        window.__spireSageSpawnStats = stats;
        console.log('[SageSpawns] loaded', JSON.stringify(stats));
      }
      if (loadToken === this.spawnLoadToken && loadedCount > 0) {
        this.schedulePostLoadGroundSnap(loadToken);
      }
      GlobalStore.actions.setLoading(false);
    }
  }

  setSpawnLOD(value) {
    /**
     * @type {[BabylonSpawn]}
     */
    const allSpawns = Object.values(this.spawns);
    for (const spawn of allSpawns) {
      spawn.setLods(value);
    }
  }

  moveSpawn(infSpawn) {
    const spawn = this.spawns[infSpawn.id];
    if (spawn) {
      spawn.rootNode.position.set(infSpawn.y, infSpawn.z, infSpawn.x);
      spawn.normalizeToSpawnGround?.(infSpawn.z);
      if (this.selectedSpawnId === infSpawn.id) {
        this.showTargetRing(infSpawn);
      }
    }
  }
  /**
   *
   * @param {BabylonSpawn} spawn
   */
  enableSpawn(_spawn) {}

  /**
   *
   * @param {BabylonSpawn} spawn
   */
  disableSpawn(_spawn) {}

  updateSpawns(_position) {}
}

export const spawnController = new SpawnController();
