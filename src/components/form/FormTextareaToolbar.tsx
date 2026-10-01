import React from 'react';
import { Heading1, Heading2, Bold, Italic, List, ListOrdered, Link, Table, Type, Scissors } from 'lucide-react';
import { formatChineseEnglishSpacing } from '../../lib/format-utils';
import { Tooltip } from '../ui/Tooltip';

interface FormTextareaToolbarProps {
  textareaId: string;
  value: string;
  onChange: (newValue: string) => void;
  lang?: string;
  contentLang?: string;
}

export function FormTextareaToolbar({ textareaId, value, onChange, lang = 'zh', contentLang = 'zh' }: FormTextareaToolbarProps) {
  const isEn = lang === 'en';
  const isContentEn = contentLang === 'en';
  const insertMarkdown = (syntax: string) => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
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

    onChange(before + replacement + after);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  return (
    <div className="flex items-center flex-wrap gap-1 px-3 py-1.5 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-750 rounded-t-lg select-none">
      <Tooltip content={isEn ? "Heading 1" : "一级标题"} shortcut="# text" side="bottom">
        <button
          type="button"
          onClick={() => insertMarkdown('# text')}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded transition-colors text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content={isEn ? "Heading 2" : "二级标题"} shortcut="## text" side="bottom">
        <button
          type="button"
          onClick={() => insertMarkdown('## text')}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded transition-colors text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-700 mx-1"></div>

      <Tooltip content={isEn ? "Bold" : "加粗"} shortcut="**text**" side="bottom">
        <button
          type="button"
          onClick={() => insertMarkdown('**text**')}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content={isEn ? "Italic" : "斜体"} shortcut="*text*" side="bottom">
        <button
          type="button"
          onClick={() => insertMarkdown('*text*')}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-700 mx-1"></div>

      <Tooltip content={isEn ? "Bullet List" : "无序列表"} shortcut="- text" side="bottom">
        <button
          type="button"
          onClick={() => {
            const currentTextarea = document.getElementById(textareaId) as HTMLTextAreaElement;
            const startsWithNewLine = !currentTextarea || currentTextarea.selectionStart === 0 || currentTextarea.value[currentTextarea.selectionStart - 1] === '\n';
            insertMarkdown(startsWithNewLine ? '- text' : '\n- text');
          }}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
        >
          <List className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content={isEn ? "Numbered List" : "有序列表"} shortcut="1. text" side="bottom">
        <button
          type="button"
          onClick={() => {
            const currentTextarea = document.getElementById(textareaId) as HTMLTextAreaElement;
            const startsWithNewLine = !currentTextarea || currentTextarea.selectionStart === 0 || currentTextarea.value[currentTextarea.selectionStart - 1] === '\n';
            insertMarkdown(startsWithNewLine ? '1. text' : '\n1. text');
          }}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content={isEn ? "Link" : "插入链接"} shortcut="[text](url)" side="bottom">
        <button
          type="button"
          onClick={() => insertMarkdown('[text](url)')}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
        >
          <Link className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content={isEn ? "Table" : "插入表格"} side="bottom">
        <button
          type="button"
          onClick={() => {
            const tableSyntax = isContentEn 
              ? '\n| Header 1 | Header 2 |\n| -------- | -------- |\n| Content 1 | Content 2 |\n' 
              : '\n| 表头1 | 表头2 |\n| ----- | ----- |\n| 内容1 | 内容2 |\n';
            insertMarkdown(tableSyntax);
          }}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
        >
          <Table className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content={isEn ? "Page Break" : "强制分页符"} shortcut="<!-- pagebreak -->" side="bottom">
        <button
          type="button"
          onClick={() => insertMarkdown('\n<!-- pagebreak -->\n')}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
        >
          <Scissors className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        </button>
      </Tooltip>

      <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-700 mx-1"></div>

      <Tooltip content={isEn ? "Format CJK/English spacing in this field" : "优化中英文与数字空格排版"} side="bottom">
        <button
          type="button"
          onClick={() => {
            const formatted = formatChineseEnglishSpacing(value);
            onChange(formatted);
          }}
          className="px-2 py-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 hover:text-indigo-800 dark:hover:text-indigo-200 text-indigo-600 dark:text-indigo-400 rounded transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-1"
        >
          <Type className="w-3 h-3" />
          <span>{isEn ? 'Spacing' : '中英排版'}</span>
        </button>
      </Tooltip>
    </div>
  );
}
