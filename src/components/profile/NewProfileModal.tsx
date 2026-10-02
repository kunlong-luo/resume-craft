import React, { useEffect, useRef, useState } from 'react';
import { X, Copy, FilePlus, LayoutTemplate, FolderPlus, Check } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { BLANK_MARKDOWN, TEMPLATES } from '../../data';
import { getMarketProfile, resolveDefaultPaperSize } from '../../lib/market-profile';
import { getTemplatePresentation } from '../../lib/template-presentation';
import { useDialogFocus } from '../../hooks/useDialogFocus';

interface NewProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
}

export function NewProfileModal({ isOpen, onClose, lang }: NewProfileModalProps) {
  const isEn = lang === 'en';
  const { createProfile, profiles, settings } = useResumeStore();
  const presentationLang = isEn ? 'en' : 'zh';

  const [mode, setMode] = useState<'clone' | 'template' | 'blank'>('clone');
  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(isEn ? 'us_swe' : 'cn_demo');
  const dialogRef = useRef<HTMLDivElement>(null);

  useDialogFocus({ isOpen, dialogRef, onClose });

  useEffect(() => {
    if (isOpen) {
      setSelectedTemplateId(isEn ? 'us_swe' : 'cn_demo');
    }
  }, [isOpen, isEn]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || (
      mode === 'clone' 
        ? `${isEn ? 'Tailored Profile' : '定制简历档案'} ${profiles.length + 1}`
        : mode === 'template'
        ? (() => {
            const template = TEMPLATES.find(t => t.id === selectedTemplateId);
            return template
              ? getTemplatePresentation(template, presentationLang).name
              : (isEn ? 'Template Resume' : '岗位模板档案');
          })()
        : (isEn ? 'Blank Resume' : '空白简历')
    );

    let contentToUse: string | undefined = undefined;
    let settingsToUse = settings;
    let templateId: string | undefined;

    if (mode === 'template') {
      const tpl = TEMPLATES.find(t => t.id === selectedTemplateId);
      if (tpl) {
        contentToUse = tpl.content;
        templateId = tpl.id;
        const targetMarket =
          tpl.targetMarket ?? (tpl.suggestedLang === 'zh' ? 'cn' : 'international');
        settingsToUse = {
          ...settings,
          lang: tpl.suggestedLang,
          marketRegion: targetMarket,
          paperSize: tpl.defaultPaperSize ?? resolveDefaultPaperSize(targetMarket),
          dateStyle: tpl.dateStyle ?? getMarketProfile(targetMarket).dateStyle,
        };
      }
    } else if (mode === 'blank') {
      contentToUse = BLANK_MARKDOWN;
      templateId = 'custom';
    }

    createProfile({
      name: finalName,
      targetRole: targetRole.trim() || undefined,
      markdown: contentToUse,
      settings: mode === 'clone' ? undefined : settingsToUse,
      templateId,
    });

    onClose();
    setName('');
    setTargetRole('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-profile-dialog-title"
        tabIndex={-1}
        className="bg-white dark:bg-slate-850 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 id="new-profile-dialog-title" className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                {isEn ? 'Create New Resume Profile' : '新建独立简历档案'}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {isEn ? 'Each profile maintains its own content, styles and layouts' : '每个档案拥有独立的排版样式、内容与导出文件名，随时自由切换'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? 'Close create resume dialog' : '关闭新建简历弹窗'}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleCreate} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Creation Mode Choice */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isEn ? 'Creation Method' : '创建方式'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode('clone')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  mode === 'clone'
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Copy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {mode === 'clone' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div className="font-bold text-xs">{isEn ? 'Clone Current' : '复制当前简历'}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
                  {isEn ? 'Tailor for a new role' : '基于当前内容针对性修改'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('template')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  mode === 'template'
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <LayoutTemplate className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  {mode === 'template' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div className="font-bold text-xs">{isEn ? 'From Template' : '从岗位模板'}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
                  {isEn ? 'Industry benchmarks' : '精选大厂标杆模板'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('blank')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  mode === 'blank'
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <FilePlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {mode === 'blank' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div className="font-bold text-xs">{isEn ? 'Blank Slate' : '全新空白'}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
                  {isEn ? 'Start from scratch' : '从基础骨架起步'}
                </div>
              </button>
            </div>
          </div>

          {/* Template Selection if template mode */}
          {mode === 'template' && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isEn ? 'Choose Template' : '选择标杆模板'}
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => {
                  setSelectedTemplateId(e.target.value);
                  const t = TEMPLATES.find(x => x.id === e.target.value);
                  if (t) {
                    const presentation = getTemplatePresentation(t, presentationLang);
                    setName(presentation.name);
                    setTargetRole(presentation.category);
                  }
                }}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {TEMPLATES.map(t => {
                  const presentation = getTemplatePresentation(t, presentationLang);
                  return (
                    <option key={t.id} value={t.id}>
                      [{presentation.category}] {presentation.name}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Profile Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{isEn ? 'Profile Name' : '档案名称'}</span>
              <span className="text-[10px] text-slate-400 font-normal">{isEn ? 'e.g., ByteDance Fullstack' : '例：字节跳动全栈投递版'}</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={mode === 'clone' ? (isEn ? 'e.g. Target Company / Role' : '例：美团移动端高级架构版') : (isEn ? 'Profile Name' : '档案名称')}
              className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          {/* Target Role Tag */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{isEn ? 'Target Role Tag (Optional)' : '目标岗位标签（选填）'}</span>
              <span className="text-[10px] text-slate-400 font-normal">{isEn ? 'e.g., Frontend' : '例：全栈架构、海外求职'}</span>
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder={isEn ? 'e.g. Web Architect' : '例：前端架构、AI研发、海外'}
              className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isEn ? 'Cancel' : '取消'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>{isEn ? 'Create & Switch' : '立即创建并切换'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
