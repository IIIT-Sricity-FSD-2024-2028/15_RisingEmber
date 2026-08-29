import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = dirname(scriptDirectory);
const vendorRoot = join(frontendRoot, 'assets', 'vendor');

function ensureDirectory(directory) {
  mkdirSync(directory, { recursive: true });
}

function copyAsset(source, target, sourceUrl) {
  ensureDirectory(dirname(target));
  copyFileSync(source, target);
  return { source: sourceUrl, local: relative(frontendRoot, target).split('\\').join('/') };
}

function copyDirectory(sourceDirectory, targetDirectory, sourceUrl) {
  return readdirSync(sourceDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => copyAsset(
      join(sourceDirectory, entry.name),
      join(targetDirectory, entry.name),
      `${sourceUrl}/${entry.name}`,
    ));
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(directory, entry.name);
    return entry.isDirectory() ? walk(filePath) : [filePath];
  });
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function collectHtmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (['node_modules', 'test-results', 'playwright-report', 'assets'].includes(entry.name)) return [];
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) return collectHtmlFiles(filePath);
    return entry.isFile() && entry.name.endsWith('.html') ? [filePath] : [];
  });
}

function rewriteCriticalReferences() {
  const replacements = [
    [
      /https:\/\/fonts\.googleapis\.com\/css2\?family=Plus\+Jakarta\+Sans:[^"']+/g,
      '/assets/vendor/fonts/plus-jakarta-sans/plus-jakarta-sans.css',
    ],
    ['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', '/assets/vendor/fontawesome-6.4.0/css/all.min.css'],
    ['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css', '/assets/vendor/fontawesome-6.5.0/css/all.min.css'],
    ['https://cdn.jsdelivr.net/npm/chart.js', '/assets/vendor/chart/chart.umd.min.js'],
    ['https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', '/assets/vendor/html2canvas/html2canvas.min.js'],
    ['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', '/assets/vendor/jspdf/jspdf.umd.min.js'],
    ['/assets/vendor/fonts/plus-jakarta-sans.css', '/assets/vendor/fonts/plus-jakarta-sans/plus-jakarta-sans.css'],
    ['/assets/vendor/fontawesome/6.4.0/css/all.min.css', '/assets/vendor/fontawesome-6.4.0/css/all.min.css'],
    ['/assets/vendor/fontawesome/6.5.0/css/all.min.css', '/assets/vendor/fontawesome-6.5.0/css/all.min.css'],
    ['/assets/vendor/chart.js/chart.umd.min.js', '/assets/vendor/chart/chart.umd.min.js'],
  ];
  const preconnectPatterns = [
    /^\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com"\s*\/?>\s*$/gm,
    /^\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com"[^>]*>\s*$/gm,
  ];

  let changedFiles = 0;
  for (const htmlFile of collectHtmlFiles(frontendRoot)) {
    const original = readFileSync(htmlFile, 'utf8');
    let updated = original;
    for (const pattern of preconnectPatterns) updated = updated.replace(pattern, '');
    for (const [from, to] of replacements) updated = updated.replace(from, to);
    if (updated !== original) {
      writeFileSync(htmlFile, updated);
      changedFiles += 1;
    }
  }
  return changedFiles;
}

const copied = [];
const nodeModules = join(frontendRoot, 'node_modules');

for (const [version, packageName] of [['6.4.0', 'fontawesome-free-6-4'], ['6.5.0', '@fortawesome/fontawesome-free']]) {
  const packageRoot = join(nodeModules, packageName);
  const sourceBase = `npm:${packageName}@${version}`;
  copied.push(copyAsset(
    join(packageRoot, 'css', 'all.min.css'),
    join(vendorRoot, `fontawesome-${version}`, 'css', 'all.min.css'),
    `${sourceBase}/css/all.min.css`,
  ));
  copied.push(...copyDirectory(
    join(packageRoot, 'webfonts'),
    join(vendorRoot, `fontawesome-${version}`, 'webfonts'),
    `${sourceBase}/webfonts`,
  ));
}

copied.push(copyAsset(
  join(nodeModules, 'chart.js', 'dist', 'chart.umd.min.js'),
  join(vendorRoot, 'chart', 'chart.umd.min.js'),
  'npm:chart.js@4.5.1/dist/chart.umd.min.js',
));
copied.push(copyAsset(
  join(nodeModules, 'html2canvas', 'dist', 'html2canvas.min.js'),
  join(vendorRoot, 'html2canvas', 'html2canvas.min.js'),
  'npm:html2canvas@1.4.1/dist/html2canvas.min.js',
));
copied.push(copyAsset(
  join(nodeModules, 'jspdf', 'dist', 'jspdf.umd.min.js'),
  join(vendorRoot, 'jspdf', 'jspdf.umd.min.js'),
  'npm:jspdf@2.5.1/dist/jspdf.umd.min.js',
));

const fontSourceRoot = join(nodeModules, '@fontsource', 'plus-jakarta-sans');
const fontDirectory = join(vendorRoot, 'fonts', 'plus-jakarta-sans');
const fontCss = [400, 500, 600, 700, 800].map((weight) => {
  const cssFile = join(fontSourceRoot, `latin-${weight}.css`);
  const css = readFileSync(cssFile, 'utf8');
  const fontNames = [...css.matchAll(/files\/([^)'" ]+\.(?:woff2|woff))/g)].map((match) => match[1]);
  for (const fontName of fontNames) {
    copied.push(copyAsset(
      join(fontSourceRoot, 'files', fontName),
      join(fontDirectory, fontName),
      `npm:@fontsource/plus-jakarta-sans@5.3.0/files/${fontName}`,
    ));
  }
  return css.replaceAll('./files/', './').trim();
}).join('\n\n');
const fontCssPath = join(fontDirectory, 'plus-jakarta-sans.css');
ensureDirectory(dirname(fontCssPath));
writeFileSync(fontCssPath, `${fontCss}\n`);
copied.push({
  source: 'npm:@fontsource/plus-jakarta-sans@5.3.0/latin-{400,500,600,700,800}.css',
  local: relative(frontendRoot, fontCssPath).split('\\').join('/'),
});

const changedFiles = rewriteCriticalReferences();
const manifestAssets = copied.map((entry) => {
  const filePath = join(frontendRoot, entry.local);
  return {
    ...entry,
    bytes: readFileSync(filePath).byteLength,
    sha256: sha256(filePath),
  };
});

const manifest = {
  generatedBy: 'front-end/scripts/sync-vendor-assets.mjs',
  policy: 'Critical third-party styles, fonts, and scripts are served locally for evaluation/offline runs.',
  assets: manifestAssets,
};
const manifestPath = join(vendorRoot, 'vendor-manifest.json');
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Synced ${manifestAssets.length} vendor assets into ${relative(frontendRoot, vendorRoot)}.`);
console.log(`Rewrote critical CDN references in ${changedFiles} HTML pages.`);
console.log(`Manifest: ${relative(frontendRoot, manifestPath)}`);
