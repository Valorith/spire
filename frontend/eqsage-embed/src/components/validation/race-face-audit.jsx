import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { writeEQFile } from 'sage-core/util/fileHandler';
import { getCharacterHeadOrientationPolicy } from 'sage-core/util/character-texture-orientation';
import raceData from '../../viewer/common/raceData.json';
import raceModelMetadata from '../../viewer/common/raceModelMetadata.json';
import raceAppearancePolicies from '../../viewer/common/raceAppearancePolicies.json';
import {
  PREVIEW_ALIAS_FIRST_MODELS,
  PREVIEW_CLIENT_FALLBACKS,
  PREVIEW_MODEL_ALIASES,
} from '../../viewer/common/raceModelResolution';
import {
  evaluateCharacterAnimationReadiness,
  inspectAnimationSetVitality,
  STATIC_POSE_ONLY_CHARACTER_MODELS,
} from '../../viewer/helpers/animationValidation';
import {
  evaluateAppearanceVariant,
  evaluateFaceVariantDeterminism,
  inspectHeadTextureOrientation,
  isKnownEffectOnlyCharacterModel,
} from '../../viewer/helpers/appearanceValidation';
import { useMainContext } from '../main/context';

const GENDERS = [
  ['0', 'male'],
  ['1', 'female'],
  ['2', 'neutral'],
];
const HEAD_MATERIAL_PATTERN = /^[a-z0-9]{3}he(?:\d{2}|sk)\d{2}$/i;

const isNativePoseOnlyContainer = (container) => [
  ...(container?.rootNodes ?? []),
  ...(container?.rootNodes ?? []).flatMap(
    (root) => root.getDescendants?.(false) ?? []
  ),
].some((node) =>
  node?.metadata?.gltf?.extras?.spireNativePoseOnly === true ||
  node?.metadata?.extras?.spireNativePoseOnly === true ||
  node?.metadata?.spireNativePoseOnly === true
);
const BODY_SKIN_PLACEHOLDER_PATTERN = /^[a-z0-9]{3}[a-z]{2}sk\d{2}$/i;
const CLASSIC_FACE_MODELS = new Set(raceAppearancePolicies.classicFaceModels);
const getSkeletonBoneNames = (container) =>
  Array.from(new Set(
    (container?.skeletons ?? []).flatMap((skeleton) =>
      (skeleton.bones ?? [])
        .map((bone) => `${bone.name ?? ''}`.replace(/^Clone of /, '').trim().toLowerCase())
        .filter(Boolean)
    )
  )).sort();

const getConfig = () => {
  if (typeof window === 'undefined') {
    return { enabled: false, requestedModels: [] };
  }
  const params = new URLSearchParams(window.location.search);
  const previewFace = Number(params.get('sageRaceFacePreviewFace') ?? 7);
  const previewTexture = Number(params.get('sageRaceFacePreviewTexture') ?? 0);
  const previewHelmTexture = Number(
    params.get('sageRaceFacePreviewHelmTexture') ?? 0
  );
  const previewHeight = Number(params.get('sageRaceFacePreviewHeight') ?? 4.5);
  const previewDistance = Number(params.get('sageRaceFacePreviewDistance') ?? 4.5);
  const previewHeading = Number(params.get('sageRaceFacePreviewHeading') ?? 0);
  return {
    enabled: params.has('sageRaceAudit'),
    forceRequestedModelRefresh:
      params.get('sageRaceAuditForceRefresh') !== '0',
    persistToEq: params.get('sageRaceAuditPersist') !== '0',
    waitsForArchiveAudit: params.has('sageRaceArchiveZones'),
    previewClose: params.has('sageRaceFacePreviewClose'),
    previewModel: `${params.get('sageRaceFacePreview') ?? ''}`
      .trim()
      .toLowerCase(),
    previewFace: Number.isFinite(previewFace)
      ? Math.max(0, Math.trunc(previewFace))
      : 7,
    previewTexture: Number.isFinite(previewTexture)
      ? Math.max(0, Math.trunc(previewTexture))
      : 0,
    previewHelmTexture: Number.isFinite(previewHelmTexture)
      ? Math.max(0, Math.trunc(previewHelmTexture))
      : 0,
    previewHeight: Number.isFinite(previewHeight) ? previewHeight : 4.5,
    previewDistance: Number.isFinite(previewDistance)
      ? Math.max(1, previewDistance)
      : 4.5,
    previewHeading: Number.isFinite(previewHeading)
      ? Math.trunc(previewHeading)
      : 0,
    requestedModels: (params.get('sageRaceAuditModels') ?? '')
      .split(',')
      .map((model) => model.trim().toLowerCase())
      .filter(Boolean),
  };
};

const getTexture = (material) =>
  material?.albedoTexture ??
  material?._albedoTexture ??
  material?.diffuseTexture ??
  material?._diffuseTexture ??
  material?.emissiveTexture ??
  material?._emissiveTexture ??
  null;

const getMaterialSlots = (materials = []) => {
  const slots = [];
  const seen = new Set();
  for (const material of materials) {
    const candidates = Array.isArray(material?.subMaterials)
      ? material.subMaterials.filter(Boolean)
      : [material].filter(Boolean);
    for (const candidate of candidates) {
      const key = candidate.uniqueId ?? candidate.name;
      if (key !== undefined && seen.has(key)) {
        continue;
      }
      if (key !== undefined) {
        seen.add(key);
      }
      slots.push(candidate);
    }
  }
  return slots;
};

const getRenderedMeshes = (rootNodes = []) => rootNodes.flatMap((root) => [
  root,
  ...(root?.getChildMeshes?.(false) ?? []),
]).filter(
  (mesh) =>
    typeof mesh?.getTotalVertices === 'function' &&
  mesh.getTotalVertices() > 0
);

const getRenderedMaterialSlots = (meshes = []) => {
  const materials = [];
  for (const mesh of meshes) {
    const material = mesh?.material;
    if (!material) continue;
    if (!Array.isArray(material.subMaterials)) {
      materials.push(material);
      continue;
    }
    const usedIndices = new Set(
      (mesh.subMeshes ?? [])
        .map((subMesh) => Number(subMesh?.materialIndex))
        .filter((index) => Number.isInteger(index) && index >= 0)
    );
    const candidates = usedIndices.size > 0
      ? [...usedIndices].map((index) => material.subMaterials[index])
      : material.subMaterials;
    materials.push(...candidates.filter(Boolean));
  }
  return getMaterialSlots(materials);
};

const isEffectOnlyMaterial = (material) =>
  material?.metadata?.boundary === true ||
  material?.metadata?.gltf?.extras?.boundary === true ||
  material?.metadata?.extras?.boundary === true;

const getBounds = (meshes = []) => {
  const minimum = { x: Infinity, y: Infinity, z: Infinity };
  const maximum = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const mesh of meshes) {
    try {
      mesh.computeWorldMatrix?.(true);
      mesh.refreshBoundingInfo?.(true, true);
      const box = mesh.getBoundingInfo?.()?.boundingBox;
      if (!box?.minimumWorld || !box?.maximumWorld) {
        continue;
      }
      for (const axis of ['x', 'y', 'z']) {
        minimum[axis] = Math.min(minimum[axis], Number(box.minimumWorld[axis]));
        maximum[axis] = Math.max(maximum[axis], Number(box.maximumWorld[axis]));
      }
    } catch (_error) {}
  }
  if (![minimum.x, minimum.y, minimum.z, maximum.x, maximum.y, maximum.z].every(Number.isFinite)) {
    return null;
  }
  return {
    width: maximum.x - minimum.x,
    height: maximum.y - minimum.y,
    depth: maximum.z - minimum.z,
    minimum,
    maximum,
  };
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

const getTextureDimensions = (texture) => {
  const size = texture?.getSize?.() ?? {};
  const internalTexture = texture?.getInternalTexture?.() ?? texture?._texture;
  const width = Number(size.width ?? internalTexture?.width);
  const height = Number(size.height ?? internalTexture?.height);
  return {
    width: Number.isFinite(width) ? width : null,
    height: Number.isFinite(height) ? height : null,
  };
};

const getHeadTextureSignature = (material) => {
  const texture = getTexture(material);
  const dimensions = getTextureDimensions(texture);
  return [
    `${material?.name ?? ''}`.toLowerCase(),
    `${texture?.name ?? texture?.url ?? ''}`.toLowerCase(),
    dimensions.width ?? 'unknown',
    dimensions.height ?? 'unknown',
    Number(texture?.uScale ?? 1).toFixed(4),
    Number(texture?.vScale ?? 1).toFixed(4),
    Number(texture?.uOffset ?? 0).toFixed(4),
    Number(texture?.vOffset ?? 0).toFixed(4),
  ].join(':');
};

const getTransparentSentinelTextureDiagnostic = (material) => {
  if (
    !material ||
    isEffectOnlyMaterial(material) ||
    material.metadata?.transparentTextureSentinel !== true ||
    material.metadata?.transparentTextureSentinelSuppressed === true
  ) {
    return null;
  }
  const texture = getTexture(material);
  const { width, height } = getTextureDimensions(texture);
  return {
    material: material.name ?? '',
    texture: texture?.name ?? texture?.url ?? '',
    width,
    height,
  };
};

const waitForTextures = async (textures) => {
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      window.gameController?.currentScene?.render?.();
    } catch (_error) {}
    if (textures.every(isTextureReady)) {
      return;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
};

const getHeadOrientationDiagnostic = (material) => {
  const orientationPolicy = getCharacterHeadOrientationPolicy(material?.name);
  return inspectHeadTextureOrientation(material, orientationPolicy);
};

const buildInventory = (requestedModels) => {
  const variantsByModel = new Map();
  for (const race of raceData) {
    for (const [genderKey, gender] of GENDERS) {
      const model = `${race[genderKey] ?? ''}`.trim().toLowerCase();
      if (!model) {
        continue;
      }
      if (!variantsByModel.has(model)) {
        variantsByModel.set(model, []);
      }
      variantsByModel.get(model).push({
        raceId: Number(race.id),
        raceName: race.name,
        gender,
      });
    }
  }

  const requested = new Set(requestedModels);
  return Array.from(variantsByModel.entries())
    .filter(([model]) => requested.size === 0 || requested.has(model))
    .map(([model, variants]) => ({
      model,
      variants,
      sourceFiles: raceModelMetadata[model]?.sourceFiles ?? [],
      appearance: raceModelMetadata[model] ?? {},
    }))
    .sort((a, b) => a.model.localeCompare(b.model));
};

const getRaceFallbackModels = (entry) => {
  const fallbackModels = [];
  for (const variant of entry.variants ?? []) {
    const race = raceData.find(
      (candidate) => Number(candidate.id) === variant.raceId
    );
    const matchingRaces = race
      ? [
        race,
        ...raceData.filter(
          (candidate) =>
            Number(candidate.id) !== Number(race.id) &&
            `${candidate.name ?? ''}`.trim().toLowerCase() ===
              `${race.name ?? ''}`.trim().toLowerCase()
        ),
      ]
      : [];
    const genderKey = GENDERS.find(
      ([, gender]) => gender === variant.gender
    )?.[0];
    for (const matchingRace of matchingRaces) {
      for (const key of [genderKey, '2', '0', '1']) {
        const model = `${matchingRace?.[key] ?? ''}`.trim().toLowerCase();
        if (model && model !== entry.model && !fallbackModels.includes(model)) {
          fallbackModels.push(model);
        }
      }
    }
  }
  return fallbackModels;
};

const getStatus = (result) => {
  if (!result.modelLoaded) return 'missing-model';
  if (!result.renderPass) return 'render-failed';
  if (result.previewInitializationFailed === true) {
    return 'preview-initialize-failed';
  }
  if (
    result.bodyVariantFallback === true &&
    result.bodyVariantTextureFallbackApplied !== true
  ) return 'body-variant-fallback';
  if (
    result.requestedModelVariation &&
    result.loadedModelVariation !== result.requestedModelVariation &&
    result.bodyVariantTextureFallbackApplied !== true
  ) return 'body-variant-mismatch';
  if (result.fallbackTextureCount > 0) return 'texture-fallback';
  if (result.pendingTextureCount > 0) return 'texture-pending';
  if (result.suspiciousTinyTextureCount > 0) return 'transparent-texture-fallback';
  if (result.untexturedRenderedMaterialCount > 0) return 'untextured-material-region';
  if (result.verticallyFlippedHeadTextureCount > 0) return 'head-texture-flipped';
  if (result.faceVariantFailureCount > 0) return 'face-variant-failed';
  if (result.appearanceVariantFailureCount > 0) return 'appearance-variant-failed';
  if (result.nonFiniteBoneMatrixCount > 0) return 'invalid-bone-matrix';
  // Boundary/effect-only assets intentionally have neither a visible texture
  // nor a playable character animation. Classify them before character-only
  // animation readiness checks so invisible effects cannot be reported as a
  // broken or T-posed NPC model.
  if (
    result.materialSlotCount > 0 &&
    result.effectOnlyMaterialCount === result.materialSlotCount
  ) {
    return isKnownEffectOnlyCharacterModel(result.resolvedModel ?? result.model)
      ? 'pass-effect-only'
      : 'unexpected-effect-only-model';
  }
  if (result.animationReadiness?.pass === false) {
    return result.animationReadiness.violations[0] ?? 'animation-not-ready';
  }
  if (result.meshCount === 0) return 'missing-geometry';
  if (result.texturedSlotCount === 0) {
    return 'untextured-model';
  }
  if (
    result.classicFaceExpected &&
    result.headTextureCount > 0 &&
    result.nonHeadTexturedSlotCount === 0
  ) {
    return 'head-only-model';
  }
  if (result.classicFaceExpected && result.faceVariantDeterminism?.pass !== true) {
    return 'face-variant-nondeterministic';
  }
  if (result.classicFaceExpected && !result.faceVariantChanged) {
    return 'face-variant-missing';
  }
  if (result.classicFaceExpected && result.bodySkinPlaceholderCount === 0) {
    return 'body-skin-missing';
  }
  if (result.resolutionKind === 'client-fallback') {
    return 'pass-client-fallback';
  }
  if (result.resolvedModel && result.resolvedModel !== result.model) {
    return 'pass-race-fallback';
  }
  return result.headTextureCount > 0 ? 'pass-discrete-head' : 'pass-embedded-face';
};

export const RaceFaceAudit = () => {
  const { gameController, rootFileSystemHandle, selectedZone } = useMainContext();
  const config = useMemo(getConfig, []);
  const inventory = useMemo(
    () => buildInventory(config.requestedModels),
    [config.requestedModels]
  );
  const startedRef = useRef(false);
  const previewRef = useRef(null);
  const [completed, setCompleted] = useState(0);
  const [status, setStatus] = useState('Waiting for a rendered zone');
  const [failureCount, setFailureCount] = useState(0);

  useEffect(() => {
    if (!config.enabled || startedRef.current || !gameController) {
      return;
    }

    const run = async () => {
      if (
        startedRef.current ||
        !gameController.currentScene?.activeCamera ||
        (config.waitsForArchiveAudit && !window.__spireSageRaceArchiveAudit?.complete)
      ) {
        return;
      }
      startedRef.current = true;
      const results = [];
      const auditRootFileSystemHandle =
        rootFileSystemHandle ??
        gameController.rootFileSystemHandle ??
        window.__spireSageRootFileSystemHandle ??
        null;
      const [{ processCharacterModelArchive }, { BabylonSpawn }] = await Promise.all([
        import('../zone/processZone'),
        import('../../viewer/models/BabylonSpawn'),
      ]);
      const auditScene = gameController.currentScene;
      const auditZoneSpawnsNode = gameController.SpawnController.zoneSpawnsNode;
      const zoneSpawnsWereEnabled = auditZoneSpawnsNode?.isEnabled?.() !== false;
      const animationsWereEnabled = auditScene?.animationsEnabled !== false;
      auditZoneSpawnsNode?.setEnabled(false);
      if (auditScene) {
        auditScene.animationsEnabled = false;
      }

      const persist = async (complete = false) => {
        const failures = results.filter((result) => !result.status.startsWith('pass-'));
        const payload = {
          complete,
          inventoryModelCount: inventory.length,
          auditedModelCount: results.length,
          raceVariantCount: inventory.reduce(
            (sum, entry) => sum + entry.variants.length,
            0
          ),
          failureCount: failures.length,
          failures,
          results,
          zone: selectedZone?.short_name ?? null,
          hasRootFileSystemHandle: !!auditRootFileSystemHandle,
          timestamp: new Date().toISOString(),
        };
        window.__spireSageRaceFaceAudit = payload;
        if (config.persistToEq) {
          await writeEQFile(
            'data',
            'spire-race-face-audit.json',
            JSON.stringify(payload, null, 2)
          );
        }
        setFailureCount(failures.length);
      };

      // Reuse the same cache-policy and stale-artifact checks as live spawn
      // loading. Direct GLB imports can make a structurally stale model look
      // healthy in QA even though the product would refresh it before use.
      const loadValidatedCharacterContainer = async (modelName) => {
        const cachedContainer = await gameController.SpawnController.getFirstAssetContainer(
          'models',
          [`${modelName}.glb`],
          modelName,
          { optional: true }
        );
        if (!cachedContainer) {
          return null;
        }
        // Structural inspection mutates and ultimately disposes its container.
        // Never hand it the SpawnController's shared live cache entry.
        return gameController.SpawnController.loadAssetContainerFromEQ(
          'models',
          `${modelName}.glb`
        );
      };

      const inspectAppearance = async (
        container,
        entry,
        {
          face = 0,
          texture = 0,
          helmtexture = 0,
          modelName = entry.model,
          appearanceInstance: reusableAppearanceInstance = null,
        } = {}
      ) => {
        let appearanceInstance = reusableAppearanceInstance;
        const ownsAppearanceInstance = !appearanceInstance;
        try {
          if (!appearanceInstance) {
            appearanceInstance = container.instantiateModelsToScene(
              (name) => `race-audit-${modelName}-${face}-${texture}-${helmtexture}-${name}`
            );
          }
          const spawnEntry = {
            id: -(results.length + 1),
            name: `Race_Audit_${entry.model}`,
            race: entry.variants[0]?.raceId ?? 0,
            gender: GENDERS.findIndex(([, gender]) => gender === entry.variants[0]?.gender),
            face,
            texture,
            helmtexture,
            size: 6,
            x: 0,
            y: 0,
            z: 0,
            heading: 0,
            grid: [],
          };
          const appearance = new BabylonSpawn(
            spawnEntry,
            modelName,
            gameController.SpawnController.zoneSpawnsNode,
            gameController.SpawnController.sphereMat
          );
          for (const root of appearanceInstance.rootNodes ?? []) {
            await appearance.applyTextureSwaps(root);
          }
          gameController.currentScene.render();
          const renderedMeshes = getRenderedMeshes(appearanceInstance.rootNodes);
          const slots = getRenderedMaterialSlots(renderedMeshes);
          const texturedSlots = slots.filter((material) => getTexture(material));
          const untexturedRenderedSlots = slots.filter(
            (material) => !getTexture(material) && !isEffectOnlyMaterial(material)
          );
          const textures = texturedSlots.map(getTexture);
          await waitForTextures(textures);
          const headSlots = texturedSlots.filter((material) =>
            HEAD_MATERIAL_PATTERN.test(`${material.name ?? ''}`)
          );
          const headOrientationDiagnostics = headSlots.map(
            getHeadOrientationDiagnostic
          );
          const suspiciousTinyTextureDiagnostics = texturedSlots
            .map(getTransparentSentinelTextureDiagnostic)
            .filter(Boolean);
          const suppressedTransparentSentinelSlots = slots.filter(
            (material) =>
              material?.metadata?.transparentTextureSentinel === true &&
              material?.metadata?.transparentTextureSentinelSuppressed === true
          );
          const skeletons = new Set(
            [
              ...(appearanceInstance.skeletons ?? []),
              ...renderedMeshes.map((mesh) => mesh?.skeleton),
            ].filter(Boolean)
          );
          let nonFiniteBoneMatrixCount = 0;
          for (const skeleton of skeletons) {
            for (const bone of skeleton?.bones ?? []) {
              const values = bone?.getFinalMatrix?.()?.m ?? bone?._finalMatrix?.m;
              if (!values) {
                continue;
              }
              nonFiniteBoneMatrixCount += Array.from(values).filter(
                (value) => !Number.isFinite(value)
              ).length;
            }
          }
          const bodySkinPlaceholderSlots = texturedSlots.filter((material) => {
            const materialName = `${material.name ?? ''}`;
            return (
              !HEAD_MATERIAL_PATTERN.test(materialName) &&
              BODY_SKIN_PLACEHOLDER_PATTERN.test(materialName)
            );
          });
          return {
            renderPass: renderedMeshes.length > 0,
            meshCount: renderedMeshes.length,
            bounds: getBounds(renderedMeshes),
            slots,
            texturedSlots,
            textures,
            headSlots,
            headOrientationDiagnostics,
            suspiciousTinyTextureDiagnostics,
            suppressedTransparentSentinelSlots,
            nonFiniteBoneMatrixCount,
            effectOnlyMaterialCount: slots.filter(isEffectOnlyMaterial).length,
            untexturedRenderedSlots,
            bodySkinPlaceholderSlots,
          };
        } finally {
          if (ownsAppearanceInstance) {
            appearanceInstance?.animationGroups?.forEach((group) => group.dispose?.());
            appearanceInstance?.rootNodes?.forEach((root) => root.dispose?.());
            appearanceInstance?.skeletons?.forEach((skeleton) => skeleton.dispose?.());
          }
        }
      };

      for (let index = 0; index < inventory.length; index++) {
        const entry = inventory[index];
        setStatus(`Auditing ${entry.model.toUpperCase()}`);
        let container = null;
        let resolvedModel = entry.model;
        let resolutionKind = 'exact';
        let result;
        const archiveStages = [];
        try {
          const preferredAlias = PREVIEW_MODEL_ALIASES[entry.model] ??
            PREVIEW_CLIENT_FALLBACKS[entry.model];
          const forceRequestedModelRefresh =
            config.forceRequestedModelRefresh &&
            config.requestedModels.length > 0 &&
            !!auditRootFileSystemHandle;
          if (forceRequestedModelRefresh) {
            try {
              const refreshModel =
                preferredAlias && PREVIEW_ALIAS_FIRST_MODELS.has(entry.model)
                  ? preferredAlias
                  : entry.model;
              const refreshSourceFiles =
                raceModelMetadata[refreshModel]?.sourceFiles ??
                entry.sourceFiles ??
                [];
              const generated = await processCharacterModelArchive(
                refreshModel,
                { ...gameController.settings, forceReload: true },
                auditRootFileSystemHandle,
                (stage, detail) => {
                  const message = detail ? `${stage}: ${detail}` : stage;
                  archiveStages.push(message);
                  setStatus(`${refreshModel.toUpperCase()}: ${message}`);
                },
                refreshSourceFiles,
                { stopAfterFirstSuccessfulSource: true }
              );
              archiveStages.push(
                generated
                  ? `Explicit audit refreshed ${refreshModel} from its source archive`
                  : `Explicit audit could not refresh ${refreshModel} from its source archive`
              );
            } catch (error) {
              const message = error?.message ?? String(error);
              archiveStages.push(
                `Explicit audit refresh failed; validating the existing model: ${message}`
              );
              console.warn('[SageRaceFaceAudit] archive-refresh-failed', {
                model: entry.model,
                error: message,
              });
            }
          }
          if (preferredAlias && PREVIEW_ALIAS_FIRST_MODELS.has(entry.model)) {
            container = await loadValidatedCharacterContainer(preferredAlias);
            if (container) {
              resolvedModel = preferredAlias;
              resolutionKind = PREVIEW_CLIENT_FALLBACKS[entry.model]
                ? 'client-fallback'
                : 'model-alias';
              archiveStages.push(
                `Using preferred character model alias: ${entry.model} -> ${preferredAlias}`
              );
            }
          }
          if (!container) {
            container = await loadValidatedCharacterContainer(entry.model);
          }
          if (!container) {
            const modelAlias = PREVIEW_MODEL_ALIASES[entry.model];
            if (modelAlias) {
              container = await loadValidatedCharacterContainer(modelAlias);
              if (container) {
                resolvedModel = modelAlias;
                resolutionKind = 'model-alias';
                archiveStages.push(
                  `Using character model alias: ${entry.model} -> ${modelAlias}`
                );
              }
            }
          }
          if (!container) {
            const generated = await processCharacterModelArchive(
              entry.model,
              gameController.settings,
              auditRootFileSystemHandle,
              (stage, detail) => {
                const message = detail ? `${stage}: ${detail}` : stage;
                archiveStages.push(message);
                setStatus(`${entry.model.toUpperCase()}: ${message}`);
              },
              entry.sourceFiles,
              { stopAfterFirstSuccessfulSource: true }
            );
            if (generated) {
              container = await gameController.SpawnController.loadAssetContainerFromEQ(
                'models',
                `${entry.model}.glb`
              );
            }
          }
          if (!container) {
            const previewAlias = PREVIEW_CLIENT_FALLBACKS[entry.model];
            if (previewAlias) {
              container = await loadValidatedCharacterContainer(previewAlias);
              if (container) {
                resolvedModel = previewAlias;
                resolutionKind = 'client-fallback';
                archiveStages.push(
                  `Using character model alias: ${entry.model} -> ${previewAlias}`
                );
              }
            }
          }
          if (!container) {
            for (const fallbackModel of getRaceFallbackModels(entry)) {
              container = await loadValidatedCharacterContainer(fallbackModel);
              if (container) {
                resolvedModel = fallbackModel;
                resolutionKind = 'same-race';
                archiveStages.push(
                  `Using same-race model fallback: ${entry.model} -> ${fallbackModel}`
                );
                break;
              }
            }
          }
          if (!container) {
            result = {
              ...entry,
              modelLoaded: false,
              renderPass: false,
              meshCount: 0,
              materialSlotCount: 0,
              texturedSlotCount: 0,
              readyTextureCount: 0,
              pendingTextureCount: 0,
              fallbackTextureCount: 0,
              headTextureCount: 0,
              verticallyFlippedHeadTextureCount: 0,
              archiveStages,
            };
          } else {
            let renderError = '';
            let defaultAppearance = null;
            let faceVariantAppearance = null;
            const appearanceVariants = [];
            let reusableAppearanceInstance = null;
            let previewAnimationDonorEvidence = null;
            // Validate the same resolved container that BabylonSpawn uses at
            // runtime, including explicitly configured compatible animation
            // donors. A skeleton with no playable pose must never pass merely
            // because its geometry and textures loaded.
            await gameController.SpawnController.addPreviewAnimationDonor?.(
              resolvedModel,
              container
            );
            let animationVitality = inspectAnimationSetVitality([]);
            const nativePoseOnly = isNativePoseOnlyContainer(container);
            const staticPoseFallbackAvailable =
              nativePoseOnly ||
              STATIC_POSE_ONLY_CHARACTER_MODELS.has(resolvedModel) ||
              (container.skeletons ?? []).some((skeleton) => {
                const boneNames = new Set(
                  (skeleton.bones ?? []).map((bone) =>
                    `${bone.name}`.replace(/^Clone of /, '').toLowerCase()
                  )
                );
                return boneNames.has('biclavl') && boneNames.has('biclavr');
              });
            let animationReadiness = evaluateCharacterAnimationReadiness({
              skeletonCount: container.skeletons?.length ?? 0,
              animationVitality,
              staticPoseFallbackAvailable,
            });
            try {
              reusableAppearanceInstance =
                gameController.SpawnController.instantiateSpawnModel?.(
                  resolvedModel,
                  container
                ) ?? container.instantiateModelsToScene();
              animationVitality = inspectAnimationSetVitality(
                reusableAppearanceInstance.animationGroups ?? []
              );
              previewAnimationDonorEvidence =
                reusableAppearanceInstance.__spirePreviewAnimationDonor ?? null;
              animationReadiness = evaluateCharacterAnimationReadiness({
                skeletonCount:
                  reusableAppearanceInstance.skeletons?.length ?? 0,
                animationVitality,
                staticPoseFallbackAvailable,
              });
              if (
                previewAnimationDonorEvidence?.expected &&
                !previewAnimationDonorEvidence?.pass
              ) {
                animationReadiness = {
                  ...animationReadiness,
                  pass: false,
                  violations: [
                    ...(animationReadiness.violations ?? []),
                    'preview-animation-donor-not-attached-to-instance',
                  ],
                };
              }
              defaultAppearance = await inspectAppearance(
                container,
                entry,
                {
                  modelName: resolvedModel,
                  appearanceInstance: reusableAppearanceInstance,
                }
              );
              appearanceVariants.push({
                kind: 'default',
                value: 0,
                face: 0,
                texture: 0,
                helmtexture: 0,
                appearance: defaultAppearance,
              });
              const appearanceMetadata =
                raceModelMetadata[resolvedModel] ?? entry.appearance ?? {};
              const requestedVariants = [];
              if (CLASSIC_FACE_MODELS.has(resolvedModel)) {
                for (let face = 1; face <= 7; face++) {
                  requestedVariants.push({ kind: 'face', value: face, face });
                }
              }
              const minTexture = Number(appearanceMetadata.minTexture ?? 0);
              const maxTexture = Number(appearanceMetadata.maxTexture ?? 0);
              for (let texture = minTexture; texture <= maxTexture; texture++) {
                if (texture !== 0) {
                  requestedVariants.push({ kind: 'texture', value: texture, texture });
                }
              }
              const minHelmTexture = Number(
                appearanceMetadata.minHelmTexture ?? 0
              );
              const maxHelmTexture = Number(
                appearanceMetadata.maxHelmTexture ?? 0
              );
              for (
                let helmtexture = minHelmTexture;
                helmtexture <= maxHelmTexture;
                helmtexture++
              ) {
                if (helmtexture !== 0) {
                  requestedVariants.push({
                    kind: 'helmtexture',
                    value: helmtexture,
                    helmtexture,
                  });
                }
              }
              for (const variant of requestedVariants) {
                const appearance = await inspectAppearance(container, entry, {
                  face: variant.face ?? 0,
                  texture: variant.texture ?? 0,
                  helmtexture: variant.helmtexture ?? 0,
                  modelName: resolvedModel,
                  appearanceInstance: reusableAppearanceInstance,
                });
                appearanceVariants.push({
                  ...variant,
                  face: variant.face ?? 0,
                  texture: variant.texture ?? 0,
                  helmtexture: variant.helmtexture ?? 0,
                  appearance,
                });
              }
              faceVariantAppearance = appearanceVariants.find(
                (candidate) =>
                  candidate.kind === 'face' && candidate.value === 7
              )?.appearance ?? null;
            } catch (error) {
              renderError = error?.message ?? String(error);
            } finally {
              reusableAppearanceInstance?.animationGroups?.forEach(
                (group) => group.dispose?.()
              );
              reusableAppearanceInstance?.rootNodes?.forEach(
                (root) => root.dispose?.()
              );
              reusableAppearanceInstance?.skeletons?.forEach(
                (skeleton) => skeleton.dispose?.()
              );
            }
            const slots = defaultAppearance?.slots ?? [];
            const texturedSlots = defaultAppearance?.texturedSlots ?? [];
            const textures = defaultAppearance?.textures ?? [];
            const headSlots = defaultAppearance?.headSlots ?? [];
            const faceVariantHeadMaterials = (
              faceVariantAppearance?.headSlots ?? []
            ).map((material) => material.name).sort();
            const faceVariantHeadTextureSignatures = (
              faceVariantAppearance?.headSlots ?? []
            ).map(getHeadTextureSignature).sort();
            const defaultHeadMaterials = headSlots
              .map((material) => material.name)
              .sort();
            const defaultHeadTextureSignatures = headSlots
              .map(getHeadTextureSignature)
              .sort();
            const classicFaceExpected =
              CLASSIC_FACE_MODELS.has(resolvedModel) &&
              defaultHeadMaterials.some((name) => /hesk\d{2}$/i.test(name));
            const appearanceVariantResults = appearanceVariants.map(
              ({ kind, value, face, texture, helmtexture, appearance }) =>
                evaluateAppearanceVariant({
                kind,
                value,
                face,
                texture,
                helmtexture,
                renderPass: appearance?.renderPass === true,
                materialSlotCount: appearance?.slots?.length ?? 0,
                effectOnlyMaterialCount:
                  appearance?.effectOnlyMaterialCount ?? 0,
                headMaterials: (appearance?.headSlots ?? [])
                  .map((material) => material.name)
                  .sort(),
                headTextureSignatures: (appearance?.headSlots ?? [])
                  .map(getHeadTextureSignature)
                  .sort(),
                texturedSlotCount: appearance?.texturedSlots?.length ?? 0,
                untexturedRenderedMaterialCount:
                  appearance?.untexturedRenderedSlots?.length ?? 0,
                untexturedRenderedMaterials: (
                  appearance?.untexturedRenderedSlots ?? []
                ).map((material) => material.name).filter(Boolean).sort(),
                materials: (appearance?.slots ?? [])
                  .map((material) => material.name)
                  .filter(Boolean)
                  .sort(),
                pendingTextureCount: (appearance?.textures ?? [])
                  .filter((texture) => !isTextureReady(texture)).length,
                suspiciousTinyTextureCount:
                  appearance?.suspiciousTinyTextureDiagnostics?.length ?? 0,
                suspiciousTinyTextures:
                  appearance?.suspiciousTinyTextureDiagnostics ?? [],
                suppressedTransparentSentinelCount:
                  appearance?.suppressedTransparentSentinelSlots?.length ?? 0,
                suppressedTransparentSentinelMaterials: (
                  appearance?.suppressedTransparentSentinelSlots ?? []
                ).map((material) => material.name).filter(Boolean).sort(),
                headOrientationRiskCount:
                  appearance?.headOrientationDiagnostics?.filter(
                    (diagnostic) => diagnostic.risk
                  ).length ?? 0,
                nonFiniteBoneMatrixCount:
                  appearance?.nonFiniteBoneMatrixCount ?? 0,
              }, {
                requireHeadTexture:
                  CLASSIC_FACE_MODELS.has(resolvedModel) &&
                  (kind === 'default' || kind === 'face'),
              })
            );
            const faceVariantResults = CLASSIC_FACE_MODELS.has(resolvedModel)
              ? appearanceVariantResults.filter(
                (appearance) =>
                  appearance.kind === 'default' || appearance.kind === 'face'
              )
              : [];
            const faceVariantDeterminism = CLASSIC_FACE_MODELS.has(resolvedModel)
              ? evaluateFaceVariantDeterminism(faceVariantResults)
              : { pass: true, violations: [] };
            const appearanceVariantFailures = appearanceVariantResults.filter(
              (appearance) => appearance.invariantPass !== true
            );
            const faceVariantFailures = faceVariantResults.filter(
              (appearance) => appearance.invariantPass !== true
            );
            const missingTextures =
              window.__spireSageMissingModelTextures?.[
                `/eq/models/${resolvedModel}.glb`
              ] ??
              window.__spireSageMissingModelTextures?.[
                `/eq/objects/${resolvedModel}.glb`
              ] ??
              [];
            result = {
              ...entry,
              resolvedModel,
              resolutionKind,
              modelLoaded: true,
              renderPass: !renderError && defaultAppearance?.renderPass === true,
              renderError,
              meshCount: defaultAppearance?.meshCount ?? 0,
              bounds: defaultAppearance?.bounds ?? null,
              materialSlotCount: slots.length,
              texturedSlotCount: texturedSlots.length,
              effectOnlyMaterialCount:
                defaultAppearance?.effectOnlyMaterialCount ?? 0,
              nonHeadTexturedSlotCount: texturedSlots.length - headSlots.length,
              readyTextureCount: textures.filter(isTextureReady).length,
              pendingTextureCount: textures.filter((texture) => !isTextureReady(texture)).length,
              suspiciousTinyTextureCount:
                defaultAppearance?.suspiciousTinyTextureDiagnostics?.length ?? 0,
              suspiciousTinyTextures:
                defaultAppearance?.suspiciousTinyTextureDiagnostics ?? [],
              untexturedRenderedMaterialCount:
                defaultAppearance?.untexturedRenderedSlots?.length ?? 0,
              untexturedRenderedMaterials: (
                defaultAppearance?.untexturedRenderedSlots ?? []
              ).map((material) => material.name).filter(Boolean).sort(),
              suppressedTransparentSentinelCount:
                defaultAppearance?.suppressedTransparentSentinelSlots?.length ?? 0,
              suppressedTransparentSentinelMaterials: (
                defaultAppearance?.suppressedTransparentSentinelSlots ?? []
              ).map((material) => material.name).filter(Boolean).sort(),
              fallbackTextureCount: missingTextures.length,
              fallbackTextures: missingTextures.slice(0, 20),
              headTextureCount: headSlots.length,
              headOrientationDiagnostics:
                defaultAppearance?.headOrientationDiagnostics ?? [],
              bodySkinPlaceholderCount:
                defaultAppearance?.bodySkinPlaceholderSlots?.length ?? 0,
              bodySkinPlaceholderMaterials: (
                defaultAppearance?.bodySkinPlaceholderSlots ?? []
              ).map((material) => material.name).slice(0, 40),
              classicFaceExpected,
              faceVariantCountAudited: faceVariantResults.length,
              faceVariantFailureCount: faceVariantFailures.length,
              faceVariantFailures,
              faceVariants: faceVariantResults,
              faceVariantDeterminism,
              appearanceVariantCountAudited: appearanceVariantResults.length,
              appearanceVariantFailureCount: appearanceVariantFailures.length,
              appearanceVariantFailures,
              appearanceVariants: appearanceVariantResults,
              faceVariantChanged:
                !classicFaceExpected ||
                defaultHeadTextureSignatures.join('|') !==
                  faceVariantHeadTextureSignatures.join('|'),
              faceVariantMaterials: faceVariantHeadMaterials.slice(0, 40),
              verticallyFlippedHeadTextureCount:
                defaultAppearance?.headOrientationDiagnostics?.filter(
                  (diagnostic) => diagnostic.risk
                ).length ?? 0,
              nonFiniteBoneMatrixCount:
                defaultAppearance?.nonFiniteBoneMatrixCount ?? 0,
              skeletonCount: container.skeletons?.length ?? 0,
              // A rendered mesh is not enough evidence that a compatible
              // animation source exists. Persist the normalized rig signature
              // so missing-animation failures can be matched to donors by
              // exact target names rather than visual similarity.
              skeletonBoneNames: getSkeletonBoneNames(container),
              animationVitality,
              animationReadiness,
              previewAnimationDonor: previewAnimationDonorEvidence,
              nativePoseOnly,
              staticPoseFallbackAvailable,
              bindPoseOnlyAnimation:
                animationVitality.playableGroupCount > 0 &&
                animationVitality.visuallyPosedGroupCount === 0 &&
                !staticPoseFallbackAvailable,
              headMaterials: defaultHeadMaterials.slice(0, 40),
              archiveStages,
            };
          }
        } catch (error) {
          result = {
            ...entry,
            modelLoaded: false,
            renderPass: false,
            meshCount: 0,
            materialSlotCount: 0,
            texturedSlotCount: 0,
            readyTextureCount: 0,
            pendingTextureCount: 0,
            fallbackTextureCount: 0,
            headTextureCount: 0,
            verticallyFlippedHeadTextureCount: 0,
            archiveStages,
            error: error?.message ?? String(error),
          };
        } finally {
          container?.dispose?.();
        }
        result.status = getStatus(result);
        results.push(result);
        setCompleted(results.length);
        if (results.length % 10 === 0) {
          await persist(false);
        }
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }

      if (auditScene) {
        auditScene.animationsEnabled = animationsWereEnabled;
      }
      if (!config.previewModel) {
        auditZoneSpawnsNode?.setEnabled(zoneSpawnsWereEnabled);
      }

      if (config.previewModel) {
        const previewEntry = inventory.find(
          (entry) => entry.model === config.previewModel
        );
        const previewResult = results.find(
          (result) => result.model === config.previewModel
        );
        const previewVariant = previewEntry?.variants?.[0];
        const resolvedModel = previewResult?.resolvedModel ?? config.previewModel;
        // Keep failed-but-loadable models previewable so the audit can be used
        // to diagnose visual regressions instead of hiding the evidence.
        if (previewEntry && previewResult?.modelLoaded) {
          setStatus(`Framing ${previewVariant?.raceName ?? resolvedModel}`);
          const scene = gameController.currentScene;
          const camera = scene?.activeCamera;
          const zoneSpawnsNode = gameController.SpawnController.zoneSpawnsNode;
          const previewRoot = new TransformNode('race-face-preview-root', scene);
          const previewGroundY = Number(camera?.position?.y ?? 0) - 4;
          const preview = new BabylonSpawn(
            {
              id: -900000,
              name: `${previewVariant?.raceName ?? resolvedModel} Face Preview`,
              race: previewVariant?.raceId ?? 0,
              gender: Math.max(
                0,
                GENDERS.findIndex(([, gender]) => gender === previewVariant?.gender)
              ),
              face: config.previewFace,
              texture: config.previewTexture,
              helmtexture: config.previewHelmTexture,
              size: 6,
              x: Number(camera?.position?.z ?? 0),
              y: Number(camera?.position?.x ?? 0),
              z: previewGroundY,
              heading: config.previewHeading,
              grid: [],
            },
            resolvedModel,
            previewRoot,
            gameController.SpawnController.sphereMat
          );
          let previewInitialized = false;
          let previewInitializationError = '';
          try {
            previewInitialized = !!camera && await preview.initializeSpawn();
          } catch (error) {
            previewInitializationError = error?.message ?? String(error);
          }
          console.log('[SageRaceFacePreview] initialize', JSON.stringify({
            model: resolvedModel,
            initialized: previewInitialized,
            error: previewInitializationError,
            requestedModelVariation: preview.requestedModelVariation ?? null,
            loadedModelVariation: preview.loadedModelVariation ?? null,
            bodyVariantFallback: preview.bodyVariantFallback === true,
            bodyVariantTextureFallbackApplied:
              preview.bodyVariantTextureFallbackApplied === true,
            bodyVariantTextureFallbackAppliedCount:
              preview.bodyVariantTextureFallbackAppliedCount ?? 0,
            bodyVariantTextureFallbackAvailableCount:
              preview.bodyVariantTextureFallbackAvailableCount ?? 0,
            bodyVariantTextureCoverageRequiredCount:
              preview.bodyVariantTextureCoverageRequiredCount ?? 0,
            bodyVariantTextureCoverageAppliedCount:
              preview.bodyVariantTextureCoverageAppliedCount ?? 0,
          }));
          if (previewInitialized) {
            previewResult.requestedModelVariation = preview.requestedModelVariation;
            previewResult.loadedModelVariation = preview.loadedModelVariation;
            previewResult.bodyVariantFallback = preview.bodyVariantFallback;
            previewResult.bodyVariantTextureFallbackApplied =
              preview.bodyVariantTextureFallbackApplied;
            previewResult.bodyVariantTextureFallbackAppliedCount =
              preview.bodyVariantTextureFallbackAppliedCount;
            previewResult.bodyVariantTextureFallbackAvailableCount =
              preview.bodyVariantTextureFallbackAvailableCount;
            previewResult.bodyVariantTextureCoverageRequiredCount =
              preview.bodyVariantTextureCoverageRequiredCount;
            previewResult.bodyVariantTextureCoverageAppliedCount =
              preview.bodyVariantTextureCoverageAppliedCount;
            previewResult.previewInitializationFailed = false;
            previewResult.status = getStatus(previewResult);
            preview.disposeNameplate();
            zoneSpawnsNode?.setEnabled(false);
            previewRef.current = {
              preview,
              previewRoot,
              zoneSpawnsNode,
            };
            await new Promise((resolve) => window.setTimeout(resolve, 1200));
            const previewMeshes = getRenderedMeshes([preview.rootNode]);
            const previewBounds = getBounds(previewMeshes);
            if (previewBounds) {
              const target = new Vector3(
                (previewBounds.minimum.x + previewBounds.maximum.x) / 2,
                (previewBounds.minimum.y + previewBounds.maximum.y) / 2,
                (previewBounds.minimum.z + previewBounds.maximum.z) / 2
              );
              const height = Math.max(1, previewBounds.height);
              let closeBounds = null;
              if (config.previewClose) {
                const headMeshes = previewMeshes.filter((mesh) => {
                  const materialNames = getMaterialSlots([mesh.material]).map(
                    (material) => material?.name
                  );
                  return [mesh.name, ...materialNames].some((name) =>
                    HEAD_MATERIAL_PATTERN.test(`${name ?? ''}`)
                  );
                });
                closeBounds = getBounds(headMeshes);
                if (closeBounds) {
                  target.x = (closeBounds.minimum.x + closeBounds.maximum.x) / 2;
                  target.y = (closeBounds.minimum.y + closeBounds.maximum.y) / 2;
                  target.z = (closeBounds.minimum.z + closeBounds.maximum.z) / 2;
                } else {
                  // Embedded-face models do not expose a discrete head mesh.
                  target.y = previewBounds.minimum.y + height * 0.82;
                }
                // Skinned mesh bounds are evaluated in bind space and can sit
                // below the visibly deformed head. Keep close-up evidence clear
                // of the fixed top navigation chrome for every race family.
                target.y += 1.1;
              }
              const closeSpan = closeBounds
                ? Math.max(
                  1,
                  closeBounds.width,
                  closeBounds.height,
                  closeBounds.depth
                )
                : 1;
              const distance = config.previewClose
                ? Math.max(8, config.previewDistance, closeSpan * 1.8)
                : Math.max(7, height * 1.7, previewBounds.depth * 1.8);
              camera.position.copyFrom(
                new Vector3(
                  target.x - distance,
                  target.y + (config.previewClose ? 0 : height * 0.08),
                  target.z
                )
              );
              camera.setTarget(target);
              const previewLight = new PointLight(
                'race-face-preview-light',
                camera.position.clone(),
                scene
              );
              previewLight.diffuse = new Color3(1, 0.96, 0.88);
              previewLight.intensity = 0.65;
              previewLight.range = Math.max(20, distance * 4);
              previewRef.current.previewLight = previewLight;
              scene.render();
            }
          } else {
            previewResult.previewInitializationFailed = true;
            previewResult.previewInitializationError = previewInitializationError ||
              (!camera ? 'No active camera' : 'BabylonSpawn.initializeSpawn returned false');
            previewResult.status = getStatus(previewResult);
            preview.dispose();
            previewRoot.dispose();
          }
        }
      }

      await persist(true);
      setStatus(
        config.previewModel
          ? `Complete (${results.length} models) · Preview ${config.previewModel.toUpperCase()} face ${config.previewFace} texture ${config.previewTexture} helm ${config.previewHelmTexture}`
          : `Complete (${results.length} models)`
      );
    };

    const onZoneReady = () => void run();
    const onArchiveReady = () => void run();
    window.addEventListener('spire-sage-zone-validation-ready', onZoneReady);
    window.addEventListener('spire-sage-race-archive-audit-complete', onArchiveReady);
    if (gameController.currentScene?.activeCamera) {
      void run();
    }
    return () => {
      window.removeEventListener('spire-sage-zone-validation-ready', onZoneReady);
      window.removeEventListener('spire-sage-race-archive-audit-complete', onArchiveReady);
      previewRef.current?.preview?.dispose?.();
      previewRef.current?.previewLight?.dispose?.();
      previewRef.current?.previewRoot?.dispose?.();
      previewRef.current?.zoneSpawnsNode?.setEnabled?.(true);
      if (gameController.currentScene) {
        gameController.currentScene.animationsEnabled = true;
      }
      previewRef.current = null;
    };
  }, [
    config.enabled,
    config.forceRequestedModelRefresh,
    config.waitsForArchiveAudit,
    gameController,
    inventory,
    config.previewClose,
    config.previewDistance,
    config.previewFace,
    config.previewHeight,
    config.previewModel,
    config.persistToEq,
    rootFileSystemHandle,
    selectedZone,
  ]);

  if (!config.enabled) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 12,
        bottom: 12,
        zIndex: 2600,
        width: 300,
        border: '1px solid rgba(221, 208, 160, 0.7)',
        background: 'rgba(8, 12, 18, 0.92)',
        color: '#e8dcc0',
        padding: 1.25,
        pointerEvents: 'none',
      }}
    >
      <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
        Race Face Audit
      </Typography>
      <Typography sx={{ fontSize: 12 }}>{status}</Typography>
      <Typography sx={{ fontSize: 11 }}>
        {completed}/{inventory.length} models · {failureCount} unresolved
      </Typography>
    </Box>
  );
};
