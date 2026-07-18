const POSE_ANIMATION_PATTERN = /^(?:Clone of )?pos$/i;
const VALUE_EPSILON = 0.00001;
const DEFAULT_ANIMATION_BOUNDS_RATIO_LIMIT = 8;
const DEFAULT_ANIMATION_BOUNDS_GROWTH_LIMIT = 250;
export { STATIC_POSE_ONLY_CHARACTER_MODELS } from '../../../sage/lib/util/character-animation-policy.js';
import { STATIC_POSE_ONLY_CHARACTER_MODELS } from '../../../sage/lib/util/character-animation-policy.js';

// These compact classic models intentionally ship only a posed POS clip. The
// runtime applies and validates that static pose (including lowered arms), so
// they must not be conflated with an arbitrary bind-pose-only model such as
// SDF/SHN, which require an explicit compatible animation donor.

export const isStaticPoseOnlyCharacterModel = (...modelNames) =>
  modelNames.some((modelName) =>
    STATIC_POSE_ONLY_CHARACTER_MODELS.has(
      `${modelName ?? ''}`.trim().slice(0, 3).toLowerCase()
    )
  );

const getAnimationKeys = (targetedAnimation) =>
  targetedAnimation?.animation?.getKeys?.() ??
  targetedAnimation?.animation?._keys ??
  [];

const valueComponents = (value) => {
  if (Number.isFinite(value)) {
    return [Number(value)];
  }
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    return Array.from(value, Number);
  }
  if (typeof value?.asArray === 'function') {
    return value.asArray().map(Number);
  }

  const components = ['x', 'y', 'z', 'w']
    .filter((key) => Number.isFinite(value?.[key]))
    .map((key) => Number(value[key]));
  return components.length > 0 ? components : [`${value ?? ''}`];
};

const valuesDiffer = (left, right) => {
  const leftValues = valueComponents(left);
  const rightValues = valueComponents(right);
  if (leftValues.length !== rightValues.length) {
    return true;
  }
  return leftValues.some((value, index) => {
    const other = rightValues[index];
    if (Number.isFinite(value) && Number.isFinite(other)) {
      return Math.abs(value - other) > VALUE_EPSILON;
    }
    return value !== other;
  });
};

const targetedAnimationKey = (targetedAnimation) => {
  const target = targetedAnimation?.target;
  const targetName =
    target?.id ?? target?.name ?? target?.uniqueId ?? 'unknown-target';
  const property =
    targetedAnimation?.animation?.targetProperty ?? 'unknown-property';
  return `${targetName}:${property}`;
};

const getPoseValues = (poseGroup) => {
  const poseValues = new Map();
  for (const targetedAnimation of poseGroup?.targetedAnimations ?? []) {
    const firstKey = getAnimationKeys(targetedAnimation)[0];
    if (firstKey) {
      poseValues.set(targetedAnimationKey(targetedAnimation), firstKey.value);
    }
  }
  return poseValues;
};

export const inspectAnimationGroupVitality = (animationGroup, poseGroup = null) => {
  const poseValues = getPoseValues(poseGroup);
  let keyedTargetCount = 0;
  let dynamicTargetCount = 0;
  let poseMatchedTargetCount = 0;
  let poseDeltaTargetCount = 0;
  let maximumKeyCount = 0;

  for (const targetedAnimation of animationGroup?.targetedAnimations ?? []) {
    const keys = getAnimationKeys(targetedAnimation);
    if (keys.length === 0) {
      continue;
    }
    keyedTargetCount++;
    maximumKeyCount = Math.max(maximumKeyCount, keys.length);
    if (keys.slice(1).some((key) => valuesDiffer(keys[0].value, key.value))) {
      dynamicTargetCount++;
    }

    const poseValue = poseValues.get(targetedAnimationKey(targetedAnimation));
    if (poseValue !== undefined) {
      poseMatchedTargetCount++;
      if (valuesDiffer(keys[0].value, poseValue)) {
        poseDeltaTargetCount++;
      }
    }
  }

  const isBindPoseClone =
    keyedTargetCount > 0 &&
    dynamicTargetCount === 0 &&
    poseMatchedTargetCount > 0 &&
    poseDeltaTargetCount === 0;
  return {
    name: `${animationGroup?.name ?? ''}`,
    targetedAnimationCount:
      animationGroup?.targetedAnimations?.length ?? 0,
    keyedTargetCount,
    maximumKeyCount,
    dynamicTargetCount,
    poseMatchedTargetCount,
    poseDeltaTargetCount,
    isBindPoseClone,
    hasVisualPose: dynamicTargetCount > 0 || poseDeltaTargetCount > 0,
  };
};

export const inspectAnimationSetVitality = (animationGroups = []) => {
  const poseGroup = animationGroups.find((group) =>
    POSE_ANIMATION_PATTERN.test(`${group?.name ?? ''}`)
  ) ?? null;
  const playableGroups = animationGroups.filter(
    (group) =>
      !POSE_ANIMATION_PATTERN.test(`${group?.name ?? ''}`) &&
      (group?.targetedAnimations?.length ?? 0) > 0
  );
  const groups = playableGroups.map((group) =>
    inspectAnimationGroupVitality(group, poseGroup)
  );
  return {
    poseGroupPresent: !!poseGroup,
    playableGroupCount: groups.length,
    dynamicGroupCount: groups.filter((group) => group.dynamicTargetCount > 0).length,
    visuallyPosedGroupCount: groups.filter((group) => group.hasVisualPose).length,
    bindPoseCloneGroupCount: groups.filter((group) => group.isBindPoseClone).length,
    motionlessGroupCount: groups.filter((group) => !group.hasVisualPose).length,
    motionlessGroups: groups
      .filter((group) => !group.hasVisualPose)
      .slice(0, 20),
    groups,
  };
};

export const evaluateCharacterAnimationReadiness = ({
  skeletonCount = 0,
  animationVitality = {},
  staticPoseFallbackAvailable = false,
} = {}) => {
  const violations = [];
  if (Number(skeletonCount) > 0 && staticPoseFallbackAvailable !== true) {
    if (Number(animationVitality.playableGroupCount ?? 0) === 0) {
      violations.push('missing-playable-animation');
    } else if (Number(animationVitality.visuallyPosedGroupCount ?? 0) === 0) {
      violations.push('animation-matches-bind-pose');
    }
  }
  return {
    pass: violations.length === 0,
    violations,
  };
};

export const evaluateAnimatedBoundsSafety = ({
  baselineMaxDimension,
  currentMaxDimension,
  ratioLimit = DEFAULT_ANIMATION_BOUNDS_RATIO_LIMIT,
  growthLimit = DEFAULT_ANIMATION_BOUNDS_GROWTH_LIMIT,
} = {}) => {
  const baseline = Number(baselineMaxDimension);
  const current = Number(currentMaxDimension);
  if (
    !Number.isFinite(baseline) ||
    baseline <= 0 ||
    !Number.isFinite(current) ||
    current <= 0
  ) {
    return {
      measurable: false,
      pass: true,
      baselineMaxDimension: Number.isFinite(baseline) ? baseline : null,
      currentMaxDimension: Number.isFinite(current) ? current : null,
      maximumSafeDimension: null,
      ratio: null,
    };
  }

  const safeRatioLimit = Math.max(1, Number(ratioLimit) || 1);
  const safeGrowthLimit = Math.max(0, Number(growthLimit) || 0);
  const maximumSafeDimension = Math.max(
    baseline * safeRatioLimit,
    baseline + safeGrowthLimit
  );
  return {
    measurable: true,
    pass: current <= maximumSafeDimension,
    baselineMaxDimension: baseline,
    currentMaxDimension: current,
    maximumSafeDimension,
    ratio: current / baseline,
  };
};

export const evaluateHeadRotationSafety = ({
  baselineQuaternion,
  currentQuaternion,
  maximumDegrees = 120,
} = {}) => {
  const components = (value) => [value?.x, value?.y, value?.z, value?.w]
    .map(Number);
  const baseline = components(baselineQuaternion);
  const current = components(currentQuaternion);
  if (
    baseline.some((value) => !Number.isFinite(value)) ||
    current.some((value) => !Number.isFinite(value))
  ) {
    return { pass: true, measurable: false, angleDegrees: null, maximumDegrees };
  }
  const baselineLength = Math.hypot(...baseline);
  const currentLength = Math.hypot(...current);
  if (baselineLength <= 0.000001 || currentLength <= 0.000001) {
    return { pass: true, measurable: false, angleDegrees: null, maximumDegrees };
  }
  const dot = Math.min(1, Math.abs(
    baseline.reduce(
      (total, value, index) => total +
        ((value / baselineLength) * (current[index] / currentLength)),
      0
    )
  ));
  const angleDegrees = (2 * Math.acos(dot) * 180) / Math.PI;
  return {
    pass: angleDegrees <= maximumDegrees,
    measurable: true,
    angleDegrees,
    maximumDegrees,
  };
};

const normalizeVisualAnimationName = (value) => `${value ?? ''}`
  .replace(/^Clone of /, '')
  .trim()
  .toLowerCase();

// Classic player-race archives expose O01 as their neutral standing idle.
// Modern archives use descriptive idle/STND names instead. P01 is deliberately
// excluded: on classic Wood Elves it is a combat-ready pose with raised arms,
// which moves over time but is not an acceptable default zone-editor idle.
export const isNeutralIdleAnimationName = (value) => {
  const name = normalizeVisualAnimationName(value);
  return (
    name === 'o01' ||
    /idle.*nooffset$/i.test(name) ||
    /(?:^|[_\-.])idle(?:[_\-.]|$)/i.test(name) ||
    /stnd.*nooffset$/i.test(name) ||
    /(?:^|[_\-.])stnd(?:[_\-.]|$)/i.test(name)
  );
};

export const selectPreferredVisualAnimationGroup = (
  animationGroups = [],
  preferredName = 'Clone of o01'
) => {
  const playableGroups = animationGroups.filter(
    (group) =>
      !POSE_ANIMATION_PATTERN.test(`${group?.name ?? ''}`) &&
      (group?.targetedAnimations?.length ?? 0) > 0
  );
  if (playableGroups.length === 0) {
    return null;
  }

  const vitality = inspectAnimationSetVitality(animationGroups);
  const vitalityByName = new Map(
    vitality.groups.map((group) => [group.name, group])
  );
  const dynamicGroups = playableGroups.filter(
    (group) => (vitalityByName.get(`${group?.name ?? ''}`)?.dynamicTargetCount ?? 0) > 0
  );
  const visuallyPosedGroups = playableGroups.filter(
    (group) => vitalityByName.get(`${group?.name ?? ''}`)?.hasVisualPose === true
  );

  const normalizeName = (group) => normalizeVisualAnimationName(group?.name);
  const normalizedPreferredName = normalizeVisualAnimationName(preferredName);
  const idleRank = (group) => {
    const name = normalizeName(group);
    if (name === normalizedPreferredName) return 0;
    // Native character archives often list swim/combat clips before idle.
    // Prefer the no-offset idle clip so root motion cannot displace or explode
    // the character hierarchy while it is standing in the zone editor.
    if (/idle.*nooffset$/i.test(name)) return 1;
    if (/(?:^|[_\-.])idle(?:[_\-.]|$)/i.test(name)) return 2;
    if (/stnd.*nooffset$/i.test(name)) return 3;
    if (/(?:^|[_\-.])stnd(?:[_\-.]|$)/i.test(name)) return 4;
    // P01 is the historical fallback for classic models that genuinely do
    // not contain O01. Keep it ahead of unrelated combat/swim clips without
    // letting it override a neutral idle that is actually available.
    if (name === 'p01') return 5;
    if (/nooffset$/i.test(name)) return 6;
    return 7;
  };
  const preferIdle = (groups) => groups
    .map((group, index) => ({ group, index, rank: idleRank(group) }))
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map(({ group }) => group);
  const orderedDynamicGroups = preferIdle(dynamicGroups);
  const orderedVisuallyPosedGroups = preferIdle(visuallyPosedGroups);

  // A constant clip can differ from the bind pose and still look valid, but it
  // must not win over a clip that actually changes over time. Otherwise the
  // engine reports a playing animation while the NPC remains frozen.
  return (
    orderedDynamicGroups[0] ??
    orderedVisuallyPosedGroups[0] ??
    null
  );
};

const normalizeAnimationTargetName = (value) =>
  `${value ?? ''}`.replace(/^Clone of /, '').trim().toLowerCase();

export const retargetDetachedAnimationTargets = (
  animationGroups = [],
  instantiatedNodes = []
) => {
  const nodes = instantiatedNodes.filter(Boolean);
  const nodeSet = new Set(nodes);
  const nodesByName = new Map();
  for (const node of nodes) {
    const name = normalizeAnimationTargetName(node?.name);
    if (!name) continue;
    const candidates = nodesByName.get(name) ?? [];
    candidates.push(node);
    nodesByName.set(name, candidates);
  }

  let detachedTargetCount = 0;
  let retargetedTargetCount = 0;
  let unresolvedTargetCount = 0;
  for (const group of animationGroups) {
    for (const targetedAnimation of group?.targetedAnimations ?? []) {
      if (nodeSet.has(targetedAnimation?.target)) {
        continue;
      }
      detachedTargetCount++;
      const targetName = normalizeAnimationTargetName(
        targetedAnimation?.target?.name
      );
      const candidates = nodesByName.get(targetName) ?? [];
      if (candidates.length !== 1) {
        unresolvedTargetCount++;
        continue;
      }
      targetedAnimation.target = candidates[0];
      retargetedTargetCount++;
    }
  }

  return {
    detachedTargetCount,
    retargetedTargetCount,
    unresolvedTargetCount,
  };
};
