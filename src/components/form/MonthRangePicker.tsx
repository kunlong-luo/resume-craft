import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Check, X, RotateCcw } from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';
import { CustomCheckbox } from '../ui/CustomCheckbox';
import { Tooltip } from '../ui/Tooltip';
import { DateStyle, MarketRegion } from '../../types';
import { getMarketProfile } from '../../lib/market-profile';
import {
  parseDateRange,
  formatDateRange,
  MONTH_NAMES_SHORT,
  MONTH_NAMES_LONG,
} from '../../lib/date-parser';

interface MonthRangePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  lang?: string;
  leftIcon?: React.ReactNode;
  showPresentToggle?: boolean;
  dateStyle?: DateStyle;
  marketRegion?: MarketRegion;
}

export function MonthRangePicker({
  value,
  onChange,
  placeholder = '',
  className = '',
  lang = 'zh',
  leftIcon,
  showPresentToggle = false,
  dateStyle,
  marketRegion,
}: MonthRangePickerProps) {
  const isEn = lang === 'en';
  const effectiveDateStyle: DateStyle =
    dateStyle || (marketRegion ? getMarketProfile(marketRegion).dateStyle : (isEn ? 'month-short' : 'cn-dot'));

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse existing value e.g. "2021.09 - 2024.06" or "Mar 2021 – Present"
  const currentYearStr = String(new Date().getFullYear());
  const [startYear, setStartYear] = useState(currentYearStr);
  const [startMonth, setStartMonth] = useState('09');
  const [endYear, setEndYear] = useState(currentYearStr);
  const [endMonth, setEndMonth] = useState('06');
  const [isOngoing, setIsOngoing] = useState(false);

  // Generate Year Options: from currentYear + 4 down to 50 years ago
  const years = useMemoYears();

  function useMemoYears() {
    const cy = new Date().getFullYear();
    const result = [];
    for (let i = cy + 4; i >= cy - 50; i--) {
      result.push(String(i));
    }
    return result;
  }

  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  // Handle parsing when opening the picker using robust parseDateRange
  useEffect(() => {
    if (isOpen && value) {
      const parsed = parseDateRange(value);
      if (parsed) {
        if (parsed.start?.year) {
          setStartYear(String(parsed.start.year));
        }
        if (parsed.start?.month) {
          setStartMonth(String(parsed.start.month).padStart(2, '0'));
        }

        if (parsed.hasRange && parsed.end) {
          if (parsed.end.isPresent) {
            setIsOngoing(true);
          } else {
            setIsOngoing(false);
            if (parsed.end.year) {
              setEndYear(String(parsed.end.year));
            }
            if (parsed.end.month) {
              setEndMonth(String(parsed.end.month).padStart(2, '0'));
            }
          }
        }
      }
    }
  }, [isOpen, value]);

  // Handle click outside to close the picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target && target.closest('[data-custom-select-portal="true"]')) {
        return;
      }
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleApply = () => {
    const startStr = `${startYear}.${startMonth}`;
    const endStr = isOngoing ? '至今' : `${endYear}.${endMonth}`;
    const rawRange = `${startStr} - ${endStr}`;
    const formatted = formatDateRange(rawRange, effectiveDateStyle, isEn);
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onChange('');
    setIsOpen(false);
  };

  const isEndingWithPresent = /(至今|present|现在|current|now|毕业)/i.test(value);

  const handleTogglePresentQuickly = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cy = new Date().getFullYear();
    const cm = String(new Date().getMonth() + 1).padStart(2, '0');

    if (!value.trim()) {
      const raw = `${cy}.01 - 至今`;
      onChange(formatDateRange(raw, effectiveDateStyle, isEn));
      return;
    }

    const parsed = parseDateRange(value);
    if (!parsed || !parsed.start) {
      const raw = `${cy}.01 - 至今`;
      onChange(formatDateRange(raw, effectiveDateStyle, isEn));
      return;
    }

    const startStr = `${parsed.start.year || cy}.${String(parsed.start.month || 1).padStart(2, '0')}`;
    if (isEndingWithPresent) {
      const raw = `${startStr} - ${cy}.${cm}`;
      onChange(formatDateRange(raw, effectiveDateStyle, isEn));
    } else {
      const raw = `${startStr} - 至今`;
      onChange(formatDateRange(raw, effectiveDateStyle, isEn));
    }
  };

  const getMonthLabel = (m: string) => {
    const mNum = parseInt(m, 10);
    if (effectiveDateStyle === 'month-short') {
      return MONTH_NAMES_SHORT[mNum - 1];
    }
    if (effectiveDateStyle === 'month-long') {
      return MONTH_NAMES_LONG[mNum - 1];
    }
    return `${m}${isEn ? '' : '月'}`;
  };

  const cleanedClassName = className
    .split(' ')
    .filter(c => !/^(px-|pr-|pl-)/.test(c))
    .join(' ');

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-slate-400 z-10 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${leftIcon ? 'pl-9' : 'pl-2.5'} ${showPresentToggle ? 'pr-16' : 'pr-8'} ${cleanedClassName}`}
          placeholder={placeholder}
        />
        <div className="absolute right-1 flex items-center gap-1 z-10">
          {showPresentToggle && (
            <Tooltip content={isEn ? "Toggle Present status" : "一键切换至今状态"} side="top">
              <button
                type="button"
                onClick={handleTogglePresentQuickly}
                className={`text-[10px] px-1.5 py-0.5 rounded border transition-all cursor-pointer font-bold select-none ${
                  isEndingWithPresent
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 border-slate-200/80 dark:border-slate-700 hover:text-slate-700'
                }`}
              >
                {isEn ? 'Present' : '至今'}
              </button>
            </Tooltip>
          )}
          <Tooltip content={isEn ? "Open Date Picker" : "打开日期选择器"} side="top">
            <button
              type="button"
              aria-label={isEn ? 'Open date picker' : '打开日期选择器'}
              aria-expanded={isOpen}
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-label={isEn ? 'Select period' : '选择起止时间'}
          className="absolute bottom-full right-0 mb-2 w-80 max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-1.5rem)] overflow-y-auto sm:bottom-auto sm:top-full sm:mb-0 sm:mt-2 sm:w-[410px] sm:max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_20px_48px_rgba(30,41,59,0.14)] dark:shadow-[0_20px_48px_rgba(0,0,0,0.5)] rounded-2xl p-3.5 sm:p-4.5 z-50 flex flex-col gap-3.5 sm:gap-4 animate-in fade-in slide-in-from-top-2 duration-200 scrollbar-thin">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              {isEn ? 'Select Period' : '选择起止时间'}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Start Date Panel */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                  {isEn ? 'Start' : '起始时间'}
                </span>
                <CustomSelect
                  value={startYear}
                  onChange={(val) => setStartYear(val)}
                  options={years.map(y => ({ value: y, label: y }))}
                  size="xs"
                  align="right"
                  maxMenuHeight="max-h-44"
                  triggerClassName="font-bold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-md px-2 py-0.5 text-slate-700 dark:text-slate-200"
                />
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-4 gap-1">
                {months.map(m => {
                  const isSelected = startMonth === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setStartMonth(m)}
                      className={`py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {getMonthLabel(m)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* End Date Panel */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                    {isEn ? 'End' : '结束时间'}
                  </span>
                  <CustomCheckbox
                    checked={isOngoing}
                    onChange={(checked) => setIsOngoing(checked)}
                    label={<span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{isEn ? 'Present' : '至今'}</span>}
                    size="sm"
                    colorTheme="indigo"
                  />
                </div>
                
                <CustomSelect
                  disabled={isOngoing}
                  value={endYear}
                  onChange={(val) => setEndYear(val)}
                  options={years.map(y => ({ value: y, label: y }))}
                  size="xs"
                  align="right"
                  maxMenuHeight="max-h-44"
                  triggerClassName={`font-bold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-md px-2 py-0.5 text-slate-700 dark:text-slate-200 ${
                    isOngoing ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100 dark:bg-slate-850' : ''
                  }`}
                />
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-4 gap-1">
                {months.map(m => {
                  const isSelected = !isOngoing && endMonth === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={isOngoing}
                      onClick={() => setEndMonth(m)}
                      className={`py-1 text-[11px] font-bold rounded-lg transition-all ${
                        isOngoing
                          ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                          : isSelected
                          ? 'bg-indigo-600 text-white shadow-sm cursor-pointer'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
                      }`}
                    >
                      {getMonthLabel(m)}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-1">
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-750 hover:bg-rose-50/20 dark:hover:bg-rose-950/30 hover:border-rose-200 dark:hover:border-rose-800 transition-all cursor-pointer flex items-center gap-1 active:translate-y-px"
            >
              <RotateCcw className="w-3 h-3" />
              {isEn ? 'Clear' : '清除'}
            </button>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                {isEn ? 'Cancel' : '取消'}
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 active:translate-y-px shadow-sm"
              >
                <Check className="w-3 h-3" />
                {isEn ? 'Apply' : '确定'}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
