export const CHARACTER_HEAD_TEXTURE_PATTERN =
  /^[a-z0-9]{3}(?:he(?:\d{2}|sk)\d{2}|fa\d{4})$/i;

export const normalizeCharacterMaterialName = (materialName) =>
  `${materialName ?? ''}`.split(/_mdf/i)[0].toLowerCase();

// DDS decoding flips image pixels vertically before they are cached as PNG.
// Most discrete heads therefore need the same geometry V correction as other
// skinned meshes. These observed integrated HE00 heads already address the
// cached image correctly. Runtime face swaps use HESK/FA materials on that same
// geometry, while separately loaded HE01+ helm/head meshes retain the normal
// flipped policy.
export const CHARACTER_HEAD_NATIVE_UV_MODELS = new Set([
  'brf',
  'brm',
  'fef',
  'gff',
  'qcf',
  'shf',
]);
const CHARACTER_HEAD_NATIVE_UV_MATERIAL_PATTERN =
  /^[a-z0-9]{3}(?:he(?:00|sk)\d{2}|fa\d{4})$/i;

export const getCharacterHeadOrientationPolicy = (materialName) => {
  const normalizedName = normalizeCharacterMaterialName(materialName);
  const isCharacterHead = CHARACTER_HEAD_TEXTURE_PATTERN.test(normalizedName);
  const modelName = normalizedName.slice(0, 3);
  const usesNativeHeadUv =
    isCharacterHead && (
      CHARACTER_HEAD_NATIVE_UV_MODELS.has(modelName) &&
      CHARACTER_HEAD_NATIVE_UV_MATERIAL_PATTERN.test(normalizedName)
    );

  return {
    isCharacterHead,
    modelName,
    usesNativeHeadUv,
    geometryUvFlipped: isCharacterHead && !usesNativeHeadUv,
    runtimeTextureVFlipped: false,
  };
};
