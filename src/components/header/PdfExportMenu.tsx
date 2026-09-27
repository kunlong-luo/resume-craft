import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, FileCode, FileDown, FileJson, FileText, Globe, Loader2, Printer } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { getMarketProfile } from '../../lib/market-profile';
import { getPaperSpec } from '../../lib/paper';
import {
  exportToJsonResume,
  generateCleanAtsPlainText,
  getMarketDefaultFileName,
} from '../../lib/export-utils';

interface PdfExportMenuProps {
  isEn: boolean;
  isExporting: boolean;
  progress?: string | null;
  onExportAts: () => void;
  onExportQuick?: () => void;
  compact?: boolean;
}

export function PdfExportMenu({
  isEn,
  isExporting,
  progress,
  onExportAts,
  onExportQuick,
  compact = false,
}: PdfExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileNameId = useId();
  const { markdown, settings, customFileName, setCustomFileName } = useResumeStore();

  const market = settings.marketRegion || 'cn';
  const marketProfile = getMarketProfile(market);
  const paperSpec = getPaperSpec(settings.paperSize || marketProfile.defaultPaper);

  const defaultFileName = getMarketDefaultFileName({
    markdown,
    settings,
    customFileName: '',
  });

  useEffect(() => {
    const openPdfMenu = () => setIsOpen(true);
    window.addEventListener('resume-craft:open-pdf-menu', openPdfMenu);
    return () => {
      window.removeEventListener('resume-craft:open-pdf-menu', openPdfMenu);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        rootRef.current?.querySelector<HTMLElement>('button')?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const handleExportTxt = () => {
    setIsOpen(false);
    const text = generateCleanAtsPlainText(markdown, {
      marketRegion: settings.marketRegion,
      lang: settings.lang,
    });
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = getMarketDefaultFileName({
      markdown,
      settings,
      customFileName,
      extension: 'txt',
    });
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    setIsOpen(false);
    const jsonResume = exportToJsonResume(markdown, settings);
    const blob = new Blob([JSON.stringify(jsonResume, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = getMarketDefaultFileName({
      markdown,
      settings,
      customFileName,
      extension: 'json',
    });
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportMd = () => {
    setIsOpen(false);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = getMarketDefaultFileName({
      markdown,
      settings,
      customFileName,
      extension: 'md',
    });
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={rootRef} className="relative flex shrink-0">
      <button
        type="button"
        onClick={onExportAts}
        disabled={isExporting}
        className={`flex items-center gap-1.5 rounded-l-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:from-indigo-500 hover:to-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75 ${compact ? 'px-2.5' : ''}`}
      >
        {isExporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Printer className="h-3.5 w-3.5" />
        )}
        <span>
          {isExporting
            ? progress || (isEn ? 'Exporting…' : '生成中…')
            : compact
              ? 'PDF'
              : isEn
                ? 'Download'
                : '下载'}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        disabled={isExporting}
        aria-label={isEn ? 'Choose export format' : '选择导出格式'}
        aria-expanded={isOpen}
        className="flex items-center justify-center rounded-r-xl border-l border-white/20 bg-blue-600 px-2 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-75"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-[100] mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          {/* Target market & paper badge */}
          <div className="mb-2 flex items-center justify-between rounded-xl bg-indigo-50/70 px-2.5 py-1.5 dark:bg-indigo-950/40">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
              <Globe className="h-3.5 w-3.5 text-indigo-500" />
              {marketProfile.flag} {marketProfile.name}
            </span>
            <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 shadow-xs dark:bg-slate-800 dark:text-slate-300">
              {paperSpec.nameZh} ({paperSpec.widthMm}×{paperSpec.heightMm}mm)
            </span>
          </div>

          {/* Filename customization */}
          <div className="mb-2 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/70">
            <div className="flex items-center justify-between">
              <label htmlFor={fileNameId} className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                {isEn ? 'Export File Name' : '导出文件名'}
              </label>
              {customFileName && (
                <button
                  type="button"
                  onClick={() => setCustomFileName('')}
                  className="text-[10px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {isEn ? 'Reset default' : '恢复默认'}
                </button>
              )}
            </div>
            <div className="mt-1.5 flex items-center rounded-lg border border-slate-200 bg-white px-2.5 dark:border-slate-700 dark:bg-slate-900">
              <input
                id={fileNameId}
                type="text"
                value={customFileName}
                onChange={(event) => setCustomFileName(event.target.value)}
                placeholder={defaultFileName}
                className="min-w-0 flex-1 bg-transparent py-1.5 text-xs font-medium text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Export options */}
          <div className="space-y-1">
            <button
              type="button"
              aria-label="ATS PDF"
              onClick={() => {
                setIsOpen(false);
                onExportAts();
              }}
              className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left transition hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
            >
              <Printer className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {isEn ? 'ATS PDF (Print / Save as PDF)' : 'ATS 矢量 PDF (浏览器打印)'}
                  </span>
                  <span className="rounded bg-emerald-100 px-1 py-0.2 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {isEn ? 'Recommended' : '首选推荐'}
                  </span>
                </div>
                <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {isEn
                    ? 'Preserves selectable vector text and precise page size for ATS parsers.'
                    : '保留可搜索可复制的矢量文本，精确匹配目标国纸张。'}
                </span>
              </div>
            </button>

            {onExportQuick && (
              <button
                type="button"
                aria-label={isEn ? 'Quick PDF' : '快速 PDF'}
                onClick={() => {
                  setIsOpen(false);
                  onExportQuick();
                }}
                className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <FileDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                    {isEn ? 'Quick PDF (Direct raster)' : '快速直接 PDF (光栅下载)'}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {isEn
                      ? 'Fast direct visual download with smart text-split prevention.'
                      : '一键免弹窗光栅下载，智能防截断文字。'}
                  </span>
                </div>
              </button>
            )}

            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

            {/* ATS Plain Text */}
            <button
              type="button"
              onClick={handleExportTxt}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <FileText className="h-4 w-4 shrink-0 text-amber-500" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {isEn ? 'ATS Clean Plain Text (.txt)' : 'ATS 纯文本格式 (.txt)'}
                  </span>
                </div>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                  {isEn ? 'Optimized for online job board text fields' : '专为网申系统与文本输入框优化'}
                </span>
              </div>
            </button>

            {/* Standard JSON Resume */}
            <button
              type="button"
              onClick={handleExportJson}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <FileJson className="h-4 w-4 shrink-0 text-emerald-500" />
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                  {isEn ? 'Standard JSON Resume (.json)' : '标准 JSON Resume (.json)'}
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                  {isEn ? 'Schema.jsonresume.org compliant data' : '国际标准结构化简历数据格式'}
                </span>
              </div>
            </button>

            {/* Markdown */}
            <button
              type="button"
              onClick={handleExportMd}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <FileCode className="h-4 w-4 shrink-0 text-slate-500" />
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                  {isEn ? 'Markdown Source (.md)' : 'Markdown 源码 (.md)'}
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                  {isEn ? 'Portable markdown format' : '便于版本控制与跨平台编辑'}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

