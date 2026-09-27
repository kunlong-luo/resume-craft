import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useDialogFocus } from '../../hooks/useDialogFocus';

interface SettingsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function SettingsPopover({
  isOpen,
  onClose,
  triggerRef,
  title,
  description,
  icon,
  children,
}: SettingsPopoverProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);

  useDialogFocus({ isOpen, dialogRef, onClose });

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const panelWidth = window.innerWidth >= 640 ? 384 : 352;
      const viewportPadding = 10;
      const maxRight = Math.max(
        viewportPadding,
        window.innerWidth - Math.min(panelWidth, window.innerWidth - viewportPadding * 2) - viewportPadding,
      );

      setCoords({
        top: rect.bottom + 8,
        right: Math.min(
          Math.max(viewportPadding, window.innerWidth - rect.right),
          maxRight,
        ),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, triggerRef]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && coords && (
        <>
          <motion.button
            type="button"
            aria-label="Close settings panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[120] cursor-default bg-slate-900/10 backdrop-blur-[0.5px] dark:bg-black/40"
            onClick={onClose}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.97, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            style={{
              position: 'fixed',
              top: coords.top,
              right: coords.right,
              maxHeight: `calc(100vh - ${coords.top + 16}px)`,
            }}
            className="z-[130] flex w-[22rem] max-w-[calc(100vw-1.25rem)] flex-col overflow-y-auto rounded-2xl border border-slate-200/90 bg-white/98 p-4 shadow-[0_20px_48px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/98 sm:w-[24rem] sm:p-5"
          >
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex min-w-0 items-start gap-2.5">
                <div className="mt-0.5 shrink-0 text-indigo-500">{icon}</div>
                <div className="min-w-0">
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    {title}
                  </h2>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={`Close ${title}`}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
