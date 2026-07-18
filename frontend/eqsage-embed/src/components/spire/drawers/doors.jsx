import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  Stack,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
  Slider,
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BABYLON from '@bjs';
import { gameController } from '../../../viewer/controllers/GameController';
import { useMainContext } from '@/components/main/context';
import { useZoneContext } from '@/components/zone/zone-context';
import { useAlertContext } from '@/context/alerts';
import {
  collectDoorLifecycleStats,
  getRenderableDoors,
  loadDoorModelCatalog,
  loadDoorsForZone,
  degreesToEqHeading,
  eqHeadingToDegrees,
  stripDoorEditorFields,
  toDoorPlacement,
  toDoorPayload,
} from '../door-loader';

const { Tools } = BABYLON;
function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

const getDoorController = () =>
  window.gameController?.ZoneController ?? gameController.ZoneController;

export const DoorsDrawer = ({ selectedObject }) => {
  const { openAlert } = useAlertContext();
  const { selectedZone, Spire } = useMainContext();
  const { setDoors } = useZoneContext();
  const [selectedModel, setSelectedModel] = useState('');
  const [doRandom, setDoRandom] = useState(false);
  const [rotateClamp, setRotateClamp] = useState([0, 360]);
  const [scaleClamp, setScaleClamp] = useState([1, 3]);
  const [importOpen, setImportOpen] = useState(false);
  const [, forceRender] = useState({});
  const [objectMap, setObjectMap] = useState({});
  const [availableModels, setAvailableModels] = useState([]);
  const [availableModelsLoaded, setAvailableModelsLoaded] = useState(false);
  const [selectedMesh, setSelectedMesh] = useState(selectedObject);
  const [mutationPending, setMutationPending] = useState(false);
  const editing = useRef(false);
  const doorsRef = useRef([]);
  const missingModelsRef = useRef([]);
  const persistQueueRef = useRef(Promise.resolve());
  const persistVersionRef = useRef(0);
  const canTransformDoors = typeof getDoorController()?.editMesh === 'function';
  const availableModelSet = useMemo(
    () => new Set(availableModels.map((model) => model.toLowerCase())),
    [availableModels]
  );

  const createDoorApi = useCallback(() => {
    if (!Spire) {
      return null;
    }
    return new Spire.SpireApiTypes.DoorApi(...Spire.SpireApi.cfg());
  }, [Spire]);

  const refreshDoorStats = useCallback((doors = doorsRef.current) => {
    const controller = getDoorController();
    const renderableDoors = getRenderableDoors(doors);
    return collectDoorLifecycleStats({
      controller,
      result: {
        doors,
        loadedMeshes  : controller?.doorNode?.getChildren?.().filter(
          (node) => node?.dataReference
        ).length ?? 0,
        missingModels : missingModelsRef.current,
        renderableDoors,
      },
      zoneKey: `${selectedZone?.short_name ?? ''}:${selectedZone?.version ?? 0}`,
    });
  }, [selectedZone?.short_name, selectedZone?.version]);

  const loadDoors = useCallback(async (forceReload = false) => {
    if (!Spire || !selectedZone?.short_name) {
      doorsRef.current = [];
      missingModelsRef.current = [];
      setDoors([]);
      return {
        doors          : [],
        invisibleDoors : [],
        loadedMeshes   : 0,
        missingModels  : [],
        renderableDoors: [],
      };
    }

    const result = await loadDoorsForZone({
      Spire,
      selectedZone,
      availableModelSet: availableModelsLoaded ? availableModelSet : null,
      forceReload,
    });
    const doors = result.doors ?? [];
    doorsRef.current = doors;
    missingModelsRef.current = result.missingModels ?? [];
    setDoors(doors);

    return result;
  }, [
    Spire,
    selectedZone,
    availableModelSet,
    availableModelsLoaded,
    setDoors,
  ]);

  const persistDoor = useCallback(
    (mesh = selectedMesh) => {
      if (!mesh?.dataReference?.id || !selectedZone) {
        return Promise.resolve(null);
      }

      const payload = stripDoorEditorFields(
        toDoorPayload(mesh.dataReference, selectedZone, mesh)
      );
      const persistVersion = ++persistVersionRef.current;
      const queued = persistQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          const doorsApi = createDoorApi();
          const response = await doorsApi.updateDoor({
            id  : payload.id,
            door: payload,
          });
          const updatedDoor = Array.isArray(response?.data)
            ? response.data[0]
            : response?.data ?? payload;
          if (
            persistVersion === persistVersionRef.current &&
            !mesh.isDisposed?.()
          ) {
            mesh.dataReference = toDoorPlacement(updatedDoor);
          }
          doorsRef.current = doorsRef.current.map((door) =>
            Number(door.id) === Number(updatedDoor.id) ? updatedDoor : door
          );
          setDoors(doorsRef.current);
          if (persistVersion === persistVersionRef.current) {
            refreshDoorStats(doorsRef.current);
          }
          return updatedDoor;
        });
      persistQueueRef.current = queued;
      return queued;
    },
    [
      createDoorApi,
      refreshDoorStats,
      selectedMesh,
      selectedZone,
      setDoors,
    ]
  );

  const editMesh = useCallback(() => {
    const controller = getDoorController();
    if (typeof controller?.editMesh !== 'function' || !selectedMesh) {
      return;
    }
    editing.current = true;

    controller.editMesh(selectedMesh, (commit) => {
      editing.current = false;
      if (!commit) {
        return;
      }
      selectedMesh.dataReference.x = selectedMesh.position.x;
      selectedMesh.dataReference.y = selectedMesh.position.y;
      selectedMesh.dataReference.z = selectedMesh.position.z;

      selectedMesh.dataReference.rotateX = Tools.ToDegrees(
        selectedMesh.rotation.x
      );
      selectedMesh.dataReference.rotateY = Tools.ToDegrees(
        selectedMesh.rotation.y
      );
      selectedMesh.dataReference.rotateZ = Tools.ToDegrees(
        selectedMesh.rotation.z
      );

      selectedMesh.dataReference.scale = selectedMesh.scaling.y;

      setMutationPending(true);
      persistDoor(selectedMesh)
        .then(() => openAlert(`Updated ${selectedMesh.name}`))
        .catch((e) => {
          console.warn('Error updating door', e);
          openAlert(`Error updating ${selectedMesh.name}`, 'warning');
        })
        .finally(() => setMutationPending(false));
    });
  }, [selectedMesh, persistDoor, openAlert]);

  const deleteMesh = useCallback(async () => {
    const mesh = selectedMesh;
    if (!mesh || mutationPending) {
      return;
    }

    const deleteLocal = () => {
      const id = Number(mesh.dataReference?.id);
      mesh.dispose();
      if (Number.isFinite(id)) {
        doorsRef.current = doorsRef.current.filter(
          (door) => Number(door.id) !== id
        );
        setDoors(doorsRef.current);
      }
      setSelectedMesh(null);
      refreshDoorStats(doorsRef.current);
    };

    if (!mesh.dataReference?.id || !Spire) {
      deleteLocal();
      return;
    }

    setMutationPending(true);
    try {
      await persistQueueRef.current.catch(() => undefined);
      await createDoorApi().deleteDoor({ id: mesh.dataReference.id });
      await loadDoors(true);
      setSelectedMesh(null);
      openAlert(`Deleted ${mesh.name}`);
    } catch (e) {
      console.warn('Error deleting door', e);
      openAlert(`Error deleting ${mesh.name}`, 'warning');
    } finally {
      setMutationPending(false);
    }
  }, [
    Spire,
    createDoorApi,
    loadDoors,
    mutationPending,
    openAlert,
    refreshDoorStats,
    selectedMesh,
    setDoors,
  ]);

  useEffect(() => {
    const clickCallback = (mesh) => {
      if (editing.current) {
        return;
      }
      const controller = getDoorController();
      const objectContainer = controller?.doorNode ?? controller?.objectContainer;
      if (objectContainer && mesh?.parent === objectContainer) {
        setSelectedMesh(mesh);
      }
    };

    const controller = getDoorController();
    controller?.addClickCallback?.(clickCallback);
    const keydown = (e) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        e.target?.isContentEditable
      ) {
        return;
      }
      if (e.key.toLowerCase() === 'r') {
        editMesh();
      }
      if (e.key === 'Delete') {
        deleteMesh();
      }
    };

    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      controller?.removeClickCallback?.(clickCallback);
      controller?.unassignGlow?.(selectedMesh);
    };
  }, [editMesh, selectedMesh, deleteMesh]);

  useEffect(() => {
    if (!Spire || !selectedZone?.short_name) {
      return;
    }
    let current = true;
    (async () => {
      try {
        const result = await loadDoors();
        if (!current) {
          return;
        }
        doorsRef.current = result.doors ?? [];
      } catch (e) {
        console.warn('Error loading doors', e);
        openAlert('Error updating zone', 'warning');
      }
    })();

    return () => {
      current = false;
    };
  }, [Spire, selectedZone?.short_name, selectedZone?.version, openAlert, loadDoors]);

  useEffect(() => {
    const controller = getDoorController();
    controller?.assignGlow?.(selectedMesh);

    return () => controller?.unassignGlow?.(selectedMesh);
  }, [selectedMesh]);

  useEffect(() => {
    let current = true;
    loadDoorModelCatalog()
      .then(({ objectMap, availableModels }) => {
        if (!current) {
          return;
        }
        setObjectMap(objectMap || {});
        setAvailableModels(availableModels);
        setAvailableModelsLoaded(true);
      })
      .catch((error) => {
        console.warn('Error loading door model catalog', error);
        if (current) {
          setAvailableModelsLoaded(true);
          openAlert('Error loading door model catalog', 'warning');
        }
      });
    return () => {
      current = false;
    };
  }, [openAlert]);

  const stamp = useCallback(() => {
    if (!selectedModel || mutationPending) {
      return;
    }
    const commitDoor = async (loc, mesh = null) => {
      if (!loc) {
        return;
      }
      const { x, y, z } = loc;
      const rotationY = doRandom
        ? getRandomNumber(rotateClamp[0], rotateClamp[1])
        : Tools.ToDegrees(mesh?.rotation?.y ?? 0);
      const scale = doRandom
        ? getRandomNumber(scaleClamp[0], scaleClamp[1])
        : mesh?.scaling?.y ?? 1;
      const nextDoorId =
        Math.max(0, ...doorsRef.current.map((door) => door.doorid ?? 0)) + 1;
      const draftDoor = toDoorPlacement({
        buffer                : 0,
        client_version_mask   : 0xffffffff,
        close_timer_ms        : 0,
        content_flags         : null,
        content_flags_disabled: null,
        dest_heading          : 0,
        dest_instance         : 0,
        dest_x                : 0,
        dest_y                : 0,
        dest_z                : 0,
        dest_zone             : null,
        disable_timer         : 0,
        door_param            : 0,
        doorid                : nextDoorId,
        doorisopen            : 0,
        dz_switch_id          : 0,
        guild                 : 0,
        heading               : degreesToEqHeading(rotationY),
        incline               : 0,
        invert_state          : 0,
        is_ldon_door          : 0,
        keyitem               : 0,
        lockpick              : 0,
        max_expansion         : -1,
        min_expansion         : -1,
        name                  : selectedModel,
        nokeyring             : 0,
        opentype              : 0,
        pos_x                 : Math.round(z),
        pos_y                 : Math.round(x),
        pos_z                 : Math.round(y),
        size                  : Math.max(1, Math.round(scale * 100)),
        triggerdoor           : 0,
        triggertype           : 0,
        version               : selectedZone?.version ?? 0,
        zone                  : selectedZone?.short_name,
      });

      const payload = stripDoorEditorFields(
        toDoorPayload(draftDoor, selectedZone)
      );

      setMutationPending(true);
      try {
        const response = await createDoorApi().createDoor({ door: payload });
        const createdDoor = Array.isArray(response?.data)
          ? response.data[0]
          : response?.data;
        await loadDoors(true);
        const createdMesh = getDoorController()?.doorNode?.getChildren?.().find(
          (candidate) =>
            Number(candidate?.dataReference?.id) === Number(createdDoor?.id)
        );
        setSelectedMesh(createdMesh ?? null);
        openAlert(`Created ${createdDoor?.name ?? selectedModel}`);
      } catch (e) {
        console.warn('Error creating door', e);
        openAlert(`Error creating ${selectedModel}`, 'warning');
      } finally {
        setMutationPending(false);
      }
    };

    const controller = getDoorController();
    if (typeof controller?.pickRaycastForLoc !== 'function') {
      return;
    }
    controller.pickRaycastForLoc(commitDoor);
  }, [
    createDoorApi,
    doRandom,
    loadDoors,
    mutationPending,
    openAlert,
    rotateClamp,
    scaleClamp,
    selectedModel,
    selectedZone,
  ]);

  const modelOptions = useMemo(
    () =>
      availableModels.map((model, idx) => ({
        id   : idx,
        key  : model,
        label: objectMap[model.toUpperCase()]
          ? `[${objectMap[model.toUpperCase()]}] ${model}`
          : model,
        model,
      })),
    [availableModels, objectMap]
  );
  const optionIdx = modelOptions.findIndex((option) => option.model === selectedModel);

  const saveFieldEdit = useCallback(() => {
    persistDoor().catch((e) => {
      console.warn('Error saving door edits', e);
      openAlert('Error saving door edits', 'warning');
    });
  }, [persistDoor, openAlert]);

  return (
    <Stack direction="column" sx={{ height: '90%' }}>
      <Divider sx={{ margin: '5px' }} />
      <Box sx={{ padding: '10px' }}>
        <Stack direction="column" sx={{ marginBottom: '5px' }}>
          <Typography
            sx={{
              fontSize   : '17px',
              marginTop  : '5px',
              paddingLeft: '5px',
            }}
          >
            Selected Door [{selectedMesh?.name ?? 'None'}]
          </Typography>
          <>
            <Button
              fullWidth
              variant={'outlined'}
              sx={{ margin: '5px auto' }}
              disabled={!selectedMesh || !canTransformDoors || mutationPending}
              onClick={editMesh}
            >
              <Typography
                variant="h6"
                sx={{
                  textAlign : 'center',
                  userSelect: 'none',
                  fontSize  : '17px',
                  color     : selectedMesh ? 'text.primary' : 'text.secondary',
                }}
              >
                Move/Rotate/Scale [R]
              </Typography>
            </Button>
            <Button
              fullWidth
              variant={'outlined'}
              sx={{ margin: '5px auto' }}
              disabled={!selectedMesh || mutationPending}
              onClick={deleteMesh}
            >
              <Typography
                variant="h6"
                sx={{
                  textAlign : 'center',
                  userSelect: 'none',
                  fontSize  : '17px',
                  color     : selectedMesh ? 'text.primary' : 'text.secondary',
                }}
              >
                Remove Door [Delete]
              </Typography>
            </Button>
            <Stack
              sx={{ margin: '10px' }}
              direction="row"
              justifyContent={'space-around'}
            >
              <Typography sx={{ fontSize: 18 }}>X</Typography>
              <Typography sx={{ fontSize: 18 }}>Y</Typography>
              <Typography sx={{ fontSize: 18 }}>Z</Typography>
            </Stack>
            <Stack direction="row">
              <TextField
                disabled={!selectedMesh?.dataReference || mutationPending}
                size="small"
                type="number"
                inputProps={{
                  'aria-label': 'Door X',
                  style: { textAlign: 'center' },
                }}
                sx={{ margin: 0, padding: 0 }}
                value={selectedMesh?.dataReference?.z}
                onChange={(e) => {
                  selectedMesh.dataReference.z = selectedMesh.position.z =
                    +Math.round(e.target.value);
                  forceRender({});
                }}
                onBlur={saveFieldEdit}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              ></TextField>
              <TextField
                disabled={!selectedMesh?.dataReference || mutationPending}
                size="small"
                type="number"
                inputProps={{
                  'aria-label': 'Door Y',
                  style: { textAlign: 'center' },
                }}
                sx={{ margin: 0, padding: 0 }}
                value={selectedMesh?.dataReference?.x}
                onChange={(e) => {
                  selectedMesh.dataReference.x = selectedMesh.position.x =
                    +Math.round(e.target.value);
                  forceRender({});
                }}
                onBlur={saveFieldEdit}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              ></TextField>
              <TextField
                disabled={!selectedMesh?.dataReference || mutationPending}
                size="small"
                type="number"
                inputProps={{
                  'aria-label': 'Door Z',
                  style: { textAlign: 'center' },
                }}
                sx={{ margin: 0, padding: 0 }}
                value={selectedMesh?.dataReference?.y}
                onChange={(e) => {
                  selectedMesh.dataReference.y = selectedMesh.position.y =
                    +Math.round(e.target.value);
                  forceRender({});
                }}
                onBlur={saveFieldEdit}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              ></TextField>
            </Stack>
            <Stack direction="row" sx={{ marginTop: '8px', gap: '8px' }}>
              <TextField
                fullWidth
                disabled={!selectedMesh?.dataReference || mutationPending}
                size="small"
                type="number"
                label="Heading (0-512)"
                inputProps={{
                  'aria-label': 'Door Heading',
                  min         : 0,
                  max         : 512,
                  step        : 1,
                }}
                value={selectedMesh?.dataReference?.heading ?? ''}
                onChange={(event) => {
                  const heading = Number(event.target.value);
                  selectedMesh.dataReference.heading = heading;
                  selectedMesh.dataReference.rotateY = eqHeadingToDegrees(heading);
                  selectedMesh.rotation.y = Tools.ToRadians(
                    selectedMesh.dataReference.rotateY
                  );
                  forceRender({});
                }}
                onBlur={saveFieldEdit}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur();
                  }
                }}
              />
              <TextField
                fullWidth
                disabled={!selectedMesh?.dataReference || mutationPending}
                size="small"
                type="number"
                label="Size (%)"
                inputProps={{
                  'aria-label': 'Door Size',
                  min         : 1,
                  step        : 1,
                }}
                value={selectedMesh?.dataReference?.size ?? ''}
                onChange={(event) => {
                  const size = Math.max(1, Number(event.target.value));
                  selectedMesh.dataReference.size = size;
                  selectedMesh.dataReference.scale = size / 100;
                  selectedMesh.scaling.setAll(selectedMesh.dataReference.scale);
                  forceRender({});
                }}
                onBlur={saveFieldEdit}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur();
                  }
                }}
              />
            </Stack>
          </>
        </Stack>
      </Box>
      <Divider sx={{ margin: '5px' }} />

      <Box sx={{ padding: '10px' }}>
        <Stack direction="row" sx={{ marginBottom: '5px' }}>
          <Typography
            sx={{
              fontSize   : '17px',
              marginTop  : '15px',
              paddingLeft: '5px',
            }}
          >
            Placable Doors
          </Typography>
          <Stack
            direction="row"
            sx={{ position: 'absolute', right: '20px', marginTop: '7px' }}
          >
            <IconButton
              disabled={optionIdx < 1}
              onClick={() => {
                if (optionIdx >= 1) {
                  setSelectedModel(modelOptions[optionIdx - 1].model);
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <IconButton
              disabled={optionIdx === -1 || optionIdx >= modelOptions.length - 1}
              onClick={() => {
                if (optionIdx >= 0 && optionIdx < modelOptions.length - 1) {
                  setSelectedModel(modelOptions[optionIdx + 1].model);
                }
              }}
            >
              <ArrowForwardIcon />
            </IconButton>
          </Stack>
        </Stack>

        <FormControl fullWidth>
          <Autocomplete
            value={
              modelOptions.find((option) => option.model === selectedModel) ?? null
            }
            size="small"
            sx={{ margin: '5px 0' }}
            slotProps={{
              popper: {
                sx: { zIndex: 200100 },
              },
            }}
            isOptionEqualToValue={(option, value) => option.key === value?.key}
            onChange={async (e, values) => {
              setSelectedModel(values?.model ?? '');
            }}
            renderOption={(props, option) => {
              return (
                <li {...props} key={option.key}>
                  {option.label}
                </li>
              );
            }}
            options={modelOptions}
            renderInput={(params) => (
              <TextField
                onKeyDown={(e) => e.stopPropagation()}
                {...params}
                label="Select Door"
              />
            )}
          />
        </FormControl>
        <Button
          fullWidth
          variant={'outlined'}
          sx={{ margin: '5px auto' }}
          disabled={!selectedModel || mutationPending}
          onClick={stamp}
        >
          <Typography
            variant="h6"
            sx={{
              textAlign : 'center',
              userSelect: 'none',
              fontSize  : '17px',
              color     : selectedModel ? 'text.primary' : 'text.secondary',
            }}
          >
            Add Door [{selectedModel || 'None'}]
          </Typography>
        </Button>

        <Divider sx={{ margin: '5px' }} />
      </Box>
    </Stack>
  );
};
