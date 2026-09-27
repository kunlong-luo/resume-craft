import React from 'react';
import { motion } from 'motion/react';
import { Edit3, Columns, Eye } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { Tooltip } from '../ui/Tooltip';

export function LayoutModeToggle() {
  const { settings, updateSetting } = useResumeStore();
  const isEn = settings.lang === 'en';

  const modes = [
    {
      id: 'editor' as const,
      label: isEn ? 'Edit' : '编辑',
      tooltip: isEn ? 'Edit Mode (Focus on editor)' : '编辑模式（全屏编辑）',
      icon: Edit3,
    },
    {
      id: 'split' as const,
      label: isEn ? 'Split' : '分屏',
      tooltip: isEn ? 'Split Mode (Side-by-side edit & preview)' : '分屏模式（左右实时对照）',
      icon: Columns,
    },
    {
      id: 'preview' as const,
      label: isEn ? 'Preview' : '预览',
      tooltip: isEn ? 'Preview Mode (Focus on resume)' : '预览模式（全屏预览）',
      icon: Eye,
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={isEn ? 'Workspace layout mode' : '工作区排版视图切换'}
      className="relative bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-lg flex items-center text-xs shrink-0 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
    >
      {modes.map((m) => {
        const active = settings.layoutMode === m.id;
        const Icon = m.icon;
        return (
          <Tooltip key={m.id} content={m.tooltip} side="bottom">
            <button
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={m.tooltip}
              onClick={() => updateSetting('layoutMode', m.id)}
              className={`relative flex items-center h-7 px-2 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                active
                  ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="layoutModeCapsule"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-md shadow-xs z-[-1]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className={`ml-1 ${active ? 'inline' : 'hidden xl:inline'}`}>
                {m.label}
              </span>
            </button>
          </Tooltip>
        );
      })}
      <div className="mx-0.5 h-4 w-px bg-slate-200 dark:bg-slate-700" />

      <Tooltip content={isEn ? 'Show page break guide' : '显示分页辅助线'} side="bottom">
        <button
          type="button"
          onClick={() => updateSetting('showPageBreakLine', !settings.showPageBreakLine)}
          aria-pressed={settings.showPageBreakLine}
          aria-label={isEn ? 'Toggle page break guide' : '切换分页辅助线'}
          className={`relative flex items-center gap-1 rounded-md px-2 py-1 font-bold transition-colors cursor-pointer z-10 ${
            settings.showPageBreakLine
              ? 'bg-white text-rose-600 shadow-xs dark:bg-slate-700 dark:text-rose-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span className={`w-3 border-t border-dashed ${settings.showPageBreakLine ? 'border-rose-500' : 'border-slate-400'}`} />
          <span className="hidden xl:inline">{isEn ? 'Page guide' : '分页线'}</span>
        </button>
      </Tooltip>
    </div>
  );
}
