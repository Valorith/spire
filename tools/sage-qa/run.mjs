#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, asBoolean } from './lib/args.mjs';
import { aggregateRaceAudits, aggregateZoneValidation, analyzeSoak } from './lib/aggregate.mjs';
import { appendEvent, createRunDirectory, pruneRuns, writeJson, writeText } from './lib/artifacts.mjs';
import { buildCoverageManifest, resolveModelSelection } from './lib/coverage.mjs';
import { ensureMemoryBudget } from './lib/memory.mjs';
import {
  createTelemetry,
  getBrowserLaunchOptions,
  runRaceAuditBatches,
  runVisualSamples,
  runZoneValidation,
  summarizeTelemetry,
} from './lib/playwright-runner.mjs';
import { loadProfile, resolveEqDirectory } from './lib/profile.mjs';
import { renderHtmlReport } from './lib/report.mjs';
import { runStaticTextureAudit } from './lib/static-audit.mjs';
import { compactRunSummary } from './lib/summary.mjs';
import {
  verifyServedEmbedEntry,
  waitForModuleGraphReady,
} from './lib/server-readiness.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, '..', '..');

const HELP = `Sage QA

Usage:
  npm run qa:sage -- --profile <smoke|model-viewer|matrix|soak|full> [options]

Options:
  -p, --profile <name|path>      Validation profile (default: smoke)
  -e, --eq-dir <path>           EverQuest directory containing eqsage assets
  -b, --base-url <url>          Running Spire URL (default: http://127.0.0.1:8080)
  -o, --output-root <path>      Artifact root (default: tmp/validation/runs)
      --headed                  Show the automation browser
      --cycles <number>         Override zone-validation cycles
      --zones <csv>             Validate only these zones
      --batch-size <number>     Override race-audit batch size
      --race-models <csv>       Audit only these model codes
      --visual-models <csv>     Run only matching visual samples from the profile
      --visual-surface <name>   Use race-audit or model-review for visual QA
      --no-race-audit           Skip browser race audit
      --no-zone-validation      Skip zone validation
      --no-static-texture-audit Skip static texture audit
      --coverage-only           Generate coverage without launching a browser
      --dry-run                 Resolve and validate the execution plan only
      --list-profiles           List built-in profiles
  -h, --help                    Show this help
`;

const listProfiles = async () => {
  const directory = path.join(scriptDirectory, 'profiles');
  const names = (await fs.readdir(directory))
    .filter((name) => name.endsWith('.json'))
    .map((name) => path.basename(name, '.json'))
    .sort();
  console.log(names.join('\n'));
};

const checkServer = async (baseUrl) => {
  const response = await fetch(new URL('/', baseUrl), { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Spire server returned HTTP ${response.status} at ${baseUrl}`);
};

const eventLine = (event) => {
  if (event.type.endsWith('start')) return `START ${event.phase}${event.batch ? ` batch ${event.batch}/${event.batchCount}` : ''}`;
  if (event.type.endsWith('complete')) return `${event.pass === false ? 'FAIL' : 'PASS'} ${event.phase}${event.batch ? ` batch ${event.batch}` : ''}`;
  if (event.type.endsWith('error')) return `ERROR ${event.phase}: ${event.error}`;
  return `${event.type} ${event.phase ?? ''}`.trim();
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    return;
  }
  if (args.listProfiles) {
    await listProfiles();
    return;
  }

  const profile = await loadProfile({ repoRoot, profile: args.profile ?? 'smoke', args });
  const eqDirectory = await resolveEqDirectory({ requested: args.eqDir });
  const baseUrl = args.baseUrl ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:8080';
  const outputRoot = path.resolve(args.outputRoot ?? path.join(repoRoot, 'tmp', 'validation', 'runs'));
  const artifacts = await createRunDirectory({ outputRoot, profileName: profile.name });
  const startedAt = new Date().toISOString();
  const events = [];
  let eventWrite = Promise.resolve();
  const memorySnapshots = [];
  const failures = [];
  const telemetry = createTelemetry();
  let browser = null;
  let staticTextureAudit = null;
  let zoneValidation = null;
  let raceBatches = [];
  let visualSamples = [];
  let servedBundle = null;
  let coverage;
  let selectedModels = [];

  const onEvent = (event) => {
    const enriched = { timestamp: new Date().toISOString(), ...event };
    events.push(enriched);
    eventWrite = eventWrite
      .then(() => appendEvent(artifacts.runDirectory, event))
      .catch((error) => console.warn(`[sage-qa] event checkpoint failed: ${error.message}`));
    console.log(`[sage-qa] ${eventLine(enriched)}`);
  };
  const memoryCheck = async (stage) => ensureMemoryBudget({
    budget: profile.memory,
    stage,
    onSnapshot: (snapshot, evaluation) => {
      memorySnapshots.push({ ...snapshot, budgetPass: evaluation.pass, budgetViolations: evaluation.violations });
      console.log(
        `[sage-qa] memory ${stage}: ${snapshot.system.usedPercent.toFixed(1)}% used, ` +
        `${(snapshot.system.freeBytes / 1048576).toFixed(0)} MB free`
      );
    },
  });

  const baseRun = {
    schemaVersion: 1,
    runId: artifacts.runId,
    startedAt,
    repoRoot,
    eqDirectory,
    baseUrl,
    profile,
  };

  try {
    await memoryCheck('startup');
    coverage = await buildCoverageManifest({ repoRoot, eqDirectory });
    selectedModels = profile.raceAudit.enabled
      ? resolveModelSelection(coverage, profile.raceAudit.modelSelection)
      : [];
    await writeJson(path.join(artifacts.runDirectory, 'coverage.json'), coverage);
    await writeJson(path.join(artifacts.runDirectory, 'plan.json'), {
      ...baseRun,
      selectedModelCount: selectedModels.length,
      selectedModels,
      expectedZoneReports: profile.zoneValidation.enabled
        ? profile.zoneValidation.zones.length * profile.zoneValidation.cycles
        : 0,
    });

    if (args.coverageOnly || args.dryRun) {
      const mode = args.coverageOnly ? 'coverage-only' : 'dry-run';
      const result = {
        ...baseRun,
        mode,
        pass: true,
        completedAt: new Date().toISOString(),
        coverage: coverage.summary,
        selectedModelCount: selectedModels.length,
        memorySnapshots,
        failures: [],
      };
      await writeJson(path.join(artifacts.runDirectory, 'summary.json'), result);
      await writeText(path.join(artifacts.runDirectory, 'summary.html'), renderHtmlReport(result));
      console.log(`[sage-qa] ${mode} complete: ${artifacts.runDirectory}`);
      return;
    }

    await checkServer(baseUrl);
    servedBundle = await verifyServedEmbedEntry({
      baseUrl,
      buildEntryPath: path.join(
        repoRoot,
        'frontend',
        'public',
        'eqsage-embed',
        'eqsage-embed.js'
      ),
    });
    await writeJson(path.join(artifacts.runDirectory, 'served-bundle.json'), servedBundle);
    onEvent({
      type: 'preflight-complete',
      phase: 'served-bundle-identity',
      pass: true,
      sha256: servedBundle.sha256,
    });

    if (profile.staticTextureAudit.enabled) {
      await memoryCheck('before-static-texture-audit');
      onEvent({ type: 'phase-start', phase: 'static-texture-audit' });
      staticTextureAudit = await runStaticTextureAudit({
        repoRoot,
        eqDirectory,
        timeoutMs: profile.staticTextureAudit.timeoutMs,
      });
      staticTextureAudit.pass = Number(staticTextureAudit.affectedMissingModelCount ?? 0) === 0;
      if (!staticTextureAudit.pass) failures.push('Static texture audit found affected models without available assets');
      await writeJson(path.join(artifacts.runDirectory, 'static-texture-audit.json'), staticTextureAudit);
      onEvent({ type: 'phase-complete', phase: 'static-texture-audit', pass: staticTextureAudit.pass });
    }

    const needsBrowser = profile.zoneValidation.enabled || profile.raceAudit.enabled || profile.visualSamples.length > 0;
    if (needsBrowser) {
      const moduleGraph = await waitForModuleGraphReady({
        baseUrl,
        onAttempt: ({ attempt, pass, moduleCount, error }) => {
          console.log(
            pass
              ? `[sage-qa] module graph attempt ${attempt}: ${moduleCount} modules ready`
              : `[sage-qa] module graph attempt ${attempt}: ${error}`
          );
        },
      });
      onEvent({
        type: 'preflight-complete',
        phase: 'module-graph-readiness',
        pass: true,
        moduleCount: moduleGraph.moduleCount,
        attempts: moduleGraph.attempts,
      });
      await memoryCheck('before-browser-launch');
      const { chromium } = await import('playwright');
      browser = await chromium.launch(getBrowserLaunchOptions(profile));
    }

    if (profile.zoneValidation.enabled) {
      await memoryCheck('before-zone-validation');
      zoneValidation = await runZoneValidation({
        browser,
        profile,
        baseUrl,
        eqDirectory,
        runId: artifacts.runId,
        runDirectory: artifacts.runDirectory,
        telemetry,
        beforeZone: ({ index }) =>
          memoryCheck(`before-zone-validation-${index + 1}`),
        onEvent,
      });
      zoneValidation.summary = aggregateZoneValidation(zoneValidation.raw);
      if (!zoneValidation.summary.complete) failures.push(`Zone validation failed (${zoneValidation.summary.failureCount} failures)`);
      await writeJson(path.join(artifacts.runDirectory, 'zone-validation.json'), zoneValidation);
    }

    raceBatches = await runRaceAuditBatches({
      browser,
      profile,
      baseUrl,
      eqDirectory,
      models: selectedModels,
      runId: artifacts.runId,
      runDirectory: artifacts.runDirectory,
      telemetry,
      beforeBatch: ({ index }) => memoryCheck(`before-race-batch-${index + 1}`),
      onBatchComplete: ({ result }) => writeJson(
        path.join(artifacts.runDirectory, 'race-audit-checkpoints', `batch-${result.batch}.json`),
        result
      ),
      onEvent,
    });
    const raceSummary = aggregateRaceAudits(raceBatches);
    if (profile.raceAudit.enabled && !raceSummary.complete) {
      failures.push(`Race audit failed (${raceSummary.failureCount} model failures)`);
    }
    await writeJson(path.join(artifacts.runDirectory, 'race-audit-batches.json'), raceBatches);

    visualSamples = await runVisualSamples({
      browser,
      profile,
      baseUrl,
      eqDirectory,
      runId: artifacts.runId,
      runDirectory: artifacts.runDirectory,
      telemetry,
      beforeSample: ({ index }) => memoryCheck(`before-visual-sample-${index + 1}`),
      onEvent,
    });
    if (visualSamples.some((sample) => !sample.pass)) {
      failures.push(`Visual sample validation failed (${visualSamples.filter((sample) => !sample.pass).length} failures)`);
    }
    await writeJson(path.join(artifacts.runDirectory, 'visual-samples.json'), visualSamples);

    await browser?.close();
    browser = null;
    await memoryCheck('after-browser-close');

    const soak = analyzeSoak(zoneValidation?.raw?.reports ?? [], profile.soak);
    if (!soak.pass) failures.push(...soak.violations.map((violation) => `Soak: ${violation}`));
    const diagnosticSummary = summarizeTelemetry(telemetry);

    if (profile.diagnostics.failOnPageErrors && diagnosticSummary.pageErrorCount) {
      failures.push(`${diagnosticSummary.pageErrorCount} browser page error(s)`);
    }
    if (profile.diagnostics.failOnConsoleErrors && diagnosticSummary.consoleErrorCount) {
      failures.push(`${diagnosticSummary.consoleErrorCount} unrecovered browser console error(s)`);
    }
    if (profile.diagnostics.failOnRequestFailures && diagnosticSummary.requestFailureCount) {
      failures.push(`${diagnosticSummary.requestFailureCount} unrecovered browser request failure(s)`);
    }
    if (profile.diagnostics.failOnHttpErrors && diagnosticSummary.httpErrorCount) {
      failures.push(`${diagnosticSummary.httpErrorCount} browser HTTP error response(s)`);
    }

    const result = {
      ...baseRun,
      completedAt: new Date().toISOString(),
      pass: failures.length === 0,
      failures,
      coverage: coverage.summary,
      staticTextureAudit,
      zoneValidation,
      raceAudit: { summary: raceSummary, batches: raceBatches },
      visualSamples,
      servedBundle,
      soak,
      diagnostics: telemetry,
      diagnosticSummary,
      memorySnapshots,
    };
    await writeJson(path.join(artifacts.runDirectory, 'telemetry.json'), telemetry);
    await writeJson(path.join(artifacts.runDirectory, 'summary.json'), compactRunSummary(result));
    await writeText(path.join(artifacts.runDirectory, 'summary.html'), renderHtmlReport(result));
    await eventWrite;
    await writeText(
      path.join(artifacts.runDirectory, 'events.ndjson'),
      events.map((event) => JSON.stringify(event)).join('\n') + (events.length ? '\n' : '')
    );
    const retention = await pruneRuns({
      outputRoot: artifacts.outputRoot,
      keepRuns: profile.artifacts.keepRuns,
      maxTotalMB: profile.artifacts.maxTotalMB,
      currentRunDirectory: artifacts.runDirectory,
    });
    await writeJson(path.join(artifacts.runDirectory, 'retention.json'), retention);

    console.log(`[sage-qa] ${result.pass ? 'PASS' : 'FAIL'} ${profile.name}: ${artifacts.runDirectory}`);
    console.log(`[sage-qa] HTML report: ${path.join(artifacts.runDirectory, 'summary.html')}`);
    if (!result.pass && !asBoolean(args.allowFailures, false)) process.exitCode = 1;
  } catch (error) {
    failures.push(error.message);
    const result = {
      ...baseRun,
      completedAt: new Date().toISOString(),
      pass: false,
      failures,
      coverage: coverage?.summary ?? null,
      staticTextureAudit,
      zoneValidation,
      raceAudit: { summary: aggregateRaceAudits(raceBatches), batches: raceBatches },
      visualSamples,
      servedBundle,
      diagnostics: telemetry,
      diagnosticSummary: summarizeTelemetry(telemetry),
      memorySnapshots,
      fatalError: { message: error.message, stack: error.stack ?? null },
    };
    await writeJson(path.join(artifacts.runDirectory, 'summary.json'), compactRunSummary(result)).catch(() => {});
    await writeText(path.join(artifacts.runDirectory, 'summary.html'), renderHtmlReport(result)).catch(() => {});
    await eventWrite.catch(() => {});
    await writeText(
      path.join(artifacts.runDirectory, 'events.ndjson'),
      events.map((event) => JSON.stringify(event)).join('\n') + (events.length ? '\n' : '')
    ).catch(() => {});
    console.error(`[sage-qa] FAIL ${profile.name}: ${error.stack ?? error.message}`);
    console.error(`[sage-qa] Artifacts: ${artifacts.runDirectory}`);
    process.exitCode = 1;
  } finally {
    await browser?.close().catch(() => {});
  }
};

await main();
