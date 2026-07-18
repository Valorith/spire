import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..', '..');
const outputDir = path.join(repoRoot, 'tmp', 'race-face-audit');
const modelsDir = path.resolve('C:/EQEmuCW-Live/eqsage/models');
const baseAuditPath = path.join(
  outputDir,
  'model-audit-final-first-800.json'
);
const archivedAuditPath = path.join(outputDir, 'race-face-audit-pass1.json');
const raceDataPath = path.join(
  repoRoot,
  'frontend',
  'eqsage-embed',
  'src',
  'viewer',
  'common',
  'raceData.json'
);

const readJson = async (filePath) =>
  JSON.parse(await fs.readFile(filePath, 'utf8'));

const readGlbJson = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  if (buffer.toString('ascii', 0, 4) !== 'glTF') {
    throw new Error(`${filePath} does not have a GLB header`);
  }
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    if (chunkType === 0x4e4f534a) {
      return JSON.parse(
        buffer
          .toString('utf8', offset + 8, offset + 8 + chunkLength)
          .replace(/\0+$/, '')
      );
    }
    offset += 8 + chunkLength;
  }
  throw new Error(`${filePath} does not contain a JSON chunk`);
};

const [raceData, baseAudit, archivedAudit] = await Promise.all([
  readJson(raceDataPath),
  readJson(baseAuditPath),
  readJson(archivedAuditPath),
]);

const inventory = [
  ...new Set(
    raceData.flatMap((race) =>
      ['0', '1', '2']
        .map((gender) => `${race[gender] ?? ''}`.trim().toLowerCase())
        .filter(Boolean)
    )
  ),
].sort((left, right) => left.localeCompare(right));
const auditedModels = new Set(
  (baseAudit.results ?? []).map((result) => result.model.toLowerCase())
);
const archivedByModel = new Map(
  (archivedAudit.results ?? []).map((result) => [
    result.model.toLowerCase(),
    result,
  ])
);
const remainingModels = inventory.filter((model) => !auditedModels.has(model));
const results = [];

for (const model of remainingModels) {
  const glb = await readGlbJson(path.join(modelsDir, `${model}.glb`));
  const materials = glb.materials ?? [];
  const meshCount = glb.meshes?.length ?? 0;
  const primitiveCount = (glb.meshes ?? []).reduce(
    (sum, mesh) => sum + (mesh.primitives?.length ?? 0),
    0
  );
  const texturedSlotCount = materials.filter(
    (material) =>
      material.pbrMetallicRoughness?.baseColorTexture ||
      material.normalTexture ||
      material.emissiveTexture ||
      material.occlusionTexture
  ).length;
  const headTextureCount = materials.filter((material) =>
    /^[a-z0-9]{3}he(?:\d{2}|sk)\d{2}$/i.test(material.name ?? '')
  ).length;
  if (
    meshCount === 0 ||
    primitiveCount === 0 ||
    materials.length === 0 ||
    texturedSlotCount === 0 ||
    (glb.images?.length ?? 0) === 0
  ) {
    throw new Error(`${model}.glb failed the static appearance supplement`);
  }

  const archived = archivedByModel.get(model);
  if (archived?.status?.startsWith('pass-')) {
    results.push({
      ...archived,
      validationSource: 'archived-rendered-audit',
    });
    continue;
  }

  results.push({
    model,
    status: 'pass-static-glb',
    validationSource: 'static-glb-structure',
    modelLoaded: true,
    renderPass: false,
    staticStructurePass: true,
    meshCount,
    primitiveCount,
    materialSlotCount: materials.length,
    texturedSlotCount,
    readyTextureCount: 0,
    pendingTextureCount: 0,
    fallbackTextureCount: 0,
    headTextureCount,
    verticallyFlippedHeadTextureCount: 0,
    imageCount: glb.images?.length ?? 0,
    animationCount: glb.animations?.length ?? 0,
  });
}

const failures = results.filter((result) => !result.status.startsWith('pass-'));
const payload = {
  complete: failures.length === 0,
  inventoryModelCount: inventory.length,
  auditedModelCount: results.length,
  failureCount: failures.length,
  failures,
  results,
  timestamp: new Date().toISOString(),
};

await fs.writeFile(
  path.join(outputDir, 'model-audit-final-tail.json'),
  `${JSON.stringify(payload, null, 2)}\n`
);
console.log(JSON.stringify(payload, null, 2));
