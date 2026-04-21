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
  async initialize(reportStage = null) {
    if (initializeComplete) {
      return;
    }
    if (initializePromise) {
      await initializePromise;
      return;
    }

    initializePromise = (async () => {
      const addExports = m => {
        for (const [key, value] of Object.entries(m)) {
          exportObject[key] = value;
        }
      };
      const loadBatch = async (label, promises) => {
        reportStage?.(label);
        await Promise.all(promises.map((promise) => promise.then(addExports)));
      };

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
      await loadBatch('Loading Babylon math and tools', [
        import('@babylonjs/core/Maths/math.vector'),
        import('@babylonjs/core/Maths/math.color'),
        import('@babylonjs/core/Maths/math'),
        import('@babylonjs/core/Misc/tools'),
        import('@babylonjs/core/Misc/gradients'),
        import('@babylonjs/core/Events/pointerEvents'),
      ]);
      await loadBatch('Loading Babylon cameras and engines', [
        import('@babylonjs/core/Cameras/arcRotateCamera'),
        import('@babylonjs/core/Cameras/universalCamera'),
        import('@babylonjs/core/Behaviors/Cameras/autoRotationBehavior'),
        import('@babylonjs/core/Engines/engine'),
        import('@babylonjs/core/Engines/thinEngine'),
        import('@babylonjs/core/Engines/webgpuEngine'),
        import('@babylonjs/core/Offline/database'),
      ]);
      await loadBatch('Loading Babylon scene and glTF support', [
        import('@babylonjs/core/Loading/sceneLoader'),
        import('@babylonjs/loaders/glTF'),
        import('@babylonjs/core/scene'),
      ]);
      await loadBatch('Loading Babylon materials and meshes', [
        import('@babylonjs/core/Materials/Textures/texture'),
        import('@babylonjs/core/Materials/Textures/cubeTexture'),
        import('@babylonjs/core/Materials/material'),
        import('@babylonjs/core/Materials/standardMaterial'),
        import('@babylonjs/core/Materials/multiMaterial'),
        import('@babylonjs/core/Meshes/subMesh'),
        import('@babylonjs/core/Meshes/mesh.vertexData'),
        import('@babylonjs/core/Meshes/transformNode'),
        import('@babylonjs/core/Meshes/mesh'),
        import('@babylonjs/core/Meshes/meshBuilder'),
        import('@babylonjs/core/Meshes/Builders/boxBuilder'),
        import('@babylonjs/core/Layers/glowLayer'),
        import('@babylonjs/core/Lights/light'),
        import('@babylonjs/core/Lights/pointLight'),
      ]);

      reportStage?.('Babylon core ready');
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
  async prepareZoneViewer(reportStage = null) {
    await exportObject.initialize(reportStage);
    if (zoneViewerReady) {
      return;
    }
    if (zoneViewerPromise) {
      await zoneViewerPromise;
      return;
    }

    reportStage?.('Loading Babylon zone viewer extras');
    zoneViewerPromise = Promise.all([
      import('@babylonjs/core/Materials/Textures/Loaders/envTextureLoader'),
      import('@babylonjs/core/Helpers/sceneHelpers'),
      import('@babylonjs/core/Rendering/edgesRenderer'),
    ])
      .then(() => {
        reportStage?.('Babylon zone viewer ready');
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
