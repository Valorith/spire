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
import { getEQDir, getEQFile, getFiles } from 'sage-core/util/fileHandler';
import { useMainContext } from '@/components/main/context';
import { useAlertContext } from '@/context/alerts';

const { Tools } = BABYLON;
function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

const zb = gameController.ZoneBuilderController;

const toDoorPlacement = (door) => ({
  ...door,
  rotateX: 0,
  rotateY: door.heading ?? 0,
  rotateZ: 0,
  scale  : (door.size ?? 100) / 100,
  x      : door.pos_y ?? 0,
  y      : door.pos_z ?? 0,
  z      : door.pos_x ?? 0,
});

const toDoorPayload = (doorEntry, zone, mesh = null) => {
  const position = mesh?.position;
  const rotation = mesh?.rotation;
  const scaling = mesh?.scaling;

  return {
    ...doorEntry,
    heading: doorEntry.rotateY ?? Tools.ToDegrees(rotation?.y ?? 0),
    name   : doorEntry.name,
    pos_x  : Math.round(position?.z ?? doorEntry.z ?? doorEntry.pos_x ?? 0),
    pos_y  : Math.round(position?.x ?? doorEntry.x ?? doorEntry.pos_y ?? 0),
    pos_z  : Math.round(position?.y ?? doorEntry.y ?? doorEntry.pos_z ?? 0),
    size   : Math.max(
      1,
      Math.round(((doorEntry.scale ?? scaling?.y) ?? 1) * 100)
    ),
    version: zone?.version ?? doorEntry.version ?? 0,
    zone   : zone?.short_name ?? doorEntry.zone,
  };
};

const stripDoorEditorFields = (doorEntry) => {
  const payload = { ...doorEntry };
  delete payload.rotateX;
  delete payload.rotateY;
  delete payload.rotateZ;
  delete payload.scale;
  delete payload.x;
  delete payload.y;
  delete payload.z;
  delete payload.dataContainerReference;
  delete payload.dataReference;
  return payload;
};

export const DoorsDrawer = ({ selectedObject }) => {
  const { openAlert } = useAlertContext();
  const { selectedZone, Spire } = useMainContext();
  const [selectedModel, setSelectedModel] = useState('');
  const [doRandom, setDoRandom] = useState(false);
  const [rotateClamp, setRotateClamp] = useState([0, 360]);
  const [scaleClamp, setScaleClamp] = useState([1, 3]);
  const [importOpen, setImportOpen] = useState(false);
  const [, forceRender] = useState({});
  const [objectMap, setObjectMap] = useState({});
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedMesh, setSelectedMesh] = useState(selectedObject);
  const editing = useRef(false);
  const doorsRef = useRef([]);

  const createDoorApi = useCallback(() => {
    if (!Spire) {
      return null;
    }
    return new Spire.SpireApiTypes.DoorApi(...Spire.SpireApi.cfg());
  }, [Spire]);

  const loadDoors = useCallback(async () => {
    if (!Spire || !selectedZone?.short_name) {
      doorsRef.current = [];
      return [];
    }

    const doorsApi = createDoorApi();
    const queryBuilder = new Spire.SpireQueryBuilder();
    queryBuilder.where('zone', '=', selectedZone.short_name);
    queryBuilder.where('version', '=', selectedZone.version ?? 0);
    queryBuilder.orderBy(['doorid']);

    const { data: doors } = await doorsApi.listDoors(queryBuilder.get());
    const normalizedDoors = Array.isArray(doors) ? doors : [];
    doorsRef.current = normalizedDoors;

    const { doorNode, instantiateObjects } = window.gameController.ZoneController;
    if (!doorNode) {
      return normalizedDoors;
    }
    doorNode.getChildMeshes().forEach((m) => m.dispose());

    const doorMap = normalizedDoors.reduce((acc, door) => {
      if (!acc[door.name]) {
        acc[door.name] = [];
      }
      acc[door.name].push(toDoorPlacement(door));
      return acc;
    }, {});

    for (const [modelName, placements] of Object.entries(doorMap)) {
      for (const mesh of await instantiateObjects.apply(
        window.gameController.ZoneController,
        [modelName, placements]
      )) {
        if (!mesh) {
          continue;
        }
        mesh.parent = doorNode;
      }
    }

    return normalizedDoors;
  }, [Spire, selectedZone, createDoorApi]);

  const persistDoor = useCallback(
    async (mesh = selectedMesh) => {
      if (!mesh?.dataReference?.id || !selectedZone) {
        return;
      }

      const payload = stripDoorEditorFields(
        toDoorPayload(mesh.dataReference, selectedZone, mesh)
      );
      const doorsApi = createDoorApi();
      await doorsApi.updateDoor({
        id  : payload.id,
        door: payload,
      });
      mesh.dataReference = toDoorPlacement(payload);
    },
    [createDoorApi, selectedMesh, selectedZone]
  );

  const editMesh = useCallback(() => {
    editing.current = true;

    zb.editMesh(selectedMesh, (commit) => {
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

      persistDoor(selectedMesh)
        .then(() => openAlert(`Updated ${selectedMesh.name}`))
        .catch((e) => {
          console.warn('Error updating door', e);
          openAlert(`Error updating ${selectedMesh.name}`, 'warning');
        });
    });
  }, [selectedMesh, persistDoor, openAlert]);

  const deleteMesh = useCallback(() => {
    if (!selectedMesh) {
      return;
    }

    const deleteLocal = () => {
      selectedMesh.dispose();
      setSelectedMesh(null);
    };

    if (!selectedMesh.dataReference?.id || !Spire) {
      deleteLocal();
      return;
    }

    createDoorApi()
      .deleteDoor({ id: selectedMesh.dataReference.id })
      .then(async () => {
        await loadDoors();
        deleteLocal();
        openAlert(`Deleted ${selectedMesh.name}`);
      })
      .catch((e) => {
        console.warn('Error deleting door', e);
        openAlert(`Error deleting ${selectedMesh.name}`, 'warning');
      });
  }, [Spire, createDoorApi, loadDoors, openAlert, selectedMesh]);

  useEffect(() => {
    const clickCallback = (mesh) => {
      if (editing.current) {
        return;
      }
      if (mesh.parent === zb.objectContainer) {
        setSelectedMesh(mesh);
      }
    };

    zb.addClickCallback(clickCallback);
    const keydown = (e) => {
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
      zb.removeClickCallback(clickCallback);
      zb.unassignGlow(selectedMesh);
    };
  }, [editMesh, selectedMesh, deleteMesh]);

  useEffect(() => {
    if (!Spire || !selectedZone?.short_name) {
      return;
    }
    let current = true;
    (async () => {
      try {
        const doors = await loadDoors();
        if (!current) {
          return;
        }
        doorsRef.current = doors;
      } catch (e) {
        console.log('err', e);
        openAlert('Error updating zone', 'warning');
      }
    })();

    return () => {
      current = false;
      const { doorNode } = window.gameController.ZoneController;
      doorNode?.getChildMeshes().forEach((m) => m.dispose());
    };
  }, [Spire, selectedZone?.short_name, selectedZone?.version, openAlert, loadDoors]);

  useEffect(() => {
    zb.assignGlow(selectedMesh);

    return () => zb.unassignGlow(selectedMesh);
  }, [selectedMesh]);

  useEffect(() => {
    (async () => {
      const objectDir = await getEQDir('objects');
      if (objectDir) {
        const objectPaths = await getEQFile('data', 'objectPaths.json', 'json');
        setObjectMap(objectPaths || {});
        const modelNames = await getFiles(
          objectDir,
          (name) => name.toLowerCase().endsWith('.glb'),
          true
        );
        setAvailableModels(
          modelNames
            .map((name) => name.replace(/\.glb$/i, ''))
            .sort((a, b) => a.localeCompare(b))
        );
      }
    })();
  }, []);

  const stamp = useCallback(() => {
    if (!selectedModel) {
      return;
    }
    zb.pickRaycastForLoc({
      /**
       *
       * @param {{x: number, y: number, z: number} | null} loc
       * @param {import('@babylonjs/core/Meshes/mesh').Mesh} mesh
       * @returns
       */
      async commitCallback(loc, mesh) {
        if (!loc) {
          return;
        }
        const { x, y, z } = loc;
        const rotationY = doRandom
          ? getRandomNumber(rotateClamp[0], rotateClamp[1])
          : Tools.ToDegrees(mesh.rotation.y);
        const scale = doRandom
          ? getRandomNumber(scaleClamp[0], scaleClamp[1])
          : mesh.scaling.y;
        const templateDoor = doorsRef.current[0] || {};
        const nextDoorId =
          Math.max(0, ...doorsRef.current.map((door) => door.doorid ?? 0)) + 1;
        const draftDoor = toDoorPlacement({
          ...templateDoor,
          id     : undefined,
          doorid : nextDoorId,
          heading: rotationY,
          name   : selectedModel,
          pos_x  : Math.round(z),
          pos_y  : Math.round(x),
          pos_z  : Math.round(y),
          size   : Math.max(1, Math.round(scale * 100)),
          version: selectedZone?.version ?? 0,
          zone   : selectedZone?.short_name,
        });

        const payload = stripDoorEditorFields(
          toDoorPayload(draftDoor, selectedZone)
        );

        try {
          const response = await createDoorApi().createDoor({ door: payload });
          const createdDoor = Array.isArray(response?.data)
            ? response.data[0]
            : response?.data;
          await loadDoors();
          openAlert(`Created ${createdDoor?.name ?? selectedModel}`);
        } catch (e) {
          console.warn('Error creating door', e);
          openAlert(`Error creating ${selectedModel}`, 'warning');
        }
      },
      modelName: selectedModel,
      extraHtml: '<p>Left Mouse: Rotate and [Shift] Scale</p>',
    });
  }, [
    createDoorApi,
    doRandom,
    loadDoors,
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
              disabled={!selectedMesh}
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
              disabled={!selectedMesh}
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
                disabled={!selectedMesh?.dataReference}
                size="small"
                type="number"
                inputProps={{
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
                onKeyDown={(e) => e.key === 'Enter' && saveFieldEdit()}
              ></TextField>
              <TextField
                disabled={!selectedMesh?.dataReference}
                size="small"
                type="number"
                inputProps={{
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
                onKeyDown={(e) => e.key === 'Enter' && saveFieldEdit()}
              ></TextField>
              <TextField
                disabled={!selectedMesh?.dataReference}
                size="small"
                type="number"
                inputProps={{
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
                onKeyDown={(e) => e.key === 'Enter' && saveFieldEdit()}
              ></TextField>
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
          disabled={!selectedModel}
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
