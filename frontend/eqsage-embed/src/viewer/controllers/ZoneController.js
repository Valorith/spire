import BABYLON from '@bjs';
import { GameControllerChild } from './GameControllerChild';
import { optimizeBoundingBoxes } from 'sage-core/s3d/bsp/region-utils';
import { getEQFile, writeEQFile } from 'sage-core/util/fileHandler';
import { GlobalStore } from '../../state';
import { assetUrl } from '../../embed-config';
import { createGltfTransformIo, loadGltfTransformModules } from '../../util/gltf-transform';
import { clampFlySpeed } from '../common/cameraSettings';
import {
  applyTextureAnimationFrame,
  getMaterialBaseColorTexture,
  resolveTextureAnimationFrameUrl,
} from '../helpers/textureAnimation';

const {
  Color3,
  Color4,
  Vector3,
  Texture,
  TransformNode,
  Mesh,
  StandardMaterial,
  PointLight,
  HemisphericLight,
  PointerEventTypes,
  SceneLoader,
  Tools,
  Scene,
  MeshBuilder,
  GlowLayer,
  Color3Gradient,
  CubeTexture,
  VertexData,
  SubMesh,
  MultiMaterial,
  GLTF2Export,
  STLExport,
} = BABYLON;

const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));
const scheduleZoneLoadCallback = (callback) => {
  setTimeout(() => {
    Promise.resolve()
      .then(() => callback())
      .catch((error) => {
        console.warn('Error running zone load callback', error);
      });
  }, 0);
};
const createCancelledZoneLoadError = () => {
  const error = new Error('Zone load was cancelled');
  error.name = 'AbortError';
  return error;
};
const isSceneDisposed = (scene) =>
  typeof scene?.isDisposed === 'function'
    ? scene.isDisposed()
    : Boolean(scene?.isDisposed);
const logPreviewZoneLoad = (...args) => {
  if (window.__spireSagePreview) {
    console.log('[SageZoneLoad]', ...args);
  }
};

const hasBoundaryMaterial = (material) => {
  if (!material) {
    return false;
  }

  const materialName = `${material.name ?? ''}`;
  return (
    /^m000\d+/i.test(materialName) ||
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

const isBoundaryMesh = (mesh) => {
  if (!mesh) {
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

const isPassThroughMesh = (mesh) => {
  if (!mesh) {
    return false;
  }

  const meshName = `${mesh.name ?? ''}`;
  if (/-passthrough(?:$|[._-])/i.test(meshName)) {
    return true;
  }

  const material = mesh.material;
  if (hasPassThroughMaterial(material)) {
    return true;
  }
  return material?.subMaterials?.some?.(hasPassThroughMaterial) === true;
};

const isHiddenZoneMesh = (mesh) =>
  isBoundaryMesh(mesh) || isPassThroughMesh(mesh);

const reframePreviewCamera = (camera, zoneMesh) => {
  if (!window.__spireSagePreview || !camera || !zoneMesh) {
    return;
  }

  try {
    zoneMesh.computeWorldMatrix?.(true);
    zoneMesh.refreshBoundingInfo?.(true, true);
    const boundingBox = zoneMesh.getBoundingInfo?.()?.boundingBox;
    const center = boundingBox?.centerWorld;
    const minimum = boundingBox?.minimumWorld;
    const maximum = boundingBox?.maximumWorld;
    if (!center || !minimum || !maximum) {
      return;
    }

    const span = maximum.subtract(minimum);
    const maxDimension = Math.max(span.x, span.y, span.z, 1);
    const diagonal = Math.max(span.length(), maxDimension);
    const distance = Math.max(diagonal * 0.42, maxDimension * 0.7, 125);
    const verticalOffset = Math.max(span.y * 1.1, distance * 0.32, 60);
    camera.position.set(
      center.x + distance,
      center.y + verticalOffset,
      center.z + distance
    );
    camera.maxZ = Math.max(camera.maxZ ?? 10000, distance * 4);
    camera.speed = clampFlySpeed(camera.speed);

    camera.setTarget(center);
    window.__spireSageCameraFraming = {
      mode: 'overview',
      camera: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      },
      target: {
        x: center.x,
        y: center.y,
        z: center.z,
      },
      zoneCenter: {
        x: center.x,
        y: center.y,
        z: center.z,
      },
      zoneExtents: {
        x: span.x,
        y: span.y,
        z: span.z,
      },
    };
  } catch (error) {
    console.warn('[SageCamera] failed to reframe preview camera', error);
  }
};

class ZoneController extends GameControllerChild {
  /**
   * @type {import('@babylonjs/core/scene').Scene}
   */
  scene = null;
  hadStoredScene = false;
  zoneLoaded = false;
  zoneName = '';
  zoneMetadata = {};
  aabbTree = {};
  animatedMeshes = [];
  animationGroupMap = {};
  collideCounter = 0;
  objectAnimationPlaying = [];
  lastPosition = new Vector3(0, 0, 0);
  animationRange = 200;
  /** @type {RecastJSPlugin} */
  navigationPlugin = null;
  pointerObserver = null;
  renderObserver = null;
  loadGeneration = 0;

  loadCallbacks = [];
  clickCallbacks = [];

  /**
   * @type {Object.<string, Promise<AssetContainer>}
   */
  assetContainers = {};

  addClickCallback = (cb) => {
    this.clickCallbacks.push(cb);
  };
  removeClickCallback = (cb) => {
    this.clickCallbacks = this.clickCallbacks.filter((l) => l !== cb);
  };

  addLoadCallback = (cb, options = {}) => {
    if (!this.loadCallbacks.includes(cb)) {
      this.loadCallbacks.push(cb);
    }
    if (this.zoneLoaded && !options.skipImmediate) {
      scheduleZoneLoadCallback(cb);
    }
  };
  removeLoadCallback = (cb) => {
    this.loadCallbacks = this.loadCallbacks.filter((l) => l !== cb);
  };
  cancelPendingLoad = () => {
    this.loadGeneration += 1;
    this.zoneLoaded = false;
  };
  dispose() {
    this.SpawnController.dispose();
    if (this.scene) {
      if (this.pointerObserver) {
        this.scene.onPointerObservable.remove(this.pointerObserver);
      }
      if (this.renderObserver) {
        this.scene.onBeforeRenderObservable.remove(this.renderObserver);
      }
      this.scene.dispose();
    }
    this.pointerObserver = null;
    this.renderObserver = null;
    this.scene = null;
    this.hadStoredScene = false;
    this.zoneLoaded = false;
    this.zoneName = '';
    this.zoneMetadata = {};
    this.aabbTree = {};
    this.animatedMeshes = [];
    this.animationGroupMap = {};
    this.collideCounter = 0;
    this.objectAnimationPlaying = [];
    this.lastPosition = new Vector3(0, 0, 0);

    this.zoneLoaded = false;
  }
  async exportSTL(name) {
    const zone =
      this.currentScene.getMeshByName('zone') ??
      this.currentScene.getMeshByName('__root__');
    const objects =
      this.currentScene.getNodeByName('static-objects')?.getChildMeshes() ?? [];
    const zoneChildren = zone.getChildMeshes(false);
    const objectsChildren = zone.getChildMeshes(false);

    STLExport.CreateSTL(
      [zone, ...objects, ...zoneChildren, ...objectsChildren],
      true,
      `${name}`,
      undefined,
      undefined,
      false
    );
  }
  exportZone(name) {
    GlobalStore.actions.setLoading(true);
    GlobalStore.actions.setLoadingTitle(`Exporting zone ${name}`);
    GlobalStore.actions.setLoadingText('LOADING, PLEASE WAIT...');
    const staticObjects = this.objectContainer?.getChildMeshes() ?? [];
    const exportObjects = this.gc.settings.exportObjects;
    GLTF2Export.GLBAsync(this.scene, name, {
      shouldExportNode(node) {
        while (node.parent) {
          node = node.parent;
        }
        return exportObjects
          ? node.name === '__root__' ||
              node.name.startsWith('zone') ||
              staticObjects.includes(node) ||
              node.name === 'static-objects'
          : node.name === '__root__' || node.name.startsWith('zone');
      },
      shouldExportAnimation() {
        return false;
      },
    })
      .then(async (glb) => {
        GlobalStore.actions.setLoadingTitle(`Optimizing ${name}`);
        GlobalStore.actions.setLoadingText('Applying GLB optimizations');
        let blob = Object.values(glb.glTFFiles)[0];
        try {
          const arr = new Uint8Array(await blob.arrayBuffer());
          const io = await createGltfTransformIo();
          const { dedup, prune, textureCompress } =
            await loadGltfTransformModules();
          const doc = await io.readBinary(arr);
          await doc.transform(
            dedup(),
            prune(),
            textureCompress({
              targetFormat: 'png',
            })
          );
          const bin = await io.writeBinary(doc);
          blob = new Blob([bin]);
        } catch (e) {
          console.warn(e);
        }

        const assetUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = assetUrl;
        link.download = `${name}.glb`;
        link.click();
      })
      .finally(() => {
        GlobalStore.actions.setLoading(false);
      });
  }

  loadViewerScene() {
    this.dispose();
    this.scene = null;
    if (!this.engine || !this.canvas || !this.gc.engineInitialized) {
      return;
    }
    this.scene = new Scene(this.engine);
    this.scene.onPointerDown = this.sceneMouseDown;
    this.scene.onPointerUp = this.sceneMouseUp;

    const zoneInfo = this.state.zoneInfo ?? {};
    const safePoint = [zoneInfo.safe_x, zoneInfo.safe_y, zoneInfo.safe_z].map(Number);
    if (window.__spireSagePreview && safePoint.every((coordinate) => Number.isFinite(coordinate))) {
      this.CameraController.createCamera();
    } else {
      this.CameraController.createCamera(new Vector3(0, 250, 0));
      this.CameraController.camera.rotation = new Vector3(1.57, 1.548, 0);
    }
    if (window.__spireSagePreview) {
      this.glowLayer = {
        intensity: 0,
        addIncludedOnlyMesh() {},
        removeIncludedOnlyMesh() {},
      };
    } else {
      const glowLayer = new GlowLayer('glow', this.scene, {
        blurKernelSize: 10,
      });
      this.glowLayer = glowLayer;
      glowLayer.intensity = this.gc.settings?.glow === false ? 0 : 0.7;
      glowLayer.customEmissiveColorSelector = function (
        mesh,
        subMesh,
        material,
        result
      ) {
        if (mesh?.metadata?.emissiveColor) {
          result.set(
            mesh?.metadata?.emissiveColor.r,
            mesh?.metadata?.emissiveColor.g,
            mesh?.metadata?.emissiveColor.b,
            0.5
          );
          if (mesh?.metadata?.occludedColor) {
            if (mesh.isOccluded) {
              result.set(
                mesh?.metadata?.occludedColor.r,
                mesh?.metadata?.occludedColor.g,
                mesh?.metadata?.occludedColor.b,
                0.5
              );
            }
          }
          if (mesh?.metadata?.onlyOccluded) {
            if (mesh.isOccluded) {
              result.set(
                mesh?.metadata?.emissiveColor.r,
                mesh?.metadata?.emissiveColor.g,
                mesh?.metadata?.emissiveColor.b,
                0.5
              );
            } else {
              result.set(
                mesh?.metadata?.emissiveColor.r,
                mesh?.metadata?.emissiveColor.g,
                mesh?.metadata?.emissiveColor.b,
                0.0
              );
            }
          }
        }
      };
    }
    this.regionMaterial = new StandardMaterial('region-material', this.scene);

    this.regionMaterial.alpha = 0.3;
    this.regionMaterial.diffuseColor = new Color3(0, 127, 65); // Red color
    this.regionMaterial.emissiveColor = new Color4(0, 127, 65, 0.3); // Red color
    if (!window.__spireSagePreview) {
      const hdrTexture = CubeTexture.CreateFromPrefilteredData(
        assetUrl('static/environment.env'),
        this.scene
      );
      this.scene.environmentTexture = hdrTexture;
      this.scene.environmentIntensity = 1.0;
    }

    // Click events
    if (this.pointerObserver) {
      this.scene.onPointerObservable.remove(this.pointerObserver);
    }
    this.pointerObserver = this.scene.onPointerObservable.add(this.onClick);

    // Setups
    this.SpawnController.setupSpawnController();

    return true;
  }

  /**
   *
   * @param {PointerInfo} pointerInfo
   */
  onClick = (pointerInfo) => {
    switch (pointerInfo.type) {
      case PointerEventTypes.POINTERDOWN:
        const spawn = pointerInfo.pickInfo.pickedMesh?.metadata?.spawn;
        if (
          pointerInfo.pickInfo.hit &&
          spawn &&
          typeof spawn === 'object'
        ) {
          this.clickCallbacks.forEach((c) =>
            c(spawn)
          );
        }
        break;
      default:
        break;
    }
  };

  renderHook = () => {
    if (window.aabbPerf === undefined) {
      window.aabbPerf = 0;
    }
    if (window.aabbs === undefined) {
      window.aabbs = [];
    }
    this.skybox.position = this.CameraController.camera.position;
  };

  showRegions(value) {
    this.regionsShown = value;
    this.scene?.getNodeById('regions')?.setEnabled(value);
  }

  moveSpawn(spawn) {
    if (!spawn) {
      return;
    }
    const spawnMesh = this.scene?.getMeshById(`zone-spawn-${spawn.id}`);
    if (spawnMesh) {
      spawnMesh.position.x = spawn.y;
      spawnMesh.position.y = spawn.z;
      spawnMesh.position.z = spawn.x;
      spawnMesh.metadata = { spawn };
    }
  }

  pickRaycastForLoc(callback) {
    const zoneMesh = this.scene.getMeshByName('zone');
    if (!zoneMesh) {
      return;
    }

    zoneMesh.isPickable = true;

    // Create node for moving
    const raycastMesh = MeshBuilder.CreateSphere(
      'raycast-sphere',
      { diameter: 3, segments: 32 },
      this.scene
    );
    const pointLight = new PointLight(
      'pointLight',
      new Vector3(0, 10, 0),
      this.scene
    );
    // pointLight.parent = raycastMesh;
    // Set the intensity of the point light
    pointLight.intensity = 500.0;
    pointLight.range = 300;
    pointLight.radius = 50;

    // Optional: Adjust other properties like the light's color
    pointLight.diffuse = new Color3(1, 1, 1); // White light
    pointLight.position = raycastMesh.position;
    const material = new StandardMaterial('raycast-sphere', this.scene);

    material.emissiveColor = new Color3(1, 1, 0);
    raycastMesh.material = material;
    let chosenLocation = null;

    const tooltip = document.createElement('div');
    tooltip.className = 'raycast-tooltip';
    document.body.appendChild(tooltip);

    const mouseMove = (e) => {
      // Calculate the pick ray from the camera position and mouse position

      const pickResult = this.scene.pick(
        this.scene.pointerX,
        this.scene.pointerY,
        null,
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
        // Perform actions based on the hit
        const hitPoint = pickResult.pickedPoint;
        raycastMesh.position.set(hitPoint.x, hitPoint.y + 5, hitPoint.z);
        chosenLocation = { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z };

        tooltip.style.left = `${e.pageX - tooltip.clientWidth / 2}px`;
        tooltip.style.top = `${e.pageY + tooltip.clientHeight / 2}px`;
        tooltip.innerHTML = `<p>[T] to commit - [Escape] to cancel</p><p>X: ${hitPoint.z.toFixed(
          2
        )}, Y: ${hitPoint.x.toFixed(2)}, Z: ${hitPoint.y.toFixed(2)}</p>`;
      }
    };
    const self = this;
    function finish(loc) {
      window.removeEventListener('keydown', keyHandler);
      self.canvas.removeEventListener('mousemove', mouseMove);
      zoneMesh.isPickable = false;
      raycastMesh.dispose();
      pointLight.dispose();
      document.body.removeChild(tooltip);
      callback(loc);
    }
    function keyHandler(e) {
      if (e.key === 'Escape') {
        finish(null);
      }

      if (e.key?.toLowerCase() === 't') {
        finish(chosenLocation);
      }
    }
    window.addEventListener('keydown', keyHandler);
    this.canvas.addEventListener('mousemove', mouseMove);
  }

  setFlySpeed(value) {
    this.cameraFlySpeed = clampFlySpeed(value);
    if (!this.CameraController?.camera) {
      return;
    }
    this.CameraController.camera.speed = this.cameraFlySpeed;
  }

  setClipPlane(value) {
    if (!this.CameraController?.camera || !this.skybox) {
      return;
    }
    this.CameraController.camera.maxZ = value;
    const scaleValue = value / 10000;
    this.skybox.scaling.setAll(scaleValue);
  }

  setGlow(value) {
    if (!this.glowLayer) {
      return;
    }
    this.glowLayer.intensity = value ? 0.7 : 0;
    if (value) {
    } else {
    }
  }

  mergeMeshesWithMaterials = (meshes, scene) => {
    // Prepare arrays for the merged mesh data
    const positions = [];
    const indices = [];
    const normals = [];
    const uvs = [];
    let currentIndex = 0;

    // Store the submesh data
    const subMeshes = [];
    const materials = [];

    // Create a new mesh for the merged result
    const newMergedMesh = new Mesh('mergedMesh', scene);

    // Iterate through each mesh
    meshes.forEach((mesh) => {
      // Ensure the mesh has been updated (i.e., make sure the vertex data is up to date)
      mesh.bakeCurrentTransformIntoVertices();

      // Get the vertex data
      const vertexData = VertexData.ExtractFromMesh(mesh);

      // Store the material of the current mesh
      materials.push(mesh.material);

      // Push the vertex data into our arrays
      const vertexStart = currentIndex;
      const indexStart = indices.length;

      positions.push(...vertexData.positions);
      normals.push(...vertexData.normals);
      uvs.push(...vertexData.uvs);

      // Adjust the indices and add them
      const adjustedIndices = vertexData.indices.map(
        (index) => index + currentIndex
      );
      indices.push(...adjustedIndices);

      // Create a new submesh for the current mesh
      subMeshes.push(
        new SubMesh(
          materials.length - 1, // materialIndex
          vertexStart, // verticesStart
          vertexData.positions.length / 3, // verticesCount
          indexStart, // indexStart
          adjustedIndices.length, // indexCount
          mesh
        )
      );

      // Update the current index
      currentIndex += vertexData.positions.length / 3;
    });

    // Create vertex data for the new mesh
    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    // Apply the vertex data to the new mesh
    vertexData.applyToMesh(newMergedMesh);

    // Apply the submeshes to the new mesh
    // newMergedMesh.subMeshes = subMeshes;

    // Assign the multi-material to the new mesh
    const multiMaterial = new MultiMaterial('multiMaterial', scene);
    multiMaterial.subMaterials = materials;
    newMergedMesh.material = multiMaterial;

    return newMergedMesh;
  };

  async loadModel(name, cachedMetadata = null, signal = null) {
    const loadGeneration = ++this.loadGeneration;
    const isCurrentLoad = () =>
      loadGeneration === this.loadGeneration && !signal?.aborted;
    const assertCurrentLoad = () => {
      if (!isCurrentLoad()) {
        throw createCancelledZoneLoadError();
      }
    };
    logPreviewZoneLoad('load:start', name);
    this.zoneLoaded = false;
    GlobalStore.actions.setLoading(true);
    GlobalStore.actions.setLoadingTitle(`Loading ${name}`);
    GlobalStore.actions.setLoadingText(`Loading ${name} zone`);
    if (!(await this.loadViewerScene())) {
      this.gc.openAlert('Error loading zone', 'warning');
      GlobalStore.actions.setLoading(false);
      return;
    }
    assertCurrentLoad();
    const loadScene = this.scene;
    this.zoneName = name;
    const configuredFlySpeed = Number(
      this.cameraFlySpeed ?? this.gc.settings?.flySpeed
    );
    if (this.CameraController?.camera && Number.isFinite(configuredFlySpeed)) {
      this.setFlySpeed(configuredFlySpeed);
    }
    if (this.renderObserver) {
      this.scene.onBeforeRenderObservable.remove(this.renderObserver);
    }
    this.renderObserver = this.scene.onBeforeRenderObservable.add(this.renderHook);
    // Skybox
    const skybox = MeshBuilder.CreateBox(
      'skyBox',
      { size: 10000.0 },
      this.scene
    );
    this.skybox = skybox;
    const skyboxMaterial = new StandardMaterial('skyBox', this.scene);
    skyboxMaterial.backFaceCulling = false;

    if (window.__spireSagePreview) {
      skyboxMaterial.diffuseColor = new Color3(0.015, 0.018, 0.025);
    } else {
      const png_array = [];
      const map = ['px', 'py', 'pz', 'nx', 'ny', 'nz'];
      for (let i = 0; i < 6; i++) {
        png_array.push(assetUrl(`static/skybox_${map[i]}.jpg`));
      }
      skyboxMaterial.reflectionTexture = new CubeTexture(
        '/',
        this.scene,
        [],
        false,
        png_array,
        undefined,
        undefined,
        undefined,
        undefined,
        '.jpg'
      );
      skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
      skyboxMaterial.diffuseColor = new Color3Gradient(0, 0, 0);
    }
    skyboxMaterial.specularColor = new Color3(0, 0, 0);
    skybox.material = skyboxMaterial;
    if (window.__spireSagePreview) {
      const previewLight = new HemisphericLight(
        'preview-zone-light',
        new Vector3(0, 1, 0),
        this.scene
      );
      previewLight.intensity = 0.85;
      previewLight.groundColor = new Color3(0.25, 0.23, 0.2);
    }

    const metadata = cachedMetadata || (await getEQFile('zones', `${name}.json`, 'json'));
    assertCurrentLoad();
    let zoneRootUrl = '/eq/zones/';
    let zoneFileName = `${name}.glb`;
    let zoneObjectUrl = null;
    if (window.__spireSagePreview) {
      const zoneBuffer =
        (await this.gc.loadEQGltfFile?.('zones', `${name}.glb`)) ||
        (await getEQFile('zones', `${name}.glb`));
      assertCurrentLoad();
      if (!zoneBuffer) {
        throw new Error(`Generated zone geometry is missing for ${name}`);
      }
      logPreviewZoneLoad('import:buffer', name, {
        bytes: zoneBuffer.byteLength ?? zoneBuffer.length ?? 0,
      });
      zoneObjectUrl = URL.createObjectURL(
        new Blob([zoneBuffer], { type: 'model/gltf-binary' })
      );
      zoneRootUrl = '';
      zoneFileName = zoneObjectUrl;
    }
    let zone = null;
    try {
      zone = await SceneLoader.ImportMeshAsync(
        '',
        zoneRootUrl,
        zoneFileName,
        loadScene,
        undefined,
        '.glb'
      );
    } catch (e) {
      console.log('Error while loading zone', e);
      throw e;
    } finally {
      if (zoneObjectUrl) {
        URL.revokeObjectURL(zoneObjectUrl);
      }
    }
    if (!zone?.meshes?.length) {
      throw new Error(`No zone meshes were loaded for ${name}`);
    }
    if (!isCurrentLoad()) {
      zone.meshes.forEach((mesh) => mesh.dispose?.(false, true));
      throw createCancelledZoneLoadError();
    }
    logPreviewZoneLoad('import:done', name, {
      meshCount: zone.meshes.length,
      metadata : !!metadata,
    });
    const shouldImportBoundary =
      !window.__spireSagePreview && this.gc.settings.importBoundary;

    if (!shouldImportBoundary) {
      const hiddenZoneMeshes = zone.meshes.filter(isHiddenZoneMesh);
      logPreviewZoneLoad('hidden-zone-meshes:dispose', name, {
        count : hiddenZoneMeshes.length,
        meshes: hiddenZoneMeshes.map((mesh) => mesh.name).slice(0, 10),
      });
      hiddenZoneMeshes.forEach((m) => {
        m.setEnabled?.(false);
        m.isVisible = false;
        m.visibility = 0;
        m.dispose(false, true);
      });
    }

    // const zoneMesh = this.mergeMeshesWithMaterials(zone.meshes.filter((m) => m.getTotalVertices() > 0), this.currentScene);
    if (import.meta.env.VITE_LOCAL_DEV !== 'true') {
      const renderMeshes = zone.meshes.filter(
        (m) =>
          (shouldImportBoundary || !isHiddenZoneMesh(m)) &&
          !m.isDisposed?.() &&
          !m._isDisposed &&
          m.getTotalVertices() > 0
      );
      const zoneMesh = Mesh.MergeMeshes(
        renderMeshes,
        true,
        true,
        undefined,
        false,
        true
      );
      zoneMesh.name = 'zone';
      zoneMesh.isPickable = false;
      if (window.__spireSagePreview) {
        reframePreviewCamera(this.CameraController?.camera, zoneMesh);
      }
    }

    await yieldToBrowser();
    assertCurrentLoad();
    if (metadata) {
      this.metadata = metadata;
      this.objectContainer = new TransformNode(
        'static-objects',
        this.currentScene
      );

      const shouldLoadStaticObjects =
        !window.__spireSagePreview || this.gc.settings.loadStaticObjects === true;
      if (shouldLoadStaticObjects) {
        for (const [key, value] of Object.entries(metadata.objects)) {
          assertCurrentLoad();
          await yieldToBrowser();
          for (const mesh of await this.instantiateObjects(key, value, {
            isCancelled: () => !isCurrentLoad(),
            scene      : loadScene,
          })) {
            if (!mesh) {
              continue;
            }
            assertCurrentLoad();
            mesh.parent = this.objectContainer;
          }
          await yieldToBrowser();
          assertCurrentLoad();
        }
      }

      const regionNode = new TransformNode('regions', this.scene);
      this.regionNode = regionNode;

      const doorNode = new TransformNode('doors', this.scene);
      this.doorNode = doorNode;

      regionNode.setEnabled(!!this.regionsShown);
      if (!metadata.regions?.length && metadata.unoptimizedRegions?.length) {
        metadata.regions = await optimizeBoundingBoxes(
          metadata.unoptimizedRegions
        );
        assertCurrentLoad();
        delete metadata.unoptimizedRegions;
        await writeEQFile('zones', `${name}.json`, JSON.stringify(metadata));
        assertCurrentLoad();
      }
      let idx = 0;

      // Build out geometry, will have an option to toggle this on or off in the gui
      for (const region of metadata.regions) {
        const minVertex = new Vector3(
          region.minVertex[0],
          region.minVertex[1],
          region.minVertex[2]
        );
        const maxVertex = new Vector3(
          region.maxVertex[0],
          region.maxVertex[1],
          region.maxVertex[2]
        );

        // Calculate the dimensions of the box
        const width = maxVertex.x - minVertex.x;
        const height = maxVertex.y - minVertex.y;
        const depth = maxVertex.z - minVertex.z;

        // Create the box mesh
        const box = MeshBuilder.CreateBox(
          'box',
          {
            width : width,
            height: height,
            depth : depth,
          },
          this.scene
        );

        box.metadata = region.region;
        box.name = region.name || `Region-${idx++}`;
        // Set the position of the box to the center
        box.position = new Vector3(
          region.center[0],
          region.center[1],
          region.center[2]
        );

        box.material = this.regionMaterial;
        box.parent = regionNode;
      }
    }
    await yieldToBrowser();
    assertCurrentLoad();
    if (!window.__spireSagePreview) {
      await this.addTextureAnimations();
      assertCurrentLoad();
    }

    assertCurrentLoad();
    this.zoneLoaded = true;
    this.loadCallbacks.forEach((callback) => {
      scheduleZoneLoadCallback(callback);
    });

    GlobalStore.actions.setLoading(false);
  }

  async instantiateObjects(modelName, model, options = {}) {
    const targetScene = options.scene ?? this.scene;
    const isCancelled = options.isCancelled ?? (() => false);
    const objectBuffer =
      (await this.gc.loadEQGltfFile?.('objects', `${modelName}.glb`)) ||
      (await getEQFile('objects', `${modelName}.glb`));
    if (!objectBuffer || isCancelled() || !targetScene || isSceneDisposed(targetScene)) {
      return [];
    }

    const objectUrl = URL.createObjectURL(
      new Blob([objectBuffer], { type: 'model/gltf-binary' })
    );
    const container = await SceneLoader.LoadAssetContainerAsync(
      '',
      objectUrl,
      targetScene,
      undefined,
      '.glb'
    )
      .catch((_e) => null)
      .finally(() => URL.revokeObjectURL(objectUrl));
    if (!container) {
      return [];
    }
    if (isCancelled() || isSceneDisposed(targetScene)) {
      container.dispose();
      return [];
    }
    const mergedMeshes = [];

    for (const [idx, v] of Object.entries(model)) {
      const meshes = [];

      const { x, y, z, rotateX, rotateY, rotateZ, scale } = v;
      const instanceContainer = container.instantiateModelsToScene(
        () => `${modelName}_${idx}`,
        undefined,
        { doNotInstantiate: true }
      );
      if (this.gc.settings.disableAnimations) {
        instanceContainer.animationGroups?.forEach((ag) =>
          targetScene.removeAnimationGroup(ag)
        );
        instanceContainer.animationGroups = [];
      }

      const hasAnimations = instanceContainer.animationGroups.length > 0;

      for (const mesh of instanceContainer.rootNodes[0].getChildMeshes()) {
        if (mesh.getTotalVertices() > 0) {
          meshes.push(mesh);
        }
      }
      try {
        let rootNode = instanceContainer.rootNodes[0];
        const instanceSkeleton = instanceContainer.skeletons[0];
        const skeletonRoot = rootNode.getChildren(undefined, true)[0];

        const mergedMesh = Mesh.MergeMeshes(
          meshes,
          true,
          true,
          undefined,
          true,
          true
        );
        if (mergedMesh) {
          skeletonRoot.parent = mergedMesh;
          skeletonRoot.skeleton = instanceSkeleton;
          rootNode.dispose();
          rootNode = mergedMesh;
          rootNode.name = rootNode.id = `${modelName}_${idx}`;
          rootNode.position = new Vector3(x, y, z);

          rootNode.rotation = new Vector3(
            Tools.ToRadians(rotateX),
            Tools.ToRadians(rotateY),
            Tools.ToRadians(rotateZ)
          );
          const hasMorphTargets = rootNode
            .getChildMeshes()
            .some((mesh) => mesh.morphTargetManager !== null);

          if (hasMorphTargets) {
            rootNode.visibility = 0;
          }
          rootNode.checkCollisions = true;
          rootNode.scaling.z = rootNode.scaling.y = rootNode.scaling.x = scale;
          rootNode.metadata = {
            animated  : hasAnimations,
            zoneObject: true,
          };
          // Reassign the skeleton to the merged mesh
          if (instanceSkeleton) {
            rootNode.skeleton = instanceSkeleton;
          }
          // Babylon already frustum-culls placed zone objects. A fixed null LOD
          // makes large zones visibly pop as the camera or a mesh's bounds cross
          // the cutoff, which is especially noticeable from the overview camera.
          rootNode.id = `${modelName}_${idx}`;
          if (!hasAnimations) {
            rootNode.freezeWorldMatrix();
          } else {
            setTimeout(() => {
              if (isCancelled() || isSceneDisposed(targetScene)) {
                instanceContainer.animationGroups.forEach((ag) => ag.dispose?.());
                return;
              }
              instanceContainer.animationGroups.forEach((ag) => {
                ag.play(true);
              });
            }, 1000);
          }
          mergedMeshes.push(rootNode);
        }
      } catch (e) {
        console.warn(`Warning merging object ${modelName}`, e);
      }

      instanceContainer.rootNodes[0].dispose();
    }

    if (isCancelled() || isSceneDisposed(targetScene)) {
      mergedMeshes.forEach((mesh) => mesh.dispose?.(false, true));
      return [];
    }
    return mergedMeshes;
  }

  async addTextureAnimations() {
    const targetScene = this.scene;
    if (!targetScene || isSceneDisposed(targetScene)) {
      return;
    }

    const animationTimerMap = new Map();
    const animationTexturesCache = new Map();
    const getAnimationFrameTexture = (baseTexture, frameName) => {
      const frameUrl = resolveTextureAnimationFrameUrl(baseTexture, frameName);
      if (!frameUrl) {
        return null;
      }

      const baseUrl = `${baseTexture.url ?? baseTexture.name ?? ''}`;
      if (frameUrl.toLowerCase() === baseUrl.toLowerCase()) {
        return baseTexture;
      }

      const cacheKey = [
        frameUrl.toLowerCase(),
        Number(Boolean(baseTexture.noMipMap)),
        Number(Boolean(baseTexture.invertY)),
        baseTexture.samplingMode,
      ].join('|');
      if (!animationTexturesCache.has(cacheKey)) {
        animationTexturesCache.set(
          cacheKey,
          new Texture(
            frameUrl,
            targetScene,
            baseTexture.noMipMap,
            baseTexture.invertY,
            baseTexture.samplingMode
          )
        );
      }
      return animationTexturesCache.get(cacheKey);
    };

    for (const material of targetScene.materials) {
      if (!material.metadata?.gltf?.extras?.animationDelay) {
        continue;
      }

      const textureAnimation = material.metadata.gltf.extras;
      const targetTexture = getMaterialBaseColorTexture(material);
      if (!targetTexture || !Array.isArray(textureAnimation.frames)) {
        continue;
      }

      const allTextures = textureAnimation.frames
        .map((frame) => getAnimationFrameTexture(targetTexture, frame))
        .filter(Boolean);
      if (allTextures.length < 2) {
        continue;
      }

      const delay = Number(textureAnimation.animationDelay);
      if (!Number.isFinite(delay) || delay <= 0) {
        continue;
      }

      const materials = animationTimerMap.get(delay) ?? [];
      materials.push({
        allTextures,
        currentFrame: 0,
        targetTexture,
      });
      animationTimerMap.set(delay, materials);
    }

    for (const [time, materials] of animationTimerMap.entries()) {
      const interval = setInterval(() => {
        if (isSceneDisposed(targetScene)) {
          clearInterval(interval);
          return;
        }

        for (const animation of materials) {
          animation.currentFrame =
            (animation.currentFrame + 1) % animation.allTextures.length;
          // Texture creation is asynchronous. A missing or still-loading frame
          // must leave the last valid frame intact rather than turning a large
          // terrain material black for one animation tick.
          applyTextureAnimationFrame(
            animation.targetTexture,
            animation.allTextures[animation.currentFrame]
          );
        }
      }, +time * 2);

      targetScene.onDisposeObservable.addOnce(() => clearInterval(interval));
    }
  }
}

export const zoneController = new ZoneController();
window.zone = zoneController;
