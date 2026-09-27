import { PaperSize } from '../types';

export interface PaperSpec {
  id: PaperSize;
  labelZh: string;
  labelEn: string;
  widthMm: number;
  heightMm: number;
  cssPageSize: string;
  baseWidthPx: number;
  aspectRatio: number;
}

export const PAPER_SPECS: Record<PaperSize, PaperSpec> = {
  a4: {
    id: 'a4',
    labelZh: 'A4 纸张 (210 × 297 mm)',
    labelEn: 'A4 (210 × 297 mm)',
    widthMm: 210,
    heightMm: 297,
    cssPageSize: 'A4',
    baseWidthPx: 794,
    aspectRatio: 297 / 210, // ~1.4142857
  },
  letter: {
    id: 'letter',
    labelZh: 'US Letter 纸张 (8.5 × 11 in)',
    labelEn: 'US Letter (8.5 × 11 in)',
    widthMm: 215.9,
    heightMm: 279.4,
    cssPageSize: 'Letter',
    baseWidthPx: 816, // 8.5 * 96 = 816px at 96 DPI
    aspectRatio: 279.4 / 215.9, // ~1.2941176
  },
} as const;

export function getPaperSpec(paperSize?: PaperSize): PaperSpec {
  if (paperSize && PAPER_SPECS[paperSize]) {
    return PAPER_SPECS[paperSize];
  }
  return PAPER_SPECS.a4;
}

export function isPaperSize(value: unknown): value is PaperSize {
  return typeof value === 'string' && (value === 'a4' || value === 'letter');
}
