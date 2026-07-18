import os from 'node:os';

const MB = 1024 * 1024;

export const captureMemorySnapshot = (stage = 'unknown') => {
  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const processMemory = process.memoryUsage();
  return {
    stage,
    timestamp: new Date().toISOString(),
    system: {
      totalBytes,
      freeBytes,
      usedBytes: totalBytes - freeBytes,
      usedPercent: totalBytes > 0 ? ((totalBytes - freeBytes) / totalBytes) * 100 : 0,
    },
    runner: {
      rssBytes: processMemory.rss,
      heapTotalBytes: processMemory.heapTotal,
      heapUsedBytes: processMemory.heapUsed,
      externalBytes: processMemory.external,
    },
  };
};

export const evaluateMemoryBudget = (snapshot, budget) => {
  const violations = [];
  const freeMB = snapshot.system.freeBytes / MB;
  if (snapshot.system.usedPercent > budget.maxUsedPercent) {
    violations.push(
      `system memory use ${snapshot.system.usedPercent.toFixed(1)}% exceeds ${budget.maxUsedPercent}%`
    );
  }
  if (freeMB < budget.minFreeMB) {
    violations.push(`free memory ${freeMB.toFixed(0)} MB is below ${budget.minFreeMB} MB`);
  }
  const runnerRssMB = Number(snapshot.runner?.rssBytes ?? 0) / MB;
  if (Number.isFinite(budget.maxRunnerRssMB) && runnerRssMB > budget.maxRunnerRssMB) {
    violations.push(
      `runner RSS ${runnerRssMB.toFixed(0)} MB exceeds ${budget.maxRunnerRssMB} MB`
    );
  }
  const runnerExternalMB = Number(snapshot.runner?.externalBytes ?? 0) / MB;
  if (Number.isFinite(budget.maxRunnerExternalMB) && runnerExternalMB > budget.maxRunnerExternalMB) {
    violations.push(
      `runner external memory ${runnerExternalMB.toFixed(0)} MB exceeds ${budget.maxRunnerExternalMB} MB`
    );
  }
  return { pass: violations.length === 0, violations, freeMB };
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export const ensureMemoryBudget = async ({ budget, stage, onSnapshot = () => {} }) => {
  const attempts = Math.max(1, Number(budget.checkAttempts ?? 1));
  let evaluation;
  let snapshot;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (typeof globalThis.gc === 'function') {
      globalThis.gc();
      await wait(0);
    }
    snapshot = captureMemorySnapshot(stage);
    evaluation = evaluateMemoryBudget(snapshot, budget);
    onSnapshot(snapshot, evaluation);
    if (evaluation.pass) return { snapshot, evaluation };
    if (attempt < attempts) await wait(Math.max(0, Number(budget.settleMs ?? 0)));
  }
  throw new Error(`Memory budget blocked ${stage}: ${evaluation.violations.join('; ')}`);
};

export const bytesToMB = (bytes) => Number(bytes ?? 0) / MB;
