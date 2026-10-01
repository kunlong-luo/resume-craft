import React, { useState, useRef, useEffect, useMemo, useDeferredValue } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Copy, RotateCcw, Check, Bold, Italic, Link, List, ListOrdered, Table, Minus, Heading1, Heading2, Code, Scissors, Undo, Redo,
  Layers, GraduationCap, ChevronDown, Briefcase, ChevronsUp, ChevronsDown, Wand2, FolderKanban, User, ArrowUpDown
} from 'lucide-react';
import { FormEditor } from './form/FormEditor';
import { SectionSorter } from './layout/SectionSorter';
import { useResumeStore } from '../store/useResumeStore';
import { useConfirm } from '../context/ConfirmContext';
import { TEMPLATES } from '../data';

import { autoFormatAndCleanResume } from '../lib/resume-auto-fixer';
import { getWordCount } from '../lib/word-count';
import { Tooltip } from './ui';

function highlightInline(text: string): string {
  let parsed = text;

  // STAR bold patterns like **[Situation 业务背景]** or **[Task]**
  parsed = parsed.replace(/\*\*\[([^\]]+)\]\*\*/g, '<span class="text-blue-600 dark:text-blue-400 font-bold bg-blue-50/70 dark:bg-blue-950/40">**[$1]**</span>');

  // Inline bold: **text** or __text__
  parsed = parsed.replace(/\*\*([^*]+)\*\*/g, '<span class="text-slate-900 dark:text-slate-100 font-bold">**$1**</span>');
  parsed = parsed.replace(/__([^_]+)__/g, '<span class="text-slate-900 dark:text-slate-100 font-bold">__$1__</span>');

  // Inline italic: *text* or _text_
  parsed = parsed.replace(/\*([^*]+)\*/g, '<span class="text-slate-500 dark:text-slate-400 italic">*$1*</span>');
  parsed = parsed.replace(/_([^_]+)_/g, '<span class="text-slate-500 dark:text-slate-400 italic">_$1_</span>');

  // Inline code: `code`
  parsed = parsed.replace(/`([^`]+)`/g, '<span class="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 font-semibold">`$1`</span>');

  // Links: [text](url)
  parsed = parsed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="text-blue-500 dark:text-blue-400 font-medium underline">[$1]</span><span class="text-slate-400 dark:text-slate-500">($2)</span>');

  // Star ratings (e.g. ★★★★☆)
  parsed = parsed.replace(/([★☆]+)/g, '<span class="text-amber-500 font-bold">$1</span>');

  return parsed;
}

function highlightMarkdown(text: string): string {
  if (!text) return '&nbsp;';

  // 1. Escape HTML
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Line by line processing
  const lines = html.split('\n');
  const highlightedLines = lines.map(line => {
    if (line.trim() === '') {
      return '';
    }

    // Headers
    if (line.startsWith('### ')) {
      return `<span class="text-indigo-600 dark:text-indigo-400 font-bold">### ${highlightInline(line.substring(4))}</span>`;
    }
    if (line.startsWith('## ')) {
      return `<span class="text-blue-600 dark:text-blue-400 font-bold">## ${highlightInline(line.substring(3))}</span>`;
    }
    if (line.startsWith('# ')) {
      return `<span class="text-slate-900 dark:text-slate-100 font-extrabold"># ${highlightInline(line.substring(2))}</span>`;
    }

    // Blockquotes
    if (line.startsWith('&gt; ')) {
      return `<span class="text-slate-400 dark:text-slate-500 italic font-semibold">&gt; </span><span class="text-slate-500 dark:text-slate-400 italic">${highlightInline(line.substring(5))}</span>`;
    }

    // Bullet List Items
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return `<span class="text-indigo-500 dark:text-indigo-400 font-bold">${line.substring(0, 2)}</span>${highlightInline(line.substring(2))}`;
    }

    // Numbered List Items
    const numMatch = line.match(/^(\d+\.\s)/);
    if (numMatch) {
      const numPrefix = numMatch[1];
      return `<span class="text-indigo-500 dark:text-indigo-400 font-bold">${numPrefix}</span>${highlightInline(line.substring(numPrefix.length))}`;
    }

    // Divider
    if (line.trim() === '---' || line.trim() === '***') {
      return `<span class="text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 font-semibold">${line}</span>`;
    }

    // Page Break
    if (line.includes('&lt;!-- pagebreak --&gt;')) {
      return line.replace(/&lt;!-- pagebreak --&gt;/g, '<span class="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 font-semibold">&lt;!-- pagebreak --&gt;</span>');
    }

    return highlightInline(line);
  });

  return highlightedLines.join('\n');
}

// Props are refactored to use Zustand global store
export const Editor = React.memo(function Editor() {
  const {
    markdown: value,
    handleMarkdownChange: onChange,
    handleUndo: onUndo,
    handleRedo: onRedo,
    historyIndex,
    history,
    settings,
    uiLanguage,
    updateSetting,
    currentTemplateId,
    applyTemplate,
    replaceDocument,
  } = useResumeStore();

  const deferredValue = useDeferredValue(value);
  const isUiEn = uiLanguage === 'en';
  const isResumeEn = settings.lang === 'en';

  const { confirm } = useConfirm();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const onReset = async () => {
    const fallbackTemplateIdByMarket = {
      cn: 'cn_demo',
      us: 'us_swe',
      ca: 'ca_tech',
      uk: 'uk_cv',
      ie: 'english',
      international: 'english',
    } as const;
    const currentMarket = settings.marketRegion || (isResumeEn ? 'international' : 'cn');
    const fallbackTemplateId = fallbackTemplateIdByMarket[currentMarket];
    const isCustomReset = currentTemplateId === 'custom';
    const resetTemplate =
      (!isCustomReset
        ? TEMPLATES.find((template) => template.id === currentTemplateId)
        : undefined) ??
      TEMPLATES.find((template) => template.id === fallbackTemplateId) ??
      TEMPLATES.find((template) => template.id === (isResumeEn ? 'english' : 'cn_demo')) ??
      TEMPLATES[0];

    if (!resetTemplate) return;

    const confirmed = await confirm({
      title: isUiEn ? 'Reset current template' : '重置当前模板',
      message: isUiEn
        ? `Restore "${resetTemplate.name}" to its original example content and sync its target market, paper size, and date format? Your current content changes will be lost.`
        : `恢复「${resetTemplate.name}」的原始示例内容，并同步目标市场、纸张和日期格式？当前内容修改将会丢失。`,
      confirmText: isUiEn ? 'Reset template' : '重置模板',
      cancelText: isUiEn ? 'Cancel' : '取消',
      type: 'danger'
    });

    if (!confirmed) return;

    const fallbackReusesAnotherMarket =
      isCustomReset &&
      resetTemplate.targetMarket &&
      resetTemplate.targetMarket !== currentMarket;

    if (fallbackReusesAnotherMarket) {
      // Some markets (for example Ireland) intentionally reuse a generic content
      // example. Keep the user's explicit market/paper/date settings instead of
      // silently switching them to the source template's market.
      replaceDocument(resetTemplate.content, settings, 'custom');
      return;
    }

    applyTemplate(resetTemplate.id);
  };

  const [copied, setCopied] = useState(false);
  const [activeMode, setActiveMode] = useState<'markdown' | 'form' | 'layout'>('form');
  const [formExpandedState, setFormExpandedState] = useState<{ isAllExpanded: boolean; hasSections: boolean }>({
    isAllExpanded: true,
    hasSections: true
  });

  useEffect(() => {
    const handleFormExpandedState = (e: Event) => {
      const customEvent = e as CustomEvent;
      setFormExpandedState({
        isAllExpanded: customEvent.detail.isAllExpanded,
        hasSections: customEvent.detail.hasSections
      });
    };

    document.addEventListener('form-expanded-state', handleFormExpandedState);
    return () => {
      document.removeEventListener('form-expanded-state', handleFormExpandedState);
    };
  }, []);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    // Synchronize scroll on state changes or initial rendering
    const timer = setTimeout(() => {
      if (textareaRef.current && preRef.current) {
        preRef.current.scrollTop = textareaRef.current.scrollTop;
        preRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [value, activeMode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertMarkdown = (syntax: string) => {
    const textarea = document.getElementById('markdown-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    let replacement = syntax;
    if (start !== end) {
      const selected = text.substring(start, end);
      if (syntax.includes('text')) {
        replacement = syntax.replace('text', selected);
      } else {
        replacement = syntax + selected;
      }
    }
    
    onChange(before + replacement + after, true);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  const [cleanFeedback, setCleanFeedback] = useState<string | null>(null);
  const [isSnippetsDropdownOpen, setIsSnippetsDropdownOpen] = useState(false);

  // Auto detect format issues and 1-click clean
  const autoCleanResult = useMemo(() => {
    return autoFormatAndCleanResume(deferredValue);
  }, [deferredValue]);

  const handleAutoClean = () => {
    if (!autoCleanResult.hasChanges) {
      setCleanFeedback(isUiEn ? 'Already Perfect!' : '排版格式已是最佳状态');
      setTimeout(() => setCleanFeedback(null), 2000);
      return;
    }

    onChange(autoCleanResult.cleanedMarkdown, true);
    setCleanFeedback(
      isUiEn 
        ? `Cleaned ${autoCleanResult.fixesCount} items!` 
        : `已一键规范化 ${autoCleanResult.fixesCount} 处格式！`
    );
    setTimeout(() => {
      setCleanFeedback(null);
    }, 2500);
  };

  const handleAutoSpacing = handleAutoClean;


  // Stats calculation and markdown highlighting memoization
  const charCount = useMemo(() => value.length, [value]);
  const wordCount = useMemo(() => getWordCount(value), [value]);
  const lineCount = useMemo(() => value.split('\n').length, [value]);
  // Estimate page logic (uses actual measured page count if available from preview, otherwise estimates based on length)
  const highlightedHtml = useMemo(() => highlightMarkdown(deferredValue) + '\n', [deferredValue]);

  return (
    <div className="flex flex-col h-full bg-[#fdfdfd] dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 shadow-[inset_-4px_0_12px_rgb(0,0,0,0.02)] min-w-0 overflow-hidden">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-2.5 sm:px-6 py-1.5 sm:py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 gap-1.5 sm:gap-3 relative overflow-x-auto scrollbar-none flex-nowrap">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 dark:bg-indigo-500 rounded-r"></div>
        
        {/* Toggle Mode Segmented Control: Form | Markdown */}
        <div className="relative flex bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner shrink-0">
          <button
            type="button"
            onClick={() => setActiveMode('form')}
            aria-label={isUiEn ? 'Form editor' : '表单编辑模式'}
            className={`relative flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeMode === 'form'
                ? 'text-indigo-700 dark:text-indigo-300 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {activeMode === 'form' && (
              <motion.div
                layoutId="editorActiveModeCapsule"
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-600 z-[-1]"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{isUiEn ? 'Form' : '表单'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('markdown')}
            aria-label={isUiEn ? 'Markdown source editor' : 'Markdown 源码编辑模式'}
            className={`relative flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeMode === 'markdown'
                ? 'text-indigo-700 dark:text-indigo-300 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {activeMode === 'markdown' && (
              <motion.div
                layoutId="editorActiveModeCapsule"
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-600 z-[-1]"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <Code className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{isUiEn ? 'Markdown' : '源码'}</span>
          </button>
        </div>

        {/* Right Toolset: 排序 | 折叠 | 规范 | 分页线 | 复制 | 重置 */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <Tooltip content={isUiEn ? 'Undo' : '撤销'} shortcut="Ctrl+Z">
            <button 
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              aria-label={isUiEn ? 'Undo' : '撤销'}
              className={`p-1.5 rounded-lg transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${canUndo ? 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
            >
              <Undo className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </Tooltip>

          <Tooltip content={isUiEn ? 'Redo' : '重做'} shortcut="Ctrl+Y">
            <button 
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              aria-label={isUiEn ? 'Redo' : '重做'}
              className={`p-1.5 rounded-lg transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${canRedo ? 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
            >
              <Redo className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </Tooltip>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5 shrink-0" />

          {/* 排序 (Section Order) */}
          <Tooltip content={isUiEn ? 'Reorder resume sections' : '调整简历模块顺序'}>
            <button
              type="button"
              onClick={() => setActiveMode(activeMode === 'layout' ? 'form' : 'layout')}
              aria-pressed={activeMode === 'layout'}
              aria-label={isUiEn ? 'Reorder sections' : '调整简历模块顺序'}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                activeMode === 'layout'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/70 dark:border-indigo-800 dark:text-indigo-300'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            </button>
          </Tooltip>

          {/* 折叠/展开 (Collapse / Expand all) */}
          {activeMode === 'form' && formExpandedState.hasSections && (
            <Tooltip
              content={formExpandedState.isAllExpanded ? (isUiEn ? 'Collapse all sections' : '一键折叠所有模块') : (isUiEn ? 'Expand all sections' : '一键展开所有模块')}
            >
              <button 
                type="button"
                onClick={() => {
                  document.dispatchEvent(new CustomEvent('toggle-all-sections', {
                    detail: { expand: !formExpandedState.isAllExpanded }
                  }));
                }}
                aria-label={formExpandedState.isAllExpanded ? (isUiEn ? 'Collapse all sections' : '一键折叠所有模块') : (isUiEn ? 'Expand all sections' : '一键展开所有模块')}
                className="p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {formExpandedState.isAllExpanded ? (
                  <ChevronsUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronsDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                )}
              </button>
            </Tooltip>
          )}

          {/* 规范排版 (Auto Clean) */}
          <Tooltip
            content={
              cleanFeedback
                ? cleanFeedback
                : (isUiEn ? 'Standardize CJK/English spacing, trim extra lines' : '规范中英空格与去除多余空行')
            }
            shortcut="Ctrl+Shift+F"
          >
            <button 
              type="button"
              onClick={handleAutoClean}
              aria-label={isUiEn ? 'Auto format and clean spacing' : '规范排版'}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                cleanFeedback
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/20'
                  : autoCleanResult.hasChanges
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 shadow-indigo-500/10'
                    : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              {cleanFeedback ? (
                <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Wand2 className={`w-3.5 h-3.5 shrink-0 ${autoCleanResult.hasChanges ? 'text-indigo-600 dark:text-indigo-400' : ''}`} aria-hidden="true" />
              )}
            </button>
          </Tooltip>

          {/* 分页辅助线 (Page Break Line) */}
          <Tooltip content={isUiEn ? 'Toggle page break guide line' : '显示/隐藏分页辅助线'}>
            <button
              type="button"
              onClick={() => updateSetting('showPageBreakLine', !settings.showPageBreakLine)}
              aria-pressed={settings.showPageBreakLine}
              aria-label={isUiEn ? 'Toggle page break guide' : '切换分页辅助线'}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                settings.showPageBreakLine
                  ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-400'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            </button>
          </Tooltip>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5 shrink-0" />

          {/* 复制 Markdown 源码 */}
          <Tooltip content={isUiEn ? 'Copy Markdown source' : '复制 Markdown 源码'}>
            <button 
              type="button"
              onClick={handleCopy}
              aria-label={isUiEn ? 'Copy Markdown source' : '复制 Markdown 源码'}
              className="p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
            </button>
          </Tooltip>

          {/* 重置模板 */}
          <Tooltip content={isUiEn ? 'Reset current template and market format' : '重置当前模板并同步市场格式'}>
            <button 
              type="button"
              onClick={onReset}
              aria-label={isUiEn ? 'Reset current template' : '重置当前模板'}
              className="p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {activeMode === 'markdown' ? (
            <motion.div
              key="editor-markdown"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col min-h-0 w-full h-full"
            >
          {/* Formatting Help Toolbar */}
          <div className="flex items-center flex-wrap gap-1 px-4 py-1.5 bg-gray-50/70 dark:bg-slate-850 border-b border-gray-100 dark:border-slate-800">
            <Tooltip content={isUiEn ? 'Heading 1' : '一级大标题'} shortcut="# text" side="bottom">
              <button
                onClick={() => insertMarkdown('# text')}
                className="p-1.5 hover:bg-gray-200/60 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white rounded transition-colors cursor-pointer"
              >
                <Heading1 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <Tooltip content={isUiEn ? 'Heading 2 (Section)' : '二级板块标题'} shortcut="## text" side="bottom">
              <button
                onClick={() => insertMarkdown('## text')}
                className="p-1.5 hover:bg-gray-200/60 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white rounded transition-colors cursor-pointer"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <div className="w-px h-3.5 bg-gray-200 dark:bg-slate-700 mx-1"></div>

            <Tooltip content={isUiEn ? 'Bold' : '文本加粗'} shortcut="**text**" side="bottom">
              <button
                onClick={() => insertMarkdown('**text**')}
                className="p-1.5 hover:bg-gray-200/60 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white rounded transition-colors cursor-pointer"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <Tooltip content={isUiEn ? 'Italic' : '斜体强调'} shortcut="*text*" side="bottom">
              <button
                onClick={() => insertMarkdown('*text*')}
                className="p-1.5 hover:bg-gray-200/60 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white rounded transition-colors cursor-pointer"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <Tooltip content={isUiEn ? 'Inline Code' : '行内代码/标签'} shortcut="`text`" side="bottom">
              <button
                onClick={() => insertMarkdown('`text`')}
                className="p-1.5 hover:bg-gray-200/60 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white rounded transition-colors cursor-pointer"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <div className="w-px h-3.5 bg-gray-200 dark:bg-slate-700 mx-1"></div>

            <Tooltip content={isUiEn ? 'Bullet List' : '无序项目列表'} shortcut="- text" side="bottom">
              <button
                onClick={() => insertMarkdown('- text')}
                className="p-1.5 hover:bg-gray-200/60 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white rounded transition-colors cursor-pointer"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <Tooltip content={isUiEn ? 'Numbered List' : '有序项目列表'} shortcut="1. text" side="bottom">
              <button
                onClick={() => insertMarkdown('1. text')}
                className="p-1.5 hover:bg-gray-200/60 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white rounded transition-colors cursor-pointer"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <Tooltip content={isUiEn ? 'Insert Link' : '插入超链接'} shortcut="[title](url)" side="bottom">
              <button
                onClick={() => insertMarkdown('[link](url)')}
                className="p-1.5 hover:bg-gray-200/60 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white rounded transition-colors cursor-pointer"
              >
                <Link className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <Tooltip content={isUiEn ? 'Divider Line' : '插入水平分割线'} shortcut="---" side="bottom">
              <button
                onClick={() => insertMarkdown('\n---\n')}
                className="p-1.5 hover:bg-gray-200/60 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white rounded transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <Tooltip content={isUiEn ? 'Insert Page Break' : '插入强制分页符'} side="bottom">
              <button
                onClick={() => insertMarkdown('\n<!-- pagebreak -->\n')}
                className="p-1.5 hover:bg-gray-200/60 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white rounded transition-colors cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </button>
            </Tooltip>

            <Tooltip content={isUiEn ? 'Insert Table' : '插入 Markdown 表格'} side="bottom">
              <button
                onClick={() => insertMarkdown('\n| Header 1 | Header 2 |\n| -------- | -------- |\n| Item 1   | Item 2   |\n')}
                className="p-1.5 hover:bg-gray-200/60 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white rounded transition-colors cursor-pointer"
              >
                <Table className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <div className="w-px h-3.5 bg-gray-200 dark:bg-slate-700 mx-1.5"></div>

            {/* Quick Snippets Inserter Dropdown */}
            <div className="relative">
              <Tooltip content={isUiEn ? 'Insert ready-made resume sections' : '快速插入常用结构化简历模块'}>
                <button
                  onClick={() => setIsSnippetsDropdownOpen(!isSnippetsDropdownOpen)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-indigo-950/60 dark:to-blue-950/60 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-indigo-900/70 dark:hover:to-blue-900/70 text-blue-700 dark:text-blue-300 hover:text-indigo-800 dark:hover:text-white rounded border border-blue-200/50 dark:border-indigo-800 text-[11px] font-semibold transition-all shadow-sm cursor-pointer ml-1 active:scale-95"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{isUiEn ? 'Insert Snippets' : '插入常用模块'}</span>
                  <ChevronDown className={`w-3 h-3 text-blue-500 dark:text-blue-400 transition-transform shrink-0 ${isSnippetsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </Tooltip>

              {isSnippetsDropdownOpen && (
                <>
                  {/* Overlay background to dismiss */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsSnippetsDropdownOpen(false)}
                  />
                  {/* Dropdown Items list */}
                  <div className="absolute left-1 mt-1 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-lg py-1.5 z-50 flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest border-b border-gray-100 dark:border-slate-700 mb-1">
                      {isUiEn ? 'Select Snippet to Insert' : '选择常用模块插入'}
                    </div>
                    
                    {/* 1. Summary / Personal Advantages */}
                    <button
                      onClick={() => {
                        const snippet = isResumeEn
                          ? `\n## Summary\n- **Core Competence**: Over 5 years of solid experience in large-scale web applications and frontend architecture.\n- **Engineering Excellence**: Proven track record in performance optimization, CI/CD pipeline automation, and code quality standards.\n- **Team Leadership**: Experienced in cross-functional collaboration, technical mentoring, and leading agile delivery teams.\n`
                          : `\n## 个人优势\n- **专业深度**：5 年前端研发与架构经验，精通 React/TypeScript 技术栈与现代工程化体系。\n- **性能攻坚**：主导多次核心系统性能重构与指标调优，具备丰富的大型复杂业务系统治理经验。\n- **团队协作**：具备良好的跨团队沟通与技术攻坚能力，指导初中级工程师，推动敏捷迭代与工程规范落地。\n`;
                        insertMarkdown(snippet);
                        setIsSnippetsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-750 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer text-left font-medium"
                    >
                      <User className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span>{isUiEn ? 'Strengths' : '个人优势模板'}</span>
                    </button>

                    {/* 2. Skill bar progress indicators */}
                    <button
                      onClick={() => {
                        const snippet = isResumeEn
                          ? `\n- **Frontend Core**: React / Vue.js | Expert ★★★★★\n- **Backend/Full-stack**: Node.js / Go | Proficient ★★★★☆\n- **AI & LLM**: RAG / Agent Development | Proficient ★★★★☆\n- **DevOps & Tooling**: Webpack / Vite / Docker | Familiar ★★★☆☆\n`
                          : `\n- **前端核心**：React / Vue.js ｜ 精通 ★★★★★\n- **后端/全栈**：Node.js / Go ｜ 熟练 ★★★★☆\n- **大模型应用**：RAG / Agent 开发 ｜ 熟练 ★★★★☆\n- **工具与工程**：Webpack / Vite / Docker ｜ 熟悉 ★★★☆☆\n`;
                        insertMarkdown(snippet);
                        setIsSnippetsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-slate-750 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors cursor-pointer text-left font-medium"
                    >
                      <Layers className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                      <span>{isUiEn ? 'Skills & Ratings' : '专业技能 (带星级)'}</span>
                    </button>

                    {/* 3. Work experience */}
                    <button
                      onClick={() => {
                        const snippet = isResumeEn
                          ? `\n### **Company Name | Position / Role | 2023.06 - Present**\n- **Core Responsibility**: Directed/Led... (Describe major tasks, e.g. key system design and full-stack development)\n- **Business Impact**: Spearheaded... (e.g. Completed performance overhaul, reducing latency by 50% and doubling peak throughput)\n- **Team & Collaboration**: Mentored 3 junior engineers and established continuous integration guidelines to accelerate release velocity by 30%.\n`
                          : `\n### **公司名称 ｜ 岗位名称 ｜ 2023.06 - 至今**\n- **核心职责**：主导/负责...（描述主要工作，如：核心系统的架构设计与研发）\n- **业务产出**：主导了...（例如：完成了全链路性能重构，首屏耗时降低 50%，核心 QPS 支持翻倍）\n- **团队协作**：指导...（例如：指导 3 位初级工程师，制定 CI/CD 规范，缩短版本发布周期 30%）\n`;
                        insertMarkdown(snippet);
                        setIsSnippetsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-750 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer text-left font-medium"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                      <span>{isUiEn ? 'Work Experience' : '工作经历模板'}</span>
                    </button>

                    {/* 4. STAR Project */}
                    <button
                      onClick={() => {
                        const snippet = isResumeEn
                          ? `\n### **Project Name | Role | 2024.10 - 2025.02**\n- **[Situation]**: Faced with severe latency spikes (averaging 3.5s) and slow queries during high traffic events, resulting in a 10% drop in user conversion rate.\n- **[Task]**: As Lead Engineer, tasked to refactor database performance and system architecture to reduce average latency below 500ms.\n- **[Action]**: Designed and implemented the following initiatives:\n  1. **Database Tuning**: Engineered composite indexes and optimized SQL joins to reduce slow query logs by 90%.\n  2. **Concurrency Control**: Implemented Redis cache clusters and Kafka message brokers for reliable request throttling.\n- **[Result]**: Reduced response time to 500ms, achieved 100% service uptime during high-concurrency events, and increased checkout conversion by 12%.\n`
                          : `\n### **项目名称 ｜ 角色名称 ｜ 2024.10 - 2025.02**\n- **[Situation 业务背景]**：面对...（例如：原有系统在 QPS 万级时存在慢查询和高延迟问题，导致成单率降低了 10%）\n- **[Task 核心任务]**：作为重构负责人，主导数据库性能调优与架构演进，在 3 个月内将响应耗时控制在 500ms 内\n- **[Action 关键行动]**：为了达成目标，实施了以下方案：\n  1. **数据库优化**：针对全表扫描慢查询建立复合索引，重写 Join 逻辑，使慢 SQL 占比降低 90%\n  2. **并发削峰**：引入 Redis 热点缓存与 Kafka 消息队列，完美支撑双十一 QPS 高峰\n- **[Result 实际产出]**：项目上线后，首屏响应由 3.5s 缩短至 0.5s，单点服务稳定度 100%，成单率增加 12%\n`;
                        insertMarkdown(snippet);
                        setIsSnippetsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-750 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer text-left font-medium"
                    >
                      <FolderKanban className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      <span>{isUiEn ? 'Project Experience (STAR)' : '代表项目 (STAR)'}</span>
                    </button>

                    {/* 5. Education experiences */}
                    <button
                      onClick={() => {
                        const snippet = isResumeEn
                          ? `\n### **University Name | B.S. in Computer Science | 2016.09 - 2020.06**\n- **Academic Performance**: GPA 3.8/4.0 (Top 5%), received National Scholarship for Academic Excellence.\n- **Campus Leadership**: Served as CS Club President, organizing 2 campus-wide hackathons.\n`
                          : `\n### **学校名称 ｜ 专业名称 (本科) ｜ 2016.09 - 2020.06**\n- **学术成绩**：GPA 3.8/4.0 (专业前 5%)，连续 2 年获得国家励志奖学金\n- **校园经历**：曾担任学校计算机社团团长，主导举办了 2 次校级编程挑战赛\n`;
                        insertMarkdown(snippet);
                        setIsSnippetsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-slate-750 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer text-left font-medium"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                      <span>{isUiEn ? 'Education Background' : '教育背景模板'}</span>
                    </button>

                    {/* 6. Multi-column Contacts */}
                    <button
                      onClick={() => {
                        const snippet = isResumeEn
                          ? `\n# Your Name\nPosition: Senior Software Engineer | 5 Years Experience | San Francisco, CA\n+1 (555) 019-2834 | your.email@email.com | github.com/yourusername | linkedin.com/in/yourprofile\n`
                          : `\n# 姓名\n意向岗位：高级前端工程师 ｜ 5年工作经验 ｜ 深圳\n13812345678 ｜ your.email@email.com ｜ github.com/yourgithub\n`;
                        insertMarkdown(snippet);
                        setIsSnippetsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-750 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer text-left font-medium"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span>{isUiEn ? 'Contact Info Header' : '个人联系方式栏'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Auto Spacing & Clean button */}
            <Tooltip
              content={isUiEn ? 'Magic Formatter: Auto Clean & Format' : '魔法排版：中英空格与格式一键规整'}
              shortcut="Ctrl+Shift+F"
            >
              <button
                onClick={handleAutoClean}
                className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-semibold transition-all shadow-sm cursor-pointer ml-1 active:scale-95 ${
                  cleanFeedback
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : autoCleanResult.hasChanges
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <Wand2 className="w-3 h-3 shrink-0" />
                <span>
                  {cleanFeedback 
                    ? cleanFeedback 
                    : autoCleanResult.hasChanges 
                      ? (isUiEn ? `Clean (${autoCleanResult.fixesCount})` : `规整 (${autoCleanResult.fixesCount})`) 
                      : (isUiEn ? 'Formatted' : '格式正常')}
                </span>
              </button>
            </Tooltip>
          </div>

          {/* Main Textarea with Highlighted Overlay */}
          <div className="relative flex-1 w-full overflow-hidden bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
            {/* Syntax Highlighted Layer (behind the transparent textarea) */}
            <pre
              ref={preRef}
              className="absolute inset-0 w-full h-full editor-font-base editor-pre text-slate-800 dark:text-slate-200"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              aria-hidden="true"
            />
            {/* Transparent Textarea on top */}
            <textarea
              id="markdown-textarea"
              ref={textareaRef}
              className="absolute inset-0 w-full h-full editor-font-base editor-textarea text-transparent focus:outline-none focus:ring-0 selection:bg-blue-100/60 dark:selection:bg-indigo-900/60"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onScroll={handleScroll}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                  if (e.shiftKey) {
                    if (onRedo && canRedo) {
                      e.preventDefault();
                      onRedo();
                    }
                  } else {
                    if (onUndo && canUndo) {
                      e.preventDefault();
                      onUndo();
                    }
                  }
                }
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                  if (onRedo && canRedo) {
                    e.preventDefault();
                    onRedo();
                  }
                }
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
                  e.preventDefault();
                  handleAutoSpacing();
                }
              }}
              placeholder="Type your resume in Markdown here..."
              spellCheck="false"
            />
            </div>
          </motion.div>
        ) : activeMode === 'layout' ? (
          <motion.div
            key="editor-layout"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col min-h-0 w-full h-full overflow-hidden"
          >
            <SectionSorter markdown={value} onChange={onChange} lang={uiLanguage} />
          </motion.div>
        ) : (
          <motion.div
            key="editor-form"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col min-h-0 w-full h-full overflow-hidden"
          >
            <FormEditor value={value} onChange={onChange} settings={settings} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-1.5 sm:py-2 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 text-[10px] sm:text-[11px] text-gray-500 dark:text-slate-400 font-medium z-10 overflow-x-auto scrollbar-none whitespace-nowrap gap-2">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Tooltip 
            content={isUiEn ? `Characters: ${charCount} | Lines: ${lineCount}` : `字符数：${charCount} 字（含标点空格） | 行数：${lineCount} 行`}
            side="top"
          >
            <span className="cursor-help hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              {isUiEn ? 'Words: ' : '字数: '}
              <strong className="text-gray-700 dark:text-slate-200 font-bold">{wordCount}</strong>
            </span>
          </Tooltip>
        </div>
        <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-[10px] shrink-0">
          <span>{isUiEn ? `Chars: ${charCount}` : `字符: ${charCount}`}</span>
          <span>•</span>
          <span>{isUiEn ? `Lines: ${lineCount}` : `行数: ${lineCount}`}</span>
        </div>
      </div>
    </div>
  );
});

