import { FILE_TYPE, VERSION } from './constants';
import { S3DDecoder } from '../s3d/s3d-decoder';
import { Document } from '@gltf-transform/core';
import { EQGDecoder } from '../eqg/eqg-decoder';
import { getEQFile, getEQFileExists } from '../util/fileHandler';

const logFileHandleStep = (name, message, extra) => {
  if (extra !== undefined) {
    console.log(`[SageFileHandle:${name}] ${message}`, extra);
    return;
  }
  console.log(`[SageFileHandle:${name}] ${message}`);
};

export class EQFileHandle {
  /**
   * @type {Array<FileSystemFileHandle>}
   */
  #fileHandles = [];
  #name = '';
  #initialized = false;
  #settings = {};
  #options = {};
  /**
   * @type {FileSystemDirectoryHandle}
   */
  #rootFileHandle = null;

  // gltf instances
  #zoneGltf = null;
  objectGltf = {};
  textures = [];

  /**
   *
   * @param {FileSystemFileHandle} fileHandles
   */
  constructor(name, fileHandles, rootFileHandle, settings, options) {
    this.#name = name;
    this.#fileHandles = fileHandles;
    this.#rootFileHandle = rootFileHandle;
    this.#settings = settings;
    this.#options = options;
  }

  /**
   * @type {Document}
   */
  get zoneGltf() {
    if (this.#zoneGltf === null) {
      this.#zoneGltf = new Document(this.#name);
    }
    return this.#zoneGltf;
  }

  get name() {
    return this.#name;
  }

  get fileHandles() {
    return this.#fileHandles;
  }

  get rootFileHandle() {
    return this.#rootFileHandle;
  }

  get #type() {
    const eqgExists = this.#fileHandles.some(f => f.name === `${this.name}.eqg`);
    const s3dExists = this.#fileHandles.some(f => f.name === `${this.name}.s3d`);
  
    return eqgExists ? FILE_TYPE.EQG : s3dExists ? FILE_TYPE.S3D : FILE_TYPE.NONE;
  }
  

  async initialize() {
    logFileHandleStep(this.name, 'initialize:start', {
      handleCount: this.#fileHandles.length,
      handles    : this.#fileHandles.slice(0, 12).map((file) => file.name),
    });
    if (this.#fileHandles.length === 0) {
      console.warn('File handle length was 0!');
      return;
    }
    this.#initialized = true;
    logFileHandleStep(this.name, 'initialize:done');
  }

  async process(doExport = true) {
    if (!this.#initialized) {
      console.warn('Was not initialized, cannot process');
      return;
    }
    const startedAt = performance.now();
    const type = this.#type;
    logFileHandleStep(this.name, 'process:start', {
      type,
      doExport,
      forceReload: !!this.#settings?.forceReload,
    });
    const existingMetadata = await getEQFile('zones', `${this.name}.json`, 'json');
    const exists = await getEQFileExists('zones', `${this.name}.glb`);
    logFileHandleStep(this.name, 'cache:checked', {
      glbExists      : exists,
      metadataVersion: existingMetadata?.version ?? null,
      expectedVersion: VERSION,
    });
    if (exists && existingMetadata?.version === VERSION && !this.#settings.forceReload) {
      logFileHandleStep(this.name, 'cache:hit, skipping translation');
      return;
    }
    if (type === FILE_TYPE.EQG) {
      logFileHandleStep(this.name, 'decoder:eqg:start');
      const eqgDecoder = new EQGDecoder(this, this.#options);
      await eqgDecoder.process();
      logFileHandleStep(this.name, 'decoder:eqg:processed');
      if (doExport) {
        logFileHandleStep(this.name, 'decoder:eqg:export:start');
        await eqgDecoder.export();
        logFileHandleStep(this.name, 'decoder:eqg:export:done', {
          seconds: ((performance.now() - startedAt) / 1000).toFixed(2),
        });
        return true;
      }
    } else if (type === FILE_TYPE.S3D) {
      logFileHandleStep(this.name, 'decoder:s3d:start');
      const s3dDecoder = new S3DDecoder(this, this.#options);
      await s3dDecoder.process();
      logFileHandleStep(this.name, 'decoder:s3d:processed');
      if (doExport) {
        logFileHandleStep(this.name, 'decoder:s3d:export:start');
        await s3dDecoder.export();
        logFileHandleStep(this.name, 'decoder:s3d:export:done', {
          seconds: ((performance.now() - startedAt) / 1000).toFixed(2),
        });
        return true;
      }
    } else {
      logFileHandleStep(this.name, 'decoder:none', {
        availableHandles: this.#fileHandles.map((file) => file.name),
      });
    }
    logFileHandleStep(this.name, 'process:done', {
      seconds: ((performance.now() - startedAt) / 1000).toFixed(2),
    });
  }
}
