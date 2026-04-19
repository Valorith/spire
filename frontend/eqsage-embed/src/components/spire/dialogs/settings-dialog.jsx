import React from 'react';
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { CommonDialog } from './common';
import { useSettingsContext } from '../../../context/settings';
import { useDebouncedCallback } from 'use-debounce';
import { useMainContext } from '../../main/context';
export const SettingsDialog = ({ onClose }) => {
  const {
    setOption,
    showRegions,
    flySpeed,
    glow,
    webgpu = false,
    forceReload = false,
    clipPlane = 10000,
    spawnLOD = 500,
    remoteUrl = '',
    importBoundary = false,
    showSpawns = true,
    disableAnimations = false,
    exportObjects = false,
  } = useSettingsContext();
  const { embeddedMode } = useMainContext();

  return (
    <CommonDialog onClose={onClose} title={'Settings'}>
      <FormControl sx={{}} fullWidth>
        <Typography
          sx={{ fontSize: 14, marginTop: 2, width: '80%' }}
          color="text.secondary"
          gutterBottom
        >
          Camera Fly Speed: {flySpeed}
        </Typography>
        <Slider
          value={flySpeed}
          onChange={(e) => setOption('flySpeed', +e.target.value)}
          step={0.01}
          min={0.01}
          max={20}
        />
      </FormControl>
      <FormControl sx={{}} fullWidth>
        <Typography
          sx={{ fontSize: 14, marginTop: 2, width: '80%' }}
          color="text.secondary"
          gutterBottom
        >
          Clip Plane: {clipPlane}
        </Typography>
        <Slider
          value={clipPlane}
          onChange={(e) => setOption('clipPlane', +e.target.value)}
          step={1}
          min={5}
          max={30000}
        />
      </FormControl>
      <FormControl sx={{}} fullWidth>
        <Typography
          sx={{ fontSize: 14, marginTop: 2, width: '80%' }}
          color="text.secondary"
          gutterBottom
        >
          Spawn LOD: {spawnLOD}
        </Typography>
        <Slider
          value={spawnLOD}
          onChange={useDebouncedCallback(
            (e) => setOption('spawnLOD', +e.target.value),
            100
          )}
          step={1}
          min={0}
          max={1000}
        />
      </FormControl>

      <FormControlLabel
        control={
          <Checkbox
            checked={showRegions}
            onChange={({ target: { checked } }) =>
              setOption('showRegions', checked)
            }
          />
        }
        label="Show Regions"
      />
      <br />
      <FormControlLabel
        control={
          <Checkbox
            checked={showSpawns}
            onChange={({ target: { checked } }) =>
              setOption('showSpawns', checked)
            }
          />
        }
        label="Load Spawns (Requires Page Refresh)"
      />
      <br />
      <FormControlLabel
        control={
          <Checkbox
            checked={disableAnimations}
            onChange={({ target: { checked } }) =>
              setOption('disableAnimations', checked)
            }
          />
        }
        label="Disable Animations (Requires Page Refresh)"
      />
      <br />
      <FormControlLabel
        control={
          <Checkbox
            checked={exportObjects}
            onChange={({ target: { checked } }) =>
              setOption('exportObjects', checked)
            }
          />
        }
        label="Export Objects with Zone Export"
      />
      <br />
      <FormControlLabel
        control={
          <Checkbox
            checked={glow}
            onChange={({ target: { checked } }) => setOption('glow', checked)}
          />
        }
        label="NPC Glow"
      />
      <br />
      <FormControlLabel
        control={
          <Checkbox
            checked={webgpu}
            onChange={({ target: { checked } }) => setOption('webgpu', checked)}
          />
        }
        label="Use WebGPU Engine"
      />
      <br />
      <FormControlLabel
        control={
          <Checkbox
            checked={forceReload}
            onChange={({ target: { checked } }) =>
              setOption('forceReload', checked)
            }
          />
        }
        label="Force zone reload"
      />
      <br />
      <FormControlLabel
        control={
          <Checkbox
            checked={importBoundary}
            onChange={({ target: { checked } }) =>
              setOption('importBoundary', checked)
            }
          />
        }
        label="Import Boundary (collision)"
      />
      {embeddedMode && (
        <FormControl sx={{ margin: '15px 0px' }} fullWidth>
          <Typography color="text.secondary">
            Embedded mode uses Spire&apos;s current session and injected bridge.
          </Typography>
        </FormControl>
      )}
      {!embeddedMode && (
        <>
          <FormControl sx={{ margin: '15px 0px' }} fullWidth>
            <Stack
              direction={'row'}
              alignContent={'space-evenly'}
              // justifyContent={'space-evenly'}
              sx={{ width: '100%' }}
            >
              <TextField
                label="Remote URL (Spire Backend)"
                sx={{ width: '300px', marginRight: '10px' }}
                value={remoteUrl}
                placeholder="http://your-url-or-ip:8090"
                onChange={(e) => {
                  setOption('remoteUrl', e.target.value);
                }}
              ></TextField>
            </Stack>
          </FormControl>
        </>
      )}
    </CommonDialog>
  );
};
