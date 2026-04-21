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

const logZoneStep = (scope, message, extra) => {
  if (extra !== undefined) {
    console.log(`[SageZone:${scope}] ${message}`, extra);
    return;
  }
  console.log(`[SageZone:${scope}] ${message}`);
};

const summarizeHandles = (handles) => ({
  count  : handles.length,
  sample : handles.slice(0, 12).map((handle) => handle.name),
  omitted: Math.max(handles.length - 12, 0),
});

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
  const startedAt = performance.now();
  const activeGameController = getActiveController(controller);
  if (activeGameController) {
    activeGameController.rootFileSystemHandle = rootFileSystemHandle;
  }
  logZoneStep('global', 'Starting dependency processing', {
    standalone,
    rootHandle : rootFileSystemHandle?.name ?? null,
    forceReload: !!settings?.forceReload,
  });
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
    logZoneStep('global', 'Dependency archive scan complete', summarizeHandles(handles));

    const obj = new EQFileHandle(
      'global_chr',
      handles,
      rootFileSystemHandle,
      settings
    );
    emitStage(reportStage, 'Initializing global dependency archive');
    logZoneStep('global', 'Initializing dependency archive');
    await withStageContext(
      'Initializing global dependency archive',
      () => obj.initialize(),
      reportStage
    );
    emitStage(reportStage, 'Processing global dependency archive');
    logZoneStep('global', 'Processing dependency archive');
    await withStageContext(
      'Processing global dependency archive',
      () => obj.process(),
      reportStage
    );
    emitStage(reportStage, 'Saving global dependency cache');
    logZoneStep('global', 'Writing dependency cache marker');
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
    logZoneStep(
      'global',
      `Finished dependency processing in ${((performance.now() - startedAt) / 1000).toFixed(2)}s`
    );
  }
}

export async function processEquip(settings, rootFileSystemHandle, standalone = false, controller = null, reportStage = null) {
  const [{ EQFileHandle, getFilesRecursively, writeEQFile }, GlobalStore] = await Promise.all([
    getProcessingDeps(),
    getGlobalStore(),
  ]);
  const startedAt = performance.now();
  const activeGameController = getActiveController(controller);
  if (activeGameController) {
    activeGameController.rootFileSystemHandle = rootFileSystemHandle;
  }
  logZoneStep('equip', 'Starting equipment processing', {
    standalone,
    rootHandle : rootFileSystemHandle?.name ?? null,
    forceReload: !!settings?.forceReload,
  });
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
    logZoneStep('equip', 'Equipment archive scan complete', summarizeHandles(handles));
    const obj = new EQFileHandle(
      'gequip',
      handles, // handles.filter(h => h.name.endsWith('gequip.s3d')),
      rootFileSystemHandle,
      settings
    );
    emitStage(reportStage, 'Initializing global equipment archive');
    logZoneStep('equip', 'Initializing equipment archive');
    await withStageContext(
      'Initializing global equipment archive',
      () => obj.initialize(),
      reportStage
    );
    emitStage(reportStage, 'Processing global equipment archive');
    logZoneStep('equip', 'Processing equipment archive');
    await withStageContext(
      'Processing global equipment archive',
      () => obj.process(),
      reportStage
    );
    emitStage(reportStage, 'Saving global equipment cache');
    logZoneStep('equip', 'Writing equipment cache marker');
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
    logZoneStep(
      'equip',
      `Finished equipment processing in ${((performance.now() - startedAt) / 1000).toFixed(2)}s`
    );
  }
}

export async function processZone(zoneName, settings, rootFileSystemHandle, _onlyChr = false, controller = null, reportStage = null) {
  const [{ EQFileHandle, getEQFile, getFilesRecursively }, GlobalStore] = await Promise.all([
    getProcessingDeps(),
    getGlobalStore(),
  ]);
  const startedAt = performance.now();
  const activeGameController = getActiveController(controller);
  if (activeGameController) {
    activeGameController.rootFileSystemHandle = rootFileSystemHandle;
  }
  logZoneStep(zoneName, 'Starting zone processing', {
    rootHandle : rootFileSystemHandle?.name ?? null,
    forceReload: !!settings?.forceReload,
    webgpu     : !!settings?.webgpu,
  });
  GlobalStore.actions.setLoading(true);
  emitStage(reportStage, 'Checking cached global dependencies');
  const v = await getEQFile('data', 'global.json', 'json');
  logZoneStep(zoneName, 'Global cache status', v || null);
  if (v?.version !== GLOBAL_VERSION) {
    emitStage(reportStage, 'Refreshing global dependencies');
    logZoneStep(zoneName, 'Global cache missing or stale, refreshing dependencies', {
      expectedVersion: GLOBAL_VERSION,
      actualVersion  : v?.version ?? null,
    });
    await processGlobal(
      activeGameController?.settings ?? settings,
      activeGameController?.rootFileSystemHandle ?? rootFileSystemHandle,
      true,
      activeGameController,
      reportStage
    );
  }
  const watchdog = window.setInterval(() => {
    logZoneStep(
      zoneName,
      `Still processing zone assets after ${((performance.now() - startedAt) / 1000).toFixed(1)}s`
    );
  }, 10000);
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
        if (handles.length <= 5 || handles.length % 25 === 0) {
          logZoneStep(zoneName, `Discovered ${handles.length} matching zone files`, {
            latest: fileHandle.name,
          });
        }
      }
    } catch (e) {
      console.warn('Error', e, handles);
      emitStage(reportStage, `Scanning ${zoneName} zone archives failed`, e?.message || String(e));
      throw e;
    }

    emitStage(reportStage, `Preparing ${zoneName} asset archive`, `${handles.length} matching files`);
    logZoneStep(zoneName, 'Zone archive scan complete', summarizeHandles(handles));
    const obj = new EQFileHandle(
      zoneName,
      handles,
      rootFileSystemHandle,
      settings
    );
    emitStage(reportStage, `Initializing ${zoneName} asset archive`);
    logZoneStep(zoneName, 'Initializing zone archive');
    await withStageContext(
      `Initializing ${zoneName} asset archive`,
      () => obj.initialize(),
      reportStage
    );
    emitStage(reportStage, `Processing ${zoneName} asset archive`);
    logZoneStep(zoneName, 'Processing zone archive');
    match = await withStageContext(
      `Processing ${zoneName} asset archive`,
      () => obj.process(),
      reportStage
    );
    logZoneStep(zoneName, 'Zone archive processing completed', { match });
  } finally {
    window.clearInterval(watchdog);
    GlobalStore.actions.setLoading(false);
    logZoneStep(
      zoneName,
      `Finished zone processing in ${((performance.now() - startedAt) / 1000).toFixed(2)}s`
    );
  }
  return match;
}
