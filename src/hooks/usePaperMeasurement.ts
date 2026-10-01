import { useState, useEffect, useMemo, useRef, RefObject } from 'react';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { PaperSize } from '../types';
import { getPaperSpec } from '../lib/paper';

interface PaperMetrics {
  isOver: boolean;
  overflowPercent: number;
  overflowPixels: number;
  actualPages: number;
}

export function usePaperMeasurement(
  elementRef: RefObject<HTMLDivElement | null>,
  targetPageLimit: 1 | 2 | 3,
  onPageCountChange?: (count: number) => void,
  _dependencies: unknown[] = [],
  paperSize: PaperSize = 'a4'
) {
  const paperSpec = getPaperSpec(paperSize);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperWidth, setWrapperWidth] = useState<number>(850);
  const [wrapperHeight, setWrapperHeight] = useState<number>(1100);
  const [unscaledHeight, setUnscaledHeight] = useState<number>(0);
  const [metrics, setMetrics] = useState<PaperMetrics>({
    isOver: false,
    overflowPercent: 0,
    overflowPixels: 0,
    actualPages: 1,
  });
  const onPageCountChangeRef = useRef(onPageCountChange);

  useEffect(() => {
    onPageCountChangeRef.current = onPageCountChange;
  }, [onPageCountChange]);

  const [zoomMode, setZoomMode] = useState<'fit-width' | 'fit-page' | number>(() => {
    const saved = storage.getString(STORAGE_KEYS.PREVIEW_ZOOM);
    if (saved) {
      // Backward compatibility with the previous ambiguous "fit" mode.
      if (saved === 'fit' || saved === 'fit-width') return 'fit-width';
      if (saved === 'fit-page') return 'fit-page';
      const parsed = parseFloat(saved);
      if (!isNaN(parsed)) return parsed;
    }
    return 'fit-width';
  });

  // Track wrapper element width. Resize work is coalesced into one animation frame.
  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    let rafId: number | null = null;
    const handleResize = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const newWidth = element.clientWidth;
        const newHeight = element.clientHeight;
        setWrapperWidth((prev) => (Math.abs(prev - newWidth) > 1 ? newWidth : prev));
        setWrapperHeight((prev) => (Math.abs(prev - newHeight) > 1 ? newHeight : prev));
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

  const calculatedZoom = useMemo(() => {
    const horizontalPadding = wrapperWidth < 640 ? 20 : 64;
    const verticalPadding = wrapperWidth < 640 ? 20 : 64;
    const targetWidth = Math.max(100, wrapperWidth - horizontalPadding);
    const widthScale = targetWidth / paperSpec.baseWidthPx;

    if (zoomMode === 'fit-width') {
      // Auto-fit should preserve readability and never enlarge beyond 100%.
      return Math.max(0.2, Math.min(1, widthScale));
    }

    if (zoomMode === 'fit-page') {
      const paperHeightPx = paperSpec.baseWidthPx * paperSpec.aspectRatio;
      const targetHeight = Math.max(100, wrapperHeight - verticalPadding);
      const heightScale = targetHeight / paperHeightPx;

      // Fit one physical page in the available viewport. Multi-page content can still scroll.
      return Math.max(0.2, Math.min(1, widthScale, heightScale));
    }

    return zoomMode;
  }, [
    zoomMode,
    wrapperWidth,
    wrapperHeight,
    paperSpec.baseWidthPx,
    paperSpec.aspectRatio,
  ]);

  // Keep observers stable while the user types. Previously this effect was torn down and
  // recreated for every markdown/settings update. MutationObserver + ResizeObserver now
  // schedule a single rAF measurement after the rendered preview actually changes.
  useEffect(() => {
    const element = elementRef?.current;
    if (!element) return;

    let rafId: number | null = null;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;

    const measureNow = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      if (!width || !height) return;

      const pHeight = width * paperSpec.aspectRatio;
      let maxContentBottom = 0;
      const elemRect = element.getBoundingClientRect();
      const scale = elemRect.width > 0 ? elemRect.width / width : 1;

      const contentNodes = element.querySelectorAll(
        'h1, h2, h3, h4, p, li, table, img, .resume-header, blockquote, [data-resume-section]'
      );

      contentNodes.forEach((node) => {
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
          if (bottomUnscaled > maxContentBottom) maxContentBottom = bottomUnscaled;
        }
      });

      const effectiveHeight = maxContentBottom > 0
        ? Math.max(pHeight, maxContentBottom + 16)
        : Math.max(pHeight, height);

      setUnscaledHeight((prev) => Math.abs(prev - effectiveHeight) > 0.5 ? effectiveHeight : prev);

      const tolerance = 36;
      const actualPages = Math.max(1, Math.ceil((effectiveHeight - tolerance) / pHeight));
      onPageCountChangeRef.current?.(actualPages);

      const limitHeight = targetPageLimit * pHeight;
      const nextMetrics: PaperMetrics = {
        isOver: effectiveHeight > limitHeight + tolerance,
        overflowPixels: Math.max(0, Math.round(effectiveHeight - limitHeight)),
        overflowPercent: Math.min(150, Math.max(10, Math.round((effectiveHeight / limitHeight) * 100))),
        actualPages,
      };

      setMetrics((prev) => (
        prev.isOver === nextMetrics.isOver &&
        prev.overflowPixels === nextMetrics.overflowPixels &&
        prev.overflowPercent === nextMetrics.overflowPercent &&
        prev.actualPages === nextMetrics.actualPages
          ? prev
          : nextMetrics
      ));
    };

    const scheduleMeasure = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        measureNow();
      });
    };

    scheduleMeasure();

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(element);

    const mutationObserver = new MutationObserver(scheduleMeasure);
    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    settleTimer = setTimeout(scheduleMeasure, 300);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (settleTimer !== null) clearTimeout(settleTimer);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [elementRef, targetPageLimit, paperSpec.aspectRatio]);

  const handleZoomChange = (newMode: 'fit-width' | 'fit-page' | number) => {
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