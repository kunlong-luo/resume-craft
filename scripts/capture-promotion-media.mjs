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

async function run() {
  await mkdir(MEDIA_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    recordVideo: {
      dir: MEDIA_DIR,
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();
  const video = page.video();

  try {
    await page.addInitScript((markdown) => {
      localStorage.setItem('resume-onboarding-v1-complete', '1');
      localStorage.setItem('resume_ui_language', 'en');
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
    await pause(page, 1700);
    await page.screenshot({
      path: resolve(MEDIA_DIR, 'resume-craft-product-screenshot.png'),
      animations: 'disabled',
    });

    // Demonstrate actual Markdown changes appearing in the rendered preview.
    await page.getByRole('button', {
      name: /^(Markdown source editor|Markdown 源码编辑模式)$/,
    }).click();
    const editor = page.locator('#markdown-textarea');
    await editor.waitFor({ state: 'visible', timeout: 10000 });
    await pause(page, 1600);
    await editor.press('ControlOrMeta+End');
    await editor.press('Enter');
    await editor.pressSequentially('- Shipped reliable UI and preview workflows.', { delay: 35 });
    await preview.getByText('Shipped reliable UI and preview workflows.', { exact: false })
      .waitFor({ state: 'visible', timeout: 15000 });
    await pause(page, 2300);
    await page.screenshot({
      path: resolve(MEDIA_DIR, 'resume-craft-markdown-preview.png'),
      animations: 'disabled',
    });

    await page.getByRole('button', { name: /Form editor|表单编辑/ }).click();
    await pause(page, 1900);
    const autoFit = page.getByRole('button', { name: /Auto fit to single page|单页自动适配/ });
    if (await autoFit.count()) {
      await autoFit.click();
      await pause(page, 1600);
    }
    const exportOptions = page.getByRole('button', { name: /Download options|下载选项/ }).first();
    if (await exportOptions.count()) {
      await exportOptions.click();
      await pause(page, 2100);
      await page.screenshot({
        path: resolve(MEDIA_DIR, 'resume-craft-download-options.png'),
        animations: 'disabled',
      });
      await page.keyboard.press('Escape');
    } else {
      // Do not pretend a PDF was exported if the menu is unavailable.
      await page.screenshot({
        path: resolve(MEDIA_DIR, 'resume-craft-download-options.png'),
        animations: 'disabled',
      });
    }
    await pause(page, 1700);
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
