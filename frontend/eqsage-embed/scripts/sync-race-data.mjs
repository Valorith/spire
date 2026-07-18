import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const raceDataPath = fileURLToPath(
  new URL('../src/viewer/common/raceData.json', import.meta.url)
);
const raceModelMetadataPath = fileURLToPath(
  new URL('../src/viewer/common/raceModelMetadata.json', import.meta.url)
);
const raceInventoryPath = fileURLToPath(
  new URL('../../../internal/http/staticmaps/race-inventory-map.json', import.meta.url)
);

const [raceData, raceInventory] = await Promise.all([
  readFile(raceDataPath, 'utf8').then(JSON.parse),
  readFile(raceInventoryPath, 'utf8').then(JSON.parse),
]);

const existingById = new Map(raceData.map((race) => [Number(race.id), race]));
const inventoryIds = new Set(
  raceInventory.races.map((race) => Number(race.race_id))
);

const synchronized = raceInventory.races.map((race) => {
  const raceId = Number(race.race_id);
  return existingById.get(raceId) ?? {
    0   : race.male_gender_model_code ?? '',
    1   : race.female_gender_model_code ?? '',
    2   : race.neutral_gender_model_code ?? '',
    id  : raceId,
    name: race.description ?? 'Unknown',
  };
});

// Preserve Spire-only pseudo-races and intentional model-code overrides.
for (const race of raceData) {
  if (!inventoryIds.has(Number(race.id))) {
    synchronized.push(race);
  }
}

synchronized.sort((left, right) => Number(left.id) - Number(right.id));

await writeFile(
  raceDataPath,
  `${JSON.stringify(synchronized, null, 4)}\n`,
  'utf8'
);

const modelMetadata = {};
for (const race of raceInventory.races) {
  for (const source of race.sources ?? []) {
    const sourceFile = `${source.source_file ?? ''}`.trim().toLowerCase();
    for (const model of source.models ?? []) {
      const code = `${model.code ?? ''}`.trim().toLowerCase();
      if (!code) {
        continue;
      }
      modelMetadata[code] ??= {
        sourceFiles: [],
        minTexture: Number.MAX_SAFE_INTEGER,
        maxTexture: 0,
        minHelmTexture: Number.MAX_SAFE_INTEGER,
        maxHelmTexture: 0,
        minHair: Number.MAX_SAFE_INTEGER,
        maxHair: 0,
        minBeards: Number.MAX_SAFE_INTEGER,
        maxBeards: 0,
      };
      const metadata = modelMetadata[code];
      if (sourceFile && !metadata.sourceFiles.includes(sourceFile)) {
        metadata.sourceFiles.push(sourceFile);
      }
      metadata.minTexture = Math.min(
        metadata.minTexture,
        Number(model.min_texture ?? 0)
      );
      metadata.maxTexture = Math.max(
        metadata.maxTexture,
        Number(model.max_texture ?? 0)
      );
      metadata.minHelmTexture = Math.min(
        metadata.minHelmTexture,
        Number(model.min_helm_texture ?? 0)
      );
      metadata.maxHelmTexture = Math.max(
        metadata.maxHelmTexture,
        Number(model.max_helm_texture ?? 0)
      );
      metadata.minHair = Math.min(
        metadata.minHair,
        Number(model.min_hair ?? 0)
      );
      metadata.maxHair = Math.max(
        metadata.maxHair,
        Number(model.max_hair ?? 0)
      );
      metadata.minBeards = Math.min(
        metadata.minBeards,
        Number(model.min_beards ?? 0)
      );
      metadata.maxBeards = Math.max(
        metadata.maxBeards,
        Number(model.max_beards ?? 0)
      );
    }
  }
}

// Some classic client models are present in zone character archives but are
// omitted from the upstream race-source inventory. Preserve deterministic
// local source discovery for them whenever this generated metadata is synced.
const modelSourceOverrides = {
  brm: [
    'butcher_chr.s3d',
    'cauldron_chr.s3d',
    'gfaydark_chr.s3d',
    'growthplane2_chr.s3d',
    'lfaydark_chr.s3d',
    'poknowledge_chr.s3d',
    'qrg_chr.s3d',
    'rivervale_chr.s3d',
    'steamfont_chr.s3d',
  ],
};
for (const [code, sourceFiles] of Object.entries(modelSourceOverrides)) {
  modelMetadata[code] ??= {
    sourceFiles: [],
    minTexture: 0,
    maxTexture: 0,
    minHelmTexture: 0,
    maxHelmTexture: 0,
    minHair: 0,
    maxHair: 0,
    minBeards: 0,
    maxBeards: 0,
  };
  modelMetadata[code].sourceFiles = [
    ...new Set([...modelMetadata[code].sourceFiles, ...sourceFiles]),
  ];
}

for (const metadata of Object.values(modelMetadata)) {
  metadata.sourceFiles.sort();
  for (const key of ['minTexture', 'minHelmTexture', 'minHair', 'minBeards']) {
    if (!Number.isFinite(metadata[key]) || metadata[key] === Number.MAX_SAFE_INTEGER) {
      metadata[key] = 0;
    }
  }
}

const sortedModelMetadata = Object.fromEntries(
  Object.entries(modelMetadata).sort(([left], [right]) => left.localeCompare(right))
);
await writeFile(
  raceModelMetadataPath,
  `${JSON.stringify(sortedModelMetadata, null, 2)}\n`,
  'utf8'
);

console.log(
  `Synchronized ${synchronized.length} race definitions and ${Object.keys(sortedModelMetadata).length} model source records (${raceData.length} existing, ${raceInventory.races.length} inventory).`
);
