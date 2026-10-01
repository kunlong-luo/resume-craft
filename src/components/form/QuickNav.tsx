import React, { useState, useEffect, useRef } from 'react';
import { User } from 'lucide-react';
import { motion } from 'motion/react';
import { FormSection } from '../../lib/form-types';
import { getSectionTheme } from '../../lib/section-themes';
import { getTranslation } from '../../i18n';
import { translateSectionTitle } from '../../lib/section-translator';
import { scrollToSectionElement } from '../../lib/form-helpers';

interface QuickNavProps {
  sections: FormSection[];
  expandedSections: Record<string, boolean>;
  setExpandedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  lang?: string;
  contentLang?: string;
}

export function QuickNav({ sections, expandedSections, setExpandedSections, lang = 'zh', contentLang = 'zh' }: QuickNavProps) {
  const activeUiLang = lang === 'en' ? 'en' : 'zh';
  const activeContentLang = contentLang === 'en' ? 'en' : 'zh';
  const translations = getTranslation(activeUiLang);
  const basicTitle = translations.form.basic.title;

  const [activeSectionId, setActiveSectionId] = useState<string>('basic');
  const lastClickedRef = useRef<{ id: string; time: number } | null>(null);

  const getTranslatedTitle = (sectionTitle: string) => {
    if (!sectionTitle) return activeContentLang === 'en' ? 'Custom Section' : '自定义模块';
    return translateSectionTitle(sectionTitle, activeContentLang) || sectionTitle;
  };

  useEffect(() => {
    const handleScroll = () => {
      if (lastClickedRef.current && Date.now() - lastClickedRef.current.time < 1000) {
        setActiveSectionId(lastClickedRef.current.id);
        return;
      }

      const basicEl = document.getElementById('form-sec-basic');
      const container = basicEl?.closest('.overflow-y-auto') || basicEl?.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const sectionIds = ['basic', ...sections.map(s => s.id)];
      let bestSection = 'basic';

      for (const id of sectionIds) {
        const el = document.getElementById(`form-sec-${id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          const relativeTop = rect.top - containerRect.top;
          if (relativeTop <= 100) {
            bestSection = id;
          }
        }
      }

      const isAtBottom = Math.abs((container.scrollHeight - container.scrollTop) - container.clientHeight) < 15;
      if (isAtBottom && sectionIds.length > 0) {
        bestSection = sectionIds[sectionIds.length - 1];
      }

      setActiveSectionId(bestSection);
    };

    const basicEl = document.getElementById('form-sec-basic');
    const container = basicEl?.closest('.overflow-y-auto') || basicEl?.parentElement;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
      
      const timer = setTimeout(handleScroll, 150);
      return () => {
        container.removeEventListener('scroll', handleScroll);
        clearTimeout(timer);
      };
    }
  }, [sections, expandedSections]);

  return (
    <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/80 pb-3 pt-2.5 px-6 w-full min-w-0 shrink-0">
      {/* Section Quick Jumping */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full min-w-0 py-0.5">
        <button
          onClick={() => {
            lastClickedRef.current = { id: 'basic', time: Date.now() };
            setActiveSectionId('basic');
            scrollToSectionElement('basic', (id) => setExpandedSections(prev => ({ ...prev, [id]: true })));
          }}
          className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 z-10 transition-colors ${
            activeSectionId === 'basic'
              ? 'font-bold text-white'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
          }`}
        >
          {activeSectionId === 'basic' && (
            <motion.div
              layoutId="quickNavActiveCapsule"
              className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/20 z-[-1]"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <User className={`w-3.5 h-3.5 ${activeSectionId === 'basic' ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
          <span>{basicTitle}</span>
        </button>
        
        {sections.map((sec) => {
          const isActive = activeSectionId === sec.id;
          const theme = getSectionTheme(sec.title, activeUiLang);
          const Icon = theme.icon;

          return (
            <button
              key={sec.id}
              onClick={() => {
                lastClickedRef.current = { id: sec.id, time: Date.now() };
                setActiveSectionId(sec.id);
                scrollToSectionElement(sec.id, (id) => setExpandedSections(prev => ({ ...prev, [id]: true })));
              }}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 z-10 transition-colors ${
                isActive
                  ? 'font-bold text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="quickNavActiveCapsule"
                  className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/20 z-[-1]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className={`flex items-center justify-center shrink-0 ${isActive ? 'text-white' : theme.iconColor}`}>
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span>{getTranslatedTitle(sec.title)}</span>
              {sec.type === 'items' && sec.items && sec.items.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  {sec.items.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
