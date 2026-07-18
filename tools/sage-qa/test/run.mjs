import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const testFiles = (await fs.readdir(testDirectory))
  .filter((name) => name.endsWith('.test.mjs'))
  .map((name) => path.join(testDirectory, name))
  .sort();

if (testFiles.length === 0) {
  throw new Error(`No Sage QA test files found in ${testDirectory}`);
}

const child = spawn(process.execPath, ['--test', ...testFiles], {
  cwd: path.resolve(testDirectory, '..', '..', '..'),
  stdio: 'inherit',
  windowsHide: true,
});

child.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Sage QA tests terminated by ${signal}`);
    process.exitCode = 1;
  } else {
    process.exitCode = code ?? 1;
  }
});
