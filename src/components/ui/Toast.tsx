import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useResumeStore } from '../../store/useResumeStore';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const uiLanguage = useResumeStore((state) => state.uiLanguage);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(({ title, message, type = 'success', duration = 3000 }: Omit<ToastItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastItem = { id, title, message, type, duration };

    setToasts(prev => [...prev.slice(-3), newToast]); // keep max 4 toasts

    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, [hideToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed top-14 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => {
            const isSuccess = toast.type === 'success';
            const isInfo = toast.type === 'info';
            const isWarning = toast.type === 'warning';
            const isError = toast.type === 'error';

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.9, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.85, x: 30, filter: 'blur(2px)' }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-2xl backdrop-blur-md border ${
                  isSuccess
                    ? 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-emerald-500/40 dark:border-emerald-500/30 shadow-emerald-500/10'
                    : isInfo
                    ? 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-indigo-500/40 dark:border-indigo-500/30 shadow-indigo-500/10'
                    : isWarning
                    ? 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-amber-500/40 dark:border-amber-500/30 shadow-amber-500/10'
                    : 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-rose-500/40 dark:border-rose-500/30 shadow-rose-500/10'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {isInfo && <Info className="w-4 h-4 text-indigo-500" />}
                  {isWarning && <AlertCircle className="w-4 h-4 text-amber-500" />}
                  {isError && <AlertCircle className="w-4 h-4 text-rose-500" />}
                </div>

                <div className="flex-1 min-w-0 pr-1">
                  <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                    {toast.title}
                  </div>
                  {toast.message && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {toast.message}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => hideToast(toast.id)}
                  className="shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label={uiLanguage === 'en' ? 'Close notification' : '关闭通知'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      showToast: (toast: Omit<ToastItem, 'id'>) => {
        console.log(`[Toast ${toast.type || 'info'}]: ${toast.title} - ${toast.message || ''}`);
      },
      hideToast: () => {}
    };
  }
  return context;
}
