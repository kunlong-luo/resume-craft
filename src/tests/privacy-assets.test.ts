import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const indexCss = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
const viteConfig = readFileSync(new URL('../../vite.config.ts', import.meta.url), 'utf8');
const ogCard = readFileSync(new URL('../../public/og-card.svg', import.meta.url), 'utf8');

describe('privacy-first static assets', () => {
  it('does not load fonts from third-party CDNs', () => {
    const source = `${indexHtml}\n${indexCss}\n${viteConfig}`;

    expect(source).not.toContain('fonts.googleapis.com');
    expect(source).not.toContain('fonts.gstatic.com');
    expect(source).not.toMatch(/@import\s+url\([^)]*font/i);
    expect(source).not.toContain('google-fonts-cache');
    expect(source).not.toContain('gstatic-fonts-cache');
  });

  it('uses a dedicated 1200x630 social preview card', () => {
    expect(ogCard).toContain('width="1200"');
    expect(ogCard).toContain('height="630"');
    expect(indexHtml).toContain('og-card.svg');
    expect(indexHtml).toContain('og:image:width" content="1200"');
    expect(indexHtml).toContain('og:image:height" content="630"');
    expect(indexHtml).not.toContain('property="og:image" content="https://kunlong-luo.github.io/resume-craft/pwa-512x512.png"');
  });

  it('keeps explicit local system font stacks', () => {
    expect(indexCss).toContain('--font-ui: -apple-system');
    expect(indexCss).toContain('"PingFang SC"');
    expect(indexCss).toContain('"Microsoft YaHei"');
    expect(indexCss).toContain('ui-monospace');
  });
});
