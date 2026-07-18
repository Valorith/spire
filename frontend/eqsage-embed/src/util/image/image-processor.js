import * as Comlink from 'comlink';
import { globals } from 'sage-core/globals';
import { getEQDir, getFiles, writeEQFile } from 'sage-core/util/fileHandler';
import { SageFileSystemDirectoryHandle } from 'sage-core/util/fileSystem';
import { normalizeTextureName, parseTexture } from './shared';
import ImageWorker from './worker?worker&inline';

const isSpirePreview = () =>
  typeof window !== 'undefined' && !!window.__spireSagePreview;

const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));
const PREVIEW_IMAGE_TIMEOUT_MS = 180000;

const getWorkerCount = () => {
  const hardwareConcurrency = Number(navigator.hardwareConcurrency) || 4;
  const maxWorkers = isSpirePreview() ? 1 : 4;
  return Math.max(1, Math.min(maxWorkers, hardwareConcurrency));
};

const withPreviewTimeout = async (promise, label) => {
  if (!isSpirePreview()) {
    return promise;
  }

  let timeoutId = null;
  const timeout = new Promise((resolve) => {
    timeoutId = window.setTimeout(() => {
      console.warn(`[ImageProcessor] timed out processing ${label}`);
      resolve(null);
    }, PREVIEW_IMAGE_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    window.clearTimeout(timeoutId);
  }
};

function chunkArray(array, numChunks) {
  if (numChunks < 1) {
    throw new Error('Number of chunks must be greater than or equal to 1');
  }

  const arrayLength = array.length;
  const chunkSize = Math.ceil(arrayLength / numChunks);
  const result = [];

  for (let i = 0; i < arrayLength; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    result.push(chunk);
  }

  return result;
}

class ImageProcessor {
  /** @type {[Worker]} */
  #workers = [];

  /** @type {[Comlink.Remote<import('./worker.js')['default']>]} */
  babylonWorkers = [];

  /**
   * @type {[FileSystemHandle]}
   */
  fileHandles = [];

  workerIdx = 0;

  current = 0;

  constructor() {
    this.initializeWorkers();
  }

  /**
   * @typedef QueueItem
   * @property {string} name
   * @property {ArrayBuffer} data
   */

  initializeWorkers(workers = getWorkerCount()) {
    workers = Math.max(1, Number(workers) || getWorkerCount());
    console.log(`Initializing ${workers} image workers`);
    if (this.#workers.length) {
      console.log('Reusing initialized workers');
      return;
    }
    this.clearWorkers();
    for (let i = 0; i < workers; i++) {
      const worker = new ImageWorker();
      this.#workers.push(worker);
      this.babylonWorkers.push(Comlink.wrap(worker));
    }
  }

  clearWorkers() {
    console.log('Cleared workers');
    this.current = 0;
    this.#workers.forEach((w) => {
      w.terminate();
    });
    this.#workers = [];
    this.babylonWorkers = [];
  }

  currentWorkerIdx = 0;
  /**
   *
   * @param {ArrayBuffer} buffer
   */
  async compressImage(arr, name) {
    if (!this.babylonWorkers.length) {
      this.initializeWorkers();
    }
    const idx = this.currentWorkerIdx % this.babylonWorkers.length;
    const worker = this.babylonWorkers[idx];
    this.currentWorker++;
    const newBuffer = new ArrayBuffer(arr.byteLength);
    const newArray = new Uint8Array(newBuffer);
    newArray.set(arr);
    return await worker.convertPNGtoDDS(newArray.buffer, name);
  }

  /**
   *
   * @param {[QueueItem]} images
   */
  async parseImages(images) {
    // Check if these exist before sending them over the wire.
    let unionImages = images;
    const modelDir = await getEQDir('textures');
    if (modelDir) {
      const files = await getFiles(modelDir, undefined, true);
      const existingTextureNames = new Set(
        files.map((fileName) => fileName.toLowerCase().split('.')[0])
      );
      unionImages = unionImages.filter(
        (image) => !existingTextureNames.has(image.name.toLowerCase().split('.')[0])
      );
    }
    if (!unionImages.length) {
      return;
    }
    globals.GlobalStore.actions.setLoadingTitle('Loading Images');
    let count = 0;
    const workerLength = this.#workers.length;
    const updateProgress = () => {
      count++;
      globals.GlobalStore.actions.setLoadingText(
        `Decoded ${count} of ${images.length} images using ${workerLength} threads`
      );
    };

    const rootHandle = globals.gameController.rootFileSystemHandle;
    if (
      isSpirePreview() ||
      !(rootHandle instanceof SageFileSystemDirectoryHandle) ||
      !this.#workers.length
    ) {
      for (const { name, data, shaderType } of unionImages) {
        const normalizedName = normalizeTextureName(name);
        const parsedImage = await withPreviewTimeout(
          parseTexture(normalizedName, shaderType, data),
          normalizedName
        );
        if (parsedImage) {
          await writeEQFile('textures', normalizedName, parsedImage);
        }
        updateProgress();
        await yieldToBrowser();
      }
      this.current++;
      return;
    }

    const imageChunks = chunkArray(unionImages, this.#workers.length);
    const incrementContainer = { incrementParsedImage: updateProgress };
    for (const worker of this.#workers) {
      Comlink.expose(incrementContainer, worker);
    }

    await withPreviewTimeout(Promise.all(
      imageChunks.map((imgs, idx) =>
        this.babylonWorkers[idx].parseTextures(
          Comlink.transfer(
            imgs,
            imgs.map((i) => i.data)
          ),
          rootHandle.path,
          idx
        )
      )
    ), `${unionImages.length} image batch`);
    this.current++;
  }
}

export const imageProcessor = new ImageProcessor();

window.imageProcessor = imageProcessor;
