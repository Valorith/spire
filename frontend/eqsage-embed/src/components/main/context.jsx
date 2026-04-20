import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionStatusTypes, usePermissions } from 'sage-core/hooks/permissions';
import { useSettingsContext } from '../../context/settings';
import { gameController } from '../../viewer/controllers/GameController';
import { getEmbedConfig } from '../../embed-config';

const MainContext = React.createContext({});

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
  const [
    permissionStatus,
    onDrop,
    requestPermissions,
    rootFileSystemHandle,
    onFolderSelected,
  ] = usePermissions();
  const { remoteUrl } = useSettingsContext();
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [zoneBuilderDialogOpen, setZoneBuilderDialogOpen] = useState(false);
  const [audioDialogOpen, setAudioDialogOpen] = useState(false);
  const [modelExporter, setModelExporter] = useState(false);
  const [quailWorkspace, setQuailWorkspace] = useState(false);
  const [zoneBuilder, setZoneBuilder] = useState(false);
  const [zones, setZones] = useState([]);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [canvasState, setCanvasState] = useState(false);
  const [modelExporterLoaded, setModelExporterLoaded] = useState(false);
  const { embeddedMode } = getEmbedConfig();

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
  }, []);

  useEffect(() => {
    setStatusDialogOpen(permissionStatus !== PermissionStatusTypes.Ready);
    if (permissionStatus === PermissionStatusTypes.Ready && !selectedZone) {
      setZoneDialogOpen(true);
    }
  }, [permissionStatus, selectedZone]);

  useEffect(() => {
    console.log('[SageMainProvider] permission state', {
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
    console.log('[SageMainProvider] dialog state', {
      zoneDialogOpen,
      statusDialogOpen,
      selectedZone: selectedZone?.short_name ?? null,
    });
  }, [selectedZone, statusDialogOpen, zoneDialogOpen]);

  useEffect(() => {
    window.gameController.rootFileSystemHandle = rootFileSystemHandle;
  }, [rootFileSystemHandle]);

  useEffect(() => {
    window.gameController.modelExporter = true;
  }, [modelExporter]);

  const Spire = useMemo(
    () => spireBridge ?? null,
    [spireBridge]
  );

  useEffect(() => {
    if (Spire?.SpireApi) {
      Spire.SpireApi.remoteUrl = remoteUrl || Spire.SpireApi.remoteUrl;
    }
  }, [remoteUrl]);

  useEffect(() => {
    localStorage.setItem('recent-zones', JSON.stringify(recentList));
  }, [recentList]);

  useEffect(() => {
    gameController.Spire = Spire;
  }, [Spire]);

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
      }}
    >
      {children}
    </MainContext.Provider>
  );
};
