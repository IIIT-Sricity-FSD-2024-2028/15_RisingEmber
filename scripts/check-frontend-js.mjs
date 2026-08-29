import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const frontendRoot = join(repoRoot, 'front-end');

function collectJavaScriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === 'test-results' || entry.name === 'playwright-report') {
      return [];
    }
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) return collectJavaScriptFiles(filePath);
    return entry.isFile() && entry.name.endsWith('.js') ? [filePath] : [];
  });
}

const files = collectJavaScriptFiles(frontendRoot);
const failures = [];

for (const filePath of files) {
  const result = spawnSync(process.execPath, ['--check', filePath], { encoding: 'utf8' });
  if (result.status !== 0) {
    failures.push({ filePath, output: `${result.stdout || ''}${result.stderr || ''}`.trim() });
  }
}

console.log(`Checked ${files.length} frontend JavaScript files.`);

if (failures.length) {
  for (const failure of failures) {
    console.error(`\n${relative(repoRoot, failure.filePath)}\n${failure.output}`);
  }
  process.exitCode = 1;
} else {
  console.log('All frontend JavaScript files passed node --check.');
}
