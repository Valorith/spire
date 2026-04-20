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
const StatusDialog = React.lazy(() => import('../dialogs/status-dialog').then((m) => ({ default: m.StatusDialog })));
const ZoneChooserDialog = React.lazy(() => import('../dialogs/zone-chooser-dialog').then((m) => ({ default: m.ZoneChooserDialog })));
const BabylonZone = React.lazy(() => import('../zone/zone').then((m) => ({ default: m.BabylonZone })));
const ZoneProvider = React.lazy(() => import('../zone/zone-context').then((m) => ({ default: m.ZoneProvider })));
const LoadingDialog = React.lazy(() => import('../spire/dialogs/loading-dialog').then((m) => ({ default: m.LoadingDialog })));

export const Main = () => {
  markStage('main:render');
  debugSageLog('[SageMainRender]');
  const {
    selectedZone,
    zoneDialogOpen,
    statusDialogOpen,
    rootFileSystemHandle,
    gameController,
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
  }, [
    gameController,
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
            <Suspense fallback={null}>
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
            </Suspense>
            <Suspense fallback={null}>
              {zoneDialogOpen && <ZoneChooserDialog open={true} />}
            </Suspense>
            {!statusDialogOpen && !zoneDialogOpen && !!selectedZone && !gameController && (
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
                    Preparing Zone Editor
                  </Typography>
                  <Typography sx={{ fontSize: 15 }} color="text.secondary">
                    Loading viewer modules for {selectedZone.long_name ?? selectedZone.short_name}.
                  </Typography>
                </Box>
              </Box>
            )}
            {!statusDialogOpen && !zoneDialogOpen && !!selectedZone && !!gameController && (
              <Suspense fallback={null}>
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
