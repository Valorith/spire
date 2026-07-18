import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveEqDirectory } from '../../../tools/sage-qa/lib/profile.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..', '..');
const eqDirectory = await resolveEqDirectory({
  requested: process.argv.includes('--eq-dir')
    ? process.argv[process.argv.indexOf('--eq-dir') + 1]
    : null,
});
const eqSageData = path.join(eqDirectory, 'eqsage', 'data');
const outputDir = path.join(repoRoot, 'tmp', 'race-face-audit');
const raceDataPath = path.join(
  repoRoot,
  'frontend',
  'eqsage-embed',
  'src',
  'viewer',
  'common',
  'raceData.json'
);

const readJson = async (filePath, fallback = null) => {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (fallback !== null) {
      return fallback;
    }
    throw error;
  }
};

const csvCell = (value) => {
  const text = Array.isArray(value) ? value.join('; ') : `${value ?? ''}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const GENDERS = [
  ['0', 'male'],
  ['1', 'female'],
  ['2', 'neutral'],
];

await fs.mkdir(outputDir, { recursive: true });

const supplementalAuditFiles = (await fs.readdir(outputDir))
  .filter((fileName) => /^model-audit-.*\.json$/i.test(fileName))
  .sort();

const [
  raceData,
  latestModelAudit,
  archivedFullAudit,
  supplementalModelAudits,
  archiveAudit,
  alternateArchiveAudit,
] = await Promise.all([
  readJson(raceDataPath),
  readJson(path.join(eqSageData, 'spire-race-face-audit.json')),
  readJson(path.join(outputDir, 'race-face-audit-pass1.json'), { results: [] }),
  Promise.all(
    supplementalAuditFiles.map((fileName) =>
      readJson(path.join(outputDir, fileName), { results: [] })
    )
  ),
  readJson(path.join(eqSageData, 'spire-race-archive-audit.json'), {
    complete: false,
    reports: [],
  }),
  readJson(path.join(eqSageData, 'spire-race-archive-audit-alternate.json'), {
    complete: false,
    reports: [],
  }),
]);

const archiveAudits = [archiveAudit, alternateArchiveAudit];
const archiveReports = archiveAudits.flatMap((audit) => audit.reports ?? []);

const resultByModel = new Map();
for (const audit of [
  archivedFullAudit,
  ...supplementalModelAudits,
  latestModelAudit,
]) {
  for (const result of audit.results ?? []) {
    resultByModel.set(result.model.toLowerCase(), result);
  }
}
const variants = [];
for (const race of raceData) {
  for (const [genderKey, gender] of GENDERS) {
    const model = `${race[genderKey] ?? ''}`.trim().toLowerCase();
    if (!model) {
      continue;
    }
    const result = resultByModel.get(model);
    variants.push({
      raceId: Number(race.id),
      raceName: race.name,
      gender,
      model: model.toUpperCase(),
      status: result?.status ?? 'not-audited',
      faceType: (result?.headTextureCount ?? 0) > 0
        ? 'discrete-head-material'
        : 'integrated-or-no-face',
      modelLoaded: result?.modelLoaded ?? false,
      renderPass: result?.renderPass ?? false,
      meshCount: result?.meshCount ?? 0,
      materialSlotCount: result?.materialSlotCount ?? 0,
      texturedSlotCount: result?.texturedSlotCount ?? 0,
      readyTextureCount: result?.readyTextureCount ?? 0,
      pendingTextureCount: result?.pendingTextureCount ?? 0,
      fallbackTextureCount: result?.fallbackTextureCount ?? 0,
      headTextureCount: result?.headTextureCount ?? 0,
      verticallyFlippedHeadTextureCount:
        result?.verticallyFlippedHeadTextureCount ?? 0,
      fallbackTextures: result?.fallbackTextures ?? [],
      error: result?.error ?? '',
      renderError: result?.renderError ?? '',
    });
  }
}

const races = raceData.map((race) => {
  const raceVariants = variants.filter((variant) => variant.raceId === Number(race.id));
  const unresolved = raceVariants.filter(
    (variant) => !variant.status.startsWith('pass-')
  );
  return {
    raceId: Number(race.id),
    raceName: race.name,
    status: unresolved.length === 0 ? 'validated' : 'unresolved',
    variantCount: raceVariants.length,
    validatedVariantCount: raceVariants.length - unresolved.length,
    unresolvedVariantCount: unresolved.length,
    models: raceVariants.map((variant) => variant.model),
    unresolvedModels: unresolved.map((variant) => variant.model),
  };
});

const unresolvedVariants = variants.filter(
  (variant) => !variant.status.startsWith('pass-')
);
const unresolvedRaces = races.filter((race) => race.status !== 'validated');
const summary = {
  complete:
    resultByModel.size === new Set(variants.map((variant) => variant.model)).size &&
    unresolvedVariants.length === 0,
  raceCount: races.length,
  validatedRaceCount: races.length - unresolvedRaces.length,
  unresolvedRaceCount: unresolvedRaces.length,
  variantCount: variants.length,
  validatedVariantCount: variants.length - unresolvedVariants.length,
  unresolvedVariantCount: unresolvedVariants.length,
  uniqueModelCount: resultByModel.size,
  validatedModelCount: [...resultByModel.values()].filter((result) =>
    result.status.startsWith('pass-')
  ).length,
  unresolvedModelCount: [...resultByModel.values()].filter((result) =>
    !result.status.startsWith('pass-')
  ).length,
  archiveAuditComplete: archiveAudits.every((audit) => audit.complete === true),
  sourceZoneCount: archiveReports.length,
  sourceZoneFailureCount: archiveReports.filter((report) => !report.pass).length,
  generatedAt: new Date().toISOString(),
};

const output = {
  summary,
  races,
  variants,
  unresolvedRaces,
  unresolvedVariants,
  archiveFailures: archiveReports.filter((report) => !report.pass),
};

const csvHeaders = [
  'raceId',
  'raceName',
  'gender',
  'model',
  'status',
  'faceType',
  'modelLoaded',
  'renderPass',
  'meshCount',
  'materialSlotCount',
  'texturedSlotCount',
  'readyTextureCount',
  'pendingTextureCount',
  'fallbackTextureCount',
  'headTextureCount',
  'verticallyFlippedHeadTextureCount',
  'fallbackTextures',
  'error',
  'renderError',
];
const csv = [
  csvHeaders.join(','),
  ...variants.map((variant) =>
    csvHeaders.map((header) => csvCell(variant[header])).join(',')
  ),
].join('\n');

const markdown = [
  '# Spire Race Face Audit',
  '',
  `Generated: ${summary.generatedAt}`,
  '',
  '| Metric | Count |',
  '| --- | ---: |',
  `| Race definitions | ${summary.raceCount} |`,
  `| Validated races | ${summary.validatedRaceCount} |`,
  `| Unresolved races | ${summary.unresolvedRaceCount} |`,
  `| Race/gender variants | ${summary.variantCount} |`,
  `| Unique model codes audited | ${summary.uniqueModelCount} |`,
  `| Validated model codes | ${summary.validatedModelCount} |`,
  `| Unresolved model codes | ${summary.unresolvedModelCount} |`,
  `| Source zones processed | ${summary.sourceZoneCount} |`,
  `| Source-zone failures | ${summary.sourceZoneFailureCount} |`,
  '',
  '## Unresolved variants',
  '',
  ...(unresolvedVariants.length
    ? [
      '| Race ID | Race | Gender | Model | Status | Error |',
      '| ---: | --- | --- | --- | --- | --- |',
      ...unresolvedVariants.map((variant) =>
        `| ${variant.raceId} | ${variant.raceName} | ${variant.gender} | ${variant.model} | ${variant.status} | ${variant.error || variant.renderError || ''} |`
      ),
    ]
    : ['All race/gender variants passed.']),
  '',
  'The CSV file contains one row for every race/gender model variant.',
].join('\n');

await Promise.all([
  fs.writeFile(
    path.join(outputDir, 'race-face-audit.json'),
    `${JSON.stringify(output, null, 2)}\n`
  ),
  fs.writeFile(path.join(outputDir, 'race-face-audit.csv'), `${csv}\n`),
  fs.writeFile(path.join(outputDir, 'race-face-audit.md'), `${markdown}\n`),
]);

console.log(JSON.stringify(summary, null, 2));
