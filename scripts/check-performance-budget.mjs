import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = process.cwd();
const distDir = resolve(root, 'dist');
const reportOnly = process.argv.includes('--report-only');

const KiB = 1024;
const budgets = {
  appGzipKiB: 115,
  vendorGzipKiB: 90,
  cssGzipKiB: 32,
  initialJsGzipKiB: 260,
  precacheRawKiB: 2300,
};

if (!existsSync(distDir)) {
  console.error('Performance budget requires a production build in ./dist. Run pnpm build first.');
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function gzipBytes(path) {
  return gzipSync(readFileSync(path), { level: 9 }).byteLength;
}

function toKiB(bytes) {
  return bytes / KiB;
}

function fmt(bytes) {
  return `${toKiB(bytes).toFixed(1)} KiB`;
}

const files = walk(distDir).map((path) => ({
  path,
  rel: relative(distDir, path).replaceAll('\\', '/'),
  name: basename(path),
  raw: statSync(path).size,
  gzip: gzipBytes(path),
}));

const byName = (pattern) => files.filter((file) => pattern.test(file.name));
const sum = (items, key) => items.reduce((total, item) => total + item[key], 0);

const appChunks = byName(/^App-.*\.js$/);
const vendorChunks = byName(/^vendor-.*\.js$/);
const cssFiles = files.filter((file) => file.name.endsWith('.css'));
const pdfToolFiles = files.filter((file) =>
  /^(?:pdf-vendor|pdfjs-vendor|pdf\.worker)[^/]*\.(?:js|mjs)$/i.test(file.name),
);

const indexHtml = readFileSync(join(distDir, 'index.html'), 'utf8');
const initialAssetRefs = new Set();
for (const match of indexHtml.matchAll(/(?:src|href)=["']\.\/?([^"'?#]+)["']/g)) {
  if (match[1].startsWith('assets/')) initialAssetRefs.add(match[1]);
}
const initialJs = files.filter(
  (file) => initialAssetRefs.has(file.rel) && /\.(?:js|mjs)$/.test(file.name),
);

const precacheExtensions = new Set(['.js', '.mjs', '.css', '.html', '.ico', '.png', '.svg', '.woff', '.woff2']);
const extensionOf = (name) => {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot) : '';
};
const isPdfTool = (file) =>
  /^(?:pdf-vendor|pdfjs-vendor|pdf\.worker)[^/]*\.(?:js|mjs)$/i.test(file.name);
const precacheCandidates = files.filter(
  (file) => precacheExtensions.has(extensionOf(file.name)) && !isPdfTool(file),
);

const metrics = {
  appGzipKiB: toKiB(sum(appChunks, 'gzip')),
  vendorGzipKiB: toKiB(sum(vendorChunks, 'gzip')),
  cssGzipKiB: toKiB(sum(cssFiles, 'gzip')),
  initialJsGzipKiB: toKiB(sum(initialJs, 'gzip')),
  precacheRawKiB: toKiB(sum(precacheCandidates, 'raw')),
};

console.log('\nResume Craft performance report');
console.log('--------------------------------');
console.log(`App JS gzip:          ${metrics.appGzipKiB.toFixed(1)} KiB / ${budgets.appGzipKiB} KiB`);
console.log(`Generic vendor gzip:  ${metrics.vendorGzipKiB.toFixed(1)} KiB / ${budgets.vendorGzipKiB} KiB`);
console.log(`CSS gzip:             ${metrics.cssGzipKiB.toFixed(1)} KiB / ${budgets.cssGzipKiB} KiB`);
console.log(`Initial JS gzip:      ${metrics.initialJsGzipKiB.toFixed(1)} KiB / ${budgets.initialJsGzipKiB} KiB`);
console.log(`PWA precache raw:     ${metrics.precacheRawKiB.toFixed(1)} KiB / ${budgets.precacheRawKiB} KiB`);
console.log(`On-demand PDF tools:  ${fmt(sum(pdfToolFiles, 'raw'))} raw, ${fmt(sum(pdfToolFiles, 'gzip'))} gzip`);

console.log('\nLargest JavaScript chunks (gzip)');
console.log('--------------------------------');
files
  .filter((file) => /\.(?:js|mjs)$/.test(file.name))
  .sort((a, b) => b.gzip - a.gzip)
  .slice(0, 15)
  .forEach((file) => {
    console.log(`${fmt(file.gzip).padStart(11)}  ${file.rel}`);
  });

const initialPdfTools = initialJs.filter(isPdfTool);
const failures = [];

for (const [metric, value] of Object.entries(metrics)) {
  const budget = budgets[metric];
  if (value > budget) {
    failures.push(`${metric}: ${value.toFixed(1)} KiB exceeds ${budget} KiB`);
  }
}

if (initialPdfTools.length > 0) {
  failures.push(
    `PDF tooling leaked into initial HTML: ${initialPdfTools.map((file) => file.rel).join(', ')}`,
  );
}

if (failures.length > 0) {
  console.error('\nPerformance budget violations');
  console.error('-----------------------------');
  failures.forEach((failure) => console.error(`- ${failure}`));
  if (!reportOnly) process.exitCode = 1;
} else {
  console.log('\nPerformance budget: PASS');
}
