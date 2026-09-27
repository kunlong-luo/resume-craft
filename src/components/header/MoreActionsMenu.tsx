import React, { useEffect, useRef, useState } from 'react';
import { DownloadCloud, HelpCircle, MoreHorizontal, Upload } from 'lucide-react';

interface MoreActionsMenuProps {
  isEn: boolean;
  isInstallable: boolean;
  onImport: () => void;
  onOpenGuide: () => void;
  onInstall: () => void;
}

export function MoreActionsMenu({
  isEn,
  isInstallable,
  onImport,
  onOpenGuide,
  onInstall,
}: MoreActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  const action = (fn: () => void) => () => {
    rootRef.current?.querySelector<HTMLElement>('button')?.focus();
    setIsOpen(false);
    fn();
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={isEn ? 'More actions' : '更多操作'}
        aria-expanded={isOpen}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-[100] mt-2 min-w-[120px] whitespace-nowrap rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <button type="button" onClick={action(onImport)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
            <Upload className="h-4 w-4 text-indigo-500" />
            {isEn ? 'Import' : '导入'}
          </button>
          <button type="button" onClick={action(onOpenGuide)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
            <HelpCircle className="h-4 w-4 text-indigo-500" />
            {isEn ? 'Help' : '帮助'}
          </button>
          {isInstallable && (
            <button type="button" onClick={action(onInstall)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40">
              <DownloadCloud className="h-4 w-4" />
              {isEn ? 'Install app' : '安装应用'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
