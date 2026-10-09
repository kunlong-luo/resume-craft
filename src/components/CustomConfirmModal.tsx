import React, { useRef } from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDialogFocus } from '../hooks/useDialogFocus';
import { useResumeStore } from '../store/useResumeStore';

interface CustomConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

export function CustomConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'warning'
}: CustomConfirmModalProps) {
  const uiLanguage = useResumeStore((state) => state.uiLanguage);
  const localizedConfirmText = confirmText ?? (uiLanguage === 'en' ? 'Confirm' : '确定');
  const localizedCancelText = cancelText ?? (uiLanguage === 'en' ? 'Cancel' : '取消');
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus({ isOpen, dialogRef, onClose });

  // Theme styling based on type
  const theme = {
    warning: {
      accent: 'from-amber-500 to-orange-500',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      btnConfirm: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/15',
    },
    danger: {
      accent: 'from-rose-500 to-red-600',
      iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
      icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
      btnConfirm: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/15',
    },
    info: {
      accent: 'from-blue-500 to-indigo-500',
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
      icon: <Info className="w-5 h-5 text-blue-500" />,
      btnConfirm: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/15',
    }
  }[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] cursor-pointer"
          />

          {/* Modal Card */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-confirm-title"
            aria-describedby="custom-confirm-message"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 flex flex-col transition-colors"
          >
            {/* Top decorative gradient line */}
            <div className={`h-1.5 bg-gradient-to-r ${theme.accent}`} />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${theme.iconBg}`}>
                  {theme.icon}
                </div>
                <h3 id="custom-confirm-title" className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-none">
                  {title}
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label={localizedCancelText}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="px-6 py-5">
              <p id="custom-confirm-message" className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 text-justify leading-relaxed whitespace-pre-line">
                {message}
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                {localizedCancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-5 py-2 text-white text-xs font-bold rounded-lg transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer ${theme.btnConfirm}`}
              >
                {localizedConfirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
