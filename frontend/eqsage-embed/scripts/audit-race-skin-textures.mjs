import fs from 'node:fs/promises';
import path from 'node:path';
import Jimp from 'jimp';

const CHARACTER_TEXTURE_PATTERN =
  /^(?<model>[a-z0-9]{3})(?<part>[a-z]{2})(?<version>\d{2})(?<slot>\d{2})\.png$/i;
const DEFAULT_EQ_DIRECTORIES = ['C:/EQEmuCW-Live'];
const MAX_CONCURRENCY = 16;

const getArgument = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
};

const pathExists = async (candidate) =>
  fs.access(candidate).then(() => true).catch(() => false);

const resolveEqDirectory = async () => {
  const candidates = [
    getArgument('--eq-dir'),
    process.env.SAGE_EQ_DIR,
    ...DEFAULT_EQ_DIRECTORIES,
  ].filter(Boolean);
  for (const candidate of candidates) {
    const absolute = path.resolve(candidate);
    if (await pathExists(path.join(absolute, 'eqsage', 'textures'))) {
      return absolute;
    }
  }
  throw new Error(
    'No EQ directory with eqsage/textures was found. Pass --eq-dir <path>.'
  );
};

const runPool = async (items, worker, concurrency = MAX_CONCURRENCY) => {
  const results = new Array(items.length);
  let nextIndex = 0;
  const runners = Array.from(
    { length: Math.min(concurrency, Math.max(items.length, 1)) },
    async () => {
      while (nextIndex < items.length) {
        const index = nextIndex++;
        results[index] = await worker(items[index], index);
      }
    }
  );
  await Promise.all(runners);
  return results;
};

const isFullyTransparent = (bitmap) => {
  for (let index = 3; index < bitmap.data.length; index += 4) {
    if (bitmap.data[index] !== 0) {
      return false;
    }
  }
  return true;
};

const main = async () => {
  const eqDirectory = await resolveEqDirectory();
  const textureDirectory = path.join(eqDirectory, 'eqsage', 'textures');
  const modelDirectory = path.join(eqDirectory, 'eqsage', 'models');
  const raceDataPath = new URL(
    '../src/viewer/common/raceData.json',
    import.meta.url
  );
  const raceData = JSON.parse(await fs.readFile(raceDataPath, 'utf8'));
  const mappedModels = new Set(
    raceData.flatMap((race) => [race['0'], race['1'], race['2']])
      .map((model) => `${model ?? ''}`.trim().toLowerCase())
      .filter(Boolean)
  );

  const textureNames = await fs.readdir(textureDirectory);
  const textureFiles = new Map(
    textureNames
      .filter((name) => /\.png$/i.test(name))
      .map((name) => [name.toLowerCase(), path.join(textureDirectory, name)])
  );
  const candidateNames = [...textureFiles.keys()].filter((name) => {
    const match = name.match(CHARACTER_TEXTURE_PATTERN);
    return match && mappedModels.has(match.groups.model.toLowerCase());
  });

  const decodeCache = new Map();
  const decode = (name) => {
    if (!decodeCache.has(name)) {
      decodeCache.set(
        name,
        Jimp.read(textureFiles.get(name)).then((image) => ({
          width: image.bitmap.width,
          height: image.bitmap.height,
          fullyTransparent: isFullyTransparent(image.bitmap),
        }))
      );
    }
    return decodeCache.get(name);
  };

  const decodedCandidates = await runPool(candidateNames, async (name) => ({
    name,
    ...(await decode(name)),
  }));
  const transparentCandidates = decodedCandidates.filter(
    (entry) => entry.fullyTransparent
  );
  const classifications = await runPool(transparentCandidates, async (entry) => {
    const match = entry.name.match(CHARACTER_TEXTURE_PATTERN);
    const { model, part, slot } = match.groups;
    const prefix = `${model}${part}`.toLowerCase();
    const fallbackNames = [`${prefix}sk${slot}.png`, `${prefix}00${slot}.png`]
      .filter((name) => name !== entry.name && textureFiles.has(name));
    const fallbacks = await Promise.all(
      fallbackNames.map(async (name) => ({ name, ...(await decode(name)) }))
    );
    const opaqueFallback = fallbacks.find((fallback) => !fallback.fullyTransparent);
    return {
      ...entry,
      model: model.toLowerCase(),
      part: part.toLowerCase(),
      slot,
      strategy: opaqueFallback ? 'same-uv-skin-fallback' : 'suppress-invisible-layer',
      fallback: opaqueFallback?.name ?? null,
    };
  });

  const availableModels = new Set(
    (await fs.readdir(modelDirectory))
      .filter((name) => /\.glb$/i.test(name))
      .map((name) => path.parse(name).name.toLowerCase())
  );
  const affectedModels = [...new Set(classifications.map((entry) => entry.model))]
    .sort();
  const affectedMissingModels = affectedModels.filter(
    (model) => !availableModels.has(model)
  );
  const fallbackCount = classifications.filter(
    (entry) => entry.strategy === 'same-uv-skin-fallback'
  ).length;
  const suppressedCount = classifications.length - fallbackCount;
  const report = {
    eqDirectory,
    mappedRaceModelCount: mappedModels.size,
    mappedAvailableModelCount: [...mappedModels].filter((model) =>
      availableModels.has(model)
    ).length,
    pngTextureCount: textureFiles.size,
    numericCharacterTextureCount: candidateNames.length,
    fullyTransparentNumericTextureCount: classifications.length,
    sameUvSkinFallbackCount: fallbackCount,
    suppressInvisibleLayerCount: suppressedCount,
    affectedModelCount: affectedModels.length,
    affectedAvailableModelCount:
      affectedModels.length - affectedMissingModels.length,
    affectedMissingModelCount: affectedMissingModels.length,
    affectedMissingModels,
    affectedModels,
    modelsUsingSameUvFallback: [...new Set(
      classifications
        .filter((entry) => entry.strategy === 'same-uv-skin-fallback')
        .map((entry) => entry.model)
    )].sort(),
    modelsUsingInvisibleSuppression: [...new Set(
      classifications
        .filter((entry) => entry.strategy === 'suppress-invisible-layer')
        .map((entry) => entry.model)
    )].sort(),
  };

  const outputPath = getArgument('--output');
  if (outputPath) {
    const absoluteOutput = path.resolve(outputPath);
    await fs.mkdir(path.dirname(absoluteOutput), { recursive: true });
    await fs.writeFile(
      absoluteOutput,
      JSON.stringify({ ...report, classifications }, null, 2)
    );
  }
  console.log(JSON.stringify(report, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
