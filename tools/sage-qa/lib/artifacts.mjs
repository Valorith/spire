import fs from 'node:fs/promises';
import path from 'node:path';

const slugify = (value) => `${value}`
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '') || 'run';

const assertInside = (root, candidate) => {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  if (resolvedCandidate === resolvedRoot || !resolvedCandidate.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Refusing artifact operation outside ${resolvedRoot}: ${resolvedCandidate}`);
  }
  return resolvedCandidate;
};

export const createRunDirectory = async ({ outputRoot, profileName, now = new Date() }) => {
  const runId = `${now.toISOString().replace(/[:.]/g, '-')}-${slugify(profileName)}`;
  const root = path.resolve(outputRoot);
  const runDirectory = assertInside(root, path.join(root, runId));
  await fs.mkdir(runDirectory, { recursive: true });
  await fs.mkdir(path.join(runDirectory, 'screenshots'), { recursive: true });
  await fs.mkdir(path.join(runDirectory, 'traces'), { recursive: true });
  return { runId, runDirectory, outputRoot: root };
};

export const writeJson = async (filePath, value) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

export const writeText = async (filePath, value) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, value, 'utf8');
};

export const appendEvent = async (runDirectory, event) => {
  await fs.appendFile(
    path.join(runDirectory, 'events.ndjson'),
    `${JSON.stringify({ timestamp: new Date().toISOString(), ...event })}\n`,
    'utf8'
  );
};

export const directorySize = async (directory) => {
  let total = 0;
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) total += await directorySize(candidate);
    else if (entry.isFile()) total += (await fs.stat(candidate)).size;
  }
  return total;
};

export const pruneRuns = async ({ outputRoot, keepRuns, maxTotalMB, currentRunDirectory }) => {
  const root = path.resolve(outputRoot);
  await fs.mkdir(root, { recursive: true });
  const current = path.resolve(currentRunDirectory);
  const entries = [];
  for (const entry of await fs.readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = assertInside(root, path.join(root, entry.name));
    const stat = await fs.stat(directory);
    entries.push({ directory, mtimeMs: stat.mtimeMs, size: await directorySize(directory) });
  }
  entries.sort((a, b) => b.mtimeMs - a.mtimeMs);

  const maxBytes = Math.max(0, Number(maxTotalMB ?? 0)) * 1024 * 1024;
  const retained = [];
  const removed = [];
  let retainedBytes = 0;
  for (const [index, entry] of entries.entries()) {
    const isCurrent = entry.directory === current;
    const withinCount = index < Math.max(1, Number(keepRuns ?? 1));
    const withinSize = maxBytes <= 0 || retainedBytes + entry.size <= maxBytes;
    if (isCurrent || (withinCount && withinSize)) {
      retained.push(entry);
      retainedBytes += entry.size;
      continue;
    }
    await fs.rm(entry.directory, { recursive: true, force: true });
    removed.push(entry);
  }
  return {
    retainedRuns: retained.length,
    removedRuns: removed.length,
    retainedBytes,
    removedBytes: removed.reduce((total, entry) => total + entry.size, 0),
  };
};
