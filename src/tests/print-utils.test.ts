import { describe, expect, it } from 'vitest';
import { getPrintPageStyle } from '../lib/print-utils';

describe('paper-specific print page style', () => {
  it('uses exact US Letter dimensions for browser printing', () => {
    const css = getPrintPageStyle('letter');

    expect(css).toContain('size: Letter portrait');
    expect(css).toContain('width: 215.9mm !important');
    expect(css).toContain('min-width: 215.9mm !important');
    expect(css).not.toContain('width: 210mm !important');
  });

  it('uses exact A4 dimensions for browser printing', () => {
    const css = getPrintPageStyle('a4');

    expect(css).toContain('size: A4 portrait');
    expect(css).toContain('width: 210mm !important');
    expect(css).toContain('min-width: 210mm !important');
  });
});
