import React from 'react';
import { Ruler, AlertTriangle, Info, Zap, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeightGuardProps {
  metrics: {
    isOver: boolean;
    overflowPercent: number;
    overflowPixels?: number;
    actualPages?: number;
  };
  targetPageLimit: number;
  setTargetPageLimit: (limit: 1 | 2 | 3) => void;
  onSmartAutoFit?: () => void;
  isAutoFitting?: boolean;
  lang?: string;
  paperLabel?: string;
}

const TRANSLATIONS = {
  zh: {
    title: '纸张高度提醒',
    autoFitting: '正在排版缩合',
    overflow: '内容溢出 ⚠️',
    nearLimit: '临近边界 ⚠️',
    perfectFit: '高度契合 ✅',
    targetLimit: '目标限制',
     overflowWarningTitle: '内容已超出 {pages} 页 {paper} 高度！',
    overflowWarningDesc: '建议调整页边距、行高、模块间距或字号，使排版更契合。',
    nearLimitDesc: '内容接近分页线，打印时可能会产生多余的空白页。',
    perfectFitDesc: '布局合理，已完美契合目标页数，无跨页截断风险。',
    setTarget: '设定目标:',
    pageUnit: '页',
    autoFittingBtn: '正在自动微调间距...',
    autoFitBtn: '自动缩合至一页',
    optimizeBtn: '优化排版间距'
  },
  en: {
    title: 'Paper Height Guard',
    autoFitting: 'Auto Fitting',
    overflow: 'Overflow ⚠️',
    nearLimit: 'Near Limit ⚠️',
    perfectFit: 'Perfect Fit ✅',
    targetLimit: 'Target Limit',
     overflowWarningTitle: 'Content exceeds {pages} {paper} page(s)!',
    overflowWarningDesc: 'Adjust margin, line height, spacing, or font size to make it fit.',
    nearLimitDesc: 'Very close to page boundary. Printing might spill over slightly.',
    perfectFitDesc: 'Perfect size. Fits within the target page count without spilling.',
    setTarget: 'Set Target:',
    pageUnit: 'Page(s)',
    autoFittingBtn: 'Optimizing spacing...',
    autoFitBtn: 'Auto-Fit to Page',
    optimizeBtn: 'Smart Optimize Spacing'
  }
};

export const HeightGuard = React.memo(function HeightGuard({ 
  metrics, 
  targetPageLimit, 
  setTargetPageLimit, 
  onSmartAutoFit, 
  isAutoFitting,
  lang = 'zh',
  paperLabel = 'A4'
}: HeightGuardProps) {
  const t = lang === 'en' ? TRANSLATIONS.en : TRANSLATIONS.zh;

  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    try {
      return localStorage.getItem('height-guard-collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const toggleCollapse = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem('height-guard-collapsed', String(next));
    } catch (e) {}
  };

  const statusColorClass = isAutoFitting
    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 shadow-xs'
    : metrics.isOver
      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 shadow-xs'
      : metrics.overflowPercent > 92
        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 shadow-xs'
        : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-xs';

  return (
    <div className="absolute bottom-5 right-5 z-40 select-none print:hidden pointer-events-auto">
      <AnimatePresence mode="wait">
        {isCollapsed ? (
          <motion.button
            type="button"
            key="height-guard-pill"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            onClick={toggleCollapse}
            aria-label={lang === 'en' ? `Expand ${paperLabel} Height Guard` : `展开 ${paperLabel} 高度提醒`}
            title={lang === 'en' ? `Expand ${paperLabel} Height Guard` : `展开 ${paperLabel} 高度提醒`}
            className="flex items-center gap-2.5 h-10 px-3.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_24px_rgba(15,23,42,0.1)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] rounded-2xl cursor-pointer hover:shadow-[0_12px_32px_rgba(15,23,42,0.16)] transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600 group"
          >
            <div className="flex items-center gap-1.5">
              <Ruler className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${
                isAutoFitting
                  ? 'text-indigo-500 animate-spin'
                  : metrics.isOver
                    ? 'text-rose-500'
                    : metrics.overflowPercent > 92
                      ? 'text-amber-500'
                      : 'text-emerald-500'
              }`} />
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 font-sans">
                {lang === 'en' ? `${metrics.actualPages || 1} Page(s)` : `预估 ${metrics.actualPages || 1} 页`}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                ({metrics.overflowPercent}%)
              </span>
            </div>

            {/* Status text pill */}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition-colors ${statusColorClass}`}>
              {isAutoFitting ? t.autoFitting : metrics.isOver ? (lang === 'en' ? 'Overflow' : '溢出') : metrics.overflowPercent > 92 ? (lang === 'en' ? 'Near Limit' : '临近') : (lang === 'en' ? 'Fit' : '契合')}
            </span>

            <Maximize2 className="w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
          </motion.button>
        ) : (
          <motion.div 
            key="height-guard-card"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="max-w-[310px] w-full bg-white/95 dark:bg-slate-850/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/90 shadow-[0_16px_40px_rgba(15,23,42,0.18)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)] rounded-2xl p-4 flex flex-col gap-3 transition-all"
          >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{lang === 'en' ? `${paperLabel} Height Guard` : `${paperLabel} 高度提醒`}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition-colors ${
            isAutoFitting
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
              : metrics.isOver 
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' 
                : metrics.overflowPercent > 92 
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' 
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
          }`}>
            {isAutoFitting ? t.autoFitting : metrics.isOver ? t.overflow : metrics.overflowPercent > 92 ? t.nearLimit : t.perfectFit}
          </span>
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label={lang === 'en' ? `Collapse ${paperLabel} Height Guard` : `收起 ${paperLabel} 高度提醒`}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg transition-colors cursor-pointer"
            title={lang === 'en' ? `Collapse ${paperLabel} Height Guard` : `收起 ${paperLabel} 高度提醒`}
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Height gauge visual */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            {lang === 'en' ? 'Estimated Total:' : '预估排版页数:'} <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{metrics.actualPages || 1} {t.pageUnit}</strong>
          </span>
          <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
            {lang === 'en' ? 'Capacity:' : '容量:'} {metrics.overflowPercent}%
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-750 rounded-full overflow-hidden relative border border-slate-200/60 dark:border-slate-700">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              metrics.isOver 
                ? 'bg-gradient-to-r from-rose-500 to-rose-600' 
                : metrics.overflowPercent > 92 
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500' 
                  : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
            }`}
            style={{ width: `${Math.min(100, metrics.overflowPercent)}%` }}
          />
        </div>
      </div>

      {/* Warning messages if over */}
      {metrics.isOver ? (
        <div className="bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/60 rounded-xl p-2.5 flex flex-col gap-1.5">
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-rose-700 dark:text-rose-300 leading-normal">
              {t.overflowWarningTitle.replace('{pages}', String(targetPageLimit)).replace('{paper}', paperLabel)}
            </p>
          </div>
          <p className="text-[10px] text-rose-600 dark:text-rose-300/90 leading-relaxed pl-5 font-medium">
            {lang === 'en'
              ? `Over ${paperLabel} boundary by approx. ${Math.round(metrics.overflowPixels || 0)}px. Try switching to "Compact" margin, reducing line spacing, or clicking "Auto-Fit" below.`
              : `内容已超出 ${paperLabel} 边界约 ${Math.round(metrics.overflowPixels || 0)} 像素。建议启用“紧凑”边距、微调字号或点击下方按钮进行自动缩合。`
            }
          </p>
        </div>
      ) : metrics.overflowPercent > 92 ? (
        <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 rounded-xl p-2.5 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-normal font-medium">
            {t.nearLimitDesc}
          </p>
        </div>
      ) : (
        <p className="text-[10px] text-slate-400 dark:text-slate-400 leading-relaxed text-center py-0.5">
          {t.perfectFitDesc}
        </p>
      )}

      {/* Target limit selector */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-0.5">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t.setTarget}</span>
        <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg flex items-center border border-slate-200/50 dark:border-slate-700/50">
          {([1, 2, 3] as const).map(p => (
            <button
              key={p}
              onClick={() => setTargetPageLimit(p)}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                targetPageLimit === p 
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {p}{t.pageUnit}
            </button>
          ))}
        </div>
      </div>

      {/* Smart tuning button */}
      {onSmartAutoFit && (
        <button
          onClick={onSmartAutoFit}
          disabled={isAutoFitting}
          className={`flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer ${
            isAutoFitting
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
              : metrics.isOver 
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 shadow-md' 
                : 'bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${isAutoFitting ? 'animate-spin text-slate-400' : metrics.isOver ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
          <span>{isAutoFitting ? t.autoFittingBtn : metrics.isOver ? t.autoFitBtn : t.optimizeBtn}</span>
        </button>
      )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});


