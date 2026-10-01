import React, { useEffect, useState, useRef } from 'react';
import { ChevronDown, Palette, SlidersHorizontal, Zap } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { useShallow } from 'zustand/react/shallow';
import { smartAutoFit } from '../../lib/preview-utils';
import { Tooltip } from '../ui/Tooltip';
import { LanguageToggle } from '../toolbar/LanguageToggle';
import { ToolbarSelectors } from '../toolbar/ToolbarSelectors';
import { LayoutModeToggle } from '../toolbar/LayoutModeToggle';
import { LayoutDrawer } from '../toolbar/LayoutDrawer';
import { StyleDrawer } from '../toolbar/StyleDrawer';
import { TemplateCenterModal } from '../templates/TemplateCenterModal';
import { trackAnalyticsEvent } from '../../lib/analytics';

export function Toolbar() {
  const {
    settings,
    uiLanguage,
    updateSetting,
  } = useResumeStore(
    useShallow((state) => ({
      settings: state.settings,
      uiLanguage: state.uiLanguage,
      updateSetting: state.updateSetting,
    })),
  );

  const isEn = uiLanguage === 'en';

  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [isTemplateCenterOpen, setIsTemplateCenterOpen] = useState(false);
  const layoutTriggerRef = useRef<HTMLButtonElement>(null);
  const styleTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const openTemplateCenter = () => {
      setIsLayoutOpen(false);
      setIsStyleOpen(false);
      setIsTemplateCenterOpen(true);
    };
    const openLayout = () => {
      setIsTemplateCenterOpen(false);
      setIsStyleOpen(false);
      setIsLayoutOpen(true);
    };
    const openStyle = () => {
      setIsTemplateCenterOpen(false);
      setIsLayoutOpen(false);
      setIsStyleOpen(true);
    };
    const showPageLines = () => {
      updateSetting('showPageBreakLine', true);
    };

    window.addEventListener('resume-craft:open-template-center', openTemplateCenter);
    window.addEventListener('resume-craft:open-layout', openLayout);
    window.addEventListener('resume-craft:open-style', openStyle);
    window.addEventListener('resume-craft:show-page-lines', showPageLines);

    return () => {
      window.removeEventListener('resume-craft:open-template-center', openTemplateCenter);
      window.removeEventListener('resume-craft:open-layout', openLayout);
      window.removeEventListener('resume-craft:open-style', openStyle);
      window.removeEventListener('resume-craft:show-page-lines', showPageLines);
    };
  }, [updateSetting]);

  return (
    <div id="resume-main-toolbar" className="flex items-center justify-between px-3 sm:px-6 py-1.5 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/90 relative z-20 gap-2 shadow-[0_1px_2px_rgba(15,23,42,0.02)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] w-full transition-colors duration-200">
      {/* Left Area: Language + Template Library */}
      <div className="flex items-center gap-1.5 text-xs shrink-0">
        <LanguageToggle />
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />
        <ToolbarSelectors
          onOpenTemplateCenter={() => setIsTemplateCenterOpen(true)}
          isOpen={isTemplateCenterOpen}
        />
      </div>

      {/* Right Area: Auto Fit + Layout + Style + View Mode */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0 relative flex-nowrap">
        {/* 1-Click Auto Fit Button */}
        <Tooltip content={isEn ? 'Auto fit margins and line heights to single page' : '一键微调字号与间距以贴合单页'} side="bottom">
          <button
            type="button"
            onClick={() => {
              smartAutoFit(settings, (key, val) => updateSetting(key, val));
              trackAnalyticsEvent('auto_fit_used');
            }}
            aria-label={isEn ? 'Auto fit to single page' : '单页自动适配'}
            className="flex h-8 items-center justify-center gap-1 px-2.5 rounded-lg text-xs font-bold border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 shadow-2xs transition-all cursor-pointer shrink-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
            <span className="hidden xl:inline">{isEn ? 'Fit Page' : '单页'}</span>
          </button>
        </Tooltip>

        <Tooltip content={isEn ? 'Adjust margins, line height, and spacing' : '调整边距、段距与字号'} side="bottom">
          <button
            ref={layoutTriggerRef}
            type="button"
            onClick={() => {
              setIsLayoutOpen((open) => !open);
              setIsStyleOpen(false);
            }}
            aria-haspopup="dialog"
            aria-expanded={isLayoutOpen}
            aria-label={isEn ? 'Open layout settings' : '打开排版设置'}
            className={`flex h-8 items-center justify-center gap-1 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer shrink-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isLayoutOpen
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <SlidersHorizontal className={`w-3.5 h-3.5 shrink-0 ${isLayoutOpen ? 'text-white' : 'text-indigo-500'}`} aria-hidden="true" />
            <span className="hidden xl:inline">{isEn ? 'Layout' : '排版'}</span>
            <ChevronDown className={`w-3 h-3 shrink-0 transition-transform duration-200 ${isLayoutOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        </Tooltip>

        <Tooltip content={isEn ? 'Adjust accent color, heading styles, and visual theme' : '调整主题颜色、标题风格与页眉装饰'} side="bottom">
          <button
            ref={styleTriggerRef}
            type="button"
            onClick={() => {
              setIsStyleOpen((open) => !open);
              setIsLayoutOpen(false);
            }}
            aria-haspopup="dialog"
            aria-expanded={isStyleOpen}
            aria-label={isEn ? 'Open style settings' : '打开样式设置'}
            className={`flex h-8 items-center justify-center gap-1 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer shrink-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isStyleOpen
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <Palette className={`w-3.5 h-3.5 shrink-0 ${isStyleOpen ? 'text-white' : 'text-indigo-500'}`} aria-hidden="true" />
            <span className="hidden xl:inline">{isEn ? 'Style' : '样式'}</span>
            <ChevronDown className={`w-3 h-3 shrink-0 transition-transform duration-200 ${isStyleOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        </Tooltip>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />

        {/* Layout Mode Toggle Group */}
        <LayoutModeToggle />

        <LayoutDrawer
          isOpen={isLayoutOpen}
          onClose={() => setIsLayoutOpen(false)}
          triggerRef={layoutTriggerRef}
        />

        <StyleDrawer
          isOpen={isStyleOpen}
          onClose={() => setIsStyleOpen(false)}
          triggerRef={styleTriggerRef}
        />

        <TemplateCenterModal
          isOpen={isTemplateCenterOpen}
          onClose={() => setIsTemplateCenterOpen(false)}
        />
      </div>
    </div>
  );
}
