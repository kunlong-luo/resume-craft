import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ArrowRight, Check, Clipboard, FileCode2, FileInput, FileText, Loader2, ScanText, ShieldCheck, Trash2, Upload, Wand2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { parseRawTextToResumeMarkdown, detectResumeMarket } from '../../lib/raw-text-importer';
import { detectResumeLanguage } from '../../lib/resume-language';
import {
  extractResumeTextFromPdf,
  MAX_PDF_FILE_SIZE,
  PdfImportError,
  type PdfExtractionResult,
} from '../../lib/pdf-import';
import { importFromJsonResume, adaptMarkdownToTargetMarket } from '../../lib/export-utils';
import { getMarketProfile } from '../../lib/market-profile';
import { useResumeStore } from '../../store/useResumeStore';
import { normalizeResumeBackup } from '../../lib/import-validation';

const MAX_TEXT_IMPORT_FILE_SIZE = 2 * 1024 * 1024;

interface RawTextImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (markdown: string, settingsPatch?: Partial<ReturnType<typeof useResumeStore.getState>['settings']>, templateId?: string) => void;
  lang?: string;
}

interface LoadedFileInfo {
  name: string;
  size: number;
  lines: number;
  content: string;
  type: 'md' | 'txt' | 'json' | 'pdf';
  pdf?: PdfExtractionResult;
  detectedMarket?: string;
  detectedSettings?: Partial<ReturnType<typeof useResumeStore.getState>['settings']>;
  detectedTemplateId?: string;
  isFullBackup?: boolean;
}

export function RawTextImportModal({ isOpen, onClose, onImport, lang = 'zh' }: RawTextImportModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('file');
  const [rawText, setRawText] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<LoadedFileInfo | null>(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [fileError, setFileError] = useState('');
  const [autoAdaptToMarket, setAutoAdaptToMarket] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const isEn = lang === 'en';

  const { settings } = useResumeStore();
  const currentMarket = settings.marketRegion || 'cn';
  const adaptationMarket =
    activeTab === 'file' && selectedFile?.detectedSettings?.marketRegion
      ? selectedFile.detectedSettings.marketRegion
      : currentMarket;
  const adaptationLang =
    activeTab === 'file' && selectedFile?.detectedSettings?.lang
      ? selectedFile.detectedSettings.lang
      : settings.lang;
  const currentMarketProfile = getMarketProfile(adaptationMarket);

  // Keep keyboard focus inside the modal and restore it to the trigger on close.
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const firstFocusable = dialog?.querySelector<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('hidden'));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  // Reset states when opening/closing
  useEffect(() => {
    if (isOpen) {
      setIsDragging(false);
      setFileError('');
    } else {
      setSelectedFile(null);
      setRawText('');
      setIsParsingPdf(false);
      setFileError('');
    }
  }, [isOpen]);

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setRawText(text);
          setCopiedSuccess(true);
          setTimeout(() => setCopiedSuccess(false), 2000);
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  const processFileContent = (fileName: string, content: string) => {
    const normalizedFileName = fileName.toLowerCase();
    const lines = content.split('\n').length;
    const size = new Blob([content]).size;
    let type: 'md' | 'txt' | 'json' = 'md';
    let processedContent = content;
    let detectedMarketStr = '';
    let detectedSettings: LoadedFileInfo['detectedSettings'];
    let detectedTemplateId: string | undefined;
    let isFullBackup = false;

    if (normalizedFileName.endsWith('.json')) {
      type = 'json';
      try {
        const parsed: unknown = JSON.parse(content);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          setSelectedFile(null);
          setFileError(
            isEn
              ? 'This JSON file does not contain a supported resume format.'
              : '此 JSON 文件不包含受支持的简历格式。',
          );
          return;
        }

        const record = parsed as Record<string, unknown>;
        if (record.version === 'markdown-resume-backup-v1') {
          const backup = normalizeResumeBackup(parsed, settings);
          if (!backup) {
            setSelectedFile(null);
            setFileError(
              isEn
                ? 'This Resume Craft backup is invalid or unsupported.'
                : '此 Resume Craft 备份无效、已损坏或版本不受支持。',
            );
            return;
          }

          processedContent = backup.markdown;
          detectedSettings = backup.settings;
          detectedTemplateId = backup.templateId;
          detectedMarketStr = backup.settings.marketRegion || '';
          isFullBackup = true;
        } else if ('basics' in record || 'work' in record || 'skills' in record) {
          // Standard JSON Resume schema
          const jsonRes = importFromJsonResume(parsed);
          processedContent = jsonRes.markdown;
          detectedSettings = jsonRes.detectedSettings;
          if (jsonRes.detectedSettings?.marketRegion) {
            detectedMarketStr = jsonRes.detectedSettings.marketRegion;
          }
        } else if (typeof record.markdown === 'string' && record.markdown.trim()) {
          processedContent = record.markdown;
        } else if (typeof record.content === 'string' && record.content.trim()) {
          processedContent = record.content;
        } else {
          setSelectedFile(null);
          setFileError(
            isEn
              ? 'This JSON file does not contain a supported resume format.'
              : '此 JSON 文件不包含受支持的简历格式。',
          );
          return;
        }
      } catch (error) {
        console.warn('Failed to parse imported JSON resume', error);
        setSelectedFile(null);
        setFileError(
          isEn
            ? 'This JSON file is malformed and could not be parsed.'
            : '此 JSON 文件格式损坏，无法解析。',
        );
        return;
      }
    } else if (normalizedFileName.endsWith('.txt')) {
      type = 'txt';
      const detection = detectResumeMarket(content);
      detectedMarketStr = detection.detectedMarket;
    } else {
      const detection = detectResumeMarket(content);
      detectedMarketStr = detection.detectedMarket;
    }

    setSelectedFile({
      name: fileName,
      size,
      lines,
      content: processedContent,
      type,
      detectedMarket: detectedMarketStr,
      detectedSettings,
      detectedTemplateId,
      isFullBackup,
    });
  };

  const getPdfErrorMessage = (error: unknown) => {
    if (!(error instanceof PdfImportError)) {
      return isEn
        ? 'This PDF could not be parsed locally in your browser.'
        : '当前浏览器无法在本地解析这个 PDF。';
    }

    switch (error.code) {
      case 'too-large':
        return isEn
          ? `PDF must be smaller than ${Math.round(MAX_PDF_FILE_SIZE / 1024 / 1024)} MB.`
          : `PDF 文件需小于 ${Math.round(MAX_PDF_FILE_SIZE / 1024 / 1024)} MB。`;
      case 'encrypted':
        return isEn
          ? 'Password-protected PDFs are not supported yet.'
          : '暂不支持带密码保护的 PDF。';
      case 'no-text':
        return isEn
          ? 'No usable text layer was found. This may be a scanned/image-only PDF.'
          : '没有检测到可用文本层；这可能是一份扫描件或纯图片 PDF。';
      case 'invalid-pdf':
        return isEn
          ? 'The selected file is not a valid PDF.'
          : '所选文件不是有效的 PDF。';
      default:
        return isEn
          ? 'The PDF could not be parsed locally. Try another export or paste the text instead.'
          : 'PDF 本地解析失败。可以尝试重新导出 PDF，或改用纯文本粘贴。';
    }
  };

  const handleFileDropOrSelect = async (file: File) => {
    if (!file) return;

    setFileError('');
    const fileName = file.name.toLowerCase();
    const isPdf = fileName.endsWith('.pdf') || file.type === 'application/pdf';

    if (!isPdf && file.size > MAX_TEXT_IMPORT_FILE_SIZE) {
      setSelectedFile(null);
      setFileError(
        isEn
          ? `Text/JSON resume files must be smaller than ${Math.round(MAX_TEXT_IMPORT_FILE_SIZE / 1024 / 1024)} MB.`
          : `文本/JSON 简历文件需小于 ${Math.round(MAX_TEXT_IMPORT_FILE_SIZE / 1024 / 1024)} MB。`,
      );
      return;
    }

    if (isPdf) {
      setSelectedFile(null);
      setIsParsingPdf(true);
      try {
        const result = await extractResumeTextFromPdf(file);
        const marketDetect = detectResumeMarket(result.text);
        setSelectedFile({
          name: file.name,
          size: file.size,
          lines: result.text.split('\n').length,
          content: result.text,
          type: 'pdf',
          pdf: result,
          detectedMarket: marketDetect.detectedMarket,
        });
      } catch (error) {
        setFileError(getPdfErrorMessage(error));
      } finally {
        setIsParsingPdf(false);
      }
      return;
    }

    try {
      const content = await file.text();
      processFileContent(file.name, content);
    } catch {
      setFileError(
        isEn
          ? 'The selected file could not be read.'
          : '无法读取所选文件。',
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const isPdf =
        file.name.toLowerCase().endsWith('.pdf') ||
        file.type === 'application/pdf';

      if (activeTab === 'text' && !isPdf) {
        setFileError('');
        if (file.size > MAX_TEXT_IMPORT_FILE_SIZE) {
          setFileError(
            isEn
              ? `Text resume files must be smaller than ${Math.round(MAX_TEXT_IMPORT_FILE_SIZE / 1024 / 1024)} MB.`
              : `文本简历文件需小于 ${Math.round(MAX_TEXT_IMPORT_FILE_SIZE / 1024 / 1024)} MB。`,
          );
          return;
        }
        void file.text().then((content) => {
          if (content) setRawText(content);
        }).catch(() => {
          setFileError(isEn ? 'The selected file could not be read.' : '无法读取所选文件。');
        });
        return;
      }

      void handleFileDropOrSelect(file);
    }
  };

  const handleExecuteTextImport = () => {
    if (!rawText.trim()) return;
    const sourceLang = detectResumeLanguage(rawText, settings.lang || 'zh');
    let generatedMarkdown = parseRawTextToResumeMarkdown(rawText, sourceLang);
    if (autoAdaptToMarket) {
      const adapted = adaptMarkdownToTargetMarket(
        generatedMarkdown,
        currentMarket,
        settings.lang
      );
      generatedMarkdown = adapted.adaptedMarkdown;
    }
    const detectedLang = detectResumeLanguage(generatedMarkdown, settings.lang || 'zh');
    onImport(generatedMarkdown, { lang: detectedLang });
    setRawText('');
    onClose();
  };

  const handleExecuteFileImport = () => {
    if (!selectedFile) return;
    let finalMd = '';
    if (selectedFile.type === 'txt' || selectedFile.type === 'pdf') {
      const sourceLang = detectResumeLanguage(
        selectedFile.content,
        settings.lang || 'zh',
      );
      finalMd = parseRawTextToResumeMarkdown(selectedFile.content, sourceLang);
    } else {
      finalMd = selectedFile.content;
    }

    if (autoAdaptToMarket && !selectedFile.isFullBackup) {
      const adapted = adaptMarkdownToTargetMarket(
        finalMd,
        adaptationMarket,
        adaptationLang
      );
      finalMd = adapted.adaptedMarkdown;
    }

    const detectedLang =
      selectedFile.detectedSettings?.lang ??
      detectResumeLanguage(finalMd, settings.lang || 'zh');
    onImport(
      finalMd,
      {
        ...selectedFile.detectedSettings,
        lang: detectedLang,
      },
      selectedFile.detectedTemplateId,
    );
    setSelectedFile(null);
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="raw-import-title"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 420 }}
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col my-auto z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Global Dragging Indicator Overlay */}
            {isDragging && (
              <div className="absolute inset-0 z-50 bg-indigo-600/90 dark:bg-indigo-950/95 backdrop-blur-xs flex flex-col items-center justify-center text-white border-2 border-dashed border-white/60 m-2 rounded-xl animate-in fade-in duration-150">
                <Upload className="w-12 h-12 mb-2 animate-bounce" />
                <p className="text-base font-bold tracking-wide">
                  {isEn ? 'Drop file to import' : '释放鼠标即可立即解析文件'}
                </p>
                <p className="text-xs text-indigo-200 mt-1">
                  {isEn ? 'Supports .pdf, .md, .txt, .json' : '支持 .pdf、.md、.txt、.json 格式'}
                </p>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <FileInput className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 id="raw-import-title" className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>{isEn ? 'Import Resume' : '导入简历'}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/80">
                      {isEn ? 'Auto Parse' : '智能解析'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                    {isEn ? 'Import PDF/files locally or paste raw text' : '支持本地解析 PDF / 文件，或粘贴任意旧简历文本'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label={isEn ? 'Close import dialog' : '关闭导入弹窗'}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title={isEn ? 'Close (Esc)' : '关闭 (Esc)'}
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Clean Segmented Tab Switcher */}
            <div className="p-3 bg-slate-50/40 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <div className="flex p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-xl max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'file'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isEn ? 'File Drop / Upload' : '文件拖拽 / 上传'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'text'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <ScanText className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Smart Paste Text' : '纯文本智能提取'}</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {activeTab === 'file' ? (
                <div>
                  {isParsingPdf ? (
                    <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/30 p-8 text-center">
                      <Loader2 className="w-8 h-8 mx-auto animate-spin text-indigo-600 dark:text-indigo-400" />
                      <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">
                        {isEn ? 'Reading PDF text locally…' : '正在本地读取 PDF 文本…'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {isEn
                          ? 'Nothing is uploaded. Large PDFs may take a little longer.'
                          : '文件不会上传；页数较多的 PDF 解析会稍慢。'}
                      </p>
                    </div>
                  ) : !selectedFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 group"
                    >
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3.5 shadow-sm group-hover:scale-105 transition-transform">
                        <Upload className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
                        {isEn ? 'Click to browse or drop file here' : '点击选择文件 或 直接拖拽到此处'}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-400 mb-4 max-w-xs mx-auto">
                        {isEn ? 'Supports PDF, Markdown, Plain Text, or JSON — processed locally' : '支持 PDF、Markdown、纯文本或 JSON；文件均在浏览器本地处理'}
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-600/20 transition-all">
                        <FileCode2 className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Select File' : '选择本地文件'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-750 p-4.5 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs">
                                {selectedFile.name}
                              </p>
                              {selectedFile.detectedMarket && (
                                <span className="rounded-full bg-indigo-100/80 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                  {isEn ? getMarketProfile(selectedFile.detectedMarket as any).labelEn : getMarketProfile(selectedFile.detectedMarket as any).labelZh}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.lines} {isEn ? 'lines' : '行内容'}
                              {selectedFile.type === 'pdf' && selectedFile.pdf
                                ? ` · ${selectedFile.pdf.pageCount} ${isEn ? 'pages' : '页'}`
                                : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                          title={isEn ? 'Remove file' : '移除重新选择'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {selectedFile.type === 'pdf' && selectedFile.pdf && (
                        <div
                          role="status"
                          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {selectedFile.pdf.parseability.level === 'good' ? (
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              )}
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                {isEn ? 'PDF machine-readability' : 'PDF 机器可读性'}
                              </span>
                            </div>
                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                              {selectedFile.pdf.parseability.score}/100
                            </span>
                          </div>

                          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                            {isEn
                              ? 'This checks text extractability as an ATS proxy; it does not guarantee how a specific ATS will score the resume.'
                              : '这里检查的是文本能否被机器稳定提取，只作为 ATS 可读性的参考，不代表任何具体 ATS 的最终评分。'}
                          </p>

                          <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center">
                            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 px-2 py-1.5">
                              <div className="text-[9px] text-slate-400">{isEn ? 'Email' : '邮箱'}</div>
                              <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                                {selectedFile.pdf.parseability.emailFound ? (isEn ? 'Found' : '已识别') : (isEn ? 'Review' : '需检查')}
                              </div>
                            </div>
                            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 px-2 py-1.5">
                              <div className="text-[9px] text-slate-400">{isEn ? 'Phone' : '电话'}</div>
                              <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                                {selectedFile.pdf.parseability.phoneFound ? (isEn ? 'Found' : '已识别') : (isEn ? 'Review' : '需检查')}
                              </div>
                            </div>
                            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 px-2 py-1.5">
                              <div className="text-[9px] text-slate-400">{isEn ? 'Sections' : '章节'}</div>
                              <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                                {selectedFile.pdf.parseability.sectionHeadings.length}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Content Preview */}
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800 font-mono text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 max-h-32 overflow-hidden relative">
                        <pre className="truncate whitespace-pre-wrap line-clamp-4">
                          {selectedFile.content.slice(0, 300)}...
                        </pre>
                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pointer-events-none" />
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.md,.markdown,.txt,.json,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleFileDropOrSelect(file);
                      e.currentTarget.value = '';
                    }}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isEn ? 'Paste your raw resume text:' : '粘贴任意格式简历文本：'}
                    </span>
                    <div className="flex items-center gap-2">
                      {rawText.trim() && (
                        <button
                          type="button"
                          onClick={() => setRawText('')}
                          className="text-[11px] text-slate-400 hover:text-rose-500 font-medium cursor-pointer transition-colors"
                        >
                          {isEn ? 'Clear' : '清空'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handlePasteFromClipboard}
                        className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 px-2 py-1 rounded-lg border border-indigo-200/80 dark:border-indigo-800/80 transition-colors cursor-pointer"
                      >
                        {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
                        <span>{copiedSuccess ? (isEn ? 'Pasted!' : '已粘贴') : (isEn ? 'Paste Clipboard' : '粘贴剪贴板')}</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    rows={8}
                    placeholder={
                      isEn
                        ? `Paste any text here (e.g. from LinkedIn, PDF, Word or email):\n\nJohn Doe\n138 0000 0000 | john@example.com | San Francisco\nSenior Frontend Engineer\n\nExperience\nGoogle | Tech Lead | 2021.03 - Present\n- Led architecture redesign of core cloud dashboard`
                        : `在此直接粘贴任意旧简历文本（招聘网/Word/PDF/微信复制等）：\n\n张三\n138 0000 0000 ｜ zhangsan@example.com ｜ 杭州\n资深全栈工程师\n\n工作经历\n阿里巴巴 ｜ 资深技术专家 ｜ 2021.06 - 至今\n- 主导下一代大模型应用平台架构落地`
                    }
                    className="w-full p-3.5 text-xs font-mono leading-relaxed bg-slate-50/60 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-750 rounded-xl text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 placeholder:font-sans"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{isEn ? 'Auto-identifies name, contacts, roles and experiences' : '智能识别姓名、联系方式、经历与技能标签'}</span>
                    <span>{rawText.length} {isEn ? 'chars' : '字'}</span>
                  </div>
                </div>
              )}
            </div>

            {fileError && (
              <div role="alert" className="mx-5 mb-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
                {fileError}
              </div>
            )}

            {/* Market Adaptation Option */}
            {selectedFile?.isFullBackup ? (
              <div className="mx-5 mb-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 dark:border-emerald-900/70 dark:bg-emerald-950/30">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="block text-xs font-bold text-emerald-800 dark:text-emerald-200">
                      {isEn ? 'Full Resume Craft backup detected' : '已识别 Resume Craft 完整备份'}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-relaxed text-emerald-700/80 dark:text-emerald-300/80">
                      {isEn
                        ? 'Content, resume settings, and template association will be restored exactly without market adaptation.'
                        : '将原样恢复简历内容、简历设置与模板关联，不再执行目标市场二次适配。'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-5 mb-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-2.5 dark:border-indigo-950/60 dark:bg-indigo-950/30">
                <label className="flex items-center justify-between gap-2 cursor-pointer select-none">
                  <div className="flex items-center gap-2 min-w-0">
                    <Wand2 className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isEn
                          ? `Auto-adapt to ${currentMarketProfile.labelEn} Standards`
                          : `自动规范化适配当前目标市场 (${currentMarketProfile.labelZh})`}
                      </span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {isEn
                          ? `Standardizes dates (${currentMarketProfile.dateStyle}), section titles, and EEO sanitization`
                          : `自动将日期转为目标国规范 (${currentMarketProfile.dateStyle}) 并进行招聘合规优化`}
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoAdaptToMarket}
                    onChange={(e) => setAutoAdaptToMarket(e.target.checked)}
                    className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500/20 dark:border-slate-700"
                  />
                </label>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {isEn ? 'ESC to cancel' : '按 ESC 键取消'}
              </span>
              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  {isEn ? 'Cancel' : '取消'}
                </button>
                {activeTab === 'file' ? (
                  <button
                    type="button"
                    onClick={handleExecuteFileImport}
                    disabled={!selectedFile || isParsingPdf}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-indigo-600/20 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span>{isEn ? 'Import This File' : '确认导入'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleExecuteTextImport}
                    disabled={!rawText.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-indigo-600/20 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Parse & Apply' : '一键提取并导入'}</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
