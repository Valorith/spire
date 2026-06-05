export const CAMERA_FLY_SPEED_MIN = 0.25;
export const CAMERA_FLY_SPEED_MAX = 20;
export const CAMERA_FLY_SPEED_DEFAULT = 4;
export const CAMERA_FLY_SPEED_STEP = 0.25;
export const CAMERA_SPEED_BOOST_MULTIPLIER = 2;

export const clampFlySpeed = (
  value,
  fallback = CAMERA_FLY_SPEED_DEFAULT
) => {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue)
    ? numericValue
    : fallback;
  return Math.min(
    CAMERA_FLY_SPEED_MAX,
    Math.max(CAMERA_FLY_SPEED_MIN, safeValue)
  );
};
