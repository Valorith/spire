/* eslint-disable */

import { Zone } from "./zone/zone";
import { ZoneData } from "./zone/v4-zone";
import { Model, Animation, Lit } from "./model/model";
import { MDS } from "./model/mds";
import { Eco } from "./eco/eco";
import { PFSArchive } from "../pfs/pfs";
import {  deleteEqFileOrFolder, getEQRootDir, writeEQFile } from "../util/fileHandler";

const getImageProcessor = async () => {
  if (typeof window !== 'undefined' && window.imageProcessor) {
    return window.imageProcessor;
  }
  const { imageProcessor } = await import('../../../src/util/image/image-processor');
  return imageProcessor;
};

const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));

export class EQGDecoder {
  #options = {
    forceWrote: false,
  };
  /** @type {import('../model/file-handle').EQFileHandle} */
  #fileHandle = null;

  /**
   * @type {Zone}
   */
  zone = null;

  /**
   * @type {Object.<string, import('./model/model').Model>}
   */
  models = {};

  /**
   * @type {Object.<string, import('./model/model').Animation>}
   */
  animations = {};

   /**
   * @type {Object.<string, import('./model/model').Lit>}
   */
  lits = {};

  /**
   * @type {Object.<string, import('./eco/eco').Eco>}
   */
  eco = {};

  /**
   * @type {ZoneData}
   */
  zoneData = null;

  /**
   *
   * @type {PFSArchive}
   */
  pfsArchive;

  constructor(fileHandle, options = {}) {
    this.#fileHandle = fileHandle;
    this.#options = options;
  }

  get name() {
    return this.#fileHandle.name;
  }

  get options() {
    return this.#options;
  }

  async processBuffer(name, arrayBuffer, skipImages = false) {
    this.pfsArchive = new PFSArchive();
    this.pfsArchive.openFromFile(arrayBuffer);
    const images = [];
    this.files = {};
    let processedFiles = 0;
    for (const [fileName, data] of this.pfsArchive.files.entries()) {
      processedFiles++;
      if (processedFiles % 10 === 0) {
        await yieldToBrowser();
      }
      this.files[fileName] = this.pfsArchive.getFile(fileName);
      if (fileName.endsWith(".lit")) {
        const lit = new Lit(
          this.files[fileName],
          this.#fileHandle,
          fileName
        );
        this.lits[lit.name] = lit;

      }
      if (import.meta.env.VITE_LOCAL_DEV === "true") {
        //await writeEQFile(name, fileName, this.files[fileName]);
      }
      if (fileName.endsWith(".zon")) {
        this.zone = Zone.Factory(
          this.files[fileName],
          this.#fileHandle,
          fileName,
          this.files
        );
      }

      if (fileName.endsWith(".ani")) {
        const ani = new Animation(
          this.files[fileName],
          this.#fileHandle,
          fileName
        );
        this.animations[ani.name] = ani;
      }

      if (fileName.endsWith(".mod") || fileName.endsWith(".ter")) {
        const model = new Model(
          this.files[fileName],
          this.#fileHandle,
          fileName
        );
        this.models[model.name] = model;
      }

      if (fileName.endsWith(".bmp") || fileName.endsWith(".dds")) {
        // await writeEQFile('output', `${fileName}`, this.files[fileName].buffer )
        images.push({ name: fileName, data: this.files[fileName].buffer });
        if (this.#options?.forceWrite) {
          const pngName = fileName.replace('.bmp', '.png').replace('.dds', '.png');
          await deleteEqFileOrFolder('textures', pngName);
        }
        if (this.#options.rawImageWrite) {
          writeEQFile('textures', fileName
            .replace('.bmp', '.dds').toLowerCase(), this.files[fileName].buffer);
        }
        continue;
      }
      if (fileName.endsWith('.png')) {
        await writeEQFile('textures', fileName, this.files[fileName]);
      }
      if (fileName.endsWith(".eco")) {
        this.eco[fileName.replace(".eco", "")] = new Eco(this.files[fileName]);
      }
      if (fileName.endsWith(".mds")) {
        const mds = new MDS(
          this.files[fileName],
          this.#fileHandle,
          fileName
        );
        for (const { name, model } of mds.models) {
          this.models[name] = model;
        }
      }
      if (fileName.endsWith('.txt')) {
        //console.log('Txt', fileName)
      }
    }

    const archiveModelName = this.#fileHandle.name.toLowerCase();
    const canonicalModName = `${archiveModelName}.mod`;
    if (!this.models[canonicalModName] && !this.models[archiveModelName]) {
      const escapedArchiveModelName = archiveModelName.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );
      const embeddedArchiveCodePattern = new RegExp(
        `(?:^|_)${escapedArchiveModelName}(?:_|\\d|\\.)`,
        'i'
      );
      const canonicalCandidate = Object.entries(this.models).find(
        ([modelName]) =>
          modelName.endsWith('.mod') &&
          embeddedArchiveCodePattern.test(modelName)
      );
      if (canonicalCandidate) {
        this.models[canonicalModName] = canonicalCandidate[1];
      }
    }

    // Post process
    for (const [key, data] of Object.entries(this.files)) {
      if (key.endsWith(".dat")) {
        switch (key) {
          case "water.dat":
            break;
          case "floraexclusion.dat":
            break;
          case "invw.dat":
            break;
          default:
            this.zoneData = new ZoneData(
              data,
              this.#fileHandle,
              key,
              this.zone,
              this.models
            );
            break;
        }
      }
    }
    console.log(`Processed - ${name}`);
    console.log(`Images queued for conversion: ${images.length}`);
    if (this.#options.rawImageWrite) {
      console.log('Using raw image write');
    } else if (!skipImages) {
      const imageProcessor = await getImageProcessor();
      await imageProcessor.parseImages(images, this.#fileHandle.rootFileHandle);
      console.log("Done processing images");
    }
  }

  /**
   *
   * @param {FileSystemHandle} file
   */
  async processEQG(file, skipImages = false) {
    console.log("handle eqg", file.name);

    const arrayBuffer = await file.arrayBuffer();
    await this.processBuffer(file.name, arrayBuffer, skipImages);
  }

  /**
   *
   * @param {import('./common/models').PlaceableGroup} p
   */
  async writeModels(modelFile, mod, destination) {
    const { writeModels } = await import("./gltf-export/common");
    return writeModels.apply(this, [
      modelFile,
      mod,
      destination,
    ]);
  }

  async export() {
    if (!this.zone) {
      const destination = this.#options.modelDestination ?? 'models';
      const canonicalModName = `${this.name.toLowerCase()}.mod`;
      if (destination === 'models' && this.models[canonicalModName]) {
        await this.writeModels(
          canonicalModName,
          this.models[canonicalModName],
          destination
        );
        return true;
      }
      for (const [name, mod] of Object.entries(this.models)) {
        if (!name.includes('ter_')) {
          await this.writeModels(name, mod, destination);
        }
      }
      return true;
    }
    if (this.zone?.header?.version === 4) {
      const { exportv4 } = await import("./gltf-export/v4");
      return exportv4.apply(this, [`${this.#fileHandle.name}`]);
    }
    const { exportv3 } = await import("./gltf-export/v3");
    return exportv3.apply(this, [`${this.#fileHandle.name}`]);
  }

  async process() {
    console.log("process", this.#fileHandle.name);
    const micro = performance.now();

    for (const file of this.#fileHandle.fileHandles) {
      const extension = file.name.split(".").pop().toLowerCase();
      switch (extension) {
        case "eqg":
          await this.processEQG(file);
          break;
        case "txt":
          if (file.name.endsWith('_assets.txt') && !this.#options.skipSubload) {
            const contents = (await file.text()).split(/\r?\n/);
            for (const entry of contents) {
              const line = entry.trim();
              if (line.toLowerCase().endsWith('.eqg')) {
                console.log(`Loading dependent asset ${line}`);
                try {
                  const dir = getEQRootDir();
                  const fh = await dir.getFileHandle(line).then(f => f.getFile());
                  await this.processEQG(fh);
                  await yieldToBrowser();
                } catch(e) {
                  console.log(`Error loading dependent asset`, e);
                }
              }
            }
          }
          break;
        case "s3d":
          break;
        case "eff":
          break;
        case "xmi":
          break;
        case "emt":
          break;
        case "zon":
          this.zone = this.zone || Zone.Factory(
            new Uint8Array(await file.arrayBuffer()),
            this.#fileHandle,
            file.name,
            []
          );
          break;
        default:
          console.warn(
            `Unhandled extension for ${this.#fileHandle.name} - ${extension}`
          );
      }
    }
    console.log(
      `Took ${((performance.now() - micro) / 1000).toFixed(4)} seconds.`
    );
  }
}
