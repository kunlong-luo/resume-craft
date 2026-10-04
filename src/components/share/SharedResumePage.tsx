import React, { useRef, useState } from 'react';
import {
  Check,
  FileText,
  Loader2,
  Lock,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { Preview } from '../preview/Preview';
import {
  decryptSharePayload,
  SHARE_PASSWORD_MIN_LENGTH,
  type ParsedSharePayload,
  type ShareState,
} from '../../lib/share-utils';

interface SharedResumePageProps {
  sharePayload: ParsedSharePayload;
}

export function getSharedResumePaperName(
  paperSize: 'a4' | 'letter' | undefined,
  isEn: boolean,
): string {
  if (paperSize === 'letter') {
    return isEn ? 'US Letter' : 'US Letter';
  }
  return 'A4';
}

export function SharedResumePage({ sharePayload }: SharedResumePageProps) {
  const encryptedPayload =
    sharePayload.kind === 'encrypted' ? sharePayload.payload : null;
  const initialState =
    sharePayload.kind === 'plain' ? sharePayload.state : null;
  const legacyAccessCode =
    sharePayload.kind === 'plain' ? sharePayload.state.passwordHash : undefined;

  const [resolvedState, setResolvedState] = useState<ShareState | null>(
    initialState,
  );
  const [unlocked, setUnlocked] = useState(
    sharePayload.kind === 'plain' && !legacyAccessCode,
  );
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  const lang =
    resolvedState?.settings.lang ??
    encryptedPayload?.lang ??
    (sharePayload.kind === 'plain' ? sharePayload.state.settings.lang : 'zh');
  const isEn = lang === 'en';
  const isEncrypted = sharePayload.kind === 'encrypted';

  const handleUnlock = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');

    if (isEncrypted && encryptedPayload) {
      setIsDecrypting(true);
      try {
        const decrypted = await decryptSharePayload(
          encryptedPayload,
          passwordInput,
        );

        if (!decrypted) {
          setErrorMsg(
            isEn
              ? 'Incorrect password or the encrypted link has been modified'
              : '密码错误，或加密分享链接已被修改',
          );
          return;
        }

        setResolvedState(decrypted);
        setUnlocked(true);
        setPasswordInput('');
      } finally {
        setIsDecrypting(false);
      }
      return;
    }

    if (legacyAccessCode && passwordInput.trim() === legacyAccessCode) {
      setUnlocked(true);
      setPasswordInput('');
      return;
    }

    setErrorMsg(
      isEn ? 'Incorrect legacy access code' : '旧版访问口令错误，请重试',
    );
  };

  const triggerPrint = () => {
    window.print();
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
        <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-100/40 p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg">
                {isEncrypted
                  ? isEn
                    ? 'Encrypted Resume Share'
                    : '加密简历分享'
                  : isEn
                    ? 'Legacy Protected Resume'
                    : '旧版口令保护简历'}
              </h1>
              <p className="text-xs text-slate-400 font-medium max-w-[310px] mx-auto mt-1 leading-relaxed">
                {isEncrypted
                  ? isEn
                    ? 'This resume is encrypted in the link. Enter the password to decrypt it locally in your browser.'
                    : '简历内容已在分享链接中加密。请输入密码，在浏览器本地完成解密后查看。'
                  : isEn
                    ? 'This older share link uses a client-side access gate and remains supported for compatibility.'
                    : '这是旧版客户端访问口令链接，为兼容历史分享仍可继续打开。'}
              </p>
            </div>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="shared-resume-password" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {isEn ? 'Share password' : '分享密码'}
              </label>
              <input
                id="shared-resume-password"
                type="password"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                minLength={isEncrypted ? SHARE_PASSWORD_MIN_LENGTH : undefined}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-center tracking-widest text-slate-800 font-bold"
                required
                autoFocus
                autoComplete="current-password"
              />
              {isEncrypted && (
                <p className="text-[10px] text-slate-400 text-center">
                  {isEn
                    ? `At least ${SHARE_PASSWORD_MIN_LENGTH} characters`
                    : `至少 ${SHARE_PASSWORD_MIN_LENGTH} 个字符`}
                </p>
              )}
              {errorMsg && (
                <p className="text-[10px] text-rose-500 font-bold text-center animate-shake mt-1">
                  {errorMsg}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isDecrypting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-indigo-600/10 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDecrypting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {isDecrypting
                  ? isEn
                    ? 'Decrypting locally...'
                    : '正在本地解密...'
                  : isEncrypted
                    ? isEn
                      ? 'Decrypt & Read Resume'
                      : '解密并查看简历'
                    : isEn
                      ? 'Unlock Legacy Share'
                      : '验证旧版口令'}
              </span>
            </button>
          </form>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              {isEncrypted
                ? isEn
                  ? 'AES-256-GCM · PBKDF2 · password is not stored in the link'
                  : 'AES-256-GCM · PBKDF2 · 密码不会写入分享链接'
                : isEn
                  ? 'Legacy client-side access gate'
                  : '旧版客户端访问门槛'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!resolvedState) {
    return null;
  }

  const { markdown, settings } = resolvedState;
  const paperName = getSharedResumePaperName(settings.paperSize, settings.lang === 'en');

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col selection:bg-indigo-500 selection:text-white">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/60 z-50 px-4 md:px-8 py-3.5 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-sm shadow-sm shadow-indigo-600/25">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-xs md:text-sm">
              {settings.lang === 'en'
                ? 'Online Interactive Portfolio'
                : '在线简历分享'}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              {settings.lang === 'en'
                ? 'Mobile-responsive view · Ready to print / save as PDF'
                : '全平台自适应 · 随时可打印或导出为 PDF'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerPrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-600/10 transition-all cursor-pointer"
            title={
              settings.lang === 'en'
                ? 'Print or Save PDF'
                : '保存本地 / 打印 PDF'
            }
          >
            <Printer className="w-3.5 h-3.5" />
            <span>
              {settings.lang === 'en' ? 'Print / Export PDF' : '导出 PDF'}
            </span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex justify-center py-4 md:py-8 px-2 overflow-x-hidden">
        <div className="w-full max-w-4xl flex justify-center relative">
          <Preview
            ref={contentRef}
            overrideMarkdown={markdown}
            overrideSettings={settings}
          />
        </div>
      </main>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-sm text-white text-[10px] md:text-xs px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 z-40 print:hidden font-medium border border-slate-800/50">
        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          {settings.lang === 'en'
            ? `Desktop users: Click "Print / Export PDF" to save the ${paperName} layout.`
            : `提示：招聘官可点击上方按钮或使用 Ctrl+P 保存 ${paperName} PDF。`}
        </span>
      </div>
    </div>
  );
}
