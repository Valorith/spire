import BABYLON from '@bjs';
import { setGlobals } from 'sage-core';
import { cameraController } from './CameraController';
import { skyController } from './SkyController';
import { zoneController } from './ZoneController';

import { GlobalStore } from '../../state';
import { getEQDir, getEQFile, getFiles } from 'sage-core/util/fileHandler';
import { assetUrl } from '../../embed-config';
import { textureAnimationMap } from '../helpers/textureAnimationMap';

const { Engine, ThinEngine, WebGPUEngine, Database, SceneLoader, GLTFLoader } =
  BABYLON;

const createNoopController = () => ({
  scene: null,
  project: {},
  metadata: {},
  setGameController() {},
  dispose() {},
  setupSpawnController() {},
  sceneMouseDown() {},
  sceneMouseUp() {},
  setSpawnLOD() {},
  addSpawns() {},
  updateSpawn() {},
  deleteSpawn() {},
  npcLight() {},
  moveSpawn() {},
  addClickCallback() {},
  removeClickCallback() {},
  showSpawnPath() {},
  clearAssetContainer() {},
  disposeModel() {},
  swapBackground() {},
  toggleOpen() {},
  showRegions() {},
  setFlySpeed() {},
  setClipPlane() {},
  setGlow() {},
  async loadModel() {},
  async addBackgroundMesh() {
    return null;
  },
  async addExportModel() {
    return null;
  },
  async addObject() {
    return null;
  },
  async getAssetContainer() {
    return null;
  },
  exportModel() {},
  exportSTL() {},
  exportFBX() {},
});

/**
 * @typedef Spire
 * @property {import ('../../../../spire/frontend/src/app/api/spire-api')} SpireApi
 * @property {import ('../../../../spire/frontend/src/app/api')} SpireApiTypes
 * @property {import ('../../../../spire/frontend/src/app/api/spire-query-builder').SpireQueryBuilder} SpireQueryBuilder
 * @property {import ('../../../../spire/frontend/src/app/zones').Zones} Zones
 * @property {import ('../../../../spire/frontend/src/app/spawn').Spawn} Spawn
 * @property {import ('../../../../spire/frontend/src/app/grid').Grid} Grid
 * @property {import ('../../../../spire/frontend/src/app/npcs').Npcs} Npcs
 */

Database.IDBStorageEnabled = true;
SceneLoader.ShowLoadingScreen = false;

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

const textureAliasCache = new Map();
const missingTextureWarnings = new Set();
let textureFileIndexPromise = null;
let textureFileIndex = null;

const normalizeTextureLookupKey = (value) =>
  `${value ?? ''}`
    .toLowerCase()
    .replace(/\.\w+$/, '')
    .replace(/[^a-z0-9]/g, '');

const buildTextureCandidates = (rawName) => {
  const base = `${rawName ?? ''}`.toLowerCase().replace(/\.\w+$/, '');
  if (!base) {
    return [];
  }

  const candidates = new Set([base]);
  candidates.add(base.replace(/-/g, '_'));
  candidates.add(base.replace(/_/g, '-'));
  candidates.add(base.replace(/[^a-z0-9]/g, ''));

  for (const candidate of [...candidates]) {
    if (candidate.includes('_')) {
      candidates.add(candidate.replace(/^[^_]+_/, ''));
    }
  }

  const suffixMatches = textureAliasCache.get(base);
  if (suffixMatches) {
    suffixMatches.forEach((match) => candidates.add(match));
  } else {
    const matches = Object.keys(textureAnimationMap).filter(
      (key) => key === base || key.endsWith(`_${base}`)
    );
    textureAliasCache.set(base, matches);
    matches.forEach((match) => candidates.add(match));
  }

  return [...candidates];
};

const getTextureMimeType = (name) =>
  name.endsWith('.jpg') || name.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';

const isIgnorableMissingTexture = (name) => /^m000\d+$/i.test(`${name ?? ''}`);

const getTextureFileIndex = async () => {
  if (textureFileIndex) {
    return textureFileIndex;
  }
  if (!textureFileIndexPromise) {
    textureFileIndexPromise = (async () => {
      const index = new Map();
      const textureDir = await getEQDir('textures');
      if (!textureDir) {
        return index;
      }

      const fileNames = await getFiles(textureDir, undefined, true);
      fileNames.forEach((fileName) => {
        const baseName = `${fileName}`.toLowerCase().replace(/\.\w+$/, '');
        if (!index.has(baseName)) {
          index.set(baseName, fileName);
        }

        const normalized = normalizeTextureLookupKey(baseName);
        if (normalized && !index.has(normalized)) {
          index.set(normalized, fileName);
        }
      });

      return index;
    })()
      .then((index) => {
        textureFileIndex = index;
        return index;
      })
      .finally(() => {
        textureFileIndexPromise = null;
      });
  }

  return textureFileIndexPromise;
};

const getTextureFileData = async (rawName) => {
  for (const candidate of buildTextureCandidates(rawName)) {
    for (const extension of ['png', 'jpg', 'jpeg']) {
      const fileName = `${candidate}.${extension}`;
      const data = await getEQFile('textures', fileName);
      if (data) {
        return { data, fileName };
      }
    }
  }

  const textureIndex = await getTextureFileIndex();
  for (const candidate of buildTextureCandidates(rawName)) {
    const indexedFileName =
      textureIndex.get(candidate) ??
      textureIndex.get(normalizeTextureLookupKey(candidate));
    if (!indexedFileName) {
      continue;
    }

    const data = await getEQFile('textures', indexedFileName);
    if (data) {
      return { data, fileName: indexedFileName };
    }
  }

  return null;
};

class EQDatabase extends Database {
  async loadImage(url, image, ..._rest) {
    if (url.startsWith('http') || url.startsWith(assetUrl('static'))) {
      const res = await fetch(url).then((a) => a.arrayBuffer());
      image.src = URL.createObjectURL(
        new Blob([res], { type: 'image/png' } /* (1) */)
      );
      return;
    }
    const resolvedTexture = await getTextureFileData(url);
    if (!resolvedTexture) {
      return;
    }
    image.src = URL.createObjectURL(
      new Blob([resolvedTexture.data], {
        type: getTextureMimeType(resolvedTexture.fileName),
      } /* (1) */)
    );
  }

  async open(success, _failure) {
    try {
      await success();
    } catch (e) {
      console.log('err in open', e);
    }
  }
  async loadFile(
    url,
    sceneLoaded,
    _progressCallBack,
    errorCallback,
    _useArrayBuffer
  ) {
    if (url.startsWith('blob')) {
      const res = await fetch(url)
        .then((a) => a.arrayBuffer())
        .catch(() => null);
      if (res) {
        await sceneLoaded(res);
      } else {
        errorCallback();
      }
      return;
    }
    const [, eq, folder, file] = url.split('/');
    if (eq === 'eq') {
      const fileBuffer =
        (await getEQFile(folder, file)) || (await getTextureFileData(url))?.data;
      if (!fileBuffer) {
        console.log('No bytes', url);
        errorCallback();
        return;
      }
      try {
        await sceneLoaded(fileBuffer);
      } catch (e) {
        console.warn(e);
      }
      return;
    }

    const fileBuffer = (await getTextureFileData(url))?.data;
    if (!fileBuffer) {
      console.log('No bytes for png', url);
      errorCallback();
      return;
    }
    await sceneLoaded(fileBuffer);

    // console.log('No bytes', url);
    // errorCallback();
  }
}

export class GameController {
  /** @type {Engine & WebGPUEngine} */
  engine = null;
  /** @type {Scene} */
  #scene = null;
  /** @type {HTMLCanvasElement} */
  canvas = null;

  loading = false;

  /** @type {Spire} */
  Spire = null;

  /**
   * @type {FileSystemDirectoryHandle}
   */
  rootFileSystemHandle = null;

  addToast(message) {
    console.log(message);
  }

  showUi = params.ui === 'true';
  dev = import.meta.env.VITE_DEV === 'true';

  CameraController = cameraController;
  SkyController = skyController;
  SpawnController = createNoopController();
  ZoneController = zoneController;
  ModelController = createNoopController();
  ZoneBuilderController = createNoopController();

  videoElement = null;

  constructor() {
    const controller = this;
    this.CameraController.setGameController(this);
    this.SkyController.setGameController(this);
    this.SpawnController.setGameController(this);
    this.ZoneController.setGameController(this);
    this.ModelController.setGameController(this);
    this.ZoneBuilderController.setGameController(this);

    this.keyDown = this.keyDown.bind(this);
    this.resize = this.resize.bind(this);
    this.sceneMouseDown = this.sceneMouseDown.bind(this);
    this.sceneMouseUp = this.sceneMouseUp.bind(this);
    this.renderLoop = this.renderLoop.bind(this);

    const orig = ThinEngine._FileToolsLoadImage;
    ThinEngine._FileToolsLoadImage = function (
      buffer,
      onload,
      onInternalError,
      offlineProvider,
      mimeType,
      options
    ) {
      return orig.call(
        undefined,
        buffer,
        onload,
        onInternalError,
        offlineProvider,
        mimeType,
        options
      );
    };
    const origCreate = ThinEngine.prototype.createTexture;
    ThinEngine.prototype.createTexture = function (
      url,
      noMipmap,
      _invertY,
      scene,
      samplingMode,
      onLoad,
      onError,
      buffer,
      fallback,
      format,
      forcedExtension,
      mimeType,
      loaderOptions,
      creationFlags,
      useSRGBBuffer
    ) {
      const doFlip =
        controller.ZoneBuilderController?.scene ||
        (!url?.includes('eq/models') && !/\w+\d{4}/.test(url));
      return origCreate.call(
        this,
        url,
        noMipmap,
        doFlip,
        scene,
        samplingMode,
        onLoad,
        onError,
        buffer,
        fallback,
        format,
        forcedExtension,
        mimeType,
        loaderOptions,
        creationFlags,
        useSRGBBuffer
      );
    };

    // Override DB factory
    Engine.OfflineProviderFactory = (
      urlToScene,
      callbackManifestChecked,
      disableManifestCheck = false
    ) => {
      return new EQDatabase(
        urlToScene,
        callbackManifestChecked,
        disableManifestCheck
      );
    };
    const originalLoadImageAsync = GLTFLoader.prototype.loadImageAsync;
    GLTFLoader.prototype.loadImageAsync = async function (context, image) {
      if (controller.ZoneBuilderController?.scene) {
        try {
          const result = await originalLoadImageAsync.apply(this, arguments);
          return result;
        } catch (e) {
          console.warn('Error with image', image);
        }
      }
      if (!image._data) {
        const resolvedTexture = await getTextureFileData(image.name);
        const data = resolvedTexture?.data;

        if (data) {
          image._data = data; // entry.data.buffer;
        } else {
          try {
            const res = await originalLoadImageAsync.call(this, context, image);
            if (res) {
              return res;
            }
          } catch {}
          if (
            !isIgnorableMissingTexture(image.name) &&
            !missingTextureWarnings.has(image.name)
          ) {
            missingTextureWarnings.add(image.name);
            console.warn(`Missing texture ${image.name}`);
          }

          // Solid gray 1px png until this is solved
          const pngData = new Uint8Array([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
            0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
            0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde,
            0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63,
            0x68, 0x68, 0x68, 0x00, 0x00, 0x03, 0x04, 0x01, 0x81, 0x4b, 0xd3,
            0xd2, 0x10, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
            0x42, 0x60, 0x82,
          ]);

          image._data = pngData.buffer;
          // (await getEQFile('textures', 'citywal4.png')) ?? new ArrayBuffer();
        }
      }

      return image._data;
    };
  }

  get currentScene() {
    return (
      zoneController.scene ??
      this.ModelController?.scene ??
      this.ZoneBuilderController?.scene
    );
  }

  async loadEngine(canvas, webgpu = false) {
    if (this.engine) {
      this.engine.dispose();
    }
    if (this.currentScene) {
      this.currentScene.dispose();
    }
    this.ZoneController.dispose();
    this.ZoneBuilderController.dispose();
    this.#scene = null;
    this.canvas = canvas;
    if (navigator.gpu && webgpu) {
      this.engine = new WebGPUEngine(canvas);
      if (window.define) {
        window.define.amd = undefined;
      }
      await this.engine.initAsync();
      this.engineInitialized = true;
    } else {
      this.engine = new Engine(canvas); // await EngineFactory.CreateAsync(canvas);
      this.engineInitialized = true;
    }
    this.engine.setHardwareScalingLevel(1 / window.devicePixelRatio);
    this.engine.disableManifestCheck = true;
    this.engine.enableOfflineSupport = true;
    this.loading = false;
    this.engine.runRenderLoop(this.renderLoop);
  }

  resize() {
    this.engine?.resize();
  }

  setLoading(val) {
    this.loading = val;
    GlobalStore.actions.setLoading(val);
  }

  get exploreMode() {
    return GlobalStore.getState().exploreMode;
  }

  get state() {
    return GlobalStore.getState();
  }

  get actions() {
    return GlobalStore.actions;
  }

  renderLoop() {
    if (this.currentScene && this.currentScene?.activeCamera && !this.loading) {
      try {
        this.currentScene.render();
      } catch (e) {
        console.warn(e);
      }
    }
  }

  async togglePip() {
    try {
      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.style.display = 'none';
        document.body.appendChild(this.videoElement);

        const stream = this.canvas.captureStream(60);
        this.videoElement.srcObject = stream;
        await this.videoElement.play();
      }

      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await this.videoElement.requestPictureInPicture();
      }
    } catch (error) {
      this.openAlert('Could not create a Picture In Picture session');
      console.error('An error occurred with Picture-in-Picture:', error);
    }
  }

  async keyDown(e) {
    switch (`${e?.key}`?.toLowerCase?.()) {
      case 'i': {
        if (!this.currentScene) {
          break;
        }
        if (e?.target?.tagName === 'INPUT') {
          return;
        }
        let inspector; 
        await import('@babylonjs/inspector').then((i) => {
          inspector = i.Inspector;
        });
        if (inspector.IsVisible) {
          inspector.Hide();
        } else {
          inspector.Show(zoneController.scene, {
            embedMode: true,
            overlay  : true,
          });
        }
        break;
      }
      default:
        break;
    }
  }

  sceneMouseDown(e) {
    this.SpawnController.sceneMouseDown(e);
    this.CameraController.sceneMouseDown(e);
  }

  sceneMouseUp(e) {
    console.log('hello');
    this.CameraController.sceneMouseUp(e);
  }

  dispose() {
    if (this.currentScene) {
      this.currentScene.dispose();
      this.engine.dispose();
    }
    this.ZoneController.dispose();
    this.aabbTree = null;
    this.ZoneController.dispose();
    this.CameraController.dispose();
    this.SkyController.dispose();
    this.SpawnController.dispose();
  }
}

export const gameController = new GameController();
setGlobals({ gameController });
window.gc = window.gameController = gameController;
