const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(repoRoot, 'public', 'eqsage-embed');
const targetDir = path.join(repoRoot, 'dist', 'eqsage-embed');

if (!fs.existsSync(sourceDir)) {
  throw new Error(`EQ Sage embed source directory not found: ${sourceDir}`);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(path.dirname(targetDir), { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });

console.log(`Synced EQ Sage embed bundle to ${targetDir}`);
