import { useState, useEffect, useMemo, useRef, RefObject } from 'react';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { PaperSize } from '../types';
import { getPaperSpec } from '../lib/paper';

interface A4Metrics {
  isOver: boolean;
  overflowPercent: number;
  overflowPixels: number;
  actualPages: number;
}

export function useA4Measurement(
  elementRef: RefObject<HTMLDivElement | null>,
  targetPageLimit: 1 | 2 | 3,
  onPageCountChange?: (count: number) => void,
  dependencies: any[] = [],
  paperSize: PaperSize = 'a4'
) {
  const paperSpec = getPaperSpec(paperSize);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperWidth, setWrapperWidth] = useState<number>(850);
  const [unscaledHeight, setUnscaledHeight] = useState<number>(0);
  const [metrics, setMetrics] = useState<A4Metrics>({
    isOver: false,
    overflowPercent: 0,
    overflowPixels: 0,
    actualPages: 1,
  });

  const [zoomMode, setZoomMode] = useState<'fit' | number>(() => {
    const saved = storage.getString(STORAGE_KEYS.PREVIEW_ZOOM);
    if (saved) {
      if (saved === 'fit') return 'fit';
      const parsed = parseFloat(saved);
      if (!isNaN(parsed)) return parsed;
    }
    return 'fit';
  });

  // Track wrapper element width
  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    let rafId: number | null = null;
    const handleResize = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!element) return;
        const newWidth = element.clientWidth;
        setWrapperWidth((prev) => (Math.abs(prev - newWidth) > 1 ? newWidth : prev));
      });
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(element);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  // Compute calculated scale factor based on viewport width and paper standard width
  const calculatedZoom = useMemo(() => {
    if (zoomMode === 'fit') {
      const horizontalPadding = wrapperWidth < 640 ? 20 : 64;
      const targetWidth = Math.max(100, wrapperWidth - horizontalPadding);
      const scale = targetWidth / paperSpec.baseWidthPx;
      return Math.max(0.2, Math.min(1.2, scale));
    }
    return zoomMode;
  }, [zoomMode, wrapperWidth, paperSpec.baseWidthPx]);

  // Track and measure sheet height according to paper aspect ratio
  useEffect(() => {
    const element = elementRef?.current;
    if (!element) return;

    let rafId: number | null = null;
    const measure = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!element) return;
        const width = element.clientWidth;
        const height = element.clientHeight;
        if (!width || !height) return;

        // Paper aspect ratio height (heightMm / widthMm)
        const pHeight = width * paperSpec.aspectRatio;

        // Measure true content height by inspecting actual resume content nodes
        let maxContentBottom = 0;
        const elemRect = element.getBoundingClientRect();
        const scale = elemRect.width > 0 ? elemRect.width / width : 1;

        // Query actual content elements, excluding absolute overlay guides (like cut lines)
        const contentNodes = element.querySelectorAll(
          'h1, h2, h3, h4, p, li, table, img, .resume-header, blockquote, [data-resume-section]'
        );

        if (contentNodes.length > 0) {
          contentNodes.forEach((node) => {
            // Skip print-hidden overlay controls or cut lines
            if (
              node.classList.contains('print:hidden') || 
              node.classList.contains('scissors-guide') ||
              node.closest('.print\\:hidden')
            ) {
              return;
            }
            const rect = node.getBoundingClientRect();
            if (rect.height > 0) {
              const bottomUnscaled = (rect.bottom - elemRect.top) / scale;
              if (bottomUnscaled > maxContentBottom) {
                maxContentBottom = bottomUnscaled;
              }
            }
          });
        }

        // Include bottom margin allowance (16px)
        const effectiveHeight = maxContentBottom > 0
          ? Math.max(pHeight, maxContentBottom + 16)
          : Math.max(pHeight, height);

        setUnscaledHeight(effectiveHeight);
        
        // 36px tolerance (~9.5mm) for subpixel rounding, font metrics & padding at page boundary
        const tolerance = 36;
        const actualPages = Math.max(1, Math.ceil((effectiveHeight - tolerance) / pHeight));
        onPageCountChange?.(actualPages);

        const limitHeight = targetPageLimit * pHeight;
        const isOver = effectiveHeight > limitHeight + tolerance;
        const overflowPixels = Math.max(0, Math.round(effectiveHeight - limitHeight));
        const overflowPercent = Math.min(
          150,
          Math.max(10, Math.round((effectiveHeight / limitHeight) * 100))
        );

        setMetrics({ isOver, overflowPercent, overflowPixels, actualPages });
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    const timer = setTimeout(measure, 300);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [elementRef, targetPageLimit, onPageCountChange, paperSpec.aspectRatio, ...dependencies]);

  const handleZoomChange = (newMode: 'fit' | number) => {
    setZoomMode(newMode);
    storage.set(STORAGE_KEYS.PREVIEW_ZOOM, typeof newMode === 'number' ? String(newMode) : newMode);
  };

  return {
    wrapperRef,
    wrapperWidth,
    unscaledHeight,
    zoomMode,
    setZoomMode: handleZoomChange,
    calculatedZoom,
    metrics
  };
}
