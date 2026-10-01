import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, FilePlus2, FileText, MousePointer2, Sliders, Upload, X } from 'lucide-react';
import { BLANK_MARKDOWN, STARTER_MARKDOWN, STARTER_MARKDOWN_EN } from '../../data';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { useResumeStore } from '../../store/useResumeStore';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const steps = [
  { target: '#editor-pane' },
  { target: '#resume-main-toolbar' },
  { target: null },
] as const;

export function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const { settings, uiLanguage, applyTemplate, replaceDocument } = useResumeStore();
  const isEn = uiLanguage === 'en';
  const isResumeEn = settings.lang === 'en';
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [pendingReplacement, setPendingReplacement] = useState<'example' | 'starter' | 'blank' | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const copy = useMemo(
    () => [
      {
        title: isEn ? 'Step 1 · Edit your resume here' : '第一步 · 从这里编辑简历',
        body: isEn
          ? 'Start with the editor. You can use the form view or Markdown, and changes are saved locally as you work.'
          : '先从左侧编辑区开始。你可以使用表单模式或 Markdown，修改内容会自动保存在浏览器本地。',
      },
      {
        title: isEn ? 'Step 2 · Adjust layout and tools here' : '第二步 · 在这里调整排版与工具',
        body: isEn
          ? 'Use the toolbar for templates, one-click Auto Fit, Layout, Style, and view controls.'
          : '顶部工具栏集中为模板库、智能单页、排版、样式和视图控制。',
      },
      {
        title: isEn ? 'Step 3 · How would you like to start?' : '第三步 · 你想从哪里开始？',
        body: isEn
          ? 'Choose a full example, a guided starter, a completely blank resume, or import an existing one.'
          : '你可以选择完整示例、带基础结构的起始简历、完全空白简历，或者导入已有简历。',
      },
    ],
    [isEn],
  );

  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setPendingReplacement(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const updateTarget = () => {
      const selector = steps[step]?.target;
      if (!selector) {
        setTargetRect(null);
        return;
      }

      const element = document.querySelector(selector);
      if (!element) {
        setTargetRect(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      const padding = 8;
      setTargetRect({
        top: Math.max(8, rect.top - padding),
        left: Math.max(8, rect.left - padding),
        width: Math.min(window.innerWidth - 16, rect.width + padding * 2),
        height: Math.min(window.innerHeight - 16, rect.height + padding * 2),
      });
    };

    updateTarget();
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);
    return () => {
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
    };
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    const firstControl = panel?.querySelector<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    firstControl?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        storage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, '1');
        storage.remove(STORAGE_KEYS.ONBOARDING_FIRST_VISIT);
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !rootRef.current) return;

      const focusable = Array.from(
        rootRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, onClose]);

  if (!isOpen) return null;

  const complete = () => {
    storage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, '1');
    storage.remove(STORAGE_KEYS.ONBOARDING_FIRST_VISIT);
    onClose();
  };

  const isFirstRun =
    storage.getString(STORAGE_KEYS.ONBOARDING_FIRST_VISIT) === '1' &&
    storage.getString(STORAGE_KEYS.ONBOARDING_COMPLETE) !== '1';

  const applyExample = () => {
    applyTemplate(isResumeEn ? 'us_swe' : 'ai_backend');
    complete();
  };

  const applyStarter = () => {
    replaceDocument(
      isResumeEn ? STARTER_MARKDOWN_EN : STARTER_MARKDOWN,
      settings,
      'custom',
    );
    complete();
  };

  const applyBlank = () => {
    replaceDocument(BLANK_MARKDOWN, settings, 'custom');
    complete();
  };

  const loadExample = () => {
    if (isFirstRun) {
      applyExample();
      return;
    }
    setPendingReplacement('example');
  };

  const keepStarter = () => {
    if (isFirstRun) {
      applyStarter();
      return;
    }
    setPendingReplacement('starter');
  };

  const startBlank = () => {
    if (isFirstRun) {
      applyBlank();
      return;
    }
    setPendingReplacement('blank');
  };

  const applyPendingReplacement = () => {
    if (pendingReplacement === 'example') {
      applyExample();
    } else if (pendingReplacement === 'starter') {
      applyStarter();
    } else if (pendingReplacement === 'blank') {
      applyBlank();
    }
  };

  const importExisting = () => {
    complete();
    window.dispatchEvent(new CustomEvent('resume-craft:open-import'));
  };

  const current = copy[step] ?? copy[0]!;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[120000]"
      role="dialog"
      aria-modal="true"
      aria-label={isEn ? 'Getting started tour' : '新手引导'}
    >
      {(!targetRect || step === 2) && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px]" />
      )}

      {targetRect && step < 2 && (
        <div
          className="fixed rounded-2xl ring-4 ring-indigo-400 ring-offset-4 ring-offset-transparent shadow-[0_0_0_9999px_rgba(2,6,23,0.62)] pointer-events-none transition-all duration-200"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
        />
      )}

      <button
        type="button"
        onClick={complete}
        className="fixed top-4 right-4 z-10 flex items-center gap-1.5 rounded-xl border border-white/20 bg-slate-900/80 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
      >
        <X className="w-3.5 h-3.5" />
        {isFirstRun ? (isEn ? 'Skip tour' : '跳过引导') : (isEn ? 'Close tour' : '关闭引导')}
      </button>

      <div
        className={
          step === 2
            ? 'fixed inset-0 z-10 flex items-center justify-center p-4'
            : 'fixed left-1/2 bottom-6 z-10 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2'
        }
      >
        <div ref={panelRef} className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              {step === 0 ? (
                <MousePointer2 className="w-4.5 h-4.5" />
              ) : step === 1 ? (
                <Sliders className="w-4.5 h-4.5" />
              ) : (
                <FileText className="w-4.5 h-4.5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">
                {isEn ? `Getting started · ${step + 1}/3` : `快速上手 · ${step + 1}/3`}
              </div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {current.title}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {current.body}
              </p>
            </div>
          </div>

          {step < 2 ? (
            <div className="mt-5 flex items-center justify-between gap-3">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((value) => Math.max(0, value - 1))}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {isEn ? 'Back' : '上一步'}
                </button>
              ) : (
                <div className="flex gap-1.5" aria-hidden="true">
                  {[0, 1, 2].map((index) => (
                    <span
                      key={index}
                      className={`h-1.5 rounded-full transition-all ${
                        index === step
                          ? 'w-6 bg-indigo-600'
                          : 'w-1.5 bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setStep((value) => Math.min(2, value + 1))}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500"
              >
                {isEn ? 'Next' : '下一步'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : pendingReplacement ? (
            <div className="mt-5 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 p-4">
              <div className="text-xs font-black text-amber-900 dark:text-amber-200">
                {isEn ? 'Replace your current resume?' : '要替换当前简历吗？'}
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-amber-800/80 dark:text-amber-300/80">
                {isEn
                  ? 'You reopened the tour from Help. Replacing the content will overwrite the active resume in this browser.'
                  : '你是从帮助中心重新打开引导的。继续替换会覆盖当前浏览器里的活动简历内容。'}
              </p>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingReplacement(null)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-200"
                >
                  {isEn ? 'Keep current resume' : '保留当前简历'}
                </button>
                <button
                  type="button"
                  onClick={applyPendingReplacement}
                  className="rounded-xl bg-amber-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-amber-500"
                >
                  {isEn ? 'Replace resume' : '确认替换'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-2.5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mb-0.5 inline-flex w-fit items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {isEn ? 'Back to tools' : '返回上一步'}
              </button>
              <button
                type="button"
                onClick={loadExample}
                className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 p-3.5 text-left transition hover:border-indigo-400"
              >
                <div className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                  {isEn ? 'Use the full example resume' : '使用完整示例简历'}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {isEn ? 'Best for quickly exploring the complete product.' : '适合快速体验完整排版、ATS、导出和分享效果。'}
                </div>
              </button>

              <button
                type="button"
                onClick={keepStarter}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 text-left transition hover:border-slate-400"
              >
                <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {isEn ? 'Start with a guided structure' : '从基础结构开始'}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {isEn ? 'Keep a few starter sections and fill them yourself.' : '保留姓名、简介、经历、教育等基础结构，由你自己填写。'}
                </div>
              </button>

              <button
                type="button"
                onClick={startBlank}
                className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 text-left transition hover:border-slate-400"
              >
                <div>
                  <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                    {isEn ? 'Start completely blank' : '从完全空白简历开始'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {isEn ? 'Clear all resume content and build it from scratch.' : '清空所有简历内容，从零开始填写。'}
                  </div>
                </div>
                <FilePlus2 className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={importExisting}
                className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 text-left transition hover:border-slate-400"
              >
                <div>
                  <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                    {isEn ? 'Import an existing resume' : '导入已有简历'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {isEn ? 'Import PDF, Markdown, text, or JSON.' : '支持 PDF、Markdown、纯文本和 JSON。'}
                  </div>
                </div>
                <Upload className="w-4 h-4 text-indigo-500" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
