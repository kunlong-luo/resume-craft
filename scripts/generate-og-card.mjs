import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../public/og-card.svg');
const output = resolve(here, '../public/og-card.png');
const width = 1200;
const height = 630;

// The editable SVG is the single source of truth. Social crawlers typically
// prefer a real PNG, so rasterize it at build time rather than using a stale
// hard-coded base64 screenshot.
const svg = readFileSync(source);
const image = await loadImage(svg);
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');
ctx.drawImage(image, 0, 0, width, height);

const png = await canvas.encode('png');
if (!png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
  throw new Error('OG cover rendering did not produce a valid PNG');
}
if (png.readUInt32BE(16) !== width || png.readUInt32BE(20) !== height) {
  throw new Error('OG cover rendering produced the wrong dimensions');
}
writeFileSync(output, png);
console.log(`Generated public/og-card.png from public/og-card.svg (${width}×${height})`);
