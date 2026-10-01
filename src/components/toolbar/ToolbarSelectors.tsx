import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { Tooltip } from '../ui/Tooltip';

interface ToolbarSelectorsProps {
  onOpenTemplateCenter: () => void;
  isOpen?: boolean;
}

export function ToolbarSelectors({
  onOpenTemplateCenter,
  isOpen = false,
}: ToolbarSelectorsProps) {
  const { uiLanguage } = useResumeStore();
  const isEn = uiLanguage === 'en';

  return (
    <div className="flex items-center shrink-0">
      <Tooltip
        content={isEn ? 'Browse and select resume templates' : '浏览与切换简历模板'}
        side="bottom"
      >
        <button
          type="button"
          onClick={onOpenTemplateCenter}
          aria-label={isEn ? 'Browse resume templates' : '浏览与切换简历模板'}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className="flex h-9 md:h-8 items-center justify-center gap-1.5 rounded-lg border border-indigo-200/80 bg-indigo-50/80 px-2.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800/70 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/60 active:scale-95 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <LayoutGrid className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden xl:inline">{isEn ? 'Templates' : '模板'}</span>
        </button>
      </Tooltip>
    </div>
  );
}
