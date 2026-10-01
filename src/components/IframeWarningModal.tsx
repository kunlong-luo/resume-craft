import React, { useRef } from 'react';
import { X, ExternalLink, FileDown, AlertCircle, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useResumeStore } from '../store/useResumeStore';
import { exportDirectPDF } from '../lib/pdf-export';
import { trackAnalyticsEvent } from '../lib/analytics';
import { useDialogFocus } from '../hooks/useDialogFocus';

export function IframeWarningModal() {
  const {
    isIframeModalOpen: isOpen,
    setIsIframeModalOpen,
    setIsExportingPDF,
    setPdfExportProgress,
    uiLanguage,
    customFileName,
    markdown
  } = useResumeStore();

  const isEn = uiLanguage === 'en';
  const onClose = () => setIsIframeModalOpen(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus({ isOpen, dialogRef, onClose });

  const getExportTitle = () => {
    if (customFileName.trim()) {
      return customFileName.trim().replace(/[\\\/:*?"<>|]/g, '-');
    }
    const firstLine = markdown.trim().split('\n')[0];
    if (firstLine && firstLine.startsWith('# ')) {
      const parsedName = firstLine.replace('# ', '').trim();
      if (parsedName) {
        return parsedName.replace(/[\\\/:*?"<>|]/g, '-');
      }
    }
    return isEn ? 'resume' : '简历';
  };

  const onOpenNewTab = () => {
    window.open(window.location.href, '_blank');
    setIsIframeModalOpen(false);
  };

  const onDirectDownload = async () => {
    setIsIframeModalOpen(false);
    setIsExportingPDF(true);
    setPdfExportProgress(isEn ? 'Preparing PDF...' : '准备导出 PDF...');

    try {
      const target = document.getElementById('resume-print-content');
      if (target) {
        await exportDirectPDF(target, {
          filename: `${getExportTitle()}_${isEn ? 'resume' : '简历'}.pdf`,
          onProgress: (status) => setPdfExportProgress(status)
        });
        trackAnalyticsEvent('pdf_export_success');
      }
    } catch (e) {
      console.error('Direct download error from modal:', e);
    } finally {
      setIsExportingPDF(false);
      setPdfExportProgress(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-[3px] cursor-pointer"
          />

          {/* Modal Content */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="iframe-warning-title"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 flex flex-col transition-colors"
          >
            {/* Accent colored top bar */}
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <AlertCircle className="w-5 h-5 text-amber-500 animate-bounce" />
                <h3 id="iframe-warning-title" className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  {isEn ? 'ATS PDF Export Guide' : 'ATS PDF 导出说明'}
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label={isEn ? 'Close ATS PDF guide dialog' : '关闭 ATS PDF 导出说明弹窗'}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-xl p-4 text-xs text-amber-800 dark:text-amber-200 leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1">
                  ⚠️ {isEn ? 'Why does ATS PDF open a print flow?' : '为什么 ATS PDF 会打开打印流程？'}
                </p>
                <p className="text-justify">
                  {isEn ? (
                    <>
                      You are currently in the <strong>AI Studio sandbox iframe preview</strong>. The recommended ATS PDF path uses the browser print engine so text can remain searchable/selectable where the browser supports it. Sandboxed iframes may block that print flow.
                    </>
                  ) : (
                    <>
                      当前处于 <strong>iframe 预览沙箱环境</strong> 中。推荐的 ATS PDF 会使用浏览器打印引擎，以尽量保留可搜索、可选择的文本；沙箱 iframe 可能会拦截这条打印流程。
                    </>
                  )}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {isEn ? '💡 Simple Solution (Only 2 steps):' : '💡 解决方法：'}
                </p>
                
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="leading-relaxed">
                      {isEn ? (
                        <>
                          Click the <strong className="text-blue-600 dark:text-blue-400">"Open in New Tab"</strong> button below, or click the <strong>"Open in New Window ↗"</strong> icon in the top right corner of the preview area.
                        </>
                      ) : (
                        <>
                          点击下方 <strong className="text-blue-600 dark:text-blue-400">“在新标签页中打开”</strong> 按钮，或者点击 AI Studio 预览区右上角的 <strong>“新窗口打开 ↗”</strong> 按钮。
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="leading-relaxed">
                      {isEn ? (
                        <>
                          On the newly opened standalone page, click <strong className="text-slate-800 dark:text-slate-100">"ATS PDF"</strong>, then select <strong>"Save as PDF"</strong> in the browser print panel.
                        </>
                      ) : (
                        <>
                          在新页面中点击 <strong className="text-slate-800 dark:text-slate-100">“ATS PDF”</strong>，然后在浏览器打印预览面板中选择 <strong>「另存为 PDF」</strong>。
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Graphic/Visual Aid */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-750 rounded-xl p-3.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Printer className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>
                    {isEn ? 'Recommended for searchable text and ATS submission' : '推荐用于保留可搜索文本与 ATS 投递'}
                  </span>
                </div>
                <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  {isEn ? 'Watermark-free' : '无水印'}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center"
              >
                {isEn ? 'Cancel' : '取消'}
              </button>
              <button
                onClick={onDirectDownload}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>{isEn ? 'Quick PDF (image-based)' : '快速 PDF（图片型）'}</span>
              </button>
              <button
                onClick={onOpenNewTab}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 active:scale-[0.98] text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-slate-900/15 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isEn ? 'Open New Tab for ATS PDF' : '新标签页打开 ATS PDF'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
