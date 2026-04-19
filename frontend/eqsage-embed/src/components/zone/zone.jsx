import React, { useEffect, useRef, useState } from 'react';

import { Box } from '@mui/material';
import { useMainContext } from '../main/context';
import { processZone } from './processZone';
import { gameController } from '../../viewer/controllers/GameController';
import { SpireOverlay } from '../spire/overlay';
import { OverlayProvider } from '../spire/provider';
import { useSettingsContext } from '../../context/settings';
import { GlobalStore } from '../../state';
import { sleep } from '@/viewer/util/util';

export const BabylonZone = () => {
  const canvasRef = useRef();
  const {
    selectedZone,
    rootFileSystemHandle,
    canvasState,
    setCanvasState,
  } = useMainContext();

  const settings = useSettingsContext();

  useEffect(() => {
    (async () => {
      if (!selectedZone) {
        return;
      }
      while (!canvasRef.current) {
        await sleep(50);
      }
      console.log('Ref', canvasRef.current);
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
    selectedZone,
    settings?.webgpu,
  ]);

  useEffect(() => {
    if (!selectedZone) {
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
  }, [selectedZone]); // eslint-disable-line

  useEffect(() => {
    if (!canvasState) {
      setTimeout(() => {
        setCanvasState(true);
      }, 0);
    }
  }, [canvasState, setCanvasState]);
  return (
    <OverlayProvider>
      <SpireOverlay inZone={!!selectedZone} />
      {canvasState && (
        <Box
          as="canvas"
          sx={{ flexGrow: '1', position: 'fixed' }}
          ref={canvasRef}
          id="renderCanvas"
          width="100vw"
          height="100vh"
        />
      )}
    </OverlayProvider>
  );
};
