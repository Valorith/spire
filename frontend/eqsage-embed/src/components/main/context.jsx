import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionStatusTypes, usePermissions } from 'sage-core/hooks/permissions';
import { useSettingsContext } from '../../context/settings';
import { getEmbedConfig } from '../../embed-config';
import { debugSageLog, markStage } from '../../debug-stage';

const MainContext = React.createContext({});
let gameControllerImportPromise = null;
let babylonRuntimePromise = null;

/**
 * @typedef Spire
 * @property {import ('../../../../spire/frontend/src/app/api/spire-api')} SpireApi
 * @property {import ('../../../../spire/frontend/src/app/api')} SpireApiTypes
 * @property {import ('../../../../spire/frontend/src/app/api/spire-query-builder').SpireQueryBuilder} SpireQueryBuilder
 * @property {import ('../../../../spire/frontend/src/app/zones').Zones} Zones
 * @property {import ('../../../../spire/frontend/src/app/spawn').Spawn} Spawn
 * @property {import ('../../../../spire/frontend/src/app/grid').Grid} Grid
 * @property {import ('../../../../spire/frontend/src/app/npcs').Npcs} Npcs
 */

/**
 * @typedef {Object} UseMainContextReturn
 * @property {any} selectedZone - The currently selected zone.
 * @property {React.Dispatch<React.SetStateAction<any>>} setSelectedZone - Function to set the selected zone.
 * @property {boolean} zoneDialogOpen - Whether the zone dialog is open.
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setZoneDialogOpen - Function to set the zone dialog open state.
 * @property {boolean} statusDialogOpen - Whether the status dialog is open.
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setStatusDialogOpen - Function to set the status dialog open state.
 * @property {boolean} modelExporter - Whether the model exporter is enabled.
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setModelExporter - Function to set the model exporter state.
 * @property {any} rootFileSystemHandle - The file system handle for the root.
 * @property {any[]} zones - The list of zones.
 * @property {React.Dispatch<React.SetStateAction<any[]>>} setZones - Function to set the list of zones.
 * @property {Spire} Spire - Spire object containing APIs and utilities.
 * @property {any} onDrop - Handler for file drop operations.
 * @property {any} requestPermissions - Function to request permissions.
 * @property {PermissionStatusTypes} permissionStatus - The current permission status.
 * @property {any[]} recentList - List of recent zones.
 * @property {React.Dispatch<React.SetStateAction<any[]>>} setRecentList - Function to set the recent zones list.
 */

/**
 *
 * @returns {UseMainContextReturn}
 */
export const useMainContext = () => React.useContext(MainContext);

/**
 *
 * @param {*} param0
 * @returns
 */

export const MainProvider = ({
  children,
  initialRouteState,
  onChromeChange,
  spireBridge,
}) => {
  markStage('main-provider:render:start');
  const [
    permissionStatus,
    onDrop,
    requestPermissions,
    rootFileSystemHandle,
    onFolderSelected,
  ] = usePermissions();
  const { remoteUrl } = useSettingsContext();
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneDialogOpen, setZoneDialogOpen] = useState(
    () => permissionStatus === PermissionStatusTypes.Ready
  );
  const [statusDialogOpen, setStatusDialogOpen] = useState(
    () => permissionStatus !== PermissionStatusTypes.Ready
  );
  const [zoneBuilderDialogOpen, setZoneBuilderDialogOpen] = useState(false);
  const [audioDialogOpen, setAudioDialogOpen] = useState(false);
  const [modelExporter, setModelExporter] = useState(false);
  const [quailWorkspace, setQuailWorkspace] = useState(false);
  const [zoneBuilder, setZoneBuilder] = useState(false);
  const [zones, setZones] = useState([]);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [canvasState, setCanvasState] = useState(false);
  const [modelExporterLoaded, setModelExporterLoaded] = useState(false);
  const [gameController, setGameController] = useState(() => window.gameController ?? null);
  const [gameControllerLoading, setGameControllerLoading] = useState(false);
  const [gameControllerLoadError, setGameControllerLoadError] = useState(null);
  const [controllerLoadStage, setControllerLoadStage] = useState('Waiting for zone selection');
  const { embeddedMode } = getEmbedConfig();
  const Spire = useMemo(
    () => spireBridge ?? null,
    [spireBridge]
  );

  const [recentList, setRecentList] = useState(() =>
    localStorage.getItem('recent-zones')
      ? JSON.parse(localStorage.getItem('recent-zones'))
      : []
  );
  const reset = useCallback(() => {
    setSelectedZone(null);
    setZoneDialogOpen(true);
    setStatusDialogOpen(false);
    setZoneBuilderDialogOpen(false);
    setAudioDialogOpen(false);
    setModelExporter(false);
    setZoneBuilder(false);
    setCanvasState(false);
    setRightDrawerOpen(false);
    setQuailWorkspace(false);
    setGameControllerLoadError(null);
    setControllerLoadStage('Waiting for zone selection');
  }, []);

  useEffect(() => {
    setStatusDialogOpen(permissionStatus !== PermissionStatusTypes.Ready);
    if (
      permissionStatus === PermissionStatusTypes.Ready &&
      !selectedZone &&
      !zoneDialogOpen
    ) {
      setZoneDialogOpen(true);
    } else if (
      permissionStatus === PermissionStatusTypes.Ready &&
      !selectedZone
    ) {
      setZoneDialogOpen(true);
    }
  }, [permissionStatus, selectedZone, zoneDialogOpen]);

  useEffect(() => {
    markStage('main-provider:permission-effect', {
      permissionStatus,
      selectedZone: selectedZone?.short_name ?? null,
      hasRootHandle: !!rootFileSystemHandle,
    });
    debugSageLog('[SageMainProvider] permission state', {
      permissionStatus,
      selectedZone : selectedZone?.short_name ?? null,
      rootFsHandle : rootFileSystemHandle?.name ?? null,
      embeddedMode,
      hasSpire     : !!Spire,
    });
  }, [
    Spire,
    embeddedMode,
    permissionStatus,
    rootFileSystemHandle,
    selectedZone,
  ]);

  useEffect(() => {
    debugSageLog('[SageMainProvider] dialog state', {
      zoneDialogOpen,
      statusDialogOpen,
      selectedZone: selectedZone?.short_name ?? null,
    });
  }, [selectedZone, statusDialogOpen, zoneDialogOpen]);

  useEffect(() => {
    window.__spireSageRootFileSystemHandle = rootFileSystemHandle ?? null;
    if (gameController) {
      gameController.rootFileSystemHandle = rootFileSystemHandle;
      window.gameController = gameController;
    }
    return () => {
      if (!rootFileSystemHandle) {
        window.__spireSageRootFileSystemHandle = null;
      }
    };
  }, [gameController, rootFileSystemHandle]);

  const ensureBabylonRuntime = useCallback(async () => {
    if (!babylonRuntimePromise) {
      babylonRuntimePromise = import('@bjs')
        .then(async ({ default: bjs }) => {
          await bjs.initialize();
          return bjs;
        })
        .catch((error) => {
          babylonRuntimePromise = null;
          throw error;
        });
    }
    return babylonRuntimePromise;
  }, []);

  const loadGameController = useCallback(async () => {
    if (gameController) {
      setControllerLoadStage('Viewer controller ready');
      return gameController;
    }
    if (!gameControllerImportPromise) {
      setGameControllerLoadError(null);
      setGameControllerLoading(true);
      setControllerLoadStage('Loading Babylon runtime');
      gameControllerImportPromise = ensureBabylonRuntime()
        .then(() => {
          setControllerLoadStage('Importing game controller');
          return import('../../viewer/controllers/GameController');
        })
        .then((module) => {
          setControllerLoadStage('Initializing game controller');
          const controller = module.gameController;
          if (window.__spireSageOpenAlert) {
            controller.openAlert = window.__spireSageOpenAlert;
          }
          controller.rootFileSystemHandle = window.__spireSageRootFileSystemHandle ?? null;
          window.gameController = controller;
          setGameController(controller);
          setControllerLoadStage('Viewer controller ready');
          return controller;
        })
        .catch((error) => {
          setGameControllerLoadError(error);
          setControllerLoadStage('Failed to load viewer controller');
          console.error('[SageMainProvider] failed to load gameController', error);
          throw error;
        })
        .finally(() => {
          setGameControllerLoading(false);
          gameControllerImportPromise = null;
        });
    }
    return gameControllerImportPromise;
  }, [ensureBabylonRuntime, gameController]);

  useEffect(() => {
    if (
      permissionStatus !== PermissionStatusTypes.Ready ||
      statusDialogOpen ||
      !zoneDialogOpen ||
      !!gameController
    ) {
      return;
    }
    void ensureBabylonRuntime().catch((error) => {
      console.error('[SageMainProvider] failed to preload Babylon runtime', error);
    });
  }, [
    ensureBabylonRuntime,
    gameController,
    permissionStatus,
    statusDialogOpen,
    zoneDialogOpen,
  ]);

  useEffect(() => {
    if (
      permissionStatus !== PermissionStatusTypes.Ready ||
      statusDialogOpen ||
      zoneDialogOpen ||
      !selectedZone ||
      !!gameController ||
      gameControllerLoading ||
      !!gameControllerLoadError
    ) {
      return;
    }
    void loadGameController().catch((error) => {
      console.error('[SageMainProvider] failed to load controller after zone selection', error);
    });
  }, [
    gameController,
    gameControllerLoadError,
    gameControllerLoading,
    loadGameController,
    permissionStatus,
    selectedZone,
    statusDialogOpen,
    zoneDialogOpen,
  ]);

  useEffect(() => {
    if (!selectedZone) {
      setGameControllerLoadError(null);
      setControllerLoadStage('Waiting for zone selection');
    }
  }, [selectedZone]);

  useEffect(() => {
    if (gameController) {
      gameController.modelExporter = true;
      window.gameController = gameController;
    }
  }, [gameController, modelExporter]);

  useEffect(() => {
    if (Spire?.SpireApi) {
      Spire.SpireApi.remoteUrl = remoteUrl || Spire.SpireApi.remoteUrl;
    }
  }, [remoteUrl]);

  useEffect(() => {
    localStorage.setItem('recent-zones', JSON.stringify(recentList));
  }, [recentList]);

  useEffect(() => {
    if (gameController) {
      gameController.Spire = Spire;
      window.gameController = gameController;
    }
  }, [Spire, gameController]);

  useEffect(() => {
    onChromeChange?.({ immersive: true });
    return () => onChromeChange?.({ immersive: false });
  }, [onChromeChange]);

  return (
    <MainContext.Provider
      value={{
        canvasState,
        setCanvasState,
        selectedZone,
        setSelectedZone,
        zoneDialogOpen,
        setZoneDialogOpen,
        statusDialogOpen,
        setStatusDialogOpen,
        audioDialogOpen,
        setAudioDialogOpen,
        zoneBuilderDialogOpen,
        setZoneBuilderDialogOpen,
        modelExporter,
        setModelExporter,
        quailWorkspace,
        setQuailWorkspace,
        zoneBuilder,
        setZoneBuilder,
        rightDrawerOpen,
        setRightDrawerOpen,
        modelExporterLoaded,
        setModelExporterLoaded,
        rootFileSystemHandle,
        zones,
        setZones,
        Spire,
        embeddedMode,
        initialRouteState,
        onDrop,
        requestPermissions,
        permissionStatus,
        onFolderSelected,
        recentList,
        setRecentList,
        reset,
        gameController,
        gameControllerLoading,
        gameControllerLoadError,
        controllerLoadStage,
        loadGameController,
      }}
    >
      {children}
    </MainContext.Provider>
  );
};
