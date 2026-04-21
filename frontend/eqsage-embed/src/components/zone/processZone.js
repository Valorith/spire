export const GLOBAL_VERSION = 1.8;

const getActiveController = (controller) => controller ?? window.gameController ?? null;
let processingDepsPromise = null;
let globalStorePromise = null;

const getProcessingDeps = async () => {
  if (!processingDepsPromise) {
    processingDepsPromise = Promise.all([
      import('sage-core/model/file-handle'),
      import('sage-core/util/fileHandler'),
    ]).then(([fileHandleModule, fileHandlerModule]) => ({
      EQFileHandle       : fileHandleModule.EQFileHandle,
      getEQFile          : fileHandlerModule.getEQFile,
      getFilesRecursively: fileHandlerModule.getFilesRecursively,
      writeEQFile        : fileHandlerModule.writeEQFile,
    }));
  }
  return processingDepsPromise;
};

const getGlobalStore = async () => {
  if (!globalStorePromise) {
    globalStorePromise = import('../../state').then((module) => module.GlobalStore);
  }
  return globalStorePromise;
};

const emitStage = (reportStage, stage, detail = '') => {
  reportStage?.(stage, detail);
};

const withStageContext = async (stage, work, reportStage, detail = '') => {
  emitStage(reportStage, stage, detail);
  try {
    return await work();
  } catch (error) {
    const message = error?.message || String(error);
    emitStage(reportStage, `${stage} failed`, message);
    throw error;
  }
};

export async function processGlobal(settings, rootFileSystemHandle, standalone = false, controller = null, reportStage = null) {
  const [{ EQFileHandle, getFilesRecursively, writeEQFile }, GlobalStore] = await Promise.all([
    getProcessingDeps(),
    getGlobalStore(),
  ]);
  const activeGameController = getActiveController(controller);
  if (activeGameController) {
    activeGameController.rootFileSystemHandle = rootFileSystemHandle;
  }
  if (standalone) {
    GlobalStore.actions.setLoading(true);

    // Preprocess globalload
    GlobalStore.actions.setLoadingTitle('Loading Global Dependencies');
  }
  try {
    emitStage(reportStage, 'Checking global dependency archives');
    const handles = [];
    try {
      emitStage(reportStage, 'Scanning global dependency archives');
      for await (const fileHandle of getFilesRecursively(rootFileSystemHandle, '', new RegExp('^global.*\\.s3d'))) {
        if (/global(?:\d+)?_chr/.test(fileHandle.name) || fileHandle.name.includes('global_obj')) {
          handles.push(await fileHandle.getFile()); 
        }
      
      }
    } catch (e) {
      console.warn('Error', e, handles);
      emitStage(reportStage, 'Scanning global dependency archives failed', e?.message || String(e));
      throw e;
    }
    emitStage(reportStage, 'Preparing global dependency archive', `${handles.length} matching files`);
    console.log(`Loading handles: ${handles.map(h => h.name)}`);

    const obj = new EQFileHandle(
      'global_chr',
      handles,
      rootFileSystemHandle,
      settings
    );
    emitStage(reportStage, 'Initializing global dependency archive');
    await withStageContext(
      'Initializing global dependency archive',
      () => obj.initialize(),
      reportStage
    );
    emitStage(reportStage, 'Processing global dependency archive');
    await withStageContext(
      'Processing global dependency archive',
      () => obj.process(),
      reportStage
    );
    emitStage(reportStage, 'Saving global dependency cache');
    await withStageContext(
      'Saving global dependency cache',
      () => writeEQFile('data', 'global.json', JSON.stringify({ version: GLOBAL_VERSION })),
      reportStage
    );
    if (standalone && activeGameController) {
      activeGameController.openAlert('Done processing global');
    }
  } finally {
    if (standalone) {
      GlobalStore.actions.setLoading(false);
    }
  }
}

export async function processEquip(settings, rootFileSystemHandle, standalone = false, controller = null, reportStage = null) {
  const [{ EQFileHandle, getFilesRecursively, writeEQFile }, GlobalStore] = await Promise.all([
    getProcessingDeps(),
    getGlobalStore(),
  ]);
  const activeGameController = getActiveController(controller);
  if (activeGameController) {
    activeGameController.rootFileSystemHandle = rootFileSystemHandle;
  }
  if (standalone) {
    GlobalStore.actions.setLoading(true);

    // Preprocess globalload
    GlobalStore.actions.setLoadingTitle('Loading Global Equipment');
  }
  try {
    emitStage(reportStage, 'Checking global equipment archives');
    const handles = [];
    try {
      emitStage(reportStage, 'Scanning global equipment archives');
      for await (const fileHandle of getFilesRecursively(rootFileSystemHandle, '', new RegExp('^gequip.*\\.s3d'))) {
        if (fileHandle.name.includes('gequip')) {
          handles.push(await fileHandle.getFile()); 
        }
      }

      for await (const fileHandle of getFilesRecursively(rootFileSystemHandle, '', new RegExp('^global.*_amr\\.s3d'))) {
        if (fileHandle.name.includes('_amr.s3d')) {
          handles.push(await fileHandle.getFile());
        }
      }
    } catch (e) {
      console.warn('Error', e, handles);
      emitStage(reportStage, 'Scanning global equipment archives failed', e?.message || String(e));
      throw e;
    }

    emitStage(reportStage, 'Preparing global equipment archive', `${handles.length} matching files`);
    const obj = new EQFileHandle(
      'gequip',
      handles, // handles.filter(h => h.name.endsWith('gequip.s3d')),
      rootFileSystemHandle,
      settings
    );
    emitStage(reportStage, 'Initializing global equipment archive');
    await withStageContext(
      'Initializing global equipment archive',
      () => obj.initialize(),
      reportStage
    );
    emitStage(reportStage, 'Processing global equipment archive');
    await withStageContext(
      'Processing global equipment archive',
      () => obj.process(),
      reportStage
    );
    emitStage(reportStage, 'Saving global equipment cache');
    await withStageContext(
      'Saving global equipment cache',
      () => writeEQFile('data', 'gequip.json', JSON.stringify({ version: GLOBAL_VERSION })),
      reportStage
    );
    if (standalone && activeGameController) {
      activeGameController.openAlert('Done processing gequip');
    }
  } finally {
    if (standalone) {
      GlobalStore.actions.setLoading(false);
    }
  }
}

export async function processZone(zoneName, settings, rootFileSystemHandle, _onlyChr = false, controller = null, reportStage = null) {
  const [{ EQFileHandle, getEQFile, getFilesRecursively }, GlobalStore] = await Promise.all([
    getProcessingDeps(),
    getGlobalStore(),
  ]);
  const activeGameController = getActiveController(controller);
  if (activeGameController) {
    activeGameController.rootFileSystemHandle = rootFileSystemHandle;
  }
  GlobalStore.actions.setLoading(true);
  emitStage(reportStage, 'Checking cached global dependencies');
  const v = await getEQFile('data', 'global.json', 'json');
  if (v?.version !== GLOBAL_VERSION) {
    emitStage(reportStage, 'Refreshing global dependencies');
    await processGlobal(
      activeGameController?.settings ?? settings,
      activeGameController?.rootFileSystemHandle ?? rootFileSystemHandle,
      true,
      activeGameController,
      reportStage
    );
  }
  console.log('Zone name', zoneName);
  GlobalStore.actions.setLoadingTitle(`Processing Zone ${zoneName}`);
  GlobalStore.actions.setLoadingText('Loading Zone', zoneName);
  emitStage(reportStage, `Scanning ${zoneName} zone archives`);
  let match = false;
  try {
    const handles = [];
    try {
      for await (const fileHandle of getFilesRecursively(rootFileSystemHandle, '', new RegExp(`^${zoneName}[_\\.].*`))) {
        // if (onlyChr && !(fileHandle.name.includes('_chr') || fileHandle.name.includes('_obj'))) {
        //   continue;
        // }
        handles.push(await fileHandle.getFile()); 
      }
    } catch (e) {
      console.warn('Error', e, handles);
      emitStage(reportStage, `Scanning ${zoneName} zone archives failed`, e?.message || String(e));
      throw e;
    }

    emitStage(reportStage, `Preparing ${zoneName} asset archive`, `${handles.length} matching files`);
    const obj = new EQFileHandle(
      zoneName,
      handles,
      rootFileSystemHandle,
      settings
    );
    emitStage(reportStage, `Initializing ${zoneName} asset archive`);
    await withStageContext(
      `Initializing ${zoneName} asset archive`,
      () => obj.initialize(),
      reportStage
    );
    emitStage(reportStage, `Processing ${zoneName} asset archive`);
    match = await withStageContext(
      `Processing ${zoneName} asset archive`,
      () => obj.process(),
      reportStage
    );
  } finally {
    GlobalStore.actions.setLoading(false);
  }
  return match;
}
