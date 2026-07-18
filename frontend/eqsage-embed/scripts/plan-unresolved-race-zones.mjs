import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveEqDirectory } from '../../../tools/sage-qa/lib/profile.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..', '..');
const eqDirectory = await resolveEqDirectory({
  requested: process.argv.includes('--eq-dir')
    ? process.argv[process.argv.indexOf('--eq-dir') + 1]
    : null,
});
const inventory = JSON.parse(
  await fs.readFile(
    path.join(repoRoot, 'internal', 'http', 'staticmaps', 'race-inventory-map.json'),
    'utf8'
  )
);
const audit = JSON.parse(
  await fs.readFile(
    path.join(eqDirectory, 'eqsage', 'data', 'spire-race-face-audit.json'),
    'utf8'
  )
);

const unresolved = new Set(
  (audit.failures ?? []).map((result) => result.model.toLowerCase())
);
const coverage = new Map();
for (const race of inventory.races ?? []) {
  for (const source of race.sources ?? []) {
    const models = new Set(
      (source.models ?? [])
        .map((model) => model.code?.toLowerCase())
        .filter((model) => model && unresolved.has(model))
    );
    for (const zone of source.zones ?? []) {
      if (!zone.short_name || models.size === 0) {
        continue;
      }
      if (!coverage.has(zone.short_name)) {
        coverage.set(zone.short_name, new Set());
      }
      for (const model of models) {
        coverage.get(zone.short_name).add(model);
      }
    }
  }
}

const remaining = new Set(unresolved);
const zones = [];
while (true) {
  let bestZone = null;
  let bestModels = [];
  for (const [zone, models] of coverage) {
    const uncoveredModels = [...models].filter((model) => remaining.has(model));
    if (uncoveredModels.length > bestModels.length) {
      bestZone = zone;
      bestModels = uncoveredModels;
    }
  }
  if (!bestZone) {
    break;
  }
  zones.push({ zone: bestZone, models: bestModels.sort() });
  for (const model of bestModels) {
    remaining.delete(model);
  }
  coverage.delete(bestZone);
}

const output = {
  unresolvedModelCount: unresolved.size,
  alternateZoneCount: zones.length,
  potentiallyRecoverableModelCount: unresolved.size - remaining.size,
  noZoneSourceModelCount: remaining.size,
  zones,
  noZoneSourceModels: [...remaining].sort(),
};
const outputDir = path.join(repoRoot, 'tmp', 'race-face-audit');
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(
  path.join(outputDir, 'alternate-zone-plan.json'),
  `${JSON.stringify(output, null, 2)}\n`
);
console.log(JSON.stringify({
  ...output,
  zones: zones.map(({ zone }) => zone).join(','),
}, null, 2));
