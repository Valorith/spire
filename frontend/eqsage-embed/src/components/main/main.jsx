import React, { useEffect, useState } from 'react';
import { Box, Stack, ThemeProvider, createTheme } from '@mui/material';
import { ConfirmProvider } from 'material-ui-confirm';
import { StatusDialog } from '../dialogs/status-dialog';
import { ZoneChooserDialog } from '../dialogs/zone-chooser-dialog';
import { BabylonZone } from '../zone/zone';
import { ZoneProvider } from '../zone/zone-context';
import { LoadingDialog } from '../spire/dialogs/loading-dialog';
import { useMainContext } from './context';
import { GlobalStore } from '@/state';
import { assetUrl } from '../../embed-config';

import '../../util/image/image-processor';

import './main.scss';

const CONSTANTS = {
  BONE         : '#ccc',
  CONTRAST_TEXT: '#777',
  LIGHT_GRAY   : 'rgba(0,0,0,0.1)',
};

const bgMax = 6;

export const Main = () => {
  const {
    zoneDialogOpen,
    statusDialogOpen,
    rootFileSystemHandle,
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

  return (
    <Box>
      <LoadingDialog />
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
            <ZoneProvider>
              <BabylonZone />
            </ZoneProvider>

            <Stack
              onDragOver={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              direction={'row'}
              onDrop={onDrop}
              sx={{
                background    : sessionBg,
                backgroundSize: 'cover',
              }}
              className="sage-main"
            ></Stack>
          </ConfirmProvider>
        </ThemeProvider>
      ) : null}
    </Box>
  );
};
