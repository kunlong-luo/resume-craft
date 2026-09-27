import type { PaperSize } from '../types';
import { getPaperSpec } from './paper';

/**
 * Returns the CSS injected into react-to-print's isolated print document.
 * Keep page dimensions derived from PAPER_SPECS so A4/Letter never drift.
 */
export function getPrintPageStyle(paperSize?: PaperSize): string {
  const paper = getPaperSpec(paperSize);

  return `
    @page {
      size: ${paper.cssPageSize} portrait;
      margin: 0mm !important;
    }

    @media print {
      html,
      body {
        width: ${paper.widthMm}mm !important;
        min-width: ${paper.widthMm}mm !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      #resume-print-content,
      .resume-content {
        width: ${paper.widthMm}mm !important;
        min-width: ${paper.widthMm}mm !important;
        max-width: ${paper.widthMm}mm !important;
        min-height: ${paper.heightMm}mm !important;
        margin: 0 auto !important;
        box-sizing: border-box !important;
      }
    }
  `;
}
