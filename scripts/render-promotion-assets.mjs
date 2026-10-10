/**
 * Produce pixel-perfect, editable-in-code promotional layouts around actual
 * Playwright screenshots. We never synthesize, alter or fabricate UI contents.
 */
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), 'artifacts/promotion');
const input = resolve(root, 'resume-craft-markdown-preview.png');
const screenshot = await loadImage(await readFile(input));
const offWhite = '#F8FAFF';
const indigo = '#4F46E5';
const dark = '#101B3E';

function canvas(w, h) {
  const c = createCanvas(w, h);
  const x = c.getContext('2d');
  x.imageSmoothingQuality = 'high';
  return { c, x, w, h };
}
function roundRect(x, left, top, w, h, r, color) {
  x.fillStyle = color;
  x.beginPath();
  x.roundRect(left, top, w, h, r);
  x.fill();
}
function text(x, value, left, baseline, size, color, weight = 500) {
  x.fillStyle = color;
  x.font = `${weight} ${size}px "DejaVu Sans", Arial, sans-serif`;
  x.fillText(value, left, baseline);
}
function background(x, w, h) {
  const gradient = x.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, '#FCFDFF');
  gradient.addColorStop(0.7, '#F4F6FF');
  gradient.addColorStop(1, '#E8E9FF');
  x.fillStyle = gradient;
  x.fillRect(0, 0, w, h);
  const glow = x.createRadialGradient(w - 40, 150, 40, w - 40, 150, w * .7);
  glow.addColorStop(0, 'rgba(99,102,241,.18)');
  glow.addColorStop(1, 'rgba(99,102,241,0)');
  x.fillStyle = glow;
  x.fillRect(0, 0, w, h);
}
function brand(x, left, top, darkText = true) {
  roundRect(x, left, top, 42, 42, 13, indigo);
  text(x, 'RC', left + 9, top + 28, 16, '#FFFFFF', 800);
  text(x, 'RESUME CRAFT', left + 56, top + 27, 20, darkText ? dark : '#FFFFFF', 800);
}
function screenshotFrame(x, left, top, w, h) {
  x.save();
  x.shadowColor = 'rgba(46,48,104,.24)';
  x.shadowBlur = 38;
  x.shadowOffsetY = 18;
  roundRect(x, left, top, w, h, 16, '#FFFFFF');
  x.restore();
  x.save();
  x.beginPath();
  x.roundRect(left + 2, top + 2, w - 4, h - 4, 14);
  x.clip();
  // Aspect-fit without cropping either editor or preview.
  const scale = Math.min((w - 4) / screenshot.width, (h - 4) / screenshot.height);
  const imageW = screenshot.width * scale;
  const imageH = screenshot.height * scale;
  x.fillStyle = '#E9EEFA';
  x.fillRect(left + 2, top + 2, w - 4, h - 4);
  x.drawImage(screenshot, left + (w - imageW) / 2, top + (h - imageH) / 2, imageW, imageH);
  x.restore();
  x.strokeStyle = '#DCE2F7';
  x.lineWidth = 2;
  x.beginPath();
  x.roundRect(left + 1, top + 1, w - 2, h - 2, 15);
  x.stroke();
}
function pill(x, label, left, top, w) {
  roundRect(x, left, top, w, 36, 18, '#E9EBFF');
  text(x, label, left + 17, top + 24, 13, '#3635AA', 700);
}
async function save({ c }, name) {
  await writeFile(resolve(root, name), c.toBuffer('image/png'));
  console.log(`Created ${name}`);
}

// Reddit / video thumbnail — clean branded text paired with a REAL screenshot.
{
  const a = canvas(1280, 720);
  background(a.x, a.w, a.h);
  brand(a.x, 64, 62);
  roundRect(a.x, 65, 152, 130, 31, 16, '#DEF9EE');
  text(a.x, 'OPEN SOURCE', 80, 173, 12, '#047857', 800);
  text(a.x, 'Build a better', 65, 264, 47, dark, 800);
  text(a.x, 'resume. Faster.', 65, 325, 47, dark, 800);
  text(a.x, 'Write in Markdown. See a live preview.', 68, 383, 18, '#475569', 500);
  text(a.x, 'Choose an export option when ready.', 68, 410, 18, '#475569', 500);
  pill(a.x, 'FREE', 66, 446, 79);
  pill(a.x, 'NO SIGN-UP', 154, 446, 145);
  pill(a.x, 'LOCAL-FIRST', 307, 446, 152);
  screenshotFrame(a.x, 540, 174, 692, 394);
  roundRect(a.x, 540, 592, 680, 44, 12, '#FFFFFF');
  text(a.x, 'REAL PRODUCT SCREENSHOT  ·  MARKDOWN + LIVE PREVIEW', 558, 619, 14, '#334155', 700);
  text(a.x, 'kunlong-luo.github.io/resume-craft', 66, 660, 17, '#4F46E5', 700);
  await save(a, 'resume-craft-reddit-cover-1280x720.png');
}

// Product Hunt / GitHub gallery — generous readable screenshot.
{
  const a = canvas(1200, 900);
  background(a.x, a.w, a.h);
  brand(a.x, 58, 50);
  text(a.x, 'Edit your resume, not your layout.', 58, 166, 39, dark, 800);
  text(a.x, 'Markdown + forms. A live preview. PDF options.', 59, 213, 20, '#475569', 500);
  screenshotFrame(a.x, 57, 265, 1086, 610);
  await save(a, 'resume-craft-product-gallery-1200x900.png');
}

// Portrait social post / LinkedIn illustration based on the identical real screenshot.
{
  const a = canvas(1080, 1350);
  background(a.x, a.w, a.h);
  brand(a.x, 74, 73);
  text(a.x, 'Your next resume,', 74, 236, 56, dark, 800);
  text(a.x, 'made simpler.', 74, 312, 56, dark, 800);
  text(a.x, 'Live editing, instant preview,', 78, 376, 25, '#475569', 500);
  text(a.x, 'built for a cleaner workflow.', 78, 410, 25, '#475569', 500);
  screenshotFrame(a.x, 42, 492, 996, 561);
  pill(a.x, 'FREE', 74, 1112, 100);
  pill(a.x, 'OPEN SOURCE', 187, 1112, 173);
  pill(a.x, 'NO SIGN-UP', 374, 1112, 164);
  text(a.x, 'Try it: kunlong-luo.github.io/resume-craft', 74, 1234, 22, indigo, 700);
  await save(a, 'resume-craft-social-1080x1350.png');
}

// Short outro for MP4. No misleading success claims.
{
  const a = canvas(1280, 720);
  const x = a.x;
  const grad = x.createLinearGradient(0, 0, 1280, 720);
  grad.addColorStop(0, '#101B3E');
  grad.addColorStop(1, '#3431A3');
  x.fillStyle = grad;
  x.fillRect(0, 0, 1280, 720);
  x.fillStyle = 'rgba(129,140,248,.12)';
  x.beginPath();
  x.arc(1125, 70, 280, 0, Math.PI * 2);
  x.fill();
  brand(x, 83, 66, false);
  text(x, 'Make your next resume', 83, 293, 56, '#FFFFFF', 800);
  text(x, 'without the formatting fight.', 83, 370, 52, '#FFFFFF', 800);
  text(x, 'FREE  ·  OPEN SOURCE  ·  NO SIGN-UP', 86, 435, 19, '#C7D2FE', 800);
  roundRect(x, 82, 493, 775, 85, 20, '#FFFFFF');
  text(x, 'kunlong-luo.github.io/resume-craft', 110, 548, 27, '#312E81', 800);
  text(x, 'Real editor footage · fictional example resume', 85, 668, 15, '#C7D2FE', 500);
  await save(a, 'resume-craft-video-outro-1280x720.png');
}
