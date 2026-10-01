import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BriefcaseBusiness,
  Check,
  Code2,
  FileText,
  Globe2,
  GraduationCap,
  LayoutGrid,
  Layers,
  X,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { TEMPLATES } from '../../data';
import { useConfirm } from '../../context/ConfirmContext';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import {
  getTemplatePresentation,
  getTemplatePreview,
  type TemplateGroup,
} from '../../lib/template-presentation';
import { useResumeStore } from '../../store/useResumeStore';

interface TemplateCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterKey = 'all' | TemplateGroup;

const FILTERS: Array<{
  value: FilterKey;
  labelZh: string;
  labelEn: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'all',
    labelZh: '全部',
    labelEn: 'All',
    icon: <LayoutGrid className="h-3.5 w-3.5" />,
  },
  {
    value: 'us',
    labelZh: '🇺🇸 美版 Resume',
    labelEn: '🇺🇸 US Resume',
    icon: <Globe2 className="h-3.5 w-3.5" />,
  },
  {
    value: 'uk',
    labelZh: '🇬🇧 英版 CV',
    labelEn: '🇬🇧 UK CV',
    icon: <Globe2 className="h-3.5 w-3.5" />,
  },
  {
    value: 'cn',
    labelZh: '🇨🇳 中文标准',
    labelEn: '🇨🇳 CN Standard',
    icon: <BriefcaseBusiness className="h-3.5 w-3.5" />,
  },
  {
    value: 'engineering',
    labelZh: '技术研发',
    labelEn: 'Engineering',
    icon: <Code2 className="h-3.5 w-3.5" />,
  },
  {
    value: 'product',
    labelZh: '产品运营',
    labelEn: 'Product & Ops',
    icon: <BriefcaseBusiness className="h-3.5 w-3.5" />,
  },
  {
    value: 'graduate',
    labelZh: '校招',
    labelEn: 'Graduate',
    icon: <GraduationCap className="h-3.5 w-3.5" />,
  },
  {
    value: 'global',
    labelZh: '海外英文',
    labelEn: 'Global',
    icon: <Globe2 className="h-3.5 w-3.5" />,
  },
];

function MiniResumePreview({
  content,
  paperSize = 'a4',
  compact = false,
  targetLang,
}: {
  content: string;
  paperSize?: 'a4' | 'letter';
  compact?: boolean;
  targetLang?: 'zh' | 'en';
}) {
  const preview = getTemplatePreview(content, targetLang);

  return (
    <div
      className={
        compact
          ? 'w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-2 shadow-sm'
          : 'w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm'
      }
      style={{ aspectRatio: paperSize === 'letter' ? '8.5 / 11' : '210 / 297' }}
      aria-hidden="true"
    >
      <div
        className={
          compact
            ? 'truncate text-[7px] font-black text-slate-900'
            : 'truncate text-[11px] font-black text-slate-900'
        }
      >
        {preview.name}
      </div>
      {preview.subtitle && (
        <div
          className={
            compact
              ? 'mt-0.5 truncate text-[4.5px] text-slate-500'
              : 'mt-1 truncate text-[7px] text-slate-500'
          }
        >
          {preview.subtitle}
        </div>
      )}

      <div className={compact ? 'mt-2 space-y-2' : 'mt-4 space-y-4'}>
        {preview.sections.map((section, index) => (
          <div key={section}>
            <div className="flex items-center gap-1">
              <span
                className={
                  compact
                    ? 'whitespace-nowrap text-[4.5px] font-bold text-indigo-700'
                    : 'whitespace-nowrap text-[7px] font-bold text-indigo-700'
                }
              >
                {section}
              </span>
              <span className="h-px flex-1 bg-indigo-100" />
            </div>
            <div
              className={
                compact
                  ? 'mt-1 h-1 rounded-full bg-slate-100'
                  : 'mt-1.5 h-1.5 rounded-full bg-slate-100'
              }
              style={{ width: index % 2 === 0 ? '92%' : '76%' }}
            />
            <div
              className={
                compact
                  ? 'mt-0.5 h-1 rounded-full bg-slate-100'
                  : 'mt-1 h-1.5 rounded-full bg-slate-100'
              }
              style={{ width: index % 2 === 0 ? '68%' : '88%' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TemplateCenterModal({
  isOpen,
  onClose,
}: TemplateCenterModalProps) {
  const {
    markdown,
    uiLanguage,
    currentTemplateId,
    applyTemplate,
  } = useResumeStore();
  const { confirm } = useConfirm();
  const dialogRef = useRef<HTMLDivElement>(null);
  const isEn = uiLanguage === 'en';

  useDialogFocus({ isOpen, dialogRef, onClose });

  const [selectedId, setSelectedId] = useState('cn_demo');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const localizedTemplates = useMemo(
    () =>
      TEMPLATES.map((template) => ({
        template,
        presentation: getTemplatePresentation(template, isEn ? 'en' : 'zh'),
      })),
    [isEn],
  );

  useEffect(() => {
    if (!isOpen) return;
    const fallbackId = isEn ? 'us_swe' : 'cn_demo';
    setSelectedId(
      TEMPLATES.some((template) => template.id === currentTemplateId)
        ? currentTemplateId
        : fallbackId,
    );
    setActiveFilter('all');
  }, [currentTemplateId, isEn, isOpen]);

  const matchesFilter = (item: (typeof localizedTemplates)[number], filter: FilterKey) => {
    if (filter === 'all') return true;

    // Market filters and scenario filters are intentionally independent.
    // A CN graduate template, for example, should appear under both
    // "CN Standard" and "Graduate".
    if (filter === 'cn' || filter === 'us' || filter === 'uk') {
      return item.presentation.targetMarket === filter;
    }

    return item.presentation.group === filter;
  };

  const visibleTemplates = localizedTemplates.filter((item) =>
    matchesFilter(item, activeFilter),
  );

  const selectedTemplate =
    TEMPLATES.find((template) => template.id === selectedId) ?? TEMPLATES[0];

  if (!isOpen || !selectedTemplate || typeof document === 'undefined') {
    return null;
  }

  const selectedPresentation = getTemplatePresentation(
    selectedTemplate,
    isEn ? 'en' : 'zh',
  );
  const selectedPreview = getTemplatePreview(selectedTemplate.content, selectedTemplate.suggestedLang);
  const isCurrentTemplate = currentTemplateId === selectedTemplate.id;
  const isExactCurrent =
    isCurrentTemplate && markdown === selectedTemplate.content;

  const chooseFilter = (filter: FilterKey) => {
    setActiveFilter(filter);
    if (filter === 'all') return;

    const currentSelection = localizedTemplates.find(
      (item) => item.template.id === selectedId,
    );
    if (currentSelection && matchesFilter(currentSelection, filter)) return;

    const firstMatch = localizedTemplates.find((item) =>
      matchesFilter(item, filter),
    );
    if (firstMatch) setSelectedId(firstMatch.template.id);
  };

  const handleApply = async () => {
    if (isExactCurrent) return;

    const confirmed = await confirm({
      title: isEn ? 'Use this content template?' : '使用这个内容模板？',
      message: isEn
        ? 'Using "' +
          selectedPresentation.name +
          '" replaces the active resume content. Target paper size (' +
          (selectedTemplate.defaultPaperSize?.toUpperCase() || 'A4') +
          ') and market standards will be synchronized.'
        : '使用「' +
          selectedPresentation.name +
          '」会替换当前简历内容，并自动同步目标市场格式与纸张规格（' +
          (selectedTemplate.defaultPaperSize?.toUpperCase() || 'A4') +
          '）。',
      confirmText: isEn ? 'Use content template' : '使用内容模板',
      cancelText: isEn ? 'Cancel' : '取消',
      type: 'warning',
    });

    if (!confirmed) return;

    applyTemplate(selectedTemplate.id);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-5">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-950/65 backdrop-blur-sm"
        onClick={onClose}
        aria-label={isEn ? 'Close content template library' : '关闭内容模板库'}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-center-title"
        aria-describedby="template-center-description"
        tabIndex={-1}
        className="relative z-10 flex max-h-[calc(100dvh-1rem)] sm:max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3.5 dark:border-slate-800 sm:px-6 sm:py-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <FileText className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em]">
                {isEn ? 'Content Template Library' : '内容模板库'}
              </span>
            </div>
            <h2
              id="template-center-title"
              className="text-lg font-black text-slate-950 dark:text-white"
            >
              {isEn ? 'Choose a content template' : '选择内容模板'}
            </h2>
            <p
              id="template-center-description"
              className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500 dark:text-slate-400"
            >
              {isEn
                ? 'Browse by job-seeking scenario and preview first. Applying a template replaces the resume content and syncs its target market, paper size, and date format; visual Layout and Style stay unchanged.'
                : '按求职场景浏览并先预览。应用模板会替换简历内容，并同步目标市场、纸张和日期格式；视觉排版与样式设置保持不变。'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? 'Close content template library' : '关闭内容模板库'}
            className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {FILTERS.map((filter) => {
              const active = activeFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => chooseFilter(filter.value)}
                  aria-pressed={active}
                  className={
                    'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ' +
                    (active
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300')
                  }
                >
                  {filter.icon}
                  {isEn ? filter.labelEn : filter.labelZh}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:overflow-hidden">
          <div className="min-h-0 border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5 lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-3 sm:grid-cols-3">
              {visibleTemplates.map(({ template, presentation }) => {
                const selected = template.id === selectedId;
                const current = currentTemplateId === template.id;
                const exactCurrent =
                  current && markdown === template.content;

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedId(template.id)}
                    aria-pressed={selected}
                    aria-label={presentation.name}
                    className={
                      'group rounded-2xl border p-2.5 text-left transition ' +
                      (selected
                        ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/10 dark:bg-indigo-950/30'
                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900')
                    }
                  >
                    <MiniResumePreview content={template.content} paperSize={template.defaultPaperSize} compact targetLang={template.suggestedLang} />
                    <div className="mt-2.5 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 truncate text-[11px] font-black text-slate-800 dark:text-slate-100">
                          {presentation.name}
                        </div>
                        {current && (
                          <span
                            className={
                              'shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-black ' +
                              (exactCurrent
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400')
                            }
                          >
                            {exactCurrent
                              ? isEn
                                ? 'Current'
                                : '当前'
                              : isEn
                                ? 'Current · Edited'
                                : '当前 · 已编辑'}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-slate-400">
                        {presentation.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {presentation.marketBadge && (
                          <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 text-[8px] font-black">
                            {presentation.marketBadge}
                          </span>
                        )}
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {presentation.language}
                        </span>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {presentation.experience}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 bg-slate-50/80 p-5 dark:bg-slate-950/35 sm:p-6 lg:overflow-y-auto">
            <div className="mx-auto max-w-sm">
              <MiniResumePreview content={selectedTemplate.content} paperSize={selectedTemplate.defaultPaperSize} targetLang={selectedTemplate.suggestedLang} />

              <div className="mt-5">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedPresentation.marketBadge && (
                    <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-black text-white shadow-xs">
                      {selectedPresentation.marketBadge}
                    </span>
                  )}
                  <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {selectedPresentation.category}
                  </span>
                  <span className="rounded-full bg-slate-200/70 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {selectedPresentation.language}
                  </span>
                  <span className="rounded-full bg-slate-200/70 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {selectedPresentation.experience}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-black text-slate-950 dark:text-white">
                  {selectedPresentation.name}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {selectedPresentation.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedPresentation.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <Layers className="h-3.5 w-3.5 text-indigo-500" />
                    {isEn ? 'Included sections' : '包含的内容结构'}
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedPreview.name}
                  </div>
                  <div data-testid="selected-template-sections" className="mt-1 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {selectedPreview.sections.join(' · ')}
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-[10px] leading-relaxed text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <strong>
                    {isEn ? 'What changes:' : '会变化：'}
                  </strong>{' '}
                  {isEn ? 'resume content.' : '简历内容。'}{' '}
                  <strong>
                    {isEn ? 'What stays:' : '会保留：'}
                  </strong>{' '}
                  {isEn
                    ? 'your Layout and Style settings.'
                    : '你的排版和样式设置。'}
                </div>

                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isExactCurrent}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-black text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-default disabled:bg-emerald-600 disabled:shadow-none"
                >
                  {isExactCurrent ? (
                    <>
                      <Check className="h-4 w-4" />
                      {isEn ? 'Currently applied' : '当前正在使用'}
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      {isCurrentTemplate
                        ? isEn
                          ? 'Restore template content'
                          : '恢复模板原始内容'
                        : isEn
                          ? 'Use content template'
                          : '使用内容模板'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
