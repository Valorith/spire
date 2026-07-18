const finiteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const evaluateNameplatePlacement = ({
  bodyTopLocalY,
  nameplateCenterLocalY,
  planeHeight,
  rootScaleY = 1,
  requiredWorldClearance = 0,
  tolerance = 0.005,
} = {}) => {
  const bodyTop = finiteNumber(bodyTopLocalY);
  const center = finiteNumber(nameplateCenterLocalY);
  const height = finiteNumber(planeHeight);
  const scale = Math.abs(finiteNumber(rootScaleY) ?? 1) || 1;
  const requiredClearance = Math.max(
    0,
    finiteNumber(requiredWorldClearance) ?? 0
  );
  const allowedTolerance = Math.max(0, finiteNumber(tolerance) ?? 0);
  const finite = bodyTop !== null && center !== null && height !== null && height > 0;
  const bottomLocalY = finite ? center - height / 2 : null;
  const clearanceLocalY = finite ? bottomLocalY - bodyTop : null;
  const clearanceWorldY = finite ? clearanceLocalY * scale : null;

  return {
    finite,
    bodyTopLocalY: bodyTop,
    nameplateCenterLocalY: center,
    planeHeight: height,
    bottomLocalY,
    clearanceLocalY,
    clearanceWorldY,
    requiredWorldClearance: requiredClearance,
    pass:
      finite &&
      clearanceWorldY + allowedTolerance >= requiredClearance,
  };
};
