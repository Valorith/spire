const POSE_ANIMATION_NAME = 'pos';

// These compact classic character rigs intentionally ship with a native POS
// clip but no compatible playable animation set. This is an asset property,
// not a cache-order decision: the exporter must preserve the native pose even
// when the mapped donor animation JSON has not been generated yet.
export const STATIC_POSE_ONLY_CHARACTER_MODELS = new Set([
  'qcm',
  'qcf',
  'clm',
  'clf',
  // Coldain use their own compact hierarchy. The mapped classic dwarf donor
  // covers only a small fraction of their exact bone names, so applying that
  // animation folds the body into the head/torso. Their native POS clip is the
  // authoritative safe preview pose.
  'com',
  'cof',
]);

const normalizeKeys = (value) =>
  Object.keys(value ?? {})
    .map((key) => `${key}`.trim().toLowerCase())
    .filter(Boolean);

// Shared classic animations are only safe when their tracks describe the same
// target bones. Compact rigs can be anatomically valid while using an entirely
// different hierarchy; applying donor-local transforms to them folds or
// scatters the mesh. Prefer the target model's native pose in that case.
export const getCharacterAnimationCompatibility = ({
  targetPoseTracks,
  donorPoseTracks,
  nativeAnimationKeys = [],
  minimumExactCoverage = 0.8,
}) => {
  const targetBones = normalizeKeys(targetPoseTracks);
  const donorBones = new Set(normalizeKeys(donorPoseTracks));
  const nativeKeys = nativeAnimationKeys
    .map((key) => `${key}`.trim().toLowerCase())
    .filter(Boolean);
  const hasNativePose = nativeKeys.includes(POSE_ANIMATION_NAME);
  const hasNativePlayableAnimation = nativeKeys.some(
    (key) => key !== POSE_ANIMATION_NAME
  );
  const exactBoneCount = targetBones.filter((bone) => donorBones.has(bone)).length;
  const exactCoverage = targetBones.length > 0
    ? exactBoneCount / targetBones.length
    : 0;
  const useNativePoseOnly =
    hasNativePose &&
    !hasNativePlayableAnimation &&
    targetBones.length >= 5 &&
    exactCoverage < minimumExactCoverage;

  return {
    targetBoneCount: targetBones.length,
    donorBoneCount: donorBones.size,
    exactBoneCount,
    exactCoverage,
    hasNativePose,
    hasNativePlayableAnimation,
    useNativePoseOnly,
  };
};

export const shouldUseNativeCharacterPose = (options) =>
  getCharacterAnimationCompatibility(options).useNativePoseOnly;
