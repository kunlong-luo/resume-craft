import React, { useRef, useMemo, useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { Editor } from './components/Editor';
import { Preview } from './components/preview/Preview';
import { Header } from './components/layout/Header';
import { Toolbar } from './components/layout/Toolbar';
import { useResumeStore } from './store/useResumeStore';
import { useResumeActions } from './hooks/useResumeActions';
import { getSharePayloadFromLocation, parseSharePayload } from './lib/share-utils';
import { useToast } from './components/ui/Toast';
import { smartAutoFit } from './lib/preview-utils';
import { Edit3, Eye, Printer } from 'lucide-react';
import { Tooltip } from './components/ui/Tooltip';
import { markSupportPrompt, shouldPromptForSupport } from './lib/support-prompt';
import { trackAnalyticsEvent } from './lib/analytics';
import { storage, STORAGE_HEALTH_EVENT, STORAGE_KEYS, type StorageHealthDetail } from './lib/storage';
import { resumeRepository } from './lib/resume-repository';

// Performance optimization: Lazy load heavy secondary modals and non-critical tools
const ResumeChecker = lazy(() => import('./components/resume-checker/ResumeChecker').then(m => ({ default: m.ResumeChecker })));
const IframeWarningModal = lazy(() => import('./components/IframeWarningModal').then(m => ({ default: m.IframeWarningModal })));
const BackupDraftModal = lazy(() => import('./components/backup/BackupDraftModal').then(m => ({ default: m.BackupDraftModal })));
const HelpLegalModal = lazy(() => import('./components/layout/HelpLegalModal').then(m => ({ default: m.HelpLegalModal })));
const SharedResumePage = lazy(() => import('./components/share/SharedResumePage').then(m => ({ default: m.SharedResumePage })));
const SupportProjectModal = lazy(() => import('./components/modals/SupportProjectModal').then(m => ({ default: m.SupportProjectModal })));
const OnboardingTour = lazy(() => import('./components/onboarding/OnboardingTour').then(m => ({ default: m.OnboardingTour })));

export default function App() {
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const sharePayload = useMemo(() => {
    try {
      const sharePayload = getSharePayloadFromLocation(
        window.location.search,
        window.location.hash,
      );
      if (sharePayload) {
        return parseSharePayload(sharePayload);
      }
    } catch (e) {
      console.error('Failed to parse share payload', e);
    }
    return null;
  }, []);

  if (sharePayload) {
    return (
      <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white font-bold">Loading...</div>}>
        <SharedResumePage sharePayload={sharePayload} />
      </Suspense>
    );
  }

  const {
    markdown,
    settings,
    profiles,
    setLastSaved,
    isHelpLegalOpen,
    setIsHelpLegalOpen,
    setStorageHealth
  } = useResumeStore();

  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const pendingExportActionRef = useRef<(() => void | Promise<void>) | null>(null);
  const [isSupportProjectOpen, setIsSupportProjectOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    return (
      storage.getString(STORAGE_KEYS.ONBOARDING_FIRST_VISIT) === '1' &&
      storage.getString(STORAGE_KEYS.ONBOARDING_COMPLETE) !== '1'
    );
  });

  useEffect(() => {
    const startOnboarding = () => setIsOnboardingOpen(true);
    window.addEventListener('resume-craft:start-onboarding', startOnboarding);
    return () => window.removeEventListener('resume-craft:start-onboarding', startOnboarding);
  }, []);


  const initialMarkdownRef = useRef(markdown);
  const hasTrackedEditingRef = useRef(false);

  useEffect(() => {
    if (hasTrackedEditingRef.current) return;
    if (markdown === initialMarkdownRef.current) return;

    hasTrackedEditingRef.current = true;
    trackAnalyticsEvent('editing_started');
  }, [markdown]);


  // Resizable split ratio (percentage for editor width)
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    try {
      const saved = storage.getString('resume-split-ratio');
      if (saved) {
        const parsed = parseFloat(saved);
        if (parsed >= 25 && parsed <= 75) return parsed;
      }
    } catch (e) {}
    return 50;
  });

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleTouchStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    let rafId: number | null = null;

    const handleMove = (clientX: number) => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const newRatio = ((clientX - rect.left) / rect.width) * 100;
        // Clamp between 28% and 72%
        const clamped = Math.min(Math.max(newRatio, 28), 72);
        // Snap to exact 50% when close
        const finalRatio = Math.abs(clamped - 50) < 1.5 ? 50 : clamped;
        setSplitRatio(finalRatio);
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      setIsDragging(false);
      storage.set('resume-split-ratio', String(splitRatio));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleEnd);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, splitRatio]);

  const {
    handleExportPDF: exportPDFNow,
    handleExportDirectPDF: exportDirectPDFNow,
    handleExportVectorPrint: exportVectorPrintNow,
    handleExportMarkdown,
    handleImportMarkdown
  } = useResumeActions({
    contentRef
  });

  const runExportWithSupportPrompt = useCallback((action: () => void | Promise<void>) => {
    if (!shouldPromptForSupport()) {
      void action();
      return;
    }

    pendingExportActionRef.current = action;
    setIsSupportProjectOpen(true);
  }, []);

  const handleExportPDF = useCallback(() => {
    runExportWithSupportPrompt(exportPDFNow);
  }, [exportPDFNow, runExportWithSupportPrompt]);

  const handleExportDirectPDF = useCallback(() => {
    runExportWithSupportPrompt(exportDirectPDFNow);
  }, [exportDirectPDFNow, runExportWithSupportPrompt]);

  const handleExportVectorPrint = useCallback(() => {
    runExportWithSupportPrompt(exportVectorPrintNow);
  }, [exportVectorPrintNow, runExportWithSupportPrompt]);

  const continuePendingExport = useCallback(() => {
    const action = pendingExportActionRef.current;
    pendingExportActionRef.current = null;
    setIsSupportProjectOpen(false);

    if (action) {
      void action();
    }
  }, []);

  const handleSupportProject = useCallback(() => {
    markSupportPrompt('supported');
  }, []);

  const handleSkipSupport = useCallback(() => {
    markSupportPrompt('skip');
    continuePendingExport();
  }, [continuePendingExport]);

  const handleCloseSupportPrompt = useCallback(() => {
    pendingExportActionRef.current = null;
    setIsSupportProjectOpen(false);
  }, []);


  // Automated periodic autosave (every 3 minutes) through the IndexedDB repository.
  useEffect(() => {
    const interval = setInterval(() => {
      void (async () => {
        try {
          const currentDrafts = await resumeRepository.getDrafts();
          const hasDuplicate = currentDrafts.some((draft) => draft.markdown === markdown);
          if (hasDuplicate) return;

          const isEn = settings.lang === 'en';
          const newAutoDraft = {
            id: `draft_auto_${Date.now()}`,
            title: new Date().toLocaleTimeString(isEn ? 'en-US' : 'zh-CN', { hour12: false }),
            markdown,
            settings,
            timestamp: new Date().toLocaleString(isEn ? 'en-US' : 'zh-CN', { hour12: false }),
            isAutoSave: true,
          };

          const otherDrafts = currentDrafts.filter((draft) => !draft.isAutoSave);
          const autoDrafts = currentDrafts.filter((draft) => draft.isAutoSave);
          const updatedAutoDrafts = [newAutoDraft, ...autoDrafts].slice(0, 5);
          await resumeRepository.replaceDrafts([...updatedAutoDrafts, ...otherDrafts]);
        } catch (error) {
          console.error('[autosave] Failed to save draft to IndexedDB:', error);
        }
      })();
    }, 180000);

    return () => clearInterval(interval);
  }, [markdown, settings]);

  // Dark mode / Studio Dark synchronization
  useEffect(() => {
    const applyTheme = () => {
      const mode = settings.themeMode || 'light';
      let isDark = false;
      if (mode === 'dark') {
        isDark = true;
      } else if (mode === 'system') {
        isDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', isDark);
      }
    };

    applyTheme();

    if (settings.themeMode === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [settings.themeMode]);

  const { showToast } = useToast() || {};
  const { updateSetting } = useResumeStore();

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const sourceId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `tab_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const channel = new BroadcastChannel('resume-craft:tabs:v1');
    let warned = false;

    const warnAboutAnotherTab = () => {
      if (warned) return;
      warned = true;
      showToast?.({
        title: settings.lang === 'en' ? 'Resume Craft is open in another tab' : '检测到另一个 Resume Craft 标签页',
        message: settings.lang === 'en'
          ? 'Avoid editing the same resume in multiple tabs at once. Local writes are serialized, but the latest edit can still replace older state.'
          : '请避免在多个标签页同时编辑同一份简历。写入会串行处理，但较新的编辑仍可能覆盖较旧状态。',
        type: 'info',
        duration: 7000,
      });
    };

    channel.onmessage = (event) => {
      const message = event.data as { type?: string; sourceId?: string } | null;
      if (!message || message.sourceId === sourceId) return;

      if (message.type === 'hello') {
        warnAboutAnotherTab();
        channel.postMessage({ type: 'presence', sourceId });
      } else if (message.type === 'presence') {
        warnAboutAnotherTab();
      }
    };

    channel.postMessage({ type: 'hello', sourceId });
    return () => channel.close();
  }, [settings.lang, showToast]);

  useEffect(() => {
    const handleStorageHealth = (event: Event) => {
      const detail = (event as CustomEvent<StorageHealthDetail>).detail;
      if (!detail) return;

      if (detail.status === 'recovered') {
        setStorageHealth('ok');
        showToast?.({
          title: settings.lang === 'en' ? 'Local saving restored' : '本地保存已恢复',
          message: settings.lang === 'en'
            ? 'Resume changes can be saved to this browser again.'
            : '浏览器本地存储已恢复，可以继续自动保存简历修改。',
          type: 'success',
          duration: 3500,
        });
        return;
      }

      setStorageHealth('error', detail.quotaExceeded === true);
      showToast?.({
        title: settings.lang === 'en' ? 'Local save failed' : '本地保存失败',
        message: detail.quotaExceeded
          ? (settings.lang === 'en'
            ? 'Browser storage is full. Export a JSON backup before closing this page, then free storage space.'
            : '浏览器本地存储空间不足。关闭页面前请先导出 JSON 备份，再清理存储空间。')
          : (settings.lang === 'en'
            ? 'The browser rejected a local storage write. Export a JSON backup before closing this page.'
            : '浏览器拒绝写入本地存储。关闭页面前请先导出 JSON 备份。'),
        type: 'error',
        duration: 8000,
      });
    };

    window.addEventListener(STORAGE_HEALTH_EVENT, handleStorageHealth);
    return () => window.removeEventListener(STORAGE_HEALTH_EVENT, handleStorageHealth);
  }, [setStorageHealth, settings.lang, showToast]);

  // Global Keyboard Shortcuts (Cmd/Ctrl + S, Cmd/Ctrl + P, Cmd/Ctrl + Shift + F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + S -> Manual Save trigger Toast
      if (isCmdOrCtrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        void resumeRepository.saveSnapshot({
          markdown,
          profiles,
          jdText: useResumeStore.getState().jdText,
        }).then(() => {
          const now = new Date();
          const pad = (num: number) => String(num).padStart(2, '0');
          setLastSaved(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
          showToast?.({
            title: settings.lang === 'en' ? 'Resume saved locally' : '简历草稿已手动保存',
            message: settings.lang === 'en'
              ? 'The current resume content was saved to local browser storage.'
              : '核心简历数据已保存到浏览器本地。',
            type: 'success',
            duration: 2500,
          });
        }).catch((error) => {
          console.error('[manual-save] Failed to save resume to IndexedDB:', error);
          setStorageHealth('error');
          showToast?.({
            title: settings.lang === 'en' ? 'Local save failed' : '本地保存失败',
            message: settings.lang === 'en'
              ? 'The browser rejected the local save. Export a backup before closing this page.'
              : '浏览器拒绝本地保存。关闭页面前请先导出备份。',
            type: 'error',
            duration: 8000,
          });
        });
      }

      // Cmd/Ctrl + P -> Intercept default browser print and use the ATS-friendly PDF path
      if (isCmdOrCtrl && !e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handleExportVectorPrint();
      }

      // Cmd/Ctrl + Shift + F -> Auto Fit One Page
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        smartAutoFit(settings, updateSetting);
        trackAnalyticsEvent('auto_fit_used');
        showToast?.({
          title: '已触发一键贴合控页',
          message: '微调行高与边距以压缩适应单页',
          type: 'info',
          duration: 2500,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [markdown, profiles, settings, setLastSaved, setStorageHealth, showToast, handleExportVectorPrint, updateSetting]);

  return (
    <div className={`flex flex-col h-[100dvh] overflow-hidden bg-[#f8fafc] dark:bg-[#070a13] text-slate-900 dark:text-slate-100 relative transition-colors duration-200 ${isDragging ? 'select-none cursor-col-resize' : ''}`}>
      <div className="flex flex-col h-full w-full z-10 relative">
        <div className="relative z-50">
          <Header 
            handleImportMarkdown={handleImportMarkdown}
            handleExportMarkdown={handleExportMarkdown}
            handleExportPDF={handleExportPDF}
            handleExportDirectPDF={handleExportDirectPDF}
            handleExportVectorPrint={handleExportVectorPrint}
          />
          <Toolbar />
        </div>

        <main 
          ref={containerRef}
          className="flex-1 flex flex-col md:flex-row overflow-hidden relative pb-14 md:pb-0"
        >
          {/* Editor Pane */}
          {(!isMobile || mobileTab === 'editor') && (
            <section 
              id="editor-pane" 
              style={{
                width: !isMobile ? (settings.layoutMode === 'split' ? `${splitRatio}%` : settings.layoutMode === 'editor' ? '100%' : '0%') : '100%'
              }}
              className={`z-10 relative h-full ${
                isDragging ? 'transition-none' : 'transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
              } ${
                !isMobile && settings.layoutMode === 'preview' ? 'hidden' : 'w-full'
              } border-r border-slate-200/90 dark:border-slate-800`}
            >
              <Editor />
            </section>
          )}

          {/* Draggable Divider for Split Mode on Desktop */}
          {!isMobile && settings.layoutMode === 'split' && (
            <Tooltip
              content={settings.lang === 'en' ? 'Drag to resize (Double click to reset 50%)' : '拖拽调节左右宽度（双击复位 50%）'}
              side="top"
              delay={400}
              disabled={isDragging}
              wrapperClassName="hidden md:flex h-full items-center justify-center z-30"
            >
              <div 
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                className="flex items-center justify-center w-3 h-full -mx-1.5 cursor-col-resize group hover:w-3.5 transition-all select-none relative"
                onDoubleClick={() => setSplitRatio(50)}
              >
                <div className={`w-1 h-8 rounded-full transition-all duration-200 ${isDragging ? 'bg-indigo-600 scale-y-125' : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-400 dark:group-hover:bg-indigo-400 group-hover:scale-y-110'}`} />
                {isDragging && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 dark:bg-slate-800/95 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full shadow-lg border border-slate-700/80 whitespace-nowrap pointer-events-none animate-in fade-in duration-150 flex items-center gap-1 z-50">
                    <span>{Math.round(splitRatio)}%</span>
                    <span className="text-slate-400">:</span>
                    <span>{Math.round(100 - splitRatio)}%</span>
                  </div>
                )}
              </div>
            </Tooltip>
          )}

          {/* Preview Pane */}
          <section 
            style={{
              width: !isMobile ? (settings.layoutMode === 'split' ? `${100 - splitRatio}%` : settings.layoutMode === 'preview' ? '100%' : '0%') : '100%',
            }}
            className={`h-full ${
              isDragging ? 'transition-none' : 'transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
            } ${
              isMobile 
                ? (mobileTab === 'preview' ? 'w-full relative' : 'absolute -left-[9999px] top-0 w-[210mm] pointer-events-none opacity-0 select-none')
                : (settings.layoutMode === 'editor' ? 'absolute -left-[9999px] top-0 w-[210mm] pointer-events-none opacity-0 select-none' : 'relative')
            }`}
          >
            <Preview 
              ref={contentRef} 
            />
          </section>

          <Suspense fallback={null}>
            <ResumeChecker />
          </Suspense>
        </main>

        {/* Mobile Ergonomic Bottom Floating Dock */}
        {isMobile && (
          <div className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 dark:bg-slate-800/95 border border-slate-700/80 backdrop-blur-xl shadow-2xl rounded-full p-1.5 flex items-center gap-1.5 text-xs font-bold text-white animate-in fade-in slide-in-from-bottom-3 duration-200">
            <button
              onClick={() => setMobileTab('editor')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                mobileTab === 'editor' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{settings.lang === 'en' ? 'Edit' : '编辑 Markdown'}</span>
            </button>

            <button
              onClick={() => setMobileTab('preview')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                mobileTab === 'preview' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>
                {settings.paperSize === 'letter'
                  ? settings.lang === 'en'
                    ? 'Letter Preview'
                    : 'Letter 预览'
                  : settings.lang === 'en'
                    ? 'A4 Preview'
                    : 'A4 预览'}
              </span>
            </button>

            <div className="w-px h-4 bg-slate-700 mx-0.5" />

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ATS PDF</span>
            </button>
          </div>
        )}

        <Suspense fallback={null}>
          <IframeWarningModal />
          <BackupDraftModal />
          <HelpLegalModal isOpen={isHelpLegalOpen} onClose={() => setIsHelpLegalOpen(false)} />
          <SupportProjectModal
            isOpen={isSupportProjectOpen}
            lang={settings.lang}
            onClose={handleCloseSupportPrompt}
            onSupportClick={handleSupportProject}
            onContinue={continuePendingExport}
            onSkip={handleSkipSupport}
          />
          <OnboardingTour
            isOpen={isOnboardingOpen}
            onClose={() => setIsOnboardingOpen(false)}
          />

        </Suspense>
      </div>
    </div>
  );
}