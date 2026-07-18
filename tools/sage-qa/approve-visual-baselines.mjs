import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createApprovedVisualBaseline,
  evaluateVisualBaselineApprovalEligibility,
  visualBaselineKey,
} from './lib/visual-invariants.mjs';

const args = Object.create(null);
for (let index = 2; index < process.argv.length; index += 1) {
  const token = process.argv[index];
  if (!token.startsWith('--')) continue;
  const [rawKey, inlineValue] = token.slice(2).split('=', 2);
  if (inlineValue !== undefined) {
    args[rawKey] = inlineValue;
  } else if (process.argv[index + 1] && !process.argv[index + 1].startsWith('--')) {
    args[rawKey] = process.argv[index + 1];
    index += 1;
  } else {
    args[rawKey] = true;
  }
}

if (!args.run) {
  throw new Error('Pass --run <completed-run-directory>');
}
if (args['confirm-reviewed'] !== true) {
  throw new Error('Refusing to approve pixels without --confirm-reviewed after inspecting every selected screenshot');
}
if (!`${args['reviewed-by'] ?? ''}`.trim()) {
  throw new Error('Pass --reviewed-by <name> so baseline provenance is explicit');
}

const runDirectory = path.resolve(args.run);
const sourcePath = path.join(runDirectory, 'visual-samples.json');
const sourceSamples = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
const requestedModels = new Set(`${args.models ?? ''}`
  .split(',')
  .map((model) => model.trim().toLowerCase())
  .filter(Boolean));
const selected = sourceSamples.filter((sample) =>
  requestedModels.size === 0 || requestedModels.has(`${sample.model}`.toLowerCase())
);
if (selected.length === 0) throw new Error('No visual samples matched the requested models');

const targetPath = path.resolve(
  args.output ?? 'tools/sage-qa/baselines/model-regression.json'
);
let existing = { schemaVersion: 1, samples: {} };
try {
  existing = JSON.parse(await fs.readFile(targetPath, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
if (existing.schemaVersion !== 1) throw new Error('Unsupported target baseline schema');

for (const sample of selected) {
  const eligibility = evaluateVisualBaselineApprovalEligibility(sample);
  if (!eligibility.pass) {
    throw new Error(
      `${sample.model} is not eligible for approval: ${eligibility.violations.join(', ')}`
    );
  }
  existing.samples[visualBaselineKey(sample)] = createApprovedVisualBaseline(
    sample.observations[0]
  );
}

existing.provenance = {
  reviewedBy: `${args['reviewed-by']}`,
  sourceRun: path.basename(runDirectory),
  approvedAt: new Date().toISOString(),
  sampleCount: Object.keys(existing.samples).length,
};

const output = `${JSON.stringify(existing, null, 2)}\n`;
if (args['dry-run'] === true) {
  process.stdout.write(output);
} else {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, output, 'utf8');
  process.stdout.write(`Approved ${selected.length} sample(s) into ${targetPath}\n`);
}
