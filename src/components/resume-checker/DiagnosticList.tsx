import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { IssueItem } from '../../lib/resume-checker-utils';

interface DiagnosticListProps {
  issues: IssueItem[];
  lang?: string;
  onFixAll?: () => void;
}

export function DiagnosticList({ issues, lang, onFixAll }: DiagnosticListProps) {
  const isEn = lang === 'en';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fixableIssues = useMemo(() => issues.filter(i => i.fixable && i.onFix), [issues]);

  const categories = useMemo(() => {
    return [
      { id: 'all', label: isEn ? 'All' : '全部', count: issues.length },
      { id: 'market', label: isEn ? 'Market' : '市场合规', count: issues.filter(i => i.category === 'market').length },
      { id: 'ats', label: isEn ? 'ATS' : 'ATS 解析', count: issues.filter(i => i.category === 'ats').length },
      { id: 'content', label: isEn ? 'Content' : '内容表达', count: issues.filter(i => i.category === 'content').length },
      { id: 'formatting', label: isEn ? 'Layout' : '排版格式', count: issues.filter(i => i.category === 'formatting').length },
    ].filter(c => c.id === 'all' || c.count > 0);
  }, [issues, isEn]);

  const filteredIssues = useMemo(() => {
    if (selectedCategory === 'all') return issues;
    return issues.filter(i => i.category === selectedCategory);
  }, [issues, selectedCategory]);

  const handleFixAll = () => {
    if (onFixAll) {
      onFixAll();
      return;
    }
    // Sequentially invoke all onFix handlers
    fixableIssues.forEach(item => {
      if (item.onFix) item.onFix();
    });
  };

  return (
    <div className="space-y-4">
      {/* Diagnostics Title & Fix All Button */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          {isEn ? `Check Details (${issues.length} items)` : `检查详情 (${issues.length}项)`}
        </span>
        {fixableIssues.length > 0 && (
          <button
            type="button"
            onClick={handleFixAll}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[10px] font-bold rounded-lg shadow-xs shadow-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Zap className="w-3 h-3" />
            <span>{isEn ? `Fix All (${fixableIssues.length})` : `一键修复全部 (${fixableIssues.length})`}</span>
          </button>
        )}
      </div>

      {/* Category Pills */}
      {categories.length > 2 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      )}

      {/* Diagnostic Issues List */}
      <div className="space-y-3">
        {filteredIssues.map((issue, idx) => {
          let icon = null;
          let bgClass = '';
          let borderClass = '';
          let textClass = '';

          if (issue.type === 'error') {
            icon = <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
            bgClass = 'bg-rose-50/50 dark:bg-rose-950/40';
            borderClass = 'border-rose-100 dark:border-rose-900/50';
            textClass = 'text-rose-900 dark:text-rose-200';
          } else if (issue.type === 'warning') {
            icon = <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
            bgClass = 'bg-amber-50/40 dark:bg-amber-950/30';
            borderClass = 'border-amber-100/70 dark:border-amber-900/40';
            textClass = 'text-amber-900 dark:text-amber-200';
          } else {
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
            bgClass = 'bg-emerald-50/30 dark:bg-emerald-950/30';
            borderClass = 'border-emerald-100/60 dark:border-emerald-900/40';
            textClass = 'text-emerald-950 dark:text-emerald-200';
          }

          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`p-3.5 border rounded-xl flex items-start gap-3 transition-shadow hover:shadow-sm ${bgClass} ${borderClass}`}
            >
              {icon}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs font-bold ${textClass}`}>{issue.title}</p>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed text-justify">{issue.desc}</p>
                {issue.fixable && issue.onFix && (
                  <button
                    onClick={issue.onFix}
                    className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-[10px] font-bold rounded transition-all cursor-pointer shadow-xs shadow-indigo-600/20"
                  >
                    <Zap className="w-2.5 h-2.5" />
                    <span>{isEn ? 'Auto Fix' : '一键智能修正'}</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
