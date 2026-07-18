import React, { Suspense, useEffect, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';
import { useMainContext } from '../main/context';
import { OverlayProvider } from '../spire/provider';
import { useSettingsContext } from '../../context/settings';
import { debugSageLog, markStage } from '../../debug-stage';

const SpireOverlay = React.lazy(() =>
  import('../spire/overlay').then((module) => ({ default: module.SpireOverlay }))
);

export const BabylonZone = () => {
  markStage('babylon-zone:render');
  debugSageLog('[BabylonZoneRender]');
  const canvasRef = useRef();
  const {
    selectedZone,
    rootFileSystemHandle,
    canvasState,
    setCanvasState,
    gameController,
  } = useMainContext();

  const settings = useSettingsContext();
  const [viewerStage, setViewerStage] = useState('Preparing zone canvas');
  const [viewerDetail, setViewerDetail] = useState('');
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerError, setViewerError] = useState(null);
  const zoneLoadRunRef = useRef(0);

  useEffect(() => {
    if (!selectedZone || !gameController) {
      return;
    }
    const zoneLoadRun = ++zoneLoadRunRef.current;
    const abortController = new AbortController();
    let current = true;
    const isCurrent = () =>
      current &&
      zoneLoadRun === zoneLoadRunRef.current &&
      !abortController.signal.aborted;
    setViewerReady(false);
    setViewerError(null);
    setViewerDetail('');
    setViewerStage('Loading viewer modules');
    const loadSettings = { ...settings };

    (async () => {
      let rendererPaused = false;
      try {
        let zoneMetadata = null;
        gameController.settings = loadSettings;
        gameController.actions?.setZoneInfo?.({
          ...selectedZone,
          shortName: selectedZone.shortName ?? selectedZone.short_name,
          longName : selectedZone.longName ?? selectedZone.long_name,
        });
        setViewerStage('Loading zone processor');
        const { processZone } = await import('./processZone');
        if (!isCurrent()) {
          return;
        }
        setViewerStage('Processing zone assets');
        zoneMetadata = await processZone(
          selectedZone.short_name,
          loadSettings,
          rootFileSystemHandle,
          false,
          gameController,
          (stage, detail = '') => {
            if (!isCurrent()) {
              return;
            }
            setViewerStage(stage);
            setViewerDetail(detail);
          },
          abortController.signal
        );
        if (!isCurrent()) {
          return;
        }
        setViewerStage('Loading Babylon bridge');
        const { default: bjs } = await import('@bjs');
        if (!isCurrent()) {
          return;
        }
        setViewerStage('Loading viewer runtime');
        await bjs.prepareZoneViewer((stage) => {
          if (isCurrent()) {
            setViewerStage(stage);
          }
        });
        while (isCurrent() && !canvasRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        if (!isCurrent()) {
          return;
        }
        debugSageLog('Ref', canvasRef.current);
        setViewerStage('Initializing Babylon renderer');
        await gameController.loadEngine(canvasRef.current, loadSettings.webgpu);
        gameController.setLoading(true);
        rendererPaused = true;
        if (!isCurrent()) {
          return;
        }
        window.addEventListener('resize', gameController.resize);
        window.addEventListener('keydown', gameController.keyDown);

        setViewerStage(
          `Loading ${selectedZone.long_name ?? selectedZone.short_name}`
        );
        setViewerDetail('');
        await gameController.ZoneController.loadModel(
          selectedZone.short_name,
          zoneMetadata && typeof zoneMetadata === 'object' ? zoneMetadata : null,
          abortController.signal
        );
        if (!isCurrent()) {
          return;
        }
        gameController.setLoading(false);
        rendererPaused = false;
        setViewerStage('Zone ready');
        setViewerDetail('');
        setViewerReady(true);
      } catch (e) {
        if (!isCurrent()) {
          return;
        }
        setViewerError(e);
        setViewerStage('Failed to load zone viewer');
        const errorDetail = e?.message || `${e}`;
        window.__spireSageViewerError = {
          message: errorDetail,
          stack  : e?.stack ?? null,
        };
        window.dispatchEvent(
          new CustomEvent('spire-sage-zone-validation-error', {
            detail: {
              zone     : selectedZone.short_name,
              longName : selectedZone.long_name ?? selectedZone.short_name,
              error    : errorDetail,
              stack    : e?.stack ?? null,
              timestamp: new Date().toISOString(),
            },
          })
        );
        setViewerDetail(errorDetail);
        gameController.openAlert?.(
          'Error loading zone. Check console output.',
          'warning'
        );
        console.log('Error loading zone', e);
        const { GlobalStore } = await import('../../state');
        GlobalStore.actions.setLoading(false);
        if (rendererPaused) {
          gameController.setLoading(false);
        }
      } finally {
        if (rendererPaused && isCurrent()) {
          gameController.setLoading(false);
        }
      }
    })();

    return () => {
      current = false;
      abortController.abort();
      zoneLoadRunRef.current += 1;
      gameController.ZoneController.cancelPendingLoad?.();
      gameController.setLoading(false);
      window.removeEventListener('resize', gameController.resize);
      window.removeEventListener('keydown', gameController.keyDown);
    };
  }, [
    gameController,
    rootFileSystemHandle,
    selectedZone,
    settings?.webgpu,
    settings?.forceReload,
  ]);

  useEffect(() => {
    if (!canvasState) {
      setTimeout(() => {
        setCanvasState(true);
      }, 0);
    }
  }, [canvasState, setCanvasState]);
  return (
    <OverlayProvider>
      {!viewerReady && (
        <Box
          sx={{
            position      : 'fixed',
            inset         : 0,
            zIndex        : 100001,
            display       : 'flex',
            alignItems    : 'center',
            justifyContent: 'center',
            pointerEvents : 'none',
          }}
        >
          <Box
            sx={{
              minWidth     : 320,
              border       : '1px solid rgba(221, 208, 160, 0.7)',
              background   : 'linear-gradient(180deg, rgba(17, 24, 34, 0.98), rgba(9, 13, 19, 0.98))',
              boxShadow    : '0 18px 48px rgba(0, 0, 0, 0.55)',
              borderRadius : '6px',
              color        : '#e8dcc0',
              padding      : 3,
              textAlign    : 'center',
              pointerEvents: 'none',
            }}
          >
            <Typography sx={{ fontSize: 18, marginBottom: 1 }}>
              Preparing Zone Editor
            </Typography>
            <Typography sx={{ fontSize: 15 }} color="text.secondary">
              {viewerStage}
            </Typography>
            {viewerDetail && (
              <Typography sx={{ fontSize: 13, marginTop: 1 }} color="text.secondary">
                {viewerDetail}
              </Typography>
            )}
            {viewerError && (
              <Typography sx={{ fontSize: 13, marginTop: 1.5 }} color="error.main">
                Zone viewer failed to initialize. Reopen Sage or reselect the zone after refresh.
              </Typography>
            )}
          </Box>
        </Box>
      )}
      <Box
        sx={{
          position     : 'fixed',
          inset        : 0,
          zIndex       : 100000,
          pointerEvents: 'none',
        }}
      >
        <Suspense fallback={null}>
          <Box sx={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
            <SpireOverlay inZone={!!selectedZone} />
          </Box>
        </Suspense>
      </Box>
      {canvasState && (
        <Box
          component="canvas"
          sx={{
            display : 'block',
            position: 'fixed',
            right   : 0,
            bottom  : 0,
            top     : 0,
            left    : 0,
            width   : '100vw',
            height  : '100vh',
            minWidth: '100vw',
            minHeight: '100vh',
            maxWidth: 'none',
            maxHeight: 'none',
            zIndex  : 1,
            outline : 'none',
          }}
          tabIndex={0}
          onPointerDown={(event) => {
            event.currentTarget.focus({ preventScroll: true });
          }}
          onContextMenu={(event) => event.preventDefault()}
          ref={canvasRef}
          id="renderCanvas"
        />
      )}
    </OverlayProvider>
  );
};
