import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  HelpCircle, 
  ShieldCheck, 
  BookOpen, 
  Lock, 
  Scale, 
  Wand2,
  ExternalLink,
  Shield,
  Code,
  LayoutGrid,
  ListChecks,
  SlidersHorizontal,
  Palette,
  Download,
  Target,
  FileCheck2,
  Database
} from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { trackAnalyticsEvent } from '../../lib/analytics';
import { useDialogFocus } from '../../hooks/useDialogFocus';

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

interface HelpLegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpLegalModal({ isOpen, onClose }: HelpLegalModalProps) {
  const { settings } = useResumeStore();
  const lang = settings.lang || 'zh';
  const isEn = lang === 'en';

  const [activeTab, setActiveTab] = useState<'guide' | 'privacy' | 'license'>('guide');
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus({ isOpen, dialogRef, onClose });

  const openGuideTool = (eventName: string) => {
    onClose();
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(eventName));
    }, 0);
  };

  const guideSteps = [
    {
      number: 1,
      icon: LayoutGrid,
      title: isEn ? 'Choose a starting point' : '选择一个合适的起点',
      description: isEn
        ? 'Start from a content template, import an existing resume, use the guided structure, or begin blank. Content templates replace resume content, so choose them before heavy editing.'
        : '可以从内容模板、导入已有简历、基础结构或完全空白开始。内容模板会替换简历内容，建议在大量编辑前先选好起点。',
      actions: [
        { label: isEn ? 'Open template library' : '打开模板库', event: 'resume-craft:open-template-center' },
        { label: isEn ? 'Import resume' : '导入简历', event: 'resume-craft:open-import' },
      ],
    },
    {
      number: 2,
      icon: FileCheck2,
      title: isEn ? 'Finish the content first' : '先把内容写完整',
      description: isEn
        ? 'Complete contact info, experience, projects, education, and skills before spending time on colors or typography. Strong content matters more than decoration.'
        : '优先完成联系方式、工作/项目经历、教育和技能，再考虑颜色或视觉细节。内容质量始终比装饰更重要。',
      actions: [],
    },
    {
      number: 3,
      icon: Target,
      title: isEn ? 'Tailor it to the target role' : '针对目标岗位优化',
      description: isEn
        ? 'Match the role language, reorder the most relevant experience, and describe outcomes with actions plus measurable impact instead of listing responsibilities only.'
        : '根据目标岗位调整关键词和经历顺序，用“行动 + 结果 + 数据”描述成果，而不是只罗列职责。',
      actions: [],
    },
    {
      number: 4,
      icon: ListChecks,
      title: isEn ? 'Run Resume Check' : '运行简历检查',
      description: isEn
        ? 'When the content is mostly complete, check contact details, structure, wording, ATS readability, JD keywords, and formatting issues.'
        : '内容基本完成后，再检查联系方式、结构、表达、ATS 可读性、JD 关键词和格式问题。',
      actions: [
        { label: isEn ? 'Open Resume Check' : '打开简历检查', event: 'resume-craft:open-resume-check' },
      ],
    },
    {
      number: 5,
      icon: SlidersHorizontal,
      title: isEn ? 'Adjust layout' : '调整排版',
      description: isEn
        ? 'Use Layout for columns, fonts, size, margins, and spacing. Avoid shrinking text too aggressively just to force everything onto one page.'
        : '在“排版”中调整单双栏、字体、字号、边距和间距。不要为了强行一页而把文字压得过小。',
      actions: [
        { label: isEn ? 'Open Layout' : '打开排版', event: 'resume-craft:open-layout' },
      ],
    },
    {
      number: 6,
      icon: Palette,
      title: isEn ? 'Polish the visual style' : '最后调整样式',
      description: isEn
        ? 'Use Style for accent colors, section headings, and decoration. Visual styling should improve hierarchy and readability, not compete with the content.'
        : '在“样式”中调整强调色、章节标题和装饰。视觉样式应该服务阅读层级，而不是抢内容的注意力。',
      actions: [
        { label: isEn ? 'Open Style' : '打开样式', event: 'resume-craft:open-style' },
      ],
    },
    {
      number: 7,
      icon: Wand2,
      title: isEn ? 'Check page count' : '检查页数',
      description: isEn
        ? 'Check the A4 page lines first. If the resume overflows, trim low-value content, then adjust Layout, and use Auto Fit last. Treat Auto Fit as a finishing tool, not the first fix.'
        : '先查看 A4 分页线。如果超页，先删减低价值内容，再调整排版，最后才使用“智能单页”。把智能单页当作收尾工具，而不是第一步。',
      actions: [
        { label: isEn ? 'Show A4 page lines' : '显示 A4 分页线', event: 'resume-craft:show-page-lines' },
      ],
    },
    {
      number: 8,
      icon: Download,
      title: isEn ? 'Final check and download' : '最终检查与下载',
      description: isEn
        ? 'Run Resume Check once more, review the A4 preview, then download the final PDF. Prefer ATS PDF for applications; use Quick PDF for visual sharing or fallback.'
        : '再运行一次简历检查并确认 A4 预览，然后下载最终 PDF。正式投递优先 ATS PDF；快速 PDF 更适合视觉分享或备用。',
      actions: [
        { label: isEn ? 'Open Resume Check' : '打开简历检查', event: 'resume-craft:open-resume-check' },
        { label: isEn ? 'Choose PDF download' : '选择 PDF 下载方式', event: 'resume-craft:open-pdf-menu' },
      ],
    },
    {
      number: 9,
      icon: Database,
      title: isEn ? 'Back up and share safely' : '备份并安全分享',
      description: isEn
        ? 'Keep a Markdown or JSON backup after the final PDF. If you share a link, review sensitive information first; for encrypted sharing, send the password separately from the link.'
        : '最终 PDF 完成后，再保留一份 Markdown 或 JSON 备份。分享链接前先检查敏感信息；使用加密分享时，密码与链接应分开发送。',
      actions: [
        { label: isEn ? 'Open versions & backup' : '打开版本与备份', event: 'resume-craft:open-backup' },
        { label: isEn ? 'Share resume' : '分享简历', event: 'resume-craft:open-share' },
      ],
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-legal-title"
        aria-describedby="help-legal-description"
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-200 transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 rounded-xl text-indigo-600 dark:text-indigo-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="help-legal-title" className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{isEn ? 'User Guide' : '使用指南'}</span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 rounded-full">
                  v2.0
                </span>
              </h2>
              <p id="help-legal-description" className="text-xs text-slate-500 dark:text-slate-400">
                {isEn ? 'Recommended workflow & privacy info' : '推荐使用流程与本地数据隐私说明'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isEn ? 'Close' : '关闭'}
            aria-label={isEn ? 'Close user guide dialog' : '关闭使用指南弹窗'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200/80 dark:border-slate-800 px-5 bg-white dark:bg-slate-900 gap-2">
          <button
            onClick={() => setActiveTab('guide')}
            className={`relative flex items-center gap-2 px-3.5 py-3 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'guide'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{isEn ? 'User Guide' : '使用指南'}</span>
            {activeTab === 'guide' && (
              <motion.div
                layoutId="helpLegalActiveTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`relative flex items-center gap-2 px-3.5 py-3 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isEn ? 'Privacy' : '隐私承诺'}</span>
            {activeTab === 'privacy' && (
              <motion.div
                layoutId="helpLegalActiveTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('license')}
            className={`relative flex items-center gap-2 px-3.5 py-3 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'license'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>{isEn ? 'Open Source' : '开源协议与版权'}</span>
            {activeTab === 'license' && (
              <motion.div
                layoutId="helpLegalActiveTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[60vh] text-xs leading-relaxed scrollbar-thin">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'guide' && (
              <motion.div
                key="help-tab-guide"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-white p-4 dark:border-indigo-800/60 dark:from-indigo-950/50 dark:to-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">
                        {isEn ? 'Recommended workflow' : '推荐使用流程'}
                      </div>
                      <h3 className="mt-1 text-sm font-black text-slate-900 dark:text-slate-100">
                        {isEn ? 'Build the resume in the right order' : '按正确顺序完成一份可投递简历'}
                      </h3>
                      <p className="mt-1.5 max-w-xl text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                        {isEn
                          ? 'The most effective workflow is content first, checking second, layout third, and styling last. This guide takes you from a starting point to a final PDF.'
                          : '更高效的顺序是：先内容，再检查，再排版，最后做视觉样式。下面会从选择起点一直带你走到最终 PDF。'}
                      </p>
                    </div>
                    <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {guideSteps.map((step) => {
                    const StepIcon = step.icon;
                    return (
                      <div
                        key={step.number}
                        className="rounded-2xl border border-slate-200/80 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
                            <StepIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-indigo-500">
                                {isEn ? `STEP ${step.number}` : `第 ${step.number} 步`}
                              </span>
                              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">
                                {step.title}
                              </h4>
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                              {step.description}
                            </p>
                            {step.actions.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-2">
                                {step.actions.map((action) => (
                                  <button
                                    key={action.event}
                                    type="button"
                                    onClick={() => openGuideTool(action.event)}
                                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[10px] font-bold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                                  >
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 dark:border-amber-900/60 dark:bg-amber-950/30">
                    <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-800 dark:text-amber-300">
                      <Target className="h-3.5 w-3.5" />
                      {isEn ? 'International applications' : '跨地区 / 海外投递'}
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-amber-800/80 dark:text-amber-300/80">
                      {isEn
                        ? 'Keep the + country/region calling code in your phone number when applying across regions. Resume Craft supports global country and region formatting.'
                        : '跨地区投递时，建议电话号码保留 + 国家/地区代码。Resume Craft 已支持全球国家与地区的电话格式。'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                    <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-800 dark:text-emerald-300">
                      <FileCheck2 className="h-3.5 w-3.5" />
                      {isEn ? 'One rule to remember' : '最重要的一条原则'}
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-emerald-800/80 dark:text-emerald-300/80">
                      {isEn
                        ? 'Do not sacrifice readability just to force a one-page resume. Relevance and clarity come before density.'
                        : '不要为了强行一页牺牲可读性。相关性和清晰度永远比“塞得更多”更重要。'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openGuideTool('resume-craft:start-onboarding')}
                  aria-label={isEn ? 'Run the getting-started tour again' : '重新查看新手引导'}
                  className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 px-3.5 py-3 text-left hover:border-indigo-300 transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {isEn ? 'Need the 3-step interface tour?' : '还需要重新认识界面？'}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {isEn
                        ? 'Replay the short tour for the editor, toolbar, and starting options.'
                        : '重新运行三步新手引导，快速查看编辑区、工具栏和开始方式。'}
                    </div>
                  </div>
                  <Wand2 className="w-4 h-4 text-indigo-500 shrink-0" />
                </button>
              </motion.div>
            )}

          {activeTab === 'privacy' && (
            <motion.div
              key="help-tab-privacy"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-3.5"
            >
              <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-xl space-y-1">
                <h3 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {isEn ? 'Local-First Privacy Model' : '本地优先的数据与隐私模型'}
                </h3>
                <p className="text-emerald-800/90 dark:text-emerald-300/90">
                  {isEn
                    ? 'Resume drafts and settings stay in browser-local storage unless you explicitly create a share link. New share links keep their payload in the URL fragment so it is not sent to the hosting server as a request query. The app has no backend for persisting resume content.'
                    : '简历草稿与设置默认保存在浏览器本地；主动创建的新分享链接会把内容放在 URL fragment 中，不会作为请求查询参数发送给托管站点。应用本身不提供用于持久化简历内容的后端。'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  <Lock className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">
                      {isEn ? 'Browser-Local Storage' : '浏览器本地存储'}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      {isEn
                        ? 'Draft history, backup versions, and settings are primarily stored in browser localStorage.'
                        : '您的简历草稿、多版本备份与排版参数主要保存在浏览器 localStorage 中；请将设备、浏览器账户与本地备份视为敏感数据环境。'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">
                      {isEn ? 'Privacy Masking Toggle' : '一键脱敏模式 (Privacy Masking)'}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      {isEn
                        ? 'Enable "Privacy Mask" in Basic Info to obscure phone numbers and email addresses during screen sharing.'
                        : '在基本信息编辑器中开启「隐私遮蔽」，即可在屏幕共享或演示时自动掩码手机与邮箱，防止敏感信息泄漏。'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  <Lock className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">
                      {isEn ? 'Share-Link Security Model' : '分享链接的安全模型'}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      {isEn
                        ? 'Public share links are readable by anyone who receives the full link. Password-protected shares are encrypted locally in the browser before the link is created, and the password is not stored in the link. Encryption does not replace a strong password or safe delivery; send the password separately when possible.'
                        : '公开分享链接应视为“拿到完整链接即可读取”。密码保护分享会在浏览器本地加密后再生成链接，密码本身不会写入链接。加密不能替代强密码与安全传递；条件允许时请将密码与链接分开发送。'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  <Scale className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">
                      {isEn ? 'Tracking & Analytics' : '追踪与分析边界'}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      {isEn
                        ? 'Resume Craft uses Simple Analytics for coarse aggregate product metrics with a fixed event allowlist and no event metadata. It does not use tracking cookies, session replay, or browser fingerprinting. Resume, JD, contact, filenames, share payloads, access codes, and URL query/hash values are never sent as analytics data. If Do Not Track is enabled, the analytics script is not loaded. Fonts use local system stacks and are not fetched from third-party font CDNs.'
                        : 'Resume Craft 使用 Simple Analytics 统计少量聚合产品指标，仅允许固定事件名且不附带事件 metadata；不使用追踪 Cookie、会话回放或浏览器指纹，也不会发送简历、JD、联系方式、文件名、分享内容、访问口令或 URL 查询/哈希参数。若浏览器开启 Do Not Track，统计脚本不会加载。字体使用本机系统字体栈，不从第三方字体 CDN 拉取。'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'license' && (
            <motion.div
              key="help-tab-license"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-3.5"
            >
              <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <GithubIcon className="w-4 h-4" />
                    <span>Resume Craft · 简匠</span>
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-200/50 dark:border-indigo-800/50">
                    MIT License
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {isEn
                    ? 'An open-source, A4-focused Markdown resume builder designed for developers, designers, and job seekers.'
                    : '一款专为开发者、设计师与求职者打造的开源 A4 Markdown 简历编辑器。'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                  <span>{isEn ? 'GitHub Repository' : 'GitHub 官方开源仓库'}</span>
                  <a
                    href="https://github.com/kunlong-luo/resume-craft"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>kunlong-luo/resume-craft</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  {isEn
                    ? 'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction under the terms of the MIT License.'
                    : '依据 MIT 开源协议许可：任何个人和企业均可免费使用、修改和分发本源代码，不含任何强制性付费或隐藏条款。'}
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">
            Resume Craft · 简匠 v2.0.0 • Powered by React 19 & Vite
          </span>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/kunlong-luo/resume-craft/discussions"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackAnalyticsEvent('feedback_opened')}
              className="px-3 py-1.5 text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>{isEn ? 'Feedback' : '反馈'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={onClose}
              className="px-4 py-1.5 tactile-btn-primary tactile-btn-primary-hover text-white font-bold rounded-lg cursor-pointer"
            >
              {isEn ? 'Got it' : '我知道了'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
