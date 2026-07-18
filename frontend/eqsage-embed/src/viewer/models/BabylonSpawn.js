import BABYLON from '@bjs';
import { Spawn } from './Spawn';
import { eqtoBabylonVector } from '../util/vector';
import { AnimationNames, mapAnimations } from '../helpers/animationUtils';
import {
  evaluateAnimatedBoundsSafety,
  evaluateHeadRotationSafety,
  inspectAnimationGroupVitality,
  inspectAnimationSetVitality,
  isNeutralIdleAnimationName,
  isStaticPoseOnlyCharacterModel,
  retargetDetachedAnimationTargets,
  selectPreferredVisualAnimationGroup,
} from '../helpers/animationValidation';
import { getCharacterBodyModelVariation } from '../common/raceModelResolution';
import raceModelMetadata from '../common/raceModelMetadata.json';
import { evaluateNameplatePlacement } from '../helpers/nameplateValidation';
import { isCharacterAppearanceMaterialName } from '../helpers/appearanceValidation';
import {
  getEQFile,
  getEQFileDirectoryRevision,
  getEQFileExists,
} from 'sage-core/util/fileHandler';
import { getCharacterHeadOrientationPolicy } from 'sage-core/util/character-texture-orientation';

const {
  Color3,
  Vector3,
  Texture,
  Mesh,
  AbstractMesh,
  StandardMaterial,
  PBRMaterial,
  ParticleSystem,
  DynamicTexture,
  Tools,
  MeshBuilder,
  Ray,
  VertexBuffer,
} = BABYLON;

const INVISIBLE_SPAWN_MODELS = new Set(['tpf', 'tpm', 'tpn']);
const textureExistsCache = new Map();
const transparentSentinelTextureCache = new Map();
const modelExistsCache = new Map();
const animationSafetyCache = new Map();
const pendingAppearanceMaterialsByScene = new WeakMap();
const APPEARANCE_TEXTURE_DECODE_ATTEMPTS = 2;
const APPEARANCE_TEXTURE_DECODE_TIMEOUT_MS = 10000;
const DEFAULT_SPAWN_SCALE = 1.5;
const SPAWN_SIZE_SCALE_DIVISOR = 6;
const FOOT_MATERIAL_PATTERN = /ft\d{4}$/i;
const HEAD_MATERIAL_PATTERN = /^[a-z0-9]{3}he(?:\d{2}|sk)\d{2}$/i;
const HEAD_BONE_PATTERN = /^(?:he|ne|fa|head_point|hair_point)/i;
// Validate the actual deforming head bone. `head_point` is an attachment
// helper whose native bind offset is 120 degrees on classic player rigs; it
// does not drive the face and treating it as a head bone creates a deterministic
// false positive for every Human/Elf-sized model.
const PRIMARY_HEAD_BONE_PATTERN = /^(?:hehead|head)$/i;
const CLASSIC_MALE_LEG_SPIKE_MATERIAL_PATTERN = /^(?:bam|erm|hum)lg000[12]$/i;
const BODY_VARIANT_CLOTHING_PREFIX_PATTERN = /(?:ch|fa|ua|lg|ft)$/i;
const POSE_ANIMATION_PATTERN = /^(?:Clone of )?pos$/i;
const NAMEPLATE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
const NAMEPLATE_FONT_SIZE = 44;
const NAMEPLATE_FONT = `700 ${NAMEPLATE_FONT_SIZE}px ${NAMEPLATE_FONT_FAMILY}`;
const NAMEPLATE_LINE_HEIGHT = 56;
const NAMEPLATE_PADDING_X = 26;
const NAMEPLATE_PADDING_Y = 14;
const NAMEPLATE_TEXT_COLOR = '#18d9df';
const NAMEPLATE_OUTLINE_COLOR = '#001517';
const NAMEPLATE_SHADOW_COLOR = 'rgba(0, 0, 0, 0.85)';
const NAMEPLATE_HEAD_CLEARANCE = 0.12;
const NAMEPLATE_MIN_HEIGHT = 0.42;
const NAMEPLATE_LINE_HEIGHT_WORLD = 0.38;
const ZONE_GROUND_SNAP_MAX_DROP = 14;
const ZONE_GROUND_RAY_START_OFFSET = 1.5;
const ZONE_GROUND_RAY_LENGTH = 64;
const ZONE_GROUND_SNAP_DISABLED_MODELS = new Set([
  ...INVISIBLE_SPAWN_MODELS,
  'ael',
  'avi',
  'bac',
  'bat',
  'beh',
  'boat',
  'btn',
  'cdr',
  'dke',
  'drk',
  'eey',
  'ele',
  'eve',
  'eye',
  'faf',
  'fam',
  'fdr',
  'fis',
  'fry',
  'gri',
  'gsp',
  'hip',
  'imp',
  'launch',
  'launchm',
  'nbt',
  'pre',
  'sha',
  'ship',
  'shp',
  'swo',
  'wel',
  'wil',
]);
const ZONE_GROUND_SNAP_PARENT_IDS = new Set(['static-objects', 'doors']);
const SEPARATE_HEAD_MODELS = new Set(['ghu', 'zof', 'zom']);
const DOUBLE_SIDED_SPAWN_MODELS = new Set(['brf', 'frf', 'ghu', 'goj']);
const COMPACT_NATIVE_ARM_NEUTRAL_ROTATIONS = new Map([
  ['qcf', { axis: 'z', amount: 0.65 }],
  ['clm', { axis: 'z', amount: 0.15 }],
  ['com', { axis: 'x', amount: 1 }],
  ['cof', { axis: 'x', amount: 1 }],
  // CLF's bicep nodes use a different local basis from CLM. Rotating around
  // local Z only twists the arms in depth; local X lowers them visibly.
  ['clf', { axis: 'x', amount: 1 }],
]);

const getPendingAppearanceMaterials = (scene) => {
  let pending = pendingAppearanceMaterialsByScene.get(scene);
  if (!pending) {
    pending = new Map();
    pendingAppearanceMaterialsByScene.set(scene, pending);
  }
  return pending;
};

const getAppearanceTextureData = async (fileName, attempts = 3) => {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const textureData = await getEQFile('textures', fileName).catch(() => false);
    if ((textureData?.byteLength ?? 0) > 0) {
      return textureData;
    }
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 40));
    }
  }
  return false;
};

const startAppearanceTextureDecode = ({
  name,
  scene,
  sourceTexture,
  textureData,
  material,
  assignTexture,
}) => {
  let attempt = 0;
  const startAttempt = () => {
    attempt++;
    if (material.isDisposed?.()) {
      material.metadata.spireAppearanceTexturePending = false;
      return null;
    }
    // Blob URLs give Babylon an independently decodable browser image with a
    // real MIME type and a unique cache key. Revoke the URL after Babylon has
    // uploaded the pixels; the GPU texture remains valid.
    const objectUrl = URL.createObjectURL(
      new Blob([textureData], { type: 'image/png' })
    );
    let texture = null;
    let settled = false;
    const finish = (success, error = null) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
      material.metadata.spireAppearanceTextureDecodeAttempts = attempt;
      if (success && texture?.isReady?.()) {
        material.metadata.spireAppearanceTexturePending = false;
        material.metadata.spireAppearanceTextureDecodeFailed = false;
        material.metadata.spireAppearanceTextureDecodeLastError = null;
        return;
      }
      material.metadata.spireAppearanceTextureDecodeLastError =
        error ? `${error}` : 'unknown decode failure';
      texture?.dispose?.();
      if (
        attempt < APPEARANCE_TEXTURE_DECODE_ATTEMPTS &&
        !material.isDisposed?.()
      ) {
        queueMicrotask(() => startAttempt());
        return;
      }
      material.metadata.spireAppearanceTexturePending = false;
      material.metadata.spireAppearanceTextureDecodeFailed = true;
    };
    const timeout = setTimeout(
      () => finish(false, 'decode timeout'),
      APPEARANCE_TEXTURE_DECODE_TIMEOUT_MS
    );
    try {
      texture = new Texture(
        objectUrl,
        scene,
        sourceTexture.noMipMap,
        sourceTexture.invertY,
        sourceTexture.samplingMode,
        () => finish(true),
        (message, exception) =>
          finish(false, exception?.message ?? message ?? 'image decode error')
      );
      if (settled) {
        texture.dispose?.();
        return texture;
      }
      // Preserve the EQ material name for diagnostics.
      texture.name = name;
      assignTexture(material, texture);
      queueMicrotask(() => {
        if (texture?.isReady?.()) {
          finish(true);
        }
      });
    } catch (_error) {
      finish(false, _error?.message ?? 'texture construction error');
    }
    return texture;
  };
  return startAttempt();
};

const SECONDARY_HEAD_MODEL_PREFIXES = [
  'bam',
  'baf',
  'erm',
  'erf',
  'elf',
  'elm',
  'frg',
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
  'qcm',
  'qcf',
  'clm',
  'clf',
];
const shouldAttachSecondaryMesh = (modelName, materialName) =>
  HEAD_MATERIAL_PATTERN.test(materialName) ||
  (modelName === 'ghu' && /^ghulg\d{4}$/i.test(materialName));

const isSecondaryHeadMaterial = (material) =>
  material?.metadata?.secondaryHead === true ||
  material?.metadata?.spireSecondaryHead === true;

const markSecondaryHeadMaterial = (material) => {
  if (!material) {
    return;
  }

  material.metadata = {
    ...material.metadata,
    secondaryHead      : true,
    spireSecondaryHead: true,
  };
  material.subMaterials?.forEach?.(markSecondaryHeadMaterial);
};

const isCharacterHeadMaterial = (material) =>
  material?.metadata?.gltf?.extras?.spireCharacterHead === true ||
  material?.metadata?.extras?.spireCharacterHead === true ||
  material?.metadata?.spireCharacterHead === true ||
  getCharacterHeadOrientationPolicy(material?.name).isCharacterHead;

const isUsableWorldY = (value) =>
  Number.isFinite(value) && Math.abs(value) < 1000000;

const getNextPowerOfTwo = (value) => {
  let size = 1;
  while (size < value) {
    size *= 2;
  }
  return size;
};

const getCachedTextureExists = async (fileName) => {
  const revision = getEQFileDirectoryRevision('textures');
  const cached = textureExistsCache.get(fileName);
  if (cached?.revision === revision) {
    return cached.promise;
  }
  const promise = (async () => {
    if (!(await getEQFileExists('textures', fileName))) {
      return false;
    }
    // A File System Access handle becomes visible when it is created, before
    // its writer necessarily closes. Never classify a zero-byte in-progress
    // texture as ready for Babylon.
    const deadline = performance.now() + 5000;
    do {
      const data = await getEQFile('textures', fileName).catch(() => false);
      if ((data?.byteLength ?? 0) > 0) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    } while (performance.now() < deadline);
    return false;
  })();
  textureExistsCache.set(fileName, { promise, revision });
  const exists = await promise;
  if (!exists && textureExistsCache.get(fileName)?.promise === promise) {
    // Missing character textures can be produced later by an on-demand
    // archive refresh. Negative cache entries must never outlive that event.
    textureExistsCache.delete(fileName);
  }
  return exists;
};

const getCachedTransparentSentinelTexture = async (fileName) => {
  const revision = getEQFileDirectoryRevision('textures');
  const cached = transparentSentinelTextureCache.get(fileName);
  if (cached?.revision === revision) {
    return cached.promise;
  }
  const promise = getEQFile('textures', fileName)
        .then(async (data) => {
          if (!data) {
            return false;
          }
          const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
          if (
            bytes.byteLength < 24 ||
            bytes[0] !== 0x89 ||
            bytes[1] !== 0x50 ||
            bytes[2] !== 0x4e ||
            bytes[3] !== 0x47
          ) {
            return false;
          }
          const view = new DataView(
            bytes.buffer,
            bytes.byteOffset,
            bytes.byteLength
          );
          const width = view.getUint32(16, false);
          const height = view.getUint32(20, false);
          if (width <= 0 || height <= 0) {
            return false;
          }

          // Character archives use fully transparent PNGs as sentinels for
          // exposed skin. Most classic sentinels are 8x8, but later race
          // archives contain the same marker at 32-256px. Dimensions therefore
          // cannot determine intent: several valid EQ textures (teeth, eyes,
          // and effect details) are also 8x8. Decode every candidate and only
          // classify an image whose complete alpha channel is transparent.
          const blob = new Blob([bytes], { type: 'image/png' });
          let bitmap = null;
          let objectUrl = null;
          if (typeof createImageBitmap === 'function') {
            bitmap = await createImageBitmap(blob);
          } else if (
            typeof document !== 'undefined' &&
            typeof URL !== 'undefined' &&
            typeof URL.createObjectURL === 'function'
          ) {
            objectUrl = URL.createObjectURL(blob);
            bitmap = await new Promise((resolve, reject) => {
              const image = document.createElement('img');
              image.onload = () => resolve(image);
              image.onerror = () => reject(new Error(`Unable to decode ${fileName}`));
              image.src = objectUrl;
            });
          } else {
            return false;
          }
          try {
            const canvas = typeof OffscreenCanvas === 'function'
              ? new OffscreenCanvas(bitmap.width, bitmap.height)
              : Object.assign(document.createElement('canvas'), {
                  width: bitmap.width,
                  height: bitmap.height,
                });
            const context = canvas.getContext('2d', { willReadFrequently: true });
            if (!context) {
              return false;
            }
            context.drawImage(bitmap, 0, 0);
            const pixels = context.getImageData(
              0,
              0,
              bitmap.width,
              bitmap.height
            ).data;
            for (let index = 3; index < pixels.length; index += 4) {
              if (pixels[index] !== 0) {
                return false;
              }
            }
            return true;
          } finally {
            bitmap.close?.();
            if (objectUrl) {
              URL.revokeObjectURL(objectUrl);
            }
          }
        })
        .catch(() => false);
  transparentSentinelTextureCache.set(fileName, { promise, revision });
  return promise;
};

const getSkinFallbackTextureName = async (prefix, textNum) => {
  // Some models have no SK texture for a particular UV slot. In those cases
  // the same slot from appearance 00 is the canonical exposed-skin texture.
  // Keep the slot number stable so we never substitute an incompatible UV
  // layout merely because another SK texture happens to exist.
  for (const candidate of [
    `${prefix}sk${textNum}`,
    `${prefix}00${textNum}`,
  ]) {
    const fileName = `${candidate}.png`;
    if (
      await getCachedTextureExists(fileName) &&
      !(await getCachedTransparentSentinelTexture(fileName))
    ) {
      return candidate;
    }
  }
  return null;
};

const getBodyVariantCoverageTextureName = async (
  prefix,
  textNum,
  maximumStandardTexture
) => {
  if (!BODY_VARIANT_CLOTHING_PREFIX_PATTERN.test(prefix)) {
    return null;
  }
  for (let texture = maximumStandardTexture; texture >= 1; texture--) {
    const candidate = `${prefix}${texture.toString().padStart(2, '0')}${textNum}`;
    const fileName = `${candidate}.png`;
    if (
      await getCachedTextureExists(fileName) &&
      !(await getCachedTransparentSentinelTexture(fileName))
    ) {
      return candidate;
    }
  }
  return null;
};

const getCachedModelExists = async (fileName) => {
  if (!modelExistsCache.has(fileName)) {
    modelExistsCache.set(
      fileName,
      getEQFileExists('models', fileName).catch(() => false)
    );
  }
  return modelExistsCache.get(fileName);
};

const isTransparentSentinelMaterial = async (material) => {
  if (!material?.name) {
    return false;
  }
  if (material.metadata?.transparentTextureSentinel === true) {
    return true;
  }
  const isTransparentSentinel = await getCachedTransparentSentinelTexture(
    `${material.name}.png`
  );
  if (isTransparentSentinel) {
    material.metadata = {
      ...(material.metadata ?? {}),
      transparentTextureSentinel: true,
    };
  }
  return isTransparentSentinel;
};

const suppressTransparentSentinelMaterial = (material) => {
  if (!material || material.metadata?.transparentTextureSentinel !== true) {
    return;
  }
  material.metadata = {
    ...(material.metadata ?? {}),
    transparentTextureSentinel: true,
    transparentTextureSentinelSuppressed: true,
  };
  // Some converted GLBs do not preserve the PNG alpha mode, which makes a
  // fully transparent layer render as opaque white. If no compatible skin
  // texture exists, keep the intentional layer invisible at the material
  // level instead of relying on the imported alpha configuration.
  material.alpha = 0;
  material.disableColorWrite = true;
  material.disableDepthWrite = true;
};

/** @typedef {import('@babylonjs/core/Meshes').Mesh} Mesh */

export class BabylonSpawn {
  /** @type {Spawn} */
  spawn = null;

  /** @type {Mesh} */
  rootNode = null;

  /** @type {TransformNode} */
  transform = null;

  modelName = '';

  /** @type {Mesh} */
  nameplateMesh = null;

  nameplateRequired = false;

  nameplateValidationRepresentative = false;

  /** @type {Node} */
  parentNode = null;

  /** @type {import('@babylonjs/core').AnimationGroup[]} */
  animationGroups = [];

  /** @type {import('@babylonjs/core').InstantiatedEntries | null} */
  instanceContainer = null;

  /**
   * @type {Object.<number, import('@babylonjs/core').AnimationGroup>}
   */
  animationMap = {};

  /** @type {Animatable[]} */
  animatables = [];

  hasAttachedSecondaryHead = false;

  loopedAnimation = AnimationNames.Idle;

  animating = false;
  canAnimate = false;
  animatingIndex = AnimationNames.Idle;
  postInitializeTimer = null;
  disposed = false;
  selectedAnimationPromoted = false;
  selectedAnimationPromotionFailed = false;
  selectedAnimationPromotionPromise = null;
  selectedVisualAnimationName = null;
  neutralIdleCandidateNames = [];
  neutralIdleSelectionPass = true;

  /**
   * @param {object} spawnData
   * @param {Node} parentNode
   * @param {Material} sphereMat
   *
   */
  constructor(spawnEntry, modelName, parentNode, sphereMat) {
    this.modelName = modelName;
    this.spawnEntry = spawnEntry;
    this.metadata = {
      spawn        : this.spawnEntry,
      emissiveColor: spawnEntry.grid?.length
        ? new Color3(0, 1, 1)
        : new Color3(1, 1, 1),
    };
    this.spawn = new Spawn(spawnEntry);
    this.parentNode = parentNode;
    this.sphereMat = sphereMat;
  }

  setLods(value) {
    if (!this.rootNode || !this.instance) {
      return;
    }
    this.rootNode.getLODLevels().forEach((lod) => {
      this.rootNode.removeLODLevel(lod.mesh);
    });
    this.rootNode.addLODLevel(value, this.instance);
  }

  secondaryHelm = (name) => {
    return SECONDARY_HEAD_MODEL_PREFIXES.some((l) => name.startsWith(l));
  };

  shouldAttachSecondaryHead(modelName) {
    return this.secondaryHelm(modelName);
  }

  hasIntegratedHeadMeshes() {
    return (this.rootNode?.getChildMeshes?.(false) ?? []).some((mesh) =>
      this.isIntegratedHeadMesh(mesh)
    );
  }

  async getSecondaryHeadContainer(variation) {
    const secondaryModelName = `${this.modelName}he${variation}`;
    const isKnownSecondaryHeadModel = this.shouldAttachSecondaryHead(this.modelName);
    if (!isKnownSecondaryHeadModel) {
      if (this.hasIntegratedHeadMeshes()) {
        return null;
      }
      const secondaryModelExists = await getCachedModelExists(
        `${secondaryModelName}.glb`
      );
      if (!secondaryModelExists) {
        return null;
      }
    }

    return window.gameController.SpawnController.getAssetContainer(
      secondaryModelName,
      true
    );
  }

  skipTextureSwap(modelName) {
    return ['tri', 'tun', 'els', 'rhi', 'ogs', 'aelobject02'].some((l) =>
      modelName.startsWith(l)
    );
  }

  isInvisibleBoundaryMaterial(material) {
    if (!material) {
      return false;
    }

    const materialName = `${material.name ?? ''}`;
    const isBoundaryMaterial =
      /^m000\d+$/i.test(materialName) ||
      material.metadata?.gltf?.extras?.boundary === true ||
      material.metadata?.extras?.boundary === true;

    return isBoundaryMaterial || material.alpha === 0;
  }

  isInvisibleBoundaryMesh(mesh) {
    if (!mesh) {
      return false;
    }

    if (INVISIBLE_SPAWN_MODELS.has(this.modelName)) {
      return true;
    }

    if (this.isInvisibleBoundaryMaterial(mesh.material)) {
      return true;
    }

    return mesh.material?.subMaterials?.some?.((material) =>
      this.isInvisibleBoundaryMaterial(material)
    ) === true;
  }

  hideInvisibleBoundaryMeshes() {
    const meshes = [
      ...(typeof this.rootNode?.getTotalVertices === 'function' ? [this.rootNode] : []),
      ...(this.rootNode?.getChildMeshes?.(false) ?? []),
    ].filter((mesh) => mesh?.name !== 'nameplate' && mesh?.id !== 'textPlane');

    let hiddenCount = 0;
    for (const mesh of meshes) {
      if (!this.isInvisibleBoundaryMesh(mesh)) {
        continue;
      }

      mesh.metadata = {
        ...mesh.metadata,
        spawn: this.metadata?.spawn ?? this.spawnEntry,
        hiddenBoundary: true,
      };
      mesh.isPickable = false;
      mesh.isVisible = false;
      mesh.visibility = 0;
      mesh.setEnabled?.(false);
      hiddenCount++;
    }

    if (hiddenCount > 0) {
      this.metadata.hiddenBoundaryModel = true;
    }

    return hiddenCount;
  }

  getMaterialTexture(material) {
    return material?.albedoTexture ??
      material?._albedoTexture ??
      material?.diffuseTexture ??
      material?._diffuseTexture ??
      null;
  }

  setMaterialTexture(material, texture) {
    if ('albedoTexture' in material) {
      material.albedoTexture = texture;
    } else if ('diffuseTexture' in material) {
      material.diffuseTexture = texture;
    } else {
      material._albedoTexture = texture;
    }
    material.markAsDirty?.(BABYLON.Material?.TextureDirtyFlag ?? 1);
  }

  applyTextureVFlip(texture) {
    if (!texture) {
      return;
    }

    texture.vScale = -Math.abs(texture.vScale || 1);
    texture.vOffset = 1;
  }

  clearTextureVFlip(texture) {
    if (!texture) {
      return;
    }
    texture.vScale = Math.abs(texture.vScale || 1);
    texture.vOffset = 0;
  }

  applyHeadTextureOrientation(rootNode, multiMaterial = null) {
    const bindings = this.getMaterialBindings(rootNode, multiMaterial);
    for (const { material } of bindings) {
      if (!isCharacterHeadMaterial(material)) {
        continue;
      }
      const policy = getCharacterHeadOrientationPolicy(material.name);
      const geometryUvFlipped =
        material.metadata?.gltf?.extras?.spireSkinnedVFlipped === true ||
        material.metadata?.extras?.spireSkinnedVFlipped === true ||
        material.metadata?.spireSkinnedVFlipped === true;
      const desiredEffectiveVFlip =
        policy.geometryUvFlipped !== policy.runtimeTextureVFlipped;
      const needsRuntimeTextureVFlip =
        geometryUvFlipped !== desiredEffectiveVFlip;
      const texture = this.getMaterialTexture(material);
      if (needsRuntimeTextureVFlip) {
        this.applyTextureVFlip(texture);
      } else {
        this.clearTextureVFlip(texture);
      }
      material.markAsDirty?.(BABYLON.Material?.TextureDirtyFlag ?? 1);
    }
  }

  applyMaterialRenderSettings(rootNode, multiMaterial = null) {
    if (!DOUBLE_SIDED_SPAWN_MODELS.has(this.modelName)) {
      return;
    }

    const bindings = this.getMaterialBindings(rootNode, multiMaterial);
    for (const { material } of bindings) {
      if (!material) {
        continue;
      }
      material.backFaceCulling = false;
      if ('twoSidedLighting' in material) {
        material.twoSidedLighting = true;
      }
    }
  }

  getMaterialBindings(rootNode, multiMaterial = null) {
    const bindings = [];
    const addMaterial = (material, assign) => {
      if (!material) {
        return;
      }
      bindings.push({ assign, material });
    };

    if (multiMaterial?.subMaterials) {
      multiMaterial.subMaterials.forEach((material, index) => {
        addMaterial(material, (replacement) => {
          multiMaterial.subMaterials[index] = replacement;
        });
      });
      return bindings;
    }

    const meshes = [
      ...(typeof rootNode?.getTotalVertices === 'function' ? [rootNode] : []),
      ...(rootNode?.getChildMeshes?.(false) ?? []),
    ].filter((mesh) => mesh?.name !== 'nameplate' && mesh?.id !== 'textPlane');

    for (const mesh of meshes) {
      if (mesh.material?.subMaterials) {
        mesh.material.subMaterials.forEach((material, index) => {
          addMaterial(material, (replacement) => {
            mesh.material.subMaterials[index] = replacement;
          });
        });
        continue;
      }
      addMaterial(mesh.material, (replacement) => {
        mesh.material = replacement;
      });
    }

    return bindings;
  }

  async applyTextureSwaps(rootNode, multiMaterial = null) {
    const texture = Number(this.spawnEntry.texture ?? 0);
    this.appearanceTextureDecodeFailureCount = 0;
    this.appearanceTextureDecodeFailures = [];
    this.bodyVariantTextureFallbackApplied = false;
    this.bodyVariantTextureFallbackAppliedCount = 0;
    this.bodyVariantTextureFallbackAvailableCount = 0;
    this.bodyVariantTextureCoverageRequiredCount = 0;
    this.bodyVariantTextureCoverageAppliedCount = 0;
    const canSwapBodyTexture =
      !this.skipTextureSwap(this.modelName);
    const rawFace = Math.trunc(Number(this.spawnEntry.face ?? 0));
    const face = Number.isFinite(rawFace) && rawFace >= 0 && rawFace <= 9
      ? rawFace
      : 0;
    const helmTexture = Math.max(
      0,
      Math.trunc(Number(this.spawnEntry.helmtexture ?? 0))
    );
    const bindings = this.getMaterialBindings(rootNode, multiMaterial);

    for (const { assign, material } of bindings) {
      const sourceTexture = this.getMaterialTexture(material);
      if (!sourceTexture || !material?.name) {
        continue;
      }
      // Mark unresolved sentinels as well as successfully substituted ones so
      // the validation campaign reports a real placeholder instead of merely
      // flagging every legitimate tiny EQ texture.
      const sourceIsTransparentSentinel =
        await isTransparentSentinelMaterial(material);

      const isHead = HEAD_MATERIAL_PATTERN.test(material.name);
      if (!isHead && !isCharacterAppearanceMaterialName(material.name)) {
        // Race ids can resolve to static props (ships, launches, beds, etc.).
        // Their material names do not use the character appearance suffix
        // convention, so preserve the imported texture verbatim.
        if (sourceIsTransparentSentinel) {
          suppressTransparentSentinelMaterial(material);
        }
        continue;
      }
      const prefix = material.name.slice(0, material.name.length - 4);
      const suffix = material.name.slice(material.name.length - 4);
      const textVer = suffix.slice(0, 2);
      const textNum = suffix.slice(2, 4);
      let newFullName = null;
      let bodyVariantTextureCandidate = null;
      let bodyVariantCoverageCandidate = null;
      const recordBodyVariantAssignment = (assignedName) => {
        const normalized = `${assignedName ?? ''}`.toLowerCase();
        if (
          bodyVariantTextureCandidate &&
          normalized === bodyVariantTextureCandidate.toLowerCase()
        ) {
          this.bodyVariantTextureFallbackAppliedCount++;
        }
        if (
          bodyVariantCoverageCandidate &&
          normalized === bodyVariantCoverageCandidate.toLowerCase()
        ) {
          this.bodyVariantTextureCoverageAppliedCount++;
        }
      };

      if (isHead) {
        if (
          this.hasAttachedSecondaryHead &&
          !isSecondaryHeadMaterial(material)
        ) {
          continue;
        }

        const headTextureCandidates = [];
        if (helmTexture > 0) {
          headTextureCandidates.push(
            `${prefix}${helmTexture.toString().padStart(2, '0')}${textNum}`
          );
        } else {
          const faceTextureSuffix = `${face}${textNum.slice(-1)}`;
          headTextureCandidates.push(
            `${prefix}sk${faceTextureSuffix}`,
            `${prefix}sk${textNum}`
          );
          if (face > 0) {
            headTextureCandidates.push(
              `${prefix}${face.toString().padStart(2, '0')}${textNum}`
            );
          }
        }

        for (const candidate of new Set(headTextureCandidates)) {
          if (!(await getCachedTextureExists(`${candidate}.png`))) {
            continue;
          }
          if (await getCachedTransparentSentinelTexture(`${candidate}.png`)) {
            const skinMaterialName = await getSkinFallbackTextureName(
              prefix,
              textNum
            );
            if (skinMaterialName) {
              newFullName = skinMaterialName;
              break;
            }
            continue;
          }
          newFullName = candidate;
          break;
        }
      } else {
        const usesSkinMaterial = textVer.toLowerCase() === 'sk';
        if (!canSwapBodyTexture) {
          // Models in the texture-swap exclusion list retain their native SK
          // materials. Restore those materials when a reusable audit instance
          // previously applied a numeric appearance.
          if (usesSkinMaterial) {
            if (sourceIsTransparentSentinel) {
              suppressTransparentSentinelMaterial(material);
            }
            continue;
          }
          const skinMaterialName = `${prefix}sk${textNum}`;
          const skinMaterialExists = await getCachedTextureExists(
            `${skinMaterialName}.png`
          );
          const skinMaterialIsTransparent = skinMaterialExists &&
            await getCachedTransparentSentinelTexture(`${skinMaterialName}.png`);
          if (skinMaterialExists && !skinMaterialIsTransparent) {
            newFullName = skinMaterialName;
          } else {
            // Non-character and texture-swap-excluded models can contain
            // intentionally transparent decorative layers whose names do not
            // follow the four-character appearance suffix convention. Leaving
            // those layers active makes converted GLBs render opaque white.
            if (sourceIsTransparentSentinel) {
              suppressTransparentSentinelMaterial(material);
            }
            continue;
          }
        } else {
          const isVariationTexture = texture >= 10;
          const useBodyVariantTextureFallback =
            isVariationTexture && this.bodyVariantFallback === true;
          const maximumStandardTexture = Math.max(
            1,
            Math.min(
              9,
              Number(raceModelMetadata[this.modelName]?.maxTexture ?? 4)
            )
          );
          let text = useBodyVariantTextureFallback
            ? texture
            : isVariationTexture
              ? texture - 10
              : texture;
          if (material.name.startsWith('clk')) {
            text += 4;
          } else if (isVariationTexture && !useBodyVariantTextureFallback) {
            continue;
          }
          const thisText = text.toString().padStart(2, '0');
          if (thisText === textVer) {
            // A model may ship with its requested numeric appearance already
            // assigned. Do not bypass sentinel resolution merely because no
            // material-name swap is otherwise required.
            if (!sourceIsTransparentSentinel) {
              continue;
            }
            newFullName = await getSkinFallbackTextureName(prefix, textNum);
            if (!newFullName) {
              suppressTransparentSentinelMaterial(material);
              continue;
            }
          } else {
            newFullName = `${prefix}${thisText}${textNum}`;
            if (!(await getCachedTextureExists(`${newFullName}.png`))) {
              // A numeric appearance is optional per UV slot. Do not attempt
              // to decode a filename the archive never supplied; retain the
              // imported native material unless the high-numbered body-model
              // fallback can prove a compatible standard clothing texture.
              newFullName = null;
              if (
                useBodyVariantTextureFallback &&
                BODY_VARIANT_CLOTHING_PREFIX_PATTERN.test(prefix)
              ) {
                this.bodyVariantTextureCoverageRequiredCount++;
                bodyVariantCoverageCandidate =
                  await getBodyVariantCoverageTextureName(
                    prefix,
                    textNum,
                    maximumStandardTexture
                  );
                // A high-numbered appearance may omit a numeric clothing
                // variant while the imported native SK material is already a
                // complete, non-transparent texture. Count that real source
                // material as deterministic coverage instead of replacing it
                // with white or reporting a false unresolved fallback. A
                // transparent sentinel remains unresolved and still fails QA.
                if (
                  !bodyVariantCoverageCandidate &&
                  !sourceIsTransparentSentinel
                ) {
                  bodyVariantCoverageCandidate = material.name;
                }
                newFullName = bodyVariantCoverageCandidate;
              }
              if (!newFullName) {
                if (sourceIsTransparentSentinel) {
                  suppressTransparentSentinelMaterial(material);
                }
                continue;
              }
            } else if (
              useBodyVariantTextureFallback &&
              !(await getCachedTransparentSentinelTexture(`${newFullName}.png`))
            ) {
              bodyVariantTextureCandidate = newFullName;
              this.bodyVariantTextureFallbackAvailableCount++;
            }
            if (
              newFullName &&
              await getCachedTransparentSentinelTexture(`${newFullName}.png`)
            ) {
              newFullName = await getSkinFallbackTextureName(prefix, textNum);
              if (!newFullName) {
                // Preserve the currently assigned material instead of
                // replacing it with an unresolved transparent placeholder.
                if (sourceIsTransparentSentinel) {
                  suppressTransparentSentinelMaterial(material);
                }
                continue;
              }
            }
          }
        }
      }

      if (!newFullName || newFullName === material.name) {
        recordBodyVariantAssignment(newFullName);
        if (sourceIsTransparentSentinel) {
          suppressTransparentSentinelMaterial(material);
        }
        continue;
      }

      const scene = window.gameController.currentScene;
      const pendingAppearanceMaterials = getPendingAppearanceMaterials(scene);
      const pendingMaterialKey = newFullName.toLowerCase();
      const pendingMaterialPromise = pendingAppearanceMaterials.get(
        pendingMaterialKey
      );
      if (pendingMaterialPromise) {
        const pendingMaterial = await pendingMaterialPromise;
        if (pendingMaterial) {
          if (isSecondaryHeadMaterial(material)) {
            markSecondaryHeadMaterial(pendingMaterial);
          }
          assign(pendingMaterial);
          recordBodyVariantAssignment(pendingMaterial.name);
        } else if (sourceIsTransparentSentinel) {
          suppressTransparentSentinelMaterial(material);
        }
        if (!pendingMaterial) {
          this.appearanceTextureDecodeFailureCount++;
          this.appearanceTextureDecodeFailures.push(newFullName);
        }
        continue;
      }

      let existing = scene.materials
        .flat()
        .find((entry) => entry.name === newFullName);
      if (
        !isHead &&
        canSwapBodyTexture &&
        (await isTransparentSentinelMaterial(existing))
      ) {
        // Player-race archives include transparent numeric
        // materials to mean "show the native skin for this body slot". These
        // materials are present in the GLB, so merely checking for a matching
        // material name incorrectly selects the transparent sentinel and
        // Babylon renders the body section white. Resolve it to the matching
        // SK material before assigning the swap.
        const skinMaterialName = await getSkinFallbackTextureName(
          prefix,
          textNum
        );
        const skinMaterial = scene.materials
          .flat()
          .find(
            (entry) =>
              skinMaterialName &&
              entry.name.toLowerCase() === skinMaterialName.toLowerCase()
          );
        if (
          !skinMaterial ||
          (await isTransparentSentinelMaterial(skinMaterial))
        ) {
          // Never assign a transparent sentinel when the archive has no safe
          // same-UV fallback. Retaining the current material is deterministic
          // and avoids Babylon's opaque-white rendering of transparent RGB.
          if (sourceIsTransparentSentinel) {
            suppressTransparentSentinelMaterial(material);
          }
          continue;
        }
        newFullName = skinMaterial.name;
        existing = skinMaterial;
      }
      if (existing) {
        if (isSecondaryHeadMaterial(material)) {
          markSecondaryHeadMaterial(existing);
        }
        assign(existing);
        recordBodyVariantAssignment(existing.name);
        continue;
      }

      const materialCreationPromise = (async () => {
        const MaterialClass =
          typeof PBRMaterial === 'function' ? PBRMaterial : StandardMaterial;
        const newMat = material.clone?.(newFullName) ?? new MaterialClass(
          newFullName,
          scene
        );
        newMat.name = newFullName;
        if ('metallic' in newMat) {
          newMat.metallic = 0;
        }
        if ('roughness' in newMat) {
          newMat.roughness = 1;
        }
        newMat.metadata = material.metadata
          ? { ...material.metadata }
          : null;
        if (newMat.metadata) {
          delete newMat.metadata.transparentTextureSentinel;
          delete newMat.metadata.transparentTextureSentinelSuppressed;
        }
        if (isSecondaryHeadMaterial(material)) {
          markSecondaryHeadMaterial(newMat);
        }
        const textureFileName = `${newFullName}.png`;
        const textureData = await getAppearanceTextureData(textureFileName);
        if ((textureData?.byteLength ?? 0) === 0) {
          newMat.dispose?.();
          return null;
        }

        newMat.metadata = {
          ...(newMat.metadata ?? {}),
          spireAppearanceTexturePending: true,
          spireAppearanceTextureDecodeFailed: false,
        };
        const newTexture = startAppearanceTextureDecode({
          name: newFullName,
          scene,
          sourceTexture,
          textureData,
          material: newMat,
          assignTexture: (targetMaterial, targetTexture) =>
            this.setMaterialTexture(targetMaterial, targetTexture),
        });
        if (!newTexture) {
          newMat.dispose?.();
          return null;
        }
        return newMat;
      })();
      pendingAppearanceMaterials.set(
        pendingMaterialKey,
        materialCreationPromise
      );
      let newMat = null;
      try {
        newMat = await materialCreationPromise;
      } finally {
        if (
          pendingAppearanceMaterials.get(pendingMaterialKey) ===
          materialCreationPromise
        ) {
          pendingAppearanceMaterials.delete(pendingMaterialKey);
        }
      }
      if (!newMat) {
        // Retain a known-good source (or suppress an intentional transparent
        // sentinel) if material construction fails before Babylon can begin
        // its asynchronous decode.
        if (sourceIsTransparentSentinel) {
          suppressTransparentSentinelMaterial(material);
        }
        this.appearanceTextureDecodeFailureCount++;
        this.appearanceTextureDecodeFailures.push(newFullName);
        continue;
      }
      assign(newMat);
      recordBodyVariantAssignment(newMat.name);
    }

    const bodyVariantResolvedAssignmentCount =
      this.bodyVariantTextureFallbackAppliedCount +
      this.bodyVariantTextureCoverageAppliedCount;
    this.bodyVariantTextureFallbackApplied =
      this.bodyVariantFallback === true &&
      bodyVariantResolvedAssignmentCount > 0 &&
      this.bodyVariantTextureFallbackAppliedCount ===
        this.bodyVariantTextureFallbackAvailableCount &&
      this.bodyVariantTextureCoverageAppliedCount ===
        this.bodyVariantTextureCoverageRequiredCount;
    this.applyHeadTextureOrientation(rootNode, multiMaterial);
  }

  getModelTopWorldY() {
    let maximumY = Number.NEGATIVE_INFINITY;
    for (const mesh of this.getVisibleModelMeshes()) {
      try {
        mesh.computeWorldMatrix?.(true);
        mesh.refreshBoundingInfo?.(true, true);
        const meshMaximumY =
          mesh.getBoundingInfo?.()?.boundingBox?.maximumWorld?.y;
        if (isUsableWorldY(meshMaximumY)) {
          maximumY = Math.max(maximumY, meshMaximumY);
        }
      } catch (_error) {}
    }
    return Number.isFinite(maximumY) ? maximumY : null;
  }

  getRootLocalYFromWorldY(worldY) {
    if (!this.rootNode || !isUsableWorldY(worldY)) {
      return null;
    }

    try {
      this.rootNode.computeWorldMatrix?.(true);
      const rootWorldPosition = this.rootNode.getAbsolutePosition?.();
      const inverseWorldMatrix = this.rootNode.getWorldMatrix?.()?.clone?.();
      inverseWorldMatrix?.invert?.();
      if (!rootWorldPosition || !inverseWorldMatrix) {
        return null;
      }

      const localPoint = Vector3.TransformCoordinates(
        new Vector3(rootWorldPosition.x, worldY, rootWorldPosition.z),
        inverseWorldMatrix
      );
      return isUsableWorldY(localPoint?.y) ? localPoint.y : null;
    } catch (_error) {
      return null;
    }
  }

  getModelTopLocalY() {
    const topWorldY = this.getModelTopWorldY();
    const topLocalY = this.getRootLocalYFromWorldY(topWorldY);
    if (Number.isFinite(topLocalY)) {
      return topLocalY;
    }

    return this.getLocalVerticalBounds().maximumY;
  }

  getNameplateOffsetY(planeHeight = 0) {
    const maximumY = this.getModelTopLocalY();
    const scaleY = Math.abs(Number(this.rootNode?.scaling?.y ?? 1)) || 1;
    const halfPlaneHeight = Math.max(0, Number(planeHeight) || 0) / 2;
    return Number.isFinite(maximumY)
      ? maximumY + NAMEPLATE_HEAD_CLEARANCE / scaleY + halfPlaneHeight
      : 2.5 + halfPlaneHeight;
  }

  isNameplateEligible() {
    return !INVISIBLE_SPAWN_MODELS.has(this.modelName);
  }

  updateNameplatePosition() {
    if (!this.nameplateMesh) {
      return;
    }

    this.nameplateMesh.position.y = this.getNameplateOffsetY(
      this.nameplateMesh.metadata?.planeHeight
    );
  }

  inspectNameplate() {
    const expectedLines = this.getNameplateLines();
    const plane = this.nameplateMesh;
    const material = plane?.material;
    const texture =
      material?.diffuseTexture ??
      material?._diffuseTexture ??
      material?.emissiveTexture ??
      material?._emissiveTexture;
    const planeHeight = Number(plane?.metadata?.planeHeight ?? 0);
    const bodyTopLocalY = this.getModelTopLocalY();
    const placement = evaluateNameplatePlacement({
      bodyTopLocalY,
      nameplateCenterLocalY: plane?.position?.y,
      planeHeight,
      rootScaleY: this.rootNode?.scaling?.y,
      requiredWorldClearance: NAMEPLATE_HEAD_CLEARANCE,
    });
    const textureSize = texture?.getSize?.() ?? {};
    const renderedLines = Array.isArray(plane?.metadata?.textLines)
      ? plane.metadata.textLines
      : [];
    const textMatches =
      renderedLines.length === expectedLines.length &&
      renderedLines.every((line, index) => line === expectedLines[index]);
    const centered =
      Math.abs(Number(plane?.position?.x ?? Infinity)) <= 0.001 &&
      Math.abs(Number(plane?.position?.z ?? Infinity)) <= 0.001;
    const present = !!plane && !plane.isDisposed?.();
    const visible =
      present &&
      plane.isVisible !== false &&
      plane.visibility !== 0 &&
      plane.isEnabled?.() !== false;
    const textured =
      !!texture &&
      texture.isReady?.() !== false &&
      Number(textureSize.width ?? 0) > 1 &&
      Number(textureSize.height ?? 0) > 1;
    const attached = plane?.parent === this.rootNode;
    const billboarded = Number(plane?.billboardMode ?? 0) !== 0;

    return {
      required: this.nameplateRequired === true,
      validationRepresentative:
        this.nameplateValidationRepresentative === true,
      present,
      visible,
      textured,
      attached,
      centered,
      billboarded,
      textMatches,
      expectedLines,
      renderedLines,
      textureWidth: Number(textureSize.width ?? 0),
      textureHeight: Number(textureSize.height ?? 0),
      placement,
      pass:
        present &&
        visible &&
        textured &&
        attached &&
        centered &&
        billboarded &&
        textMatches &&
        placement.pass,
    };
  }

  getCleanNameplateName(name) {
    return `${name ?? ''}`
      .replace(/^#+/, '')
      .replace(/_/g, ' ')
      .replace(/\d+$/, '')
      .trim();
  }

  getNameplateLines() {
    const entries = Array.isArray(this.spawnEntry.spawnentries)
      ? this.spawnEntry.spawnentries
      : [];
    const entry = entries[0];
    if (!entry?.npc_type) {
      return ['No Associated Spawns'];
    }

    const npcType = entry.npc_type;
    const name = this.getCleanNameplateName(npcType.name) || 'Unknown NPC';
    const level = Number.isFinite(Number(npcType.level))
      ? Number(npcType.level)
      : '?';
    const chance = Number.isFinite(Number(entry.chance))
      ? `${Number(entry.chance)}% Chance`
      : 'Chance Unknown';
    return [`${name} - Level ${level} - ${chance}`];
  }

  getVisibleModelMeshes() {
    const meshes = [
      ...(typeof this.rootNode?.getTotalVertices === 'function' ? [this.rootNode] : []),
      ...(this.rootNode?.getChildMeshes?.(false) ?? []),
    ];

    return meshes.filter((mesh) =>
      mesh?.name !== 'nameplate' &&
      mesh?.id !== 'textPlane' &&
      mesh?.metadata?.nameplate !== true &&
      mesh?.metadata?.hiddenBoundary !== true &&
      mesh?.isVisible !== false &&
      mesh?.visibility !== 0 &&
      mesh?.isEnabled?.() !== false &&
      typeof mesh.getTotalVertices === 'function' &&
      mesh.getTotalVertices() > 0
    );
  }

  getMeshMaterialNames(mesh) {
    const names = [];
    const addName = (material) => {
      if (material?.name) {
        names.push(material.name);
      }
    };

    addName(mesh?.material);
    mesh?.material?.subMaterials?.forEach?.(addName);
    if (mesh?.name) {
      names.push(mesh.name);
    }
    return names;
  }

  isFootMesh(mesh) {
    return this.getMeshMaterialNames(mesh).some((name) =>
      FOOT_MATERIAL_PATTERN.test(name)
    );
  }

  getGroundReferenceMeshes() {
    const meshes = this.getVisibleModelMeshes();
    const footMeshes = meshes.filter((mesh) => this.isFootMesh(mesh));
    return footMeshes.length > 0 ? footMeshes : meshes;
  }

  removeClassicMaleLegSpikes() {
    const positionKind = VertexBuffer?.PositionKind ?? 'position';
    const meshes = this.rootNode?.getChildMeshes?.(false) ?? [];

    for (const mesh of meshes) {
      if (
        !this.getMeshMaterialNames(mesh).some((name) =>
          CLASSIC_MALE_LEG_SPIKE_MATERIAL_PATTERN.test(name)
        )
      ) {
        continue;
      }

      const positions = mesh.getVerticesData?.(positionKind);
      const indices = mesh.getIndices?.();
      const vertexCount = mesh.getTotalVertices?.() ?? 0;
      if (!positions || !indices || vertexCount <= 0) {
        continue;
      }

      const keptIndices = [];
      let removedTriangles = 0;
      for (let i = 0; i < indices.length; i += 3) {
        const triangle = [indices[i], indices[i + 1], indices[i + 2]];
        const hasSpikeVertex = triangle.some((index) => {
          const offset = index * 3;
          const y = positions[offset + 1];
          const z = positions[offset + 2];
          return Math.abs(y) > 5 || Math.abs(z) > 5;
        });

        if (hasSpikeVertex) {
          removedTriangles++;
          continue;
        }

        keptIndices.push(...triangle);
      }

      if (removedTriangles === 0) {
        continue;
      }

      const vertexData = mesh.getVerticesDataKinds()
        .map((kind) => {
          const data = mesh.getVerticesData(kind);
          const stride = data?.length / vertexCount;
          return Number.isInteger(stride) && stride > 0
            ? { kind, data, stride }
            : null;
        })
        .filter(Boolean);

      const remappedData = new Map(
        vertexData.map(({ kind }) => [kind, []])
      );
      const remappedIndices = [];
      for (const oldIndex of keptIndices) {
        const newIndex = remappedIndices.length;
        remappedIndices.push(newIndex);
        for (const { kind, data, stride } of vertexData) {
          const nextData = remappedData.get(kind);
          const sourceOffset = oldIndex * stride;
          for (let j = 0; j < stride; j++) {
            nextData.push(data[sourceOffset + j]);
          }
        }
      }

      for (const { kind, data } of vertexData) {
        const nextData = remappedData.get(kind);
        const typedData = ArrayBuffer.isView(data)
          ? new data.constructor(nextData)
          : nextData;
        mesh.setVerticesData(kind, typedData, false);
      }
      mesh.setIndices(remappedIndices);
      mesh.refreshBoundingInfo?.(true, true);
      mesh.metadata = {
        ...mesh.metadata,
        removedClassicLegSpikeTriangles: removedTriangles,
      };
    }
  }

  getGroundReferenceWorldY() {
    let minimumY = Number.POSITIVE_INFINITY;
    for (const mesh of this.getGroundReferenceMeshes()) {
      try {
        mesh.computeWorldMatrix?.(true);
        mesh.refreshBoundingInfo?.(true, true);
        const meshMinimumY =
          mesh.getBoundingInfo?.()?.boundingBox?.minimumWorld?.y;
        if (isUsableWorldY(meshMinimumY)) {
          minimumY = Math.min(minimumY, meshMinimumY);
        }
      } catch (_error) {}
    }
    return Number.isFinite(minimumY) ? minimumY : null;
  }

  getLocalVerticalBounds() {
    const visibleMeshes = this.getVisibleModelMeshes();
    const groundMeshes = this.getGroundReferenceMeshes();
    let minimumY = Number.POSITIVE_INFINITY;
    let maximumY = Number.NEGATIVE_INFINITY;

    for (const mesh of groundMeshes) {
      try {
        mesh.computeWorldMatrix?.(true);
        mesh.refreshBoundingInfo?.(true, true);
        const meshMinimumY = mesh.getBoundingInfo?.()?.boundingBox?.minimum?.y;
        if (isUsableWorldY(meshMinimumY)) {
          minimumY = Math.min(minimumY, meshMinimumY);
        }
      } catch (_error) {}
    }

    for (const mesh of visibleMeshes) {
      try {
        mesh.computeWorldMatrix?.(true);
        mesh.refreshBoundingInfo?.(true, true);
        const meshMaximumY = mesh.getBoundingInfo?.()?.boundingBox?.maximum?.y;
        if (isUsableWorldY(meshMaximumY)) {
          maximumY = Math.max(maximumY, meshMaximumY);
        }
      } catch (_error) {}
    }

    return {
      minimumY: Number.isFinite(minimumY) ? minimumY : null,
      maximumY: Number.isFinite(maximumY) ? maximumY : null,
    };
  }

  getAnimationBaseName(animationGroup) {
    return `${animationGroup?.name ?? ''}`.replace(/^Clone of /, '');
  }

  isPoseAnimation(animationGroup) {
    return POSE_ANIMATION_PATTERN.test(`${animationGroup?.name ?? ''}`);
  }

  getPlayableAnimationGroups() {
    return this.animationGroups.filter(
      (animationGroup) =>
        !this.isPoseAnimation(animationGroup) &&
        animationGroup?.targetedAnimations?.length > 0
    );
  }

  getPreferredVisualAnimationGroup() {
    if (this.nativePoseOnly) {
      return null;
    }
    return selectPreferredVisualAnimationGroup(this.animationGroups);
  }

  recordVisualAnimationSelection(animationGroup) {
    const poseGroup = this.animationGroups.find((group) =>
      this.isPoseAnimation(group)
    ) ?? null;
    this.neutralIdleCandidateNames = this.getPlayableAnimationGroups()
      .filter((group) => isNeutralIdleAnimationName(group?.name))
      .filter((group) =>
        inspectAnimationGroupVitality(group, poseGroup).dynamicTargetCount > 0
      )
      .map((group) => group.name);
    this.selectedVisualAnimationName = animationGroup?.name ?? null;
    this.neutralIdleSelectionPass =
      this.neutralIdleCandidateNames.length === 0 ||
      isNeutralIdleAnimationName(this.selectedVisualAnimationName);
  }

  isDynamicVisualAnimationGroup(animationGroup) {
    if (!animationGroup) {
      return false;
    }
    const poseGroup = this.animationGroups.find((group) =>
      this.isPoseAnimation(group)
    ) ?? null;
    return inspectAnimationGroupVitality(
      animationGroup,
      poseGroup
    ).dynamicTargetCount > 0;
  }

  synchronizeSkeletonPose() {
    if (!this.rootNode) {
      return;
    }
    const nodes = [
      this.rootNode,
      ...(this.rootNode.getDescendants?.(false) ?? []),
    ];
    for (const node of nodes) {
      node.computeWorldMatrix?.(true);
    }
    const skeletons = new Set([
      ...(this.instanceContainer?.skeletons ?? []),
      ...nodes.map((node) => node?.skeleton).filter(Boolean),
    ]);
    for (const skeleton of skeletons) {
      skeleton.prepare?.(true);
    }
    for (const node of nodes) {
      node.refreshBoundingInfo?.(true, true);
    }
  }

  getVisualMaxDimension() {
    if (!this.rootNode) {
      return null;
    }
    const meshes = [
      ...(typeof this.rootNode.getTotalVertices === 'function'
        ? [this.rootNode]
        : []),
      ...(this.rootNode.getChildMeshes?.(false) ?? []),
    ].filter(
      (mesh) =>
        mesh?.name !== 'nameplate' &&
        mesh?.id !== 'textPlane' &&
        mesh?.metadata?.hiddenBoundary !== true &&
        mesh?.isVisible !== false &&
        mesh?.visibility !== 0 &&
        (typeof mesh?.getTotalVertices !== 'function' ||
          mesh.getTotalVertices() > 0)
    );

    let maximumDimension = 0;
    for (const mesh of meshes) {
      try {
        mesh.computeWorldMatrix?.(true);
        mesh.refreshBoundingInfo?.(true, true);
        const box = mesh.getBoundingInfo?.()?.boundingBox;
        const minimum = box?.minimumWorld;
        const maximum = box?.maximumWorld;
        if (!minimum || !maximum) {
          continue;
        }
        maximumDimension = Math.max(
          maximumDimension,
          Math.abs(maximum.x - minimum.x),
          Math.abs(maximum.y - minimum.y),
          Math.abs(maximum.z - minimum.z)
        );
      } catch (_error) {}
    }
    return maximumDimension > 0 ? maximumDimension : null;
  }

  captureAnimationTargetValues(animationGroups = this.animationGroups) {
    const owners = new Map();
    for (const group of animationGroups ?? []) {
      for (const targetedAnimation of group?.targetedAnimations ?? []) {
        const path = targetedAnimation?.animation?.targetPropertyPath ?? [];
        let owner = targetedAnimation?.target;
        for (let index = 0; owner && index < path.length - 1; index++) {
          owner = owner[path[index]];
        }
        const property = path[path.length - 1];
        if (!owner || !property || owner[property] === undefined) {
          continue;
        }
        const properties = owners.get(owner) ?? new Map();
        if (!properties.has(property)) {
          const value = owner[property];
          properties.set(
            property,
            value?.clone?.() ??
              (ArrayBuffer.isView(value) ? value.slice() : value)
          );
          owners.set(owner, properties);
        }
      }
    }
    return owners;
  }

  restoreAnimationTargetValues(snapshot) {
    for (const [owner, properties] of snapshot ?? []) {
      for (const [property, value] of properties) {
        if (owner[property]?.copyFrom && value) {
          owner[property].copyFrom(value);
        } else {
          owner[property] = value?.clone?.() ??
            (ArrayBuffer.isView(value) ? value.slice() : value);
        }
        owner.markAsDirty?.(property);
      }
    }
  }

  applyAnimationGroupFrame(animationGroup, frame) {
    let appliedTargetCount = 0;
    for (const targetedAnimation of animationGroup?.targetedAnimations ?? []) {
      const animation = targetedAnimation?.animation;
      const path = animation?.targetPropertyPath ?? [];
      let owner = targetedAnimation?.target;
      for (let index = 0; owner && index < path.length - 1; index++) {
        owner = owner[path[index]];
      }
      const property = path[path.length - 1];
      if (
        !owner ||
        !property ||
        owner[property] === undefined ||
        typeof animation?.evaluate !== 'function'
      ) {
        continue;
      }
      const value = animation.evaluate(frame);
      if (owner[property]?.copyFrom && value) {
        owner[property].copyFrom(value);
      } else {
        owner[property] = value?.clone?.() ?? value;
      }
      owner.markAsDirty?.(property);
      appliedTargetCount++;
    }
    return appliedTargetCount;
  }

  inspectPrimaryHeadRotationSafety(animationGroup, snapshot) {
    const samples = [];
    for (const targetedAnimation of animationGroup?.targetedAnimations ?? []) {
      const targetName = `${targetedAnimation?.target?.name ?? ''}`
        .replace(/^Clone of /, '')
        .trim();
      const path = targetedAnimation?.animation?.targetPropertyPath ?? [];
      if (
        !PRIMARY_HEAD_BONE_PATTERN.test(targetName) ||
        path[path.length - 1] !== 'rotationQuaternion'
      ) {
        continue;
      }
      let owner = targetedAnimation.target;
      for (let index = 0; owner && index < path.length - 1; index++) {
        owner = owner[path[index]];
      }
      const property = path[path.length - 1];
      const baselineQuaternion = snapshot?.get(owner)?.get(property);
      const result = evaluateHeadRotationSafety({
        baselineQuaternion,
        currentQuaternion: owner?.[property],
      });
      if (result.measurable) {
        samples.push({ targetName, ...result });
      }
    }
    return {
      pass: samples.every((sample) => sample.pass),
      measurable: samples.length > 0,
      samples,
      maximumAngleDegrees: samples.reduce(
        (maximum, sample) => Math.max(maximum, sample.angleDegrees ?? 0),
        0
      ),
    };
  }

  validateAnimationBounds(animationGroup) {
    if (!window.__spireSagePreview || !animationGroup) {
      return { pass: true, measurable: false, samples: [] };
    }
    const safetyCacheKey = [
      this.loadedModelVariation ?? this.modelName,
      animationGroup.name ?? 'unnamed',
    ].join(':').toLowerCase();
    const cachedResult = animationSafetyCache.get(safetyCacheKey);
    if (cachedResult) {
      const result = { ...cachedResult, cached: true };
      this.animationBoundsSafety = result;
      return result;
    }
    const snapshot = this.captureAnimationTargetValues();
    this.synchronizeSkeletonPose();
    const baselineMaxDimension = this.getVisualMaxDimension();
    const from = Number(animationGroup.from ?? 0);
    const to = Number(animationGroup.to ?? from);
    const samples = [];
    let pass = true;
    try {
      for (const fraction of [0.1, 0.37, 0.63, 0.9]) {
        const frame = Number.isFinite(from) && Number.isFinite(to)
          ? from + (to - from) * fraction
          : 0;
        this.applyAnimationGroupFrame(animationGroup, frame);
        this.synchronizeSkeletonPose();
        const boundsResult = evaluateAnimatedBoundsSafety({
          baselineMaxDimension,
          currentMaxDimension: this.getVisualMaxDimension(),
        });
        const headRotation = this.inspectPrimaryHeadRotationSafety(
          animationGroup,
          snapshot
        );
        const samplePass = boundsResult.pass && headRotation.pass;
        samples.push({
          fraction,
          frame,
          ...boundsResult,
          pass: samplePass,
          headRotation,
        });
        if (!samplePass) {
          pass = false;
          break;
        }
      }
    } finally {
      this.restoreAnimationTargetValues(snapshot);
      this.synchronizeSkeletonPose();
    }
    const result = {
      pass,
      measurable: samples.some((sample) => sample.measurable),
      baselineMaxDimension,
      headOrientationPass: samples.every((sample) => sample.headRotation?.pass !== false),
      samples,
    };
    animationSafetyCache.set(safetyCacheKey, result);
    this.animationBoundsSafety = result;
    return result;
  }

  applyAnimationBoundsFallback() {
    const snapshot = this.captureAnimationTargetValues();
    const baselineMaxDimension = this.getVisualMaxDimension();
    this.neutralSkeletonPoseApplied = false;
    this.applyNeutralSkeletonPose();
    this.synchronizeSkeletonPose();
    const fallbackSafety = evaluateAnimatedBoundsSafety({
      baselineMaxDimension,
      currentMaxDimension: this.getVisualMaxDimension(),
    });
    if (!fallbackSafety.pass) {
      this.restoreAnimationTargetValues(snapshot);
      this.synchronizeSkeletonPose();
    }
    this.animationBoundsRejected = true;
    this.animationBoundsFallbackSafe = fallbackSafety.pass;
    if (fallbackSafety.pass) {
      this.staticPreviewPoseApplied = true;
      this.staticPreviewPoseTargetCount = Math.max(
        1,
        Number(this.staticPreviewPoseTargetCount ?? 0)
      );
    }
    this.releaseStaticAnimationResources();
    if (this.rootNode?.metadata) {
      this.rootNode.metadata.animationBoundsRejected = true;
      this.rootNode.metadata.animationBoundsFallbackSafe = fallbackSafety.pass;
      this.rootNode.metadata.animationBoundsSafety = this.animationBoundsSafety;
    }
  }

  applyNeutralSkeletonPose() {
    if (this.neutralSkeletonPoseApplied) {
      return true;
    }
    const playableGroups = this.getPlayableAnimationGroups();
    const nativePoseGroup = this.animationGroups.find((group) =>
      this.isPoseAnimation(group)
    );
    const basePoseGroup = this.nativePoseOnly
      ? nativePoseGroup
      : playableGroups.find(
        (group) => this.getAnimationBaseName(group) === 'p04'
      ) ?? playableGroups[0];
    if (!basePoseGroup?.targetedAnimations?.length) {
      return false;
    }
    this.animationGroups.forEach((group) => group.stop());
    const frame = Number(basePoseGroup.from ?? 0);
    let appliedTargetCount = 0;
    for (const targetedAnimation of basePoseGroup.targetedAnimations) {
      const animation = targetedAnimation.animation;
      const target = targetedAnimation.target;
      const path = animation?.targetPropertyPath ?? [];
      if (!target || path.length === 0 || typeof animation.evaluate !== 'function') {
        continue;
      }
      let owner = target;
      for (let index = 0; index < path.length - 1; index++) {
        owner = owner?.[path[index]];
      }
      const property = path[path.length - 1];
      if (!owner || owner[property] === undefined) {
        continue;
      }
      const value = animation.evaluate(frame);
      if (owner[property]?.copyFrom && value) {
        owner[property].copyFrom(value);
      } else {
        owner[property] = value?.clone?.() ?? value;
      }
      appliedTargetCount++;
    }
    if (this.nativePoseOnly) {
      const compactModelName = `${this.modelName ?? ''}`
        .slice(0, 3)
        .toLowerCase();
      const compactArmRotation =
        COMPACT_NATIVE_ARM_NEUTRAL_ROTATIONS.get(compactModelName);
      if (compactArmRotation) {
        // Resolve the instantiated nodes, rather than relying only on the
        // animation target list. Imported pose tracks can target wrapper nodes
        // while the skinned hierarchy uses their instantiated descendants.
        const poseTargets = [
          this.rootNode,
          ...(this.rootNode?.getDescendants?.(false) ?? []),
          ...basePoseGroup.targetedAnimations.map(({ target }) => target),
        ];
        const findPoseTarget = (name) => poseTargets.find(
          (target) =>
            `${target?.name}`.replace(/^Clone of /, '').toLowerCase() === name
        );
        const leftBicep = findPoseTarget('bi_l');
        const rightBicep = findPoseTarget('bi_r');
        this.compactNativeArmTargetCount =
          Number(!!leftBicep) + Number(!!rightBicep);
        if (leftBicep?.rotate && rightBicep?.rotate) {
          const rotationAxis =
            compactArmRotation.axis === 'x'
              ? BABYLON.Axis.X
              : compactArmRotation.axis === 'y'
                ? BABYLON.Axis.Y
                : BABYLON.Axis.Z;
          leftBicep.rotate(
            rotationAxis,
            compactArmRotation.amount,
            BABYLON.Space.LOCAL
          );
          rightBicep.rotate(
            rotationAxis,
            -compactArmRotation.amount,
            BABYLON.Space.LOCAL
          );
          appliedTargetCount += 2;
          this.compactNativeArmNeutralized = true;
          this.compactNativeArmNeutralRotation = compactArmRotation.amount;
          this.compactNativeArmNeutralAxis = compactArmRotation.axis;
        }
      }
      this.neutralSkeletonPoseApplied = appliedTargetCount > 0;
      this.staticPreviewPoseApplied = appliedTargetCount > 0;
      this.staticPreviewPoseTargetCount = appliedTargetCount;
      this.staticPreviewPoseMaxDelta = appliedTargetCount > 0 ? 1 : 0;
      if (this.rootNode?.metadata) {
        this.rootNode.metadata.compactNativeArmNeutralized =
          this.compactNativeArmNeutralized === true;
        this.rootNode.metadata.compactNativeArmTargetCount =
          this.compactNativeArmTargetCount ?? 0;
      }
      this.synchronizeSkeletonPose();
      return this.neutralSkeletonPoseApplied;
    }
    const poseTargets = [
      ...new Set(basePoseGroup.targetedAnimations.map(({ target }) => target)),
    ];
    const leftClavicle = poseTargets.find(
      (target) => `${target?.name}`.replace(/^Clone of /, '').toLowerCase() === 'biclavl'
    );
    const rightClavicle = poseTargets.find(
      (target) => `${target?.name}`.replace(/^Clone of /, '').toLowerCase() === 'biclavr'
    );
    if (!leftClavicle || !rightClavicle) {
      return false;
    }
    leftClavicle.rotate(BABYLON.Axis.Z, 1, BABYLON.Space.LOCAL);
    rightClavicle.rotate(BABYLON.Axis.Z, -1, BABYLON.Space.LOCAL);
    this.neutralSkeletonPoseApplied = true;
    this.staticPreviewPoseApplied = true;
    this.staticPreviewPoseTargetCount = appliedTargetCount + 2;
    this.staticPreviewPoseMaxDelta = 1;
    this.synchronizeSkeletonPose();
    return true;
  }

  calculateSpawnScale() {
    if (this.modelName === 'fis') {
      return 0.005;
    }

    const size = Number(this.spawn.size ?? 0);
    if (size > 0) {
      return size / SPAWN_SIZE_SCALE_DIVISOR;
    }

    if (size < 0) {
      return size / 4;
    }

    return DEFAULT_SPAWN_SCALE;
  }

  shouldSnapToZoneGround() {
    return !ZONE_GROUND_SNAP_DISABLED_MODELS.has(this.modelName);
  }

  isZoneGroundSnapMesh(mesh) {
    if (
      !mesh ||
      mesh === this.rootNode ||
      mesh.metadata?.spawn ||
      mesh.metadata?.spawnRoot ||
      mesh.metadata?.secondaryHead ||
      mesh.metadata?.targetRing ||
      mesh.name === 'skyBox' ||
      mesh.id === 'skyBox' ||
      mesh.name === 'nameplate' ||
      mesh.id === 'textPlane' ||
      mesh.metadata?.hiddenBoundary === true ||
      mesh.isVisible === false ||
      mesh.visibility === 0 ||
      mesh.isEnabled?.() === false ||
      typeof mesh.getTotalVertices !== 'function' ||
      mesh.getTotalVertices() <= 0
    ) {
      return false;
    }

    if (mesh.name === 'zone') {
      return true;
    }

    const parentId = mesh.parent?.id ?? mesh.parent?.name;
    return (
      mesh.metadata?.zoneObject === true ||
      ZONE_GROUND_SNAP_PARENT_IDS.has(parentId)
    );
  }

  getZoneGroundSnapMeshes(scene) {
    return (scene?.meshes ?? []).filter((mesh) =>
      this.isZoneGroundSnapMesh(mesh)
    );
  }

  getZoneGroundWorldY(targetY) {
    if (
      !this.shouldSnapToZoneGround() ||
      !this.rootNode ||
      typeof Ray !== 'function' ||
      typeof Vector3 !== 'function'
    ) {
      return null;
    }

    const scene = window.gameController?.currentScene;
    if (!scene?.pickWithRay) {
      return null;
    }
    const groundMeshes = this.getZoneGroundSnapMeshes(scene);
    if (groundMeshes.length === 0) {
      return null;
    }

    const origin = new Vector3(
      this.rootNode.position.x,
      Number(targetY) + ZONE_GROUND_RAY_START_OFFSET,
      this.rootNode.position.z
    );
    const ray = new Ray(
      origin,
      new Vector3(0, -1, 0),
      ZONE_GROUND_RAY_LENGTH
    );
    const pickableState = groundMeshes.map((mesh) => [
      mesh,
      mesh.isPickable,
    ]);
    let pickResults = [];
    try {
      for (const mesh of groundMeshes) {
        mesh.isPickable = true;
      }
      const predicate = (mesh) => groundMeshes.includes(mesh);
      pickResults = typeof scene.multiPickWithRay === 'function'
        ? scene.multiPickWithRay(ray, predicate) ?? []
        : [scene.pickWithRay(ray, predicate)].filter(Boolean);
    } finally {
      for (const [mesh, wasPickable] of pickableState) {
        mesh.isPickable = wasPickable;
      }
    }

    const requestedY = Number(targetY);
    const groundY = pickResults
      .filter((result) => result?.hit)
      .map((result) => result.pickedPoint?.y)
      .filter((y) => {
        if (!isUsableWorldY(y)) {
          return false;
        }
        const drop = requestedY - y;
        return drop >= -0.25 && drop <= ZONE_GROUND_SNAP_MAX_DROP;
      })
      .reduce(
        (highestY, y) => Math.max(highestY, y),
        Number.NEGATIVE_INFINITY
      );
    if (!isUsableWorldY(groundY)) {
      return null;
    }

    return groundY;
  }

  normalizeToSpawnGround(
    targetY = this.rootNode?.position?.y,
    { onlyRaise = false, clearance = 0, snapToZone = true } = {}
  ) {
    if (!this.rootNode || !Number.isFinite(Number(targetY))) {
      return 0;
    }

    const minimumY = this.getGroundReferenceWorldY();
    if (!Number.isFinite(minimumY)) {
      return 0;
    }

    const requestedTargetY = Number(targetY);
    const zoneGroundY = snapToZone
      ? this.getZoneGroundWorldY(requestedTargetY)
      : null;
    const effectiveTargetY = Number.isFinite(zoneGroundY)
      ? zoneGroundY
      : requestedTargetY;
    const targetClearance = Math.max(0, Number(clearance) || 0);
    const offsetY = effectiveTargetY + targetClearance - minimumY;
    const previousGroundOffset = Number(this.rootNode.metadata?.groundOffsetY ?? 0);
    if (onlyRaise && offsetY <= 0.001) {
      this.rootNode.metadata = {
        ...this.rootNode.metadata,
        groundOffsetY        : previousGroundOffset,
        groundClearanceY     : targetClearance,
        lastGroundCorrectionY: 0,
        requestedSpawnGroundY: requestedTargetY,
        spawnGroundY         : effectiveTargetY,
        zoneGroundY          : Number.isFinite(zoneGroundY) ? zoneGroundY : null,
      };
      return 0;
    }
    this.rootNode.metadata = {
      ...this.rootNode.metadata,
      groundOffsetY        : Math.abs(offsetY) <= 0.001
        ? previousGroundOffset
        : previousGroundOffset + offsetY,
      groundClearanceY     : targetClearance,
      lastGroundCorrectionY: Math.abs(offsetY) <= 0.001 ? 0 : offsetY,
      requestedSpawnGroundY: requestedTargetY,
      spawnGroundY         : effectiveTargetY,
      zoneGroundY          : Number.isFinite(zoneGroundY) ? zoneGroundY : null,
    };
    if (Math.abs(offsetY) <= 0.001) {
      return 0;
    }

    this.rootNode.position.y += offsetY;
    if (this.instance) {
      this.instance.position.copyFrom(this.rootNode.position);
    }
    return offsetY;
  }

  normalizeAnimatedGroundPose(options = {}) {
    this.normalizeToSpawnGround(this.spawn.z, {
      snapToZone: this.rootNode?.metadata?.preserveRequestedGroundY !== true,
      ...options,
    });
    this.updateNameplatePosition();
  }

  remapSecondaryMeshSkeleton(mesh, targetSkeleton) {
    const sourceSkeleton = mesh?.skeleton;
    if (!sourceSkeleton || !targetSkeleton || sourceSkeleton === targetSkeleton) {
      return {
        pass: !!targetSkeleton,
        remappedIndexCount: 0,
        unresolvedBones: [],
      };
    }

    const normalizeBoneName = (name) => `${name ?? ''}`
      .replace(/^Clone of /i, '')
      .trim()
      .toLowerCase();
    const targetBoneIndexByName = new Map();
    for (let index = 0; index < (targetSkeleton.bones?.length ?? 0); index++) {
      const name = normalizeBoneName(targetSkeleton.bones[index]?.name);
      if (name && !targetBoneIndexByName.has(name)) {
        targetBoneIndexByName.set(name, index);
      }
    }

    const sourceBones = sourceSkeleton.bones ?? [];
    const unresolvedBones = new Set();
    let remappedIndexCount = 0;
    const indexKinds = [
      VertexBuffer?.MatricesIndicesKind ?? BABYLON.VertexBuffer?.MatricesIndicesKind,
      VertexBuffer?.MatricesIndicesExtraKind ??
        BABYLON.VertexBuffer?.MatricesIndicesExtraKind,
    ].filter(Boolean);

    const pendingBuffers = [];
    for (const kind of indexKinds) {
      const values = mesh.getVerticesData?.(kind);
      if (!values?.length) {
        continue;
      }
      const remappedValues = ArrayBuffer.isView(values)
        ? new values.constructor(values)
        : [...values];
      for (let index = 0; index < remappedValues.length; index++) {
        const sourceIndex = Math.trunc(Number(remappedValues[index]));
        const sourceBone = sourceBones[sourceIndex];
        if (!sourceBone) {
          unresolvedBones.add(`index:${sourceIndex}`);
          continue;
        }
        const sourceName = normalizeBoneName(sourceBone.name);
        const targetIndex = targetBoneIndexByName.get(sourceName);
        if (targetIndex === undefined) {
          unresolvedBones.add(sourceBone.name ?? `index:${sourceIndex}`);
          continue;
        }
        if (targetIndex !== sourceIndex) {
          remappedValues[index] = targetIndex;
          remappedIndexCount++;
        }
      }
      pendingBuffers.push([kind, remappedValues]);
    }

    if (unresolvedBones.size > 0) {
      return {
        pass: false,
        remappedIndexCount,
        unresolvedBones: [...unresolvedBones].sort(),
      };
    }

    for (const [kind, values] of pendingBuffers) {
      mesh.updateVerticesData?.(kind, values, false, false);
    }
    mesh.skeleton = targetSkeleton;
    return {
      pass: true,
      remappedIndexCount,
      unresolvedBones: [],
    };
  }

  attachSecondaryMeshes(secondaryModel, targetSkeleton) {
    const secondaryRootNode = secondaryModel?.rootNodes?.[0];
    const secondaryMeshes = (secondaryRootNode?.getChildMeshes?.(false) ?? [])
      .filter((mesh) =>
        !SEPARATE_HEAD_MODELS.has(this.modelName) ||
        this.getMeshMaterialNames(mesh).some((name) =>
          shouldAttachSecondaryMesh(this.modelName, name)
        )
      );
    const attachedMeshes = [];
    for (const mesh of secondaryMeshes) {
      const skeletonRemap = this.remapSecondaryMeshSkeleton(
        mesh,
        targetSkeleton
      );
      if (!skeletonRemap.pass) {
        this.secondaryHeadBoneRemapFailureCount =
          (this.secondaryHeadBoneRemapFailureCount ?? 0) + 1;
        this.secondaryHeadBoneRemapFailures = [
          ...(this.secondaryHeadBoneRemapFailures ?? []),
          {
            mesh: mesh.name,
            unresolvedBones: skeletonRemap.unresolvedBones,
          },
        ];
        continue;
      }
      mesh.parent = this.rootNode;
      markSecondaryHeadMaterial(mesh.material);
      mesh.metadata = {
        ...mesh.metadata,
        spawn: this.metadata?.spawn ?? this.spawnEntry,
        secondaryHead: true,
        secondaryHeadBoneRemapped: true,
        secondaryHeadBoneRemappedIndexCount:
          skeletonRemap.remappedIndexCount,
      };
      attachedMeshes.push(mesh);
    }
    for (const skeleton of secondaryModel?.skeletons ?? []) {
      if (skeleton !== targetSkeleton) {
        skeleton.dispose?.();
      }
    }
    return attachedMeshes;
  }

  getMeshInfluencingBoneNames(mesh) {
    const skeleton = mesh?.skeleton ?? this.rootNode?.skeleton;
    const bones = skeleton?.bones ?? [];
    const matricesIndicesKind =
      VertexBuffer?.MatricesIndicesKind ??
      BABYLON.VertexBuffer?.MatricesIndicesKind;
    if (!mesh?.getVerticesData || !matricesIndicesKind || bones.length === 0) {
      return [];
    }

    const indices = mesh.getVerticesData(matricesIndicesKind);
    if (!indices?.length) {
      return [];
    }

    const names = new Set();
    for (let i = 0; i < indices.length; i += 4) {
      for (let j = 0; j < 4; j++) {
        const boneIndex = indices[i + j];
        const boneName = bones[boneIndex]?.name;
        if (boneName) {
          names.add(`${boneName}`.replace(/^Clone of /, ''));
        }
      }
    }
    return [...names];
  }

  isIntegratedHeadMesh(mesh) {
    if (
      !this.getMeshMaterialNames(mesh).some((name) =>
        HEAD_MATERIAL_PATTERN.test(name)
      )
    ) {
      return false;
    }

    const boneNames = this.getMeshInfluencingBoneNames(mesh);
    if (boneNames.length === 0) {
      return true;
    }
    return boneNames.some((name) => HEAD_BONE_PATTERN.test(name));
  }

  hideIntegratedHeadMeshes() {
    if (this.modelName === 'ghu') {
      return;
    }

    const meshes = this.rootNode?.getChildMeshes?.(false) ?? [];
    for (const mesh of meshes) {
      if (mesh.metadata?.secondaryHead === true) {
        continue;
      }
      if (!this.isIntegratedHeadMesh(mesh)) {
        continue;
      }
      mesh.metadata = {
        ...mesh.metadata,
        replacedBySecondaryHead: true,
      };
      mesh.isPickable = false;
      mesh.isVisible = false;
      mesh.visibility = 0;
      mesh.setEnabled?.(false);
    }
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

  /**
   * @returns {boolean}
   */
  async initializeSpawn() {
    const modelVariation = getCharacterBodyModelVariation(
      this.modelName,
      this.spawnEntry.texture
    );
    this.requestedModelVariation = modelVariation;
    this.loadedModelVariation = null;
    this.bodyVariantFallback = false;

    let assetContainer = null;
    if (window.__spireSagePreview && modelVariation !== this.modelName) {
      assetContainer =
        await window.gameController.SpawnController.getAssetContainer(
          modelVariation,
          false,
            { optional: true, generateIfMissing: true }
        );
      if (assetContainer) {
        this.loadedModelVariation = modelVariation;
      }
    }
    if (!assetContainer) {
      const fallbackModelName =
        modelVariation === this.modelName ? modelVariation : this.modelName;
      assetContainer =
        await window.gameController.SpawnController.getAssetContainer(
          fallbackModelName
        );
      if (assetContainer) {
        this.loadedModelVariation = fallbackModelName;
        this.bodyVariantFallback = fallbackModelName !== modelVariation;
      }
    }
    if (!assetContainer) {
      console.warn('Asset container not found for', modelVariation);
      return;
    }
    this.instanceContainer =
      window.gameController.SpawnController.instantiateSpawnModel?.(
        this.loadedModelVariation ?? this.modelName,
        assetContainer
      ) ?? assetContainer.instantiateModelsToScene();
    this.animationGroups = this.instanceContainer.animationGroups;
    this.previewAnimationDonor =
      this.instanceContainer.__spirePreviewAnimationDonor ?? null;
    this.resolvedModelAsset =
      this.instanceContainer.__spireResolvedModelAsset ??
      this.loadedModelVariation ??
      this.modelName;
    this.rootNode = this.instanceContainer.rootNodes[0];

    if (!this.rootNode) {
      console.log('No root node for container spawn', this.spawn);
      return false;
    }
    this.rootNode.metadata = {
      ...this.rootNode.metadata,
      requestedModelVariation: this.requestedModelVariation,
      loadedModelVariation   : this.loadedModelVariation,
      bodyVariantFallback    : this.bodyVariantFallback,
    };
    this.animationRetargeting = retargetDetachedAnimationTargets(
      this.animationGroups,
      [this.rootNode, ...(this.rootNode.getDescendants?.(false) ?? [])]
    );
    this.animationMap = mapAnimations(this.animationGroups);
    const importedModelNodes = [
      this.rootNode,
      ...(this.rootNode.getDescendants?.(false) ?? []),
    ];
    const staticPoseOnlyByPolicy = isStaticPoseOnlyCharacterModel(
      this.requestedModelVariation,
      this.loadedModelVariation,
      this.resolvedModelAsset,
      this.modelName
    );
    const hasPlayablePreviewAnimationDonor =
      this.previewAnimationDonor?.expected === true &&
      this.previewAnimationDonor?.pass === true;
    this.nativePoseOnly =
      staticPoseOnlyByPolicy ||
      (
        !hasPlayablePreviewAnimationDonor &&
        (
          this.instanceContainer.__spireNativePoseOnly === true ||
          importedModelNodes.some((node) =>
            node?.metadata?.gltf?.extras?.spireNativePoseOnly === true ||
            node?.metadata?.extras?.spireNativePoseOnly === true ||
            node?.metadata?.spireNativePoseOnly === true
          )
        )
      );
    const spawnId = this.spawnEntry.__spireSpawnId ?? this.spawn.id;
    this.rootNode.id = `spawn_${spawnId}`;
    this.rootNode.name = this.spawn.name;
    for (const mesh of this.rootNode.getChildMeshes()) {
      mesh.checkCollisions = true;
      mesh.name = mesh.material?.name ?? mesh.name;
      mesh.metadata = {
        spawn: this.metadata?.spawn ?? this.spawnEntry,
      };
    }
    this.removeClassicMaleLegSpikes();

    this.rootNode.position.setAll(0);
    this.rootNode.scaling.setAll(1);
    this.rootNode.rotationQuaternion = null;
    this.rootNode.rotation.setAll(0);

    const instanceSkeleton = this.instanceContainer.skeletons[0];
    const skeletonRoot = this.rootNode.getChildren(undefined, true)[0];

    const variation =
      this.spawnEntry.helmtexture?.toString().padStart(2, '0') ?? '00';
    const container = await this.getSecondaryHeadContainer(variation);
    if (container) {
      const secondaryModel = container.instantiateModelsToScene();
      try {
        this.hasAttachedSecondaryHead =
          this.attachSecondaryMeshes(secondaryModel, instanceSkeleton).length > 0;
        if (
          this.hasAttachedSecondaryHead &&
          SEPARATE_HEAD_MODELS.has(this.modelName)
        ) {
          this.hideIntegratedHeadMeshes();
        }
      } finally {
        // Selected head meshes have been reparented to the primary root. The
        // remaining root, skeleton and animation entries are temporary and
        // otherwise accumulate once per spawned NPC.
        secondaryModel.dispose();
      }
    }

    const scale = this.calculateSpawnScale();
    this.scale = scale;

    const hasAnimatedPose = this.getPlayableAnimationGroups().length > 0;
    const keepSkinnedHierarchy =
      window.__spireSagePreview &&
      !!instanceSkeleton &&
      (hasAnimatedPose || this.nativePoseOnly);
    const merged = keepSkinnedHierarchy
      ? null
      : Mesh.MergeMeshes(
        this.rootNode.getChildMeshes(false),
        true,
        true,
        undefined,
        true,
        true
      );
    if (merged) {
      if (skeletonRoot && instanceSkeleton) {
        skeletonRoot.parent = merged;
        skeletonRoot.skeleton = instanceSkeleton;
        skeletonRoot.skeleton.name = `${this.spawn.name}_skeleton`;
      }
      this.rootNode.dispose();
      this.rootNode = merged;
      this.rootNode.skeleton = skeletonRoot?.skeleton ?? instanceSkeleton;

      await this.applyTextureSwaps(merged, merged.material);
      this.applyMaterialRenderSettings(merged, merged.material);
    } else if (keepSkinnedHierarchy) {
      this.rootNode.skeleton = instanceSkeleton;
      await this.applyTextureSwaps(this.rootNode);
      this.applyMaterialRenderSettings(this.rootNode);
    }
    this.rootNode.parent = this.parentNode;
    const useLodProxy = !window.__spireSagePreview;
    if (useLodProxy) {
      const sphere = MeshBuilder.CreateSphere(
        this.spawn.name,
        { diameter: 3, segments: 32 },
        this.currentScene
      );
      sphere.metadata = { ...this.metadata, onlyOccluded: false };
      sphere.position = this.rootNode.position.clone();
      sphere.parent = this.parentNode;
      sphere.isPickable = true;
      this.instance = sphere;
    } else {
      this.instance = null;
    }
    this.rootNode.metadata = {
      ...this.metadata,
      onlyOccluded: true,
      spawnRoot   : true,
      requestedModelVariation: this.requestedModelVariation,
      loadedModelVariation: this.loadedModelVariation,
      resolvedModelAsset: this.resolvedModelAsset,
      bodyVariantFallback: this.bodyVariantFallback === true,
      bodyVariantTextureFallbackApplied:
        this.bodyVariantTextureFallbackApplied === true,
      bodyVariantTextureFallbackAppliedCount:
        this.bodyVariantTextureFallbackAppliedCount ?? 0,
      bodyVariantTextureFallbackAvailableCount:
        this.bodyVariantTextureFallbackAvailableCount ?? 0,
      bodyVariantTextureCoverageRequiredCount:
        this.bodyVariantTextureCoverageRequiredCount ?? 0,
      bodyVariantTextureCoverageAppliedCount:
        this.bodyVariantTextureCoverageAppliedCount ?? 0,
      nativePoseOnly: this.nativePoseOnly === true,
      previewAnimationDonorExpected:
        this.previewAnimationDonor?.expected === true,
      previewAnimationDonorPass:
        this.previewAnimationDonor?.pass === true,
      previewAnimationDonorName:
        this.previewAnimationDonor?.donorName ?? null,
      previewAnimationDonorFailureReason:
        this.previewAnimationDonor?.failureReason ?? null,
      previewAnimationDonorGroupCount:
        this.previewAnimationDonor?.attachedGroupCount ?? 0,
      previewAnimationDonorTargetCount:
        this.previewAnimationDonor?.attachedTargetCount ?? 0,
      previewAnimationDonorBindRelativeTargetCount:
        this.previewAnimationDonor?.bindRelativeTargetCount ?? 0,
      previewAnimationDonorBindLockedRotationTargetNames:
        this.previewAnimationDonor?.bindLockedRotationTargetNames ?? [],
      previewAnimationDonorUnmatchedTargetNames:
        this.previewAnimationDonor?.unmatchedTargetNames ?? [],
      compactNativeArmNeutralized:
        this.compactNativeArmNeutralized === true,
    };
    if (this.instance) {
      this.rootNode.addLODLevel(window.gameController.settings.spawnLOD, this.instance);
    }

    const glowMeshes =
      typeof this.rootNode.getChildMeshes === 'function'
        ? this.rootNode.getChildMeshes(false)
        : [];
    const rootGlowMeshes = glowMeshes.length > 0 ? glowMeshes : [this.rootNode];
    for (const glowMesh of rootGlowMeshes) {
      window.gameController.ZoneController.glowLayer.addIncludedOnlyMesh(
        glowMesh
      );
    }
    if (this.instance) {
      window.gameController.ZoneController.glowLayer.addIncludedOnlyMesh(
        this.instance
      );
    }

    this.rootNode.id = `spawn_${spawnId}`;
    this.rootNode.name = this.spawn.name;

    this.rootNode.position = eqtoBabylonVector(
      this.spawn.x,
      this.spawn.y,
      this.spawn.z
    );
    this.rootNode.scaling.z = scale;
    this.rootNode.scaling.x = scale;
    this.rootNode.scaling.y = Math.abs(scale);
    this.rootNode.rotation = new Vector3(
      Tools.ToRadians(0),
      Tools.ToRadians(this.spawn.heading),
      Tools.ToRadians(0)
    );
    if (this.instance) {
      this.instance.position.copyFrom(this.rootNode.position);
    }

    this.rootNode.isPickable = true;
    this.rootNode.babylonSpawn = this;
    this.rootNode.getChildMeshes?.(false).forEach((mesh) => {
      mesh.babylonSpawn = this;
      mesh.metadata = {
        ...mesh.metadata,
        ...this.metadata,
        spawn: this.metadata?.spawn ?? this.spawnEntry,
      };
    });
    this.rootNode.forceRenderingWhenOccluded = true;
    if (AbstractMesh?.OCCLUSION_TYPE_OPTIMISTIC !== undefined) {
      this.rootNode.occlusionType = AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC;
    }
    this.hideInvisibleBoundaryMeshes();
    this.normalizeToSpawnGround(this.spawn.z);
    if (!this.isNameplateEligible()) {
      this.previewNameplateDeferred = false;
    } else if (!window.__spireSageSkipBulkNameplates) {
      this.createNameplate();
    } else {
      this.previewNameplateDeferred = true;
    }

    if (window.__spireSagePreview && window.__spireSageBulkSpawnLoading) {
      this.previewAnimationDeferred = true;
    } else {
      this.startInitialAnimation();
    }

    return true;
  }

  startInitialAnimation({
    skipGroundNormalization = false,
    schedulePostInitialize = true,
  } = {}) {
    if (this.disposed || !this.rootNode) {
      return;
    }
    this.previewAnimationDeferred = false;
    const anim = this.getPreferredVisualAnimationGroup();
    this.recordVisualAnimationSelection(anim);
    if (anim && this.isDynamicVisualAnimationGroup(anim)) {
      const boundsSafety = this.validateAnimationBounds(anim);
      if (boundsSafety.pass) {
        this.retainSelectedVisualAnimationResources(anim);
        this.disableLoopedAnimation();
        anim.play(true);
      } else {
        console.warn('[SageAnimation] rejected unsafe animation', {
          modelName: this.modelName,
          spawnId: this.spawnEntry.__spireSpawnId ?? this.spawn.id,
          animation: anim.name,
          boundsSafety,
        });
        this.animationHeadOrientationRejected =
          boundsSafety.headOrientationPass === false;
        this.applyAnimationBoundsFallback();
      }
      if (!skipGroundNormalization) {
        this.normalizeAnimatedGroundPose();
      }
    } else {
      if (!this.applyStaticAnimationPose()) {
        this.applyNeutralSkeletonPose();
      }
      if (!skipGroundNormalization) {
        this.normalizeAnimatedGroundPose();
      }
    }
    if (!schedulePostInitialize) {
      return;
    }
    const initializedRoot = this.rootNode;
    this.postInitializeTimer = setTimeout(() => {
      this.postInitializeTimer = null;
      if (
        this.disposed ||
        !initializedRoot ||
        this.rootNode !== initializedRoot ||
        initializedRoot.isDisposed?.()
      ) {
        return;
      }
      this.normalizeAnimatedGroundPose();
      initializedRoot.refreshBoundingInfo?.(true, true);
      this.playAnimation();
      this.normalizeAnimatedGroundPose();
    }, 1000);
  }

  applyStaticAnimationPose() {
    if (this.disposed || !this.rootNode) {
      return false;
    }
    const animationGroup = this.getPreferredVisualAnimationGroup();
    if (!animationGroup?.targetedAnimations?.length) {
      return this.applyNeutralSkeletonPose();
    }
    const from = Number(animationGroup.from ?? 0);
    const to = Number(animationGroup.to ?? from);
    const frame = Number.isFinite(from) && Number.isFinite(to)
      ? from + (to - from) * 0.37
      : 0;
    let appliedTargetCount = 0;
    let maxValueDelta = 0;
    for (const targetedAnimation of animationGroup.targetedAnimations) {
      const animation = targetedAnimation.animation;
      const target = targetedAnimation.target;
      const path = animation?.targetPropertyPath ?? [];
      if (!target || path.length === 0 || typeof animation.evaluate !== 'function') {
        continue;
      }
      let owner = target;
      for (let index = 0; index < path.length - 1; index++) {
        owner = owner?.[path[index]];
      }
      const property = path[path.length - 1];
      if (!owner || owner[property] === undefined) {
        continue;
      }
      const previousValue = owner[property];
      const value = animation.evaluate(frame);
      const previousComponents = previousValue?.asArray?.() ??
        previousValue?.toArray?.() ??
        (Number.isFinite(previousValue) ? [previousValue] : []);
      const nextComponents = value?.asArray?.() ??
        value?.toArray?.() ??
        (Number.isFinite(value) ? [value] : []);
      for (
        let index = 0;
        index < Math.min(previousComponents.length, nextComponents.length);
        index++
      ) {
        maxValueDelta = Math.max(
          maxValueDelta,
          Math.abs(nextComponents[index] - previousComponents[index])
        );
      }
      if (previousValue?.copyFrom && value) {
        previousValue.copyFrom(value);
      } else {
        owner[property] = value?.clone?.() ?? value;
      }
      target.markAsDirty?.(property);
      appliedTargetCount++;
    }
    this.synchronizeSkeletonPose();
    this.previewAnimationDeferred = false;
    this.staticPreviewPoseApplied = appliedTargetCount > 0 && maxValueDelta > 0.00001;
    this.staticPreviewPoseTargetCount = appliedTargetCount;
    this.staticPreviewPoseMaxDelta = maxValueDelta;
    if (this.staticPreviewPoseApplied) {
      this.releaseStaticAnimationResources();
    }
    return this.staticPreviewPoseApplied;
  }

  releaseStaticAnimationResources() {
    // Bulk zone previews keep one live animation per model and pose duplicate
    // NPCs at a representative frame. Once that frame has been applied, their
    // cloned animation groups are no longer needed and otherwise dominate both
    // scene bookkeeping and memory in spawn-heavy zones.
    for (const animationGroup of this.animationGroups) {
      animationGroup?.stop?.();
      animationGroup?.dispose?.();
    }
    this.animationGroups = [];
    this.animationMap = {};
    this.animatables = [];
    if (this.instanceContainer) {
      this.instanceContainer.animationGroups = [];
    }
  }

  retainSelectedVisualAnimationResources(selectedAnimationGroup) {
    if (!selectedAnimationGroup || this.animationGroups.length <= 1) {
      return;
    }
    let disposedGroupCount = 0;
    for (const animationGroup of this.animationGroups) {
      if (animationGroup === selectedAnimationGroup) {
        continue;
      }
      animationGroup?.stop?.();
      animationGroup?.dispose?.();
      disposedGroupCount++;
    }
    this.animationGroups = [selectedAnimationGroup];
    this.animationMap = mapAnimations(this.animationGroups);
    this.animatables = [];
    this.animationResourcePrunedCount =
      Number(this.animationResourcePrunedCount ?? 0) + disposedGroupCount;
    if (this.instanceContainer) {
      this.instanceContainer.animationGroups = this.animationGroups;
    }
  }

  async promoteToLiveAnimation() {
    if (this.disposed || !this.rootNode) {
      return false;
    }
    const existingAnimation = this.getPreferredVisualAnimationGroup();
    if (existingAnimation && this.isDynamicVisualAnimationGroup(existingAnimation)) {
      this.startInitialAnimation({ schedulePostInitialize: false });
      return true;
    }
    if (this.nativePoseOnly) {
      return false;
    }
    if (this.selectedAnimationPromotionPromise) {
      return this.selectedAnimationPromotionPromise;
    }

    this.selectedAnimationPromotionPromise = (async () => {
      const modelVariation = this.loadedModelVariation ?? this.modelName;
      const assetContainer =
        await window.gameController?.SpawnController?.getAssetContainer?.(
          modelVariation
        );
      if (!assetContainer || this.disposed || !this.rootNode) {
        this.selectedAnimationPromotionFailed = true;
        return false;
      }

      const temporaryInstance = assetContainer.instantiateModelsToScene();
      const animationGroups = [...(temporaryInstance.animationGroups ?? [])];
      const animationRetargeting = retargetDetachedAnimationTargets(
        animationGroups,
        [this.rootNode, ...(this.rootNode.getDescendants?.(false) ?? [])]
      );
      const animationVitality = inspectAnimationSetVitality(animationGroups);
      const canPromote =
        animationGroups.length > 0 &&
        animationRetargeting.unresolvedTargetCount === 0 &&
        animationVitality.dynamicGroupCount > 0;

      if (!canPromote) {
        for (const animationGroup of animationGroups) {
          animationGroup?.dispose?.();
        }
        temporaryInstance.animationGroups = [];
        temporaryInstance.dispose?.();
        this.selectedAnimationPromotionFailed = true;
        return false;
      }

      // The cloned roots and skeletons are temporary; only their animation
      // groups are retained after all targets have been deterministically
      // rebound to this spawn's existing nodes.
      temporaryInstance.animationGroups = [];
      temporaryInstance.dispose?.();
      this.animationGroups = animationGroups;
      this.animationMap = mapAnimations(animationGroups);
      this.animationRetargeting = animationRetargeting;
      if (this.instanceContainer) {
        this.instanceContainer.animationGroups = animationGroups;
      }
      this.staticPreviewPoseApplied = false;
      this.selectedAnimationPromoted = true;
      this.selectedAnimationPromotionFailed = false;
      this.startInitialAnimation({ schedulePostInitialize: false });
      return true;
    })();

    try {
      return await this.selectedAnimationPromotionPromise;
    } finally {
      this.selectedAnimationPromotionPromise = null;
    }
  }

  demoteSelectedLiveAnimation() {
    if (!this.selectedAnimationPromoted) {
      return false;
    }
    const applied = this.applyStaticAnimationPose();
    this.selectedAnimationPromoted = false;
    return applied;
  }

  enableLoopedAnimation() {
    this.animationMap[this.loopedAnimation]?.play(
      this.loopedAnimation !== AnimationNames['Shuffle Feet']
    );
    this.animating = true;
  }

  disableLoopedAnimation(removeAnimatables = false) {
    if (removeAnimatables) {
      const startIdx =
        window.gameController.currentScene._activeAnimatables.findIndex(
          (ag) => this.animatables[0] === ag
        );
      if (startIdx > -1) {
        window.gameController.currentScene._activeAnimatables.splice(
          startIdx,
          this.animatables.length
        );
      }
    }

    this.animationMap[this.loopedAnimation]?.stop();
    this.animating = false;
  }

  swapLoopedAnimation(newIdx) {
    if (
      newIdx === this.loopedAnimation &&
      this.animationMap[newIdx]?.isPlaying
    ) {
      return;
    }
    this.disableLoopedAnimation();
    this.loopedAnimation = newIdx;
    this.enableLoopedAnimation();
  }

  playAnimation(idx, _speed = 0) {
    if (!this.rootNode.isEnabled()) {
      return;
    }

    const anim = this.getPreferredVisualAnimationGroup();

    if (anim && this.isDynamicVisualAnimationGroup(anim)) {
      this.disableLoopedAnimation();
      anim.play(true);
      this.normalizeAnimatedGroundPose();
    } else {
      if (!this.applyStaticAnimationPose()) {
        this.applyNeutralSkeletonPose();
      }
      this.normalizeAnimatedGroundPose();
    }
  }

  dispose() {
    this.disposed = true;
    this.selectedAnimationPromotionPromise = null;
    if (this.postInitializeTimer !== null) {
      clearTimeout(this.postInitializeTimer);
      this.postInitializeTimer = null;
    }
    this.disposeNameplate();
    const rootNode = this.rootNode;
    this.rootNode = null;
    // instantiateModelsToScene returns ownership of its root nodes, cloned
    // skeletons and cloned animation groups. Disposing only the visible root
    // leaves the latter two registered with the scene across zone changes.
    this.instanceContainer?.dispose?.();
    this.instanceContainer = null;
    if (rootNode && !rootNode.isDisposed?.()) {
      rootNode.dispose();
    }
    this.animationGroups = [];
    this.animationMap = {};
    this.animatables = [];
    this.instance?.dispose();
    this.instance = null;
  }

  disposeNameplate() {
    const material = this.nameplateMesh?.material;
    const texture =
      material?.diffuseTexture ??
      material?._diffuseTexture ??
      material?.emissiveTexture ??
      material?._emissiveTexture;
    texture?.dispose?.();
    material?.dispose?.();
    this.nameplateMesh?.dispose?.();
    this.nameplateMesh = null;
  }

  createNameplate({ validationRepresentative = false } = {}) {
    if (!this.isNameplateEligible()) {
      this.nameplateRequired = false;
      this.nameplateValidationRepresentative = false;
      this.previewNameplateDeferred = false;
      this.disposeNameplate();
      return;
    }
    this.nameplateRequired = true;
    this.nameplateValidationRepresentative = validationRepresentative === true;
    this.previewNameplateDeferred = false;
    if (
      typeof DynamicTexture !== 'function' ||
      typeof StandardMaterial !== 'function' ||
      !MeshBuilder?.CreatePlane
    ) {
      return;
    }

    this.disposeNameplate();

    const textLines = this.getNameplateLines();
    if (!textLines.length) {
      return;
    }

    const scene = window.gameController.currentScene;
    const temp = new DynamicTexture(
      'nameplate_measure',
      { width: 64, height: 64 },
      scene
    );
    const tmpctx = temp.getContext();
    tmpctx.font = NAMEPLATE_FONT;
    const textWidth = Math.ceil(
      textLines.reduce((acc, line) =>
        Math.max(acc, tmpctx.measureText(line).width),
      1)
    );
    temp.dispose();

    const textureWidth = Math.min(
      2048,
      getNextPowerOfTwo(textWidth + NAMEPLATE_PADDING_X * 2)
    );
    const textureHeight = getNextPowerOfTwo(
      textLines.length * NAMEPLATE_LINE_HEIGHT + NAMEPLATE_PADDING_Y * 2
    );
    const dynamicTexture = new DynamicTexture(
      'nameplate_texture',
      { width: textureWidth, height: textureHeight },
      scene
    );
    dynamicTexture.hasAlpha = true;
    const ctx = dynamicTexture.getContext();
    ctx.clearRect(0, 0, textureWidth, textureHeight);
    ctx.font = NAMEPLATE_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let i = 0; i < textLines.length; i++) {
      const y = NAMEPLATE_PADDING_Y + NAMEPLATE_LINE_HEIGHT * (i + 0.5);
      const x = textureWidth / 2;
      ctx.fillStyle = NAMEPLATE_SHADOW_COLOR;
      ctx.fillText(textLines[i], x + 3, y + 3);
      ctx.lineWidth = 7;
      ctx.strokeStyle = NAMEPLATE_OUTLINE_COLOR;
      ctx.strokeText(textLines[i], x, y);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
      ctx.strokeText(textLines[i], x, y);
      ctx.fillStyle = NAMEPLATE_TEXT_COLOR;
      ctx.fillText(textLines[i], x, y);
    }
    dynamicTexture.update();

    const planeHeight = Math.max(
      NAMEPLATE_MIN_HEIGHT,
      NAMEPLATE_LINE_HEIGHT_WORLD * textLines.length + 0.08
    );
    const planeWidth = planeHeight * (textureWidth / textureHeight);
    const plane = MeshBuilder.CreatePlane(
      'textPlane',
      { width: planeWidth, height: planeHeight },
      scene
    );
    plane.addLODLevel(500, null);
    plane.isPickable = false;
    plane.billboardMode =
      ParticleSystem?.BILLBOARDMODE_ALL ?? Mesh?.BILLBOARDMODE_ALL;
    plane.parent = this.rootNode;
    const material = new StandardMaterial(
      'nameplate',
      scene
    );
    plane.material = material;
    material.diffuseTexture = dynamicTexture;
    material.emissiveTexture = dynamicTexture;
    material.diffuseTexture.hasAlpha = true;
    material.useAlphaFromDiffuseTexture = true;
    material.diffuseColor = Color3.White();
    material.emissiveColor = Color3.White();
    material.specularColor = new Color3(0, 0, 0);
    material.backFaceCulling = false;
    material.disableLighting = true;
    plane.metadata = {
      nameplate  : true,
      planeHeight,
      spawn      : this.metadata?.spawn ?? this.spawnEntry,
      textLines  : [...textLines],
    };

    this.nameplateMesh = plane;
    this.updateNameplatePosition();
  }

  // eslint-disable-next-line
  updateTextures() {}
}
