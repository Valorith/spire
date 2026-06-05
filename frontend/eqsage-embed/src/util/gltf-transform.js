let gltfTransformModulesPromise;

export const loadGltfTransformModules = async () => {
  if (!gltfTransformModulesPromise) {
    gltfTransformModulesPromise = Promise.all([
      import('@gltf-transform/core'),
      import('@gltf-transform/extensions'),
      import('@gltf-transform/functions'),
    ]).then(([core, extensions, functions]) => ({
      WebIO          : core.WebIO,
      ALL_EXTENSIONS : extensions.ALL_EXTENSIONS,
      dedup          : functions.dedup,
      prune          : functions.prune,
      textureCompress: functions.textureCompress,
    }));
  }

  return gltfTransformModulesPromise;
};

export const createGltfTransformIo = async () => {
  const { WebIO, ALL_EXTENSIONS } = await loadGltfTransformModules();
  return new WebIO().registerExtensions(ALL_EXTENSIONS);
};
