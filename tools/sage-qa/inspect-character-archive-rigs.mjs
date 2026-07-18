#!/usr/bin/env node
import fs from 'node:fs/promises';
import { register } from 'node:module';
import path from 'node:path';

// Sage's browser bundle intentionally uses extensionless relative imports.
// Register a narrow resolver before dynamically importing that parser graph so
// this diagnostic remains executable under current Node ESM semantics too.
register('./lib/extensionless-loader.mjs', import.meta.url);

const parseArgs = (values) => {
  const args = {};
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (!value.startsWith('--')) continue;
    const [rawKey, inlineValue] = value.slice(2).split('=', 2);
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    args[key] = inlineValue ?? values[++index];
  }
  return args;
};

const asCsv = (value) => `${value ?? ''}`
  .split(',')
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

const args = parseArgs(process.argv.slice(2));
if (!args.eqDir || !args.archives || !args.models) {
  console.error(
    'Usage: node tools/sage-qa/inspect-character-archive-rigs.mjs ' +
    '--eq-dir <path> --archives <csv> --models <csv>'
  );
  process.exitCode = 2;
} else {
  const [{ PFSArchive }, { Wld }] = await Promise.all([
    import('../../frontend/eqsage-embed/sage/lib/pfs/pfs.js'),
    import('../../frontend/eqsage-embed/sage/lib/s3d/wld/wld.js'),
  ]);
  const eqDirectory = path.resolve(args.eqDir);
  const archives = asCsv(args.archives);
  const requestedModels = new Set(asCsv(args.models));
  const report = {
    schemaVersion: 1,
    eqDirectory,
    requestedModels: [...requestedModels],
    archives: [],
  };

  for (const archiveName of archives) {
    const archivePath = path.join(eqDirectory, archiveName);
    const archiveReport = {
      archive: archiveName,
      exists: false,
      wldFiles: [],
      models: {},
      error: null,
    };
    report.archives.push(archiveReport);

    try {
      const bytes = await fs.readFile(archivePath);
      const arrayBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      );
      const pfs = new PFSArchive();
      archiveReport.exists = pfs.openFromFile(arrayBuffer) === true;
      if (!archiveReport.exists) {
        archiveReport.error = 'invalid-pfs-archive';
        continue;
      }

      for (const fileName of pfs.files.keys()) {
        if (!fileName.toLowerCase().endsWith('.wld')) continue;
        archiveReport.wldFiles.push(fileName);
        const wld = new Wld(pfs.getFile(fileName), fileName);
        for (const track of wld.tracks) {
          if (!track.isNameParsed) track.parseTrackData();
        }

        for (const modelName of requestedModels) {
          const skeletons = wld.skeletons.filter(
            (skeleton) => `${skeleton?.modelBase ?? ''}`.toLowerCase() === modelName
          );
          const tracks = wld.tracks.filter(
            (track) => `${track?.modelName ?? ''}`.toLowerCase() === modelName
          );
          if (skeletons.length === 0 && tracks.length === 0) continue;

          const existing = archiveReport.models[modelName] ?? {
            skeletonCount: 0,
            boneNames: [],
            poseTrackCount: 0,
            playableTrackCount: 0,
            animationNames: [],
          };
          existing.skeletonCount += skeletons.length;
          existing.boneNames = Array.from(new Set([
            ...existing.boneNames,
            ...skeletons.flatMap((skeleton) =>
              (skeleton.skeleton ?? []).map((bone) =>
                `${bone?.name ?? ''}`.trim().toLowerCase()
              )
            ),
          ].filter(Boolean))).sort();
          existing.poseTrackCount += tracks.filter((track) => track.isPoseAnimation).length;
          existing.playableTrackCount += tracks.filter((track) => !track.isPoseAnimation).length;
          existing.animationNames = Array.from(new Set([
            ...existing.animationNames,
            ...tracks
              .filter((track) => !track.isPoseAnimation)
              .map((track) => `${track.animationName ?? ''}`.toLowerCase())
              .filter(Boolean),
          ])).sort();
          archiveReport.models[modelName] = existing;
        }
      }
    } catch (error) {
      archiveReport.error = error?.message ?? String(error);
    }
  }

  report.summary = {
    archiveCount: report.archives.length,
    missingArchiveCount: report.archives.filter((archive) => !archive.exists).length,
    archivesWithPlayableTracks: report.archives
      .filter((archive) => Object.values(archive.models).some(
        (model) => model.playableTrackCount > 0
      ))
      .map((archive) => archive.archive),
  };
  console.log(JSON.stringify(report, null, 2));
}
