const EQ_HEADING_UNITS = 512;
const DEGREES_PER_EQ_HEADING_UNIT = 360 / EQ_HEADING_UNITS;
const DOOR_VISUAL_HEADING_OFFSET_DEGREES = 180;
const INVISIBLE_DOOR_OPEN_TYPES = new Set([50, 53, 54]);

const radiansToDegrees = (radians = 0) => Number(radians) * (180 / Math.PI);

export const normalizeZoneVersion = (zone) => {
  const version = Number(zone?.version ?? 0);
  return Number.isFinite(version) ? version : 0;
};

export const eqHeadingToDegrees = (heading = 0) => {
  const value = Number(heading);
  if (!Number.isFinite(value)) {
    return DOOR_VISUAL_HEADING_OFFSET_DEGREES;
  }

  return value * DEGREES_PER_EQ_HEADING_UNIT +
    DOOR_VISUAL_HEADING_OFFSET_DEGREES;
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
      doorEntry.rotateY ?? radiansToDegrees(rotation?.y ?? 0)
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
