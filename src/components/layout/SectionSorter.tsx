import React, { useMemo, useState, useEffect } from 'react';
import { 
  ArrowUp, ArrowDown, Move, Info, GripVertical 
} from 'lucide-react';
import { Reorder } from 'motion/react';
import { splitMarkdownIntoSections, joinSectionsIntoMarkdown, MarkdownSection } from '../../lib/markdown-utils';
import { Tooltip } from '../ui/Tooltip';
import { getSectionTheme } from '../../lib/section-themes';
import { translateSectionTitle } from '../../lib/section-translator';

interface SectionSorterProps {
  markdown: string;
  onChange: (val: string, isUndoable?: boolean) => void;
  lang?: string;
  contentLang?: string;
}

interface SorterItem extends MarkdownSection {
  id: string;
}

function cleanContentPreview(content: string, maxLen = 30): string {
  if (!content) return '';
  const cleaned = content
    .replace(/^##\s+.*$/gm, '')
    .replace(/^###\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[#|｜·\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.substring(0, maxLen).trim() + '...';
}

export function SectionSorter({ markdown, onChange, lang = 'zh', contentLang = 'zh' }: SectionSorterProps) {
  const isUiEn = lang === 'en';
  const activeContentLang = contentLang === 'en' ? 'en' : 'zh';

  const { header, sections } = useMemo(() => {
    return splitMarkdownIntoSections(markdown);
  }, [markdown]);

  // Maintain stable IDs across renders for Reorder.Group
  const [items, setItems] = useState<SorterItem[]>([]);

  useEffect(() => {
    setItems((prevItems) => {
      return sections.map((sec, idx) => {
        const existing = prevItems.find((p) => p.title === sec.title && p.content === sec.content);
        return {
          id: existing ? existing.id : `sec_${idx}_${sec.title.replace(/\s+/g, '_')}`,
          title: sec.title,
          content: sec.content
        };
      });
    });
  }, [sections]);

  const handleReorder = (newItems: SorterItem[]) => {
    setItems(newItems);
    const newMarkdown = joinSectionsIntoMarkdown(
      header,
      newItems.map((item) => ({ title: item.title, content: item.content }))
    );
    onChange(newMarkdown, true);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    handleReorder(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    handleReorder(newItems);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 bg-slate-50/40 dark:bg-slate-900/60 select-none">
      {/* Header Info */}
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
              {isUiEn ? 'Section Order' : '板块排序'}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
            {isUiEn
              ? 'Drag handle or click arrows to reorder sections'
              : '按住手柄拖拽或点击上下箭头快速调整板块顺序'}
          </p>
        </div>

        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2.5 py-0.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200/80 dark:border-slate-700/80 shrink-0 shadow-2xs">
          {isUiEn ? `${items.length} Sections` : `共 ${items.length} 个板块`}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2">
          <Info className="w-7 h-7 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
          <p className="text-xs">
            {isUiEn ? 'No primary sections (## Heading) detected' : '未检测到简历板块（以 ## 开头的二级标题）'}
          </p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={handleReorder}
          className="space-y-2 list-none p-0 m-0"
        >
          {items.map((item, idx) => {
            const theme = getSectionTheme(item.title, lang);
            const Icon = theme.icon;
            const contentPreview = cleanContentPreview(item.content, 30);

            return (
              <Reorder.Item
                key={item.id}
                value={item}
                whileDrag={{
                  scale: 1.015,
                  zIndex: 50,
                  boxShadow: '0 12px 24px -4px rgba(79, 70, 229, 0.15), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
                  cursor: 'grabbing'
                }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 32
                }}
                className={`group relative flex items-center justify-between p-2.5 sm:p-3 pl-3.5 sm:pl-4 rounded-xl border select-none transition-all duration-150 cursor-grab active:cursor-grabbing ${theme.bg} ${theme.border} hover:border-indigo-300 dark:hover:border-indigo-600 shadow-2xs hover:shadow-sm`}
              >
                {/* Left Colored Accent Strip */}
                <div className={`absolute left-0 top-1.5 bottom-1.5 w-1 ${theme.dot} rounded-full`} />

                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  {/* Grip controller icon */}
                  <div className="flex items-center justify-center w-5 h-5 rounded text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 transition-colors shrink-0">
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  {/* Section index number */}
                  <div className="w-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0 tabular-nums">
                    {String(idx + 1).padStart(2, '0')}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-[13px]">
                        {translateSectionTitle(item.title, activeContentLang)}
                      </span>
                      {/* 只保留图标，移除图标后重复的文本 */}
                      <span 
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-md border ${theme.badgeBg} shrink-0`}
                        title={theme.badge}
                      >
                        <Icon className="w-3 h-3 shrink-0" />
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate font-normal">
                      {contentPreview || (isUiEn ? '(Empty content)' : '(暂无详细内容)')}
                    </p>
                  </div>
                </div>

                {/* Arrow controllers */}
                <div 
                  className="flex items-center gap-1 shrink-0"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <Tooltip content={isUiEn ? 'Move up' : '上移'} side="top" disabled={idx === 0}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(idx);
                      }}
                      className={`p-1 sm:p-1.5 rounded-md border transition-all ${
                        idx === 0
                          ? 'border-transparent text-slate-200 dark:text-slate-700 cursor-not-allowed'
                          : 'border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 cursor-pointer active:scale-95'
                      }`}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                  </Tooltip>
                  <Tooltip content={isUiEn ? 'Move down' : '下移'} side="top" disabled={idx === items.length - 1}>
                    <button
                      type="button"
                      disabled={idx === items.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown(idx);
                      }}
                      className={`p-1 sm:p-1.5 rounded-md border transition-all ${
                        idx === items.length - 1
                          ? 'border-transparent text-slate-200 dark:text-slate-700 cursor-not-allowed'
                          : 'border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 cursor-pointer active:scale-95'
                      }`}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </Tooltip>
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      )}
    </div>
  );
}
