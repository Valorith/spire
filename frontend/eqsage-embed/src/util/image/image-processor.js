import * as Comlink from 'comlink';
import { globals } from 'sage-core/globals';
import { getEQDir, getFiles, writeEQFile } from 'sage-core/util/fileHandler';
import { SageFileSystemDirectoryHandle } from 'sage-core/util/fileSystem';
import { normalizeTextureName, parseTexture } from './shared';
import ImageWorker from './worker?worker&inline';


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

  initializeWorkers(workers = Math.min(4, navigator.hardwareConcurrency ?? 4)) {
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
    const idx = this.currentWorkerIdx % 4;
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
      unionImages = unionImages.filter(
        (i) => !files.some((f) => f.split('.')[0] === i.name.split('.')[0])
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
    if (!(rootHandle instanceof SageFileSystemDirectoryHandle)) {
      for (const { name, data, shaderType } of unionImages) {
        const normalizedName = normalizeTextureName(name);
        const parsedImage = await parseTexture(normalizedName, shaderType, data);
        if (parsedImage) {
          await writeEQFile('textures', normalizedName, parsedImage);
        }
        updateProgress();
      }
      this.current++;
      return;
    }

    const imageChunks = chunkArray(unionImages, this.#workers.length);
    const incrementContainer = { incrementParsedImage: updateProgress };
    for (const worker of this.#workers) {
      Comlink.expose(incrementContainer, worker);
    }

    await Promise.all(
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
    );
    this.current++;
  }
}

export const imageProcessor = new ImageProcessor();

window.imageProcessor = imageProcessor;
