import { getCharacterHeadOrientationPolicy } from 'sage-core/util/character-texture-orientation';
import {
  evaluateCharacterAnimationReadiness,
  inspectAnimationSetVitality,
  isStaticPoseOnlyCharacterModel,
} from '../../viewer/helpers/animationValidation';
import {
  evaluateAppearanceVariant,
  inspectHeadTextureOrientation,
  isKnownEffectOnlyCharacterModel,
} from '../../viewer/helpers/appearanceValidation';

const HEAD_MATERIAL_PATTERN = /^[a-z0-9]{3}he(?:\d{2}|sk)\d{2}$/i;

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
  const headOrientation = headMaterials.map((material) =>
    inspectHeadTextureOrientation(
      material,
      getCharacterHeadOrientationPolicy(material?.name)
    )
  );
  const nonFiniteBoneMatrixCount = countNonFiniteBoneMatrices(spawn);
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
    nonFiniteBoneMatrixCount,
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
  const orientationPass = headOrientation.every((item) => !item.risk);
  const animationPass =
    effectOnly ||
    (
      animationReadiness.pass &&
      Number(spawn?.animationRetargeting?.unresolvedTargetCount ?? 0) === 0
    );

  return {
    appearance,
    animationReadiness,
    animationVitality,
    animationPass,
    bounds: getReviewBounds(spawn?.rootNode),
    compactNativeArmNeutralized:
      spawn?.compactNativeArmNeutralized === true,
    effectOnly,
    headOrientation,
    materialCount: materials.length,
    meshCount: meshes.length,
    orientationPass,
    nativePoseOnly: spawn?.nativePoseOnly === true,
    pass: appearance.invariantPass && orientationPass && animationPass,
    skeletonCount,
    textureCount: textures.length,
  };
};
