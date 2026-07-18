import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

export const verifyServedEmbedEntry = async ({
  baseUrl,
  buildEntryPath,
  entryPath = '/eqsage-embed/eqsage-embed.js',
  fetchImpl = fetch,
}) => {
  const expected = await fs.readFile(buildEntryPath);
  const url = new URL(entryPath, baseUrl);
  url.searchParams.set('sageQaBundleProbe', Date.now().toString(36));
  const response = await fetchImpl(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`Served Sage entry returned HTTP ${response.status}: ${url}`);
  }
  const served = Buffer.from(await response.arrayBuffer());
  const expectedSha256 = sha256(expected);
  const servedSha256 = sha256(served);
  if (expectedSha256 !== servedSha256) {
    throw new Error(
      'The running Spire server is serving a stale Sage bundle. ' +
      `Expected ${expectedSha256.slice(0, 12)}, received ${servedSha256.slice(0, 12)}. ` +
      'Restart the frontend development server before QA.'
    );
  }
  return {
    pass: true,
    buildEntryPath,
    url: url.href,
    byteLength: served.length,
    sha256: servedSha256,
  };
};

export const collectModuleSpecifiers = (source) => {
  const specifiers = new Set();
  const patterns = [
    /\bfrom\s*["']([^"']+\.js(?:\?[^"']*)?)["']/g,
    /\bimport\s*\(\s*["']([^"']+\.js(?:\?[^"']*)?)["']\s*\)/g,
    /\bimport\s*["']([^"']+\.js(?:\?[^"']*)?)["']/g,
  ];
  for (const pattern of patterns) {
    for (const match of `${source ?? ''}`.matchAll(pattern)) {
      specifiers.add(match[1]);
    }
  }
  return [...specifiers];
};

const isVersionedViteChunk = (url) =>
  /-[A-Za-z0-9_-]{8,14}\.js$/i.test(new URL(url).pathname);

export const inspectModuleGraph = async ({
  baseUrl,
  entryPath = '/eqsage-embed/eqsage-embed.js',
  fetchImpl = fetch,
  maxModules = 1500,
}) => {
  const origin = new URL(baseUrl).origin;
  const pending = [new URL(entryPath, baseUrl).href];
  const visited = new Set();

  while (pending.length > 0) {
    const moduleUrl = pending.shift();
    if (visited.has(moduleUrl)) continue;
    if (visited.size >= maxModules) {
      throw new Error(`Sage module graph exceeded ${maxModules} modules`);
    }
    const response = await fetchImpl(moduleUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      throw new Error(`Sage module returned HTTP ${response.status}: ${moduleUrl}`);
    }
    const source = await response.text();
    visited.add(moduleUrl);
    for (const specifier of collectModuleSpecifiers(source)) {
      const dependency = new URL(specifier, moduleUrl);
      if (
        dependency.origin === origin &&
        isVersionedViteChunk(dependency.href) &&
        !visited.has(dependency.href)
      ) {
        pending.push(dependency.href);
      }
    }
  }

  return {
    moduleCount: visited.size,
    modules: [...visited].sort(),
  };
};

// Local Vite rebuilds replace the hashed chunk set atomically from the
// filesystem's perspective, but a browser opened mid-rebuild can receive an
// entry chunk that points at a dependency which has already been removed. Two
// identical successful graph walks provide a bounded readiness barrier without
// hiding genuine missing-chunk failures.
export const waitForModuleGraphReady = async ({
  baseUrl,
  entryPath,
  fetchImpl = fetch,
  timeoutMs = 45000,
  settleMs = 1500,
  onAttempt = null,
}) => {
  const startedAt = Date.now();
  let previousSignature = null;
  let lastError = null;
  let attempt = 0;

  while (Date.now() - startedAt < timeoutMs) {
    attempt++;
    try {
      const graph = await inspectModuleGraph({
        baseUrl,
        entryPath,
        fetchImpl,
      });
      const signature = graph.modules.join('\n');
      onAttempt?.({ attempt, pass: true, moduleCount: graph.moduleCount });
      if (signature === previousSignature) {
        return { ...graph, attempts: attempt };
      }
      previousSignature = signature;
      lastError = null;
    } catch (error) {
      lastError = error;
      previousSignature = null;
      onAttempt?.({ attempt, pass: false, error: error?.message ?? String(error) });
    }
    await sleep(settleMs);
  }

  throw new Error(
    `Sage module graph did not stabilize within ${timeoutMs}ms` +
      (lastError ? `: ${lastError.message}` : '')
  );
};
