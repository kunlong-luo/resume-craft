import React from 'react';
import { motion } from 'motion/react';
import { Globe } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { Tooltip } from '../ui/Tooltip';

export function LanguageToggle() {
  const { uiLanguage, setUiLanguage } = useResumeStore();
  const isEn = uiLanguage === 'en';

  const tooltip = isEn
    ? 'Interface language only — resume content stays unchanged'
    : '仅切换界面语言，不会修改简历内容';

  return (
    <Tooltip content={tooltip} side="bottom">
      <div
        role="group"
        aria-label={isEn ? 'Interface language' : '界面语言'}
        className="flex items-center gap-1.5 pr-2.5 border-r border-slate-200/90 dark:border-slate-800 shrink-0"
      >
        <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0 pointer-events-none" aria-hidden="true" />
        <div className="relative bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-lg flex items-center border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
        <button
          type="button"
          aria-label={isEn ? 'Switch interface language to Chinese' : '将界面语言切换为中文'}
          aria-pressed={!isEn}
          onClick={() => setUiLanguage('zh')}
          className={`relative px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer z-10 ${
            !isEn ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {!isEn && (
            <motion.div
              layoutId="langToggleCapsule"
              className="absolute inset-0 bg-white dark:bg-slate-700 rounded-md shadow-xs z-[-1]"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          中
        </button>
        <button
          type="button"
          aria-label={isEn ? 'Switch interface language to English' : '将界面语言切换为英文'}
          aria-pressed={isEn}
          onClick={() => setUiLanguage('en')}
          className={`relative px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer z-10 ${
            isEn ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {isEn && (
            <motion.div
              layoutId="langToggleCapsule"
              className="absolute inset-0 bg-white dark:bg-slate-700 rounded-md shadow-xs z-[-1]"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          EN
        </button>
        </div>
      </div>
    </Tooltip>
  );
}
