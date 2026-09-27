import { describe, expect, it } from 'vitest';
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  A4_WIDTH_PX,
  getPageDimensions,
  getPaperMarginMm,
} from '../lib/page-layout';

describe('Paper and page layout engine', () => {
  it('uses stable physical A4 dimensions', () => {
    expect(A4_WIDTH_MM).toBe(210);
    expect(A4_HEIGHT_MM).toBe(297);
    expect(A4_WIDTH_PX).toBeCloseTo(793.7, 1);
  });

  it('keeps preview and export margins deterministic', () => {
    expect(getPaperMarginMm('compact')).toBe(12);
    expect(getPaperMarginMm('standard')).toBe(18);
    expect(getPaperMarginMm('relaxed')).toBe(25);
  });

  it('provides precise physical dimensions for both A4 and US Letter', () => {
    const a4 = getPageDimensions('a4');
    expect(a4.widthMm).toBe(210);
    expect(a4.heightMm).toBe(297);
    expect(a4.baseWidthPx).toBe(794);
    expect(a4.cssPageSize).toBe('A4');
    expect(a4.aspectRatio).toBeCloseTo(297 / 210, 4);

    const letter = getPageDimensions('letter');
    expect(letter.widthMm).toBe(215.9);
    expect(letter.heightMm).toBe(279.4);
    expect(letter.baseWidthPx).toBe(816);
    expect(letter.cssPageSize).toBe('Letter');
    expect(letter.aspectRatio).toBeCloseTo(279.4 / 215.9, 4);
  });
});
