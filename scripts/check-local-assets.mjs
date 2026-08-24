import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const frontendRoot = join(repoRoot, 'front-end');

function collectHtmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === 'test-results' || entry.name === 'playwright-report') {
      return [];
    }
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) return collectHtmlFiles(filePath);
    return entry.isFile() && entry.name.endsWith('.html') ? [filePath] : [];
  });
}

const htmlFiles = collectHtmlFiles(frontendRoot);
const missing = [];
let staticReferenceCount = 0;
let dynamicReferenceCount = 0;
const attributePattern = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;

for (const htmlFile of htmlFiles) {
  const html = readFileSync(htmlFile, 'utf8');

  for (const match of html.matchAll(attributePattern)) {
    let target = match[1].trim();

    if (!target || /^(?:https?:|mailto:|tel:|javascript:|data:|#)/i.test(target)) continue;
    if (target.includes('${')) {
      dynamicReferenceCount += 1;
      continue;
    }

    target = target.split('#')[0].split('?')[0];
    if (!target) continue;

    staticReferenceCount += 1;
    try {
      target = decodeURIComponent(target);
    } catch {
      missing.push(`${relative(frontendRoot, htmlFile)} -> ${match[1]} (invalid URL encoding)`);
      continue;
    }

    const resolvedPath = target.startsWith('/')
      ? join(frontendRoot, target.replace(/^\/+/, ''))
      : resolve(dirname(htmlFile), target);
    const candidates = [resolvedPath, join(resolvedPath, 'index.html')];

    if (!candidates.some((candidate) => existsSync(candidate))) {
      missing.push(`${relative(frontendRoot, htmlFile)} -> ${match[1]}`);
    }
  }
}

console.log(`Checked ${htmlFiles.length} HTML pages.`);
console.log(`Checked ${staticReferenceCount} static local href/src references.`);
console.log(`Skipped ${dynamicReferenceCount} runtime-generated href/src expressions.`);

if (missing.length) {
  console.error(`Missing local references (${missing.length}):`);
  for (const item of missing) console.error(`- ${item}`);
  process.exitCode = 1;
} else {
  console.log('All static local href/src references resolve.');
}
