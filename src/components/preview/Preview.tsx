import React, { forwardRef, useState, useEffect, useMemo, useDeferredValue } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ResumeSettings } from '../../types';
import { useResumeStore } from '../../store/useResumeStore';
import { useShallow } from 'zustand/react/shallow';
import { 
  THEME_MAP, FONT_FAMILY_CLASSES, parseResumeHeader, cleanMarkdown, 
  parseH2Sections, getSizeClasses
} from '../../lib/preview-utils';
import { createMarkdownComponents } from './PreviewRenderers';
import { HeightGuard } from './HeightGuard';
import { ResumeHeader } from './ResumeHeader';
import { ZoomControls } from './ZoomControls';
import { usePaperMeasurement } from '../../hooks/usePaperMeasurement';
import { getPaperMarginMm } from '../../lib/page-layout';
import { getPaperSpec } from '../../lib/paper';
import { trackAnalyticsEvent } from '../../lib/analytics';

interface PreviewProps {
  overrideMarkdown?: string;
  overrideSettings?: ResumeSettings;
}

export const Preview = React.memo(forwardRef<HTMLDivElement, PreviewProps>(({ overrideMarkdown, overrideSettings }, ref) => {
  const {
    storeMarkdown,
    storeSettings,
    uiLanguage,
    onChangeSettings,
    setMeasuredPageCount,
  } = useResumeStore(
    useShallow((state) => ({
      storeMarkdown: state.markdown,
      storeSettings: state.settings,
      uiLanguage: state.uiLanguage,
      onChangeSettings: state.updateSetting,
      setMeasuredPageCount: state.setMeasuredPageCount,
    })),
  );

  const activeMarkdown = overrideMarkdown !== undefined ? overrideMarkdown : storeMarkdown;
  const markdown = useDeferredValue(activeMarkdown);
  const settings = overrideSettings !== undefined ? overrideSettings : storeSettings;

  const theme = THEME_MAP[settings.themeColor] || THEME_MAP.blue;
  const fontClass = FONT_FAMILY_CLASSES[settings.fontFamily];

  const [targetPageLimit, setTargetPageLimit] = useState<1 | 2 | 3>(1);
  const [isAutoFitting, setIsAutoFitting] = useState(false);

  const paperSpec = useMemo(() => getPaperSpec(settings.paperSize), [settings.paperSize]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-paper-size', paperSpec.id);
    }
  }, [paperSpec.id]);

  // Hook for page wrapper measuring, zoom calculation & page limits
  const elementRef = (ref && 'current' in ref ? ref : { current: null }) as React.RefObject<HTMLDivElement | null>;
  const {
    wrapperRef,
    unscaledHeight,
    zoomMode,
    setZoomMode,
    calculatedZoom,
    metrics
  } = usePaperMeasurement(
    elementRef,
    targetPageLimit,
    setMeasuredPageCount,
    [markdown, settings],
    paperSpec.id
  );

  // Progressive smart auto-fit loop
  useEffect(() => {
    if (!isAutoFitting || !onChangeSettings) return;

    const runFitStep = () => {
      if (metrics.isOver) {
        let adjusted = false;

        // Progressive compaction step-by-step
        if (settings.margin === 'relaxed') {
          onChangeSettings('margin', 'standard');
          adjusted = true;
        } else if (settings.margin === 'standard') {
          onChangeSettings('margin', 'compact');
          adjusted = true;
        } else if (settings.blockGap > 0.8) {
          onChangeSettings('blockGap', Math.max(0.6, Number((settings.blockGap - 0.1).toFixed(2))));
          adjusted = true;
        } else if (settings.lineHeight > 1.45) {
          onChangeSettings('lineHeight', Math.max(1.35, Number((settings.lineHeight - 0.05).toFixed(2))));
          adjusted = true;
        } else if (settings.fontSize === 'relaxed') {
          onChangeSettings('fontSize', 'standard');
          adjusted = true;
        } else if (settings.fontSize === 'standard') {
          onChangeSettings('fontSize', 'compact');
          adjusted = true;
        } else if (settings.blockGap > 0.35) {
          onChangeSettings('blockGap', Math.max(0.3, Number((settings.blockGap - 0.05).toFixed(2))));
          adjusted = true;
        } else if (settings.lineHeight > 1.25) {
          onChangeSettings('lineHeight', Math.max(1.2, Number((settings.lineHeight - 0.05).toFixed(2))));
          adjusted = true;
        } else if (settings.letterSpacing > -0.01) {
          onChangeSettings('letterSpacing', Math.max(-0.02, Number((settings.letterSpacing - 0.01).toFixed(2))));
          adjusted = true;
        }

        if (!adjusted) {
          setIsAutoFitting(false);
        }
      } else {
        setIsAutoFitting(false);
      }
    };

    const timer = setTimeout(runFitStep, 90);
    return () => clearTimeout(timer);
  }, [isAutoFitting, metrics.isOver, settings, onChangeSettings]);

  const handleSmartAutoFit = () => {
    if (!onChangeSettings) return;
    setTargetPageLimit(1);
    setIsAutoFitting(true);
    trackAnalyticsEvent('auto_fit_used');
  };
  
  const cleaned = useMemo(() => cleanMarkdown(markdown), [markdown]);
  const headerInfo = useMemo(() => parseResumeHeader(cleaned), [cleaned]);
  const sizeClasses = useMemo(() => getSizeClasses(settings.fontSize, theme), [settings.fontSize, theme]);

  const markdownComponents = useMemo(() => {
    return createMarkdownComponents({ headerInfo, sizeClasses, theme, settings });
  }, [headerInfo, sizeClasses, theme, settings]);

  const pagePaddingMm = getPaperMarginMm(settings.margin);

  // Memoized Inner Resume Content
  const resumeInnerContent = useMemo(() => {
    const bodyContent = headerInfo.hasHeader ? headerInfo.bodyMarkdown : cleaned;
    const isLetter = paperSpec.id === 'letter';
    const paperName = uiLanguage === 'en'
      ? (isLetter ? 'Letter' : 'A4')
      : (isLetter ? 'US Letter' : 'A4');
    const pageBreakLabel = uiLanguage === 'en' 
      ? `${paperName} Page {p} Boundary ({size}mm) ✂️` 
      : `${paperName} 第 {p} 页边界线 ({size}mm) ✂️`;

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: ${paperSpec.cssPageSize} portrait;
              margin: 0mm !important;
            }
            .resume-wrapper {
              height: auto !important;
              max-width: none !important;
              width: 100% !important;
            }
            .resume-content {
              transform: none !important;
              position: static !important;
              left: auto !important;
              max-width: none !important;
              width: 100% !important;
            }
          }
          :root {
            --custom-theme-color: ${settings.customColor || '#4f46e5'};
          }
          .custom-accent-text { color: var(--custom-theme-color) !important; }
          .custom-accent-text:hover { filter: brightness(0.85); }
          .custom-h2-accent::before { background-color: var(--custom-theme-color) !important; }
          .custom-li-accent::before { background-color: var(--custom-theme-color) !important; opacity: 0.5; }
          .custom-blockquote-accent { border-left-color: var(--custom-theme-color) !important; background-color: color-mix(in srgb, var(--custom-theme-color) 8%, white) !important; }
          .custom-badge-bg { background-color: color-mix(in srgb, var(--custom-theme-color) 10%, white) !important; border-color: color-mix(in srgb, var(--custom-theme-color) 20%, white) !important; color: var(--custom-theme-color) !important; }
          .custom-icon-color { color: var(--custom-theme-color) !important; }
          .custom-top-accent { background-color: var(--custom-theme-color) !important; }
          .custom-h2-badge-bg { background-color: color-mix(in srgb, var(--custom-theme-color) 8%, white) !important; }
          .custom-h2-badge-border { border-left: 3.5px solid var(--custom-theme-color) !important; }
          .custom-h2-badge-text { color: color-mix(in srgb, var(--custom-theme-color) 80%, black) !important; }

          .resume-content {
            box-sizing: border-box;
          }
          .resume-content h1, .resume-content h2, .resume-content h3, .resume-content h4 {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
          .resume-content li, .resume-content p, .resume-content blockquote, .resume-content table, .resume-content .break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .print-page-break {
            page-break-before: always !important;
            break-before: page !important;
          }

          .resume-content p { margin-bottom: calc(0.5rem * ${settings.blockGap ?? 1.0}) !important; line-height: ${settings.lineHeight ?? 1.6} !important; letter-spacing: ${settings.letterSpacing ?? 0}em !important; }
          .resume-content li { margin-bottom: calc(0.25rem * ${settings.blockGap ?? 1.0}) !important; line-height: ${settings.lineHeight ?? 1.6} !important; letter-spacing: ${settings.letterSpacing ?? 0}em !important; }
          .resume-content h3 { margin-top: calc(1rem * ${settings.blockGap ?? 1.0}) !important; margin-bottom: calc(0.25rem * ${settings.blockGap ?? 1.0}) !important; letter-spacing: ${settings.letterSpacing ?? 0}em !important; }
          .resume-content h4 { margin-top: calc(0.75rem * ${settings.blockGap ?? 1.0}) !important; margin-bottom: calc(0.2rem * ${settings.blockGap ?? 1.0}) !important; letter-spacing: ${settings.letterSpacing ?? 0}em !important; }
          .resume-content h2 { margin-top: calc(1.5rem * ${settings.blockGap ?? 1.0}) !important; margin-bottom: calc(0.75rem * ${settings.blockGap ?? 1.0}) !important; letter-spacing: ${settings.letterSpacing ?? 0}em !important; }
          .resume-content ul { margin-bottom: calc(0.75rem * ${settings.blockGap ?? 1.0}) !important; }
          .resume-content .flex-row.items-baseline { margin-top: calc(1.25rem * ${settings.blockGap ?? 1.0}) !important; margin-bottom: calc(0.375rem * ${settings.blockGap ?? 1.0}) !important; }
        `}} />

        {settings.showPageBreakLine && (metrics.actualPages ?? 1) > 1 && (
          <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none print:hidden z-30">
            {Array.from({ length: Math.min(3, (metrics.actualPages ?? 1) - 1) }, (_, i) => i + 1).map(p => (
              <div 
                key={p} 
                className="absolute left-0 right-0 border-b-2 border-dashed border-rose-400/80 dark:border-rose-500/80 flex items-center justify-between text-[9.5px] select-none h-0 shadow-[0_1px_4px_rgba(244,63,94,0.15)]" 
                style={{ top: `${p * paperSpec.heightMm}mm` }}
              >
                <div className="bg-rose-500 dark:bg-rose-600 text-white border border-rose-400/60 px-2.5 py-0.5 rounded-full shadow-md ml-4 -translate-y-1/2 flex items-center gap-1.5 font-bold tracking-tight">
                  <span className="text-[10px]">✂️</span>
                  <span className="text-[9.5px] font-mono tracking-wider">
                    {uiLanguage === 'en'
                      ? `${paperName} Page ${p} Fold`
                      : `${paperName} 第 ${p} 页裁切参考线`}
                  </span>
                </div>
                <div className="bg-white/95 dark:bg-slate-850/95 backdrop-blur-md border border-rose-200/90 dark:border-rose-800 text-rose-600 dark:text-rose-300 px-2.5 py-0.5 rounded-full shadow-xs mr-4 -translate-y-1/2 font-mono flex items-center gap-1.5 text-[9.5px] font-bold tracking-tight">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse" />
                  <span>
                    {pageBreakLabel
                      .replace('{p}', String(p))
                      .replace('{size}', String(Math.round(p * paperSpec.heightMm)))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {settings.topAccentLine && <div className={`absolute top-0 left-0 right-0 h-[4.5px] ${theme.topAccentColor}`} />}
        
        {headerInfo.hasHeader && <ResumeHeader headerInfo={headerInfo} theme={theme} lang={settings.lang} />}

        {(() => {
          // 1. Two-Column Layout
          if (settings.templateLayout === 'two-column') {
            const sections = parseH2Sections(bodyContent);
            const SIDEBAR_KEYWORDS = ['个人信息', '基本信息', '联系', '技能', '评价', '总结', '优势', 'about', 'skill', 'contact', 'summary', 'strength', 'strengths'];
            const isSidebar = (t: string) => SIDEBAR_KEYWORDS.some(k => t.toLowerCase().includes(k));

            let sidebarSections = sections.filter(s => isSidebar(s.title));
            let mainSections = sections.filter(s => !isSidebar(s.title));

            if (sections.length > 1 && sidebarSections.length === 0) {
              sidebarSections = [sections[0]];
              mainSections = sections.slice(1);
            }

            return (
              <div className="grid grid-cols-12 gap-6 mt-4">
                <div className="col-span-4 border-r border-gray-150 pr-5 flex flex-col gap-4">
                  {sidebarSections.map((sec, i) => (
                    <div key={`side-${i}`} className="break-inside-avoid">
                      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{sec.rawTitleLine ? `${sec.rawTitleLine}\n\n${sec.content}` : sec.content}</Markdown>
                    </div>
                  ))}
                </div>
                <div className="col-span-8 flex flex-col gap-4 pl-1">
                  {mainSections.map((sec, i) => (
                    <div key={`main-${i}`} className="break-inside-avoid">
                      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{sec.rawTitleLine ? `${sec.rawTitleLine}\n\n${sec.content}` : sec.content}</Markdown>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          // 2. Modern Card Matrix Layout
          if (settings.templateLayout === 'modern-card') {
            const sections = parseH2Sections(bodyContent);
            return (
              <div className="flex flex-col gap-3.5 mt-3">
                {sections.map((sec, i) => (
                  <div 
                    key={`card-${i}`} 
                    className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)] break-inside-avoid"
                  >
                    <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {sec.rawTitleLine ? `${sec.rawTitleLine}\n\n${sec.content}` : sec.content}
                    </Markdown>
                  </div>
                ))}
              </div>
            );
          }

          // 3. Academic LaTeX Layout
          if (settings.templateLayout === 'academic') {
            const pages = bodyContent.split(/<!--\s*pagebreak\s*-->/gi);
            return (
              <div className="academic-resume-container font-serif">
                {pages.map((page, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <>
                        <div className="print:hidden my-8 border-t-2 border-dashed border-gray-400 relative flex justify-center select-none">
                          <span className="absolute -top-3 bg-white px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{uiLanguage === 'en' ? 'Page Break' : '分页符 / Page Break'}</span>
                        </div>
                        <div className="hidden print:block print-page-break" />
                      </>
                    )}
                    <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{page}</Markdown>
                  </React.Fragment>
                ))}
              </div>
            );
          }

          // 4. Default Standard Single Column Layout
          const pages = bodyContent.split(/<!--\s*pagebreak\s*-->/gi);
          return pages.map((page, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <>
                  <div className="print:hidden my-8 border-t-2 border-dashed border-gray-300 relative flex justify-center select-none">
                    <span className="absolute -top-3 bg-white px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{uiLanguage === 'en' ? 'Page Break' : '分页符 / Page Break'}</span>
                  </div>
                  <div className="hidden print:block print-page-break" />
                </>
              )}
              <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{page}</Markdown>
            </React.Fragment>
          ));
        })()}
      </>
    );
  }, [headerInfo, cleaned, settings, markdownComponents, theme, uiLanguage]);

  const isEn = uiLanguage === 'en';

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Zoom and Preview Toolbar */}
      <div className="flex flex-row items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-50/95 dark:bg-slate-900/95 border-b border-slate-200/60 dark:border-slate-800/80 backdrop-blur-sm z-30 select-none print:hidden shrink-0 gap-2 transition-all">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {isEn 
              ? `Real-time Rendering Preview (${paperSpec.id === 'letter' ? 'US Letter' : 'A4'})` 
              : `实时渲染预览 (${paperSpec.id === 'letter' ? 'US Letter 纸张' : 'A4 纸张'})`}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 min-w-[32px] text-right">
            {Math.round(calculatedZoom * 100)}%
          </span>
        </div>
      </div>

      <div 
        ref={wrapperRef}
        id="resume-preview-wrapper" 
        className="flex-1 overflow-y-auto p-2 sm:p-6 md:p-8 bg-slate-100/70 dark:bg-[#090d16] w-full flex justify-center items-start relative preview-scrollbar"
      >
        <div 
          style={{
            width: '100%',
            maxWidth: `${paperSpec.widthMm * calculatedZoom}mm`,
            height: unscaledHeight ? `${unscaledHeight * calculatedZoom}px` : 'auto',
            position: 'relative',
          }}
          className="resume-wrapper flex justify-center shrink-0 transition-all duration-200 print:block print:w-full print:max-w-full print:h-auto print:static"
        >
          <div 
            ref={ref}
            id="resume-print-content"
            data-paper-size={paperSpec.id}
            style={{
              transformOrigin: 'top center',
              width: `${paperSpec.widthMm}mm`,
              minWidth: `${paperSpec.widthMm}mm`,
              maxWidth: `${paperSpec.widthMm}mm`,
              minHeight: `${paperSpec.heightMm}mm`,
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: `translateX(-50%) scale(${calculatedZoom})`,
              padding: `${pagePaddingMm}mm`,
            }}
            className={`bg-white resume-content h-fit mx-auto print:shadow-none print:ring-0 print:m-0 print:w-full relative origin-top transition-all duration-300 print:relative print:left-auto print:top-auto print:transform-none print:max-w-full print:w-full ${fontClass} ${
              metrics.isOver 
                ? 'shadow-[0_4px_24px_rgba(244,63,94,0.08),0_16px_40px_-6px_rgba(15,23,42,0.12),0_0_0_1.5px_rgba(244,63,94,0.4)] ring-1 ring-rose-400/30' 
                : 'shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_12px_28px_-4px_rgba(15,23,42,0.06),0_24px_60px_-12px_rgba(15,23,42,0.08),0_0_0_1px_rgba(15,23,42,0.04)] ring-1 ring-black/5'
            }`}
          >
            {metrics.isOver && (
              <div className="absolute -top-3.5 right-6 z-40 print:hidden select-none pointer-events-none animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-[10px] font-bold rounded-full shadow-[0_4px_12px_rgba(244,63,94,0.3)] border border-white/20 tracking-tight">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>{isEn ? `Over Limit (${metrics.overflowPercent}%)` : `内容超出边界 (${metrics.overflowPercent}%)`}</span>
                </div>
              </div>
            )}
            {resumeInnerContent}
          </div>
        </div>
      </div>

      <ZoomControls 
        zoomMode={zoomMode} 
        calculatedZoom={calculatedZoom} 
        onZoomChange={setZoomMode} 
        showPageBreakLine={settings.showPageBreakLine}
        onTogglePageBreakLine={() => onChangeSettings?.('showPageBreakLine', !settings.showPageBreakLine)}
        lang={uiLanguage} 
      />

      <HeightGuard 
        metrics={metrics} 
        targetPageLimit={targetPageLimit} 
        setTargetPageLimit={setTargetPageLimit} 
        onSmartAutoFit={handleSmartAutoFit} 
        isAutoFitting={isAutoFitting}
        lang={uiLanguage}
      />
    </div>
  );
}));


Preview.displayName = 'Preview';
export default Preview;
