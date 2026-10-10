/**
 * Capture a real Resume Craft browser session for promotion.
 * Everything shown is seeded with fictional example data in a fresh browser.
 * No external accounts, analytics IDs, user resumes, or private URLs are used.
 *
 * Outputs are downloadable through the GitHub Actions artifact:
 *   resume-craft-product-screenshot.png (real Chromium screenshot)
 *   resume-craft-markdown-preview.png (real Chromium screenshot)
 *   resume-craft-download-options.png (real Chromium screenshot)
 *   resume-craft-demo.webm (real Chromium screen recording)
 *   resume-craft-social-cover.png (existing source-of-truth OG design)
 */
import { chromium } from '@playwright/test';
import { copyFile, mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const BASE_URL = process.env.DEMO_BASE_URL || 'http://127.0.0.1:3000/';
const MEDIA_DIR = resolve(process.cwd(), 'artifacts/promotion');

const initialMarkdown = [
  '# Alex Morgan',
  'Frontend Developer',
  '',
  '## Summary',
  'Building clear and accessible user experiences.',
  '',
  '## Work Experience',
  '### Example Studio | Frontend Developer | Jan 2024 – Present',
  '- Built accessible interfaces with React and TypeScript.',
  '- Improved page performance and mobile layouts.',
  '',
  '## Projects',
  '### Open Source Toolkit | Developer | 2025',
  '- Created reusable UI components and tests.',
  '',
  '## Skills',
  '- React, TypeScript, CSS, Accessibility',
  '',
  '## Education',
  '### Example University | Computer Science | 2020 – 2024',
  '',
].join('\n');

async function pause(page, ms = 1400) {
  await page.waitForTimeout(ms);
}

async function setEditorialCaption(page, kicker, headline, detail = '') {
  // Editorial overlay: intentionally separate from the underlying, unmodified app UI.
  await page.evaluate(({ kicker, headline, detail }) => {
    let el = document.getElementById('promotion-editorial-caption');
    if (!el) {
      el = document.createElement('div');
      el.id = 'promotion-editorial-caption';
      el.setAttribute('aria-hidden', 'true');
      Object.assign(el.style, {
        position: 'fixed', left: '26px', bottom: '28px', zIndex: '99999',
        pointerEvents: 'none', width: 'min(550px, 45vw)', boxSizing: 'border-box',
        padding: '18px 24px', borderRadius: '18px',
        background: 'rgba(15,23,42,.94)', color: '#fff',
        boxShadow: '0 15px 50px rgba(15,23,42,.32)',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        border: '1px solid rgba(255,255,255,.16)',
      });
      document.body.appendChild(el);
    }
    const clean = (str) => str.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
    el.innerHTML = [
      '<div style="font-size:12px;color:#a5b4fc;font-weight:800;letter-spacing:.16em;margin-bottom:6px">',
      clean(kicker), '</div><div style="font-size:24px;font-weight:800;letter-spacing:-.02em;line-height:1.22">',
      clean(headline), '</div><div style="font-size:13px;color:#cbd5e1;margin-top:7px">',
      clean(detail), '</div>',
    ].join('');
  }, { kicker, headline, detail });
}

async function hideEditorialCaption(page) {
  await page.evaluate(() => document.getElementById('promotion-editorial-caption')?.remove());
}

async function run() {
  await mkdir(MEDIA_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    recordVideo: {
      dir: MEDIA_DIR,
      size: { width: 1600, height: 900 },
    },
  });

  const page = await context.newPage();
  const video = page.video();

  try {
    await page.addInitScript((markdown) => {
      localStorage.setItem('resume-onboarding-v1-complete', '1');
      localStorage.setItem('resume_ui_language', 'en');
      // Collapse the real page-height widget instead of concealing it via CSS.
      localStorage.setItem('height-guard-collapsed', 'true');
      localStorage.setItem('resume-markdown', markdown);
      localStorage.setItem('resume-settings', JSON.stringify({
        lang: 'en',
        marketRegion: 'us',
        paperSize: 'letter',
        dateStyle: 'month-short',
        layoutMode: 'split',
      }));
    }, initialMarkdown);

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const preview = page.locator('#resume-print-content');
    await preview.waitFor({ state: 'visible', timeout: 20000 });
    await page.getByRole('group', { name: 'Interface language' }).waitFor({ state: 'visible' });
    // Confirm actual sample data is rendered before claiming this is a screenshot.
    await preview.getByText('Alex Morgan').first().waitFor({ state: 'visible', timeout: 15000 });
    await pause(page, 600);
    await page.screenshot({
      path: resolve(MEDIA_DIR, 'resume-craft-product-screenshot.png'),
      animations: 'disabled',
    });
    await setEditorialCaption(page, '01 / BUILD', 'Start in a simple form', 'No account required. Your work stays in this browser.');
    await pause(page, 1800);

    // Replace text near the *top* so the change is visible next to the real preview.
    await setEditorialCaption(page, '02 / EDIT', 'Markdown and live preview', 'Watch the summary update as it is typed.');
    await page.getByRole('button', {
      name: /^(Markdown source editor|Markdown 源码编辑模式)$/,
    }).click();
    const editor = page.locator('#markdown-textarea');
    await editor.waitFor({ state: 'visible', timeout: 10000 });
    const originalSummary = 'Building clear and accessible user experiences.';
    const summaryOffset = initialMarkdown.indexOf(originalSummary);
    if (summaryOffset < 0) throw new Error('Demo summary not found in Markdown fixture');
    await editor.evaluate((element, selection) => {
      element.focus();
      element.setSelectionRange(selection.start, selection.end);
    }, { start: summaryOffset, end: summaryOffset + originalSummary.length });
    const newSummary = 'Creating clear, accessible interfaces with React.';
    await editor.pressSequentially(newSummary, { delay: 48 });
    await preview.getByText(newSummary, { exact: false })
      .waitFor({ state: 'visible', timeout: 15000 });
    await pause(page, 1500);
    await hideEditorialCaption(page);
    await page.screenshot({
      path: resolve(MEDIA_DIR, 'resume-craft-markdown-preview.png'),
      animations: 'disabled',
    });

    await setEditorialCaption(page, '03 / LAYOUT', 'One-click page fitting', 'Adjust page spacing using the real editor controls.');
    await page.getByRole('button', { name: /Form editor|表单编辑/ }).click();
    await pause(page, 700);
    const autoFit = page.getByRole('button', { name: /Auto fit to single page|单页自动适配/ });
    await autoFit.click();
    await pause(page, 1600);

    await setEditorialCaption(page, '04 / EXPORT', 'Choose your PDF option', 'Export options shown — this clip does not claim a completed download.');
    const exportToggle = page.getByRole('button', { name: 'Choose PDF export mode' }).first();
    await exportToggle.click();
    const exportMenu = page.getByRole('dialog', { name: 'Download options' });
    await exportMenu.waitFor({ state: 'visible', timeout: 10000 });
    await pause(page, 1400);
    await hideEditorialCaption(page);
    await page.screenshot({
      path: resolve(MEDIA_DIR, 'resume-craft-download-options.png'),
      animations: 'disabled',
    });
    await setEditorialCaption(page, '04 / EXPORT', 'Choose your PDF option', 'Browser print or direct PDF export.');
    await pause(page, 1700);
    await page.keyboard.press('Escape');
    await hideEditorialCaption(page);
  } finally {
    await context.close();
    await browser.close();
  }

  if (!video) throw new Error('Playwright did not initialize recording');
  await copyFile(await video.path(), resolve(MEDIA_DIR, 'resume-craft-demo.webm'));
  await copyFile(resolve(process.cwd(), 'public/og-card.png'),
    resolve(MEDIA_DIR, 'resume-craft-social-cover.png'));

  for (const file of [
    'resume-craft-product-screenshot.png',
    'resume-craft-markdown-preview.png',
    'resume-craft-download-options.png',
    'resume-craft-demo.webm',
    'resume-craft-social-cover.png',
  ]) {
    const result = await stat(resolve(MEDIA_DIR, file));
    if (result.size < 1000) throw new Error(`Media file too small: ${file}`);
    console.log(`${file} (${Math.round(result.size / 1024)} KiB)`);
  }
  console.log('Real product capture completed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
