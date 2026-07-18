import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { parseArgs } from '../lib/args.mjs';
import { aggregateRaceAudits, aggregateZoneValidation, analyzeSoak } from '../lib/aggregate.mjs';
import { createRunDirectory, pruneRuns, writeText } from '../lib/artifacts.mjs';
import { buildCoverageManifest, resolveModelSelection } from '../lib/coverage.mjs';
import { evaluateMemoryBudget } from '../lib/memory.mjs';
import { getBrowserLaunchOptions, summarizeTelemetry } from '../lib/playwright-runner.mjs';
import {
  deepMerge,
  filterVisualSamples,
  loadProfile,
  validateProfile,
} from '../lib/profile.mjs';
import { renderHtmlReport } from '../lib/report.mjs';
import { compactRunSummary } from '../lib/summary.mjs';
import {
  collectModuleSpecifiers,
  verifyServedEmbedEntry,
  waitForModuleGraphReady,
} from '../lib/server-readiness.mjs';
import { buildRaceAuditUrl, buildZoneValidationUrl } from '../lib/urls.mjs';
import {
  compareApprovedVisualBaseline,
  comparePreviewEvidence,
  createApprovedVisualBaseline,
  evaluatePreviewEvidence,
  evaluateVisualBaselineApprovalEligibility,
  runVisualInvariantCanaries,
  visualBaselineKey,
} from '../lib/visual-invariants.mjs';
import {
  getCharacterAnimationCompatibility,
  STATIC_POSE_ONLY_CHARACTER_MODELS,
  shouldUseNativeCharacterPose,
} from '../../../frontend/eqsage-embed/sage/lib/util/character-animation-policy.js';
import {
  getCharacterHeadOrientationPolicy,
} from '../../../frontend/eqsage-embed/sage/lib/util/character-texture-orientation.js';
import {
  evaluateAppearanceVariant,
  evaluateFaceVariantDeterminism,
  isCharacterAppearanceMaterialName,
  isKnownEffectOnlyCharacterModel,
} from '../../../frontend/eqsage-embed/src/viewer/helpers/appearanceValidation.js';
import {
  evaluateAnimatedBoundsSafety,
  evaluateHeadRotationSafety,
  evaluateCharacterAnimationReadiness,
  isStaticPoseOnlyCharacterModel,
  inspectAnimationGroupVitality,
  retargetDetachedAnimationTargets,
  selectPreferredVisualAnimationGroup,
} from '../../../frontend/eqsage-embed/src/viewer/helpers/animationValidation.js';
import {
  evaluateNameplatePlacement,
} from '../../../frontend/eqsage-embed/src/viewer/helpers/nameplateValidation.js';
import {
  getCharacterArchiveBaseModelName,
  getCharacterBodyModelVariation,
  getCharacterSourceFamilyStem,
  orderCharacterModelSourceFiles,
  PREVIEW_ALIAS_FIRST_MODELS,
  PREVIEW_CLIENT_FALLBACKS,
} from '../../../frontend/eqsage-embed/src/viewer/common/raceModelResolution.js';
import {
  applyTextureAnimationFrame,
  getMaterialBaseColorTexture,
  isTextureAnimationFrameReady,
  resolveTextureAnimationFrameUrl,
} from '../../../frontend/eqsage-embed/src/viewer/helpers/textureAnimation.js';

test('parseArgs supports aliases, values, booleans, and negated flags', () => {
  assert.deepEqual(
    parseArgs(['-p', 'matrix', '--cycles=3', '--headed', '--no-race-audit', 'extra']),
    {
      positional: ['extra'],
      profile: 'matrix',
      cycles: '3',
      headed: true,
      raceAudit: false,
    }
  );
});

test('zone texture animation resolves frames beside the GLB base texture', () => {
  assert.equal(
    resolveTextureAnimationFrameUrl(
      { url: '/eq/textures/leaf01.bmp' },
      'leaf02.bmp'
    ),
    '/eq/textures/leaf02.bmp'
  );
  assert.equal(
    resolveTextureAnimationFrameUrl({ name: 'water01.bmp' }, 'water02.bmp'),
    '/eq/textures/water02.bmp'
  );
  assert.equal(
    resolveTextureAnimationFrameUrl({}, '/eq/textures/fire02.bmp'),
    '/eq/textures/fire02.bmp'
  );
});

test('zone texture animation never replaces a valid frame with an unresolved frame', () => {
  const originalInternalTexture = { isReady: true, id: 'original' };
  const targetTexture = { _texture: originalInternalTexture };
  const pendingFrame = {
    _texture: { isReady: false, id: 'pending' },
    isReady: () => false,
  };
  assert.equal(isTextureAnimationFrameReady(pendingFrame), false);
  assert.equal(applyTextureAnimationFrame(targetTexture, pendingFrame), false);
  assert.equal(targetTexture._texture, originalInternalTexture);

  const readyInternalTexture = { isReady: true, id: 'ready' };
  const readyFrame = {
    _texture: readyInternalTexture,
    isReady: () => true,
  };
  assert.equal(applyTextureAnimationFrame(targetTexture, readyFrame), true);
  assert.equal(targetTexture._texture, readyInternalTexture);
});

test('zone texture animation targets only the material base-color slot', () => {
  const albedoTexture = { name: 'albedo' };
  const normalTexture = { name: 'normal' };
  assert.equal(
    getMaterialBaseColorTexture({
      albedoTexture,
      getActiveTextures: () => [normalTexture],
    }),
    albedoTexture
  );
  assert.equal(
    getMaterialBaseColorTexture({
      diffuseTexture: albedoTexture,
      getActiveTextures: () => [normalTexture],
    }),
    albedoTexture
  );
});

test('placed zone objects do not use a distance-based null LOD', async () => {
  const controllerSource = await fs.readFile(
    path.resolve('frontend/eqsage-embed/src/viewer/controllers/ZoneController.js'),
    'utf8'
  );
  const instantiateObjectsSource = controllerSource.slice(
    controllerSource.indexOf('async instantiateObjects('),
    controllerSource.indexOf('async addTextureAnimations(')
  );

  assert.doesNotMatch(instantiateObjectsSource, /addLODLevel\s*\(/);
});

test('deepMerge preserves nested defaults while applying profile overrides', () => {
  assert.deepEqual(
    deepMerge({ a: { b: 1, c: 2 }, d: 3 }, { a: { b: 9 } }),
    { a: { b: 9, c: 2 }, d: 3 }
  );
});

test('visual sample filtering supports focused, case-insensitive reruns', () => {
  const samples = [{ model: 'qcf' }, { model: 'clm' }, { model: 'clf' }];
  assert.deepEqual(
    filterVisualSamples(samples, 'CLF,qcf'),
    [{ model: 'qcf' }, { model: 'clf' }]
  );
});

test('model regression gives every audited race deterministic front and rear visual coverage', async () => {
  const profile = await loadProfile({
    repoRoot: process.cwd(),
    profile: 'model-regression',
    args: {},
  });
  const auditedModels = profile.raceAudit.modelSelection.models;

  assert.equal(profile.visualValidation.timeoutMs, 120000);
  assert.ok(
    profile.visualValidation.timeoutMs < profile.raceAudit.timeoutMs,
    'cached visual samples must fail faster than archive-generation audits'
  );

  for (const auditedModel of auditedModels) {
    const samples = profile.visualSamples.filter(
      ({ model }) => model.toLowerCase() === auditedModel.toLowerCase()
    );
    const headings = new Set(samples.map(({ heading = 0 }) => Number(heading)));

    assert.ok(
      headings.has(0),
      `${auditedModel} is audited but has no deterministic front visual sample`
    );
    assert.ok(
      headings.has(180),
      `${auditedModel} is audited but has no deterministic rear visual sample`
    );
  }
});

test('zone override replaces the profile zone list deterministically', async () => {
  const profile = await loadProfile({
    repoRoot: process.cwd(),
    profile: 'model-regression',
    args: { zones: 'POJUSTICE,blackburrow,pojustice' },
  });
  assert.deepEqual(profile.zoneValidation.zones, ['pojustice', 'blackburrow']);
});

test('rear visual samples have distinct deterministic URLs and baseline keys', () => {
  const sample = {
    model: 'goj',
    face: 0,
    texture: 0,
    helmTexture: 0,
    heading: 180,
  };
  const url = new URL(buildRaceAuditUrl({
    baseUrl: 'http://127.0.0.1:8080',
    route: '/sage',
    eqDirectory: 'C:\\EQ',
    bootstrapZone: 'pojustice',
    models: ['goj'],
    cacheBust: 'rear-test',
    preview: sample,
  }));
  assert.equal(url.searchParams.get('sageRaceFacePreviewHeading'), '180');
  assert.equal(url.searchParams.get('sageRaceAuditForceRefresh'), '0');
  assert.equal(
    visualBaselineKey(sample),
    'goj|face=0|texture=0|helm=0|heading=180'
  );
  assert.equal(
    visualBaselineKey({ ...sample, heading: 0 }),
    'goj|face=0|texture=0|helm=0|heading=0'
  );
});

test('classic body texture variants resolve to deterministic archive assets', () => {
  assert.equal(getCharacterBodyModelVariation('HUM', 0), 'hum');
  assert.equal(getCharacterBodyModelVariation('hum', 16), 'hum01');
  assert.equal(getCharacterBodyModelVariation('huf', 23), 'huf02');
  assert.equal(getCharacterBodyModelVariation('qcf', 4), 'qcf');
  assert.equal(getCharacterArchiveBaseModelName('hum01'), 'hum');
  assert.equal(getCharacterArchiveBaseModelName('qcfhe06'), 'qcf');
  assert.equal(getCharacterSourceFamilyStem('globalhum_chr.s3d'), 'globalhum_chr');
  assert.equal(getCharacterSourceFamilyStem('globalhum_chr2.s3d'), 'globalhum_chr');
  assert.equal(getCharacterSourceFamilyStem('globalhum.eqg'), null);
});

test('dedicated character archives are processed before zone copies', () => {
  assert.deepEqual(
    orderCharacterModelSourceFiles('sdf', [
      'paludal_chr.s3d',
      'pojustice_chr.s3d',
      'SDF_CHR.S3D',
      'twilight_chr.s3d',
      'sdf_chr.s3d',
    ]),
    [
      'sdf_chr.s3d',
      'paludal_chr.s3d',
      'pojustice_chr.s3d',
      'twilight_chr.s3d',
    ]
  );
  assert.deepEqual(
    orderCharacterModelSourceFiles('dam', [
      'global_chr.s3d',
      'globaldam_chr.s3d',
    ]),
    ['globaldam_chr.s3d', 'global_chr.s3d']
  );
  assert.deepEqual(
    orderCharacterModelSourceFiles('kob', [
      'akanon_chr.s3d',
      'warrens_chr.s3d',
      'poknowledge_chr.s3d',
      'crushbone_chr.s3d',
    ]),
    [
      'poknowledge_chr.s3d',
      'akanon_chr.s3d',
      'crushbone_chr.s3d',
      'warrens_chr.s3d',
    ]
  );
});

test('skeleton animation readiness rejects missing and bind-pose-only clips', () => {
  assert.deepEqual(
    evaluateCharacterAnimationReadiness({
      skeletonCount: 1,
      animationVitality: { playableGroupCount: 0, visuallyPosedGroupCount: 0 },
    }),
    { pass: false, violations: ['missing-playable-animation'] }
  );
  assert.deepEqual(
    evaluateCharacterAnimationReadiness({
      skeletonCount: 1,
      animationVitality: { playableGroupCount: 3, visuallyPosedGroupCount: 0 },
    }),
    { pass: false, violations: ['animation-matches-bind-pose'] }
  );
  assert.equal(
    evaluateCharacterAnimationReadiness({
      skeletonCount: 1,
      animationVitality: { playableGroupCount: 0, visuallyPosedGroupCount: 0 },
      staticPoseFallbackAvailable: true,
    }).pass,
    true
  );
});

test('animated bounds safety rejects exploding geometry without penalizing large models', () => {
  const exploding = evaluateAnimatedBoundsSafety({
    baselineMaxDimension: 12,
    currentMaxDimension: 1522,
  });
  assert.equal(exploding.pass, false);
  assert.ok(exploding.ratio > 100);

  const stableLargeModel = evaluateAnimatedBoundsSafety({
    baselineMaxDimension: 280,
    currentMaxDimension: 350,
  });
  assert.equal(stableLargeModel.pass, true);
  assert.equal(stableLargeModel.measurable, true);
});

test('head rotation safety rejects upside-down animation samples', () => {
  const identity = { x: 0, y: 0, z: 0, w: 1 };
  const normalIdle = { x: Math.sin(Math.PI / 12), y: 0, z: 0, w: Math.cos(Math.PI / 12) };
  const inverted = { x: 1, y: 0, z: 0, w: 0 };

  assert.equal(evaluateHeadRotationSafety({
    baselineQuaternion: identity,
    currentQuaternion: normalIdle,
  }).pass, true);
  const result = evaluateHeadRotationSafety({
    baselineQuaternion: identity,
    currentQuaternion: inverted,
  });
  assert.equal(result.pass, false);
  assert.ok(result.angleDegrees > 170);
});

test('spawn head safety samples deforming head bones, not attachment helpers', async () => {
  const source = await fs.readFile(
    path.resolve('frontend/eqsage-embed/src/viewer/models/BabylonSpawn.js'),
    'utf8'
  );
  assert.match(source, /PRIMARY_HEAD_BONE_PATTERN = \/\^\(\?:hehead\|head\)\$\/i/);
  assert.doesNotMatch(source, /PRIMARY_HEAD_BONE_PATTERN[^\n]+head_point/);
});

test('appearance swaps reject semantic object material names', () => {
  assert.equal(isCharacterAppearanceMaterialName('HUMCH0001'), true);
  assert.equal(isCharacterAppearanceMaterialName('HUFUAsk01'), true);
  assert.equal(isCharacterAppearanceMaterialName('QCFHE0101'), true);
  assert.equal(isCharacterAppearanceMaterialName('ERBEDSIDE'), false);
  assert.equal(isCharacterAppearanceMaterialName('ERBEDTOP'), false);
  assert.equal(isCharacterAppearanceMaterialName('PRECRATE2'), false);
});

test('S3D character exporter preserves alternate body mesh filenames', async () => {
  const source = await fs.readFile(
    path.resolve('frontend/eqsage-embed/sage/lib/s3d/s3d-decoder.js'),
    'utf8'
  );
  assert.match(source, /writeEQFile\(path, `\$\{baseName\}\.glb`, bytes\)/);
  assert.doesNotMatch(
    source,
    /writeEQFile\(path, `\$\{skeleton\.modelBase\}\.glb`, bytes\)/
  );
});

test('preview invariant accepts only a proven high-texture body compatibility path', () => {
  const compatible = {
    available: true,
    renderPass: true,
    meshCount: 1,
    vertexCount: 100,
    runtimeBounds: { width: 1, height: 2, depth: 1 },
    staticBounds: { width: 1, height: 2, depth: 1 },
    materialSlotCount: 3,
    texturedSlotCount: 3,
    untexturedRenderedMaterialCount: 0,
    pendingTextureCount: 0,
    suspiciousTinyTextureCount: 0,
    fallbackTextureCount: 0,
    headOrientationRiskCount: 0,
    requestedModelVariation: 'hum01',
    loadedModelVariation: 'hum',
    bodyVariantFallback: true,
    bodyVariantTextureFallbackApplied: true,
    bodyVariantTextureFallbackAppliedCount: 3,
    bodyVariantTextureCoverageRequiredCount: 7,
    bodyVariantTextureCoverageAppliedCount: 7,
    secondaryHeadBoneRemapFailureCount: 0,
    nonFiniteBoneMatrixCount: 0,
    pixels: { foregroundPixelCount: 1000, whitePixelRatio: 0 },
    skeletonCount: 0,
    animationMotion: { available: false },
  };
  assert.equal(evaluatePreviewEvidence(compatible).pass, true);
  compatible.bodyVariantTextureFallbackApplied = false;
  assert.equal(evaluatePreviewEvidence(compatible).pass, false);
  compatible.bodyVariantTextureFallbackApplied = true;
  compatible.bodyVariantTextureFallbackAppliedCount = 0;
  assert.equal(evaluatePreviewEvidence(compatible).pass, true);
  compatible.bodyVariantTextureCoverageAppliedCount = 0;
  compatible.bodyVariantTextureCoverageRequiredCount = 0;
  assert.equal(evaluatePreviewEvidence(compatible).pass, false);
  compatible.bodyVariantTextureFallbackAppliedCount = 3;
  compatible.bodyVariantTextureCoverageRequiredCount = 7;
  compatible.bodyVariantTextureCoverageAppliedCount = 6;
  assert.equal(evaluatePreviewEvidence(compatible).pass, false);
});

test('appearance invariant rejects one untextured rendered region', () => {
  const result = evaluateAppearanceVariant({
    renderPass: true,
    materialSlotCount: 5,
    effectOnlyMaterialCount: 0,
    texturedSlotCount: 4,
    untexturedRenderedMaterialCount: 1,
    pendingTextureCount: 0,
    suspiciousTinyTextureCount: 0,
    headOrientationRiskCount: 0,
    nonFiniteBoneMatrixCount: 0,
    headTextureSignatures: ['humhe00:humhe0001.png'],
  }, { requireHeadTexture: true });
  assert.equal(result.invariantPass, false);
  assert.ok(result.invariantViolations.includes('untextured-rendered-material'));
});

test('classic face invariant requires eight distinct texture signatures', () => {
  const valid = Array.from({ length: 8 }, (_, face) => ({
    face,
    headTextureSignatures: [`hum-face-${face}`],
  }));
  assert.equal(evaluateFaceVariantDeterminism(valid).pass, true);
  const duplicate = valid.map((variant) => ({ ...variant }));
  duplicate[7].headTextureSignatures = duplicate[0].headTextureSignatures;
  const result = evaluateFaceVariantDeterminism(duplicate);
  assert.equal(result.pass, false);
  assert.ok(result.violations.includes('face-variant-texture-duplicate'));
});

test('visual mutation canaries reject white, exploded, and inconsistent evidence', () => {
  const result = runVisualInvariantCanaries();
  assert.equal(result.pass, true);
  assert.deepEqual(
    result.cases.map(({ name, rejected }) => [name, rejected]),
    [
      ['white-material', true],
      ['exploded-bounds', true],
      ['nondeterministic-repeat', true],
      ['approved-baseline-orientation-drift', true],
      ['motionless-animation', true],
      ['body-variant-fallback', true],
      ['secondary-head-remap-failure', true],
      ['detached-animation-donor', true],
      ['unlocked-animation-donor-head', true],
      ['attached-animation-donor-not-playing', true],
      ['misbound-head-geometry', true],
    ]
  );
  assert.deepEqual(
    result.acceptedCases.map(({ name, accepted }) => [name, accepted]),
    [['coordinate-axis-remap', true]]
  );
});

test('approved visual baseline rejects a consistently changed appearance', () => {
  const evidence = {
    meshCount: 3,
    vertexCount: 300,
    skeletonCount: 1,
    boneCount: 20,
    nativePoseOnly: false,
    animationMotion: {
      available: true,
      expectedMotion: true,
      moving: true,
      frameCount: 4,
      maximumPoseDelta: 0.2,
      nonFiniteValueCount: 0,
    },
    materialSignature: 'body|head',
    skeletonSignature: 'bi_l|bi_r|he',
    pixels: {
      foregroundBounds: { x: 0.3, y: 0.1, width: 0.4, height: 0.8 },
      whitePixelRatio: 0,
      signature: [10, 20, 30],
    },
  };
  const approved = createApprovedVisualBaseline(evidence);
  assert.equal(compareApprovedVisualBaseline(evidence, approved).pass, true);
  const changed = structuredClone(evidence);
  changed.pixels.signature = [240, 230, 220];
  const result = compareApprovedVisualBaseline(changed, approved);
  assert.equal(result.pass, false);
  assert.ok(result.violations.includes('approved-head-region-changed'));
  assert.equal(
    compareApprovedVisualBaseline(evidence, null, { requireApprovedBaseline: true }).pass,
    false
  );
});

test('baseline approval permits reviewed pixel drift but never failed invariants', () => {
  const reviewedDrift = {
    pass: false,
    observations: [{}, {}],
    auditPasses: [true, true],
    observationAnalyses: [{ pass: true }, { pass: true }],
    approvedBaselineAnalyses: [{ pass: false }, { pass: false }],
    repeatability: { pass: true },
  };
  assert.equal(evaluateVisualBaselineApprovalEligibility(reviewedDrift).pass, true);
  reviewedDrift.observationAnalyses[1] = { pass: false };
  assert.equal(evaluateVisualBaselineApprovalEligibility(reviewedDrift).pass, false);
});

test('preview evidence independently rejects a T-pose and repeat drift', () => {
  const base = {
    available: true,
    meshCount: 3,
    vertexCount: 300,
    runtimeBounds: { width: 2, height: 6, depth: 1.5 },
    staticBounds: { width: 2, height: 6, depth: 1.5 },
    untexturedRenderedMaterialCount: 0,
    pendingTextureCount: 0,
    fallbackTextureCount: 0,
    headOrientationRiskCount: 0,
    nonFiniteBoneMatrixCount: 0,
    skeletonCount: 1,
    boneCount: 20,
    nativePoseOnly: false,
    animationMotion: {
      available: true,
      expectedMotion: true,
      moving: true,
      frameCount: 4,
      maximumPoseDelta: 0.2,
      nonFiniteValueCount: 0,
    },
    materialSignature: 'body|head',
    skeletonSignature: 'bi_l|bi_r|he',
    leftArm: { available: true, verticalRatio: -0.8 },
    rightArm: { available: true, verticalRatio: -0.8 },
    pixels: { foregroundPixelCount: 5000, whitePixelRatio: 0.01, signature: [10, 20, 30] },
  };
  assert.equal(evaluatePreviewEvidence(base, { requireArmsDown: true }).pass, true);
  const tPose = structuredClone(base);
  tPose.leftArm.verticalRatio = 0;
  assert.equal(evaluatePreviewEvidence(tPose, { requireArmsDown: true }).pass, false);
  const nearTPose = structuredClone(base);
  nearTPose.leftArm.verticalRatio = -0.2;
  assert.equal(
    evaluatePreviewEvidence(nearTPose, { requireArmsDown: true }).pass,
    false
  );
  const shallowCompactPose = structuredClone(base);
  shallowCompactPose.compactExpected = true;
  shallowCompactPose.nativePoseOnly = true;
  shallowCompactPose.neutralized = true;
  shallowCompactPose.leftArm.verticalRatio = -0.4;
  assert.equal(evaluatePreviewEvidence(shallowCompactPose, {
    requireArmsDown: true,
    maximumArmVerticalRatio: -0.5,
  }).pass, false);
  const drift = structuredClone(base);
  drift.runtimeBounds.width = 2.4;
  assert.equal(comparePreviewEvidence([base, drift]).pass, false);
  const motionless = structuredClone(base);
  motionless.animationMotion.moving = false;
  motionless.animationMotion.maximumPoseDelta = 0;
  const motionResult = evaluatePreviewEvidence(motionless);
  assert.equal(motionResult.pass, false);
  assert.ok(motionResult.violations.includes('animation-motionless'));
  const detachedDonor = structuredClone(base);
  detachedDonor.previewAnimationDonorExpected = true;
  detachedDonor.previewAnimationDonorPass = false;
  detachedDonor.previewAnimationDonorGroupCount = 0;
  detachedDonor.previewAnimationDonorTargetCount = 0;
  detachedDonor.previewAnimationDonorBindRelativeTargetCount = 0;
  const donorResult = evaluatePreviewEvidence(detachedDonor);
  assert.equal(donorResult.pass, false);
  assert.ok(
    donorResult.violations.includes(
      'preview-animation-donor-not-attached-to-instance'
    )
  );
  const unlockedDonorHead = structuredClone(base);
  unlockedDonorHead.previewAnimationDonorExpected = true;
  unlockedDonorHead.previewAnimationDonorPass = true;
  unlockedDonorHead.previewAnimationDonorGroupCount = 1;
  unlockedDonorHead.previewAnimationDonorTargetCount = 20;
  unlockedDonorHead.previewAnimationDonorBindRelativeTargetCount = 20;
  unlockedDonorHead.previewAnimationDonorBindLockedRotationTargetNames = [];
  const unlockedHeadResult = evaluatePreviewEvidence(unlockedDonorHead);
  assert.equal(unlockedHeadResult.pass, false);
  assert.ok(
    unlockedHeadResult.violations.includes(
      'preview-animation-donor-head-rotation-unlocked'
    )
  );
  const idleDonor = structuredClone(base);
  idleDonor.previewAnimationDonorExpected = true;
  idleDonor.previewAnimationDonorPass = true;
  idleDonor.previewAnimationDonorGroupCount = 1;
  idleDonor.previewAnimationDonorTargetCount = 20;
  idleDonor.previewAnimationDonorBindRelativeTargetCount = 20;
  idleDonor.previewAnimationDonorBindLockedRotationTargetNames = ['he'];
  idleDonor.animationMotion = {
    available: false,
    expectedMotion: false,
    moving: false,
    frameCount: 0,
    maximumPoseDelta: 0,
    nonFiniteValueCount: 0,
  };
  const idleDonorResult = evaluatePreviewEvidence(idleDonor);
  assert.equal(idleDonorResult.pass, false);
  assert.ok(idleDonorResult.violations.includes('animation-motionless'));
});

test('alias-first race refresh uses the resolved model source inventory', async () => {
  const source = await fs.readFile(
    path.resolve('frontend/eqsage-embed/src/components/validation/race-face-audit.jsx'),
    'utf8'
  );
  assert.match(
    source,
    /raceModelMetadata\[refreshModel\]\?\.sourceFiles\s*\?\?\s*entry\.sourceFiles/
  );
  assert.doesNotMatch(
    source,
    /refreshModel\s*===\s*entry\.model\s*\?\s*entry\.sourceFiles\s*:\s*\[\]/
  );
});

test('character animation policy accepts exact classic skeleton coverage', () => {
  const bones = Object.fromEntries(
    ['pepelvis', 'chchest', 'neneck', 'hehead', 'bibicepl', 'bibicepr'].map(
      (name) => [name, {}]
    )
  );
  const result = getCharacterAnimationCompatibility({
    targetPoseTracks: bones,
    donorPoseTracks: bones,
    nativeAnimationKeys: ['pos'],
  });
  assert.equal(result.exactCoverage, 1);
  assert.equal(result.useNativePoseOnly, false);
});

test('character animation policy isolates incompatible compact skeletons', () => {
  const targetPoseTracks = Object.fromEntries(
    ['pe', 'ch', 'ne', 'he', 'bi_l', 'bi_r', 'fo_l', 'fo_r'].map(
      (name) => [name, {}]
    )
  );
  const donorPoseTracks = Object.fromEntries(
    ['pepelvis', 'chchest', 'neneck', 'hehead', 'bibicepl', 'bibicepr'].map(
      (name) => [name, {}]
    )
  );
  assert.equal(shouldUseNativeCharacterPose({
    targetPoseTracks,
    donorPoseTracks,
    nativeAnimationKeys: ['pos'],
  }), true);
});

test('Coldain models are deterministically classified as native-pose-only', () => {
  assert.equal(isStaticPoseOnlyCharacterModel('com'), true);
  assert.equal(isStaticPoseOnlyCharacterModel('cof'), true);
  assert.equal(isStaticPoseOnlyCharacterModel('hum'), false);
});

test('known compact rigs are generation-order-independent native-pose models', () => {
  assert.deepEqual(
    [...STATIC_POSE_ONLY_CHARACTER_MODELS].sort(),
    ['clf', 'clm', 'cof', 'com', 'qcf', 'qcm']
  );
  assert.equal(isStaticPoseOnlyCharacterModel('QCF'), true);
  assert.equal(isStaticPoseOnlyCharacterModel('qcf01'), true);
  assert.equal(isStaticPoseOnlyCharacterModel('unknown', 'CLM'), true);
  assert.equal(isStaticPoseOnlyCharacterModel('hum', 'elf'), false);
});

test('effect-only models require a narrow explicit allowlist', () => {
  assert.equal(isKnownEffectOnlyCharacterModel('GSF'), true);
  assert.equal(isKnownEffectOnlyCharacterModel('gsm01'), true);
  assert.equal(isKnownEffectOnlyCharacterModel('nwm'), false);
  assert.equal(PREVIEW_CLIENT_FALLBACKS.gsf, undefined);
  assert.equal(PREVIEW_ALIAS_FIRST_MODELS.has('gsf'), false);
});

test('character animation policy preserves a model with native motion', () => {
  assert.equal(shouldUseNativeCharacterPose({
    targetPoseTracks: { pe: {}, ch: {}, ne: {}, he: {}, bi_l: {} },
    donorPoseTracks: { pepelvis: {}, chchest: {} },
    nativeAnimationKeys: ['pos', 'p01'],
  }), false);
});

test('visual animation selection rejects a constant p01 when a dynamic clip exists', () => {
  const target = { id: 'bone' };
  const group = (name, values) => ({
    name,
    targetedAnimations: [{
      target,
      animation: {
        targetProperty: 'rotationQuaternion',
        getKeys: () => values.map((value, frame) => ({ frame, value })),
      },
    }],
  });
  const pose = group('pos', [0]);
  const constantP01 = group('Clone of p01', [1, 1, 1]);
  const dynamicP02 = group('Clone of p02', [0, 0.5, 1]);

  assert.equal(
    inspectAnimationGroupVitality(constantP01, pose).dynamicTargetCount,
    0
  );
  assert.equal(
    selectPreferredVisualAnimationGroup([pose, constantP01, dynamicP02]),
    dynamicP02
  );
});

test('visual animation selection retains p01 when p01 changes over time', () => {
  const target = { id: 'bone' };
  const group = (name, values) => ({
    name,
    targetedAnimations: [{
      target,
      animation: {
        targetProperty: 'rotationQuaternion',
        getKeys: () => values.map((value, frame) => ({ frame, value })),
      },
    }],
  });
  const pose = group('pos', [0]);
  const dynamicP01 = group('Clone of p01', [0, 1]);
  const dynamicP02 = group('Clone of p02', [0, 2]);

  assert.equal(
    selectPreferredVisualAnimationGroup([pose, dynamicP01, dynamicP02]),
    dynamicP01
  );
});

test('visual animation selection prefers the classic neutral o01 idle over p01', () => {
  const target = { id: 'bone' };
  const group = (name, values) => ({
    name,
    targetedAnimations: [{
      target,
      animation: {
        targetProperty: 'rotationQuaternion',
        getKeys: () => values.map((value, frame) => ({ frame, value })),
      },
    }],
  });
  const pose = group('pos', [0]);
  const combatReadyP01 = group('Clone of p01', [0, 1]);
  const neutralO01 = group('Clone of o01', [0, 0.5]);

  assert.equal(
    selectPreferredVisualAnimationGroup([pose, combatReadyP01, neutralO01]),
    neutralO01
  );
});

test('visual animation selection prefers a native no-offset idle clip', () => {
  const target = { id: 'bone' };
  const group = (name, values) => ({
    name,
    targetedAnimations: [{
      target,
      animation: {
        targetProperty: 'rotationQuaternion',
        getKeys: () => values.map((value, frame) => ({ frame, value })),
      },
    }],
  });
  const swim = group('swim_ba_1_gbn.ani', [0, 1]);
  const idle = group('idle_ba_1_gbn.ani', [0, 2]);
  const idleNoOffset = group('idle_ba_1_gbn.ani-nooffset', [0, 3]);

  assert.equal(
    selectPreferredVisualAnimationGroup([swim, idle, idleNoOffset]),
    idleNoOffset
  );
});

test('validation preview animates and labels every spawn instead of one per model', async () => {
  const controllerSource = await fs.readFile(
    path.resolve('frontend/eqsage-embed/src/viewer/controllers/SpawnController.js'),
    'utf8'
  );
  const spawnSource = await fs.readFile(
    path.resolve('frontend/eqsage-embed/src/viewer/models/BabylonSpawn.js'),
    'utf8'
  );
  const contextSource = await fs.readFile(
    path.resolve('frontend/eqsage-embed/src/components/zone/zone-context.jsx'),
    'utf8'
  );
  const raceAuditSource = await fs.readFile(
    path.resolve('frontend/eqsage-embed/src/components/validation/race-face-audit.jsx'),
    'utf8'
  );
  const previewFinalizationSource = controllerSource.slice(
    controllerSource.indexOf('const loadedSpawns = Object.values(this.spawns)'),
    controllerSource.indexOf('} finally {', controllerSource.indexOf('const loadedSpawns = Object.values(this.spawns)'))
  );

  assert.doesNotMatch(previewFinalizationSource, /liveModelNames/);
  assert.match(previewFinalizationSource, /loadedSpawn\.startInitialAnimation/);
  assert.match(previewFinalizationSource, /loadedSpawns\[index\]\.createNameplate/);
  assert.match(controllerSource, /neutralIdleSelectionFailureCount/);
  assert.match(spawnSource, /retainSelectedVisualAnimationResources\(anim\)/);
  assert.match(spawnSource, /this\.animationGroups = \[selectedAnimationGroup\]/);
  assert.match(controllerSource, /excessAnimationGroupCount/);
  assert.match(controllerSource, /policyExtras\?\.spireNativePoseOnly !== true/);
  assert.match(controllerSource, /missing-playable-animation/);
  assert.match(controllerSource, /stopAfterFirstSuccessfulSource: true/);
  assert.match(controllerSource, /instanceContainer\.__spireNativePoseOnly/);
  assert.match(spawnSource, /previewAnimationDonor\?\.expected === true/);
  assert.match(spawnSource, /instanceContainer\.__spireNativePoseOnly === true/);
  assert.match(contextSource, /visualStats\.excessAnimationGroupCount/);
  assert.match(raceAuditSource, /loadValidatedCharacterContainer/);
  assert.match(raceAuditSource, /getFirstAssetContainer/);
  assert.match(raceAuditSource, /Never hand it the SpawnController's shared live cache entry/);
  assert.match(raceAuditSource, /loadAssetContainerFromEQ/);
});

test('appearance materials share one decode and expose asynchronous failures to QA', async () => {
  const spawnSource = await fs.readFile(
    path.resolve('frontend/eqsage-embed/src/viewer/models/BabylonSpawn.js'),
    'utf8'
  );
  const controllerSource = await fs.readFile(
    path.resolve('frontend/eqsage-embed/src/viewer/controllers/SpawnController.js'),
    'utf8'
  );
  const contextSource = await fs.readFile(
    path.resolve('frontend/eqsage-embed/src/components/zone/zone-context.jsx'),
    'utf8'
  );

  assert.match(spawnSource, /pendingAppearanceMaterialsByScene = new WeakMap/);
  assert.match(spawnSource, /const getAppearanceTextureData = async/);
  assert.match(spawnSource, /APPEARANCE_TEXTURE_DECODE_ATTEMPTS = 2/);
  assert.match(spawnSource, /APPEARANCE_TEXTURE_DECODE_TIMEOUT_MS = 10000/);
  assert.match(spawnSource, /const startAppearanceTextureDecode/);
  assert.match(spawnSource, /URL\.createObjectURL/);
  assert.match(spawnSource, /new Blob\(\[textureData\], \{ type: 'image\/png' \}\)/);
  assert.match(spawnSource, /URL\.revokeObjectURL/);
  assert.match(spawnSource, /texture\?\.dispose\?\.\(\)/);
  assert.match(spawnSource, /newFullName = null;[\s\S]*getBodyVariantCoverageTextureName/);
  assert.match(spawnSource, /spireAppearanceTexturePending: true/);
  assert.match(spawnSource, /spireAppearanceTextureDecodeFailed = true/);
  assert.match(spawnSource, /appearanceTextureDecodeFailureCount\+\+/);
  assert.match(controllerSource, /material\.metadata\?\.spireAppearanceTextureDecodeFailed/);
  assert.match(controllerSource, /appearanceTexturePendingCount/);
  assert.match(contextSource, /requiredStableReadyPolls = 3/);
  assert.match(contextSource, /visualStats\.validationSettle/);
  assert.match(contextSource, /visualStats\.appearanceTextureDecodeFailureCount/);
});

test('runtime animation QA deduplicates expensive frame seeks without rendering per sample', async () => {
  const contextSource = await fs.readFile(
    path.resolve('frontend/eqsage-embed/src/components/zone/zone-context.jsx'),
    'utf8'
  );
  const probeSource = contextSource.slice(
    contextSource.indexOf('const getPlayingSpawnAnimationProbes'),
    contextSource.indexOf('const getMaterialSlots')
  );

  assert.match(probeSource, /const observedModelAssets = new Set\(\)/);
  assert.match(probeSource, /observedModelAssets\.has\(modelAssetKey\)/);
  assert.match(probeSource, /spawn\.resolvedModelAsset/);
  assert.doesNotMatch(probeSource, /playingGroups\[0\]\?\.name/);
  assert.equal((probeSource.match(/scene\?\.render\?\.\(\)/g) ?? []).length, 1);
});

test('zone QA isolates normal zones, fails fast on tab crashes, and guards memory between them', async () => {
  const runnerSource = await fs.readFile(
    path.resolve('tools/sage-qa/lib/playwright-runner.mjs'),
    'utf8'
  );
  const runSource = await fs.readFile(
    path.resolve('tools/sage-qa/run.mjs'),
    'utf8'
  );
  const zoneSource = runnerSource.slice(
    runnerSource.indexOf('export const runZoneValidation'),
    runnerSource.indexOf('export const runRaceAuditBatches')
  );

  assert.match(zoneSource, /config\.isolateZones !== false/);
  assert.match(zoneSource, /page\.once\('crash'/);
  assert.match(zoneSource, /await beforeZone\?\./);
  assert.match(runSource, /before-zone-validation-\$\{index \+ 1\}/);
});

test('validation harness explicitly remounts repeated single-zone cycles', async () => {
  const source = await fs.readFile(
    path.resolve('frontend/eqsage-embed/src/components/validation/validation-harness.jsx'),
    'utf8'
  );

  assert.match(source, /selectedZoneRef\.current === zoneName/);
  assert.match(source, /setSelectedZone\(null\)/);
  assert.match(source, /window\.setTimeout\(commitSelection, 50\)/);
  assert.match(source, /const commitSelection = \(\) => \{[\s\S]*setZoneDialogOpen\(false\);[\s\S]*setSelectedZone\(nextZone\)/);
});

test('visual preview stabilization falls back to the resolved face-preview alias', async () => {
  const source = await fs.readFile(
    path.resolve('tools/sage-qa/lib/playwright-runner.mjs'),
    'utf8'
  );
  const stabilizationSource = source.slice(
    source.indexOf('const stabilizePreview'),
    source.indexOf('const collectPreviewEvidence')
  );

  assert.match(stabilizationSource, /const previewSpawns = spawns\.filter/);
  assert.match(stabilizationSource, /\?\? previewSpawns\[0\] \?\? spawns\.find/);
});

test('detached donor animations are retargeted to the instantiated clone hierarchy', () => {
  const sourcePelvis = { name: 'pe' };
  const clonedRoot = { name: 'Clone of root' };
  const clonedPelvis = { name: 'Clone of pe' };
  const targetedAnimation = { target: sourcePelvis, animation: {} };
  const result = retargetDetachedAnimationTargets(
    [{ name: 'Clone of p01', targetedAnimations: [targetedAnimation] }],
    [clonedRoot, clonedPelvis]
  );

  assert.equal(targetedAnimation.target, clonedPelvis);
  assert.deepEqual(result, {
    detachedTargetCount: 1,
    retargetedTargetCount: 1,
    unresolvedTargetCount: 0,
  });
});

test('character head orientation preserves QCF integrated UVs without changing secondary heads', () => {
  const qcf = getCharacterHeadOrientationPolicy('QCFHE0001_MDF');
  const qcfFace = getCharacterHeadOrientationPolicy('QCFHEsk01_MDF');
  const qcfSecondary = getCharacterHeadOrientationPolicy('QCFHE0101_MDF');
  const qcm = getCharacterHeadOrientationPolicy('QCMHE0001_MDF');
  const brm = getCharacterHeadOrientationPolicy('BRMHE0001_MDF');
  const brmSecondary = getCharacterHeadOrientationPolicy('BRMHE0101_MDF');
  const fef = getCharacterHeadOrientationPolicy('FEFHE0001_MDF');
  const gff = getCharacterHeadOrientationPolicy('GFFHE0001_MDF');
  const shf = getCharacterHeadOrientationPolicy('SHFHE0001_MDF');
  assert.equal(qcf.isCharacterHead, true);
  assert.equal(qcf.usesNativeHeadUv, true);
  assert.equal(qcf.geometryUvFlipped, false);
  assert.equal(qcfFace.usesNativeHeadUv, true);
  assert.equal(qcfFace.geometryUvFlipped, false);
  assert.equal(qcfSecondary.usesNativeHeadUv, false);
  assert.equal(qcfSecondary.geometryUvFlipped, true);
  assert.equal(qcm.isCharacterHead, true);
  assert.equal(qcm.usesNativeHeadUv, false);
  assert.equal(qcm.geometryUvFlipped, true);
  assert.equal(brm.usesNativeHeadUv, true);
  assert.equal(brm.geometryUvFlipped, false);
  assert.equal(brmSecondary.usesNativeHeadUv, false);
  assert.equal(brmSecondary.geometryUvFlipped, true);
  assert.equal(fef.usesNativeHeadUv, true);
  assert.equal(fef.geometryUvFlipped, false);
  assert.equal(gff.usesNativeHeadUv, true);
  assert.equal(gff.geometryUvFlipped, false);
  assert.equal(shf.usesNativeHeadUv, true);
  assert.equal(shf.geometryUvFlipped, false);
});

test('module readiness discovers static and dynamic Vite chunk dependencies', () => {
  assert.deepEqual(
    collectModuleSpecifiers(`
      import './assets/side.js';
      import value from "./assets/static.js";
      const lazy = import('./assets/lazy.js');
    `).sort(),
    ['./assets/lazy.js', './assets/side.js', './assets/static.js']
  );
});

test('served bundle identity rejects stale in-memory frontend output', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'sage-bundle-'));
  const entryPath = path.join(directory, 'eqsage-embed.js');
  await fs.writeFile(entryPath, 'export const revision = "current";\n');
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    arrayBuffer: async () => Buffer.from('export const revision = "stale";\n'),
  });
  await assert.rejects(
    verifyServedEmbedEntry({
      baseUrl: 'http://test.local',
      buildEntryPath: entryPath,
      fetchImpl,
    }),
    /serving a stale Sage bundle/
  );
  await fs.rm(directory, { recursive: true, force: true });
});

test('module readiness waits for two identical successful graph walks', async () => {
  const responses = new Map([
    ['http://test.local/eqsage-embed/eqsage-embed.js', `import './assets/main-AbCd1234.js';`],
    ['http://test.local/eqsage-embed/assets/main-AbCd1234.js', `import('./lazy-EfGh5678.js');`],
    ['http://test.local/eqsage-embed/assets/lazy-EfGh5678.js', 'export default true;'],
  ]);
  let requestCount = 0;
  const result = await waitForModuleGraphReady({
    baseUrl: 'http://test.local',
    settleMs: 0,
    timeoutMs: 1000,
    fetchImpl: async (url) => {
      requestCount++;
      const source = responses.get(url);
      return {
        ok: source !== undefined,
        status: source === undefined ? 404 : 200,
        text: async () => source ?? '',
      };
    },
  });
  assert.equal(result.moduleCount, 3);
  assert.equal(result.attempts, 2);
  assert.equal(requestCount, 6);
});

test('validateProfile rejects unsafe or malformed configuration', () => {
  assert.throws(() => validateProfile({
    schemaVersion: 1,
    name: 'bad',
    zoneValidation: { enabled: true, zones: [], cycles: 0 },
    raceAudit: { enabled: true, batchSize: 0, modelSelection: { mode: 'bogus' } },
    artifacts: { screenshotMode: 'sometimes', traceMode: 'maybe', maxTracedZoneReports: -1 },
    memory: { maxUsedPercent: 0 },
  }), /Invalid Sage QA profile/);
});

test('validateProfile rejects a soak profile without warmup, baseline, and comparison cycles', () => {
  assert.throws(() => validateProfile({
    schemaVersion: 1,
    name: 'ineffective-soak',
    zoneValidation: { enabled: true, zones: ['unrest'], cycles: 2 },
    raceAudit: { enabled: false, batchSize: 1, modelSelection: { mode: 'explicit' } },
    soak: { enabled: true, warmupCycles: 1 },
    artifacts: { screenshotMode: 'never', traceMode: 'never', maxTracedZoneReports: 0 },
    memory: { maxUsedPercent: 88, maxRunnerRssMB: 2048, maxRunnerExternalMB: 1536 },
  }), /warmup, baseline, and comparison/);
});

test('memory budget reports both percentage and free-memory violations', () => {
  const result = evaluateMemoryBudget({
    system: { usedPercent: 95, freeBytes: 512 * 1024 * 1024 },
  }, {
    maxUsedPercent: 88,
    minFreeMB: 4096,
    maxRunnerRssMB: 2048,
    maxRunnerExternalMB: 1536,
  });
  assert.equal(result.pass, false);
  assert.equal(result.violations.length, 2);
});

test('memory budget blocks excessive runner RSS and external buffers', () => {
  const result = evaluateMemoryBudget({
    system: { usedPercent: 40, freeBytes: 20 * 1024 * 1024 * 1024 },
    runner: { rssBytes: 3 * 1024 * 1024 * 1024, externalBytes: 2 * 1024 * 1024 * 1024 },
  }, {
    maxUsedPercent: 88,
    minFreeMB: 4096,
    maxRunnerRssMB: 2048,
    maxRunnerExternalMB: 1536,
  });
  assert.equal(result.pass, false);
  assert.equal(result.violations.length, 2);
});

test('zone aggregation reconciles NPCs, textures, doors, and observed models', () => {
  const result = aggregateZoneValidation({
    finished: true,
    complete: true,
    failureCount: 0,
    reports: [{
      zone: 'unrest',
      rootNodeCount: 2,
      pass: { all: true },
      spawns: { loaded: 2 },
      visuals: {
        byModel: { hum: {}, ske: {} },
        readyTextureCount: 8,
        materialSlotCount: 8,
        appearanceTextureDecodeFailureCount: 0,
        tPoseRiskCount: 0,
        motionlessAnimationCount: 0,
        animationGroupCount: 2,
        playingAnimationGroupCount: 2,
        excessAnimationGroupCount: 0,
        nameplateExpectedCount: 2,
        nameplateCount: 2,
        nameplateFailureCount: 0,
      },
      doors: { loaded: 3, hidden: 1, visuals: { readyTextureCount: 4 } },
    }],
  });
  assert.equal(result.complete, true);
  assert.equal(result.npcCount, 2);
  assert.equal(result.npcRootCount, 2);
  assert.equal(result.uniqueModelCount, 2);
  assert.equal(result.visibleDoorCount, 3);
  assert.equal(result.nameplateCount, 2);
  assert.equal(result.nameplateFailureCount, 0);
  assert.equal(result.appearanceTextureDecodeFailureCount, 0);
  assert.equal(result.motionlessAnimationCount, 0);
  assert.equal(result.animationGroupCount, 2);
  assert.equal(result.playingAnimationGroupCount, 2);
  assert.equal(result.excessAnimationGroupCount, 0);
});

test('nameplate placement requires the entire plane to clear the model top', () => {
  const pass = evaluateNameplatePlacement({
    bodyTopLocalY: 4,
    nameplateCenterLocalY: 4.54,
    planeHeight: 0.8,
    rootScaleY: 1,
    requiredWorldClearance: 0.12,
  });
  assert.equal(pass.pass, true);
  assert.ok(pass.clearanceWorldY >= 0.12);

  const intersecting = evaluateNameplatePlacement({
    bodyTopLocalY: 4,
    nameplateCenterLocalY: 4.2,
    planeHeight: 0.8,
    rootScaleY: 1,
    requiredWorldClearance: 0.12,
  });
  assert.equal(intersecting.pass, false);
  assert.ok(intersecting.clearanceWorldY < 0);
});

test('nameplate placement evaluates clearance in scaled world space', () => {
  const result = evaluateNameplatePlacement({
    bodyTopLocalY: 2,
    nameplateCenterLocalY: 2.24,
    planeHeight: 0.4,
    rootScaleY: 3,
    requiredWorldClearance: 0.12,
  });
  assert.equal(result.pass, true);
  assert.ok(Math.abs(result.clearanceWorldY - 0.12) < 0.000001);
});

test('race aggregation counts appearance checks and model failures', () => {
  const result = aggregateRaceAudits([{ audit: {
    complete: true,
    results: [
      { model: 'hum', status: 'pass-discrete-head', appearanceVariantCountAudited: 10, faceVariantCountAudited: 8 },
      { model: 'diag', name: 'Diagnostic', status: 'pass-animation-diagnostic', bindPoseOnlyAnimation: true, appearanceVariantCountAudited: 2, faceVariantCountAudited: 0 },
      { model: 'bad', status: 'untextured-model', appearanceVariantCountAudited: 1, faceVariantCountAudited: 0 },
    ],
  } }]);
  assert.equal(result.auditedModelCount, 3);
  assert.equal(result.appearanceVariantCountAudited, 13);
  assert.equal(result.animationDiagnosticCount, 1);
  assert.deepEqual(result.animationDiagnosticModels, ['diag']);
  assert.equal(result.failureCount, 1);
  assert.equal(result.complete, false);
});

test('soak analysis ignores warmup and detects post-warmup resource growth', () => {
  const report = (cycle, meshes, heapMB) => ({
    zone: 'unrest',
    validationSequence: { cycle },
    sceneResources: { meshes },
    runtimeMemory: { jsHeapUsedBytes: heapMB * 1024 * 1024 },
  });
  const result = analyzeSoak([
    report(1, 100, 100),
    report(2, 100, 120),
    report(3, 120, 180),
  ], {
    enabled: true,
    warmupCycles: 1,
    resourceKeys: ['meshes'],
    resourceTolerancePercent: 2,
    resourceToleranceAbsolute: 4,
    maxJsHeapGrowthMB: 40,
  });
  assert.equal(result.pass, false);
  assert.equal(result.violations.length, 2);
});

test('soak heap analysis compares matching zones instead of different zone footprints', () => {
  const report = (zone, cycle, heapMB) => ({
    zone,
    validationSequence: { cycle },
    sceneResources: {},
    runtimeMemory: { jsHeapUsedBytes: heapMB * 1024 * 1024 },
  });
  const result = analyzeSoak([
    report('small', 2, 100),
    report('large', 2, 900),
    report('small', 3, 110),
    report('large', 3, 880),
  ], {
    enabled: true,
    warmupCycles: 1,
    resourceKeys: [],
    maxJsHeapGrowthMB: 50,
  });
  assert.equal(result.pass, true);
  assert.equal(result.heapGrowthMB, 10);
  assert.equal(result.heapDeltas.length, 2);
});

test('soak resource analysis accepts a bounded rebound below the warmup high-water mark', () => {
  const report = (cycle, materials, textures) => ({
    zone: 'gfaydark',
    validationSequence: { cycle },
    sceneResources: { materials, textures },
  });
  const result = analyzeSoak([
    report(1, 1656, 2722),
    report(2, 1556, 2522),
    report(3, 1596, 2602),
  ], {
    enabled: true,
    warmupCycles: 1,
    resourceKeys: ['materials', 'textures'],
    resourceTolerancePercent: 2,
    resourceToleranceAbsolute: 16,
    maxJsHeapGrowthMB: 512,
  });
  assert.equal(result.pass, true);
  assert.equal(result.comparedReportCount, 1);
  assert.equal(result.resourceDeltas.length, 2);
  assert.deepEqual(
    result.resourceDeltas.map(({ before, after }) => [before, after]),
    [[1656, 1596], [2722, 2602]]
  );
});

test('validation URLs carry cycles and disable EQ-directory report clutter', () => {
  const zone = new URL(buildZoneValidationUrl({
    baseUrl: 'http://127.0.0.1:8080',
    route: '/sage',
    eqDirectory: 'C:\\EQ',
    zones: ['unrest', 'rivervale'],
    cycles: 3,
    cacheBust: 'test',
  }));
  assert.equal(zone.searchParams.get('sageValidationCycles'), '3');
  assert.equal(zone.searchParams.get('sageValidationPersist'), '0');
  const race = new URL(buildRaceAuditUrl({
    baseUrl: 'http://127.0.0.1:8080',
    route: '/sage',
    eqDirectory: 'C:\\EQ',
    bootstrapZone: 'blackburrow',
    models: ['hum'],
    cacheBust: 'test',
  }));
  assert.equal(race.searchParams.get('sageRaceAuditForceRefresh'), '0');
  assert.equal(race.searchParams.get('sageRaceAuditPersist'), '0');
});

test('coverage manifest intersects mapped models with available EQ assets', async (context) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'sage-qa-coverage-'));
  context.after(() => fs.rm(root, { recursive: true, force: true }));
  const common = path.join(root, 'frontend', 'eqsage-embed', 'src', 'viewer', 'common');
  const staticMaps = path.join(root, 'internal', 'http', 'staticmaps');
  const eqDirectory = path.join(root, 'eq');
  await fs.mkdir(common, { recursive: true });
  await fs.mkdir(staticMaps, { recursive: true });
  await fs.mkdir(path.join(eqDirectory, 'eqsage', 'models'), { recursive: true });
  await fs.writeFile(path.join(common, 'raceData.json'), JSON.stringify([{ id: 1, name: 'Human', 0: 'HUM', 1: 'HUF', 2: '' }]));
  await fs.writeFile(path.join(common, 'raceModelMetadata.json'), JSON.stringify({
    hum: { minTexture: 0, maxTexture: 2, minHelmTexture: 0, maxHelmTexture: 1 },
    huf: { minTexture: 0, maxTexture: 0, minHelmTexture: 0, maxHelmTexture: 0 },
  }));
  await fs.writeFile(path.join(common, 'raceAppearancePolicies.json'), JSON.stringify({ classicFaceModels: ['hum', 'huf'] }));
  await fs.writeFile(path.join(staticMaps, 'race-inventory-map.json'), JSON.stringify({
    races: [{ race_id: 1, is_playable: true, sources: [] }],
  }));
  await fs.writeFile(path.join(eqDirectory, 'eqsage', 'models', 'hum.glb'), 'fixture');

  const coverage = await buildCoverageManifest({ repoRoot: root, eqDirectory });
  assert.equal(coverage.summary.mappedModelCount, 2);
  assert.equal(coverage.summary.availableMappedModelCount, 1);
  assert.deepEqual(resolveModelSelection(coverage, { mode: 'available' }), ['hum']);
  assert.equal(coverage.models.find((model) => model.model === 'hum').expectedAppearanceChecks, 11);
});

test('artifact retention only prunes old run directories inside its root', async (context) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'sage-qa-artifacts-'));
  context.after(() => fs.rm(root, { recursive: true, force: true }));
  const first = await createRunDirectory({ outputRoot: root, profileName: 'first', now: new Date('2026-01-01T00:00:00Z') });
  await writeText(path.join(first.runDirectory, 'data.bin'), 'x'.repeat(32));
  await new Promise((resolve) => setTimeout(resolve, 15));
  const second = await createRunDirectory({ outputRoot: root, profileName: 'second', now: new Date('2026-01-02T00:00:00Z') });
  const retention = await pruneRuns({
    outputRoot: root,
    keepRuns: 1,
    maxTotalMB: 10,
    currentRunDirectory: second.runDirectory,
  });
  assert.equal(retention.removedRuns, 1);
  await assert.rejects(fs.access(first.runDirectory));
  await fs.access(second.runDirectory);
});

test('HTML report escapes failures and renders the run status', () => {
  const html = renderHtmlReport({
    runId: 'test',
    pass: false,
    profile: { name: 'smoke' },
    startedAt: 'start',
    completedAt: 'end',
    failures: ['<unsafe>'],
    memorySnapshots: [],
  });
  assert.match(html, /FAIL/);
  assert.match(html, /&lt;unsafe&gt;/);
});

test('compact summary references raw artifacts without duplicating batch and zone payloads', () => {
  const compact = compactRunSummary({
    zoneValidation: { pass: true, summary: { reportCount: 2 }, raw: { reports: [{ large: true }] }, url: 'http://test' },
    raceAudit: { summary: { auditedModelCount: 20 }, batches: [{ large: true }] },
    diagnostics: { consoleErrors: [{}], pageErrors: [], requestFailures: [], httpErrors: [] },
  });
  assert.equal(compact.zoneValidation.raw, undefined);
  assert.equal(compact.zoneValidation.artifact, 'zone-validation.json');
  assert.equal(compact.raceAudit.batches, undefined);
  assert.equal(compact.raceAudit.artifact, 'race-audit-batches.json');
  assert.equal(compact.diagnostics.consoleErrorCount, 1);
});

test('diagnostic summary separates recovered transfer retries from unresolved failures', () => {
  const summary = summarizeTelemetry({
    consoleErrors: [{ recovered: true }, {}],
    pageErrors: [{}],
    requestFailures: [{ recovered: true }, {}],
    httpErrors: [{ recovered: true }, {}],
  });
  assert.deepEqual(summary, {
    consoleErrorCount: 1,
    recoveredConsoleErrorCount: 1,
    pageErrorCount: 1,
    requestFailureCount: 1,
    recoveredRequestFailureCount: 1,
    httpErrorCount: 1,
    recoveredHttpErrorCount: 1,
  });
});

test('browser launch enables precise heap measurements without changing headed behavior', () => {
  const options = getBrowserLaunchOptions({ headed: true });
  assert.equal(options.headless, false);
  assert.ok(options.args.includes('--enable-precise-memory-info'));
});
