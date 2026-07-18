const toCount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getMaterialTexture = (material) =>
  material?.albedoTexture ??
  material?._albedoTexture ??
  material?.diffuseTexture ??
  material?._diffuseTexture ??
  material?.emissiveTexture ??
  material?._emissiveTexture ??
  null;

export const inspectHeadTextureOrientation = (
  material,
  orientationPolicy
) => {
  const texture = getMaterialTexture(material);
  const requestedInvertY = texture?._texture?._spireSageRequestedInvertY;
  const uploadInvertY = texture?._texture?._spireSageUploadInvertY;
  const uploadOrientationMismatch =
    typeof requestedInvertY === 'boolean' &&
    typeof uploadInvertY === 'boolean' &&
    requestedInvertY !== uploadInvertY;
  const geometryUvFlipped =
    material?.metadata?.gltf?.extras?.spireSkinnedVFlipped === true ||
    material?.metadata?.extras?.spireSkinnedVFlipped === true ||
    material?.metadata?.spireSkinnedVFlipped === true;
  const expectsGeometryUvFlip = orientationPolicy?.geometryUvFlipped === true;
  const expectsRuntimeTextureVFlip =
    orientationPolicy?.runtimeTextureVFlipped === true;
  const runtimeTextureVFlipped = Number(texture?.vScale ?? 1) < 0;
  const expectedEffectiveVFlip =
    expectsGeometryUvFlip !== expectsRuntimeTextureVFlip;
  const effectiveVFlip = geometryUvFlipped !== runtimeTextureVFlipped;

  return {
    material: material?.name ?? '',
    texture: texture?.name ?? texture?.url ?? '',
    requestedInvertY,
    uploadInvertY,
    vOffset: texture?.vOffset,
    vScale: texture?.vScale,
    geometryUvFlipped,
    runtimeTextureVFlipped,
    expectsGeometryUvFlip,
    expectsRuntimeTextureVFlip,
    effectiveVFlip,
    expectedEffectiveVFlip,
    uploadOrientationMismatch,
    risk:
      effectiveVFlip !== expectedEffectiveVFlip || uploadOrientationMismatch,
  };
};

// These race entries are particles/boundaries rather than visible character
// bodies in the shipped client art. Keep the list deliberately narrow so a
// newly invisible NPC cannot pass merely because every material is marked as
// an effect or boundary.
export const KNOWN_EFFECT_ONLY_CHARACTER_MODELS = new Set([
  'gsm',
  'gsf',
  'gsn',
]);

export const isKnownEffectOnlyCharacterModel = (modelName) =>
  KNOWN_EFFECT_ONLY_CHARACTER_MODELS.has(
    `${modelName ?? ''}`.trim().slice(0, 3).toLowerCase()
  );

// Character materials encode the appearance version in a four-character
// suffix (for example HUMCH0001 or HUFUAsk01). Object materials such as
// ERBEDSIDE can also be attached to race-coded spawns, but their trailing
// letters are semantic names and must never be rewritten as appearance slots.
export const isCharacterAppearanceMaterialName = (materialName) =>
  /^[a-z0-9]{3,}(?:\d{4}|sk\d{2})$/i.test(`${materialName ?? ''}`);

export const evaluateAppearanceVariant = (
  appearance,
  { requireHeadTexture = false } = {}
) => {
  const violations = [];
  const materialSlotCount = toCount(appearance?.materialSlotCount);
  const effectOnlyMaterialCount = toCount(appearance?.effectOnlyMaterialCount);
  const texturedSlotCount = toCount(appearance?.texturedSlotCount);
  const ordinaryMaterialCount = Math.max(
    0,
    materialSlotCount - effectOnlyMaterialCount
  );
  const untexturedRenderedMaterialCount = Math.max(
    toCount(appearance?.untexturedRenderedMaterialCount),
    ordinaryMaterialCount - texturedSlotCount
  );

  if (appearance?.renderPass !== true) violations.push('render-failed');
  if (materialSlotCount === 0) violations.push('missing-rendered-materials');
  if (untexturedRenderedMaterialCount > 0) {
    violations.push('untextured-rendered-material');
  }
  if (toCount(appearance?.pendingTextureCount) > 0) {
    violations.push('texture-pending');
  }
  if (toCount(appearance?.suspiciousTinyTextureCount) > 0) {
    violations.push('transparent-texture-fallback');
  }
  if (toCount(appearance?.headOrientationRiskCount) > 0) {
    violations.push('head-texture-orientation');
  }
  if (toCount(appearance?.nonFiniteBoneMatrixCount) > 0) {
    violations.push('invalid-bone-matrix');
  }
  if (
    ordinaryMaterialCount > 0 &&
    texturedSlotCount === 0
  ) {
    violations.push('untextured-model');
  }
  if (
    requireHeadTexture &&
    (appearance?.headTextureSignatures?.length ?? 0) === 0
  ) {
    violations.push('missing-head-texture');
  }

  return {
    ...appearance,
    ordinaryMaterialCount,
    untexturedRenderedMaterialCount,
    invariantViolations: [...new Set(violations)],
    invariantPass: violations.length === 0,
  };
};

export const evaluateFaceVariantDeterminism = (
  faceVariants = [],
  { expectedVariantCount = 8 } = {}
) => {
  const signatures = faceVariants.map((variant) =>
    (variant.headTextureSignatures ?? []).join('|')
  );
  const nonEmptySignatures = signatures.filter(Boolean);
  const uniqueSignatures = [...new Set(nonEmptySignatures)];
  const duplicateSignatures = [...new Set(
    nonEmptySignatures.filter(
      (signature, index) => nonEmptySignatures.indexOf(signature) !== index
    )
  )];
  const violations = [];

  if (faceVariants.length !== expectedVariantCount) {
    violations.push('face-variant-count-mismatch');
  }
  if (nonEmptySignatures.length !== faceVariants.length) {
    violations.push('face-variant-texture-missing');
  }
  if (uniqueSignatures.length !== faceVariants.length) {
    violations.push('face-variant-texture-duplicate');
  }

  return {
    expectedVariantCount,
    observedVariantCount: faceVariants.length,
    uniqueSignatureCount: uniqueSignatures.length,
    signatures,
    duplicateSignatures,
    violations,
    pass: violations.length === 0,
  };
};
