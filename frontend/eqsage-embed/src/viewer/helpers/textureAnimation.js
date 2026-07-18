const absoluteTextureUrlPattern = /^(?:blob:|data:|https?:\/\/|\/)/i;

export const getMaterialBaseColorTexture = (material) =>
  material?.albedoTexture ??
  material?.diffuseTexture ??
  material?.getActiveTextures?.()[0] ??
  null;

export const resolveTextureAnimationFrameUrl = (baseTexture, frameName) => {
  const frame = `${frameName ?? ''}`.trim();
  if (!frame || absoluteTextureUrlPattern.test(frame)) {
    return frame;
  }

  const baseUrl = `${baseTexture?.url ?? baseTexture?.name ?? ''}`
    .split(/[?#]/, 1)[0]
    .replaceAll('\\', '/');
  const slashIndex = baseUrl.lastIndexOf('/');
  if (slashIndex >= 0 && !/^(?:blob:|data:)/i.test(baseUrl)) {
    return `${baseUrl.slice(0, slashIndex + 1)}${frame}`;
  }

  return `/eq/textures/${frame}`;
};

export const isTextureAnimationFrameReady = (texture) => {
  if (!texture) {
    return false;
  }
  if (typeof texture.isReady === 'function' && !texture.isReady()) {
    return false;
  }

  const internalTexture = texture.getInternalTexture?.() ?? texture._texture;
  return Boolean(
    internalTexture &&
    (internalTexture.isReady === undefined || internalTexture.isReady === true)
  );
};

export const applyTextureAnimationFrame = (targetTexture, frameTexture) => {
  if (!targetTexture || !isTextureAnimationFrameReady(frameTexture)) {
    return false;
  }

  const internalTexture =
    frameTexture.getInternalTexture?.() ?? frameTexture._texture;
  targetTexture._texture = internalTexture;
  return true;
};
