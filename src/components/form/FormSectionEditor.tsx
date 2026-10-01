import React from 'react';
import { 
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FormSection } from '../../lib/form-types';
import { getSectionCategory } from '../../lib/markdown-parser';
import { FormTextareaToolbar } from './FormTextareaToolbar';
import { SectionHeader } from './SectionHeader';
import { ItemEditor } from './ItemEditor';
import { SmartMarkdownTextarea } from './SmartMarkdownTextarea';
import { getSectionTheme } from '../../lib/section-themes';
import { getTranslation } from '../../i18n';
import { MarketRegion } from '../../types';

export function getSectionIcon(title: string, className?: string, lang = 'zh') {
  const theme = getSectionTheme(title, lang);
  const Icon = theme.icon;
  return <Icon className={className || `w-4 h-4 ${theme.iconColor}`} />;
}

interface FormSectionEditorProps {
  sec: FormSection;
  secIndex: number;
  totalSectionsCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  onTitleChange: (newTitle: string) => void;
  onTextChange: (text: string) => void;
  onMove: (direction: 'up' | 'down') => void;
  onDelete: () => void;
  onApplySpacing: () => void;
  onAddItem: () => void;
  onMoveItem: (itemIndex: number, direction: 'up' | 'down') => void;
  onReorderItem?: (fromIndex: number, toIndex: number) => void;
  onDeleteItem: (itemId: string, itemOrg: string) => void;
  onItemFieldChange: (itemId: string, field: 'org' | 'role' | 'time' | 'gpa' | 'courses' | 'honors', value: string) => void;
  onItemContentChange: (itemId: string, content: string) => void;
  onInsertStarTemplate: (itemId: string, currentContent: string) => void;
  onTypeChange?: (newType: 'text' | 'items') => void;
  lang?: string;
  contentLang?: string;
  marketRegion?: MarketRegion;
}

// Helper to determine if a section is inherently text-only (e.g., Personal Advantages, Self-Evaluation, Skills)
const isTextOnlySection = (title: string): boolean => {
  const t = (title || '').trim().toLowerCase();
  const textOnlyKeywords = [
    '个人优势', '自我评价', '个人评价', '专业技能', '核心技能', '技能特长', '技能证书', '职业规划', '求职意向', '关于我', '兴趣爱好', '自我介绍',
    'summary', 'skills', 'personal summary', 'self evaluation', 'self-evaluation', 'key skills', 'core competencies', 'interests', 'certifications', 'hobbies', 'about me'
  ];
  return textOnlyKeywords.some(kw => t.includes(kw));
};

export function FormSectionEditor({
  sec, secIndex, totalSectionsCount, isExpanded, onToggle, onTitleChange, onTextChange, onMove, onDelete, onApplySpacing, onAddItem, onMoveItem, onReorderItem, onDeleteItem, onItemFieldChange, onItemContentChange, onInsertStarTemplate,
  onTypeChange,
  lang = 'zh',
  contentLang = 'zh',
  marketRegion
}: FormSectionEditorProps) {
  const activeUiLang = lang === 'en' ? 'en' : 'zh';
  const translations = getTranslation(activeUiLang);
  const t = translations.form.section;
  const hideTypeSwitcher = isTextOnlySection(sec.title);
  const theme = getSectionTheme(sec.title, contentLang);

  return (
    <div 
      id={`form-sec-${sec.id}`} 
      className={`rounded-xl overflow-hidden focus-within:overflow-visible relative group/section scroll-mt-20 transition-all duration-300 focus-within:z-20 ${
        isExpanded 
          ? `tactile-card shadow-[0_16px_36px_rgba(30,41,59,0.06),0_3px_10px_rgba(30,41,59,0.03)] ${theme.border} scale-[1.002] ring-1 ${theme.accentRing} mb-5` 
          : 'bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 shadow-[0_2px_6px_rgba(30,41,59,0.015)] opacity-85 hover:opacity-100 scale-[0.995] hover:scale-100 mb-3'
      }`}
    >
      <SectionHeader 
        title={sec.title} type={sec.type} isExpanded={isExpanded} isFirst={secIndex === 0} isLast={secIndex === totalSectionsCount - 1}
        onToggle={onToggle} onTitleChange={onTitleChange} onApplySpacing={onApplySpacing} onMove={onMove} onDelete={onDelete}
        onTypeChange={hideTypeSwitcher ? undefined : onTypeChange} lang={lang}
      />

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="p-5 space-y-4"
          >
            {sec.type === 'text' ? (
              <div>
                <div className="mb-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">{t.textLabel}</label>
                </div>
                <div className="flex flex-col mt-1">
                  <FormTextareaToolbar textareaId={sec.id} value={sec.textValue} onChange={onTextChange} lang={lang} contentLang={contentLang} />
                  <SmartMarkdownTextarea
                    id={sec.id} 
                    value={sec.textValue} 
                    onChange={onTextChange} 
                    minRows={5}
                    className="w-full p-3.5 text-xs font-mono leading-relaxed bg-slate-50/10 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-750 rounded-b-lg rounded-t-none border-t-0 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 shadow-[inset_0_1.5px_3px_rgba(15,23,42,0.04)] focus:shadow-none transition-all duration-200"
                    placeholder={t.textPlaceholder}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {sec.items.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-400 dark:text-slate-500">{t.noItems}</div>
                ) : (
                  <div className="space-y-4">
                    {sec.items.map((item, itemIndex) => (
                      <ItemEditor 
                        key={item.id} item={item} index={itemIndex} totalItems={sec.items.length} category={getSectionCategory(sec.title)}
                        onFieldChange={(field, val) => onItemFieldChange(item.id, field, val)}
                        onContentChange={(val) => onItemContentChange(item.id, val)}
                        onMove={(dir) => onMoveItem(itemIndex, dir)}
                        onReorderItem={onReorderItem}
                        onDelete={() => onDeleteItem(item.id, item.org)}
                        onInsertStarTemplate={() => onInsertStarTemplate(item.id, item.content)}
                        lang={lang}
                        contentLang={contentLang}
                        marketRegion={marketRegion}
                      />
                    ))}
                  </div>
                )}
                <button
                  type="button" onClick={onAddItem}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-850 dark:to-slate-800 hover:from-indigo-50/30 hover:to-white dark:hover:from-indigo-950/40 dark:hover:to-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 border border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 rounded-xl text-xs font-bold transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02),inset_0_1.5px_2px_rgba(255,255,255,0.95)] dark:shadow-none cursor-pointer active:translate-y-px"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addItem}</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
