import React from 'react';
import { motion } from 'motion/react';
import { Globe } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';

export function LanguageToggle() {
  const { uiLanguage, setUiLanguage } = useResumeStore();
  const isEn = uiLanguage === 'en';

  return (
    <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-200/90 dark:border-slate-800 shrink-0">
      <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0 pointer-events-none" />
      <div className="relative bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-lg flex items-center border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
        <button
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
  );
}
