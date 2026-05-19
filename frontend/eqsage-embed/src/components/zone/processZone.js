import { ZONE_VERSION } from 'sage-core/model/constants';

export const GLOBAL_VERSION = 2.0;
export const PREVIEW_CHARACTER_CACHE_VERSION = 12;

const getActiveController = (controller) => controller ?? window.gameController ?? null;
let processingDepsPromise = null;
let fileHandlerDepsPromise = null;
let globalStorePromise = null;

const getProcessingDeps = async () => {
  if (!processingDepsPromise) {
    processingDepsPromise = Promise.all([
      import('sage-core/model/file-handle'),
      import('sage-core/util/fileHandler'),
    ]).then(([fileHandleModule, fileHandlerModule]) => ({
      EQFileHandle       : fileHandleModule.EQFileHandle,
      getEQFile          : fileHandlerModule.getEQFile,
      getEQFileExists    : fileHandlerModule.getEQFileExists,
      getFilesRecursively: fileHandlerModule.getFilesRecursively,
      writeEQFile        : fileHandlerModule.writeEQFile,
    }));
  }
  return processingDepsPromise;
};

const getFileHandlerDeps = async () => {
  if (!fileHandlerDepsPromise) {
    fileHandlerDepsPromise = import('sage-core/util/fileHandler').then((fileHandlerModule) => ({
      getEQFile      : fileHandlerModule.getEQFile,
      getEQFileExists: fileHandlerModule.getEQFileExists,
      writeEQFile    : fileHandlerModule.writeEQFile,
    }));
  }
  return fileHandlerDepsPromise;
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

const logZoneStep = () => {};

const isPreviewBridge = () =>
  typeof window !== 'undefined' && !!window.__spireSagePreview;

const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));

const collectMatchingRootFiles = async (
  rootFileSystemHandle,
  nameCheck,
  filter = () => true,
  onProgress = null
) => {
  const handles = [];
  let scanned = 0;

  for await (const fileHandle of rootFileSystemHandle.values()) {
    scanned++;
    if (scanned % 250 === 0) {
      onProgress?.(scanned, handles.length, fileHandle.name);
      await yieldToBrowser();
    }
    if (fileHandle.kind !== 'file' || !nameCheck.test(fileHandle.name)) {
      continue;
    }
    if (!filter(fileHandle.name)) {
      continue;
    }
    handles.push(await fileHandle.getFile());
    onProgress?.(scanned, handles.length, fileHandle.name);
  }

  return handles;
};

const primeCachedZoneAssets = async (zoneName, metadata, getEQFile, reportStage) => {
  if (!isPreviewBridge()) {
    return;
  }

  emitStage(reportStage, `Loading cached ${zoneName} geometry`);
  await getEQFile('zones', `${zoneName}.glb`);

  // Static object models are loaded by the viewer after the zone is ready.
  // The preview bridge only needs the primary zone geometry primed before
  // Babylon starts its render loop.
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
  const [{ EQFileHandle, writeEQFile }, GlobalStore] = await Promise.all([
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
      handles.push(...await collectMatchingRootFiles(
        rootFileSystemHandle,
        new RegExp('^global.*\\.s3d', 'i'),
        (name) => {
          const lowerName = name.toLowerCase();
          return /^global.*_chr\d*\.s3d$/.test(lowerName) || lowerName.includes('global_obj');
        },
        (scanned, found, latest) => {
          if (found <= 5 || scanned % 1000 === 0) {
            emitStage(
              reportStage,
              'Scanning global dependency archives',
              `${found} matches after ${scanned} root entries${latest ? ` (${latest})` : ''}`
            );
          }
        }
      ));
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
      () => writeEQFile(
        'data',
        'global.json',
        JSON.stringify({
          spireCharacterModels  : true,
          spireCharacterTextures: true,
          spireCharacterCacheVersion: PREVIEW_CHARACTER_CACHE_VERSION,
          version               : GLOBAL_VERSION,
        })
      ),
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
  const [{ EQFileHandle, writeEQFile }, GlobalStore] = await Promise.all([
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
      handles.push(...await collectMatchingRootFiles(
        rootFileSystemHandle,
        new RegExp('^gequip.*\\.s3d'),
        (name) => name.includes('gequip'),
        (scanned, found, latest) => {
          if (found <= 5 || scanned % 1000 === 0) {
            emitStage(
              reportStage,
              'Scanning global equipment archives',
              `${found} matches after ${scanned} root entries${latest ? ` (${latest})` : ''}`
            );
          }
        }
      ));

      handles.push(...await collectMatchingRootFiles(
        rootFileSystemHandle,
        new RegExp('^global.*_amr\\.s3d'),
        (name) => name.includes('_amr.s3d')
      ));
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
  const [{ getEQFile, getEQFileExists, writeEQFile }, GlobalStore] = await Promise.all([
    getFileHandlerDeps(),
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
  let watchdog = null;
  let match = false;
  try {
    emitStage(reportStage, 'Checking cached global dependencies');
    const [v, fallbackModelExists] = await Promise.all([
      getEQFile('data', 'global.json', 'json'),
      getEQFileExists('models', 'hum.glb'),
    ]);
    logZoneStep(zoneName, 'Global cache status', {
      ...(v || {}),
      fallbackModelExists,
    });
    const globalCharacterCacheReady =
      !isPreviewBridge() ||
      (
        v?.spireCharacterModels === true &&
        v?.spireCharacterTextures === true &&
        v?.spireCharacterCacheVersion === PREVIEW_CHARACTER_CACHE_VERSION
      );
    if (v?.version !== GLOBAL_VERSION || !fallbackModelExists || !globalCharacterCacheReady) {
      emitStage(reportStage, 'Refreshing global dependencies');
      logZoneStep(zoneName, 'Global cache missing or stale, refreshing dependencies', {
        expectedVersion    : GLOBAL_VERSION,
        actualVersion      : v?.version ?? null,
        fallbackModelExists,
        globalCharacterCacheReady,
      });
      await processGlobal(
        activeGameController?.settings ?? settings,
        activeGameController?.rootFileSystemHandle ?? rootFileSystemHandle,
        true,
        activeGameController,
        reportStage
      );
    }

    emitStage(reportStage, `Checking cached ${zoneName} zone assets`);
    const [existingMetadata, exists] = await Promise.all([
      getEQFile('zones', `${zoneName}.json`, 'json'),
      getEQFileExists('zones', `${zoneName}.glb`),
    ]);
    logZoneStep(zoneName, 'Zone cache status', {
      glbExists      : exists,
      metadataVersion: existingMetadata?.version ?? null,
      expectedVersion: ZONE_VERSION,
    });
    const previewCharacterCacheReady =
      !isPreviewBridge() ||
      (
        existingMetadata?.spireCharacterModels === true &&
        existingMetadata?.spireCharacterTextures === true &&
        existingMetadata?.spireCharacterCacheVersion === PREVIEW_CHARACTER_CACHE_VERSION
      );
    if (
      exists &&
      existingMetadata?.version === ZONE_VERSION &&
      previewCharacterCacheReady &&
      !settings?.forceReload
    ) {
      emitStage(reportStage, `Using cached ${zoneName} zone assets`);
      logZoneStep(zoneName, 'Zone cache hit, skipping archive scan');
      await primeCachedZoneAssets(zoneName, existingMetadata, getEQFile, reportStage);
      return existingMetadata;
    }

    const { EQFileHandle } = await getProcessingDeps();
    watchdog = window.setInterval(() => {
      logZoneStep(
        zoneName,
        `Still processing zone assets after ${((performance.now() - startedAt) / 1000).toFixed(1)}s`
      );
    }, 10000);
    GlobalStore.actions.setLoadingTitle(`Processing Zone ${zoneName}`);
    GlobalStore.actions.setLoadingText('Loading Zone', zoneName);
    emitStage(reportStage, `Scanning ${zoneName} zone archives`);
    const handles = [];
    try {
      handles.push(...await collectMatchingRootFiles(
        rootFileSystemHandle,
        new RegExp(`^${zoneName}[_\\.].*`, 'i'),
        () => true,
        (_scanned, found, latest) => {
          if (found <= 5 || found % 25 === 0) {
            emitStage(
              reportStage,
              `Scanning ${zoneName} zone archives`,
              `${found} matching files${latest ? ` (${latest})` : ''}`
            );
          }
          logZoneStep(zoneName, `Discovered ${handles.length} matching zone files`, {
            latest,
          });
        }
      ));
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
    if (isPreviewBridge()) {
      const metadata = (await getEQFile('zones', `${zoneName}.json`, 'json')) || {};
      await writeEQFile(
        'zones',
        `${zoneName}.json`,
        JSON.stringify({
          ...metadata,
          spireCharacterModels  : true,
          spireCharacterTextures: true,
          spireCharacterCacheVersion: PREVIEW_CHARACTER_CACHE_VERSION,
        })
      );
    }
    logZoneStep(zoneName, 'Zone archive processing completed', { match });
  } finally {
    if (watchdog) {
      window.clearInterval(watchdog);
    }
    GlobalStore.actions.setLoading(false);
    logZoneStep(
      zoneName,
      `Finished zone processing in ${((performance.now() - startedAt) / 1000).toFixed(2)}s`
    );
  }
  return (await getEQFile('zones', `${zoneName}.json`, 'json')) || match;
}
