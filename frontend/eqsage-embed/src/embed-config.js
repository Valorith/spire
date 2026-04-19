const globalObject = typeof window !== 'undefined' ? window : globalThis;

const defaultConfig = {
  assetBase   : '/eqsage-embed',
  embeddedMode: true,
};

let embedConfig = {
  ...defaultConfig,
  ...(globalObject.__SPIRE_EQSAGE_EMBED_CONFIG__ ?? {}),
};

export const setEmbedConfig = (nextConfig = {}) => {
  embedConfig = {
    ...embedConfig,
    ...nextConfig,
  };
  globalObject.__SPIRE_EQSAGE_EMBED_CONFIG__ = embedConfig;
  return embedConfig;
};

export const getEmbedConfig = () => embedConfig;

export const assetUrl = (assetPath = '') => {
  const normalizedBase = (embedConfig.assetBase || defaultConfig.assetBase).replace(/\/+$/, '');
  const normalizedPath = `${assetPath}`.replace(/^\/+/, '');
  return normalizedPath ? `${normalizedBase}/${normalizedPath}` : normalizedBase;
};
