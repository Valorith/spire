import { bytesToMB } from './memory.mjs';

const sum = (items, selector) => items.reduce((total, item) => total + Number(selector(item) ?? 0), 0);

export const aggregateZoneValidation = (payload) => {
  const reports = payload?.reports ?? [];
  const modelCodes = new Set();
  for (const report of reports) {
    for (const model of Object.keys(report.visuals?.byModel ?? {})) modelCodes.add(model.toLowerCase());
  }
  return {
    finished: payload?.finished ?? reports.length >= Number(payload?.config?.expectedReports ?? reports.length),
    complete: payload?.complete === true,
    failureCount: Number(payload?.failureCount ?? reports.filter((report) => !report.pass?.all).length),
    reportCount: reports.length,
    uniqueZoneCount: new Set(reports.map((report) => report.zone)).size,
    uniqueModelCount: modelCodes.size,
    modelCodes: [...modelCodes].sort(),
    npcCount: sum(reports, (report) => report.spawns?.loaded),
    npcRootCount: sum(reports, (report) => report.rootNodeCount),
    npcTextureReadyCount: sum(reports, (report) => report.visuals?.readyTextureCount),
    npcTextureSlotCount: sum(reports, (report) => report.visuals?.materialSlotCount),
    appearanceTextureDecodeFailureCount: sum(
      reports,
      (report) => report.visuals?.appearanceTextureDecodeFailureCount
    ),
    tPoseRiskCount: sum(reports, (report) => report.visuals?.tPoseRiskCount),
    motionlessAnimationCount: sum(reports, (report) => report.visuals?.motionlessAnimationCount),
    nonFiniteBoneMatrixCount: sum(reports, (report) => report.visuals?.nonFiniteBoneMatrixCount),
    animationGroupCount: sum(reports, (report) => report.visuals?.animationGroupCount),
    playingAnimationGroupCount: sum(reports, (report) => report.visuals?.playingAnimationGroupCount),
    excessAnimationGroupCount: sum(reports, (report) => report.visuals?.excessAnimationGroupCount),
    textureFallbackCount: sum(reports, (report) => report.visuals?.fallbackTextureCount),
    texturelessSpawnCount: sum(reports, (report) => report.visuals?.texturelessSpawnCount),
    nameplateExpectedCount: sum(reports, (report) => report.visuals?.nameplateExpectedCount),
    nameplateCount: sum(reports, (report) => report.visuals?.nameplateCount),
    nameplateFailureCount: sum(reports, (report) => report.visuals?.nameplateFailureCount),
    visibleDoorCount: sum(reports, (report) => report.doors?.loaded),
    hiddenDoorCount: sum(reports, (report) => report.doors?.hidden),
    doorTextureReadyCount: sum(reports, (report) => report.doors?.visuals?.readyTextureCount),
    failures: reports.filter((report) => !report.pass?.all).map((report) => ({
      zone: report.zone,
      cycle: report.validationSequence?.cycle ?? 1,
      pass: report.pass,
      loadError: report.loadError ?? null,
    })),
  };
};

export const aggregateRaceAudits = (batches = []) => {
  const results = batches.flatMap((batch) => batch.audit?.results ?? []);
  const failures = results.filter((result) => !`${result.status ?? ''}`.startsWith('pass-'));
  const animationDiagnostics = results
    .filter((result) => result.bindPoseOnlyAnimation === true)
    .map((result) => ({
      model: result.model,
      name: result.name,
      status: result.status,
      animationVitality: result.animationVitality,
      staticPoseFallbackAvailable: result.staticPoseFallbackAvailable,
    }));
  return {
    batchCount: batches.length,
    auditedModelCount: results.length,
    uniqueModelCount: new Set(results.map((result) => result.model)).size,
    appearanceVariantCountAudited: sum(results, (result) => result.appearanceVariantCountAudited),
    faceVariantCountAudited: sum(results, (result) => result.faceVariantCountAudited),
    animationDiagnosticCount: animationDiagnostics.length,
    animationDiagnosticModels: animationDiagnostics.map((result) => result.model),
    animationDiagnostics,
    failureCount: failures.length,
    failures,
    complete: batches.every((batch) => batch.audit?.complete === true) && failures.length === 0,
  };
};

const resourceDelta = (baseline, current, key) => {
  const before = Number(baseline?.sceneResources?.[key] ?? 0);
  const after = Number(current?.sceneResources?.[key] ?? 0);
  const absolute = after - before;
  const percent = before > 0 ? (absolute / before) * 100 : (after > 0 ? 100 : 0);
  return { key, before, after, absolute, percent };
};

export const analyzeSoak = (reports = [], config = {}) => {
  if (!config.enabled) return { enabled: false, pass: true, violations: [] };
  const warmupCycles = Number(config.warmupCycles ?? 1);
  const resourceKeys = config.resourceKeys ?? [];
  const baselineEndCycle = warmupCycles + 1;
  const baselineReports = reports.filter(
    (report) => Number(report.validationSequence?.cycle ?? 1) <= baselineEndCycle
  );
  const comparisonReports = reports.filter(
    (report) => Number(report.validationSequence?.cycle ?? 1) > baselineEndCycle
  );
  const baselines = new Map();
  const deltas = [];
  const violations = [];

  for (const report of baselineReports) {
    const baseline = baselines.get(report.zone) ?? { ...report, sceneResources: {} };
    const sceneResources = { ...baseline.sceneResources };
    for (const key of resourceKeys) {
      sceneResources[key] = Math.max(
        Number(sceneResources[key] ?? 0),
        Number(report.sceneResources?.[key] ?? 0)
      );
    }
    baselines.set(report.zone, { ...baseline, sceneResources });
  }

  for (const report of comparisonReports) {
    const baseline = baselines.get(report.zone);
    if (!baseline) continue;
    for (const key of resourceKeys) {
      const delta = resourceDelta(baseline, report, key);
      deltas.push({ zone: report.zone, cycle: report.validationSequence?.cycle, ...delta });
      if (
        delta.absolute > Number(config.resourceToleranceAbsolute ?? 0) &&
        delta.percent > Number(config.resourceTolerancePercent ?? 0)
      ) {
        violations.push(
          `${report.zone} ${key} grew from ${delta.before} to ${delta.after} ` +
          `(+${delta.absolute}, ${delta.percent.toFixed(1)}%)`
        );
      }
    }
  }

  const heapSamples = reports
    .filter((report) => Number(report.runtimeMemory?.jsHeapUsedBytes ?? 0) > 0)
    .map((report) => ({
      zone: report.zone,
      cycle: report.validationSequence?.cycle,
      usedMB: bytesToMB(report.runtimeMemory.jsHeapUsedBytes),
    }));
  const heapBaselines = new Map();
  const heapDeltas = [];
  for (const sample of heapSamples) {
    if (Number(sample.cycle ?? 1) <= baselineEndCycle) {
      const baseline = heapBaselines.get(sample.zone);
      if (!baseline || sample.usedMB > baseline.usedMB) {
        heapBaselines.set(sample.zone, sample);
      }
      continue;
    }
    const baseline = heapBaselines.get(sample.zone);
    if (!baseline) continue;
    heapDeltas.push({
      zone: sample.zone,
      cycle: sample.cycle,
      beforeMB: baseline.usedMB,
      afterMB: sample.usedMB,
      growthMB: sample.usedMB - baseline.usedMB,
    });
  }
  const heapGrowthMB = Math.max(0, ...heapDeltas.map((delta) => delta.growthMB));
  if (heapGrowthMB > Number(config.maxJsHeapGrowthMB ?? Infinity)) {
    violations.push(
      `JavaScript heap grew ${heapGrowthMB.toFixed(1)} MB after warmup ` +
      `(budget ${config.maxJsHeapGrowthMB} MB)`
    );
  }

  return {
    enabled: true,
    pass: violations.length === 0,
    warmupCycles,
    baselineEndCycle,
    baselineReportCount: baselineReports.length,
    comparedReportCount: comparisonReports.length,
    resourceDeltas: deltas,
    heapSamples,
    heapDeltas,
    heapGrowthMB,
    violations,
  };
};
