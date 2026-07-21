import BABYLON from '@bjs';
import { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import assimpjs from '../../modules/assimp';
import raceData from '../common/raceData.json';
import {
  getCharacterArchiveBaseModelName,
  PREVIEW_ALIAS_FIRST_MODELS,
  PREVIEW_CLIENT_FALLBACKS,
  PREVIEW_MODEL_ALIASES,
} from '../common/raceModelResolution';
import { GameControllerChild } from './GameControllerChild';
import { BabylonSpawn } from '../models/BabylonSpawn';
import { GlobalStore } from '../../state';
import { getEQFile, getEQFileExists } from 'sage-core/util/fileHandler';
import {
  GLOBAL_VERSION,
  PREVIEW_CHARACTER_CACHE_VERSION,
  processCharacterModelArchive,
  processGlobal,
} from '../../components/zone/processZone';
import { locateStaticAsset } from '../../static-assets';
import { createGltfTransformIo, loadGltfTransformModules } from '../../util/gltf-transform';
import {
  inspectAnimationGroupVitality,
  inspectAnimationSetVitality,
} from '../helpers/animationValidation';
import { getCharacterHeadOrientationPolicy } from 'sage-core/util/character-texture-orientation';
import {
  PREVIEW_CHARACTER_MODEL_CACHE_VERSION,
} from 'sage-core/model/constants';

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
const normalizeAnimationTargetName = (value) =>
  `${value ?? ''}`.replace(/^Clone of /, '').trim().toLowerCase();
const POST_LOAD_GROUND_CLEARANCE = 0.03;
const T_POSE_VALIDATION_EXCLUDED_MODELS = new Set(['tpf', 'tpm', 'tpn']);
const COMPACT_NATIVE_ARM_NORMALIZATION_MODELS = new Set([
  'qcf',
  'clm',
  'clf',
]);

// These generated files exist but cannot be rendered. Prefer their explicit
// semantic alias so each zone load does not pay for a guaranteed GLB failure.
const PREVIEW_OBJECT_MODEL_ALIASES = {
  brl: 'obj_barrel_wood_',
};

const PREVIEW_ANIMATION_DONORS = {
  // These classic guard/brownie variants ship with geometry and POS only.
  // Each mapping is based on the actual named skeleton, not its bone count:
  // BGM is an exact 25-bone match for BRM/FEM/GFM and GEF is an exact
  // 24-bone match for FEF/GFF.
  brm: 'bgm',
  fef: 'gef',
  fem: 'bgm',
  gff: 'gef',
  gfm: 'bgm',
  // The female Shade archive contains geometry and its bind pose but no
  // playable clips. SDM has the identical 52-node skeleton, so use its clips
  // rather than leaving SDF collapsed in the imported bind pose.
  sdf: 'sdm',
  // Neutral Shissar geometry likewise ships with only POS. SHM has the exact
  // same 74 named bones and supplies the playable movement set. SHF uses SHM
  // as a complete model fallback because retargeting its collapsed source
  // geometry deforms the body.
  shn: 'shm',
};

// QA escape hatch for comparing a bind-pose-only character against its
// retargeted preview animation. This is intentionally opt-in and only honored
// by Sage's validation preview, so normal zone rendering cannot silently lose
// animation coverage.
const previewAnimationDonorDisabled = () =>
  typeof window !== 'undefined' &&
  !!window.__spireSagePreview &&
  new URLSearchParams(window.location.search).get(
    'sageRaceFacePreviewDisableDonor'
  ) === '1';

// Cross-race animation donors may use the same semantic head/neck bone names
// with different local bind axes. Applying their quaternion delta can turn an
// otherwise valid face upside down even when every target resolves. Keep the
// target model's own head chain orientation; torso and limb rotations still
// provide the visible idle/movement pose that removes the T-pose.
const PREVIEW_CHARACTER_HEAD_MATERIAL_PATTERN =
  /^[a-z0-9]{3}he(?:\d{2}|sk)\d{2}$/i;
const isPreviewHeadOrNeckRotationTarget = (name) =>
  /^(?:he|head|hehead|head_point|ne|neck|neneck\d*)$/i.test(`${name ?? ''}`);
const hasSemanticPreviewHeadTarget = (names) =>
  ['he', 'head', 'hehead'].some((name) => names.has(name));

const getPreviewHeadInfluencingBoneNames = (container) => {
  const names = new Set();
  for (const mesh of container?.meshes ?? []) {
    const material = mesh?.material;
    const materials = Array.isArray(material?.subMaterials)
      ? material.subMaterials
      : [material];
    const isHeadMesh = materials.some((candidate) =>
      PREVIEW_CHARACTER_HEAD_MATERIAL_PATTERN.test(
        `${candidate?.name ?? ''}`.replace(/_mdf.*$/i, '')
      )
    );
    if (!isHeadMesh) {
      continue;
    }
    const skeleton = mesh?.skeleton ?? container?.skeletons?.[0];
    const bones = skeleton?.bones ?? [];
    const addWeightedBoneIndices = (indices = [], weights = []) => {
      indices = indices ?? [];
      weights = weights ?? [];
      const count = Math.min(indices.length, weights.length);
      for (let index = 0; index < count; index++) {
        if (Number(weights[index]) <= 0) {
          continue;
        }
        const boneName = normalizeAnimationTargetName(
          bones[Number(indices[index])]?.name
        );
        if (boneName) {
          names.add(boneName);
        }
      }
    };
    addWeightedBoneIndices(
      mesh.getVerticesData?.('matricesIndices'),
      mesh.getVerticesData?.('matricesWeights')
    );
    addWeightedBoneIndices(
      mesh.getVerticesData?.('matricesIndicesExtra'),
      mesh.getVerticesData?.('matricesWeightsExtra')
    );
  }
  return names;
};

const INTENTIONAL_SOLID_TEXTURES = new Set(['DERCH0001']);

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
  modelAvailabilityPromises = {};

  assetFallbacks = {};
  missingAssets = {};
  resolvedModelAssets = {};

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
    this.modelAvailabilityPromises = {};
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
    this.spawns[this.selectedSpawnId]?.demoteSelectedLiveAnimation?.();
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
    const nextSelectedSpawnId =
      spawn.__spireSpawnId ??
      spawn.id ??
      spawn.spawn2_id ??
      spawn.spawn_id ??
      null;
    if (this.selectedSpawnId !== nextSelectedSpawnId) {
      this.spawns[this.selectedSpawnId]?.demoteSelectedLiveAnimation?.();
    }
    this.selectedSpawnId = nextSelectedSpawnId;
    const selectedVisual = this.getSpawnVisual(spawn);
    if (selectedVisual?.staticPreviewPoseApplied) {
      void selectedVisual.promoteToLiveAnimation?.();
    }
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
    let fileBuffer = await this.gc.loadEQGltfFile?.(folder, file);
    if (!fileBuffer && folder === 'models') {
      fileBuffer = await this.gc.loadEQGltfFile?.('objects', file);
    }
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

  getStaleHeadOrientationMaterials(container) {
    return (container?.materials ?? []).filter((material) => {
      const policy = getCharacterHeadOrientationPolicy(material?.name);
      if (!policy.isCharacterHead) {
        return false;
      }
      const extras =
        material?.metadata?.gltf?.extras ??
        material?.metadata?.extras ??
        material?.metadata ??
        {};
      const exportedFlip = extras.spireSkinnedVFlipped;
      // Older GLBs did not record orientation metadata. Some of those files
      // already contain the correct conversion, so only an explicit mismatch
      // is safe to invalidate automatically.
      return (
        typeof exportedFlip === 'boolean' &&
        exportedFlip !== policy.geometryUvFlipped
      );
    });
  }

  getCharacterContainerExtras(container) {
    return [
      ...(container?.rootNodes ?? []),
      ...(container?.rootNodes ?? []).flatMap(
        (root) => root.getDescendants?.(false) ?? []
      ),
    ].map((node) =>
      node?.metadata?.gltf?.extras ??
      node?.metadata?.extras ??
      node?.metadata ??
      {}
    );
  }

  getStaleCharacterModelPolicy(container, file) {
    const modelName = `${file ?? ''}`.replace(/\.glb$/i, '').toLowerCase();
    if (
      !window.__spireSagePreview ||
      !/^[a-z0-9]{3}$/.test(modelName) ||
      (container?.skeletons?.length ?? 0) === 0
    ) {
      return null;
    }

    const extras = this.getCharacterContainerExtras(container);
    const policyExtras = extras.find((entry) =>
      Object.prototype.hasOwnProperty.call(entry, 'spireNativePoseOnly')
    );
    const playableAnimationCount = (container?.animationGroups ?? []).filter(
      (animationGroup) =>
        !POSE_ANIMATION_PATTERN.test(`${animationGroup?.name ?? ''}`) &&
        (animationGroup?.targetedAnimations?.length ?? 0) > 0
    ).length;

    if (
      playableAnimationCount === 0 &&
      policyExtras?.spireNativePoseOnly !== true
    ) {
      return policyExtras
        ? 'missing-playable-animation'
        : 'missing-native-pose-policy';
    }
    if (!policyExtras) {
      return 'missing-character-model-cache-metadata';
    }
    if (
      policyExtras &&
      policyExtras.spireCharacterModelCacheVersion !==
        PREVIEW_CHARACTER_MODEL_CACHE_VERSION
    ) {
      return 'stale-character-model-cache-version';
    }
    return null;
  }

  getMissingModelTextures(file) {
    if (!window.__spireSagePreview) {
      return [];
    }
    const key = `/eq/models/${file}`;
    return [
      ...new Set(window.__spireSageMissingModelTextures?.[key] ?? []),
    ];
  }

  async getFirstAssetContainer(folder, files, originalName, options = {}) {
    const {
      aliasFiles = [],
      generateIfMissing = false,
      optional = false,
      skipOrientationRefresh = false,
      skipCharacterPolicyRefresh = false,
      skipMissingTextureRefresh = false,
      skipMissingRefresh = false,
    } = options;
    const requestedFile = `${originalName}.glb`;
    const aliasFileSet = new Set(aliasFiles);
    for (const file of files) {
      const container = await this.getCachedAssetContainer(folder, file);
      if (container) {
        const characterPolicyRefreshReason =
          !skipCharacterPolicyRefresh && folder === 'models'
            ? this.getStaleCharacterModelPolicy(container, file)
            : null;
        const missingModelTextures =
          !skipMissingTextureRefresh && folder === 'models'
            ? this.getMissingModelTextures(file)
            : [];
        if (characterPolicyRefreshReason || missingModelTextures.length > 0) {
          const archiveModelName = `${file}`.replace(/\.glb$/i, '').toLowerCase();
          console.warn(
            `Refreshing ${archiveModelName} before first use`,
            characterPolicyRefreshReason ?? 'missing-model-textures',
            missingModelTextures
          );
          const generated = await processCharacterModelArchive(
            archiveModelName,
            { ...this.gc.settings, forceReload: true },
            this.gc.rootFileSystemHandle,
            null,
            [],
            { stopAfterFirstSuccessfulSource: true }
          );
          if (generated) {
            container.dispose?.();
            delete window.__spireSageMissingModelTextures?.[`/eq/models/${file}`];
            for (const candidate of files) {
              delete this.assetContainers[`${folder}/${candidate}`];
            }
            return this.getFirstAssetContainer(folder, files, originalName, {
              ...options,
              skipCharacterPolicyRefresh: true,
              skipMissingTextureRefresh: true,
            });
          }
        }
        const staleHeadMaterials =
          !skipOrientationRefresh &&
          window.__spireSagePreview &&
          folder === 'models'
            ? this.getStaleHeadOrientationMaterials(container)
            : [];
        if (staleHeadMaterials.length > 0) {
          const baseModelName =
            `${originalName ?? ''}`.toLowerCase().match(
              /^([a-z0-9]{3})(?:he\d{2})?$/
            )?.[1] ?? originalName;
          console.warn(
            `Refreshing ${baseModelName} because ${file} has stale head UV metadata`,
            staleHeadMaterials.map((material) => material.name)
          );
          const generated = await processCharacterModelArchive(
            baseModelName,
            { ...this.gc.settings, forceReload: true },
            this.gc.rootFileSystemHandle,
            null,
            [],
            { stopAfterFirstSuccessfulSource: true }
          );
          if (generated) {
            container.dispose?.();
            for (const candidate of files) {
              delete this.assetContainers[`${folder}/${candidate}`];
            }
            return this.getFirstAssetContainer(
              folder,
              files,
              originalName,
              { ...options, skipOrientationRefresh: true }
            );
          }
        }
        if (folder === 'models') {
          this.resolvedModelAssets[originalName] = `${file}`.replace(/\.glb$/i, '');
        }
        if (file !== requestedFile && !aliasFileSet.has(file)) {
          this.assetFallbacks[originalName] = file;
          console.warn(
            `Using fallback asset ${file} for missing ${originalName}.glb`
          );
        }
        return container;
      }
    }
    if (
      (!optional || generateIfMissing) &&
      !skipMissingRefresh &&
      window.__spireSagePreview &&
      folder === 'models'
    ) {
      const archiveModelName = getCharacterArchiveBaseModelName(originalName);
      const generated = await processCharacterModelArchive(
        archiveModelName,
        generateIfMissing
          ? { ...this.gc.settings, forceReload: true }
          : this.gc.settings,
        this.gc.rootFileSystemHandle,
        null,
        [],
        { stopAfterFirstSuccessfulSource: true }
      );
      if (generated) {
        for (const file of files) {
          delete this.assetContainers[`${folder}/${file}`];
          const container = await this.getCachedAssetContainer(folder, file);
          if (container) {
            return container;
          }
        }
      }
    }
    if (!optional) {
      this.missingAssets[originalName] = files;
    }
    return null;
  }

  async addPreviewAnimationDonor(modelName, modelContainer) {
    const donorName = PREVIEW_ANIMATION_DONORS[modelName];
    if (!donorName || !modelContainer || previewAnimationDonorDisabled()) {
      return;
    }
    if (modelContainer.__spirePreviewAnimationDonor?.donorName === donorName) {
      return;
    }
    const hasPlayableAnimation = modelContainer.animationGroups?.some(
      (animationGroup) =>
        !POSE_ANIMATION_PATTERN.test(`${animationGroup?.name ?? ''}`) &&
        animationGroup?.targetedAnimations?.length > 0
    );
    if (hasPlayableAnimation) {
      return;
    }

    // A focused race audit may not have exported the donor yet. Generate it
    // from its authoritative archive on demand instead of depending on a
    // previous zone/model run having warmed the browser cache.
    const donorContainer = await this.getAssetContainer(
      donorName,
      false,
      { generateIfMissing: true, optional: true }
    );
    if (!donorContainer) {
      modelContainer.__spirePreviewAnimationDonorFailureReason =
        'donor-container-missing';
      return;
    }
    const donorHasPlayableAnimation = donorContainer.animationGroups?.some(
      (animationGroup) =>
        !POSE_ANIMATION_PATTERN.test(`${animationGroup?.name ?? ''}`) &&
        animationGroup?.targetedAnimations?.length > 0
    );
    if (!donorHasPlayableAnimation) {
      modelContainer.__spirePreviewAnimationDonorFailureReason =
        'donor-has-no-playable-animation';
      return;
    }

    // AssetContainer only clones animation groups that were present during
    // import reliably. Keep the donor source alongside this container and
    // attach fresh groups to each instantiated spawn below. Validating or
    // animating this cached source container would let a donor appear healthy
    // while the visible clone remains in its bind pose.
    modelContainer.__spirePreviewAnimationDonor = {
      donorName,
      donorContainer,
    };
    delete modelContainer.__spirePreviewAnimationDonorFailureReason;
  }

  instantiateSpawnModel(modelName, modelContainer, nameFunction) {
    const instanceContainer = modelContainer.instantiateModelsToScene(
      nameFunction
    );
    // Babylon does not guarantee that arbitrary GLTF extras survive every
    // AssetContainer clone path. Preserve the exporter-approved native-pose
    // policy on the instance explicitly so live zone spawns make the same
    // animation decision as the structural race audit.
    instanceContainer.__spireNativePoseOnly =
      this.getCharacterContainerExtras(modelContainer).some(
        (entry) => entry.spireNativePoseOnly === true
      );
    const donor = modelContainer.__spirePreviewAnimationDonor ?? null;
    const donorDisabled = previewAnimationDonorDisabled();
    const donorEvidence = {
      expected: !!PREVIEW_ANIMATION_DONORS[modelName] && !donorDisabled,
      disabled: donorDisabled,
      donorName: donor?.donorName ?? PREVIEW_ANIMATION_DONORS[modelName] ?? null,
      failureReason:
        modelContainer.__spirePreviewAnimationDonorFailureReason ?? null,
      attachedGroupCount: 0,
      attachedTargetCount: 0,
      bindRelativeTargetCount: 0,
      bindLockedRotationTargetNames: [],
      unmatchedTargetNames: [],
      pass: !PREVIEW_ANIMATION_DONORS[modelName] || donorDisabled,
    };
    instanceContainer.__spirePreviewAnimationDonor = donorEvidence;
    instanceContainer.__spireResolvedModelAsset =
      this.resolvedModelAssets[modelName] ?? modelName;
    if (!donor?.donorContainer) {
      return instanceContainer;
    }

    const instanceNodes = [
      ...(instanceContainer.rootNodes ?? []),
      ...(instanceContainer.rootNodes ?? []).flatMap(
        (root) => root.getDescendants?.(false) ?? []
      ),
    ].filter(Boolean);
    const targetNodesByName = new Map();
    for (const node of instanceNodes) {
      const name = normalizeAnimationTargetName(node?.name);
      if (!name) {
        continue;
      }
      const candidates = targetNodesByName.get(name) ?? [];
      candidates.push(node);
      targetNodesByName.set(name, candidates);
    }
    const bindLockedRotationTargets = new Set(
      [...targetNodesByName.keys()].filter(isPreviewHeadOrNeckRotationTarget)
    );
    // Some Luclin-era skeletons expose only anonymous bone### names. In that
    // case, derive the complete head chain from the actual HE mesh weights and
    // preserve those bind rotations. This prevents a cross-race donor from
    // turning a correctly skinned face upside down while still animating the
    // torso and limbs.
    if (!hasSemanticPreviewHeadTarget(targetNodesByName)) {
      for (const boneName of getPreviewHeadInfluencingBoneNames(modelContainer)) {
        bindLockedRotationTargets.add(boneName);
      }
    }

    // A donor-marked source had no native playable clips. Discard any groups
    // opportunistically cloned from a prior cached mutation and recreate them
    // against the actual visible instance so ownership and targets are clear.
    const poseGroups = [];
    for (const animationGroup of instanceContainer.animationGroups ?? []) {
      if (POSE_ANIMATION_PATTERN.test(`${animationGroup?.name ?? ''}`)) {
        poseGroups.push(animationGroup);
      } else {
        animationGroup?.dispose?.();
      }
    }
    instanceContainer.animationGroups = poseGroups;

    const unmatchedTargetNames = new Set();
    const getPoseValues = (container) => {
      const values = new Map();
      const poseGroup = (container.animationGroups ?? []).find((group) =>
        POSE_ANIMATION_PATTERN.test(`${group?.name ?? ''}`)
      );
      const frame = Number(poseGroup?.from ?? 0);
      for (const targetedAnimation of poseGroup?.targetedAnimations ?? []) {
        const animation = targetedAnimation.animation;
        const targetName = normalizeAnimationTargetName(
          targetedAnimation.target?.name
        );
        const property = `${animation?.targetProperty ?? ''}`;
        const value = animation?.evaluate?.(frame);
        if (targetName && property && value !== undefined) {
          values.set(`${targetName}|${property}`, value?.clone?.() ?? value);
        }
      }
      return values;
    };
    const targetPoseValues = getPoseValues(modelContainer);
    const donorPoseValues = getPoseValues(donor.donorContainer);
    const bindLockedRotationTargetNames = new Set();
    const createBindRelativeAnimation = (animation, targetName) => {
      const property = `${animation?.targetProperty ?? ''}`;
      const key = `${targetName}|${property}`;
      const targetBase = targetPoseValues.get(key);
      const donorBase = donorPoseValues.get(key);
      if (!targetBase || !donorBase) {
        return null;
      }
      const retargetValue = (value) => {
        if (!value) {
          return value;
        }
        if (/rotationquaternion/i.test(property)) {
          if (bindLockedRotationTargets.has(targetName)) {
            bindLockedRotationTargetNames.add(targetName);
            return targetBase?.clone?.() ?? targetBase;
          }
          const donorInverse = BABYLON.Quaternion.Inverse(donorBase);
          return targetBase
            .multiply(donorInverse)
            .multiply(value)
            .normalize();
        }
        if (/position|translation/i.test(property)) {
          // Bone translations encode the donor's limb lengths. Applying even
          // their animated deltas to a different mesh stretches the hierarchy
          // and can move the head outside the body. Preserve the target model's
          // own local placement; rotation carries the visible motion safely.
          return targetBase?.clone?.() ?? targetBase;
        }
        if (/scal/i.test(property)) {
          return targetBase?.clone?.() ?? targetBase;
        }
        return value?.clone?.() ?? value;
      };
      const clonedAnimation = animation.clone();
      clonedAnimation.setKeys(
        (animation.getKeys?.() ?? []).map((animationKey) => ({
          ...animationKey,
          value: retargetValue(animationKey.value),
        }))
      );
      return clonedAnimation;
    };
    for (const donorGroup of donor.donorContainer.animationGroups ?? []) {
      if (POSE_ANIMATION_PATTERN.test(`${donorGroup?.name ?? ''}`)) {
        continue;
      }
      const animationGroup = new AnimationGroup(
        `Clone of ${`${donorGroup.name ?? ''}`.replace(/^Clone of /, '')}`,
        this.currentScene
      );
      animationGroup.metadata = {
        ...animationGroup.metadata,
        spirePreviewAnimationDonor: true,
        spirePreviewAnimationDonorName: donor.donorName,
      };
      for (const targetedAnimation of donorGroup.targetedAnimations ?? []) {
        const targetName = normalizeAnimationTargetName(
          targetedAnimation.target?.name
        );
        const candidates = targetNodesByName.get(targetName) ?? [];
        if (candidates.length !== 1) {
          unmatchedTargetNames.add(targetName || '<unnamed>');
          continue;
        }
        const bindRelativeAnimation = createBindRelativeAnimation(
          targetedAnimation.animation,
          targetName
        );
        if (!bindRelativeAnimation) {
          unmatchedTargetNames.add(`${targetName || '<unnamed>'}:bind-pose`);
          continue;
        }
        animationGroup.addTargetedAnimation(bindRelativeAnimation, candidates[0]);
        donorEvidence.bindRelativeTargetCount++;
      }
      if (animationGroup.targetedAnimations.length === 0) {
        animationGroup.dispose();
        continue;
      }
      instanceContainer.animationGroups.push(animationGroup);
      donorEvidence.attachedGroupCount++;
      donorEvidence.attachedTargetCount +=
        animationGroup.targetedAnimations.length;
    }
    donorEvidence.bindLockedRotationTargetNames = [
      ...bindLockedRotationTargetNames,
    ].sort();
    donorEvidence.unmatchedTargetNames = [...unmatchedTargetNames].sort();
    donorEvidence.pass =
      donorEvidence.attachedGroupCount > 0 &&
      donorEvidence.attachedTargetCount > 0 &&
      donorEvidence.bindRelativeTargetCount === donorEvidence.attachedTargetCount;
    return instanceContainer;
  }

  getAssetContainer(modelName, secondary = false, options = {}) {
    const key = `model/${modelName}/${
      secondary
        ? 'secondary'
        : options.generateIfMissing
          ? 'generated'
          : options.optional
            ? 'optional'
            : 'primary'
    }`;
    if (!this.assetContainers[key]) {
      const allowFallbackModels =
        !window.__spireSagePreview && !window.__spireSageStrictSpawnModels;
      const previewAlias =
        !secondary && window.__spireSagePreview
          ? PREVIEW_MODEL_ALIASES[modelName] ??
            PREVIEW_CLIENT_FALLBACKS[modelName]
          : null;
      const previewAliasFirst =
        previewAlias && PREVIEW_ALIAS_FIRST_MODELS.has(modelName);
      const files = secondary
        ? [`${modelName}.glb`]
        : previewAlias
          ? previewAliasFirst
            ? [`${previewAlias}.glb`, `${modelName}.glb`]
            : [`${modelName}.glb`, `${previewAlias}.glb`]
        : allowFallbackModels
          ? [
            `${modelName}.glb`,
            'hum.glb',
            'all.glb',
            'bea.glb',
            'zom.glb',
          ]
          : [`${modelName}.glb`];
      const previewObjectAlias =
        !secondary && window.__spireSagePreview
          ? PREVIEW_OBJECT_MODEL_ALIASES[modelName]
          : null;
      this.assetContainers[key] = (async () => {
        if (previewAliasFirst) {
          const generatedAliasContainer = await this.getFirstAssetContainer(
            'models',
            [`${previewAlias}.glb`],
            previewAlias,
            {
              generateIfMissing: true,
              optional: false,
            }
          );
          if (generatedAliasContainer) {
            this.resolvedModelAssets[modelName] = previewAlias;
            this.assetFallbacks[modelName] = `${previewAlias}.glb`;
            await this.addPreviewAnimationDonor(
              modelName,
              generatedAliasContainer
            );
            return generatedAliasContainer;
          }
        }
        const modelContainer = await this.getFirstAssetContainer(
          'models',
          files,
          modelName,
          {
            aliasFiles: previewAlias ? [`${previewAlias}.glb`] : [],
            generateIfMissing: !!options.generateIfMissing,
            optional         : secondary || !!options.optional,
          }
        );
        if (!secondary && window.__spireSagePreview && modelContainer) {
          await this.addPreviewAnimationDonor(modelName, modelContainer);
        }
        if (modelContainer || !previewObjectAlias) {
          return modelContainer;
        }
        const objectContainer = await this.getCachedAssetContainer(
          'objects',
          `${previewObjectAlias}.glb`
        );
        if (objectContainer) {
          delete this.missingAssets[modelName];
        }
        return objectContainer;
      })();
    }
    return this.assetContainers[key];
  }

  clearAssetContainer() {
    this.assetContainers = {};
    this.assetFallbacks = {};
    this.missingAssets = {};
    this.resolvedModelAssets = {};
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

  async addSpawn(modelName, models, loadToken = this.spawnLoadToken) {
    let loaded = 0;
    const spawnEntries = Object.values(models);
    const initializeEntry = async (spawnEntry) => {
      if (loadToken !== this.spawnLoadToken) {
        return;
      }
      let babylonSpawn = null;
      try {
        babylonSpawn = new BabylonSpawn(
          spawnEntry,
          modelName,
          this.zoneSpawnsNode,
          this.sphereMat
        );
        if (!(await babylonSpawn.initializeSpawn())) {
          babylonSpawn.dispose();
          return;
        }
        if (loadToken !== this.spawnLoadToken) {
          babylonSpawn.dispose();
          return;
        }
        this.spawns[spawnEntry.__spireSpawnId ?? spawnEntry.id] = babylonSpawn;
        loaded++;
      } catch (error) {
        babylonSpawn?.dispose?.();
        console.warn(
          `Error loading spawn model ${modelName} spawn ${spawnEntry?.id}: ${
            error?.message ?? error
          }\n${error?.stack ?? ''}`
        );
      }
      await yieldToBrowser();
    };

    if (!window.__spireSagePreview || spawnEntries.length <= 1) {
      for (const spawnEntry of spawnEntries) {
        await initializeEntry(spawnEntry);
        if (loadToken !== this.spawnLoadToken) {
          break;
        }
      }
      return loaded;
    }

    // Preview validation zones commonly contain hundreds of instances that
    // share one already-loaded model. A small worker pool keeps Babylon and
    // texture setup responsive while avoiding the multi-minute serial load and
    // the memory spike an unbounded Promise.all would create.
    let nextIndex = 0;
    const hardwareConcurrency = Number(window.navigator?.hardwareConcurrency) || 4;
    const workerCount = Math.min(
      12,
      Math.max(4, Math.floor(hardwareConcurrency * 0.75)),
      spawnEntries.length
    );
    const worker = async () => {
      while (loadToken === this.spawnLoadToken) {
        const index = nextIndex++;
        if (index >= spawnEntries.length) {
          return;
        }
        await initializeEntry(spawnEntries[index]);
      }
    };
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return loaded;
  }

  async deleteSpawn(spawn) {
    const spawnId = spawn?.__spireSpawnId ?? spawn?.id;
    const existingSpawn = this.spawns[spawnId];
    existingSpawn?.dispose();
    delete this.spawns[spawnId];
    if (this.selectedSpawnId === spawnId) {
      this.clearSpawnSelection();
    }
    if (window.__spireSagePreview && window.__spireSageSpawnStats) {
      const sceneChildren = this.zoneSpawnsNode?.getChildren?.() ?? [];
      const loadedSpawns = Object.values(this.spawns);
      window.__spireSageSpawnStats = {
        ...window.__spireSageSpawnStats,
        requested    : loadedSpawns.length,
        sourceCount  : loadedSpawns.length,
        loaded       : loadedSpawns.length,
        modelGroups  : new Set(loadedSpawns.map((entry) => entry.modelName)).size,
        rootNodeCount: sceneChildren.filter(
          (child) => child?.metadata?.spawnRoot === true
        ).length,
        sceneChildren: sceneChildren.length,
      };
    }
  }

  getSpawnModelCandidates(npcType) {
    if (!npcType) {
      return [];
    }
    const model = raceData.find((r) => Number(r.id) === Number(npcType.race));
    const gender =
      npcType.gender !== undefined &&
      npcType.gender !== null &&
      npcType.gender !== ''
        ? `${Number(npcType.gender)}`
        : null;
    const matchingRaces = model
      ? [
        model,
        ...raceData.filter(
          (candidate) =>
            Number(candidate.id) !== Number(model.id) &&
            `${candidate.name ?? ''}`.trim().toLowerCase() ===
              `${model.name ?? ''}`.trim().toLowerCase()
        ),
      ]
      : [];
    return [...new Set(matchingRaces.flatMap((candidate) => [
      gender ? candidate?.[gender] : null,
      candidate?.['2'],
      candidate?.['0'],
      candidate?.['1'],
    ]).filter(Boolean).map((entry) => entry.toLowerCase()))];
  }

  resolveSpawnModel(npcType) {
    return this.getSpawnModelCandidates(npcType)[0] ??
      (window.__spireSagePreview ? null : 'hum');
  }

  async resolveAvailableSpawnModel(npcType) {
    const candidates = this.getSpawnModelCandidates(npcType);
    for (const modelName of candidates) {
      this.modelAvailabilityPromises[modelName] ??= Promise.all([
        getEQFileExists('models', `${modelName}.glb`),
        getEQFileExists('objects', `${modelName}.glb`),
      ]).then((availability) => availability.some(Boolean));
      if (await this.modelAvailabilityPromises[modelName]) {
        return modelName;
      }
    }
    return candidates[0] ?? (window.__spireSagePreview ? null : 'hum');
  }

  async updateSpawn(spawn) {
    const firstSpawn = spawn.spawnentries?.[0]?.npc_type;
    if (!firstSpawn) {
      console.warn('Cannot update spawn without an associated NPC type', spawn);
      return;
    }
    const newSpawn = {
      ...firstSpawn,
      ...spawn,
    };
    const realModel = await this.resolveAvailableSpawnModel(firstSpawn);
    if (!realModel) {
      console.warn('Cannot update spawn without a resolved NPC model', spawn);
      return;
    }
    const restoreSelection = this.selectedSpawnId === spawn.id;
    this.spawns[spawn.id]?.dispose();
    delete this.spawns[spawn.id];
    await this.addSpawn(realModel, [newSpawn], this.spawnLoadToken);
    if (restoreSelection && this.spawns[spawn.id]) {
      this.selectSpawn(newSpawn);
    }
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

  isTPoseValidationExcludedModel(modelName) {
    return T_POSE_VALIDATION_EXCLUDED_MODELS.has(modelName);
  }

  collectSpawnVisualStats() {
    const nameplateEligibleModels = new Set();
      const stats = {
      spawnCount: Object.keys(this.spawns).length,
      materialSlotCount: 0,
      texturedSlotCount: 0,
      readyTextureCount: 0,
      pendingTextureCount: 0,
      fallbackTextureCount: 0,
      appearanceTexturePendingCount: 0,
      appearanceTextureDecodeFailureCount: 0,
      tinyTextureCount: 0,
      onePixelTextureCount: 0,
      belowGroundSpawnCount: 0,
      aboveGroundSpawnCount: 0,
      texturelessSpawnCount: 0,
      headTextureCount: 0,
      verticallyFlippedHeadTextureCount: 0,
      bodyVariantFallbackCount: 0,
      secondaryHeadBoneRemapFailureCount: 0,
      skeletonSpawnCount: 0,
      animatedSkeletonSpawnCount: 0,
      tPoseRiskCount: 0,
      motionlessAnimationCount: 0,
      staticPosedSkeletonSpawnCount: 0,
      selectedAnimationPromotionFailureCount: 0,
      animationBoundsRejectionCount: 0,
      animationHeadOrientationRejectionCount: 0,
      neutralIdleSelectionFailureCount: 0,
      nativePoseOnlySkeletonSpawnCount: 0,
      compactNativeArmNormalizationFailureCount: 0,
      nonFiniteBoneMatrixCount: 0,
      nonFiniteSkeletonSpawnCount: 0,
      bindPoseCloneGroupCount: 0,
      dynamicAnimationGroupCount: 0,
      detachedAnimationTargetCount: 0,
      retargetedAnimationTargetCount: 0,
      unresolvedAnimationTargetCount: 0,
      nonPlayingAnimationCount: 0,
      animationGroupCount: 0,
      playingAnimationGroupCount: 0,
      excessAnimationGroupCount: 0,
      nameplateExpectedCount: 0,
      nameplateCount: 0,
      nameplateVisibleCount: 0,
      nameplateTexturedCount: 0,
      nameplateAboveModelCount: 0,
        nameplateFailureCount: 0,
        nameplateEligibleSpawnCount: 0,
        nameplateEligibleModelCount: 0,
      byModel: {},
      texturelessSamples: [],
      pendingTextureSamples: [],
      fallbackTextureSamples: [],
      appearanceTextureDecodeFailureSamples: [],
      tinyTextureSamples: [],
      onePixelTextureSamples: [],
      headTextureSamples: [],
      bodyVariantFallbackSamples: [],
      secondaryHeadBoneRemapFailureSamples: [],
      belowGroundSamples: [],
      aboveGroundSamples: [],
      animationRiskSamples: [],
      animationBoundsRejectionSamples: [],
      animationHeadOrientationRejectionSamples: [],
      neutralIdleSelectionFailureSamples: [],
      selectedVisualAnimationSamples: [],
      animationRetargetingSamples: [],
      animationResourceSamples: [],
      nonFiniteBoneMatrixSamples: [],
      nameplateFailureSamples: [],
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
          appearanceTexturePendingCount: 0,
          appearanceTextureDecodeFailureCount: 0,
          tinyTextureCount: 0,
          onePixelTextureCount: 0,
          belowGroundSpawnCount: 0,
          aboveGroundSpawnCount: 0,
          texturelessSpawnCount: 0,
          headTextureCount: 0,
          verticallyFlippedHeadTextureCount: 0,
          bodyVariantFallbackCount: 0,
          secondaryHeadBoneRemapFailureCount: 0,
          skeletonSpawnCount: 0,
          animatedSkeletonSpawnCount: 0,
          tPoseRiskCount: 0,
          motionlessAnimationCount: 0,
          staticPosedSkeletonSpawnCount: 0,
          selectedAnimationPromotionFailureCount: 0,
          animationBoundsRejectionCount: 0,
          animationHeadOrientationRejectionCount: 0,
          neutralIdleSelectionFailureCount: 0,
          selectedVisualAnimationNames: [],
          nativePoseOnlySkeletonSpawnCount: 0,
          compactNativeArmNormalizationFailureCount: 0,
          nonFiniteBoneMatrixCount: 0,
          nonFiniteSkeletonSpawnCount: 0,
          bindPoseCloneGroupCount: 0,
          dynamicAnimationGroupCount: 0,
          detachedAnimationTargetCount: 0,
          retargetedAnimationTargetCount: 0,
          unresolvedAnimationTargetCount: 0,
          nonPlayingAnimationCount: 0,
          animationGroupCount: 0,
          playingAnimationGroupCount: 0,
          excessAnimationGroupCount: 0,
          nameplateExpectedCount: 0,
          nameplateCount: 0,
          nameplateVisibleCount: 0,
          nameplateTexturedCount: 0,
          nameplateAboveModelCount: 0,
          nameplateFailureCount: 0,
        };
      }
      const modelStats = stats.byModel[modelName];
      modelStats.spawns++;
      const appearanceTextureDecodeFailureCount = Number(
        spawn.appearanceTextureDecodeFailureCount ?? 0
      );
      if (appearanceTextureDecodeFailureCount > 0) {
        stats.appearanceTextureDecodeFailureCount +=
          appearanceTextureDecodeFailureCount;
        modelStats.appearanceTextureDecodeFailureCount +=
          appearanceTextureDecodeFailureCount;
        if (stats.appearanceTextureDecodeFailureSamples.length < 10) {
          stats.appearanceTextureDecodeFailureSamples.push({
            spawnId,
            modelName,
            textures: (spawn.appearanceTextureDecodeFailures ?? []).slice(0, 12),
          });
        }
      }
      if (
        spawn.selectedVisualAnimationName &&
        !modelStats.selectedVisualAnimationNames.includes(
          spawn.selectedVisualAnimationName
        )
      ) {
        modelStats.selectedVisualAnimationNames.push(
          spawn.selectedVisualAnimationName
        );
      }
      if (
        spawn.selectedVisualAnimationName &&
        stats.selectedVisualAnimationSamples.length < 30
      ) {
        stats.selectedVisualAnimationSamples.push({
          spawnId,
          modelName,
          selectedAnimation: spawn.selectedVisualAnimationName,
          neutralIdleCandidates: spawn.neutralIdleCandidateNames ?? [],
        });
      }
      if (spawn.neutralIdleSelectionPass === false) {
        stats.neutralIdleSelectionFailureCount++;
        modelStats.neutralIdleSelectionFailureCount++;
        if (stats.neutralIdleSelectionFailureSamples.length < 10) {
          stats.neutralIdleSelectionFailureSamples.push({
            spawnId,
            modelName,
            selectedAnimation: spawn.selectedVisualAnimationName,
            neutralIdleCandidates: spawn.neutralIdleCandidateNames ?? [],
          });
        }
      }
      if (
        spawn.bodyVariantFallback === true &&
        spawn.bodyVariantTextureFallbackApplied !== true
      ) {
        stats.bodyVariantFallbackCount++;
        modelStats.bodyVariantFallbackCount++;
        if (stats.bodyVariantFallbackSamples.length < 10) {
          stats.bodyVariantFallbackSamples.push({
            spawnId,
            modelName,
            requestedModelVariation: spawn.requestedModelVariation,
            loadedModelVariation: spawn.loadedModelVariation,
          });
        }
      }
      if (spawn.selectedAnimationPromotionFailed === true) {
        stats.selectedAnimationPromotionFailureCount++;
        modelStats.selectedAnimationPromotionFailureCount++;
      }
      if (spawn.animationBoundsRejected === true) {
        stats.animationBoundsRejectionCount++;
        modelStats.animationBoundsRejectionCount++;
        if (stats.animationBoundsRejectionSamples.length < 10) {
          stats.animationBoundsRejectionSamples.push({
            spawnId,
            modelName,
            fallbackSafe: spawn.animationBoundsFallbackSafe === true,
            boundsSafety: spawn.animationBoundsSafety ?? null,
          });
        }
        if (spawn.animationHeadOrientationRejected === true) {
          stats.animationHeadOrientationRejectionCount++;
          modelStats.animationHeadOrientationRejectionCount++;
          if (stats.animationHeadOrientationRejectionSamples.length < 10) {
            stats.animationHeadOrientationRejectionSamples.push({
              spawnId,
              modelName,
              boundsSafety: spawn.animationBoundsSafety ?? null,
            });
          }
        }
      }
      const secondaryHeadBoneRemapFailureCount = Number(
        spawn.secondaryHeadBoneRemapFailureCount ?? 0
      );
      if (secondaryHeadBoneRemapFailureCount > 0) {
        stats.secondaryHeadBoneRemapFailureCount +=
          secondaryHeadBoneRemapFailureCount;
        modelStats.secondaryHeadBoneRemapFailureCount +=
          secondaryHeadBoneRemapFailureCount;
        if (stats.secondaryHeadBoneRemapFailureSamples.length < 10) {
          stats.secondaryHeadBoneRemapFailureSamples.push({
            spawnId,
            modelName,
            failures: spawn.secondaryHeadBoneRemapFailures ?? [],
          });
        }
      }
      if (spawn.isNameplateEligible?.() !== false) {
        nameplateEligibleModels.add(modelName);
        stats.nameplateEligibleSpawnCount++;
      }
      if (spawn.nameplateRequired === true) {
        stats.nameplateExpectedCount++;
        modelStats.nameplateExpectedCount++;
        spawn.updateNameplatePosition?.();
        const nameplate = spawn.inspectNameplate?.() ?? {
          present: false,
          visible: false,
          textured: false,
          placement: { pass: false },
          pass: false,
        };
        if (nameplate.present) {
          stats.nameplateCount++;
          modelStats.nameplateCount++;
        }
        if (nameplate.visible) {
          stats.nameplateVisibleCount++;
          modelStats.nameplateVisibleCount++;
        }
        if (nameplate.textured) {
          stats.nameplateTexturedCount++;
          modelStats.nameplateTexturedCount++;
        }
        if (nameplate.placement?.pass) {
          stats.nameplateAboveModelCount++;
          modelStats.nameplateAboveModelCount++;
        }
        if (!nameplate.pass) {
          stats.nameplateFailureCount++;
          modelStats.nameplateFailureCount++;
          if (stats.nameplateFailureSamples.length < 10) {
            stats.nameplateFailureSamples.push({
              spawnId,
              modelName,
              ...nameplate,
            });
          }
        }
      }
      const animationRetargeting = spawn.animationRetargeting ?? {};
      const detachedAnimationTargetCount = Number(
        animationRetargeting.detachedTargetCount ?? 0
      );
      const retargetedAnimationTargetCount = Number(
        animationRetargeting.retargetedTargetCount ?? 0
      );
      const unresolvedAnimationTargetCount = Number(
        animationRetargeting.unresolvedTargetCount ?? 0
      );
      stats.detachedAnimationTargetCount += detachedAnimationTargetCount;
      stats.retargetedAnimationTargetCount += retargetedAnimationTargetCount;
      stats.unresolvedAnimationTargetCount += unresolvedAnimationTargetCount;
      modelStats.detachedAnimationTargetCount += detachedAnimationTargetCount;
      modelStats.retargetedAnimationTargetCount += retargetedAnimationTargetCount;
      modelStats.unresolvedAnimationTargetCount += unresolvedAnimationTargetCount;
      if (
        unresolvedAnimationTargetCount > 0 &&
        stats.animationRetargetingSamples.length < 10
      ) {
        stats.animationRetargetingSamples.push({
          spawnId,
          modelName,
          ...animationRetargeting,
        });
      }
      const missingModelTextures =
        window.__spireSageMissingModelTextures?.[`/eq/models/${modelName}.glb`] ??
        window.__spireSageMissingModelTextures?.[`/eq/objects/${modelName}.glb`] ??
        [];
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
        if (material.metadata?.spireAppearanceTexturePending === true) {
          stats.appearanceTexturePendingCount++;
          modelStats.appearanceTexturePendingCount++;
        }
        const textureReady = this.isTextureReady(texture);
        if (
          material.metadata?.spireAppearanceTextureDecodeFailed === true &&
          !textureReady
        ) {
          stats.appearanceTextureDecodeFailureCount++;
          modelStats.appearanceTextureDecodeFailureCount++;
          if (stats.appearanceTextureDecodeFailureSamples.length < 10) {
            stats.appearanceTextureDecodeFailureSamples.push({
              spawnId,
              modelName,
              textures: [material.name],
            });
          }
        }
        spawnTexturedSlots++;
        stats.texturedSlotCount++;
        modelStats.texturedSlotCount++;
        if (textureReady) {
          stats.readyTextureCount++;
          modelStats.readyTextureCount++;
        } else {
          const internalTexture =
            texture.getInternalTexture?.() ?? texture._texture ?? null;
          spawnPendingTextures++;
          stats.pendingTextureCount++;
          modelStats.pendingTextureCount++;
          if (stats.pendingTextureSamples.length < 10) {
            stats.pendingTextureSamples.push({
              spawnId,
              modelName,
              material: material.name,
              texture: texture.name ?? texture.url,
              url: texture.url ?? null,
              appearancePending:
                material.metadata?.spireAppearanceTexturePending === true,
              appearanceDecodeAttempts:
                material.metadata?.spireAppearanceTextureDecodeAttempts ?? null,
              appearanceDecodeLastError:
                material.metadata?.spireAppearanceTextureDecodeLastError ?? null,
              hasInternalTexture: Boolean(internalTexture),
              internalReady: internalTexture?.isReady ?? null,
              loadingError: internalTexture?._loadingError ?? null,
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
        if (/^[a-z0-9]{3}he(?:\d{2}|sk)\d{2}$/i.test(material.name ?? '')) {
          stats.headTextureCount++;
          modelStats.headTextureCount++;
          const requestedInvertY =
            texture._texture?._spireSageRequestedInvertY;
          const uploadInvertY =
            texture._texture?._spireSageUploadInvertY;
          const uploadOrientationMismatch =
            typeof requestedInvertY === 'boolean' &&
            typeof uploadInvertY === 'boolean' &&
            requestedInvertY !== uploadInvertY;
          const geometryUvFlipped =
            material.metadata?.gltf?.extras?.spireSkinnedVFlipped === true ||
            material.metadata?.extras?.spireSkinnedVFlipped === true ||
            material.metadata?.spireSkinnedVFlipped === true;
          const orientationPolicy =
            getCharacterHeadOrientationPolicy(material.name);
          const expectsGeometryUvFlip =
            orientationPolicy.geometryUvFlipped;
          const expectsRuntimeTextureVFlip =
            orientationPolicy.runtimeTextureVFlipped;
          const runtimeTextureVFlipped = Number(texture.vScale ?? 1) < 0;
          const expectedEffectiveVFlip =
            expectsGeometryUvFlip !== expectsRuntimeTextureVFlip;
          const effectiveVFlip =
            geometryUvFlipped !== runtimeTextureVFlipped;
          if (
            effectiveVFlip !== expectedEffectiveVFlip ||
            uploadOrientationMismatch
          ) {
            stats.verticallyFlippedHeadTextureCount++;
            modelStats.verticallyFlippedHeadTextureCount++;
          }
          if (stats.headTextureSamples.length < 20) {
            stats.headTextureSamples.push({
              ...textureSample,
              face: Number(spawn.spawnEntry?.face ?? spawn.spawn?.face ?? 0),
              helmTexture: Number(spawn.spawnEntry?.helmtexture ?? 0),
              invertY: texture.invertY,
              requestedInvertY,
              uploadInvertY,
              uploadOrientationMismatch,
              geometryUvFlipped,
              runtimeTextureVFlipped,
              expectsGeometryUvFlip,
              expectsRuntimeTextureVFlip,
              effectiveVFlip,
              expectedEffectiveVFlip,
              vOffset: texture.vOffset,
              vScale: texture.vScale,
            });
          }
        }
        if (
          material.metadata?.transparentTextureSentinel === true &&
          material.metadata?.transparentTextureSentinelSuppressed !== true
        ) {
          stats.tinyTextureCount++;
          modelStats.tinyTextureCount++;
          if (stats.tinyTextureSamples.length < 10) {
            stats.tinyTextureSamples.push(textureSample);
          }
        }
        if (
          ((width > 0 && width <= 1) || (height > 0 && height <= 1)) &&
          !INTENTIONAL_SOLID_TEXTURES.has(`${material?.name ?? ''}`.toUpperCase())
        ) {
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
      const skeletons = new Set(
        [root.skeleton, ...meshes.map((mesh) => mesh?.skeleton)].filter(Boolean)
      );
      let spawnNonFiniteBoneMatrixCount = 0;
      for (const skeleton of skeletons) {
        for (const bone of skeleton?.bones ?? []) {
          const values = bone?.getFinalMatrix?.()?.m ?? bone?._finalMatrix?.m;
          if (!values || values.length === 0) {
            continue;
          }
          const nonFiniteValueCount = Array.from(values).filter(
            (value) => !Number.isFinite(value)
          ).length;
          if (nonFiniteValueCount === 0) {
            continue;
          }
          spawnNonFiniteBoneMatrixCount += nonFiniteValueCount;
          if (stats.nonFiniteBoneMatrixSamples.length < 10) {
            stats.nonFiniteBoneMatrixSamples.push({
              spawnId,
              modelName,
              bone: bone.name,
              nonFiniteValueCount,
            });
          }
        }
      }
      if (spawnNonFiniteBoneMatrixCount > 0) {
        stats.nonFiniteBoneMatrixCount += spawnNonFiniteBoneMatrixCount;
        stats.nonFiniteSkeletonSpawnCount++;
        modelStats.nonFiniteBoneMatrixCount += spawnNonFiniteBoneMatrixCount;
        modelStats.nonFiniteSkeletonSpawnCount++;
      }
      const animationGroups = spawn.animationGroups ?? [];
      const playableGroups = animationGroups.filter(
        (animationGroup) =>
          !this.isPoseAnimationGroup(animationGroup) &&
          animationGroup?.targetedAnimations?.length > 0
      );
      const playingGroups = playableGroups.filter((animationGroup) =>
        this.isAnimationGroupPlaying(animationGroup)
      );
      const animationVitality = inspectAnimationSetVitality(animationGroups);
      const poseGroup = animationGroups.find((animationGroup) =>
        this.isPoseAnimationGroup(animationGroup)
      ) ?? null;
      const playingVitality = playingGroups.map((animationGroup) =>
        inspectAnimationGroupVitality(animationGroup, poseGroup)
      );
      const hasPlayingVisualPose = playingVitality.some(
        (group) => group.hasVisualPose
      );
      stats.animationGroupCount += playableGroups.length;
      modelStats.animationGroupCount += playableGroups.length;
      stats.playingAnimationGroupCount += playingGroups.length;
      modelStats.playingAnimationGroupCount += playingGroups.length;
      if (playableGroups.length > 1) {
        const excessGroupCount = playableGroups.length - 1;
        stats.excessAnimationGroupCount += excessGroupCount;
        modelStats.excessAnimationGroupCount += excessGroupCount;
        if (stats.animationResourceSamples.length < 10) {
          stats.animationResourceSamples.push({
            spawnId,
            modelName,
            playableGroupCount: playableGroups.length,
            selectedAnimation: spawn.selectedVisualAnimationName,
          });
        }
      }
      stats.bindPoseCloneGroupCount += animationVitality.bindPoseCloneGroupCount;
      modelStats.bindPoseCloneGroupCount +=
        animationVitality.bindPoseCloneGroupCount;
      stats.dynamicAnimationGroupCount += animationVitality.dynamicGroupCount;
      modelStats.dynamicAnimationGroupCount +=
        animationVitality.dynamicGroupCount;

      if (hasSkeleton && !T_POSE_VALIDATION_EXCLUDED_MODELS.has(modelName)) {
        stats.skeletonSpawnCount++;
        modelStats.skeletonSpawnCount++;
        if (spawn.neutralIdleSelectionPass === false) {
          stats.tPoseRiskCount++;
          modelStats.tPoseRiskCount++;
          if (stats.animationRiskSamples.length < 10) {
            stats.animationRiskSamples.push({
              spawnId,
              modelName,
              reason: 'non-neutral-idle-selected',
              selectedAnimation: spawn.selectedVisualAnimationName,
              neutralIdleCandidates: spawn.neutralIdleCandidateNames ?? [],
            });
          }
        } else if (spawnNonFiniteBoneMatrixCount > 0) {
          stats.tPoseRiskCount++;
          modelStats.tPoseRiskCount++;
          if (stats.animationRiskSamples.length < 10) {
            stats.animationRiskSamples.push({
              spawnId,
              modelName,
              reason: 'non-finite-runtime-bone-matrix',
              nonFiniteValueCount: spawnNonFiniteBoneMatrixCount,
            });
          }
        } else if (
          spawn.nativePoseOnly &&
          COMPACT_NATIVE_ARM_NORMALIZATION_MODELS.has(modelName) &&
          spawn.compactNativeArmNeutralized !== true
        ) {
          stats.tPoseRiskCount++;
          stats.compactNativeArmNormalizationFailureCount++;
          modelStats.tPoseRiskCount++;
          modelStats.compactNativeArmNormalizationFailureCount++;
          if (stats.animationRiskSamples.length < 10) {
            stats.animationRiskSamples.push({
              spawnId,
              modelName,
              reason: 'compact-native-arm-normalization-not-applied',
              targetCount: spawn.compactNativeArmTargetCount ?? 0,
            });
          }
        } else if (spawn.nativePoseOnly && spawn.staticPreviewPoseApplied) {
          stats.staticPosedSkeletonSpawnCount++;
          modelStats.staticPosedSkeletonSpawnCount++;
          stats.nativePoseOnlySkeletonSpawnCount++;
          modelStats.nativePoseOnlySkeletonSpawnCount++;
        } else if (playableGroups.length === 0) {
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
        } else if (!hasPlayingVisualPose) {
          stats.tPoseRiskCount++;
          stats.motionlessAnimationCount++;
          modelStats.tPoseRiskCount++;
          modelStats.motionlessAnimationCount++;
          if (stats.animationRiskSamples.length < 10) {
            stats.animationRiskSamples.push({
              spawnId,
              modelName,
              reason: 'playing-animation-matches-bind-pose',
              playingGroups: playingVitality,
              animationVitality: {
                playableGroupCount: animationVitality.playableGroupCount,
                dynamicGroupCount: animationVitality.dynamicGroupCount,
                visuallyPosedGroupCount:
                  animationVitality.visuallyPosedGroupCount,
                bindPoseCloneGroupCount:
                  animationVitality.bindPoseCloneGroupCount,
              },
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

    stats.nameplateEligibleModelCount = nameplateEligibleModels.size;
    return stats;
  }

  async addSpawns(spawns, skipDispose = false) {
    if (!this.currentScene) {
      return;
    }
    const loadToken = skipDispose
      ? this.spawnLoadToken
      : ++this.spawnLoadToken;

    this.zoneSpawnsNode = this.currentScene?.getNodeById('zone-spawns');
    if (!this.zoneSpawnsNode) {
      this.zoneSpawnsNode = new TransformNode('zone-spawns', this.currentScene);
    }
    this.zoneSpawnsNode.setEnabled(true);
    this.zoneSpawnsNode.id = 'zone-spawns';
    this.clearPostLoadGroundSnapTimers();
    if (!skipDispose) {
      this.clearSpawnSelection();
      for (const spawn of Object.values(this.spawns)) {
        spawn?.dispose?.();
      }
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
      const realModel = await this.resolveAvailableSpawnModel(firstSpawn);
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

    if (typeof window !== 'undefined' && window.__spireSagePreview) {
      window.__spireSageBulkSpawnLoading = true;
      window.__spireSageSkipBulkNameplates = new URLSearchParams(
        window.location.search
      ).has('sageValidateZones');
    }
    try {
      for (const [modelName, models] of Object.entries(spawnList)) {
        if (loadToken !== this.spawnLoadToken) {
          return;
        }
        this.actions.setLoadingText(
          `Loaded ${loadedCount} of ${count} spawns`
        );
        const loadedForModel = await this.addSpawn(modelName, models, loadToken);
        if (loadToken !== this.spawnLoadToken) {
          return;
        }
        loadedCount += loadedForModel;
        this.actions.setLoadingText(
          `Loaded ${loadedCount} of ${count} spawns`
        );
        await yieldToBrowser();
      }
      if (typeof window !== 'undefined' && window.__spireSagePreview) {
        window.__spireSageBulkSpawnLoading = false;
        const loadedSpawns = Object.values(this.spawns);
        const scene = this.currentScene;
        const animationsWereEnabled = scene?.animationsEnabled !== false;
        if (scene) {
          scene.animationsEnabled = false;
        }
        try {
          for (let index = 0; index < loadedSpawns.length; index++) {
            if (loadToken !== this.spawnLoadToken) {
              return;
            }
            if (loadedSpawns[index].previewAnimationDeferred) {
              const loadedSpawn = loadedSpawns[index];
              loadedSpawn.startInitialAnimation({
                skipGroundNormalization: true,
                schedulePostInitialize: false,
              });
            }
            if (loadedSpawns[index].previewNameplateDeferred) {
              loadedSpawns[index].createNameplate({
                validationRepresentative: true,
              });
            }
            if (index % 50 === 49) {
              await yieldToBrowser();
            }
          }
        } finally {
          if (scene) {
            scene.animationsEnabled = animationsWereEnabled;
          }
        }
      }
    } finally {
      if (typeof window !== 'undefined' && window.__spireSagePreview) {
        window.__spireSageBulkSpawnLoading = false;
        window.__spireSageSkipBulkNameplates = false;
      }
      if (typeof window !== 'undefined' && window.__spireSagePreview) {
        const sceneChildren = this.zoneSpawnsNode?.getChildren?.() ?? [];
        const loadedSpawns = Object.values(this.spawns);
        const currentSpawnCount = skipDispose
          ? loadedSpawns.length
          : loadedCount;
        const stats = {
          requested: skipDispose ? currentSpawnCount : count,
          sourceCount: skipDispose ? currentSpawnCount : spawns.length,
          modelGroups: skipDispose
            ? new Set(loadedSpawns.map((entry) => entry.modelName)).size
            : Object.keys(spawnList).length,
          loaded: currentSpawnCount,
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
      if (loadToken === this.spawnLoadToken) {
        GlobalStore.actions.setLoading(false);
      }
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
      const currentSpawnData = spawn.spawnEntry;
      if (currentSpawnData && typeof currentSpawnData === 'object') {
        Object.assign(currentSpawnData, infSpawn);
      } else {
        spawn.spawnEntry = infSpawn;
      }
      const synchronizedSpawn = spawn.spawnEntry ?? infSpawn;
      spawn.metadata = {
        ...(spawn.metadata ?? {}),
        spawn: synchronizedSpawn,
      };
      const spawnNodes = [
        spawn.rootNode,
        ...(spawn.rootNode?.getChildMeshes?.(false) ?? []),
        spawn.instance,
        spawn.nameplateMesh,
      ].filter(Boolean);
      for (const node of spawnNodes) {
        node.metadata = {
          ...(node.metadata ?? {}),
          spawn: synchronizedSpawn,
        };
      }
      spawn.rootNode.position.set(infSpawn.y, infSpawn.z, infSpawn.x);
      spawn.rootNode.metadata = {
        ...(spawn.rootNode.metadata ?? {}),
        preserveRequestedGroundY: true,
      };
      spawn.normalizeToSpawnGround?.(infSpawn.z, { snapToZone: false });
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
