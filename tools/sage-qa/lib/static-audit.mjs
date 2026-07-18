import { spawn } from 'node:child_process';
import path from 'node:path';

export const runStaticTextureAudit = ({ repoRoot, eqDirectory, timeoutMs = 120000 }) =>
  new Promise((resolve, reject) => {
    const script = path.join(
      repoRoot,
      'frontend',
      'eqsage-embed',
      'scripts',
      'audit-race-skin-textures.mjs'
    );
    const child = spawn(process.execPath, [script, '--eq-dir', eqDirectory], {
      cwd: path.dirname(script),
      env: process.env,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Static texture audit exceeded ${timeoutMs} ms`));
    }, timeoutMs);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`Static texture audit exited ${code}: ${stderr || stdout}`));
        return;
      }
      try {
        resolve({ ...JSON.parse(stdout.trim()), stderr: stderr.trim() });
      } catch (error) {
        reject(new Error(`Static texture audit returned invalid JSON: ${error.message}`));
      }
    });
  });
