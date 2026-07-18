const finite = (value) => Number.isFinite(Number(value));
const count = (value) => finite(value) ? Number(value) : 0;

const dimensions = (bounds) => [
  Number(bounds?.width),
  Number(bounds?.height),
  Number(bounds?.depth),
];

const relativeDelta = (left, right) => {
  const denominator = Math.max(Math.abs(left), Math.abs(right), 1e-6);
  return Math.abs(left - right) / denominator;
};

const meanAbsolutePixelDelta = (left = [], right = []) => {
  if (left.length === 0 || left.length !== right.length) return Infinity;
  return left.reduce(
    (total, value, index) => total + Math.abs(Number(value) - Number(right[index])),
    0
  ) / (left.length * 255);
};

const meanAbsolutePixelRegionDelta = (
  left = [],
  right = [],
  { width = 8, rows = 3 } = {}
) => {
  const channelCount = 3;
  const length = Math.min(left.length, right.length, width * rows * channelCount);
  if (length === 0 || left.length !== right.length) return Infinity;
  let total = 0;
  for (let index = 0; index < length; index += 1) {
    total += Math.abs(Number(left[index]) - Number(right[index]));
  }
  return total / (length * 255);
};

const approvedPixelSignature = (signature = []) => {
  const sourceWidth = 16;
  const sourceHeight = 16;
  const channelCount = 3;
  if (signature.length !== sourceWidth * sourceHeight * channelCount) {
    return [...signature];
  }
  const result = [];
  for (let y = 0; y < sourceHeight; y += 2) {
    for (let x = 0; x < sourceWidth; x += 2) {
      for (let channel = 0; channel < channelCount; channel += 1) {
        const values = [
          signature[((y * sourceWidth) + x) * channelCount + channel],
          signature[((y * sourceWidth) + x + 1) * channelCount + channel],
          signature[(((y + 1) * sourceWidth) + x) * channelCount + channel],
          signature[(((y + 1) * sourceWidth) + x + 1) * channelCount + channel],
        ];
        result.push(Math.round(values.reduce((sum, value) => sum + Number(value), 0) / 4));
      }
    }
  }
  return result;
};

export const visualBaselineKey = (sample = {}) => {
  const parts = [
    `${sample.model ?? ''}`.trim().toLowerCase(),
    `face=${Number(sample.face ?? 0)}`,
    `texture=${Number(sample.texture ?? 0)}`,
    `helm=${Number(sample.helmTexture ?? 0)}`,
  ];
  if (Object.hasOwn(sample, 'heading')) {
    parts.push(`heading=${Number(sample.heading)}`);
  }
  return parts.join('|');
};

export const createApprovedVisualBaseline = (evidence = {}) => ({
  meshCount: count(evidence.meshCount),
  vertexCount: count(evidence.vertexCount),
  skeletonCount: count(evidence.skeletonCount),
  boneCount: count(evidence.boneCount),
  materialSignature: `${evidence.materialSignature ?? ''}`,
  skeletonSignature: `${evidence.skeletonSignature ?? ''}`,
  foregroundBounds: evidence.pixels?.foregroundBounds ?? null,
  whitePixelRatio: Number(evidence.pixels?.whitePixelRatio ?? 0),
  pixelSignature: approvedPixelSignature(evidence.pixels?.signature),
});

export const DEFAULT_VISUAL_INVARIANTS = Object.freeze({
  minimumMeshCount: 1,
  minimumVertexCount: 3,
  minimumExtent: 0.001,
  maximumBoundsAspectRatio: 80,
  minimumStaticBoundsRatio: 0.15,
  maximumStaticBoundsRatio: 5,
  minimumForegroundPixels: 500,
  maximumWhitePixelRatio: null,
  requireFullMaterialCoverage: true,
  requireArmsDown: false,
  requireAnimationMotion: true,
  minimumAnimationPoseDelta: 0.00001,
  minimumAnimationFrameCount: 3,
  maximumArmVerticalRatio: -0.3,
  maximumRepeatBoundsDelta: 0.025,
  maximumRepeatPixelDelta: 0.04,
  maximumApprovedPixelDelta: 0.035,
  maximumApprovedHeadPixelDelta: 0.025,
  maximumApprovedForegroundBoundsDelta: 0.06,
  minimumSemanticHeadVertexCount: 20,
  minimumSemanticHeadHeightRatio: 0.55,
});

export const evaluatePreviewEvidence = (
  evidence,
  options = {}
) => {
  const config = { ...DEFAULT_VISUAL_INVARIANTS, ...options };
  const violations = [];
  const runtimeDimensions = dimensions(evidence?.runtimeBounds);

  if (evidence?.available !== true) violations.push('preview-spawn-not-found');
  if (count(evidence?.meshCount) < config.minimumMeshCount) {
    violations.push('missing-runtime-meshes');
  }
  if (count(evidence?.vertexCount) < config.minimumVertexCount) {
    violations.push('missing-runtime-vertices');
  }
  if (!runtimeDimensions.every(finite)) {
    violations.push('non-finite-runtime-bounds');
  } else {
    const minimum = Math.min(...runtimeDimensions);
    const maximum = Math.max(...runtimeDimensions);
    if (minimum < config.minimumExtent) violations.push('collapsed-runtime-bounds');
    if (maximum / Math.max(minimum, config.minimumExtent) > config.maximumBoundsAspectRatio) {
      violations.push('implausible-runtime-bounds');
    }
  }

  const staticDimensions = dimensions(evidence?.staticBounds);
  if (runtimeDimensions.every(finite) && staticDimensions.every(finite)) {
    // Exported character roots can remap source axes (for example source X
    // becoming Babylon Y). Compare sorted extents so legitimate coordinate
    // transforms pass while collapsed or exploded dimensions still fail.
    const runtimeSorted = [...runtimeDimensions].sort((a, b) => a - b);
    const staticSorted = [...staticDimensions].sort((a, b) => a - b);
    const ratios = runtimeSorted.map((value, index) =>
      value / Math.max(staticSorted[index], config.minimumExtent)
    );
    if (ratios.some((ratio) =>
      ratio < config.minimumStaticBoundsRatio || ratio > config.maximumStaticBoundsRatio
    )) {
      violations.push('runtime-static-bounds-mismatch');
    }
  }

  if (
    config.requireFullMaterialCoverage &&
    count(evidence?.untexturedRenderedMaterialCount) > 0
  ) {
    violations.push('untextured-rendered-material');
  }
  if (count(evidence?.pendingTextureCount) > 0) violations.push('texture-pending');
  if (count(evidence?.fallbackTextureCount) > 0) violations.push('texture-fallback');
  if (count(evidence?.headOrientationRiskCount) > 0) {
    violations.push('head-texture-orientation');
  }
  if (
    evidence?.bodyVariantFallback === true &&
    evidence?.bodyVariantTextureFallbackApplied !== true
  ) {
    violations.push('body-variant-fallback');
  }
  if (
    evidence?.bodyVariantTextureFallbackApplied === true &&
    count(evidence?.bodyVariantTextureFallbackAppliedCount) +
      count(evidence?.bodyVariantTextureCoverageAppliedCount) === 0
  ) {
    violations.push('body-variant-fallback-unproven');
  }
  if (
    count(evidence?.bodyVariantTextureCoverageAppliedCount) !==
      count(evidence?.bodyVariantTextureCoverageRequiredCount)
  ) {
    violations.push('body-variant-coverage-incomplete');
  }
  if (
    evidence?.requestedModelVariation &&
    evidence?.loadedModelVariation &&
    evidence.requestedModelVariation !== evidence.loadedModelVariation &&
    evidence?.bodyVariantTextureFallbackApplied !== true
  ) {
    violations.push('body-variant-mismatch');
  }
  if (count(evidence?.secondaryHeadBoneRemapFailureCount) > 0) {
    violations.push('secondary-head-bone-remap-failure');
  }
  if (count(evidence?.nonFiniteBoneMatrixCount) > 0) {
    violations.push('invalid-bone-matrix');
  }
  const skeletonNames = new Set(
    `${evidence?.skeletonSignature ?? ''}`
      .toLowerCase()
      .split('|')
      .map((name) => name.trim())
      .filter(Boolean)
  );
  const semanticHeadName = ['he', 'head', 'hehead'].find((name) =>
    skeletonNames.has(name)
  );
  const headMeshes = evidence?.headMeshes ?? [];
  const hasCharacterHeadMaterial = `${evidence?.materialSignature ?? ''}`
    .split('|')
    .some((entry) => /^[a-z0-9]{3}he(?:\d{2}|sk)\d{2}:/i.test(entry));
  if (semanticHeadName && hasCharacterHeadMaterial && headMeshes.length === 0) {
    violations.push('missing-head-geometry');
  }
  if (semanticHeadName && headMeshes.length > 0) {
    const headVertexCount = headMeshes.reduce(
      (total, mesh) => total + count(mesh?.vertexCount),
      0
    );
    if (headVertexCount < config.minimumSemanticHeadVertexCount) {
      violations.push('head-geometry-too-small');
    }
    if (!headMeshes.some((mesh) =>
      (mesh?.influencingBoneNames ?? []).some((name) =>
        `${name}`.toLowerCase() === semanticHeadName
      )
    )) {
      violations.push('head-geometry-misbound');
    }
    const minimumY = Number(evidence?.runtimeBounds?.minimum?.y);
    const height = Number(evidence?.runtimeBounds?.height);
    const headCenterRatios = headMeshes
      .map((mesh) =>
        (Number(mesh?.bounds?.center?.y) - minimumY) / height
      )
      .filter(Number.isFinite);
    if (
      Number.isFinite(minimumY) &&
      Number.isFinite(height) &&
      height > 0 &&
      headCenterRatios.length > 0 &&
      Math.max(...headCenterRatios) < config.minimumSemanticHeadHeightRatio
    ) {
      violations.push('head-geometry-displaced');
    }
  }
  if (
    evidence?.previewAnimationDonorExpected === true &&
    evidence?.previewAnimationDonorPass !== true
  ) {
    violations.push('preview-animation-donor-not-attached-to-instance');
  }
  if (
    evidence?.previewAnimationDonorExpected === true &&
    (
      count(evidence?.previewAnimationDonorGroupCount) === 0 ||
      count(evidence?.previewAnimationDonorTargetCount) === 0 ||
      count(evidence?.previewAnimationDonorBindRelativeTargetCount) !==
        count(evidence?.previewAnimationDonorTargetCount)
    )
  ) {
    violations.push('preview-animation-donor-empty');
  }
  if (evidence?.previewAnimationDonorExpected === true) {
    const lockedNames = new Set(
      (evidence?.previewAnimationDonorBindLockedRotationTargetNames ?? [])
        .map((name) => `${name}`.toLowerCase())
    );
    const primaryHeadName = skeletonNames.has('he')
      ? 'he'
      : skeletonNames.has('head')
        ? 'head'
        : skeletonNames.has('hehead')
          ? 'hehead'
          : null;
    if (primaryHeadName && !lockedNames.has(primaryHeadName)) {
      violations.push('preview-animation-donor-head-rotation-unlocked');
    }
  }
  if (count(evidence?.pixels?.foregroundPixelCount) < config.minimumForegroundPixels) {
    violations.push('insufficient-visible-model-pixels');
  }
  if (
    config.maximumWhitePixelRatio !== null &&
    finite(evidence?.pixels?.whitePixelRatio) &&
    Number(evidence.pixels.whitePixelRatio) > Number(config.maximumWhitePixelRatio)
  ) {
    violations.push('excessive-white-model-pixels');
  }

  const armsDownRequired = config.requireArmsDown || evidence?.compactExpected === true;
  if (armsDownRequired) {
    for (const [side, arm] of [['left', evidence?.leftArm], ['right', evidence?.rightArm]]) {
      if (arm?.available !== true) {
        violations.push(`${side}-arm-geometry-missing`);
      } else if (Number(arm.verticalRatio) > Number(config.maximumArmVerticalRatio)) {
        violations.push(`${side}-arm-horizontal`);
      }
    }
  }
  if (evidence?.compactExpected === true) {
    if (evidence?.nativePoseOnly !== true) violations.push('compact-native-pose-disabled');
    if (evidence?.neutralized !== true) violations.push('compact-arm-neutralization-missing');
  }

  const animationMotion = evidence?.animationMotion;
  const donorAnimationExpected =
    evidence?.previewAnimationDonorExpected === true &&
    evidence?.previewAnimationDonorPass === true &&
    count(evidence?.previewAnimationDonorGroupCount) > 0;
  const animationExpected =
    donorAnimationExpected ||
    animationMotion?.expectedMotion === true ||
    (
      count(evidence?.skeletonCount) > 0 &&
      evidence?.nativePoseOnly !== true &&
      animationMotion?.expectedMotion !== false
    );
  if (
    config.requireAnimationMotion &&
    animationExpected
  ) {
    if (animationMotion?.available !== true) {
      violations.push('animation-motion-probe-unavailable');
    }
    if (count(animationMotion?.frameCount) < config.minimumAnimationFrameCount) {
      violations.push('animation-motion-samples-missing');
    }
    if (count(animationMotion?.nonFiniteValueCount) > 0) {
      violations.push('animation-motion-non-finite');
    }
    if (
      animationMotion?.moving !== true ||
      Number(animationMotion?.maximumPoseDelta ?? 0) <
        Number(config.minimumAnimationPoseDelta)
    ) {
      violations.push('animation-motionless');
    }
  }

  return {
    pass: violations.length === 0,
    violations: [...new Set(violations)],
    runtimeDimensions,
    config,
  };
};

export const comparePreviewEvidence = (observations = [], options = {}) => {
  const config = { ...DEFAULT_VISUAL_INVARIANTS, ...options };
  const violations = [];
  const baseline = observations[0];
  if (!baseline || observations.length < 2) {
    return { pass: false, violations: ['insufficient-independent-repetitions'] };
  }

  for (let index = 1; index < observations.length; index += 1) {
    const current = observations[index];
    for (const key of ['meshCount', 'vertexCount', 'skeletonCount', 'boneCount']) {
      if (count(current?.[key]) !== count(baseline?.[key])) {
        violations.push(`repeat-${index + 1}-${key}-changed`);
      }
    }
    for (const key of ['materialSignature', 'skeletonSignature']) {
      if (`${current?.[key] ?? ''}` !== `${baseline?.[key] ?? ''}`) {
        violations.push(`repeat-${index + 1}-${key}-changed`);
      }
    }
    const baselineDimensions = dimensions(baseline.runtimeBounds);
    const currentDimensions = dimensions(current.runtimeBounds);
    if (
      !baselineDimensions.every(finite) ||
      !currentDimensions.every(finite) ||
      baselineDimensions.some((value, axis) =>
        relativeDelta(value, currentDimensions[axis]) > config.maximumRepeatBoundsDelta
      )
    ) {
      violations.push(`repeat-${index + 1}-bounds-changed`);
    }
    const pixelDelta = meanAbsolutePixelDelta(
      baseline?.pixels?.signature,
      current?.pixels?.signature
    );
    if (pixelDelta > config.maximumRepeatPixelDelta) {
      violations.push(`repeat-${index + 1}-pixels-changed`);
    }
  }

  return {
    pass: violations.length === 0,
    violations: [...new Set(violations)],
  };
};

export const compareApprovedVisualBaseline = (
  evidence,
  approvedBaseline,
  options = {}
) => {
  const config = { ...DEFAULT_VISUAL_INVARIANTS, ...options };
  if (!approvedBaseline) {
    return {
      pass: options.requireApprovedBaseline !== true,
      skipped: options.requireApprovedBaseline !== true,
      violations: options.requireApprovedBaseline === true
        ? ['approved-visual-baseline-missing']
        : [],
    };
  }

  const violations = [];
  for (const key of ['meshCount', 'vertexCount', 'skeletonCount', 'boneCount']) {
    if (count(evidence?.[key]) !== count(approvedBaseline?.[key])) {
      violations.push(`approved-${key}-changed`);
    }
  }
  for (const key of ['materialSignature', 'skeletonSignature']) {
    if (`${evidence?.[key] ?? ''}` !== `${approvedBaseline?.[key] ?? ''}`) {
      violations.push(`approved-${key}-changed`);
    }
  }

  const pixelDelta = meanAbsolutePixelDelta(
    approvedPixelSignature(evidence?.pixels?.signature),
    approvedBaseline?.pixelSignature
  );
  if (pixelDelta > config.maximumApprovedPixelDelta) {
    violations.push('approved-pixels-changed');
  }
  const headPixelDelta = meanAbsolutePixelRegionDelta(
    approvedPixelSignature(evidence?.pixels?.signature),
    approvedBaseline?.pixelSignature
  );
  if (headPixelDelta > config.maximumApprovedHeadPixelDelta) {
    violations.push('approved-head-region-changed');
  }

  const currentBounds = evidence?.pixels?.foregroundBounds;
  const approvedBounds = approvedBaseline?.foregroundBounds;
  for (const key of ['x', 'y', 'width', 'height']) {
    if (
      !finite(currentBounds?.[key]) ||
      !finite(approvedBounds?.[key]) ||
      Math.abs(Number(currentBounds[key]) - Number(approvedBounds[key])) >
        config.maximumApprovedForegroundBoundsDelta
    ) {
      violations.push('approved-foreground-bounds-changed');
      break;
    }
  }

  return {
    pass: violations.length === 0,
    skipped: false,
    violations: [...new Set(violations)],
    pixelDelta,
    headPixelDelta,
  };
};

// Baseline approval is the reviewed escape hatch for intentional visual
// changes, so a mismatch against the *old* approved pixels is expected. It is
// eligible only when every independent audit, invariant and repeatability gate
// passed; this prevents approval from laundering a load, pose or texture bug.
export const evaluateVisualBaselineApprovalEligibility = (sample) => {
  const violations = [];
  if ((sample?.observations ?? []).length < 2) {
    violations.push('insufficient-observations');
  }
  if (
    (sample?.auditPasses ?? []).length < 2 ||
    (sample?.auditPasses ?? []).some((pass) => pass !== true)
  ) {
    violations.push('race-audit-failed');
  }
  if ((sample?.observationAnalyses ?? []).some((analysis) => analysis?.pass !== true)) {
    violations.push('visual-invariant-failed');
  }
  if (sample?.repeatability?.pass !== true) {
    violations.push('repeatability-failed');
  }
  if (sample?.error) {
    violations.push('sample-error');
  }
  return { pass: violations.length === 0, violations };
};

const healthyCanary = () => ({
  available: true,
  meshCount: 4,
  vertexCount: 400,
  staticBounds: { width: 2, height: 6, depth: 1.5 },
  untexturedRenderedMaterialCount: 0,
  pendingTextureCount: 0,
  fallbackTextureCount: 0,
  headOrientationRiskCount: 0,
  requestedModelVariation: 'hum',
  loadedModelVariation: 'hum',
  bodyVariantFallback: false,
  secondaryHeadBoneRemapFailureCount: 0,
  nonFiniteBoneMatrixCount: 0,
  animationMotion: {
    available: true,
    expectedMotion: true,
    moving: true,
    frameCount: 4,
    maximumPoseDelta: 0.25,
    nonFiniteValueCount: 0,
  },
  skeletonCount: 1,
  boneCount: 24,
  materialSignature: 'body:texture|head:texture',
  skeletonSignature: 'bi_l|bi_r|he|pe',
  headMeshes: [{
    name: 'head',
    vertexCount: 80,
    influencingBoneNames: ['he'],
    bounds: { center: { x: 0, y: 5.3, z: 0 } },
  }],
  headBonePositions: [{ name: 'he', position: { x: 0, y: 5.3, z: 0 } }],
  runtimeBounds: {
    width: 2,
    height: 6,
    depth: 1.5,
    minimum: { x: -1, y: 0, z: -0.75 },
    maximum: { x: 1, y: 6, z: 0.75 },
  },
  pixels: {
    foregroundPixelCount: 5000,
    whitePixelRatio: 0.01,
    foregroundBounds: { x: 0.3, y: 0.1, width: 0.4, height: 0.8 },
    signature: Array.from({ length: 16 * 16 * 3 }, (_, index) => (index * 17) % 256),
  },
});

export const runVisualInvariantCanaries = () => {
  const healthy = healthyCanary();
  const whiteMaterial = structuredClone(healthy);
  whiteMaterial.untexturedRenderedMaterialCount = 1;
  const exploded = structuredClone(healthy);
  exploded.runtimeBounds.width = 60;
  const changedRepeat = structuredClone(healthy);
  changedRepeat.vertexCount += 1;
  changedRepeat.pixels.signature = changedRepeat.pixels.signature.map((value) => 255 - value);
  const approvedBaseline = createApprovedVisualBaseline(healthy);
  const upsideDown = structuredClone(healthy);
  const rowLength = 16 * 3;
  upsideDown.pixels.signature = Array.from({ length: 16 }, (_, row) =>
    healthy.pixels.signature.slice((15 - row) * rowLength, (16 - row) * rowLength)
  ).flat();
  const motionless = structuredClone(healthy);
  motionless.animationMotion.moving = false;
  motionless.animationMotion.maximumPoseDelta = 0;
  const bodyVariantFallback = structuredClone(healthy);
  bodyVariantFallback.requestedModelVariation = 'hum01';
  bodyVariantFallback.loadedModelVariation = 'hum';
  bodyVariantFallback.bodyVariantFallback = true;
  const secondaryHeadRemapFailure = structuredClone(healthy);
  secondaryHeadRemapFailure.secondaryHeadBoneRemapFailureCount = 1;
  const detachedAnimationDonor = structuredClone(healthy);
  detachedAnimationDonor.previewAnimationDonorExpected = true;
  detachedAnimationDonor.previewAnimationDonorPass = false;
  detachedAnimationDonor.previewAnimationDonorGroupCount = 0;
  detachedAnimationDonor.previewAnimationDonorTargetCount = 0;
  detachedAnimationDonor.previewAnimationDonorBindRelativeTargetCount = 0;
  const unlockedAnimationDonor = structuredClone(healthy);
  unlockedAnimationDonor.previewAnimationDonorExpected = true;
  unlockedAnimationDonor.previewAnimationDonorPass = true;
  unlockedAnimationDonor.previewAnimationDonorGroupCount = 2;
  unlockedAnimationDonor.previewAnimationDonorTargetCount = 20;
  unlockedAnimationDonor.previewAnimationDonorBindRelativeTargetCount = 20;
  unlockedAnimationDonor.previewAnimationDonorBindLockedRotationTargetNames = [];
  const idleAnimationDonor = structuredClone(healthy);
  idleAnimationDonor.previewAnimationDonorExpected = true;
  idleAnimationDonor.previewAnimationDonorPass = true;
  idleAnimationDonor.previewAnimationDonorGroupCount = 2;
  idleAnimationDonor.previewAnimationDonorTargetCount = 20;
  idleAnimationDonor.previewAnimationDonorBindRelativeTargetCount = 20;
  idleAnimationDonor.previewAnimationDonorBindLockedRotationTargetNames = ['he'];
  idleAnimationDonor.animationMotion = {
    available: false,
    expectedMotion: false,
    moving: false,
    frameCount: 0,
    maximumPoseDelta: 0,
    nonFiniteValueCount: 0,
  };
  const misboundHead = structuredClone(healthy);
  misboundHead.headMeshes[0].vertexCount = 12;
  misboundHead.headMeshes[0].influencingBoneNames = ['ca_r', 'fo_r'];
  misboundHead.headMeshes[0].bounds.center.y = 2;
  const coordinateAxisRemap = structuredClone(healthy);
  coordinateAxisRemap.staticBounds = { width: 6, height: 1.5, depth: 2 };

  const cases = [
    {
      name: 'white-material',
      rejected: !evaluatePreviewEvidence(whiteMaterial).pass,
    },
    {
      name: 'exploded-bounds',
      rejected: !evaluatePreviewEvidence(exploded).pass,
    },
    {
      name: 'nondeterministic-repeat',
      rejected: !comparePreviewEvidence([healthy, changedRepeat]).pass,
    },
    {
      name: 'approved-baseline-orientation-drift',
      rejected: !compareApprovedVisualBaseline(upsideDown, approvedBaseline).pass,
    },
    {
      name: 'motionless-animation',
      rejected: !evaluatePreviewEvidence(motionless).pass,
    },
    {
      name: 'body-variant-fallback',
      rejected: !evaluatePreviewEvidence(bodyVariantFallback).pass,
    },
    {
      name: 'secondary-head-remap-failure',
      rejected: !evaluatePreviewEvidence(secondaryHeadRemapFailure).pass,
    },
    {
      name: 'detached-animation-donor',
      rejected: !evaluatePreviewEvidence(detachedAnimationDonor).pass,
    },
    {
      name: 'unlocked-animation-donor-head',
      rejected: !evaluatePreviewEvidence(unlockedAnimationDonor).pass,
    },
    {
      name: 'attached-animation-donor-not-playing',
      rejected: !evaluatePreviewEvidence(idleAnimationDonor).pass,
    },
    {
      name: 'misbound-head-geometry',
      rejected: !evaluatePreviewEvidence(misboundHead).pass,
    },
  ];
  const acceptedCases = [
    {
      name: 'coordinate-axis-remap',
      accepted: evaluatePreviewEvidence(coordinateAxisRemap).pass,
    },
  ];
  return {
    pass:
      cases.every((entry) => entry.rejected) &&
      acceptedCases.every((entry) => entry.accepted),
    cases,
    acceptedCases,
  };
};
