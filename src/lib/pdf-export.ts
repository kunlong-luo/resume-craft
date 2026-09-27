import { CSS_PX_PER_MM } from './page-layout';
import { PaperSize } from '../types';
import { getPaperSpec } from './paper';

export interface DirectPDFExportOptions {
  filename?: string;
  onProgress?: (status: string) => void;
  paperSize?: PaperSize;
}

/**
 * Intelligent helper to find a white pixel gap between text lines/sections
 * near the page boundary to prevent slicing text in half across PDF pages.
 */
function findSmartSplitY(
  mainCtx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  startY: number,
  idealPageCanvasHeight: number
): number {
  const idealY = startY + idealPageCanvasHeight;
  if (idealY >= canvasHeight) {
    return canvasHeight;
  }

  // Look back up to 180px in canvas coordinates for a blank horizontal gap
  const minSearchY = Math.max(startY + Math.floor(idealPageCanvasHeight * 0.65), idealY - 180);
  
  // Inspect content area columns (from 4% width to 96% width)
  const startX = Math.floor(canvasWidth * 0.04);
  const endX = Math.floor(canvasWidth * 0.96);
  const sampleStep = Math.max(1, Math.floor((endX - startX) / 80));

  let bestGapCenterY = idealY;
  let inGap = false;
  let gapBottomY = idealY;
  let gapTopY = idealY;
  let maxGapSize = 0;

  for (let y = idealY; y >= minSearchY; y--) {
    let isRowWhite = true;
    try {
      const imgData = mainCtx.getImageData(startX, y, endX - startX, 1);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4 * sampleStep) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // If pixel is significantly non-white/dark (text pixel)
        if (a > 15 && (r < 240 || g < 240 || b < 240)) {
          isRowWhite = false;
          break;
        }
      }
    } catch {
      break;
    }

    if (isRowWhite) {
      if (!inGap) {
        inGap = true;
        gapBottomY = y;
      }
      gapTopY = y;
    } else {
      if (inGap) {
        const gapSize = gapBottomY - gapTopY;
        if (gapSize > maxGapSize) {
          maxGapSize = gapSize;
          bestGapCenterY = Math.floor((gapBottomY + gapTopY) / 2);
        }
        inGap = false;
      }
    }
  }

  if (inGap) {
    const gapSize = gapBottomY - gapTopY;
    if (gapSize > maxGapSize) {
      maxGapSize = gapSize;
      bestGapCenterY = Math.floor((gapBottomY + gapTopY) / 2);
    }
  }

  // If a valid white gap was found with at least 4px height, split there!
  if (maxGapSize >= 4) {
    return bestGapCenterY;
  }

  // Fallback if no white gap found: split at idealY
  return idealY;
}

/**
 * Intelligent helper to check if a horizontal canvas slice is completely blank/white background.
 * Prevents appending trailing empty pages to exported PDF documents.
 */
function isCanvasSliceBlank(
  mainCtx: CanvasRenderingContext2D,
  canvasWidth: number,
  startY: number,
  endY: number
): boolean {
  if (endY <= startY) return true;
  const height = endY - startY;
  if (height <= 2) return true;

  const startX = Math.floor(canvasWidth * 0.03);
  const endX = Math.floor(canvasWidth * 0.97);
  const sampleStep = Math.max(1, Math.floor((endX - startX) / 60));

  try {
    // Sample horizontal rows instead of reading the entire remaining bitmap.
    // Large multi-page canvases can otherwise allocate tens of MB per check.
    const rowStep = Math.max(2, Math.floor(height / 80));
    const probeRows = new Set<number>([
      startY,
      Math.max(startY, endY - 2),
    ]);
    for (let y = startY; y < endY; y += rowStep) probeRows.add(y);

    for (const y of probeRows) {
      const imgData = mainCtx.getImageData(startX, y, endX - startX, 1);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4 * sampleStep) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a > 15 && (r < 240 || g < 240 || b < 240)) {
          return false;
        }
      }
    }
  } catch {
    return false;
  }
  return true;
}

/**
 * Direct PDF generation and download utility using html2canvas + jsPDF.
 * Bypasses browser print dialog and downloads a pristine A4 PDF file directly to the user's device.
 */
export async function exportDirectPDF(
  elementOrId: HTMLElement | string,
  options: DirectPDFExportOptions = {}
): Promise<boolean> {
  const { filename = 'resume.pdf', onProgress, paperSize: explicitPaperSize } = options;

  onProgress?.('准备简历渲染数据...');
  let targetElement = typeof elementOrId === 'string'
    ? document.getElementById(elementOrId)
    : elementOrId;

  if (!targetElement) {
    targetElement = document.getElementById('resume-print-content') 
      || document.querySelector('.resume-content') as HTMLElement;
  }

  if (!targetElement) {
    throw new Error('未找到简历内容节点');
  }

  const paperSpec = getPaperSpec(
    explicitPaperSize ||
    (targetElement.getAttribute?.('data-paper-size') as PaperSize) ||
    'a4'
  );
  const pageWidth = paperSpec.widthMm;
  const pageHeight = paperSpec.heightMm;
  const jsPdfFormat = paperSpec.id === 'letter' ? 'letter' : 'a4';
  const windowWidthPx = Math.ceil(pageWidth * CSS_PX_PER_MM);
  const windowHeightPx = Math.ceil(pageHeight * CSS_PX_PER_MM);

  // Ensure fonts are ready before canvas capture
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font loading check skipped', e);
    }
  }

  onProgress?.('构建高保真渲染副本...');
  
  // Create an offscreen wrapper placed far off-screen
  const exportWrapper = document.createElement('div');
  exportWrapper.id = 'resume-temp-pdf-export-wrapper';
  exportWrapper.className = 'light';
  exportWrapper.style.position = 'fixed';
  exportWrapper.style.left = '0px';
  exportWrapper.style.top = '0px';
  exportWrapper.style.width = `${pageWidth}mm`;
  exportWrapper.style.minHeight = `${pageHeight}mm`;
  exportWrapper.style.zIndex = '-2147483647';
  exportWrapper.style.opacity = '1';
  exportWrapper.style.visibility = 'visible';
  exportWrapper.style.pointerEvents = 'none';
  exportWrapper.style.overflow = 'visible';
  exportWrapper.style.backgroundColor = '#ffffff';
  exportWrapper.style.color = '#0f172a';
  exportWrapper.style.boxSizing = 'border-box';
  exportWrapper.style.contain = 'layout style';

  const clone = targetElement.cloneNode(true) as HTMLElement;
  clone.id = 'resume-temp-pdf-export-clone';
  clone.setAttribute('data-paper-size', paperSpec.id);

  // Clean out UI elements that shouldn't appear in export (guides, overflow alerts, toolbars)
  const hiddenSelectors = [
    '.print\\:hidden', 
    '.print-hidden', 
    '[data-print-hidden]',
    '.scissors-guide'
  ];
  hiddenSelectors.forEach(sel => {
    clone.querySelectorAll(sel).forEach(el => el.remove());
  });

  // Enforce pristine printable styling on the clone with box-sizing & padding
  clone.style.position = 'relative';
  clone.style.left = 'auto';
  clone.style.top = 'auto';
  clone.style.width = `${pageWidth}mm`;
  clone.style.minWidth = `${pageWidth}mm`;
  clone.style.maxWidth = `${pageWidth}mm`;
  clone.style.minHeight = `${pageHeight}mm`;
  clone.style.transform = 'none';
  clone.style.margin = '0 auto';
  clone.style.boxSizing = 'border-box';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#0f172a';
  clone.style.opacity = '1';
  clone.style.visibility = 'visible';
  clone.style.display = 'block';
  clone.style.height = 'auto';
  clone.style.overflow = 'visible';

  const stabilizer = document.createElement('style');
  stabilizer.textContent = `
    #resume-temp-pdf-export-clone,
    #resume-temp-pdf-export-clone *,
    #resume-temp-pdf-export-clone *::before,
    #resume-temp-pdf-export-clone *::after {
      animation: none !important;
      transition: none !important;
    }
  `;
  exportWrapper.appendChild(stabilizer);
  exportWrapper.appendChild(clone);
  document.body.appendChild(exportWrapper);

  const manualBreakOffsets = Array.from(clone.querySelectorAll<HTMLElement>('.print-page-break')).map((el) => {
    el.style.display = 'block';
    el.style.height = '0';
    el.style.margin = '0';
    el.style.padding = '0';
    el.style.border = '0';
    el.style.visibility = 'hidden';
    return el.offsetTop;
  });

  try {
    onProgress?.('正在加载渲染引擎与排版组件...');
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas-pro'),
      import('jspdf')
    ]);

    onProgress?.('正在生成超清渲染光栅...');
    
    // Let the offscreen clone settle before capture.
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    const canvas = await html2canvas(clone, {
      scale: Math.min(2, Math.max(1.5, window.devicePixelRatio || 1.5)),
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: windowWidthPx,
      windowHeight: Math.max(windowHeightPx, clone.scrollHeight || windowHeightPx),
    });

    onProgress?.(`正在进行 ${paperSpec.id === 'letter' ? 'US Letter' : 'A4'} 智能防截断分页排版...`);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: jsPdfFormat,
      compress: true
    });

    // Calculate canvas page slice height in canvas pixels based on paper aspect ratio
    const idealPageCanvasHeight = Math.floor(canvas.width * (pageHeight / pageWidth));
    const mainCtx = canvas.getContext('2d', { willReadFrequently: true });

    const canvasScale = canvas.width / Math.max(1, clone.scrollWidth);
    const manualBreakCanvasY = manualBreakOffsets
      .map((offset) => Math.round(offset * canvasScale))
      .filter((offset) => offset > 0 && offset < canvas.height)
      .sort((a, b) => a - b);

    let currentY = 0;
    let pageCount = 0;

    while (currentY < canvas.height) {
      // Check if remaining slice from currentY to canvas.height is completely blank/white
      if (mainCtx && isCanvasSliceBlank(mainCtx, canvas.width, currentY, canvas.height)) {
        break;
      }

      pageCount++;
      onProgress?.(`正在渲染第 ${pageCount} 页 PDF (智能避让文字)...`);

      let splitY = Math.min(canvas.height, currentY + idealPageCanvasHeight);
      const nextManualBreak = manualBreakCanvasY.find(
        (offset) => offset > currentY + 2 && offset <= splitY
      );

      if (nextManualBreak) {
        splitY = nextManualBreak;
      } else if (splitY < canvas.height && mainCtx) {
        splitY = findSmartSplitY(mainCtx, canvas.width, canvas.height, currentY, idealPageCanvasHeight);
      }

      const sliceHeight = splitY - currentY;
      if (sliceHeight <= 0) break;

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = idealPageCanvasHeight; // maintain standard canvas ratio
      const ctx = pageCanvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        // Draw canvas slice onto pageCanvas
        ctx.drawImage(
          canvas,
          0, currentY, canvas.width, sliceHeight,
          0, 0, canvas.width, sliceHeight
        );

        if (pageCount > 1) {
          pdf.addPage(jsPdfFormat, 'p');
        }

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.96);
        pdf.addImage(pageImgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
      }

      currentY = splitY;
    }

    onProgress?.('正在保存 PDF 文件...');
    const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    
    // Trigger direct client download
    pdf.save(finalFilename);

    return true;
  } finally {
    if (document.body.contains(exportWrapper)) {
      document.body.removeChild(exportWrapper);
    }
  }
}
