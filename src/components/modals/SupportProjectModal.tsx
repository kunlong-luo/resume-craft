import React, { useRef } from 'react';
import { ExternalLink, Star, X } from 'lucide-react';
import { SUPPORT_REPO_URL } from '../../lib/support-prompt';
import { useDialogFocus } from '../../hooks/useDialogFocus';

interface SupportProjectModalProps {
  isOpen: boolean;
  lang?: string;
  onClose: () => void;
  onSupportClick: () => void;
}

export function SupportProjectModal({
  isOpen,
  lang = 'zh',
  onClose,
  onSupportClick,
}: SupportProjectModalProps) {
  const isEn = lang === 'en';
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus({ isOpen, dialogRef, onClose });

  if (!isOpen) return null;

  const openGitHub = () => {
    window.open(SUPPORT_REPO_URL, '_blank', 'noopener,noreferrer');
    onSupportClick();
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-project-title"
        tabIndex={-1}
        className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-700/80 dark:bg-slate-900 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-indigo-50/90 to-transparent dark:from-indigo-950/30" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-400 transition-colors hover:bg-white/80 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
          aria-label={isEn ? 'Close' : '关闭'}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative px-6 pb-6 pt-8 sm:px-7">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-100 bg-white text-indigo-600 shadow-sm dark:border-indigo-900/60 dark:bg-slate-900 dark:text-indigo-400">
            <Star className="h-5 w-5" fill="currentColor" />
          </div>

          <div className="mt-4 text-center">
            <h2
              id="support-project-title"
              className="text-xl font-black tracking-tight text-slate-950 dark:text-white"
            >
              {isEn ? 'Enjoying Resume Craft?' : '喜欢 Resume Craft 吗？'}
            </h2>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
              {isEn
                ? 'Your PDF export is already complete. Resume Craft is free and open source; if it helped, a GitHub Star supports continued improvements and helps more people discover the project.'
                : '你的 PDF 导出已经完成。Resume Craft 是免费开源项目；如果它对你有帮助，欢迎在 GitHub 点一个 Star，支持项目持续改进，也让更多人发现它。'}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={openGitHub}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.99] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 cursor-pointer"
            >
              <Star className="h-4 w-4" />
              <span>{isEn ? 'Star on GitHub' : '去 GitHub 点个 Star'}</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              {isEn ? 'No thanks' : '不用了'}
            </button>
          </div>

          <p className="mt-3 text-center text-[11px] leading-5 text-slate-400 dark:text-slate-500">
            {isEn
              ? 'Shown once after your first completed PDF export.'
              : '仅在第一次完成 PDF 导出后提示一次。'}
          </p>
        </div>
      </div>
    </div>
  );
}
