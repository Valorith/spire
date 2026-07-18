import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CommonDialog } from './common';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { v4 } from 'uuid';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Autocomplete, Button, FormControl, Stack, TextField } from '@mui/material';
import { useDebouncedCallback } from 'use-debounce';
import { gameController } from '../../../viewer/controllers/GameController';
import BABYLON from '@bjs';
import { useMainContext } from '../../main/context';
import { useZoneContext } from '../../zone/zone-context';
import { useAlertContext } from '../../../context/alerts';
import { useOverlayContext } from '../provider';

const { Tools, Vector3 } = BABYLON;
export const NpcDialog = ({ onClose }) => {
  const [spawnFilter, setSpawnFilter] = useState('');
  const [newSpawnNpc, setNewSpawnNpc] = useState(null);
  const [newSpawnNpcInput, setNewSpawnNpcInput] = useState('');
  const [newSpawnNpcOptions, setNewSpawnNpcOptions] = useState([]);
  const [newSpawnNpcOpen, setNewSpawnNpcOpen] = useState(false);
  const [creatingSpawn, setCreatingSpawn] = useState(false);
  const npcSearchRunRef = useRef(0);
  const { selectedZone, Spire } = useMainContext();
  const { toggleDialog } = useOverlayContext();
  const { spawns, loadCallback } = useZoneContext();
  const { openAlert } = useAlertContext();
  const [hidden, setHidden] = useState(false);
  const runNewSpawnNpcSearch = useCallback(async (value) => {
    const searchRun = ++npcSearchRunRef.current;
    const query = `${value ?? ''}`.trim();
    if (!query || !Spire) {
      setNewSpawnNpcOptions([]);
      setNewSpawnNpcOpen(false);
      return;
    }
    try {
      const npcs = (await Spire.Npcs.listNpcsByName(query)) ?? [];
      if (searchRun === npcSearchRunRef.current) {
        setNewSpawnNpcOptions(npcs);
        setNewSpawnNpcOpen(npcs.length > 0);
      }
    } catch (_error) {
      if (searchRun === npcSearchRunRef.current) {
        setNewSpawnNpcOptions([]);
        setNewSpawnNpcOpen(false);
      }
    }
  }, [Spire]);
  const searchNewSpawnNpcs = useDebouncedCallback(
    runNewSpawnNpcSearch,
    350
  );
  const filteredSpawns = useMemo(
    () => {
      const normalizedFilter = spawnFilter?.trim()?.toLowerCase();
      if (!normalizedFilter) {
        return spawns;
      }

      return spawns.filter((s) =>
        s.spawnentries?.some((e) =>
          e?.npc_type?.name?.toLowerCase()?.includes(normalizedFilter)
        )
      );
    },
    [spawns, spawnFilter]
  );

  const addSpawn = useCallback(async () => {
    if (!newSpawnNpc || creatingSpawn || !Spire) {
      return;
    }
    setHidden(true);
    gameController.ZoneController.pickRaycastForLoc(async (loc) => {
      setHidden(false);
      if (!loc) {
        return;
      }
      setCreatingSpawn(true);
      const spawn2Api = new Spire.SpireApiTypes.Spawn2Api(
        ...Spire.SpireApi.cfg()
      );
      const spawnGroupApi = new Spire.SpireApiTypes.SpawngroupApi(
        ...Spire.SpireApi.cfg()
      );
      const spawnEntryApi = new Spire.SpireApiTypes.SpawnentryApi(
        ...Spire.SpireApi.cfg()
      );
      let createdSpawnGroupId = null;
      let createdSpawnId = null;
      try {
        const spawnGroup = await spawnGroupApi.createSpawngroup({
          spawngroup: { name: v4() },
        });
        createdSpawnGroupId = spawnGroup.data.id;
        const createResult = await spawn2Api.createSpawn2({
          spawn2: {
            _condition   : 0,
            cond_value  : 1,
            heading     : 0,
            max_expansion: -1,
            min_expansion: -1,
            pathgrid    : 0,
            respawntime : 1200,
            spawngroup_id: createdSpawnGroupId,
            variance    : 0,
            version     : Number(selectedZone.version ?? 0),
            x           : loc.z,
            y           : loc.x,
            z           : loc.y,
            zone        : selectedZone.short_name,
          },
        });
        createdSpawnId = createResult.data.id;
        const spawnEntry = {
          chance                : 100,
          condition_value_filter: 1,
          content_flags         : null,
          content_flags_disabled: null,
          max_expansion         : -1,
          max_time              : 0,
          min_expansion         : -1,
          min_time              : 0,
          npc_id                : newSpawnNpc.id,
          npc_type              : newSpawnNpc,
          spawngroup_id         : createdSpawnGroupId,
        };
        await spawnEntryApi.createSpawnentry({
          id        : createdSpawnGroupId,
          spawnentry: spawnEntry,
        });

        await loadCallback({
          type : 'create',
          spawn: {
            ...createResult.data,
            spawnentries: [spawnEntry],
          },
        });
        openAlert(`Created new spawn at location [${loc.z} ${loc.x} ${loc.y}]`);
        setNewSpawnNpc(null);
        setNewSpawnNpcInput('');
        setNewSpawnNpcOptions([]);
        toggleDialog('npc', false);
      } catch (error) {
        if (createdSpawnId) {
          await spawn2Api.deleteSpawn2({ id: createdSpawnId }).catch(() => {});
        }
        if (createdSpawnGroupId) {
          await spawnGroupApi
            .deleteSpawngroup({ id: createdSpawnGroupId })
            .catch(() => {});
        }
        console.warn('Error creating spawn', error);
        openAlert('Failed to create spawn. No partial spawn was kept.', 'warning');
      } finally {
        setCreatingSpawn(false);
      }
    });
  }, [
    Spire,
    creatingSpawn,
    loadCallback,
    newSpawnNpc,
    openAlert,
    selectedZone,
    toggleDialog,
  ]);

  useEffect(() => {
    const meshes =
      gameController.ZoneController.scene
        .getNodeById('zone-spawns')
        ?.getChildMeshes() ?? [];
    for (const mesh of meshes.filter((m) => m.name.startsWith('zone-spawn-'))) {
      if (filteredSpawns.some((s) => mesh.id === `zone-spawn-${s.id}`)) {
        mesh.setEnabled(true);
      } else {
        mesh.setEnabled(false);
      }
    }
  }, [filteredSpawns]);
  useEffect(() => () => {
    npcSearchRunRef.current += 1;
    searchNewSpawnNpcs.cancel();
  }, [searchNewSpawnNpcs]);
  return (
    <CommonDialog
      noEscClose={hidden}
      sx={
        hidden
          ? {
            width        : '400px',
            height       : '250px',
            position     : 'fixed !important',
            bottom       : '20px !important',
            right        : 'calc(50vw - 200px) !important',
            top          : 'unset',
            left         : 'unset',
            pointerEvents: 'none',
          }
          : {}
      }
      fullWidth
      onClose={onClose}
      title={'Spawns'}
    >
      <Stack
        alignItems={'center'}
        justifyContent={'center'}
        direction="row"
        flexWrap="wrap"
      >
        <FormControl
          margin="dense"
          size="small"
          sx={{ m: 1, width: 300, top: 0, left: 0 }}
        >
          <TextField
            margin="dense"
            onKeyDown={(e) => {
              e.stopPropagation();
            }}
            label="Spawn Filter"
            value={spawnFilter}
            helperText={`${filteredSpawns.length} filtered spawns`}
            onChange={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setSpawnFilter(e.target.value);
            }}
          />
        </FormControl>
        <Autocomplete
          disablePortal
          ListboxProps={{
            onMouseDown: (event) => event.preventDefault(),
          }}
          open={newSpawnNpcOpen}
          value={newSpawnNpc}
          inputValue={newSpawnNpcInput}
          options={newSpawnNpcOptions}
          getOptionLabel={(option) =>
            `${option?.name ?? 'Unknown NPC'} - Level ${option?.level ?? '?'}`
          }
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          onChange={(_event, value) => {
            setNewSpawnNpc(value);
            setNewSpawnNpcInput(
              value
                ? `${value?.name ?? 'Unknown NPC'} - Level ${value?.level ?? '?'}`
                : ''
            );
            setNewSpawnNpcOpen(false);
          }}
          onInputChange={(_event, value, reason) => {
            if (reason === 'input') {
              setNewSpawnNpcInput(value);
              setNewSpawnNpcOpen(Boolean(value.trim()));
              searchNewSpawnNpcs(value);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="NPC for New Spawn"
              helperText="Select an NPC before placing the spawn"
              onFocus={() => {
                if (newSpawnNpcOptions.length > 0) {
                  setNewSpawnNpcOpen(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setNewSpawnNpcOpen(false), 150);
              }}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === 'Escape') {
                  setNewSpawnNpcOpen(false);
                }
              }}
            />
          )}
          size="small"
          sx={{ m: 1, width: 320 }}
        />
        <Button
          startIcon={<AddCircleIcon />}
          sx={{ height: '40px', marginBottom: '20px' }}
          disabled={!newSpawnNpc || creatingSpawn}
          onClick={addSpawn}
        >
          {creatingSpawn ? 'Creating Spawn...' : 'Add Spawn'}
        </Button>
      </Stack>
      <CollapsibleTable spawns={filteredSpawns} />
    </CommonDialog>
  );
};

function Row(props) {
  const { spawn } = props;
  const [open, setOpen] = useState(false);
  const spawnEntries = useMemo(
    () => Array.isArray(spawn.spawnentries)
      ? spawn.spawnentries.filter(Boolean)
      : [],
    [spawn.spawnentries]
  );
  const spawnName = useMemo(() => {
    if (spawnEntries.length === 0) {
      return 'No associated spawns';
    }
    const firstName = spawnEntries[0]?.npc_type?.name ?? 'Unknown NPC';
    return spawnEntries.length === 1
      ? firstName
      : `${firstName} + ${
          spawnEntries.length - 1
        } more`;
  }, [spawnEntries]);
  const hasMultipleEntries = useMemo(
    () => spawnEntries.length > 1,
    [spawnEntries]
  );
  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell component="th" scope="row">
          {spawnName}
          {hasMultipleEntries && (
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
        </TableCell>
        <TableCell align="left">
          X: {spawn.y}, Y: {spawn.x}, Z: {spawn.z}
        </TableCell>
        <TableCell align="left">{spawn.respawntime}</TableCell>
        <TableCell align="center">
          <Button
            className="ui-dialog-btn"
            onClick={() => {
              const camera = gameController.CameraController.camera;
              const target = new Vector3(spawn.y, spawn.z + 3, spawn.x);
              const heading =
                Tools.ToRadians(Number(spawn.heading ?? 0)) - Math.PI / 2;
              const cameraDistance = 12;
              camera.position = new Vector3(
                target.x + Math.sin(heading) * cameraDistance,
                target.y + 3,
                target.z + Math.cos(heading) * cameraDistance
              );
              camera.setTarget(target);
            }}
          >
            Teleport
          </Button>
        </TableCell>
      </TableRow>
      {hasMultipleEntries && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                <Table aria-label="spawns">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Spawn Chance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {spawnEntries.map((entry) => (
                      <TableRow key={entry.npc_id}>
                        <TableCell component="th" scope="row">
                          {entry.npc_type?.name}
                        </TableCell>
                        <TableCell>{entry.npc_type?.level}</TableCell>
                        <TableCell>{entry.chance}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
}

function CollapsibleTable({ spawns }) {
  return (
    <TableContainer
      sx={{
        background: 'transparent',
        overflowX : 'visible',
        height    : '400px',
        maxHeight : '400px',
      }}
      component={Paper}
    >
      <Table stickyHeader size="medium" aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell sx={{ maxWidth: '250px', width: '250px' }}>
              Name
            </TableCell>
            <TableCell sx={{ maxWidth: '150px', width: '200px' }} align="left">
              Location
            </TableCell>
            <TableCell sx={{ maxWidth: '100px', width: '100px' }} align="left">
              Respawn
            </TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {spawns.map((spawn) => (
            <Row key={spawn.id} spawn={spawn} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
