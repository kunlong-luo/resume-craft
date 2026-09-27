import { describe, expect, it } from 'vitest';
import { getPrintPageStyle } from '../lib/print-style';

describe('print page style', () => {
  it('generates an explicit A4 print document size', () => {
    const css = getPrintPageStyle('a4');

    expect(css).toContain('size: A4 portrait');
    expect(css).toContain('width: 210mm !important');
    expect(css).toContain('min-height: 297mm !important');
  });

  it('generates an explicit US Letter print document size', () => {
    const css = getPrintPageStyle('letter');

    expect(css).toContain('size: Letter portrait');
    expect(css).toContain('width: 215.9mm !important');
    expect(css).toContain('min-height: 279.4mm !important');
    expect(css).not.toContain('width: 210mm !important');
  });

  it('resets preview-only positioning inside the isolated print document', () => {
    const css = getPrintPageStyle('a4');

    expect(css).toContain('overflow: visible !important');
    expect(css).toContain('position: static !important');
    expect(css).toContain('transform: none !important');
    expect(css).toContain('inset: auto !important');
  });

  it('falls back to A4 when no paper size is supplied', () => {
    expect(getPrintPageStyle()).toContain('size: A4 portrait');
  });
});
