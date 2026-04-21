import React, { Suspense, useEffect, useState } from 'react';
import { Box, Stack, ThemeProvider, Typography, createTheme } from '@mui/material';
import { ConfirmProvider } from 'material-ui-confirm';
import { useMainContext } from './context';
import { GlobalStore } from '@/state';
import { assetUrl } from '../../embed-config';

import './main.scss';
import { debugSageLog, markStage } from '../../debug-stage';

const CONSTANTS = {
  BONE         : '#ccc',
  CONTRAST_TEXT: '#777',
  LIGHT_GRAY   : 'rgba(0,0,0,0.1)',
};

const bgMax = 6;
const BabylonZone = React.lazy(() =>
  import('../zone/zone').then((module) => ({ default: module.BabylonZone }))
);
const ZoneProvider = React.lazy(() =>
  import('../zone/zone-context').then((module) => ({ default: module.ZoneProvider }))
);
const StatusDialog = React.lazy(() =>
  import('../dialogs/status-dialog').then((module) => ({ default: module.StatusDialog }))
);
const ZoneChooserDialog = React.lazy(() =>
  import('../dialogs/zone-chooser-dialog').then((module) => ({ default: module.ZoneChooserDialog }))
);
const LoadingDialog = React.lazy(() =>
  import('../spire/dialogs/loading-dialog').then((module) => ({ default: module.LoadingDialog }))
);

const ZoneLoadingOverlay = ({
  title = 'Preparing Zone Editor',
  message,
  error,
}) => (
  <Box
    sx={{
      position      : 'fixed',
      inset         : 0,
      zIndex        : 2400,
      display       : 'flex',
      alignItems    : 'center',
      justifyContent: 'center',
      padding       : 3,
      pointerEvents : 'none',
    }}
  >
    <Box
      sx={{
        minWidth    : 320,
        border      : '1px solid rgba(221, 208, 160, 0.7)',
        background  : 'linear-gradient(180deg, rgba(17, 24, 34, 0.98), rgba(9, 13, 19, 0.98))',
        boxShadow   : '0 18px 48px rgba(0, 0, 0, 0.55)',
        borderRadius: '6px',
        color       : '#e8dcc0',
        padding     : 3,
        textAlign   : 'center',
      }}
    >
      <Typography sx={{ fontSize: 18, marginBottom: 1 }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 15 }} color="text.secondary">
        {message}
      </Typography>
      {error && (
        <Typography sx={{ fontSize: 13, marginTop: 1.5 }} color="error.main">
          {error}
        </Typography>
      )}
    </Box>
  </Box>
);

export const Main = ({ onBootStateChange } = {}) => {
  markStage('main:render');
  debugSageLog('[SageMainRender]');
  const {
    selectedZone,
    zoneDialogOpen,
    statusDialogOpen,
    rootFileSystemHandle,
    gameController,
    gameControllerLoadError,
    controllerLoadStage,
    onDrop,
    requestPermissions,
    permissionStatus,
    onFolderSelected,
  } = useMainContext();
  const [unsupported, setUnsupported] = useState(false);
  const [sessionBg] = useState(
    () =>
      `center no-repeat url('${assetUrl(
        `static/sage/bg${Math.ceil(Math.random() * bgMax)}.jpg`
      )}')`
  );

  useEffect(() => {
    if (window.electronAPI) {
      (async () => {
        const hasStandalone = await window.electronAPI?.hasStandalone?.();
        if (!hasStandalone) {
          GlobalStore.actions.setLoading(true);
          GlobalStore.actions.setLoadingTitle(
            'Unsupported Version: Breaking Changes'
          );
          GlobalStore.actions.setLoadingText(
            'The legacy standalone client is no longer supported. Use the embedded zone editor inside Spire instead.'
          );
          setUnsupported(true);
        }
      })();
    }
  }, []);

  useEffect(() => {
    onBootStateChange?.({
      stage    : 'boot:main-ready',
      detail   : 'Main view loaded',
      uiVisible: true,
    });
  }, [onBootStateChange]);

  useEffect(() => {
    markStage('main:state-effect', {
      permissionStatus,
      statusDialogOpen,
      zoneDialogOpen,
      hasGameController: !!gameController,
      selectedZone     : selectedZone?.short_name ?? null,
      hasRootHandle: !!rootFileSystemHandle,
      unsupported,
    });
    debugSageLog('[SageMain] render state', {
      permissionStatus,
      statusDialogOpen,
      zoneDialogOpen,
      hasGameController: !!gameController,
      selectedZone     : selectedZone?.short_name ?? null,
      hasRootHandle: !!rootFileSystemHandle,
      unsupported,
    });

    if (statusDialogOpen) {
      onBootStateChange?.({
        stage    : 'boot:status-dialog',
        detail   : 'Waiting for EverQuest directory access',
        uiVisible: true,
      });
      return;
    }

    if (zoneDialogOpen) {
      onBootStateChange?.({
        stage    : 'boot:zone-dialog',
        detail   : 'Waiting for zone selection',
        uiVisible: true,
      });
      return;
    }

    if (selectedZone && !gameController) {
      onBootStateChange?.({
        stage    : 'boot:controller-loading',
        detail   : controllerLoadStage || 'Loading viewer controller',
        uiVisible: true,
      });
      return;
    }

    if (selectedZone && gameController) {
      onBootStateChange?.({
        stage    : 'boot:zone-active',
        detail   : `Launching ${selectedZone.long_name ?? selectedZone.short_name}`,
        uiVisible: true,
      });
      return;
    }

    onBootStateChange?.({
      stage    : 'boot:blank',
      detail   : 'No startup dialog or zone state is active',
      uiVisible: false,
    });
  }, [
    controllerLoadStage,
    gameController,
    onBootStateChange,
    permissionStatus,
    rootFileSystemHandle,
    selectedZone,
    statusDialogOpen,
    unsupported,
    zoneDialogOpen,
  ]);

  return (
    <Box>
      <Suspense fallback={null}>
        <LoadingDialog />
      </Suspense>
      {!unsupported ? (
        <ThemeProvider
          theme={createTheme({
            palette: {
              mode   : 'dark',
              primary: {
                main        : CONSTANTS.BONE,
                contrastText: CONSTANTS.CONTRAST_TEXT,
              },
            },
            typography: {
              fontFamily: 'Montaga',
              button    : {
                textTransform: 'none',
                color        : '#eee !important',
                borderColor  : '#eee',
                fontSize     : '16px',
              },
            },
            overrides: {
              MuiButton: {
                contained: {
                  color          : CONSTANTS.BONE,
                  backgroundColor: CONSTANTS.CONTRAST_TEXT,
                  '&:hover'      : {
                    backgroundColor       : CONSTANTS.LIGHT_GRAY,
                    // Reset on touch devices, it doesn't add specificity
                    '@media (hover: none)': {
                      backgroundColor: CONSTANTS.CONTRAST_TEXT,
                    },
                  },
                },
              },
            },
          })}
        >
          <ConfirmProvider>
            <Stack
              onDragOver={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              direction={'row'}
              onDrop={onDrop}
              sx={{
                position      : 'fixed',
                inset         : 0,
                zIndex        : 0,
                pointerEvents : 'none',
                background    : sessionBg,
                backgroundSize: 'cover',
              }}
              className="sage-main"
            />
            <Suspense
              fallback={
                <ZoneLoadingOverlay
                  title="Preparing Sage"
                  message="Loading startup dialog..."
                />
              }
            >
              {statusDialogOpen && (
                <StatusDialog
                  fsHandle={rootFileSystemHandle}
                  onDrop={onDrop}
                  permissionStatus={permissionStatus}
                  open={true}
                  requestPermissions={requestPermissions}
                  onFolderSelected={onFolderSelected}
                />
              )}
              {zoneDialogOpen && <ZoneChooserDialog open={true} />}
            </Suspense>
            {!statusDialogOpen && !zoneDialogOpen && !selectedZone && (
              <ZoneLoadingOverlay
                title="Preparing Sage"
                message={
                  rootFileSystemHandle
                    ? 'Restoring startup UI...'
                    : 'Checking local EverQuest directory access...'
                }
                error="Startup did not reach the directory or zone chooser dialogs."
              />
            )}
            {!statusDialogOpen && !zoneDialogOpen && !!selectedZone && !gameController && (
              <ZoneLoadingOverlay
                message={
                  controllerLoadStage ||
                  `Loading viewer modules for ${selectedZone.long_name ?? selectedZone.short_name}.`
                }
                error={
                  gameControllerLoadError
                    ? 'Viewer bootstrap failed. Reopen Sage or choose the zone again after refresh.'
                    : null
                }
              />
            )}
            {!statusDialogOpen && !zoneDialogOpen && !!selectedZone && !!gameController && (
              <Suspense
                fallback={
                  <ZoneLoadingOverlay
                    message="Loading zone view..."
                  />
                }
              >
                <ZoneProvider>
                  <BabylonZone />
                </ZoneProvider>
              </Suspense>
            )}
          </ConfirmProvider>
        </ThemeProvider>
      ) : null}
    </Box>
  );
};
