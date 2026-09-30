import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  BookOpen,
  Code,
  Database,
  Download,
  ExternalLink,
  FileCheck2,
  HelpCircle,
  LayoutGrid,
  Lock,
  Palette,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { trackAnalyticsEvent } from '../../lib/analytics';
import { storage } from '../../lib/storage';
import { useDialogFocus } from '../../hooks/useDialogFocus';

interface HelpLegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'guide' | 'privacy' | 'license';

export function HelpLegalModal({ isOpen, onClose }: HelpLegalModalProps) {
  const { settings } = useResumeStore();
  const isEn = (settings.lang || 'zh') === 'en';
  const [activeTab, setActiveTab] = useState<Tab>('guide');
  const [confirmClear, setConfirmClear] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus({ isOpen, dialogRef, onClose });

  const openGuideTool = (eventName: string) => {
    onClose();
    window.setTimeout(() => window.dispatchEvent(new CustomEvent(eventName)), 0);
  };

  const clearLocalData = () => {
    if (!storage.clearAllResumeData()) return;
    trackAnalyticsEvent('local_data_cleared');
    window.location.reload();
  };

  const steps = [
    {
      icon: LayoutGrid,
      title: isEn ? 'Start with your content' : '先完成简历内容',
      body: isEn
        ? 'Choose a template or import an existing resume, then complete contact details, experience, projects, education, and skills.'
        : '选择模板或导入已有简历，然后完成联系方式、工作经历、项目、教育和技能。',
    },
    {
      icon: SlidersHorizontal,
      title: isEn ? 'Adjust layout' : '调整排版',
      body: isEn
        ? 'Choose columns, typography, margins, and spacing. Keep readability ahead of forcing everything onto one page.'
        : '调整单双栏、字体、边距和间距。优先保证可读性，不要为了强行一页而过度压缩。',
    },
    {
      icon: Palette,
      title: isEn ? 'Polish the style' : '完善视觉样式',
      body: isEn
        ? 'Use color and heading styles to improve hierarchy without distracting from the content.'
        : '用强调色和标题样式改善阅读层级，但不要让装饰抢过内容本身。',
    },
    {
      icon: FileCheck2,
      title: isEn ? 'Run Resume Check' : '运行简历检查',
      body: isEn
        ? 'Check structure, wording, ATS readability, JD keywords, and formatting before export.'
        : '导出前检查结构、表达、ATS 可读性、JD 关键词和格式问题。',
    },
    {
      icon: Download,
      title: isEn ? 'Download, back up, and share' : '下载、备份与分享',
      body: isEn
        ? 'Review the final preview, export the PDF, keep a Markdown or JSON backup, and share only after checking sensitive information.'
        : '确认最终预览后导出 PDF，并保留 Markdown 或 JSON 备份；分享前请检查敏感信息。',
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-legal-title"
        tabIndex={-1}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-slate-800 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
      >
        <header className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-2 text-indigo-600 dark:border-indigo-800/60 dark:bg-indigo-950/60 dark:text-indigo-400">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 id="help-legal-title" className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                {isEn ? 'Help & Privacy' : '帮助与隐私'}
                <span className="rounded-full border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-400">
                  v{__APP_VERSION__}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEn ? 'Workflow, local data, privacy, and open source' : '使用流程、本地数据、隐私与开源信息'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={isEn ? 'Close help' : '关闭帮助'} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </header>

        <nav className="flex gap-1 border-b border-slate-200/80 px-5 dark:border-slate-800">
          {([
            ['guide', BookOpen, isEn ? 'Guide' : '使用指南'],
            ['privacy', ShieldCheck, isEn ? 'Privacy' : '隐私与数据'],
            ['license', Code, isEn ? 'Open Source' : '开源'],
          ] as const).map(([tab, Icon, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => { setActiveTab(tab); setConfirmClear(false); }}
              className={`flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-bold transition ${activeTab === tab ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}
            >
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </nav>

        <main className="max-h-[62vh] overflow-y-auto p-5 sm:p-6">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'guide' && (
              <motion.div key="guide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-800/60 dark:bg-indigo-950/30">
                  <h3 className="text-sm font-black">{isEn ? 'A simple path to a finished resume' : '从内容到可投递 PDF 的推荐流程'}</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {isEn ? 'Content → Layout → Style → Check → Download / Share. Keep the workflow simple and iterate from real feedback.' : '内容 → 排版 → 样式 → 检查 → 下载 / 分享。先完成主流程，再根据真实反馈迭代。'}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.title} className="flex gap-3 rounded-2xl border border-slate-200/80 p-3.5 dark:border-slate-800">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300"><Icon className="h-4 w-4" /></div>
                        <div>
                          <div className="text-[10px] font-black text-indigo-500">{isEn ? `STEP ${index + 1}` : `第 ${index + 1} 步`}</div>
                          <h4 className="text-xs font-black">{step.title}</h4>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{step.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button type="button" onClick={() => openGuideTool('resume-craft:start-onboarding')} className="flex w-full items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3.5 py-3 text-left transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/60">
                  <div>
                    <div className="text-xs font-bold">{isEn ? 'Replay the interface tour' : '重新观看新手教程'}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{isEn ? 'Review the editor, toolbar, and starting options without changing your resume.' : '再次查看编辑区、工具栏和开始方式，不会修改或重置你的简历。'}</div>
                  </div>
                  <Wand2 className="h-4 w-4 shrink-0 text-indigo-500" />
                </button>
              </motion.div>
            )}

            {activeTab === 'privacy' && (
              <motion.div key="privacy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3.5">
                <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3.5 dark:border-emerald-800/60 dark:bg-emerald-950/40">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300"><Shield className="h-4 w-4" />{isEn ? 'Local-first by default' : '默认本地优先'}</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
                    {isEn ? 'Resume Craft stores your working resume data locally in this browser by default. Editing does not require an account or a backend that persists your resume content.' : 'Resume Craft 默认将正在编辑的简历数据保存在当前浏览器本地。编辑无需账号，也不依赖用于持久化简历内容的后端。'}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
                  <h4 className="flex items-center gap-2 text-xs font-bold"><Lock className="h-4 w-4 text-indigo-500" />{isEn ? 'Local data and sharing' : '本地数据与分享'}</h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {isEn ? 'Browser storage contains resume drafts, versions, and preferences. Password-protected share links are encrypted locally before creation; public links should be treated as readable by anyone who receives the full link.' : '浏览器本地存储包含简历草稿、版本与偏好设置。密码保护分享会在浏览器本地加密后生成；公开分享链接应视为拿到完整链接即可读取。'}
                  </p>
                </div>

                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 dark:border-rose-900/70 dark:bg-rose-950/20">
                  <div className="flex items-start gap-2.5">
                    <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <div className="flex-1">
                      <h4 className="text-xs font-black text-rose-800 dark:text-rose-300">{isEn ? 'Clear local data' : '清空本地数据'}</h4>
                      <p className="mt-1 text-[11px] leading-relaxed text-rose-700/90 dark:text-rose-300/80">
                        {isEn ? 'Permanently removes Resume Craft resume data and preferences stored by this browser. Export anything you want to keep first. This cannot be undone.' : '永久删除当前浏览器中由 Resume Craft 保存的简历数据和偏好设置。请先导出需要保留的内容；此操作无法撤销。'}
                      </p>

                      {!confirmClear ? (
                        <button type="button" onClick={() => setConfirmClear(true)} className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300">
                          {isEn ? 'Clear local data…' : '清空本地数据…'}
                        </button>
                      ) : (
                        <div className="mt-3 rounded-lg border border-rose-300 bg-white p-3 dark:border-rose-800 dark:bg-slate-900">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-rose-700 dark:text-rose-300"><AlertTriangle className="h-4 w-4" />{isEn ? 'Delete all local Resume Craft data?' : '确定删除全部 Resume Craft 本地数据？'}</div>
                          <div className="mt-2 flex gap-2">
                            <button type="button" onClick={() => setConfirmClear(false)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-bold dark:border-slate-700">{isEn ? 'Cancel' : '取消'}</button>
                            <button type="button" onClick={clearLocalData} className="rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rose-700">{isEn ? 'Delete permanently' : '永久删除'}</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
                  <Database className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{isEn ? 'Clearing browser/site data can also remove local resumes. Keep a Markdown or JSON backup for important resumes.' : '清理浏览器/站点数据也可能删除本地简历。重要简历建议保留 Markdown 或 JSON 备份。'}</span>
                </div>
              </motion.div>
            )}

            {activeTab === 'license' && (
              <motion.div key="license" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3.5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <h3 className="text-sm font-black">Resume Craft · 简匠</h3>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{isEn ? 'Free and open-source under the MIT License.' : '基于 MIT License 免费开源。'}</p>
                </div>
                <a href="https://github.com/kunlong-luo/resume-craft" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-xl border border-indigo-200 p-3 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/30">
                  <span>kunlong-luo/resume-craft</span><ExternalLink className="h-4 w-4" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/80 px-5 py-3 text-xs dark:border-slate-800 dark:bg-slate-900/80">
          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">Resume Craft · 简匠 v{__APP_VERSION__}</span>
          <div className="flex items-center gap-2">
            <a href="https://github.com/kunlong-luo/resume-craft/discussions" target="_blank" rel="noopener noreferrer" onClick={() => trackAnalyticsEvent('feedback_opened')} className="inline-flex items-center gap-1 px-3 py-1.5 font-bold text-indigo-600 hover:underline dark:text-indigo-400">{isEn ? 'Feedback' : '反馈'}<ExternalLink className="h-3 w-3" /></a>
            <button type="button" onClick={onClose} className="tactile-btn-primary tactile-btn-primary-hover rounded-lg px-4 py-1.5 font-bold text-white">{isEn ? 'Done' : '完成'}</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
