import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, RotateCcw, Check } from 'lucide-react';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { trackAnalyticsEvent } from '../../lib/analytics';
import { en } from '../../i18n/locales/en';
import { zh } from '../../i18n/locales/zh';

function getErrorBoundaryTranslation(language: string) {
  return (language === 'en' ? en : zh).errorBoundary;
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    trackAnalyticsEvent('runtime_error');
    this.setState({ errorInfo });
  }

  private handleCopyBackup = async () => {
    try {
      const savedMarkdown = storage.getString(STORAGE_KEYS.MARKDOWN);
      if (savedMarkdown) {
        await navigator.clipboard.writeText(savedMarkdown);
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
      }
    } catch (error) {
      console.error('Failed to copy backup:', error);
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    const uiLanguage = storage.getString(STORAGE_KEYS.UI_LANGUAGE, 'zh');
    const t = getErrorBoundaryTranslation(uiLanguage);
    if (window.confirm(t.confirmReset)) {
      storage.clearAllResumeData();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      const uiLanguage = storage.getString(STORAGE_KEYS.UI_LANGUAGE, 'zh');
      const t = getErrorBoundaryTranslation(uiLanguage);
      return (
        <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-xl w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            {/* Header Icon */}
            <div className="flex items-center gap-3 border-b border-slate-700/60 pb-5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-white">{t.title}</h1>
                <p className="text-xs text-slate-400 mt-0.5">{t.subtitle}</p>
              </div>
            </div>

            {/* Error detail */}
            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs font-mono overflow-x-auto space-y-2 text-rose-300/90">
              <div className="font-bold text-rose-400">
                {this.state.error?.name || 'Error'}: {this.state.error?.message || t.title}
              </div>
              {this.state.errorInfo?.componentStack && (
                <div className="text-[10px] text-slate-500 max-h-28 overflow-y-auto whitespace-pre-wrap font-mono">
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </div>

            {/* Emergency Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={this.handleCopyBackup}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 active:translate-y-px"
                >
                  {this.state.copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{this.state.copied ? t.backupCopied : t.backupCopy}</span>
                </button>

                <button
                  onClick={this.handleReload}
                  className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-650 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-px"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t.reload}</span>
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={this.handleReset}
                  className="text-xs text-slate-400 hover:text-slate-200 underline inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.reset}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
