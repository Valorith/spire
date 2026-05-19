import BABYLON from '@bjs';
import { getEQDir, getEQFile, getFiles } from 'sage-core/util/fileHandler';

const { Tools } = BABYLON;
const EQ_HEADING_UNITS = 512;
const DEGREES_PER_EQ_HEADING_UNIT = 360 / EQ_HEADING_UNITS;
const DOOR_VISUAL_HEADING_OFFSET_DEGREES = 180;
const INVISIBLE_DOOR_OPEN_TYPES = new Set([50, 53, 54]);

let doorModelCatalogPromise = null;

export const normalizeZoneVersion = (zone) => {
  const version = Number(zone?.version ?? 0);
  return Number.isFinite(version) ? version : 0;
};

export const eqHeadingToDegrees = (heading = 0) => {
  const value = Number(heading);
  if (!Number.isFinite(value)) {
    return DOOR_VISUAL_HEADING_OFFSET_DEGREES;
  }

  return value * DEGREES_PER_EQ_HEADING_UNIT + DOOR_VISUAL_HEADING_OFFSET_DEGREES;
};

export const degreesToEqHeading = (degrees = 0) => {
  const value = Number(degrees);
  if (!Number.isFinite(value)) {
    return 0;
  }

  const dbDegrees = value - DOOR_VISUAL_HEADING_OFFSET_DEGREES;
  const normalizedDegrees = ((dbDegrees % 360) + 360) % 360;
  return normalizedDegrees / DEGREES_PER_EQ_HEADING_UNIT;
};

export const toDoorPlacement = (door) => ({
  ...door,
  rotateX: 0,
  rotateY: eqHeadingToDegrees(door.heading ?? 0),
  rotateZ: 0,
  scale  : (door.size ?? 100) / 100,
  x      : door.pos_y ?? 0,
  y      : door.pos_z ?? 0,
  z      : door.pos_x ?? 0,
});

export const isInvisibleDoor = (door) =>
  INVISIBLE_DOOR_OPEN_TYPES.has(Number(door?.opentype));

export const getRenderableDoors = (doors = []) =>
  doors.filter((door) => !isInvisibleDoor(door));

export const toDoorPayload = (doorEntry, zone, mesh = null) => {
  const position = mesh?.position;
  const rotation = mesh?.rotation;
  const scaling = mesh?.scaling;

  return {
    ...doorEntry,
    heading: degreesToEqHeading(
      doorEntry.rotateY ?? Tools.ToDegrees(rotation?.y ?? 0)
    ),
    name   : doorEntry.name,
    pos_x  : Math.round(position?.z ?? doorEntry.z ?? doorEntry.pos_x ?? 0),
    pos_y  : Math.round(position?.x ?? doorEntry.x ?? doorEntry.pos_y ?? 0),
    pos_z  : Math.round(position?.y ?? doorEntry.y ?? doorEntry.pos_z ?? 0),
    size   : Math.max(
      1,
      Math.round(((doorEntry.scale ?? scaling?.y) ?? 1) * 100)
    ),
    version: normalizeZoneVersion(zone ?? doorEntry),
    zone   : zone?.short_name ?? doorEntry.zone,
  };
};

export const stripDoorEditorFields = (doorEntry) => {
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

export const loadDoorModelCatalog = async () => {
  if (!doorModelCatalogPromise) {
    doorModelCatalogPromise = (async () => {
      const objectDir = await getEQDir('objects');
      if (!objectDir) {
        return {
          availableModels   : [],
          availableModelSet : new Set(),
          objectMap         : {},
        };
      }

      const objectMap = (await getEQFile('data', 'objectPaths.json', 'json')) || {};
      const modelNames = await getFiles(
        objectDir,
        (name) => name.toLowerCase().endsWith('.glb'),
        true
      );
      const availableModels = modelNames
        .map((name) => name.replace(/\.glb$/i, ''))
        .sort((a, b) => a.localeCompare(b));

      return {
        availableModels,
        availableModelSet: new Set(
          availableModels.map((model) => model.toLowerCase())
        ),
        objectMap,
      };
    })().catch((error) => {
      doorModelCatalogPromise = null;
      throw error;
    });
  }

  return doorModelCatalogPromise;
};

export const fetchDoorsForZone = async (Spire, selectedZone) => {
  if (!Spire || !selectedZone?.short_name) {
    return [];
  }

  const doorsApi = new Spire.SpireApiTypes.DoorApi(...Spire.SpireApi.cfg());
  const queryBuilder = new Spire.SpireQueryBuilder();
  queryBuilder.where('zone', '=', selectedZone.short_name);
  queryBuilder.where('version', '=', normalizeZoneVersion(selectedZone));
  queryBuilder.orderBy(['doorid']);
  queryBuilder.limit(100000);

  const { data: doors } = await doorsApi.listDoors(queryBuilder.get());
  return Array.isArray(doors) ? doors : [];
};

export const loadDoorsForZone = async ({
  Spire,
  selectedZone,
  gameController = window.gameController,
  availableModelSet = null,
  clearExisting = true,
} = {}) => {
  const doors = await fetchDoorsForZone(Spire, selectedZone);
  const renderableDoors = getRenderableDoors(doors);
  const invisibleDoors = doors.filter(isInvisibleDoor);
  const controller =
    gameController?.ZoneController ?? window.gameController?.ZoneController;
  const { doorNode, instantiateObjects } = controller ?? {};

  if (!doorNode || typeof instantiateObjects !== 'function') {
    return {
      doors,
      invisibleDoors,
      loadedMeshes  : 0,
      missingModels : [],
      renderableDoors,
    };
  }

  if (clearExisting) {
    doorNode.getChildMeshes().forEach((mesh) => mesh.dispose());
  }

  const modelSet =
    availableModelSet ?? (await loadDoorModelCatalog()).availableModelSet;
  const doorMap = renderableDoors.reduce((acc, door) => {
    if (!door?.name) {
      return acc;
    }
    const modelName = door.name.toLowerCase();
    if (!acc[modelName]) {
      acc[modelName] = [];
    }
    acc[modelName].push(toDoorPlacement(door));
    return acc;
  }, {});

  const missingModels = [];
  let loadedMeshes = 0;

  for (const [modelName, placements] of Object.entries(doorMap)) {
    if (!modelSet.has(modelName.toLowerCase())) {
      missingModels.push(modelName);
      continue;
    }

    const meshes = await controller.instantiateObjects(modelName, placements);
    meshes.forEach((mesh, idx) => {
      if (!mesh) {
        return;
      }
      mesh.parent = doorNode;
      mesh.dataReference = placements[idx] ?? placements[0];
      mesh.metadata = {
        ...(mesh.metadata ?? {}),
        doorObject: true,
      };
      loadedMeshes += 1;
    });
  }

  return {
    doors,
    invisibleDoors,
    loadedMeshes,
    missingModels,
    renderableDoors,
  };
};
