#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from './lib/args.mjs';
import { resolveEqDirectory } from './lib/profile.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, '..', '..');
const args = parseArgs(process.argv.slice(2));
const baseUrl = `${args.baseUrl ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:8080'}`.replace(/\/$/, '');
const eqDirectory = await resolveEqDirectory({ requested: args.eqDir });
const concurrency = Math.max(1, Math.min(16, Number(args.concurrency ?? 8)));
const rounds = Math.max(1, Math.min(20, Number(args.rounds ?? 5)));
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const stressDirectory = `${eqDirectory.replaceAll('\\', '/')}/eqsage/.spire-qa/fs-stress-${runId}`;
const events = [];

const endpoint = (operation, filePath) => {
  const query = new URLSearchParams({ root: eqDirectory, path: filePath });
  return `${baseUrl}/api/v1/app/sage-fs/${operation}?${query}`;
};

const request = async (operation, filePath, init = {}) => {
  const startedAt = Date.now();
  const response = await fetch(endpoint(operation, filePath), {
    ...init,
    signal: AbortSignal.timeout(30000),
  });
  const retries = Number(response.headers.get('x-sage-fs-retries') ?? 0);
  const event = {
    operation,
    filePath,
    status: response.status,
    retries,
    durationMs: Date.now() - startedAt,
  };
  events.push(event);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`${operation} returned HTTP ${response.status}: ${body}`);
  }
  return response;
};

const readTargets = [
  'eqsage/textures/avifa0101.png',
  'eqsage/textures/bknch0003.png',
  'eqsage/textures/frmlg0002.png',
  'eqsage/textures/orchn0201.png',
  'eqsage/textures/peghe0001.png',
  'eqsage/textures/wlmua0401.png',
  'eqsage/textures/xegfa0001.png',
  'eqsage/data/version.json',
].map((relative) => `${eqDirectory.replaceAll('\\', '/')}/${relative}`);

let failure = null;
try {
  for (let round = 0; round < rounds; round += 1) {
    await Promise.all(Array.from({ length: concurrency }, async (_, worker) => {
      const existingPath = readTargets[(round * concurrency + worker) % readTargets.length];
      const existing = await request('read-file', existingPath, { method: 'GET' });
      if ((await existing.arrayBuffer()).byteLength === 0) {
        throw new Error(`existing read returned no data: ${existingPath}`);
      }

      const filePath = `${stressDirectory}/round-${round}-worker-${worker}.bin`;
      const payload = Buffer.alloc(64 * 1024, (round * concurrency + worker) % 251);
      await request('write-file', filePath, { method: 'POST', body: payload });
      const written = Buffer.from(await (await request('read-file', filePath, { method: 'GET' })).arrayBuffer());
      if (!written.equals(payload)) {
        throw new Error(`round-trip mismatch: ${filePath}`);
      }
    }));
  }
} catch (error) {
  failure = error;
} finally {
  await request('delete-folder', stressDirectory, { method: 'DELETE' }).catch((error) => {
    failure ??= error;
  });
}

const result = {
  schemaVersion: 1,
  runId,
  baseUrl,
  eqDirectory,
  concurrency,
  rounds,
  operationCount: events.length,
  internalRetryCount: events.reduce((total, event) => total + event.retries, 0),
  httpErrorCount: events.filter((event) => event.status >= 400).length,
  maximumDurationMs: Math.max(0, ...events.map((event) => event.durationMs)),
  pass: failure === null,
  failure: failure?.message ?? null,
  events,
};
const outputDirectory = path.join(repoRoot, 'tmp', 'validation', 'fs-stress');
await fs.mkdir(outputDirectory, { recursive: true });
const outputPath = path.join(outputDirectory, `${runId}.json`);
await fs.writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ...result, events: undefined, outputPath }, null, 2));
if (!result.pass) process.exitCode = 1;
