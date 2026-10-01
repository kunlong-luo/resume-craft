import React, { useState, useMemo } from 'react';
import { Target, Highlighter, CheckCircle, AlertTriangle, Info, FileText, RefreshCw } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { extractKeywordsFromJd, analyzeResumeMatch } from '../../lib/ats-utils';
import { trackAnalyticsEvent } from '../../lib/analytics';

export function AtsMatcher() {
  const { markdown, atsKeywords, setAtsKeywords, jdText, setJdText, uiLanguage } = useResumeStore();
  const isEn = uiLanguage === 'en';

  const [localJd, setLocalJd] = useState(jdText);

  // Sample JDs for users to test immediately with a single click
  const sampleJds = {
    frontend: isEn
      ? `We are looking for a Senior Frontend Engineer to build robust web applications.
Core Requirements:
- 5+ years of experience with React, TypeScript, and state managers like Redux or Zustand.
- Expert in modern build tools (Webpack, Vite) and high performance CSS (Tailwind CSS).
- Experience in CI/CD pipeline setup (Jenkins, GitHub Actions) and automated testing using Jest/Vitest.
- Strong distributed system awareness and web performance optimization skills.`
      : `核心岗位职责：
1. 负责核心业务的前端架构研发，熟练使用 React, TypeScript, Vite 构建大型高并发 Web 应用。
2. 配合后端团队设计 RESTful 接口，熟悉 Node.js & NestJS 异步全栈开发及 Redis 缓存优化。
3. 熟练掌握微前端架构设计，具备持续集成 CI/CD (Jenkins, GitLab CI) 及 Webpack 构建调优实战经验。
4. 追求极致性能优化，熟悉各种加载提速及工程化治理方案。`,
    backend: isEn
      ? `We are looking for a Senior Backend Software Architect.
Requirements:
- Strong knowledge in Java, Spring Boot, Spring Cloud, and MyBatis database layer.
- Proven experience with distributed systems, microservices, and high-concurrency architecture.
- Proficient in storage systems like MySQL database design, Redis caching, and Kafka/RabbitMQ message queue throttle.
- Hand-on experience with Docker, Kubernetes (K8s) container deployment and Elasticsearch query acceleration.`
      : `核心招聘需求：
1. 5年以上 Java 开发经验，深入掌握 Spring Boot, Spring Cloud 微服务高并发架构体系。
2. 熟练操作 MySQL 数据库设计与 SQL 慢查询调优，精通 Redis 热点缓存及高可用集群架构。
3. 熟悉 Kafka 消息队列和 RabbitMQ 并发削峰，拥有分布式高可用系统设计实战经验。
4. 熟练应用 Docker, Kubernetes (K8s) 容器化部署方案，熟悉 Linux 操作系统与 Shell 自动化运维脚本。`
  };

  const handleApplySample = (type: 'frontend' | 'backend') => {
    const text = sampleJds[type];
    setLocalJd(text);
    handleAnalyze(text);
  };

  const handleAnalyze = (textToAnalyze?: string) => {
    const text = textToAnalyze !== undefined ? textToAnalyze : localJd;
    setJdText(text);
    
    if (!text.trim()) {
      setAtsKeywords([]);
      return;
    }
    
    const keywords = extractKeywordsFromJd(text);
    setAtsKeywords(keywords);
    trackAnalyticsEvent('ats_check_completed');
  };

  const handleClear = () => {
    setLocalJd('');
    setJdText('');
    setAtsKeywords([]);
  };

  // Perform live analysis against current resume markdown
  const { score, matched, missing } = useMemo(() => {
    return analyzeResumeMatch(markdown, atsKeywords);
  }, [markdown, atsKeywords]);

  // Score visual tier
  const scoreColor = score >= 75 
    ? { border: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300', text: 'text-emerald-600 dark:text-emerald-400', ring: 'stroke-emerald-500', bar: 'bg-emerald-500', desc: isEn ? 'Highly Matched! Ready to send.' : '极佳匹配！简历与JD完美契合，可放心投递。' }
    : score >= 40
    ? { border: 'border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300', text: 'text-amber-600 dark:text-amber-400', ring: 'stroke-amber-500', bar: 'bg-amber-500', desc: isEn ? 'Good match. Consider adding missing skills.' : '匹配度良好。建议补充核心缺失的高频技术词以提高通过率。' }
    : { border: 'border-rose-200 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300', text: 'text-rose-600 dark:text-rose-400', ring: 'stroke-rose-500', bar: 'bg-rose-500', desc: isEn ? 'Low match. Critical keywords are missing.' : '匹配度偏低。建议根据下方分析，重点重构并补充相关工作技能。' };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 bg-slate-50/50 dark:bg-slate-900/40 scrollbar-thin">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          <span>{isEn ? 'Pure Frontend ATS Matcher' : '岗位 JD 匹配'}</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {isEn
            ? 'Instantly analyze technical keywords, compute match score, and pinpoint missing skills using instant offline tokenization. Keywords will glow elegantly in the Live Preview!'
            : '本地解析招聘需求并匹配核心技术栈，计算重合度。匹配成功的词汇将在右侧简历预览区高亮显示。'}
        </p>
      </div>

      {/* Input Form Area */}
      <div className="p-4 sm:p-5 space-y-3.5 tactile-card">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{isEn ? 'Paste Job Description (JD)' : '粘贴岗位招聘需求 (JD)'}</span>
          </label>
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={() => handleApplySample('frontend')}
              className="text-[10px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold transition-all cursor-pointer border border-slate-200/50 dark:border-slate-700"
            >
              {isEn ? '+ Frontend JD' : '+ 前端全栈JD'}
            </button>
            <button
              onClick={() => handleApplySample('backend')}
              className="text-[10px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold transition-all cursor-pointer border border-slate-200/50 dark:border-slate-700"
            >
              {isEn ? '+ Backend JD' : '+ 后端Java JD'}
            </button>
          </div>
        </div>

        <textarea
          value={localJd}
          onChange={(e) => setLocalJd(e.target.value)}
          placeholder={
            isEn
              ? "Paste requirements here (e.g., We are looking for a software developer with 3+ years of experience in React, Python, Docker...)"
              : "粘贴心仪岗位的职责描述与任职要求，例如：招聘前端开发工程师，熟练掌握 React, TypeScript, Webpack, 高并发性能优化..."
          }
          className="w-full h-32 p-3 text-xs tactile-input resize-none font-sans placeholder-slate-400 dark:placeholder-slate-500 rounded-xl"
        />

        <div className="flex gap-2">
          <button
            onClick={() => handleAnalyze()}
            disabled={!localJd.trim()}
            className="flex-1 py-2 rounded-lg tactile-btn-primary tactile-btn-primary-hover tactile-btn-primary-active disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-indigo-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            <span>{isEn ? 'Analyze Keyword Match' : '开始匹配'}</span>
          </button>
          {localJd && (
            <button
              onClick={handleClear}
              className="px-3.5 py-2 rounded-lg tactile-btn tactile-btn-hover tactile-btn-active text-slate-500 dark:text-slate-400 text-xs font-bold cursor-pointer"
            >
              {isEn ? 'Clear' : '清空'}
            </button>
          )}
        </div>
      </div>

      {/* Analysis Results Display */}
      {atsKeywords.length > 0 && (
        <div className="space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Score Card */}
          <div className={`p-4 rounded-xl border flex items-center gap-4 ${scoreColor.border} bg-white dark:bg-slate-900 shadow-sm`}>
            {/* Round radial gauge */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-16 h-16 -rotate-90">
                <circle cx="32" cy="32" r="28" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="5" />
                <circle 
                  cx="32" 
                  cy="32" 
                  r="28" 
                  className={`${scoreColor.ring} fill-none transition-all duration-500`} 
                  strokeWidth="5" 
                  strokeDasharray="175.9" 
                  strokeDashoffset={175.9 - (175.9 * score) / 100}
                />
              </svg>
              <span className="absolute text-sm font-black text-slate-800 dark:text-slate-100">{score}%</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {isEn ? 'ATS Matcher Score' : 'ATS 匹配度得分'}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${score >= 75 ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' : score >= 40 ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300' : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'}`}>
                  {score >= 75 ? (isEn ? 'High' : '高匹配') : score >= 40 ? (isEn ? 'Medium' : '良好') : (isEn ? 'Low' : '偏低')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {scoreColor.desc}
              </p>
            </div>
          </div>

          {/* Matches & Missing Badges Grid */}
          <div className="grid grid-cols-1 gap-3">
            {/* Matched Keywords */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>{isEn ? `Matched Keywords (${matched.length})` : `已匹配的关键词 (${matched.length})`}</span>
                </span>
              </div>
              {matched.length === 0 ? (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                  {isEn ? 'No keywords matched yet. Adjust your resume text.' : '暂无匹配的关键词，建议对照下方缺失清单进行补充。'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {matched.map((kw, i) => (
                    <span 
                      key={i} 
                      className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-semibold shadow-2xs animate-in zoom-in-95 duration-100"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Missing Keywords & Action Guidelines */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>{isEn ? `Missing High-Frequency Requirements (${missing.length})` : `重点缺失的技术/能力词 (${missing.length})`}</span>
                </span>
              </div>
              {missing.length === 0 ? (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  🎉 {isEn ? 'Perfect matching! All JD requirements are covered.' : '太棒了！招聘需求的全部关键技术均在简历中得到体现！'}
                </p>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {missing.map((kw, i) => (
                      <span 
                        key={i} 
                        className="text-[11px] px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 font-semibold"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>

                  <div className="p-3 bg-amber-50/40 dark:bg-amber-950/30 border border-amber-100/60 dark:border-amber-800/40 rounded-lg space-y-1">
                    <span className="text-[10px] uppercase font-extrabold text-amber-600 dark:text-amber-400 tracking-wider">
                      {isEn ? 'Action Recommendations' : '一键优化建议'}
                    </span>
                    <ul className="list-disc pl-3.5 space-y-1 text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      {missing.slice(0, 3).map((kw, i) => (
                        <li key={i}>
                          {isEn 
                            ? `Consider describing projects where you used ${kw} in your Work Experience section.`
                            : `岗位要求具备「${kw}」经验。建议在您的项目或工作经历中，补充体现该能力的具体产出（例如：“使用 ${kw} 解决了...问题，性能提升...%”）。`
                          }
                        </li>
                      ))}
                      {missing.length > 3 && (
                        <li>
                          {isEn 
                            ? `And ${missing.length - 3} other items. Add them to your Core Skills block.`
                            : `以及另外 ${missing.length - 3} 项核心词。可将它们梳理进您的「专业技能」板块中，提升初筛通过率。`
                          }
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Notification Accent */}
          <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/40 border border-indigo-100/60 dark:border-indigo-800/40 rounded-xl flex items-start gap-2 text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
            <Highlighter className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {isEn
                ? 'ATS Thermal Glow is active! Matched keywords are highlighted with a warm amber glowing underline in the preview pane.'
                : '匹配成功的关键词已在右侧预览区以亮金色高亮显示，方便您核对排版与词汇密度。'}
            </p>
          </div>
        </div>
      )}

      {/* Static helpful tips */}
      {atsKeywords.length === 0 && (
        <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 space-y-2 text-[11px]">
          <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>{isEn ? 'How to use pure-frontend matching' : '本地化匹配说明'}</span>
          </span>
          <p className="leading-relaxed">
            {isEn
              ? 'ATS matching runs locally in your browser. Resume and JD content are not sent to a remote ATS parsing service.'
              : 'ATS 匹配分析在本地浏览器运行，简历与 JD 正文不会发送到远程 ATS 解析服务。'}
          </p>
        </div>
      )}
    </div>
  );
}
