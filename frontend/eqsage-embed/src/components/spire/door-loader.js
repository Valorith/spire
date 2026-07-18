import { getEQDir, getEQFile, getFiles } from 'sage-core/util/fileHandler';
import {
  getRenderableDoors,
  isInvisibleDoor,
  normalizeZoneVersion,
  toDoorPlacement,
} from './door-placement';

export {
  degreesToEqHeading,
  eqHeadingToDegrees,
  getRenderableDoors,
  isInvisibleDoor,
  normalizeZoneVersion,
  stripDoorEditorFields,
  toDoorPayload,
  toDoorPlacement,
} from './door-placement';

const DOOR_MODEL_ALIASES = {
  chair2d      : 'chair2',
  gchair2      : 'chair2',
  pokgthport500: 'obj_port_gukta',
};

let doorModelCatalogPromise = null;
const doorLoadStateByController = new WeakMap();

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

export const refreshDoorModelCatalog = async () => {
  doorModelCatalogPromise = null;
  return loadDoorModelCatalog();
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

const angularDistance = (left, right) =>
  Math.abs(Math.atan2(Math.sin(left - right), Math.cos(left - right)));

export const collectDoorLifecycleStats = ({
  controller,
  result,
  zoneKey,
} = {}) => {
  const doors = Array.isArray(result?.doors) ? result.doors : [];
  const renderableDoors = Array.isArray(result?.renderableDoors)
    ? result.renderableDoors
    : getRenderableDoors(doors);
  const doorMeshes = (controller?.doorNode?.getChildren?.() ?? [])
    .filter((node) => node?.dataReference);
  const expectedById = new Map(
    renderableDoors.map((door) => [Number(door.id), toDoorPlacement(door)])
  );
  const meshIds = doorMeshes.map((mesh) => Number(mesh.dataReference?.id));
  const meshIdSet = new Set(meshIds);
  let nonFinitePlacementCount = 0;
  let positionMismatchCount = 0;
  let transformMismatchCount = 0;

  for (const mesh of doorMeshes) {
    const expected = expectedById.get(Number(mesh.dataReference?.id));
    const actual = [
      mesh.position?.x,
      mesh.position?.y,
      mesh.position?.z,
      mesh.rotation?.y,
      mesh.scaling?.x,
      mesh.scaling?.y,
      mesh.scaling?.z,
    ].map(Number);
    if (!actual.every(Number.isFinite)) {
      nonFinitePlacementCount++;
      continue;
    }
    if (!expected) {
      continue;
    }
    if (
      Math.abs(actual[0] - Number(expected.x)) > 0.001 ||
      Math.abs(actual[1] - Number(expected.y)) > 0.001 ||
      Math.abs(actual[2] - Number(expected.z)) > 0.001
    ) {
      positionMismatchCount++;
    }
    const expectedRotationY = Number(expected.rotateY) * (Math.PI / 180);
    if (
      angularDistance(actual[3], expectedRotationY) > 0.001 ||
      actual.slice(4).some((scale) =>
        Math.abs(scale - Number(expected.scale)) > 0.001
      )
    ) {
      transformMismatchCount++;
    }
  }

  const missingVisualCount = renderableDoors.filter(
    (door) => !meshIdSet.has(Number(door.id))
  ).length;
  const staleVisualCount = meshIds.filter((id) => !expectedById.has(id)).length;
  const duplicateVisualIdCount = meshIds.length - meshIdSet.size;
  const missingModels = Array.isArray(result?.missingModels)
    ? result.missingModels
    : [];
  const stats = {
    duplicateVisualIdCount,
    hidden            : doors.length - renderableDoors.length,
    loaded            : Number(result?.loadedMeshes ?? doorMeshes.length),
    missingModelCount : missingModels.length,
    missingModels,
    missingVisualCount,
    nonFinitePlacementCount,
    pass:
      Number(result?.loadedMeshes ?? doorMeshes.length) === renderableDoors.length &&
      doorMeshes.length === renderableDoors.length &&
      missingModels.length === 0 &&
      missingVisualCount === 0 &&
      staleVisualCount === 0 &&
      duplicateVisualIdCount === 0 &&
      nonFinitePlacementCount === 0 &&
      positionMismatchCount === 0 &&
      transformMismatchCount === 0,
    positionMismatchCount,
    requested         : doors.length,
    sceneDoorCount    : doorMeshes.length,
    staleVisualCount,
    transformMismatchCount,
    visibleRequested  : renderableDoors.length,
    zoneKey,
  };

  if (typeof window !== 'undefined') {
    window.__spireSageDoorStats = stats;
    window.dispatchEvent(
      new CustomEvent('spire-sage-door-stats', { detail: stats })
    );
  }
  return stats;
};

export const loadDoorsForZone = async ({
  Spire,
  selectedZone,
  gameController = window.gameController,
  availableModelSet = null,
  clearExisting = true,
  forceReload = false,
} = {}) => {
  const controller =
    gameController?.ZoneController ?? window.gameController?.ZoneController;
  const { doorNode, instantiateObjects } = controller ?? {};
  const zoneKey = `${selectedZone?.short_name ?? ''}:${normalizeZoneVersion(selectedZone)}`;
  const existingState = controller
    ? doorLoadStateByController.get(controller)
    : null;

  if (
    controller &&
    !forceReload &&
    existingState?.zoneKey === zoneKey &&
    existingState?.doorNode === doorNode &&
    existingState?.promise
  ) {
    return existingState.promise;
  }

  const generation = (existingState?.generation ?? 0) + 1;
  const isCurrentLoad = () =>
    !controller || doorLoadStateByController.get(controller)?.generation === generation;
  const cancelledResult = (doors = []) => ({
    cancelled      : true,
    doors,
    invisibleDoors : [],
    loadedMeshes   : 0,
    missingModels  : [],
    renderableDoors: [],
  });

  const loadPromise = (async () => {
    const doors = await fetchDoorsForZone(Spire, selectedZone);
    if (!isCurrentLoad()) {
      return cancelledResult(doors);
    }
    const renderableDoors = getRenderableDoors(doors);
    const invisibleDoors = doors.filter(isInvisibleDoor);

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
      doorNode.getChildren().forEach((node) => node.dispose());
    }

    let modelSet =
      availableModelSet ?? (await loadDoorModelCatalog()).availableModelSet;
    if (!isCurrentLoad()) {
      return cancelledResult(doors);
    }
    let catalogRefreshed = false;
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
    const ownedMeshes = [];
    let loadedMeshes = 0;

    for (const [modelName, placements] of Object.entries(doorMap)) {
      if (!isCurrentLoad()) {
        ownedMeshes.forEach((mesh) => mesh.dispose?.(false, true));
        return cancelledResult(doors);
      }
      const resolvedModelName = DOOR_MODEL_ALIASES[modelName] ?? modelName;
      if (
        !modelSet.has(resolvedModelName.toLowerCase()) &&
        availableModelSet === null &&
        !catalogRefreshed
      ) {
        modelSet = (await refreshDoorModelCatalog()).availableModelSet;
        catalogRefreshed = true;
      }
      if (!isCurrentLoad()) {
        ownedMeshes.forEach((mesh) => mesh.dispose?.(false, true));
        return cancelledResult(doors);
      }
      if (!modelSet.has(resolvedModelName.toLowerCase())) {
        missingModels.push(modelName);
        continue;
      }

      const meshes = await controller.instantiateObjects(resolvedModelName, placements, {
        isCancelled: () => !isCurrentLoad(),
      });
      if (!isCurrentLoad()) {
        meshes.forEach((mesh) => mesh?.dispose?.(false, true));
        ownedMeshes.forEach((mesh) => mesh.dispose?.(false, true));
        return cancelledResult(doors);
      }
      meshes.forEach((mesh, idx) => {
        if (!mesh) {
          return;
        }
        mesh.parent = doorNode;
        mesh.dataReference = placements[idx] ?? placements[0];
        mesh.metadata = {
          ...(mesh.metadata ?? {}),
          doorModelName: resolvedModelName,
          doorObject   : true,
        };
        ownedMeshes.push(mesh);
        loadedMeshes += 1;
      });
    }

    return {
      cancelled: false,
      doors,
      invisibleDoors,
      loadedMeshes,
      missingModels,
      renderableDoors,
    };
  })();

  if (controller) {
    doorLoadStateByController.set(controller, {
      doorNode,
      generation,
      promise: loadPromise,
      zoneKey,
    });
  }

  try {
    const result = await loadPromise;
    if (!result.cancelled) {
      result.lifecycle = collectDoorLifecycleStats({
        controller,
        result,
        zoneKey,
      });
    }
    return result;
  } catch (error) {
    if (
      controller &&
      doorLoadStateByController.get(controller)?.generation === generation
    ) {
      doorLoadStateByController.delete(controller);
    }
    throw error;
  }
};
