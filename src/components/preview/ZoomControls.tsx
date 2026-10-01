import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, Scissors, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomSlider } from '../ui/CustomSlider';
import { Tooltip } from '../ui/Tooltip';

interface ZoomControlsProps {
  zoomMode: 'fit-width' | 'fit-page' | number;
  calculatedZoom: number;
  onZoomChange: (zoom: 'fit-width' | 'fit-page' | number) => void;
  showPageBreakLine?: boolean;
  onTogglePageBreakLine?: () => void;
  lang?: string;
}

export const ZoomControls: React.FC<ZoomControlsProps> = React.memo(({
  zoomMode,
  calculatedZoom,
  onZoomChange,
  showPageBreakLine = true,
  onTogglePageBreakLine,
  lang = 'zh',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 400);
  };

  const isEn = lang === 'en';
  const t = isEn ? {
    zoomOut: 'Zoom Out',
    zoomIn: 'Zoom In',
    zoomFitWidth: 'Fit Width',
    zoomFitPage: 'Fit Page',
    pageBreakOn: 'Hide A4 Page Cut Line',
    pageBreakOff: 'Show A4 Page Cut Line',
    zoomPillTip: 'Hover or click to adjust zoom & cut lines',
  } : {
    zoomOut: '缩小',
    zoomIn: '放大',
    zoomFitWidth: '适合宽度',
    zoomFitPage: '整页显示',
    pageBreakOn: '隐藏 A4 分页裁切线',
    pageBreakOff: '显示 A4 分页裁切线',
    zoomPillTip: '悬停或点击调整缩放与裁切线',
  };

  const displayZoomPercent = Math.round(calculatedZoom * 100);

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="absolute bottom-5 left-5 z-40 print:hidden hidden sm:flex items-center"
    >
      <AnimatePresence mode="wait">
        {!isHovered ? (
          /* Collapsed Floating Pill */
          <motion.div
            key="zoom-pill"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            onClick={() => setIsHovered(true)}
            className="flex items-center gap-2 h-10 px-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_24px_rgba(15,23,42,0.1)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] rounded-2xl cursor-pointer hover:shadow-[0_12px_32px_rgba(15,23,42,0.15)] hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
            title={t.zoomPillTip}
          >
            <div className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono font-extrabold text-slate-700 dark:text-slate-200">
                {displayZoomPercent}%
              </span>
            </div>
            
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60">
              {zoomMode === 'fit-width' ? t.zoomFitWidth : zoomMode === 'fit-page' ? t.zoomFitPage : `${displayZoomPercent}%`}
            </span>

            {showPageBreakLine && (
              <Scissors className="w-3 h-3 text-rose-500 opacity-80" />
            )}
          </motion.div>
        ) : (
          /* Expanded Full Controls Bar */
          <motion.div
            key="zoom-bar"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="flex items-center gap-2 h-10 px-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 shadow-[0_16px_40px_rgba(15,23,42,0.16)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)] rounded-2xl"
          >
            <div className="flex items-center gap-1">
              <Tooltip content={t.zoomOut} side="top">
                <button 
                  type="button"
                  onClick={() => {
                    const current = calculatedZoom;
                    const next = Math.max(0.5, Math.round((current - 0.05) * 100) / 100);
                    onZoomChange(next);
                  }}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                  aria-label={t.zoomOut}
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              
              <div className="flex items-center gap-2 px-1 w-24 md:w-32 transition-all">
                <CustomSlider
                  min={0.5}
                  max={1.5}
                  step={0.05}
                  value={calculatedZoom}
                  onChange={(val) => onZoomChange(val)}
                  colorTheme="indigo"
                  size="sm"
                />
              </div>

              <Tooltip content={t.zoomIn} side="top">
                <button 
                  type="button"
                  onClick={() => {
                    const current = calculatedZoom;
                    const next = Math.min(1.5, Math.round((current + 0.05) * 100) / 100);
                    onZoomChange(next);
                  }}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  aria-label={t.zoomIn}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            <div className="h-4 w-[1px] bg-slate-200/80 dark:bg-slate-800" />

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onZoomChange('fit-width')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  zoomMode === 'fit-width'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 shadow-sm font-sans'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent font-sans'
                }`}
              >
                {t.zoomFitWidth}
              </button>

              <button
                type="button"
                onClick={() => onZoomChange('fit-page')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  zoomMode === 'fit-page'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 shadow-sm font-sans'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent font-sans'
                }`}
              >
                {t.zoomFitPage}
              </button>
              
              <button
                type="button"
                onClick={() => onZoomChange(1.0)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  zoomMode === 1.0 
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 shadow-sm font-sans' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent font-sans'
                }`}
              >
                100%
              </button>
            </div>

            {onTogglePageBreakLine && (
              <>
                <div className="h-4 w-[1px] bg-slate-200/80 dark:bg-slate-800" />
                <Tooltip content={showPageBreakLine ? t.pageBreakOn : t.pageBreakOff} side="top">
                  <button
                    type="button"
                    onClick={onTogglePageBreakLine}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      showPageBreakLine
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{isEn ? 'Cut Line' : '裁切线'}</span>
                  </button>
                </Tooltip>
              </>
            )}

            <div className="h-4 w-[1px] bg-slate-200/80 dark:bg-slate-800" />

            <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 min-w-[36px] text-center pr-1 select-none">
              {displayZoomPercent}%
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default ZoomControls;
