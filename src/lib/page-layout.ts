import { PaperMargin, PaperSize } from '../types';
import { PAPER_SPECS, getPaperSpec } from './paper';

export const A4_WIDTH_MM = PAPER_SPECS.a4.widthMm;
export const A4_HEIGHT_MM = PAPER_SPECS.a4.heightMm;
export const CSS_PX_PER_MM = 96 / 25.4;
export const A4_WIDTH_PX = A4_WIDTH_MM * CSS_PX_PER_MM;
export const A4_HEIGHT_PX = A4_HEIGHT_MM * CSS_PX_PER_MM;

export function getPageDimensions(paperSize: PaperSize = 'a4') {
  const spec = getPaperSpec(paperSize);
  return {
    widthMm: spec.widthMm,
    heightMm: spec.heightMm,
    widthPx: spec.widthMm * CSS_PX_PER_MM,
    heightPx: spec.heightMm * CSS_PX_PER_MM,
    aspectRatio: spec.aspectRatio,
    baseWidthPx: spec.baseWidthPx,
    cssPageSize: spec.cssPageSize,
  };
}

const PAPER_MARGIN_MM: Record<PaperMargin, number> = {
  compact: 12,
  standard: 18,
  relaxed: 25,
};

export function getPaperMarginMm(margin: PaperMargin): number {
  return PAPER_MARGIN_MM[margin];
}
