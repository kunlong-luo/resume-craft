import React from 'react';
import { FileText, ListOrdered, Check } from 'lucide-react';
import { getPresetTheme } from '../../lib/section-themes';
import { getTranslation } from '../../i18n';
import { FormSection } from '../../lib/form-types';

interface SectionPresetsProps {
  onAddPreset: (type: 'summary' | 'skills' | 'work' | 'project' | 'edu' | 'custom_text' | 'custom_items') => void;
  sections?: FormSection[];
  lang?: string;
  contentLang?: string;
}

export function SectionPresets({ onAddPreset, sections = [], lang = 'zh', contentLang = 'zh' }: SectionPresetsProps) {
  const activeUiLang = lang === 'en' ? 'en' : 'zh';
  const activeContentLang = contentLang === 'en' ? 'en' : 'zh';
  const translations = getTranslation(activeUiLang);
  const isUiEn = activeUiLang === 'en';
  const isContentEn = activeContentLang === 'en';
  const t = translations.form.section;

  const presets = [
    { type: 'summary' as const, label: isContentEn ? 'Summary' : '个人优势' },
    { type: 'skills' as const, label: isContentEn ? 'Skills' : '专业技能' },
    { type: 'work' as const, label: isContentEn ? 'Work Experience' : '工作经历' },
    { type: 'project' as const, label: isContentEn ? 'Projects' : '代表项目' },
    { type: 'edu' as const, label: isContentEn ? 'Education' : '教育背景' },
  ];

  return (
    <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
      {/* 常用标准模板 */}
      <div className="mb-4">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2.5">
          {t.standardModules}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {presets.map(item => {
            const theme = getPresetTheme(item.type, activeContentLang);
            const Icon = theme.icon;

            const isAdded = sections.some(sec => {
              const titleLower = sec.title.trim().toLowerCase();
              if (item.type === 'summary') return titleLower.includes('优势') || titleLower.includes('总结') || titleLower.includes('评价') || titleLower.includes('summary') || titleLower.includes('strength');
              if (item.type === 'skills') return titleLower.includes('技能') || titleLower.includes('skill');
              if (item.type === 'work') return titleLower.includes('工作') || titleLower.includes('职业') || titleLower.includes('work') || titleLower.includes('experience');
              if (item.type === 'project') return titleLower.includes('项目') || titleLower.includes('作品') || titleLower.includes('project') || titleLower.includes('portfolio');
              if (item.type === 'edu') return titleLower.includes('教育') || titleLower.includes('学历') || titleLower.includes('education') || titleLower.includes('edu');
              return false;
            });

            return (
              <button
                key={item.type}
                onClick={() => onAddPreset(item.type)}
                title={isAdded ? (isUiEn ? 'Already in resume (Click to locate)' : '已添加（点击滚动定位）') : ''}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 relative bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-850 dark:to-slate-900 border rounded-xl text-center transition-all cursor-pointer shadow-[0_1.5px_3px_rgba(15,23,42,0.01),inset_0_1.5px_2px_rgba(255,255,255,0.95)] dark:shadow-none active:translate-y-px group ${
                  isAdded
                    ? 'border-emerald-500/40 dark:border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : `border-slate-200/80 dark:border-slate-800 ${theme.hoverBorder}`
                }`}
              >
                {isAdded && (
                  <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1 py-0.2 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold rounded border border-emerald-500/20">
                    <Check className="w-2.5 h-2.5" />
                    <span className="hidden sm:inline">{isUiEn ? 'Added' : '已添加'}</span>
                  </span>
                )}
                <div className={`p-1.5 ${theme.iconBg} ${theme.iconColor} rounded-lg transition-colors`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 自定义模块 */}
      <div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2.5">
          {t.customModules}
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <button
            onClick={() => onAddPreset('custom_text')}
            className="flex items-center justify-center gap-2.5 p-3 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-850 dark:to-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-[0_1.5px_3px_rgba(15,23,42,0.01),inset_0_1.5px_2px_rgba(255,255,255,0.95)] dark:shadow-none active:translate-y-px group"
          >
            <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>{t.customTextSection}</span>
          </button>
          
          <button
            onClick={() => onAddPreset('custom_items')}
            className="flex items-center justify-center gap-2.5 p-3 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-850 dark:to-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-[0_1.5px_3px_rgba(15,23,42,0.01),inset_0_1.5px_2px_rgba(255,255,255,0.95)] dark:shadow-none active:translate-y-px group"
          >
            <ListOrdered className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>{t.customItemSection}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
