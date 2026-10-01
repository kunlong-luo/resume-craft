import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Clipboard,
  Link2,
  Loader2,
  LockKeyhole,
  Share2,
  ShieldCheck,
  Unlock,
  X,
} from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import {
  generateShareUrl,
  SHARE_PASSWORD_MAX_LENGTH,
  SHARE_PASSWORD_MIN_LENGTH,
} from '../../lib/share-utils';
import { trackAnalyticsEvent } from '../../lib/analytics';

interface ShareResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ShareMode = 'public' | 'encrypted';

function getPasswordStrength(password: string) {
  if (!password) return { label: '', level: 0 };
  let score = 0;
  if (password.length >= SHARE_PASSWORD_MIN_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { label: 'Weak', level: 1 };
  if (score <= 2) return { label: 'Good', level: 2 };
  return { label: 'Strong', level: 3 };
}

export function ShareResumeModal({ isOpen, onClose }: ShareResumeModalProps) {
  const { markdown, settings, uiLanguage } = useResumeStore();
  const [mode, setMode] = useState<ShareMode>('encrypted');
  const [password, setPassword] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  const isEn = uiLanguage === 'en';
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordValid =
    password.trim().length >= SHARE_PASSWORD_MIN_LENGTH &&
    password.trim().length <= SHARE_PASSWORD_MAX_LENGTH;

  const invalidateGeneratedLink = () => {
    if (shareUrl) setShareUrl('');
    if (copied) setCopied(false);
  };

  const handleModeChange = (nextMode: ShareMode) => {
    setMode(nextMode);
    setError('');
    invalidateGeneratedLink();
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setError('');
    invalidateGeneratedLink();
  };

  const handleGenerate = async () => {
    setError('');
    setCopied(false);

    if (mode === 'encrypted' && !passwordValid) {
      setError(
        isEn
          ? `Use a password between ${SHARE_PASSWORD_MIN_LENGTH} and ${SHARE_PASSWORD_MAX_LENGTH} characters.`
          : `密码长度需为 ${SHARE_PASSWORD_MIN_LENGTH}–${SHARE_PASSWORD_MAX_LENGTH} 个字符。`,
      );
      return;
    }

    setIsGenerating(true);
    try {
      const url = await generateShareUrl(
        { markdown, settings },
        mode === 'encrypted' ? password : undefined,
      );
      setShareUrl(url);
      trackAnalyticsEvent('share_created');
    } catch {
      setError(
        isEn
          ? 'Failed to generate the share link in this browser.'
          : '当前浏览器生成分享链接失败，请稍后重试。',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setError(
        isEn
          ? 'Clipboard access was blocked. Select and copy the link manually.'
          : '浏览器阻止了剪贴板访问，请手动选择并复制链接。',
      );
    }
  };

  const closeAndResetTransientState = () => {
    setMode('encrypted');
    setPassword('');
    setShareUrl('');
    setError('');
    setCopied(false);
    setIsGenerating(false);
    onClose();
  };

  const closeRef = useRef(closeAndResetTransientState);
  closeRef.current = closeAndResetTransientState;

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusableSelector =
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    dialog?.querySelector<HTMLElement>(focusableSelector)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter(
        (element) =>
          !element.hasAttribute('hidden') &&
          element.getAttribute('aria-hidden') !== 'true',
      );

      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

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
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-sm p-4 flex items-center justify-center"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) closeAndResetTransientState();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-resume-title"
        tabIndex={-1}
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <Share2 className="w-4 h-4" />
              <span className="text-[11px] font-black uppercase tracking-widest">
                {isEn ? 'Share' : '分享'}
              </span>
            </div>
            <h2
              id="share-resume-title"
              className="text-lg font-black text-slate-900 dark:text-white"
            >
              {isEn ? 'Share resume' : '分享简历'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {isEn
                ? 'Create a link to share your current resume. Add a password when you need extra privacy.'
                : '生成当前简历的分享链接；需要更多隐私时可设置密码。'}
            </p>
          </div>
          <button
            onClick={closeAndResetTransientState}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label={isEn ? 'Close share dialog' : '关闭分享弹窗'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => handleModeChange('encrypted')}
              aria-pressed={mode === 'encrypted'}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                mode === 'encrypted'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <LockKeyhole className="w-3.5 h-3.5" />
              {isEn ? 'Protected' : '加密'}
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('public')}
              aria-pressed={mode === 'public'}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                mode === 'public'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Unlock className="w-3.5 h-3.5" />
              {isEn ? 'Public' : '公开'}
            </button>
          </div>

          {mode === 'encrypted' ? (
            <div className="space-y-2">
              <label
                htmlFor="share-password"
                className="text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                {isEn ? 'Share password' : '分享密码'}
              </label>
              <input
                id="share-password"
                type="password"
                value={password}
                onChange={(event) => handlePasswordChange(event.target.value)}
                minLength={SHARE_PASSWORD_MIN_LENGTH}
                maxLength={SHARE_PASSWORD_MAX_LENGTH}
                autoComplete="new-password"
                placeholder={
                  isEn
                    ? `${SHARE_PASSWORD_MIN_LENGTH}–${SHARE_PASSWORD_MAX_LENGTH} characters`
                    : `${SHARE_PASSWORD_MIN_LENGTH}–${SHARE_PASSWORD_MAX_LENGTH} 个字符`
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
              <div className="flex items-center justify-between gap-3 text-[11px]">
                <span className="text-slate-400">
                  {isEn
                    ? 'Use a unique password you can send separately.'
                    : '建议使用独立密码，并通过其他渠道发送。'}
                </span>
                {password && (
                  <span
                    className={`font-bold ${
                      strength.level >= 3
                        ? 'text-emerald-600'
                        : strength.level === 2
                          ? 'text-amber-600'
                          : 'text-rose-500'
                    }`}
                  >
                    {isEn
                      ? strength.label
                      : strength.level >= 3
                        ? '强'
                        : strength.level === 2
                          ? '一般'
                          : '弱'}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/70 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              {isEn
                ? 'Anyone with the complete public link can read the resume content.'
                : '任何拿到完整公开链接的人都可以读取其中的简历内容。'}
            </div>
          )}

          {mode === 'encrypted' && (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 flex gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                {isEn
                  ? 'Send the password separately from the link.'
                  : '密码请和链接分开发送。'}
              </span>
            </div>
          )}

          {shareUrl && (
            <div className="space-y-2">
              <label
                htmlFor="generated-share-link"
                className="text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                {isEn ? 'Generated link' : '已生成链接'}
              </label>
              <textarea
                id="generated-share-link"
                readOnly
                value={shareUrl}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-[11px] font-mono text-slate-600 dark:text-slate-300"
              />
            </div>
          )}

          {error && (
            <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              {isGenerating
                ? isEn
                  ? 'Generating...'
                  : '生成中...'
                : shareUrl
                  ? isEn
                    ? 'Regenerate link'
                    : '重新生成链接'
                  : isEn
                    ? 'Generate link'
                    : '生成链接'}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={!shareUrl}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Clipboard className="w-4 h-4" />}
              {copied ? (isEn ? 'Copied' : '已复制') : isEn ? 'Copy' : '复制'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
