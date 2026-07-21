import { getCharacterHeadOrientationPolicy } from 'sage-core/util/character-texture-orientation';
import {
  evaluateCharacterAnimationReadiness,
  inspectAnimationSetVitality,
  isStaticPoseOnlyCharacterModel,
} from '../../viewer/helpers/animationValidation';
import {
  evaluateAppearanceVariant,
  evaluateSemanticHeadOrientation,
  getSemanticHeadOrientationPolicy,
  inspectHeadTextureOrientation,
  isKnownEffectOnlyCharacterModel,
} from '../../viewer/helpers/appearanceValidation';
import raceAppearancePolicies from '../../viewer/common/raceAppearancePolicies.json';

const HEAD_MATERIAL_PATTERN = /^[a-z0-9]{3}he(?:\d{2}|sk)\d{2}$/i;
const REQUIRED_HEAD_MODELS = new Set(
  raceAppearancePolicies.requiredHeadModels ?? []
);

const getTexture = (material) =>
  material?.albedoTexture ??
  material?._albedoTexture ??
  material?.diffuseTexture ??
  material?._diffuseTexture ??
  material?.emissiveTexture ??
  material?._emissiveTexture ??
  null;

const getMaterialSlots = (materials = []) => {
  const slots = [];
  const seen = new Set();
  for (const material of materials.filter(Boolean)) {
    const candidates = Array.isArray(material?.subMaterials)
      ? material.subMaterials.filter(Boolean)
      : [material];
    for (const candidate of candidates) {
      const key = candidate.uniqueId ?? candidate.name ?? candidate;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      slots.push(candidate);
    }
  }
  return slots;
};

export const getReviewMeshes = (rootNode) => [
  rootNode,
  ...(rootNode?.getChildMeshes?.(false) ?? []),
].filter(
  (mesh) =>
    typeof mesh?.getTotalVertices === 'function' &&
    mesh.getTotalVertices() > 0 &&
    mesh.isEnabled?.() !== false &&
    mesh.isVisible !== false &&
    mesh.visibility !== 0
);

export const getReviewBounds = (rootNode, { headOnly = false } = {}) => {
  const meshes = getReviewMeshes(rootNode).filter((mesh) => {
    if (!headOnly) {
      return true;
    }
    return getMaterialSlots([mesh.material]).some((material) =>
      HEAD_MATERIAL_PATTERN.test(`${material?.name ?? ''}`)
    );
  });
  const minimum = { x: Infinity, y: Infinity, z: Infinity };
  const maximum = { x: -Infinity, y: -Infinity, z: -Infinity };

  for (const mesh of meshes) {
    try {
      mesh.computeWorldMatrix?.(true);
      mesh.refreshBoundingInfo?.(true, true);
      const bounds = mesh.getBoundingInfo?.()?.boundingBox;
      if (!bounds?.minimumWorld || !bounds?.maximumWorld) {
        continue;
      }
      for (const axis of ['x', 'y', 'z']) {
        minimum[axis] = Math.min(minimum[axis], Number(bounds.minimumWorld[axis]));
        maximum[axis] = Math.max(maximum[axis], Number(bounds.maximumWorld[axis]));
      }
    } catch (_error) {}
  }

  if (![...Object.values(minimum), ...Object.values(maximum)].every(Number.isFinite)) {
    return null;
  }

  return {
    minimum,
    maximum,
    width: maximum.x - minimum.x,
    height: maximum.y - minimum.y,
    depth: maximum.z - minimum.z,
  };
};

const getMaterialMeshCenterY = (meshes, materialNames) => {
  const normalizedNames = new Set(
    (Array.isArray(materialNames) ? materialNames : [materialNames])
      .map((name) => `${name ?? ''}`.trim().toLowerCase())
      .filter(Boolean)
  );
  const matchingMeshes = meshes.filter((mesh) =>
    getMaterialSlots([mesh.material]).some(
      (material) => normalizedNames.has(
        `${material?.name ?? ''}`.trim().toLowerCase()
      )
    )
  );
  const minimumValues = [];
  const maximumValues = [];
  for (const mesh of matchingMeshes) {
    try {
      mesh.computeWorldMatrix?.(true);
      mesh.refreshBoundingInfo?.(true, true);
      const bounds = mesh.getBoundingInfo?.()?.boundingBox;
      if (
        Number.isFinite(Number(bounds?.minimumWorld?.y)) &&
        Number.isFinite(Number(bounds?.maximumWorld?.y))
      ) {
        minimumValues.push(Number(bounds.minimumWorld.y));
        maximumValues.push(Number(bounds.maximumWorld.y));
      }
    } catch (_error) {}
  }
  return minimumValues.length > 0
    ? (Math.min(...minimumValues) + Math.max(...maximumValues)) / 2
    : null;
};

const isTextureReady = (texture) => {
  if (!texture) return false;
  if (typeof texture.isReady === 'function') return texture.isReady();
  if (typeof texture.isReady === 'boolean') return texture.isReady;
  return texture?._texture?.isReady !== false;
};

const getTextureSize = (texture) => {
  const size = texture?.getSize?.() ?? {};
  const internal = texture?.getInternalTexture?.() ?? texture?._texture;
  return {
    width: Number(size.width ?? internal?.width),
    height: Number(size.height ?? internal?.height),
  };
};

const countNonFiniteBoneMatrices = (spawn) =>
  (spawn?.instanceContainer?.skeletons ?? [])
    .flatMap((skeleton) => skeleton?.bones ?? [])
    .filter((bone) => {
      const matrix = bone?.getFinalMatrix?.();
      const values = matrix?.toArray?.() ?? matrix?.m ?? [];
      return values.length > 0 && values.some((value) => !Number.isFinite(value));
    }).length;

export const inspectModelReviewSpawn = (spawn) => {
  const meshes = getReviewMeshes(spawn?.rootNode);
  const bounds = getReviewBounds(spawn?.rootNode);
  const materials = getMaterialSlots(meshes.map((mesh) => mesh.material));
  const ordinaryMaterials = materials.filter(
    (material) =>
      material?.metadata?.boundary !== true &&
      material?.metadata?.gltf?.extras?.boundary !== true &&
      material?.metadata?.extras?.boundary !== true
  );
  const textures = ordinaryMaterials.map(getTexture).filter(Boolean);
  const headMaterials = materials.filter((material) =>
    HEAD_MATERIAL_PATTERN.test(`${material?.name ?? ''}`)
  );
  const headTextureSignatures = headMaterials
    .map((material) => {
      const texture = getTexture(material);
      return `${material?.name ?? ''}:${texture?.name ?? texture?.url ?? ''}`;
    })
    .filter(Boolean)
    .sort();
  const headOrientation = headMaterials.map((material) =>
    inspectHeadTextureOrientation(
      material,
      getCharacterHeadOrientationPolicy(material?.name)
    )
  );
  const nonFiniteBoneMatrixCount = countNonFiniteBoneMatrices(spawn);
  const resolvedModel = `${
    spawn?.resolvedModelAsset ?? spawn?.loadedModelVariation ?? spawn?.modelName ?? ''
  }`.trim().slice(0, 3).toLowerCase();
  const appearance = evaluateAppearanceVariant({
    renderPass: meshes.length > 0,
    materialSlotCount: materials.length,
    effectOnlyMaterialCount: materials.length - ordinaryMaterials.length,
    texturedSlotCount: ordinaryMaterials.filter((material) => !!getTexture(material)).length,
    pendingTextureCount: ordinaryMaterials.filter((material) =>
      material?.metadata?.spireAppearanceTexturePending === true ||
      (
        material?.metadata?.spireAppearanceTexturePending !== false &&
        !!getTexture(material) &&
        !isTextureReady(getTexture(material))
      )
    ).length,
    suspiciousTinyTextureCount: ordinaryMaterials.filter((material) => {
      if (
        material?.metadata?.transparentTextureSentinel !== true ||
        material?.metadata?.transparentTextureSentinelSuppressed === true
      ) {
        return false;
      }
      const { width, height } = getTextureSize(getTexture(material));
      return Number.isFinite(width) && Number.isFinite(height) && width <= 1 && height <= 1;
    }).length,
    headOrientationRiskCount: headOrientation.filter((item) => item.risk).length,
    headMaterials: headMaterials.map((material) => material?.name).filter(Boolean).sort(),
    headTextureSignatures,
    nonFiniteBoneMatrixCount,
  }, {
    requireHeadTexture: REQUIRED_HEAD_MODELS.has(resolvedModel),
  });
  const animationVitality = inspectAnimationSetVitality(spawn?.animationGroups ?? []);
  const skeletonCount = spawn?.instanceContainer?.skeletons?.length ??
    (spawn?.rootNode?.skeleton ? 1 : 0);
  const staticPoseFallbackAvailable =
    spawn?.nativePoseOnly === true ||
    isStaticPoseOnlyCharacterModel(
      spawn?.modelName,
      spawn?.loadedModelVariation,
      spawn?.resolvedModelAsset
    );
  const animationReadiness = evaluateCharacterAnimationReadiness({
    skeletonCount,
    animationVitality,
    staticPoseFallbackAvailable,
  });
  const effectOnly = isKnownEffectOnlyCharacterModel(
    spawn?.resolvedModelAsset ?? spawn?.modelName
  );
  const semanticHeadPolicy = getSemanticHeadOrientationPolicy(spawn?.modelName);
  const semanticHeadOrientation = evaluateSemanticHeadOrientation({
    policy: semanticHeadPolicy,
    upperCenterY: getMaterialMeshCenterY(
      meshes,
      semanticHeadPolicy?.upperMaterials
    ),
    lowerCenterY: getMaterialMeshCenterY(
      meshes,
      semanticHeadPolicy?.lowerMaterials
    ),
    modelHeight: bounds?.height,
  });
  const orientationPass =
    headOrientation.every((item) => !item.risk) &&
    semanticHeadOrientation.pass;
  const animationPass =
    effectOnly ||
    (
      animationReadiness.pass &&
      Number(spawn?.animationRetargeting?.unresolvedTargetCount ?? 0) === 0
    );
  const requestedModel = `${spawn?.modelName ?? ''}`.trim().toLowerCase();
  const resolutionKind =
    resolvedModel && resolvedModel !== requestedModel.slice(0, 3)
      ? 'fallback'
      : 'exact';
  const incompatibleFallbackHeadAttached =
    resolutionKind === 'fallback' &&
    spawn?.hasAttachedSecondaryHead === true;

  return {
    appearance,
    animationReadiness,
    animationVitality,
    animationPass,
    bounds,
    compactNativeArmNeutralized:
      spawn?.compactNativeArmNeutralized === true,
    effectOnly,
    loadPass: true,
    headOrientation,
    materialCount: materials.length,
    meshCount: meshes.length,
    orientationPass,
    semanticHeadOrientation,
    nativePoseOnly: spawn?.nativePoseOnly === true,
    resolvedModel,
    requestedModel,
    resolutionKind,
    animationRetargeting: spawn?.animationRetargeting ?? null,
    secondaryHead: {
      attached: spawn?.hasAttachedSecondaryHead === true,
      remapFailureCount: Number(spawn?.secondaryHeadBoneRemapFailureCount ?? 0),
      remapFailures: spawn?.secondaryHeadBoneRemapFailures ?? [],
      required: REQUIRED_HEAD_MODELS.has(resolvedModel),
      incompatibleWithFallback: incompatibleFallbackHeadAttached,
    },
    pass:
      appearance.invariantPass &&
      orientationPass &&
      animationPass &&
      !incompatibleFallbackHeadAttached,
    skeletonCount,
    textureCount: textures.length,
  };
};

export const createModelLoadFailureDiagnostics = (error) => ({
  appearance: evaluateAppearanceVariant({
    renderPass: false,
    materialSlotCount: 0,
    effectOnlyMaterialCount: 0,
    texturedSlotCount: 0,
    pendingTextureCount: 0,
    suspiciousTinyTextureCount: 0,
    headOrientationRiskCount: 0,
    nonFiniteBoneMatrixCount: 0,
  }),
  animationPass: false,
  animationReadiness: {
    pass: false,
    violations: ['model-load-failed'],
  },
  animationVitality: {
    playableGroupCount: 0,
    dynamicGroupCount: 0,
    visuallyPosedGroupCount: 0,
  },
  bounds: null,
  effectOnly: false,
  error: error?.message ?? String(error),
  headOrientation: [],
  loadPass: false,
  materialCount: 0,
  meshCount: 0,
  orientationPass: false,
  pass: false,
  semanticHeadOrientation: {
    required: false,
    measurable: false,
    pass: true,
  },
  skeletonCount: 0,
  textureCount: 0,
});

export const getAutomatedReviewSuggestion = (
  diagnostics,
  animationSafety = null
) => {
  if (!diagnostics) return null;
  const appearanceViolations = diagnostics.appearance?.invariantViolations ?? [];
  const animationViolations = diagnostics.animationReadiness?.violations ?? [];
  if (
    diagnostics.loadPass === false ||
    appearanceViolations.includes('render-failed') ||
    Number(diagnostics.meshCount ?? 0) === 0
  ) {
    return { response: 'nothing-visible', reasons: ['model-load-or-render-failed'] };
  }
  if (appearanceViolations.includes('missing-head-texture')) {
    return { response: 'head-missing', reasons: ['missing-required-head'] };
  }
  if (diagnostics.secondaryHead?.incompatibleWithFallback === true) {
    return {
      response: 'model-distorted',
      reasons: ['incompatible-fallback-head-attached'],
    };
  }
  if (diagnostics.orientationPass === false) {
    return { response: 'head-mesh-upside-down', reasons: ['head-orientation-failed'] };
  }
  if (
    animationSafety?.pass === false ||
    Number(diagnostics.animationRetargeting?.unresolvedTargetCount ?? 0) > 0
  ) {
    return { response: 'improper-animation', reasons: ['unsafe-or-unresolved-animation'] };
  }
  if (animationViolations.includes('missing-playable-animation')) {
    return { response: 'no-animation', reasons: ['missing-playable-animation'] };
  }
  if (animationViolations.includes('animation-matches-bind-pose')) {
    return { response: 't-pose', reasons: ['animation-matches-bind-pose'] };
  }
  if (
    appearanceViolations.includes('invalid-bone-matrix') ||
    diagnostics.appearance?.invariantPass === false
  ) {
    return { response: 'model-distorted', reasons: appearanceViolations };
  }
  return diagnostics.pass === false
    ? { response: 'other', reasons: ['automatic-qa-failed'] }
    : null;
};
