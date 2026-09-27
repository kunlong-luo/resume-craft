import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FormSection, FormItem } from '../../lib/form-types';
import { SectionHeader } from './SectionHeader';
import { FormTextareaToolbar } from './FormTextareaToolbar';
import { MonthRangePicker } from './MonthRangePicker';
import { CustomSelect } from '../ui/CustomSelect';
import { SmartMarkdownTextarea } from './SmartMarkdownTextarea';
import { Tooltip } from '../ui/Tooltip';
import { getTranslation } from '../../i18n';
import { getDegreeOptions } from '../../lib/form-constants';
import { getSectionTheme } from '../../lib/section-themes';

import { MarketRegion } from '../../types';

interface EduSectionEditorProps {
  section: FormSection;
  expanded: boolean;
  onToggle: () => void;
  onItemChange: (itemId: string, field: keyof FormItem, value: string) => void;
  onAddItem: () => void;
  onDeleteItem: (itemId: string, org: string) => void;
  onTitleChange: (title: string) => void;
  onApplySpacing?: () => void;
  onMove?: (direction: 'up' | 'down') => void;
  onDelete?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  onTextChange?: (text: string) => void;
  onTypeChange?: (newType: 'text' | 'items') => void;
  onMoveItem?: (itemIndex: number, direction: 'up' | 'down') => void;
  onReorderItem?: (fromIndex: number, toIndex: number) => void;
  lang?: string;
  marketRegion?: MarketRegion;
}

export function EduSectionEditor({ 
  section, 
  expanded, 
  onToggle, 
  onItemChange, 
  onAddItem, 
  onDeleteItem,
  onTitleChange,
  onApplySpacing,
  onMove,
  onDelete,
  isFirst,
  isLast,
  onTextChange,
  onTypeChange,
  onMoveItem,
  onReorderItem,
  lang = 'zh',
  marketRegion,
}: EduSectionEditorProps) {
  const [customDegrees, setCustomDegrees] = React.useState<Record<string, boolean>>({});
  const activeLang = lang === 'en' ? 'en' : 'zh';
  const translations = getTranslation(activeLang);
  const t = translations.form.edu;
  const secT = translations.form.section;
  const degreeOptions = getDegreeOptions(activeLang);

  React.useEffect(() => {
    if (section.type === 'items') {
      const newCustomDegrees = { ...customDegrees };
      section.items.forEach(item => {
        if (item.degree && !degreeOptions.some(o => o.value === item.degree)) {
          newCustomDegrees[item.id] = true;
        }
      });
      setCustomDegrees(newCustomDegrees);
    }
  }, [section.items, activeLang]);

  const toggleCustomDegree = (itemId: string) => {
    setCustomDegrees(prev => {
      const isCustom = !prev[itemId];
      if (isCustom) {
        onItemChange(itemId, 'degree', '');
      }
      return { ...prev, [itemId]: isCustom };
    });
  };

  const theme = getSectionTheme(section.title, lang);

  return (
    <div 
      id={`form-sec-${section.id}`} 
      className={`rounded-xl overflow-hidden relative group/section scroll-mt-20 transition-all duration-300 ${
        expanded 
          ? `tactile-card shadow-[0_16px_36px_rgba(30,41,59,0.06),0_3px_10px_rgba(30,41,59,0.03)] ${theme.border} scale-[1.002] ring-1 ${theme.accentRing} mb-5` 
          : 'bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 shadow-[0_2px_6px_rgba(30,41,59,0.015)] opacity-85 hover:opacity-100 scale-[0.995] hover:scale-100 mb-3'
      }`}
    >
      <SectionHeader
        title={section.title}
        subtitle={t.subtitle}
        type={section.type}
        isExpanded={expanded}
        isFirst={Boolean(isFirst)}
        isLast={Boolean(isLast)}
        onToggle={onToggle}
        onTitleChange={onTitleChange}
        onApplySpacing={onApplySpacing}
        onMove={onMove}
        onDelete={onDelete}
        onTypeChange={onTypeChange}
        lang={lang}
      />
      
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="p-5 space-y-4"
          >
            {section.type === 'text' ? (
              <div>
                <div className="mb-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">{t.textLabel}</label>
                </div>
                <div className="flex flex-col mt-1">
                  <FormTextareaToolbar textareaId={section.id} value={section.textValue || ''} onChange={onTextChange!} lang={lang} />
                  <SmartMarkdownTextarea
                    id={section.id} 
                    value={section.textValue || ''} 
                    onChange={(val) => onTextChange!(val)} 
                    minRows={5}
                    className="w-full p-3.5 text-xs font-mono leading-relaxed bg-slate-50/10 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-750 rounded-b-lg rounded-t-none border-t-0 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 shadow-[inset_0_1.5px_3px_rgba(15,23,42,0.04)] focus:shadow-none transition-all duration-200"
                    placeholder={t.textPlaceholder}
                  />
                </div>
              </div>
            ) : (
              <>
                {section.items.map((item, itemIndex) => {
                  const handleDragStart = (e: React.DragEvent) => {
                    e.dataTransfer.setData('text/plain', String(itemIndex));
                    e.dataTransfer.effectAllowed = 'move';
                  };

                  const handleDragOver = (e: React.DragEvent) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  };

                  const handleDrop = (e: React.DragEvent) => {
                    e.preventDefault();
                    const sourceIndexStr = e.dataTransfer.getData('text/plain');
                    if (!sourceIndexStr) return;
                    const sourceIndex = parseInt(sourceIndexStr, 10);
                    if (!isNaN(sourceIndex) && sourceIndex !== itemIndex && onReorderItem) {
                      onReorderItem(sourceIndex, itemIndex);
                    }
                  };

                  return (
                    <div 
                      key={item.id} 
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className="p-3 sm:p-4 border border-slate-200/60 dark:border-slate-800 rounded-xl bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-850 dark:to-slate-900/90 relative space-y-2.5 sm:space-y-3 transition-all group/item shadow-[0_2px_6px_rgba(15,23,42,0.01),inset_0_1.5px_2px_rgba(255,255,255,0.95)] dark:shadow-none hover:border-purple-300 dark:hover:border-purple-800"
                    >
                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-1 sm:absolute sm:right-3 sm:top-3 sm:opacity-40 sm:group-hover/item:opacity-100 transition-opacity">
                        {onReorderItem && (
                          <Tooltip content={secT.dragToReorder} side="top">
                            <div
                              draggable
                              onDragStart={handleDragStart}
                              className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded cursor-grab active:cursor-grabbing transition-colors"
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>
                          </Tooltip>
                        )}
                        {onMoveItem && (
                          <>
                            <Tooltip content={secT.moveItemUp} side="top" disabled={itemIndex === 0}>
                              <button 
                                type="button" 
                                onClick={() => onMoveItem(itemIndex, 'up')} 
                                disabled={itemIndex === 0} 
                                className={`p-1 rounded transition-colors ${itemIndex === 0 ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-750 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer'}`} 
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                            <Tooltip content={secT.moveItemDown} side="top" disabled={itemIndex === section.items.length - 1}>
                              <button 
                                type="button" 
                                onClick={() => onMoveItem(itemIndex, 'down')} 
                                disabled={itemIndex === section.items.length - 1} 
                                className={`p-1 rounded transition-colors ${itemIndex === section.items.length - 1 ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-750 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer'}`} 
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip content={secT.deleteItem} side="top">
                          <button 
                            onClick={() => onDeleteItem(item.id, item.org)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-rose-950/50 text-red-500 dark:text-rose-400 hover:text-red-700 dark:hover:text-rose-300 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>

                    {/* Primary Fields Rows */}
                    <div className="space-y-2.5 sm:space-y-3">
                      {/* Row 1: 学校名称 & 时间段 */}
                      <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">{t.schoolLabel}</label>
                          </div>
                          <input 
                            type="text" 
                            value={item.org || ''}
                            onChange={(e) => onItemChange(item.id, 'org', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 tactile-input"
                            placeholder={t.schoolPlaceholder}
                          />
                        </div>

                        <div className="w-full md:w-[220px] shrink-0">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">{secT.periodLabel}</label>
                          </div>
                          <MonthRangePicker
                            value={item.time || ''}
                            onChange={(val) => onItemChange(item.id, 'time', val)}
                            className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 tactile-input font-mono"
                            placeholder={t.timePlaceholder}
                            lang={lang}
                            marketRegion={marketRegion}
                          />
                        </div>
                      </div>

                      {/* Row 2: 学历 & 专业名称 (干净的双列并排) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                        {/* 学历 */}
                        <div className="min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">{t.degreeLabel}</label>
                            <button
                              type="button"
                              onClick={() => toggleCustomDegree(item.id)}
                              className="text-[10px] text-purple-600 dark:text-purple-400 hover:text-purple-700 font-semibold cursor-pointer transition-colors"
                            >
                              {customDegrees[item.id] ? t.degreeChoosePreset : t.degreeCustom}
                            </button>
                          </div>
                          {customDegrees[item.id] ? (
                            <input 
                              type="text" 
                              value={item.degree || ''}
                              onChange={(e) => onItemChange(item.id, 'degree', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 tactile-input"
                              placeholder={t.degreePlaceholder}
                            />
                          ) : (
                            <CustomSelect
                              value={item.degree || ''}
                              onChange={(val) => {
                                if (val === '__custom__') {
                                  toggleCustomDegree(item.id);
                                } else {
                                  onItemChange(item.id, 'degree', val);
                                }
                              }}
                              options={[
                                ...(item.degree && !degreeOptions.some(opt => opt.value === item.degree) ? [{ value: item.degree, label: item.degree }] : []),
                                ...degreeOptions,
                                { value: '__custom__', label: t.customOption }
                              ]}
                              size="sm"
                              className="w-full"
                              triggerClassName="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 tactile-input bg-white dark:bg-slate-900"
                              placeholder={t.degreePlaceholder}
                            />
                          )}
                        </div>

                        {/* 专业名称 */}
                        <div className="min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">{t.majorLabel}</label>
                          </div>
                          <input 
                            type="text" 
                            value={item.role || ''}
                            onChange={(e) => onItemChange(item.id, 'role', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 tactile-input"
                            placeholder={t.majorPlaceholder}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Secondary Fields Row: Academic & Achievements */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">{t.gpaLabel}</label>
                        <input 
                          type="text" 
                          value={item.gpa || ''} 
                          onChange={(e) => onItemChange(item.id, 'gpa', e.target.value)} 
                          className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 tactile-input" 
                          placeholder={t.gpaPlaceholder} 
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">{t.coursesLabel}</label>
                        <input 
                          type="text" 
                          value={item.courses || ''} 
                          onChange={(e) => onItemChange(item.id, 'courses', e.target.value)} 
                          className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 tactile-input" 
                          placeholder={t.coursesPlaceholder} 
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">{t.honorsLabel}</label>
                        <input 
                          type="text" 
                          value={item.honors || ''} 
                          onChange={(e) => onItemChange(item.id, 'honors', e.target.value)} 
                          className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 tactile-input" 
                          placeholder={t.honorsPlaceholder} 
                        />
                      </div>
                    </div>

                    {/* Supplemental Content / Description Textarea */}
                    <div>
                      <div className="mb-1">
                        <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">{t.descLabel}</label>
                      </div>
                      <div className="flex flex-col mt-1">
                        <FormTextareaToolbar textareaId={item.id} value={item.content || ''} onChange={(val) => onItemChange(item.id, 'content', val)} lang={lang} />
                        <SmartMarkdownTextarea 
                          id={item.id}
                          value={item.content || ''}
                          onChange={(val) => onItemChange(item.id, 'content', val)}
                          minRows={3}
                          className="w-full p-2.5 text-xs font-mono leading-relaxed bg-slate-50/10 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-750 rounded-b-lg rounded-t-none border-t-0 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 shadow-[inset_0_1.5px_3px_rgba(15,23,42,0.04)] focus:shadow-none transition-all duration-200"
                          placeholder={t.descPlaceholder}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onAddItem}
                    className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-dashed border-purple-200 dark:border-purple-800 rounded-xl transition-all group cursor-pointer"
                  >
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>{t.addBtn}</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
