import React, { useEffect, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';
import { useMainContext } from '../main/context';
import { processZone } from './processZone';
import { SpireOverlay } from '../spire/overlay';
import { OverlayProvider } from '../spire/provider';
import { useSettingsContext } from '../../context/settings';
import { GlobalStore } from '../../state';
import { sleep } from '@/viewer/util/util';
import bjs from '@bjs';
import { debugSageLog, markStage } from '../../debug-stage';

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

  useEffect(() => {
    (async () => {
      if (!selectedZone || !gameController) {
        return;
      }
      await bjs.initialize();
      while (!canvasRef.current) {
        await sleep(50);
      }
      debugSageLog('Ref', canvasRef.current);
      await gameController.loadEngine(canvasRef.current, settings.webgpu);
      await gameController.ZoneController.loadViewerScene();
      window.addEventListener('resize', gameController.resize);
      window.addEventListener('keydown', gameController.keyDown);
    })();

    return () => {
      window.removeEventListener('resize', gameController.resize);
      window.removeEventListener('keydown', gameController.keyDown);
    };
  }, [
    gameController,
    selectedZone,
    settings?.webgpu,
  ]);

  useEffect(() => {
    if (!selectedZone || !gameController) {
      return;
    }
    let current = true;
    (async () => {
      await processZone(
        selectedZone.short_name,
        settings,
        rootFileSystemHandle
      );
      if (!current) {
        return;
      }
      gameController.ZoneController.loadModel(selectedZone.short_name).catch(
        (e) => {
          gameController.openAlert(
            'Error loading zone. Check console output.',
            'warning'
          );
          console.log('Error loading zone', e);
          GlobalStore.actions.setLoading(false);
        }
      );
    })();
    return () => (current = false);
  }, [gameController, selectedZone]); // eslint-disable-line

  useEffect(() => {
    if (!canvasState) {
      setTimeout(() => {
        setCanvasState(true);
      }, 0);
    }
  }, [canvasState, setCanvasState]);
  return (
    <OverlayProvider>
      {!gameController && (
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
              Loading viewer modules for {selectedZone?.long_name ?? selectedZone?.short_name}.
            </Typography>
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
        <Box sx={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
          <SpireOverlay inZone={!!selectedZone} />
        </Box>
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
