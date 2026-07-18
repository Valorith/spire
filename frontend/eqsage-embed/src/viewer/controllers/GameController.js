import BABYLON from '@bjs';
import { setGlobals } from 'sage-core';
import { cameraController } from './CameraController';
import { spawnController } from './SpawnController';
import { skyController } from './SkyController';
import { zoneController } from './ZoneController';

import { GlobalStore } from '../../state';
import {
  getEQDir,
  getEQFile,
  getEQFileDirectoryRevision,
  getFiles,
} from 'sage-core/util/fileHandler';
import { assetUrl } from '../../embed-config';
import { textureAnimationMap } from '../helpers/textureAnimationMap';
import { getCharacterHeadOrientationPolicy } from 'sage-core/util/character-texture-orientation';

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
const SPIRE_SAGE_VIEWER_BUILD = 'spire-sage-zone-texture-cache-v3';
if (window.__spireSagePreview) {
  window.__spireSageViewerBuild = SPIRE_SAGE_VIEWER_BUILD;
}

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

const textureAliasCache = new Map();
const missingTextureWarnings = new Set();
let textureFileIndexPromise = null;
let textureFileIndex = null;
let textureFileIndexPromiseRevision = -1;
let textureFileIndexRevision = -1;
const patchedGltfLoaders = new WeakSet();

// Keep Sage's normal exact texture lookup as the first candidate. These
// aliases only cover client archive inconsistencies where the generated GLB
// references a material family that is not present as extracted texture files.
const MODEL_TEXTURE_PREFIX_ALIASES = {
  lsk: ['ske'],
  sde: ['den'],
};

const normalizeTextureLookupKey = (value) =>
  `${value ?? ''}`
    .toLowerCase()
    .replace(/\.\w+$/, '')
    .replace(/[^a-z0-9]/g, '');

const textureBaseName = (value) =>
  `${value ?? ''}`
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .at(-1) ?? '';

const buildTextureCandidates = (rawName, { allowCharacterFallbacks = true } = {}) => {
  const base = textureBaseName(rawName).toLowerCase().replace(/\.\w+$/, '');
  if (!base) {
    return [];
  }

  const candidates = new Set([base]);
  candidates.add(base.replace(/-/g, '_'));
  candidates.add(base.replace(/_/g, '-'));
  candidates.add(base.replace(/[^a-z0-9]/g, ''));

  if (allowCharacterFallbacks) {
    const modelPrefix = base.slice(0, 3);
    for (const aliasPrefix of MODEL_TEXTURE_PREFIX_ALIASES[modelPrefix] ?? []) {
      candidates.add(`${aliasPrefix}${base.slice(3)}`);
    }

    if (/^[a-z0-9]{3}[lr][_-]?eye$/.test(base)) {
      candidates.add('chr_eye001');
    }
    if (/^[a-z0-9]{3}[lr]_\d{2}$/.test(base)) {
      candidates.add(base.replace(/([lr])_\d{2}$/, '$1_eye'));
      candidates.add('chr_eye001');
    }
    const characterTexture = base.match(/^([a-z0-9]{3}[a-z]{2})(\d{2})(\d{2})$/);
    if (characterTexture) {
      const [, prefix, variant, slot] = characterTexture;
      candidates.add(`${prefix}01${slot}`);
      candidates.add(`${prefix}${variant}01`);
      candidates.add(`${prefix}0001`);
      candidates.add(`${prefix}0101`);
      candidates.add(`${prefix}sk${slot}`);
      candidates.add(`${prefix}sk01`);
    }
    const aliasedCharacterTexture = base.match(/^([a-z0-9]{3})([a-z]{2})(\d{2})(\d{2})$/);
    if (aliasedCharacterTexture) {
      const [, modelPrefix, part, variant, slot] = aliasedCharacterTexture;
      for (const aliasPrefix of MODEL_TEXTURE_PREFIX_ALIASES[modelPrefix] ?? []) {
        const prefix = `${aliasPrefix}${part}`;
        candidates.add(`${prefix}${variant}${slot}`);
        candidates.add(`${prefix}01${slot}`);
        candidates.add(`${prefix}${variant}01`);
        candidates.add(`${prefix}0001`);
        candidates.add(`${prefix}0101`);
        candidates.add(`${prefix}sk${slot}`);
        candidates.add(`${prefix}sk01`);
      }
    }
  }

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

const isIgnorableMissingTexture = (name) =>
  /^(?:m000\d+|none)$/i.test(`${name ?? ''}`);

const fallbackPngData = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
  0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
  0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde,
  0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63,
  0x68, 0x68, 0x68, 0x00, 0x00, 0x03, 0x04, 0x01, 0x81, 0x4b, 0xd3,
  0xd2, 0x10, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

const fallbackPngDataUri =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNoaGgAAAMEAYFL09IQAAAAAElFTkSuQmCC';

const toUint8Array = (data) =>
  data instanceof Uint8Array ? data : new Uint8Array(data);

const getPngDimensions = (data) => {
  const bytes = toUint8Array(data);
  if (
    bytes.byteLength < 24 ||
    bytes[0] !== 0x89 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x47
  ) {
    return null;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return {
    height: view.getUint32(20, false),
    width : view.getUint32(16, false),
  };
};

const isTinyPngTexture = (data, fileName = '') => {
  if (!/\.png$/i.test(fileName)) {
    return false;
  }
  const dimensions = getPngDimensions(data);
  return !!dimensions && dimensions.width <= 8 && dimensions.height <= 8;
};

const getCharacterSkinTextureCandidates = (rawName) => {
  const base = textureBaseName(rawName).toLowerCase().replace(/\.\w+$/, '');
  // Classic character archives use small fully-transparent numeric textures
  // as "show skin here" sentinels. This applies to armor variants as well as
  // texture 00, so resolve every numeric variant back to the matching SK slot.
  const match = base.match(/^([a-z0-9]{3})([a-z]{2})(\d{2})(\d{2})$/);
  if (!match) {
    return [];
  }

  const [, modelPrefix, part, , slot] = match;
  const prefixes = [
    modelPrefix,
    ...(MODEL_TEXTURE_PREFIX_ALIASES[modelPrefix] ?? []),
  ];
  const candidates = [];
  for (const prefix of prefixes) {
    const texturePrefix = `${prefix}${part}`;
    candidates.push(`${texturePrefix}sk${slot}`);
    candidates.push(`${texturePrefix}00${slot}`);
    candidates.push(`${texturePrefix}sk01`);
  }
  return candidates.filter(
    (candidate, index) =>
      candidate &&
      candidate !== base &&
      candidates.indexOf(candidate) === index
  );
};

const concatUint8Arrays = (arrays, totalLength) => {
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const array of arrays) {
    output.set(array, offset);
    offset += array.byteLength;
  }
  return output;
};

const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));

const syncViewportCanvas = (canvas) => {
  if (!canvas) {
    return;
  }

  if (window.__spireSagePreview) {
    for (const element of [
      document.documentElement,
      document.body,
      document.getElementById('app'),
    ]) {
      if (!element) {
        continue;
      }
      element.style.zoom = '1';
      element.style.transform = 'none';
      element.style.transformOrigin = '0 0';
      element.style.width = '100vw';
      element.style.height = '100vh';
      element.style.overflow = 'hidden';
    }
  }

  const width = Math.max(1, Math.floor(window.innerWidth || 1));
  const height = Math.max(1, Math.floor(window.innerHeight || 1));

  Object.assign(canvas.style, {
    bottom   : '0',
    display  : 'block',
    height   : '100vh',
    left     : '0',
    maxHeight: 'none',
    maxWidth : 'none',
    minHeight: '100vh',
    minWidth : '100vw',
    position : 'fixed',
    right    : '0',
    top      : '0',
    width    : '100vw',
  });
  canvas.width = width;
  canvas.height = height;

  if (window.__spireSagePreview) {
    const bounds = canvas.getBoundingClientRect();
    const stats = {
      attributeHeight: canvas.height,
      attributeWidth : canvas.width,
      boundsHeight   : Math.round(bounds.height),
      boundsWidth    : Math.round(bounds.width),
      cssHeight      : canvas.style.height,
      cssWidth       : canvas.style.width,
      devicePixelRatio: window.devicePixelRatio,
      innerHeight    : window.innerHeight,
      innerWidth     : window.innerWidth,
    };
    window.__spireSageCanvasStats = stats;
    const statsKey = JSON.stringify(stats);
    if (window.__spireSageCanvasStatsKey !== statsKey) {
      window.__spireSageCanvasStatsKey = statsKey;
      console.log('[SageCanvas] synced', statsKey);
    }
  }
};

const hydrateMissingGlbImages = async (url, fileBuffer) => {
  if (!url.endsWith('.glb')) {
    return fileBuffer;
  }
  const missingPreviewTextures = [];

  const source = toUint8Array(fileBuffer);
  if (
    source.byteLength < 20 ||
    source[0] !== 0x67 ||
    source[1] !== 0x6c ||
    source[2] !== 0x54 ||
    source[3] !== 0x46
  ) {
    return fileBuffer;
  }

  const view = new DataView(source.buffer, source.byteOffset, source.byteLength);
  const version = view.getUint32(4, true);
  if (version !== 2) {
    return fileBuffer;
  }

  const chunks = [];
  let jsonChunk = null;
  let offset = 12;
  while (offset + 8 <= source.byteLength) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd > source.byteLength) {
      return fileBuffer;
    }
    const data = source.subarray(dataStart, dataEnd);
    const chunk = { length, type, data };
    chunks.push(chunk);
    if (type === 0x4e4f534a) {
      jsonChunk = chunk;
    }
    offset = dataEnd;
  }

  if (!jsonChunk) {
    return fileBuffer;
  }

  const jsonText = new TextDecoder()
    .decode(jsonChunk.data)
    .replace(/\0+$/g, '')
    .trimEnd();
  const gltf = JSON.parse(jsonText);
  const images = gltf.images ?? [];
  let binChunk = chunks.find((chunk) => chunk.type === 0x004e4942);
  if (!binChunk) {
    binChunk = {
      length: 0,
      type  : 0x004e4942,
      data  : new Uint8Array(0),
    };
    chunks.push(binChunk);
  }

  gltf.buffers = gltf.buffers?.length ? gltf.buffers : [{ byteLength: 0 }];
  gltf.bufferViews = gltf.bufferViews ?? [];
  const usedMaterialIndices = new Set(
    (gltf.meshes ?? []).flatMap((mesh) =>
      (mesh.primitives ?? [])
        .map((primitive) => primitive.material)
        .filter(Number.isInteger)
    )
  );
  const usedTextureIndices = new Set();
  const collectTextureIndices = (value, propertyName = '') => {
    if (!value || typeof value !== 'object') {
      return;
    }
    if (
      /texture$/i.test(propertyName) &&
      Number.isInteger(value.index)
    ) {
      usedTextureIndices.add(value.index);
    }
    for (const [key, child] of Object.entries(value)) {
      collectTextureIndices(child, key);
    }
  };
  for (const materialIndex of usedMaterialIndices) {
    collectTextureIndices(gltf.materials?.[materialIndex]);
  }
  const usedImageIndices = new Set(
    Array.from(usedTextureIndices)
      .map((textureIndex) => gltf.textures?.[textureIndex]?.source)
      .filter(Number.isInteger)
  );
  const binParts = [binChunk.data];
  let binLength = binChunk.data.byteLength;
  let hydrated = false;

  for (const [imageIndex, image] of images.entries()) {
    if (image.uri || image.bufferView !== undefined) {
      continue;
    }

    const textureName = image.name ?? image.extras?.name;
    if (!textureName) {
      // Older EQG exports retained unreferenced image records for numeric
      // material properties. They are not renderable texture slots.
      continue;
    }
    const resolvedTexture = await getTextureFileData(textureName, {
      allowCharacterFallbacks: /\/eq\/models\//i.test(url),
    });
    let textureData = resolvedTexture?.data;
    let fileName = resolvedTexture?.fileName;
    let usedPreviewFallback = false;
    if (!textureData && isIgnorableMissingTexture(textureName)) {
      textureData = fallbackPngData;
      fileName = `${textureName}.png`;
    }
    if (!textureData && window.__spireSagePreview) {
      textureData = fallbackPngData;
      fileName = `${textureName ?? 'missing-texture'}.png`;
      usedPreviewFallback = true;
    }
    if (!textureData) {
      continue;
    }
    if (usedPreviewFallback && usedImageIndices.has(imageIndex)) {
      missingPreviewTextures.push(textureName ?? 'missing-texture');
    }

    const mimeType = getTextureMimeType(fileName ?? `${textureName}.png`);
    const textureBytes = toUint8Array(textureData);
    const padLength = (4 - (binLength % 4)) % 4;
    if (padLength) {
      binParts.push(new Uint8Array(padLength));
      binLength += padLength;
    }

    const byteOffset = binLength;
    binParts.push(textureBytes);
    binLength += textureBytes.byteLength;
    image.bufferView = gltf.bufferViews.length;
    image.mimeType = mimeType;
    delete image.uri;
    gltf.bufferViews.push({
      buffer    : 0,
      byteLength: textureBytes.byteLength,
      byteOffset,
      name      : `${textureName ?? 'texture'}_image`,
    });
    hydrated = true;
  }

  if (!hydrated) {
    return fileBuffer;
  }

  if (window.__spireSagePreview) {
    window.__spireSageMissingModelTextures = window.__spireSageMissingModelTextures || {};
    if (missingPreviewTextures.length > 0) {
      window.__spireSageMissingModelTextures[url] = missingPreviewTextures;
    } else {
      delete window.__spireSageMissingModelTextures[url];
    }
  }

  const finalPadLength = (4 - (binLength % 4)) % 4;
  if (finalPadLength) {
    binParts.push(new Uint8Array(finalPadLength));
    binLength += finalPadLength;
  }
  binChunk.data = concatUint8Arrays(binParts, binLength);
  binChunk.length = binLength;
  gltf.buffers[0].byteLength = binLength;

  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(JSON.stringify(gltf));
  const paddedJsonLength = Math.ceil(jsonBytes.byteLength / 4) * 4;
  const totalLength = 12 + chunks.reduce((sum, chunk) => {
    return sum + 8 + (chunk === jsonChunk ? paddedJsonLength : chunk.length);
  }, 0);
  const output = new Uint8Array(totalLength);
  const outputView = new DataView(output.buffer);
  output.set(source.subarray(0, 12), 0);
  outputView.setUint32(8, totalLength, true);

  let writeOffset = 12;
  for (const chunk of chunks) {
    if (chunk === jsonChunk) {
      outputView.setUint32(writeOffset, paddedJsonLength, true);
      outputView.setUint32(writeOffset + 4, chunk.type, true);
      output.fill(0x20, writeOffset + 8, writeOffset + 8 + paddedJsonLength);
      output.set(jsonBytes, writeOffset + 8);
      writeOffset += 8 + paddedJsonLength;
      continue;
    }

    outputView.setUint32(writeOffset, chunk.length, true);
    outputView.setUint32(writeOffset + 4, chunk.type, true);
    output.set(chunk.data, writeOffset + 8);
    writeOffset += 8 + chunk.length;
  }

  return output.buffer;
};

const normalizeMissingGlbImageUris = async (url, fileBuffer) => {
  if (!url.endsWith('.glb')) {
    return fileBuffer;
  }

  const source = toUint8Array(fileBuffer);
  if (
    source.byteLength < 20 ||
    source[0] !== 0x67 ||
    source[1] !== 0x6c ||
    source[2] !== 0x54 ||
    source[3] !== 0x46
  ) {
    return fileBuffer;
  }

  const view = new DataView(source.buffer, source.byteOffset, source.byteLength);
  const version = view.getUint32(4, true);
  if (version !== 2) {
    return fileBuffer;
  }

  const chunks = [];
  let jsonChunk = null;
  let offset = 12;
  while (offset + 8 <= source.byteLength) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd > source.byteLength) {
      return fileBuffer;
    }
    const data = source.subarray(dataStart, dataEnd);
    const chunk = { length, type, data };
    chunks.push(chunk);
    if (type === 0x4e4f534a) {
      jsonChunk = chunk;
    }
    offset = dataEnd;
  }

  if (!jsonChunk) {
    return fileBuffer;
  }

  const jsonText = new TextDecoder()
    .decode(jsonChunk.data)
    .replace(/\0+$/g, '')
    .trimEnd();
  const gltf = JSON.parse(jsonText);
  const images = gltf.images ?? [];
  let normalized = false;

  const materials = gltf.materials ?? [];
  const hiddenMeshIndices = new Set();
  (gltf.meshes ?? []).forEach((mesh, index) => {
    const meshName = `${mesh.name ?? ''}`;
    const hasHiddenName =
      /^m000\d+/i.test(meshName) || /-passthrough(?:$|[._-])/i.test(meshName);
    const hasHiddenMaterial = mesh.primitives?.some?.((primitive) => {
      const material = materials[primitive.material];
      const materialName = `${material?.name ?? ''}`;
      return (
        /^m000\d+/i.test(materialName) ||
        material?.extras?.boundary === true ||
        material?.extras?.passThrough === true
      );
    }) === true;

    if (hasHiddenName || hasHiddenMaterial) {
      hiddenMeshIndices.add(index);
    }
  });

  let strippedHiddenMeshes = 0;
  (gltf.nodes ?? []).forEach((node) => {
    if (node.mesh === undefined || !hiddenMeshIndices.has(node.mesh)) {
      return;
    }
    delete node.mesh;
    strippedHiddenMeshes += 1;
    normalized = true;
  });

  for (const image of images) {
    if (image.uri || image.bufferView !== undefined) {
      continue;
    }

    const textureName = textureBaseName(image.name ?? image.extras?.name)
      .replace(/\.\w+$/, '')
      .toLowerCase();
    if (!textureName) {
      continue;
    }

    const resolvedTexture = await getTextureFileData(textureName, {
      allowCharacterFallbacks: false,
    });
    if (!resolvedTexture?.fileName) {
      image.uri = fallbackPngDataUri;
      image.mimeType = 'image/png';
      normalized = true;
      continue;
    }

    image.uri = resolvedTexture.fileName;
    image.mimeType = getTextureMimeType(resolvedTexture.fileName);
    normalized = true;
  }

  if (!normalized) {
    return fileBuffer;
  }

  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(JSON.stringify(gltf));
  const paddedJsonLength = Math.ceil(jsonBytes.byteLength / 4) * 4;
  const totalLength = 12 + chunks.reduce((sum, chunk) => {
    return sum + 8 + (chunk === jsonChunk ? paddedJsonLength : chunk.length);
  }, 0);
  const output = new Uint8Array(totalLength);
  const outputView = new DataView(output.buffer);
  output.set(source.subarray(0, 12), 0);
  outputView.setUint32(8, totalLength, true);

  let writeOffset = 12;
  for (const chunk of chunks) {
    if (chunk === jsonChunk) {
      outputView.setUint32(writeOffset, paddedJsonLength, true);
      outputView.setUint32(writeOffset + 4, chunk.type, true);
      output.fill(0x20, writeOffset + 8, writeOffset + 8 + paddedJsonLength);
      output.set(jsonBytes, writeOffset + 8);
      writeOffset += 8 + paddedJsonLength;
      continue;
    }

    outputView.setUint32(writeOffset, chunk.length, true);
    outputView.setUint32(writeOffset + 4, chunk.type, true);
    output.set(chunk.data, writeOffset + 8);
    writeOffset += 8 + chunk.length;
  }

  if (window.__spireSagePreview) {
    window.__spireSageZoneTextureUriNormalization =
      window.__spireSageZoneTextureUriNormalization || {};
    window.__spireSageZoneTextureUriNormalization[url] = {
      normalized,
      strippedHiddenMeshes,
    };
  }

  return output.buffer;
};

const getTextureFileIndex = async () => {
  const currentRevision = getEQFileDirectoryRevision('textures');
  if (textureFileIndex && textureFileIndexRevision === currentRevision) {
    return textureFileIndex;
  }
  if (
    !textureFileIndexPromise ||
    textureFileIndexPromiseRevision !== currentRevision
  ) {
    textureFileIndexPromiseRevision = currentRevision;
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
        if (getEQFileDirectoryRevision('textures') === currentRevision) {
          textureFileIndex = index;
          textureFileIndexRevision = currentRevision;
        }
        return index;
      })
      .finally(() => {
        if (textureFileIndexPromiseRevision === currentRevision) {
          textureFileIndexPromise = null;
          textureFileIndexPromiseRevision = -1;
        }
      });
  }

  return textureFileIndexPromise;
};

const resolveTinyCharacterTexture = async (rawName, texture, options = {}) => {
  if (
    !options.allowCharacterFallbacks ||
    !isTinyPngTexture(texture?.data, texture?.fileName)
  ) {
    return null;
  }

  for (const candidate of getCharacterSkinTextureCandidates(rawName)) {
    for (const extension of ['png', 'jpg', 'jpeg']) {
      const fileName = `${candidate}.${extension}`;
      const data = await getEQFile('textures', fileName);
      if (data && !isTinyPngTexture(data, fileName)) {
        return { data, fileName };
      }
    }
  }

  return null;
};

const getTextureFileData = async (rawName, options = {}) => {
  for (const candidate of buildTextureCandidates(rawName, options)) {
    for (const extension of ['png', 'jpg', 'jpeg']) {
      const fileName = `${candidate}.${extension}`;
      const data = await getEQFile('textures', fileName);
      if (data) {
        const texture = { data, fileName };
        const replacement = await resolveTinyCharacterTexture(rawName, texture, options);
        return replacement ?? texture;
      }
    }
  }

  if (isIgnorableMissingTexture(rawName)) {
    return null;
  }

  const textureIndex = await getTextureFileIndex();
  for (const candidate of buildTextureCandidates(rawName, options)) {
    const indexedFileName =
      textureIndex.get(candidate) ??
      textureIndex.get(normalizeTextureLookupKey(candidate));
    if (!indexedFileName) {
      continue;
    }

    const data = await getEQFile('textures', indexedFileName);
    if (data) {
      const texture = { data, fileName: indexedFileName };
      const replacement = await resolveTinyCharacterTexture(rawName, texture, options);
      return replacement ?? texture;
    }
  }

  return null;
};

const patchGltfImageLoader = (controller, loaderCandidate) => {
  const loader = loaderCandidate?._loader ?? loaderCandidate;

  if (!loader || patchedGltfLoaders.has(loader)) {
    return false;
  }

  if (typeof loader.loadImageAsync !== 'function') {
    return false;
  }

  const originalLoadImageAsync = loader.loadImageAsync;

  loader.loadImageAsync = async function (context, image) {
    if (image?.uri || image?.bufferView !== undefined) {
      return originalLoadImageAsync.apply(this, arguments);
    }

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
        image._data = data;
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

        image._data = fallbackPngData.buffer;
      }
    }

    return image._data;
  };

  patchedGltfLoaders.add(loader);
  return true;
};

const prepareGlbForLoad = async (url, folder, file, fileBuffer) => {
  if (!/\.glb$/i.test(file)) {
    return fileBuffer;
  }

  if (folder === 'zones') {
    return await normalizeMissingGlbImageUris(url, fileBuffer);
  }

  return await hydrateMissingGlbImages(url, fileBuffer);
};

const shouldPrepareGlbFile = (_folder, file) =>
  /\.glb$/i.test(file);

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
      let fileBuffer =
        (await getEQFile(folder, file)) ||
        (!/\.glb$/i.test(file) ? (await getTextureFileData(url))?.data : null);
      if (!fileBuffer) {
        console.log('No bytes', url);
        errorCallback();
        return;
      }
      try {
        if (shouldPrepareGlbFile(folder, file)) {
          fileBuffer = await prepareGlbForLoad(url, folder, file, fileBuffer);
        }
        await yieldToBrowser();
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
  SpawnController = spawnController;
  ZoneController = zoneController;
  ModelController = createNoopController();
  ZoneBuilderController = createNoopController();

  videoElement = null;
  gltfPluginObserver = null;
  previewRenderTimer = null;

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
      const normalizedTextureName = `${url ?? ''}`
        .split(/[\\/]/)
        .pop()
        ?.replace(/\s+\(Base Color\)$/i, '')
        .replace(/\.(?:png|dds|bmp)$/i, '');
      const headOrientation =
        getCharacterHeadOrientationPolicy(normalizedTextureName);
      const isInlineTextureUrl = /^(?:blob:|data:)/i.test(`${url ?? ''}`);
      const doFlip = headOrientation.isCharacterHead || isInlineTextureUrl
        ? Boolean(_invertY)
        : controller.ZoneBuilderController?.scene ||
          (!url?.includes('eq/models') &&
            !/\w+(?:\d{4}|sk\d{2})(?:\s+\(Base Color\))?$/i.test(url));
      const internalTexture = origCreate.call(
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
      if (internalTexture) {
        internalTexture._spireSageRequestedInvertY = Boolean(_invertY);
        internalTexture._spireSageUploadInvertY = doFlip;
        internalTexture._spireSageTextureName = normalizedTextureName;
      }
      return internalTexture;
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

    this.gltfPluginObserver = SceneLoader?.OnPluginActivatedObservable?.add(
      (plugin) => {
        patchGltfImageLoader(controller, plugin);
      }
    );
    patchGltfImageLoader(controller, GLTFLoader?.prototype);
  }

  get currentScene() {
    return (
      zoneController.scene ??
      this.ModelController?.scene ??
      this.ZoneBuilderController?.scene
    );
  }

  async loadEngine(canvas, webgpu = false) {
    this.stopRenderLoop();
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
    syncViewportCanvas(this.canvas);
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
    this.resize();
    this.startRenderLoop();
  }

  async loadEQGltfFile(folder, file) {
    const url = `/eq/${folder}/${file}`;
    let fileBuffer =
      (await getEQFile(folder, file)) ||
      (!/\.glb$/i.test(file) ? (await getTextureFileData(url))?.data : null);

    if (!fileBuffer) {
      return null;
    }

    if (window.__spireSagePreview) {
      if (shouldPrepareGlbFile(folder, file)) {
        return await prepareGlbForLoad(url, folder, file, fileBuffer);
      }
      return fileBuffer;
    }

    return await prepareGlbForLoad(url, folder, file, fileBuffer);
  }

  resize() {
    syncViewportCanvas(this.canvas);
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

  startRenderLoop() {
    this.stopRenderLoop();

    if (window.__spireSagePreview) {
      const tick = () => {
        this.previewRenderTimer = null;
        if (!this.engine) {
          return;
        }
        this.renderLoop();
        this.previewRenderTimer = window.setTimeout(tick, 16);
      };
      this.previewRenderTimer = window.setTimeout(tick, 0);
      return;
    }

    this.engine.runRenderLoop(this.renderLoop);
  }

  stopRenderLoop() {
    if (this.previewRenderTimer) {
      window.clearTimeout(this.previewRenderTimer);
      this.previewRenderTimer = null;
    }
    this.engine?.stopRenderLoop?.(this.renderLoop);
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
    this.CameraController.sceneMouseUp(e);
  }

  dispose() {
    this.stopRenderLoop();
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
