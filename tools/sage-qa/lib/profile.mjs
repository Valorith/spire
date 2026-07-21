import fs from 'node:fs/promises';
import path from 'node:path';
import { asBoolean, asNumber } from './args.mjs';

const DEFAULT_PROFILE = {
  schemaVersion: 1,
  route: '/sage',
  viewport: { width: 1280, height: 720 },
  zoneValidation: {
    enabled: true,
    zones: ['blackburrow'],
    cycles: 1,
    timeoutMs: 240000,
    isolateZones: true,
  },
  raceAudit: {
    enabled: true,
    // Structural QA should validate the exact cached artifact used by normal
    // zone rendering. Missing artifacts are still generated on demand; a
    // destructive all-source refresh is an explicit archive diagnostic.
    forceRefresh: false,
    bootstrapZone: 'blackburrow',
    batchSize: 12,
    timeoutMs: 360000,
    modelSelection: { mode: 'explicit', models: [] },
  },
  staticTextureAudit: { enabled: true, timeoutMs: 120000 },
  visualSamples: [],
  visualValidation: {
    surface: 'race-audit',
    // Archive generation may legitimately need the longer race-audit timeout,
    // but a cached visual sample should never be allowed to stall a campaign
    // for that entire window.
    timeoutMs: 120000,
    repetitions: 2,
    seed: 1517166630,
    fixedAnimationFraction: 0.35,
    minimumMeshCount: 1,
    minimumVertexCount: 3,
    minimumExtent: 0.001,
    maximumBoundsAspectRatio: 80,
    minimumStaticBoundsRatio: 0.15,
    maximumStaticBoundsRatio: 5,
    minimumForegroundPixels: 500,
    maximumWhitePixelRatio: null,
    requireFullMaterialCoverage: true,
    requireArmsDown: false,
    requireAnimationMotion: true,
    minimumAnimationPoseDelta: 0.00001,
    minimumAnimationFrameCount: 3,
    maximumArmVerticalRatio: -0.3,
    maximumRepeatBoundsDelta: 0.025,
    maximumRepeatPixelDelta: 0.04,
    approvedBaselinePath: 'tools/sage-qa/baselines/model-regression.json',
    requireApprovedBaseline: false,
    maximumApprovedPixelDelta: 0.035,
    maximumApprovedHeadPixelDelta: 0.025,
    maximumApprovedForegroundBoundsDelta: 0.06,
  },
  soak: {
    enabled: false,
    warmupCycles: 1,
    resourceKeys: ['meshes', 'materials', 'textures', 'skeletons', 'animationGroups'],
    resourceTolerancePercent: 2,
    resourceToleranceAbsolute: 4,
    maxJsHeapGrowthMB: 384,
  },
  memory: {
    maxUsedPercent: 88,
    minFreeMB: 4096,
    maxRunnerRssMB: 2048,
    maxRunnerExternalMB: 1536,
    checkAttempts: 2,
    settleMs: 2000,
  },
  artifacts: {
    screenshotMode: 'failures',
    traceMode: 'failures',
    maxTracedZoneReports: 12,
    keepRuns: 10,
    maxTotalMB: 2048,
  },
  diagnostics: {
    failOnPageErrors: true,
    failOnConsoleErrors: true,
    failOnRequestFailures: true,
    failOnHttpErrors: true,
  },
};

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const MODEL_REVIEW_RESPONSES = new Set([
  null,
  'nothing-visible',
  'model-distorted',
  'head-missing',
  'improper-animation',
  'no-animation',
  't-pose',
  'head-mesh-upside-down',
  'other',
]);

export const deepMerge = (base, override) => {
  if (!isObject(base) || !isObject(override)) return override ?? base;
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    result[key] = isObject(value) && isObject(base[key])
      ? deepMerge(base[key], value)
      : value;
  }
  return result;
};

const pathExists = (candidate) => fs.access(candidate).then(() => true).catch(() => false);

export const resolveEqDirectory = async ({ requested, env = process.env } = {}) => {
  const candidates = [
    requested,
    env.SAGE_EQ_DIR,
    'C:/EQEmuCW-Live',
    'C:/EQEmuCW',
  ].filter(Boolean);

  for (const candidate of candidates) {
    const absolute = path.resolve(candidate);
    if (
      await pathExists(path.join(absolute, 'eqsage', 'models')) &&
      await pathExists(path.join(absolute, 'eqsage', 'textures'))
    ) {
      return absolute;
    }
  }
  throw new Error('No EQ directory with eqsage/models and eqsage/textures was found. Pass --eq-dir <path>.');
};

const normalizeZones = (zones) => [...new Set((zones ?? [])
  .map((zone) => `${zone}`.trim().toLowerCase())
  .filter(Boolean))];

export const filterVisualSamples = (samples, requestedModels) => {
  const requested = new Set(normalizeZones(
    Array.isArray(requestedModels)
      ? requestedModels
      : `${requestedModels ?? ''}`.split(',')
  ));
  return (samples ?? []).filter((sample) =>
    requested.has(`${sample?.model ?? ''}`.trim().toLowerCase())
  );
};

export const validateProfile = (profile) => {
  const errors = [];
  if (profile.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (!profile.name) errors.push('name is required');
  if (profile.zoneValidation.enabled && profile.zoneValidation.zones.length === 0) {
    errors.push('zoneValidation.zones must contain at least one zone');
  }
  if (profile.zoneValidation.cycles < 1) errors.push('zoneValidation.cycles must be at least 1');
  if (typeof profile.zoneValidation.isolateZones !== 'boolean') {
    errors.push('zoneValidation.isolateZones must be a boolean');
  }
  if (typeof profile.raceAudit.forceRefresh !== 'boolean') {
    errors.push('raceAudit.forceRefresh must be a boolean');
  }
  if (profile.raceAudit.enabled && profile.raceAudit.batchSize < 1) {
    errors.push('raceAudit.batchSize must be at least 1');
  }
  if (!['explicit', 'available', 'playable', 'all-mapped'].includes(profile.raceAudit.modelSelection.mode)) {
    errors.push('raceAudit.modelSelection.mode is invalid');
  }
  if (!['never', 'final', 'failures', 'always'].includes(profile.artifacts.screenshotMode)) {
    errors.push('artifacts.screenshotMode is invalid');
  }
  if (!['never', 'failures', 'always'].includes(profile.artifacts.traceMode)) {
    errors.push('artifacts.traceMode is invalid');
  }
  if (profile.artifacts.maxTracedZoneReports < 0) {
    errors.push('artifacts.maxTracedZoneReports must be at least 0');
  }
  if (Number(profile.visualValidation?.repetitions) < 2) {
    errors.push('visualValidation.repetitions must be at least 2');
  }
  if (Number(profile.visualValidation?.timeoutMs) < 1000) {
    errors.push('visualValidation.timeoutMs must be at least 1000');
  }
  if (!['race-audit', 'model-review'].includes(profile.visualValidation?.surface)) {
    errors.push('visualValidation.surface must be race-audit or model-review');
  }
  for (const [index, sample] of (profile.visualSamples ?? []).entries()) {
    if (
      Object.hasOwn(sample, 'expectedAutomatedResponse') &&
      !MODEL_REVIEW_RESPONSES.has(sample.expectedAutomatedResponse)
    ) {
      errors.push(
        `visualSamples[${index}].expectedAutomatedResponse is invalid`
      );
    }
  }
  if (
    Number(profile.visualValidation?.fixedAnimationFraction) < 0 ||
    Number(profile.visualValidation?.fixedAnimationFraction) > 1
  ) {
    errors.push('visualValidation.fixedAnimationFraction must be between 0 and 1');
  }
  if (Number(profile.visualValidation?.maximumRepeatBoundsDelta) < 0) {
    errors.push('visualValidation.maximumRepeatBoundsDelta must be at least 0');
  }
  if (Number(profile.visualValidation?.maximumRepeatPixelDelta) < 0) {
    errors.push('visualValidation.maximumRepeatPixelDelta must be at least 0');
  }
  for (const key of [
    'minimumAnimationPoseDelta',
    'minimumAnimationFrameCount',
    'maximumApprovedPixelDelta',
    'maximumApprovedHeadPixelDelta',
    'maximumApprovedForegroundBoundsDelta',
  ]) {
    if (Number(profile.visualValidation?.[key]) < 0) {
      errors.push(`visualValidation.${key} must be at least 0`);
    }
  }
  if (
    profile.visualValidation?.requireApprovedBaseline === true &&
    !`${profile.visualValidation?.approvedBaselinePath ?? ''}`.trim()
  ) {
    errors.push('visualValidation.approvedBaselinePath is required when approved baselines are enforced');
  }
  if (
    profile.soak?.enabled &&
    profile.zoneValidation.cycles < Number(profile.soak.warmupCycles ?? 1) + 2
  ) {
    errors.push('zoneValidation.cycles must provide warmup, baseline, and comparison cycles when soak is enabled');
  }
  if (profile.memory.maxUsedPercent <= 0 || profile.memory.maxUsedPercent > 100) {
    errors.push('memory.maxUsedPercent must be between 1 and 100');
  }
  if (profile.memory.maxRunnerRssMB <= 0) errors.push('memory.maxRunnerRssMB must be greater than 0');
  if (profile.memory.maxRunnerExternalMB <= 0) errors.push('memory.maxRunnerExternalMB must be greater than 0');
  if (errors.length) throw new Error(`Invalid Sage QA profile:\n- ${errors.join('\n- ')}`);
  return profile;
};

export const loadProfile = async ({ repoRoot, profile: profileName = 'smoke', args = {} }) => {
  const profilePath = profileName.endsWith('.json') || profileName.includes('/') || profileName.includes('\\')
    ? path.resolve(profileName)
    : path.join(repoRoot, 'tools', 'sage-qa', 'profiles', `${profileName}.json`);
  const loaded = JSON.parse(await fs.readFile(profilePath, 'utf8'));
  const merged = deepMerge(DEFAULT_PROFILE, loaded);

  if (args.cycles !== undefined) merged.zoneValidation.cycles = Math.max(1, Math.trunc(asNumber(args.cycles, 1)));
  if (args.zones !== undefined) {
    merged.zoneValidation.zones = `${args.zones}`.split(',');
  }
  if (args.timeoutMs !== undefined) merged.zoneValidation.timeoutMs = Math.max(1000, asNumber(args.timeoutMs, merged.zoneValidation.timeoutMs));
  if (args.batchSize !== undefined) merged.raceAudit.batchSize = Math.max(1, Math.trunc(asNumber(args.batchSize, merged.raceAudit.batchSize)));
  if (args.raceModels !== undefined) {
    merged.raceAudit.modelSelection = {
      mode: 'explicit',
      models: `${args.raceModels}`.split(','),
    };
  }
  if (args.zoneValidation !== undefined) merged.zoneValidation.enabled = asBoolean(args.zoneValidation, merged.zoneValidation.enabled);
  if (args.raceAudit !== undefined) merged.raceAudit.enabled = asBoolean(args.raceAudit, merged.raceAudit.enabled);
  if (args.raceForceRefresh !== undefined) {
    merged.raceAudit.forceRefresh = asBoolean(
      args.raceForceRefresh,
      merged.raceAudit.forceRefresh
    );
  }
  if (args.staticTextureAudit !== undefined) merged.staticTextureAudit.enabled = asBoolean(args.staticTextureAudit, merged.staticTextureAudit.enabled);
  if (args.headed !== undefined) merged.headed = asBoolean(args.headed, false);
  if (args.visualModels !== undefined) {
    merged.visualSamples = filterVisualSamples(
      merged.visualSamples,
      args.visualModels
    );
  }
  if (args.visualSurface !== undefined) {
    merged.visualValidation.surface = `${args.visualSurface}`.trim().toLowerCase();
  }

  merged.zoneValidation.zones = normalizeZones(merged.zoneValidation.zones);
  merged.raceAudit.modelSelection.models = normalizeZones(merged.raceAudit.modelSelection.models);
  merged.profilePath = profilePath;
  return validateProfile(merged);
};

export const DEFAULTS = DEFAULT_PROFILE;
