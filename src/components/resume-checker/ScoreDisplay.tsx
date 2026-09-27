import React from 'react';
import { motion } from 'motion/react';
import { Globe2 } from 'lucide-react';
import { AnalysisResult } from '../../lib/resume-checker-utils';

interface ScoreDisplayProps {
  analysis: AnalysisResult;
  scoreBadge: {
    label: string;
    color: string;
    text: string;
  };
  lang?: string;
  compact?: boolean;
}

export function ScoreDisplay({ analysis, scoreBadge, lang, compact }: ScoreDisplayProps) {
  const isEn = lang === 'en';

  if (compact) {
    const scoreColorClass =
      analysis.score >= 90
        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
        : analysis.score >= 75
          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800'
          : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800';

    return (
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-xl px-3.5 py-2.5 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-black text-lg ${scoreColorClass}`}>
            {analysis.score}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${scoreBadge.color}`}>
                {scoreBadge.label}
              </span>
              {analysis.marketLabel && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <Globe2 className="w-3 h-3 text-indigo-500" />
                  <span className="truncate">{analysis.marketLabel}</span>
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
              {isEn ? 'Resume Competitiveness' : '简历竞争力评估'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
            {analysis.metricCount} {isEn ? 'metrics' : '项成果'}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            {isEn ? 'Quantified' : '量化表达'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score Ring Display */}
      <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-850 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-center relative overflow-hidden">
        <div className="absolute top-2.5 left-2.5">
          {analysis.marketLabel && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60">
              <Globe2 className="w-3 h-3" />
              <span>{analysis.marketLabel}</span>
            </span>
          )}
        </div>
        <div className="absolute top-2.5 right-2.5">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${scoreBadge.color}`}>
            {scoreBadge.label}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 pt-2">
          {/* Visual Gauge */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle 
                cx="56" 
                cy="56" 
                r="46" 
                className="stroke-slate-100 dark:stroke-slate-800" 
                strokeWidth="8" 
                fill="transparent" 
              />
              <motion.circle 
                cx="56" 
                cy="56" 
                r="46" 
                className={
                  analysis.score >= 90 ? 'stroke-emerald-500' :
                  analysis.score >= 75 ? 'stroke-blue-500' : 'stroke-rose-500'
                }
                strokeWidth="8.5" 
                fill="transparent" 
                strokeDasharray={289}
                initial={{ strokeDashoffset: 289 }}
                animate={{ strokeDashoffset: 289 - (289 * analysis.score) / 100 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">
                {analysis.score}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                {isEn ? 'Score' : 'Score分'}
              </span>
            </div>
          </div>

          <div className="mt-2 space-y-1">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {isEn ? 'Resume Competitiveness Score' : '简历竞争力得分'}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 px-3">
              {isEn 
                ? 'Evaluated based on information integrity, market compliance, action verbs, and ATS metrics.'
                : '根据基本信息完整度、目标市场合规风控、动词质量与 ATS 友好度智能演算'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-center transition-colors">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 mb-0.5">
            {isEn ? 'Quantified Results' : '量化成果指标'}
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className={`text-lg font-black ${analysis.metricCount >= 5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {analysis.metricCount}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {isEn ? 'item(s)' : '个'}
            </span>
          </div>
        </div>
        <div className="bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-center transition-colors">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 mb-0.5">
            {isEn ? 'Action Verbs' : '强行动词数'}
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {analysis.foundVerbsCount}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {isEn ? 'word(s)' : '个'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
