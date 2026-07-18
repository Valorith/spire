import {
  FILE_TYPE,
  PREVIEW_CHARACTER_CACHE_VERSION,
  PREVIEW_ZONE_OBJECT_CACHE_VERSION,
  VERSION,
} from './constants';
import { S3DDecoder } from '../s3d/s3d-decoder';
import { Document } from '@gltf-transform/core';
import { EQGDecoder } from '../eqg/eqg-decoder';
import { getEQFile, getEQFileExists } from '../util/fileHandler';

const isSpirePreview = () =>
  typeof window !== 'undefined' && !!window.__spireSagePreview;

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
    const normalizedNames = this.#fileHandles.map((file) =>
      `${file.name ?? ''}`.toLowerCase()
    );
    const baseName = this.name.toLowerCase();
    const eqgExists = normalizedNames.includes(`${baseName}.eqg`);
    const s3dExists = normalizedNames.includes(`${baseName}.s3d`);

    if (eqgExists || s3dExists) {
      return eqgExists ? FILE_TYPE.EQG : FILE_TYPE.S3D;
    }

    // Character-only validation intentionally supplies archives such as
    // greatdivide_chr.s3d without the zone's primary greatdivide.s3d. Treat a
    // homogeneous filtered archive set as its real format so the decoder runs
    // instead of reporting a successful no-op.
    const anyEqg = normalizedNames.some((name) => name.endsWith('.eqg'));
    const anyS3d = normalizedNames.some((name) => name.endsWith('.s3d'));
    return anyEqg ? FILE_TYPE.EQG : anyS3d ? FILE_TYPE.S3D : FILE_TYPE.NONE;
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
    const previewCharacterCacheReady =
      !isSpirePreview() ||
      (
        existingMetadata?.spireCharacterModels === true &&
        existingMetadata?.spireCharacterTextures === true &&
        existingMetadata?.spireCharacterCacheVersion === PREVIEW_CHARACTER_CACHE_VERSION
      );
    const previewZoneObjectCacheReady =
      !isSpirePreview() ||
      existingMetadata?.spireZoneObjectCacheVersion === PREVIEW_ZONE_OBJECT_CACHE_VERSION;
    logFileHandleStep(this.name, 'cache:checked', {
      glbExists      : exists,
      metadataVersion: existingMetadata?.version ?? null,
      previewCharacterCacheReady,
      previewZoneObjectCacheReady,
      expectedVersion: VERSION,
    });
    if (
      exists &&
      existingMetadata?.version === VERSION &&
      previewCharacterCacheReady &&
      previewZoneObjectCacheReady &&
      !this.#settings.forceReload
    ) {
      logFileHandleStep(this.name, 'cache:hit, skipping translation');
      return;
    }
    const decoderOptions = {
      ...this.#options,
      // A stale character cache must overwrite already-exported model GLBs.
      // Otherwise the archive pass succeeds and advances the cache marker while
      // leaving old UV/material data on disk.
      forceWrite:
        isSpirePreview() &&
        (!previewCharacterCacheReady || !previewZoneObjectCacheReady),
    };
    if (type === FILE_TYPE.EQG) {
      logFileHandleStep(this.name, 'decoder:eqg:start');
      const eqgDecoder = new EQGDecoder(this, decoderOptions);
      await eqgDecoder.process();
      logFileHandleStep(this.name, 'decoder:eqg:processed');
      if (doExport) {
        logFileHandleStep(this.name, 'decoder:eqg:export:start');
        await eqgDecoder.export();
        await this.#processSupplementalArchives(type, decoderOptions);
        logFileHandleStep(this.name, 'decoder:eqg:export:done', {
          seconds: ((performance.now() - startedAt) / 1000).toFixed(2),
        });
        return true;
      }
    } else if (type === FILE_TYPE.S3D) {
      logFileHandleStep(this.name, 'decoder:s3d:start');
      const s3dDecoder = new S3DDecoder(this, decoderOptions);
      await s3dDecoder.process();
      logFileHandleStep(this.name, 'decoder:s3d:processed');
      if (doExport) {
        logFileHandleStep(this.name, 'decoder:s3d:export:start');
        await s3dDecoder.export();
        await this.#processSupplementalArchives(type, decoderOptions);
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

  async #processSupplementalArchives(primaryType, decoderOptions) {
    const lowerName = this.name.toLowerCase();
    const supplementalHandles = this.#fileHandles.filter((file) => {
      const fileName = file.name.toLowerCase();
      if (primaryType === FILE_TYPE.EQG) {
        return fileName.endsWith('.s3d') && fileName !== `${lowerName}.s3d`;
      }
      if (primaryType === FILE_TYPE.S3D) {
        return fileName.endsWith('.eqg') && fileName !== `${lowerName}.eqg`;
      }
      return false;
    });

    if (supplementalHandles.length === 0) {
      return;
    }

    const supplementalType =
      primaryType === FILE_TYPE.EQG ? FILE_TYPE.S3D : FILE_TYPE.EQG;
    logFileHandleStep(this.name, 'decoder:supplemental:start', {
      handles: supplementalHandles.map((file) => file.name),
      type   : supplementalType,
    });
    const supplementalFileHandle = new EQFileHandle(
      this.name,
      supplementalHandles,
      this.#rootFileHandle,
      this.#settings,
      decoderOptions
    );
    await supplementalFileHandle.initialize();

    if (supplementalType === FILE_TYPE.S3D) {
      const decoder = new S3DDecoder(supplementalFileHandle, decoderOptions);
      await decoder.process();
      await decoder.export();
    } else {
      const decoder = new EQGDecoder(supplementalFileHandle, {
        ...decoderOptions,
        modelDestination: 'objects',
      });
      await decoder.process();
      await decoder.export();
    }
    logFileHandleStep(this.name, 'decoder:supplemental:done');
  }
}
