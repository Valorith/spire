import { setGlobals } from 'sage-core';
import { DracoCompression } from '@babylonjs/core/Meshes/Compression/dracoCompression';
import dracoFallbackUrl from '@babylonjs/core/assets/Draco/draco_decoder_gltf.js?url';
import dracoWasmWrapperUrl from '@babylonjs/core/assets/Draco/draco_wasm_wrapper_gltf.js?url';
import dracoWasmBinaryUrl from '@babylonjs/core/assets/Draco/draco_decoder_gltf.wasm?url';

let initializePromise = null;
let initializeComplete = false;
let zoneViewerPromise = null;
let zoneViewerReady = false;

/**
 * @type {import ('@babylonjs/core')}
 */
const exportObject = {
  async initialize() {
    if (initializeComplete) {
      return;
    }
    if (initializePromise) {
      await initializePromise;
      return;
    }

    initializePromise = (async () => {
      const importPromises = [];
      const addExports = m => {
        for (const [key, value] of Object.entries(m)) {
          exportObject[key] = value;
        }
      };
      const addImport = promise => importPromises.push(promise.then(addExports));

    // Keep Babylon on explicit same-origin decoder URLs, but avoid eagerly
    // fetching and instantiating Draco during initial app/bootstrap load.
    DracoCompression.DefaultNumWorkers = 0;
    DracoCompression.Configuration = {
      decoder: {
        wasmUrl      : dracoWasmWrapperUrl,
        wasmBinaryUrl: dracoWasmBinaryUrl,
        fallbackUrl  : dracoFallbackUrl,
      },
    };

      // BJS exports needed to construct the controller graph. Keep this as
      // lean as possible so zone selection remains responsive.
      addImport(import('@babylonjs/core/Maths/math.vector'));
      addImport(import('@babylonjs/core/Maths/math.color'));
      addImport(import('@babylonjs/core/Maths/math'));
      addImport(import('@babylonjs/core/Misc/tools'));
      addImport(import('@babylonjs/core/Misc/gradients'));
      addImport(import('@babylonjs/core/Events/pointerEvents'));
      addImport(import('@babylonjs/core/Cameras/arcRotateCamera'));
      addImport(import('@babylonjs/core/Cameras/universalCamera'));
      addImport(import('@babylonjs/core/Behaviors/Cameras/autoRotationBehavior'));
      addImport(import('@babylonjs/core/Engines/engine'));
      addImport(import('@babylonjs/core/Engines/thinEngine'));
      addImport(import('@babylonjs/core/Engines/webgpuEngine'));
      addImport(import('@babylonjs/core/Offline/database'));
      addImport(import('@babylonjs/core/Loading/sceneLoader'));
      addImport(import('@babylonjs/loaders/glTF'));
      addImport(import('@babylonjs/core/scene'));
      addImport(import('@babylonjs/core/Materials/Textures/texture'));
      addImport(import('@babylonjs/core/Materials/Textures/cubeTexture'));
      addImport(import('@babylonjs/core/Materials/material'));
      addImport(import('@babylonjs/core/Materials/standardMaterial'));
      addImport(import('@babylonjs/core/Materials/multiMaterial'));
      addImport(import('@babylonjs/core/Meshes/subMesh'));
      addImport(import('@babylonjs/core/Meshes/mesh.vertexData'));
      addImport(import('@babylonjs/core/Meshes/transformNode'));
      addImport(import('@babylonjs/core/Meshes/mesh'));
      addImport(import('@babylonjs/core/Meshes/meshBuilder'));
      addImport(import('@babylonjs/core/Meshes/Builders/boxBuilder'));
      addImport(import('@babylonjs/core/Layers/glowLayer'));
      addImport(import('@babylonjs/core/Lights/light'));
      addImport(import('@babylonjs/core/Lights/pointLight'));

      await Promise.all(importPromises);
      setGlobals({ BABYLON: exportObject });
      initializeComplete = true;
    })();

    try {
      await initializePromise;
    } catch (error) {
      initializePromise = null;
      throw error;
    }
  },
  async prepareZoneViewer() {
    await exportObject.initialize();
    if (zoneViewerReady) {
      return;
    }
    if (zoneViewerPromise) {
      await zoneViewerPromise;
      return;
    }

    zoneViewerPromise = Promise.all([
      import('@babylonjs/core/Materials/Textures/Loaders/envTextureLoader'),
      import('@babylonjs/core/Helpers/sceneHelpers'),
      import('@babylonjs/core/Rendering/edgesRenderer'),
    ])
      .then(() => {
        zoneViewerReady = true;
      })
      .catch((error) => {
        zoneViewerPromise = null;
        throw error;
      });

    await zoneViewerPromise;
  }
};

export default exportObject;
