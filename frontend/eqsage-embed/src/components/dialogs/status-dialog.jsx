import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { PermissionStatusTypes } from 'sage-core/hooks/permissions';
import './status-dialog.scss';
import { useMainContext } from '../main/context';
import { debugSageLog } from '../../debug-stage';

export const StatusDialog = ({
  open,
  permissionStatus,
  requestPermissions,
  onDrop,
  fsHandle,
  onFolderSelected
}) => {
  debugSageLog('[SageStatusDialogRender]', {
    open,
    permissionStatus,
    fsHandleName: fsHandle?.name ?? null,
  });
  const [_type, setType] = useState('unknown');
  const [selectingDirectory, setSelectingDirectory] = useState(false);
  const [selectionError, setSelectionError] = useState('');
  const { Spire } = useMainContext();

  const selectDirectory = async () => {
    if (selectingDirectory) {
      return;
    }
    setSelectingDirectory(true);
    setSelectionError('');
    try {
      await onFolderSelected();
    } catch (error) {
      console.error('[SageStatusDialog] directory selection failed', error);
      setSelectionError(
        error?.message || 'The directory could not be selected. Please try again.'
      );
    } finally {
      setSelectingDirectory(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      if (Spire) {
        setType('spire');
      }
    }, 150);
  }, [Spire]);

  if (!open) {
    return null;
  }

  return (
    <Box
      sx={{
        position      : 'fixed',
        inset         : 0,
        zIndex        : 2400,
        display       : 'flex',
        alignItems    : 'center',
        justifyContent: 'center',
        padding       : 3,
        background    : 'rgba(4, 6, 10, 0.62)',
        pointerEvents : 'auto',
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={onDrop}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-labelledby="sage-status-title"
        sx={{
          width         : '100%',
          maxWidth      : 720,
          maxHeight     : 'calc(100vh - 48px)',
          overflowY     : 'auto',
          border        : '1px solid rgba(221, 208, 160, 0.7)',
          background    : 'linear-gradient(180deg, rgba(17, 24, 34, 0.98), rgba(9, 13, 19, 0.98))',
          boxShadow     : '0 18px 48px rgba(0, 0, 0, 0.55)',
          borderRadius  : '6px',
          color         : '#e8dcc0',
          pointerEvents : 'auto',
          padding       : 3,
        }}
      >
        <Typography
          id="sage-status-title"
          variant="h5"
          sx={{
            textAlign   : 'center',
            marginBottom: 2,
          }}
        >
          Welcome to the Spire Zone Editor
        </Typography>
        <div>
          <Stack
            alignContent="center"
            justifyContent="space-between"
            direction="row"
            spacing={1}
          />

          <Typography
            sx={{ fontSize: 17, marginBottom: 2 }}
            color="text.secondary"
            gutterBottom
          >
            Spire&apos;s embedded zone editor reads your local EverQuest assets
            in the browser so zones can be decoded and edited natively inside
            this app.
          </Typography>
          {permissionStatus === PermissionStatusTypes.ApiUnavailable && (
            <Typography
              sx={{ fontSize: 17, marginBottom: 2 }}
              color="text.secondary"
              gutterBottom
            >
              Unfortunately, your browser does not support the required
              permissions to the File System. Visit{' '}
              <Link
                target="_blank"
                href="https://developer.mozilla.org/en-US/docs/Web/API/FileSystemHandle/requestPermission"
              >
                this link
              </Link>{' '}
              to learn more about which browsers are supported. Additionally, if
              you are running Spire over plain http, you may need to use a
              secure origin such as localhost or https for File System Access
              APIs to work correctly.
            </Typography>
          )}
          {permissionStatus === PermissionStatusTypes.NeedRefresh && (
            <Stack alignContent={'center'}>
              <Typography
                sx={{ fontSize: 18, marginBottom: 2, textAlign: 'center' }}
                color="text.primary"
                gutterBottom
              >
                Linked EQ Directory: {fsHandle?.name}.
              </Typography>
              <Typography
                sx={{ fontSize: 17, marginBottom: 2 }}
                color="text.secondary"
                gutterBottom
              >
                Your browser needs to request permission to access files for
                decoding. In addition, decoded files will be written under{' '}
                <b>{fsHandle?.name}/eqsage</b> and can be safely deleted at any
                time.
              </Typography>
              <Button
                variant="outlined"
                sx={{ margin: '25px' }}
                onClick={requestPermissions}
              >
                Request Permissions
              </Button>
              <Typography
                sx={{ fontSize: 17, marginBottom: 2 }}
                color="text.secondary"
                gutterBottom
              >
                If you want to grant persistent permissions and are using
                Chrome, you can enable the{' '}
                <b>#file-system-access-persistent-permission</b> flag under{' '}
                <b>chrome://flags</b>. Once enabled, you need to restart your
                browser for this to take effect.
              </Typography>
              <Box className="chrome-flags" sx={{ width: '100%' }} />
            </Stack>
          )}
          {permissionStatus === PermissionStatusTypes.NeedEQDir && (
            <Stack
              direction={'column'}
              sx={{
                justifyContent: 'center !important',
                alignItems    : 'center',
                alignContent  : 'center',
              }}
            >
              <Typography
                sx={{ fontSize: 17, marginBottom: 2 }}
                color="text.secondary"
                gutterBottom
              >
                Drag and drop an EQ directory on the page to get started. All
                Windows versions are compatible, but keep in mind availability
                and version of zones related to the database linked, e.g. old
                Freeport vs. new. This should be your base EQ directory
                including all the s3d/eqg files.
              </Typography>
              <Button
                onClick={selectDirectory}
                disabled={selectingDirectory}
                variant={'outlined'}
                sx={{ margin: '0 auto' }}
              >
                {selectingDirectory ? 'Selecting Directory…' : 'Select EQ Directory'}
              </Button>
              {selectionError && (
                <Typography
                  role="alert"
                  sx={{ fontSize: 15, marginTop: 2, textAlign: 'center' }}
                  color="error.main"
                >
                  {selectionError}
                </Typography>
              )}
            </Stack>
          )}
        </div>
      </Box>
    </Box>
  );
};
