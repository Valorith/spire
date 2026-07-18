#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from './lib/args.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args.planRun || !args.runs) {
  throw new Error('Usage: npm run qa:sage:verify-checkpoints -- --plan-run <run> --runs <run,run>');
}

const planRun = path.resolve(args.planRun);
const runDirectories = `${args.runs}`.split(',').map((entry) => path.resolve(entry.trim())).filter(Boolean);
const plan = JSON.parse(await fs.readFile(path.join(planRun, 'plan.json'), 'utf8'));
const expectedModels = new Set(plan.selectedModels ?? []);
const validatedModels = new Set();
const duplicateModels = new Set();
const batchFailures = [];
let batchCount = 0;

for (const runDirectory of runDirectories) {
  const checkpointDirectory = path.join(runDirectory, 'race-audit-checkpoints');
  const entries = await fs.readdir(checkpointDirectory, { withFileTypes: true }).catch(() => []);
  for (const entry of entries.filter((candidate) => candidate.isFile() && candidate.name.endsWith('.json'))) {
    const checkpoint = JSON.parse(await fs.readFile(path.join(checkpointDirectory, entry.name), 'utf8'));
    batchCount += 1;
    if (!checkpoint.pass || Number(checkpoint.audit?.failureCount ?? 0) > 0) {
      batchFailures.push({ runDirectory, file: entry.name, failureCount: checkpoint.audit?.failureCount ?? null });
    }
    for (const model of checkpoint.models ?? []) {
      if (validatedModels.has(model)) duplicateModels.add(model);
      validatedModels.add(model);
    }
  }
}

const missingModels = [...expectedModels].filter((model) => !validatedModels.has(model));
const unexpectedModels = [...validatedModels].filter((model) => !expectedModels.has(model));
const result = {
  schemaVersion: 1,
  planRun,
  runDirectories,
  expectedModelCount: expectedModels.size,
  validatedModelCount: validatedModels.size,
  batchCount,
  duplicateModelCount: duplicateModels.size,
  missingModels,
  unexpectedModels,
  batchFailures,
  pass: missingModels.length === 0 && unexpectedModels.length === 0 && batchFailures.length === 0,
};
const outputPath = path.join(runDirectories.at(-1), 'checkpoint-composite.json');
await fs.writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ...result, outputPath }, null, 2));
if (!result.pass) process.exitCode = 1;
