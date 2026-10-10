import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectFile = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('launch cover asset consistency', () => {
  it('uses matching marketing copy and distinguishes illustrations from screenshots', () => {
    for (const filename of ['.github/assets/readme-banner.svg', 'public/og-card.svg']) {
      const svg = projectFile(filename);
      expect(svg).toContain('Build a better');
      expect(svg).toContain('resume. Faster.');
      expect(svg).toContain('ATS checks. PDF export.');
      expect(svg).toContain('No sign-up required');
      expect(svg).toContain('not a product screenshot');
      expect(svg).toContain('viewBox="0 0 1280 640"');
    }
  });

  it('rasterizes the social SVG instead of shipping the previous embedded PNG', () => {
    const script = projectFile('scripts/generate-og-card.mjs');
    const html = projectFile('index.html');

    expect(script).toContain("readFileSync(source)");
    expect(script).toContain("await loadImage(svg)");
    expect(script).toContain("await canvas.encode('png')");
    expect(script).not.toMatch(/const data = ['"]iVBORw/);
    expect(html).toContain('og-card.png');
  });
});
