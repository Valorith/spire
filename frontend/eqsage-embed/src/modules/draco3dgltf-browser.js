import dracoDecoderSource from 'three/examples/jsm/libs/draco/gltf/draco_decoder.js?raw';
import dracoDecoderWasmUrl from 'three/examples/jsm/libs/draco/gltf/draco_decoder.wasm?url';
import dracoEncoderSource from 'three/examples/jsm/libs/draco/gltf/draco_encoder.js?raw';
import dracoEncoderWasmUrl from '../../node_modules/draco3dgltf/draco_encoder.wasm?url';

const createModuleFactory = (source, fallbackExportName) => {
  const module = { exports: {} };
  const exports = module.exports;
  const factory = new Function(
    'module',
    'exports',
    'globalThis',
    `${source}
return module.exports || exports.${fallbackExportName} || globalThis.${fallbackExportName};`
  );
  const moduleFactory = factory(module, exports, globalThis);

  if (typeof moduleFactory !== 'function') {
    throw new Error(`Unable to create ${fallbackExportName} factory`);
  }

  return moduleFactory;
};

const getArrayBuffer = async (url, label) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load ${label}: ${response.status}`);
  }
  return response.arrayBuffer();
};

let decoderFactoryPromise;
let decoderWasmPromise;
let encoderFactoryPromise;
let encoderWasmPromise;

const getDecoderFactory = async () => {
  if (!decoderFactoryPromise) {
    decoderFactoryPromise = Promise.resolve(
      createModuleFactory(dracoDecoderSource, 'DracoDecoderModule')
    );
  }
  return decoderFactoryPromise;
};

const getDecoderWasmBinary = async () => {
  if (!decoderWasmPromise) {
    decoderWasmPromise = getArrayBuffer(
      dracoDecoderWasmUrl,
      'Draco decoder WASM'
    );
  }
  return decoderWasmPromise;
};

const getEncoderFactory = async () => {
  if (!encoderFactoryPromise) {
    encoderFactoryPromise = Promise.resolve(
      createModuleFactory(dracoEncoderSource, 'DracoEncoderModule')
    );
  }
  return encoderFactoryPromise;
};

const getEncoderWasmBinary = async () => {
  if (!encoderWasmPromise) {
    encoderWasmPromise = getArrayBuffer(
      dracoEncoderWasmUrl,
      'Draco encoder WASM'
    );
  }
  return encoderWasmPromise;
};

const buildModuleOptions = async (options, wasmBinaryPromise, wasmUrl) => ({
  ...options,
  wasmBinary: await wasmBinaryPromise,
  locateFile(fileName) {
    if (typeof options?.locateFile === 'function') {
      return options.locateFile(fileName);
    }
    return wasmUrl;
  },
});

export const createDecoderModule = async (options = {}) => {
  const factory = await getDecoderFactory();
  return factory(
    await buildModuleOptions(options, getDecoderWasmBinary(), dracoDecoderWasmUrl)
  );
};

export const createEncoderModule = async (options = {}) => {
  const factory = await getEncoderFactory();
  return factory(
    await buildModuleOptions(options, getEncoderWasmBinary(), dracoEncoderWasmUrl)
  );
};

export default {
  createDecoderModule,
  createEncoderModule,
};
