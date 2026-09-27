import { PaperSize } from '../types';
import { getPaperSpec } from './paper';

export function getPrintPageStyle(paperSize?: PaperSize): string {
  const paperSpec = getPaperSpec(paperSize);

  return `
    @page {
      size: ${paperSpec.cssPageSize} portrait;
      margin: 0mm !important;
    }

    @media print {
      html,
      body {
        width: ${paperSpec.widthMm}mm !important;
        min-width: ${paperSpec.widthMm}mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;
}
