import { assetUrl } from './embed-config';

const trimLeadingSlash = (value = '') => `${value}`.replace(/^\/+/, '');

export const staticAssetUrl = (assetPath = '') =>
  assetUrl(`static/${trimLeadingSlash(assetPath)}`);

export const locateStaticAsset = (fileName) => staticAssetUrl(fileName);
