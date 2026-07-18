import fs from 'node:fs/promises';
import path from 'node:path';

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

const rangeCount = (minimum, maximum) => {
  const min = Number(minimum ?? 0);
  const max = Number(maximum ?? 0);
  return Number.isFinite(min) && Number.isFinite(max) && max >= min ? max - min + 1 : 1;
};

const normalizeModel = (value) => `${value ?? ''}`.trim().toLowerCase();

export const buildCoverageManifest = async ({ repoRoot, eqDirectory }) => {
  const commonRoot = path.join(
    repoRoot,
    'frontend',
    'eqsage-embed',
    'src',
    'viewer',
    'common'
  );
  const [raceData, modelMetadata, appearancePolicies, inventory] = await Promise.all([
    readJson(path.join(commonRoot, 'raceData.json')),
    readJson(path.join(commonRoot, 'raceModelMetadata.json')),
    readJson(path.join(commonRoot, 'raceAppearancePolicies.json')),
    readJson(path.join(repoRoot, 'internal', 'http', 'staticmaps', 'race-inventory-map.json')),
  ]);

  const availableFileNames = await fs.readdir(path.join(eqDirectory, 'eqsage', 'models'));
  const availableModels = new Set(
    availableFileNames
      .filter((name) => /\.glb$/i.test(name))
      .map((name) => path.parse(name).name.toLowerCase())
      .filter(Boolean)
  );
  const classicFaceModels = new Set(appearancePolicies.classicFaceModels ?? []);
  const inventoryByRace = new Map(
    (inventory.races ?? []).map((race) => [Number(race.race_id), race])
  );
  const models = new Map();

  for (const race of raceData) {
    const inventoryRace = inventoryByRace.get(Number(race.id));
    for (const [genderKey, gender] of [['0', 'male'], ['1', 'female'], ['2', 'neutral']]) {
      const model = normalizeModel(race[genderKey]);
      if (!model) continue;
      if (!models.has(model)) {
        const metadata = modelMetadata[model] ?? {};
        const faceVariantCount = classicFaceModels.has(model) ? 8 : 1;
        const textureVariantCount = rangeCount(metadata.minTexture, metadata.maxTexture);
        const helmVariantCount = rangeCount(metadata.minHelmTexture, metadata.maxHelmTexture);
        models.set(model, {
          model,
          available: availableModels.has(model),
          classicFaces: classicFaceModels.has(model),
          faceVariantCount,
          textureVariantCount,
          helmVariantCount,
          expectedAppearanceChecks: faceVariantCount + Math.max(0, textureVariantCount - 1) + Math.max(0, helmVariantCount - 1),
          playable: Boolean(inventoryRace?.is_playable),
          races: [],
          sourceFiles: metadata.sourceFiles ?? [],
          zones: [],
        });
      }
      const entry = models.get(model);
      entry.races.push({
        id: Number(race.id),
        name: race.name,
        gender,
      });
      for (const source of inventoryRace?.sources ?? []) {
        if (!(source.models ?? []).some((candidate) => normalizeModel(candidate.code) === model)) continue;
        for (const zone of source.zones ?? []) {
          if (zone.short_name) entry.zones.push(zone.short_name.toLowerCase());
        }
      }
    }
  }

  const modelEntries = [...models.values()]
    .map((entry) => ({
      ...entry,
      races: entry.races.sort((a, b) => a.id - b.id || a.gender.localeCompare(b.gender)),
      zones: [...new Set(entry.zones)].sort(),
    }))
    .sort((a, b) => a.model.localeCompare(b.model));
  const availableMappedModels = modelEntries.filter((entry) => entry.available);

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    eqDirectory,
    summary: {
      raceDefinitionCount: raceData.length,
      mappedModelCount: modelEntries.length,
      availableMappedModelCount: availableMappedModels.length,
      missingMappedModelCount: modelEntries.length - availableMappedModels.length,
      classicFaceModelCount: modelEntries.filter((entry) => entry.classicFaces).length,
      expectedAppearanceCheckCount: availableMappedModels.reduce(
        (sum, entry) => sum + entry.expectedAppearanceChecks,
        0
      ),
    },
    models: modelEntries,
  };
};

export const resolveModelSelection = (coverage, selection = {}) => {
  const mode = selection.mode ?? 'explicit';
  const available = coverage.models.filter((model) => model.available);
  let selected;
  if (mode === 'available') selected = available;
  else if (mode === 'playable') selected = available.filter((model) => model.playable);
  else if (mode === 'all-mapped') selected = coverage.models;
  else {
    const requested = new Set((selection.models ?? []).map(normalizeModel).filter(Boolean));
    selected = coverage.models.filter((model) => requested.has(model.model));
    const known = new Set(selected.map((model) => model.model));
    const unknown = [...requested].filter((model) => !known.has(model));
    if (unknown.length) {
      throw new Error(`Unknown race model code(s): ${unknown.join(', ')}`);
    }
  }
  return selected.map((model) => model.model).sort();
};
