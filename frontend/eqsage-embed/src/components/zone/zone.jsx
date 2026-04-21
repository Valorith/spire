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
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerError, setViewerError] = useState(null);

  useEffect(() => {
    if (!selectedZone || !gameController) {
      return;
    }
    let current = true;
    setViewerReady(false);
    setViewerError(null);
    setViewerStage('Loading viewer modules');

    (async () => {
      try {
        setViewerStage('Loading viewer runtime');
        const [{ default: bjs }, { processZone }] = await Promise.all([
          import('@bjs'),
          import('./processZone'),
        ]);
        if (!current) {
          return;
        }
        setViewerStage('Preparing viewer modules');
        await bjs.prepareZoneViewer();
        while (current && !canvasRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        if (!current) {
          return;
        }
        debugSageLog('Ref', canvasRef.current);
        setViewerStage('Initializing Babylon renderer');
        await gameController.loadEngine(canvasRef.current, settings.webgpu);
        if (!current) {
          return;
        }
        setViewerStage('Creating zone scene');
        await gameController.ZoneController.loadViewerScene();
        if (!current) {
          return;
        }
        window.addEventListener('resize', gameController.resize);
        window.addEventListener('keydown', gameController.keyDown);

        setViewerStage('Processing zone assets');
        await processZone(
          selectedZone.short_name,
          settings,
          rootFileSystemHandle,
          false,
          gameController
        );
        if (!current) {
          return;
        }
        setViewerStage(
          `Loading ${selectedZone.long_name ?? selectedZone.short_name}`
        );
        await gameController.ZoneController.loadModel(selectedZone.short_name);
        if (!current) {
          return;
        }
        setViewerStage('Zone ready');
        setViewerReady(true);
      } catch (e) {
        if (!current) {
          return;
        }
        setViewerError(e);
        setViewerStage('Failed to load zone viewer');
        gameController.openAlert?.(
          'Error loading zone. Check console output.',
          'warning'
        );
        console.log('Error loading zone', e);
        const { GlobalStore } = await import('../../state');
        GlobalStore.actions.setLoading(false);
      }
    })();

    return () => {
      current = false;
      window.removeEventListener('resize', gameController.resize);
      window.removeEventListener('keydown', gameController.keyDown);
    };
  }, [
    gameController,
    rootFileSystemHandle,
    selectedZone,
    settings?.webgpu,
    settings,
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
          <Box sx={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
            <SpireOverlay inZone={!!selectedZone} />
          </Box>
        </Suspense>
      </Box>
      {canvasState && (
        <Box
          as="canvas"
          sx={{
            display : 'block',
            position: 'fixed',
            top     : 0,
            left    : 0,
            width   : '100vw',
            height  : '100vh',
            zIndex  : 1,
          }}
          ref={canvasRef}
          id="renderCanvas"
        />
      )}
    </OverlayProvider>
  );
};
