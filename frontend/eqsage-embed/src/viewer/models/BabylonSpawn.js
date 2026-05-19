import BABYLON from '@bjs';
import { Spawn } from './Spawn';
import { eqtoBabylonVector } from '../util/vector';
import { AnimationNames, mapAnimations } from '../helpers/animationUtils';
import { getEQFileExists } from 'sage-core/util/fileHandler';

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
const modelExistsCache = new Map();
const DEFAULT_SPAWN_SCALE = 1.5;
const SPAWN_SIZE_SCALE_DIVISOR = 6;
const FOOT_MATERIAL_PATTERN = /ft\d{4}$/i;
const HEAD_MATERIAL_PATTERN = /^[a-z0-9]{3}he(?:\d{2}|sk)\d{2}$/i;
const HEAD_OR_FACE_MATERIAL_PATTERN =
  /^[a-z0-9]{3}(?:he(?:\d{2}|sk)\d{2}|fa\d{4})$/i;
const HEAD_BONE_PATTERN = /^(?:he|ne|fa|head_point|hair_point)/i;
const CLASSIC_MALE_LEG_SPIKE_MATERIAL_PATTERN = /^(?:bam|erm|hum)lg000[12]$/i;
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
const DOUBLE_SIDED_SPAWN_MODELS = new Set(['ghu']);
const SECONDARY_HEAD_MODEL_PREFIXES = [
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
];
const CLASSIC_HEAD_TEXTURE_V_FLIP_MODELS = new Set([
  'baf',
  'bam',
  'daf',
  'dam',
  'dwf',
  'dwm',
  'elf',
  'elm',
  'erf',
  'erm',
  'gnf',
  'gnm',
  'haf',
  'ham',
  'hif',
  'him',
  'hof',
  'hom',
  'huf',
  'hum',
  'ikf',
  'ikm',
  'ogf',
  'ogm',
  'trf',
  'trm',
]);
const HEAD_TEXTURE_V_FLIP_EXCLUDED_MODELS = new Set(['orc']);

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

const shouldFlipHeadTextureV = (modelName, materialName, material = null) =>
  !HEAD_TEXTURE_V_FLIP_EXCLUDED_MODELS.has(modelName) &&
  (
    (
      CLASSIC_HEAD_TEXTURE_V_FLIP_MODELS.has(modelName) &&
      HEAD_OR_FACE_MATERIAL_PATTERN.test(materialName)
    ) ||
    (
      isSecondaryHeadMaterial(material) &&
      HEAD_MATERIAL_PATTERN.test(materialName)
    )
  );

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
  if (!textureExistsCache.has(fileName)) {
    textureExistsCache.set(
      fileName,
      getEQFileExists('textures', fileName).catch(() => false)
    );
  }
  return textureExistsCache.get(fileName);
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

  /** @type {Node} */
  parentNode = null;

  /** @type {import('@babylonjs/core').AnimationGroup[]} */
  animationGroups = [];

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

  applyHeadTextureOrientation(rootNode, multiMaterial = null) {
    const bindings = this.getMaterialBindings(rootNode, multiMaterial);
    for (const { material } of bindings) {
      if (
        !shouldFlipHeadTextureV(this.modelName, `${material?.name ?? ''}`, material)
      ) {
        continue;
      }
      this.applyTextureVFlip(this.getMaterialTexture(material));
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
    if (
      !this.spawnEntry.hasOwnProperty('texture') ||
      this.spawnEntry.texture <= 0 ||
      this.skipTextureSwap(this.modelName)
    ) {
      return;
    }

    const texture = Number(this.spawnEntry.texture);
    const bindings = this.getMaterialBindings(rootNode, multiMaterial);

    for (const { assign, material } of bindings) {
      const sourceTexture = this.getMaterialTexture(material);
      if (!sourceTexture || !material?.name) {
        continue;
      }

      const isVariationTexture = texture >= 10;
      let text = isVariationTexture ? texture - 10 : texture;
      const isHead = HEAD_MATERIAL_PATTERN.test(material.name);
      if (material.name.startsWith('clk')) {
        text += 4;
      } else if (texture >= 10 && !isHead) {
        continue;
      }
      const prefix = material.name.slice(0, material.name.length - 4);
      const suffix = material.name.slice(material.name.length - 4);
      const textVer = suffix.slice(0, 2);
      const textNum = suffix.slice(2, 4);
      const thisText = text.toString().padStart(2, '0');
      let newFullName = `${prefix}${thisText}${textNum}`;

      if (isHead) {
        if (this.hasAttachedSecondaryHead) {
          continue;
        }

        const headTexture = Number(this.spawnEntry.helmtexture ?? 0);
        newFullName = headTexture > 0
          ? `${prefix}${headTexture.toString().padStart(2, '0')}${textNum}`
          : `${prefix}sk${textNum}`;
      }

      if (!isHead && thisText === textVer) {
        continue;
      }

      const exists = await getCachedTextureExists(`${newFullName}.png`);
      if (!exists) {
        continue;
      }

      const existing = window.gameController.currentScene.materials
        .flat()
        .find((entry) => entry.name === newFullName);
      if (existing) {
        if (isSecondaryHeadMaterial(material)) {
          markSecondaryHeadMaterial(existing);
        }
        if (shouldFlipHeadTextureV(this.modelName, newFullName, existing)) {
          this.applyTextureVFlip(this.getMaterialTexture(existing));
          existing.markAsDirty?.(BABYLON.Material?.TextureDirtyFlag ?? 1);
        }
        assign(existing);
        continue;
      }

      const MaterialClass =
        typeof PBRMaterial === 'function' ? PBRMaterial : StandardMaterial;
      const newMat = new MaterialClass(
        newFullName,
        window.gameController.currentScene
      );
      if ('metallic' in newMat) {
        newMat.metallic = 0;
      }
      if ('roughness' in newMat) {
        newMat.roughness = 1;
      }
      if (isSecondaryHeadMaterial(material)) {
        markSecondaryHeadMaterial(newMat);
      }
      const newTexture = new Texture(
        newFullName,
        window.gameController.currentScene,
        sourceTexture.noMipMap,
        sourceTexture.invertY,
        sourceTexture.samplingMode
      );
      if (shouldFlipHeadTextureV(this.modelName, newFullName, newMat)) {
        this.applyTextureVFlip(newTexture);
      }
      this.setMaterialTexture(newMat, newTexture);
      assign(newMat);
    }
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

  updateNameplatePosition() {
    if (!this.nameplateMesh) {
      return;
    }

    this.nameplateMesh.position.y = this.getNameplateOffsetY(
      this.nameplateMesh.metadata?.planeHeight
    );
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
    { onlyRaise = false, clearance = 0 } = {}
  ) {
    if (!this.rootNode || !Number.isFinite(Number(targetY))) {
      return 0;
    }

    const minimumY = this.getGroundReferenceWorldY();
    if (!Number.isFinite(minimumY)) {
      return 0;
    }

    const requestedTargetY = Number(targetY);
    const zoneGroundY = this.getZoneGroundWorldY(requestedTargetY);
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
    this.normalizeToSpawnGround(this.spawn.z, options);
    this.updateNameplatePosition();
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
    for (const mesh of secondaryMeshes) {
      mesh.parent = this.rootNode;
      if (targetSkeleton && mesh.skeleton) {
        mesh.skeleton = targetSkeleton;
      }
      markSecondaryHeadMaterial(mesh.material);
      mesh.metadata = {
        ...mesh.metadata,
        spawn: this.metadata?.spawn ?? this.spawnEntry,
        secondaryHead: true,
      };
    }
    for (const skeleton of secondaryModel?.skeletons ?? []) {
      if (skeleton !== targetSkeleton) {
        skeleton.dispose?.();
      }
    }
    return secondaryMeshes;
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
    const modelVariation =
      this.spawnEntry.texture >= 10
        ? `${this.modelName}${Number(this.spawnEntry.texture.toString()[0])
          .toString()
          .padStart(2, '0')}`
        : this.modelName;

    let assetContainer = null;
    if (window.__spireSagePreview && modelVariation !== this.modelName) {
      assetContainer =
        await window.gameController.SpawnController.getAssetContainer(
          modelVariation,
          false,
          { optional: true }
        );
    }
    if (!assetContainer) {
      assetContainer =
        await window.gameController.SpawnController.getAssetContainer(
          modelVariation === this.modelName ? modelVariation : this.modelName
        );
    }
    if (!assetContainer) {
      console.warn('Asset container not found for', modelVariation);
      return;
    }
    this.instanceContainer = assetContainer.instantiateModelsToScene();
    this.animationGroups = this.instanceContainer.animationGroups;

    this.animationMap = mapAnimations(this.animationGroups);
    this.rootNode = this.instanceContainer.rootNodes[0];

    if (!this.rootNode) {
      console.log('No root node for container spawn', this.spawn);
      return false;
    }
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
    let secondaryModel = null;
    if (container) {
      secondaryModel = container.instantiateModelsToScene();
      this.hasAttachedSecondaryHead =
        this.attachSecondaryMeshes(secondaryModel, instanceSkeleton).length > 0;
      if (
        this.hasAttachedSecondaryHead &&
        SEPARATE_HEAD_MODELS.has(this.modelName)
      ) {
        this.hideIntegratedHeadMeshes();
      }
    }

    const scale = this.calculateSpawnScale();
    this.scale = scale;

    const hasAnimatedPose = this.getPlayableAnimationGroups().length > 0;
    const keepSkinnedHierarchy =
      window.__spireSagePreview && !!instanceSkeleton && hasAnimatedPose;
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
    if (secondaryModel && !keepSkinnedHierarchy) {
      secondaryModel.dispose();
    }
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
      this.applyHeadTextureOrientation(merged, merged.material);
      this.applyMaterialRenderSettings(merged, merged.material);
    } else if (keepSkinnedHierarchy) {
      this.rootNode.skeleton = instanceSkeleton;
      await this.applyTextureSwaps(this.rootNode);
      this.applyHeadTextureOrientation(this.rootNode);
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
    this.createNameplate();

    const anim =
      this.animationGroups.find((ag) => ag.name === 'Clone of p01') ??
      this.getPlayableAnimationGroups()?.[0];
    if (anim) {
      this.disableLoopedAnimation();
      anim.play(true);
      this.normalizeAnimatedGroundPose();
    }
    setTimeout(() => {
      this.normalizeAnimatedGroundPose();
      this.rootNode.refreshBoundingInfo?.(true, true);
      this.playAnimation();
      this.normalizeAnimatedGroundPose();
    }, 1000);

    return true;
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

    const anim =
      this.animationGroups.find((ag) => ag.name === 'Clone of p01') ??
      this.getPlayableAnimationGroups()?.[0];

    if (anim) {
      this.disableLoopedAnimation();
      anim.play(true);
      this.normalizeAnimatedGroundPose();
    }
  }

  dispose() {
    this.disposeNameplate();
    this.rootNode?.dispose();
    this.rootNode = null;
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

  createNameplate() {
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
    };

    this.nameplateMesh = plane;
    this.updateNameplatePosition();
  }

  // eslint-disable-next-line
  updateTextures() {}
}
