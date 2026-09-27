import React from 'react';
import { BookOpen, Columns, FileText, SlidersHorizontal } from 'lucide-react';
import { FontFamily, FontSize, MarketRegion, PaperMargin, TemplateLayout } from '../../types';
import { useResumeStore } from '../../store/useResumeStore';
import { CustomSlider } from '../ui/CustomSlider';
import { SettingsPopover } from './SettingsPopover';
import { TOOLBAR_TRANSLATIONS } from './toolbar-presets';
import { getMarketProfile, MARKET_REGIONS } from '../../lib/market-profile';

interface LayoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function LayoutDrawer({
  isOpen,
  onClose,
  triggerRef,
}: LayoutDrawerProps) {
  const { settings, updateSetting, updateSettings } = useResumeStore();
  const isEn = settings.lang === 'en';
  const t = isEn ? TOOLBAR_TRANSLATIONS.en : TOOLBAR_TRANSLATIONS.zh;
  const currentMarket: MarketRegion = settings.marketRegion || (isEn ? 'international' : 'cn');

  const marketLabels: Record<MarketRegion, string> = {
    us: isEn ? 'US' : '美国',
    ca: isEn ? 'Canada' : '加拿大',
    uk: isEn ? 'UK' : '英国',
    ie: isEn ? 'Ireland' : '爱尔兰',
    cn: isEn ? 'China' : '中国',
    international: isEn ? 'International' : '国际',
  };

  const handleMarketChange = (nextMarket: MarketRegion) => {
    if (nextMarket === currentMarket) return;

    const currentProfile = getMarketProfile(currentMarket);
    const nextProfile = getMarketProfile(nextMarket);
    const followsCurrentPaperDefault =
      !settings.paperSize || settings.paperSize === currentProfile.defaultPaperSize;
    const followsCurrentDateDefault =
      !settings.dateStyle || settings.dateStyle === currentProfile.dateStyle;

    updateSettings({
      marketRegion: nextMarket,
      ...(followsCurrentPaperDefault ? { paperSize: nextProfile.defaultPaperSize } : {}),
      ...(followsCurrentDateDefault ? { dateStyle: nextProfile.dateStyle } : {}),
    });
  };

  const layoutOptions: Array<{
    value: TemplateLayout;
    label: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      value: 'single',
      label: isEn ? 'Single column' : '单栏',
      description: isEn ? 'Classic and ATS-friendly' : '经典清晰，适合多数投递',
      icon: <FileText className="h-4 w-4" />,
    },
    {
      value: 'two-column',
      label: isEn ? 'Two columns' : '双栏',
      description: isEn ? 'Compact information layout' : '信息密度更高',
      icon: <Columns className="h-4 w-4" />,
    },
    {
      value: 'academic',
      label: isEn ? 'Academic' : '学术',
      description: isEn ? 'Research-oriented structure' : '适合科研和学术经历',
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      value: 'modern-card',
      label: isEn ? 'Card layout' : '卡片',
      description: isEn ? 'Modular visual sections' : '模块化视觉分区',
      icon: <SlidersHorizontal className="h-4 w-4" />,
    },
  ];

  const fontOptions: Array<{ value: FontFamily; label: string }> = [
    { value: 'sans', label: isEn ? 'Sans' : '黑体' },
    { value: 'serif', label: isEn ? 'Serif' : '宋体' },
    { value: 'mono', label: isEn ? 'Mono' : '等宽' },
  ];

  const spacingMode =
    settings.lineHeight <= 1.45 && settings.blockGap <= 0.7
      ? 'compact'
      : settings.lineHeight >= 1.75 || settings.blockGap >= 1.2
        ? 'spacious'
        : 'balanced';

  return (
    <SettingsPopover
      isOpen={isOpen}
      onClose={onClose}
      triggerRef={triggerRef}
      title={isEn ? 'Layout' : '排版'}
      description={
        isEn
          ? 'Control structure, typography, margins, and spacing.'
          : '管理版面结构、字体、字号、边距和间距。'
      }
      icon={<SlidersHorizontal className="h-4 w-4" />}
    >
      <div className="space-y-5">
        <section>
          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            {isEn ? 'Page layout' : '版面结构'}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {layoutOptions.map((option) => {
              const active = settings.templateLayout === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateSetting('templateLayout', option.value)}
                  aria-pressed={active}
                  className={`rounded-xl border p-3 text-left transition ${
                    active
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-500/10 dark:border-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-800 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-black">
                    <span className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>
                      {option.icon}
                    </span>
                    {option.label}
                  </div>
                  <p className="mt-1 text-[9px] leading-relaxed text-slate-400 dark:text-slate-500">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div>
            <div className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
              {isEn ? 'Target market' : '目标市场'}
            </div>
            <p className="text-[9px] leading-relaxed text-slate-400 dark:text-slate-500">
              {isEn
                ? 'Sets market guidance and recommended defaults. Paper size and date style remain independently editable.'
                : '用于市场化建议与推荐默认值；纸张和日期风格仍可独立调整。'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {MARKET_REGIONS.map((region) => {
              const active = currentMarket === region;
              return (
                <button
                  key={region}
                  type="button"
                  onClick={() => handleMarketChange(region)}
                  aria-pressed={active}
                  className={`rounded-lg border px-2 py-2 text-[9px] font-bold transition ${
                    active
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-800 dark:hover:bg-slate-800'
                  }`}
                >
                  {marketLabels[region]}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            {isEn ? 'Typography' : '文字排版'}
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {isEn ? 'Font' : '字体'}
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {fontOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateSetting('fontFamily', option.value)}
                  className={`rounded-lg px-2 py-2 text-[10px] font-bold transition ${
                    settings.fontFamily === option.value
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SegmentedSetting
              label={isEn ? 'Font size' : '字号'}
              value={settings.fontSize}
              options={[
                ['compact', t.fontSizeCompact],
                ['standard', t.fontSizeStandard],
                ['relaxed', t.fontSizeRelaxed],
              ] as Array<[FontSize, string]>}
              onChange={(value) => updateSetting('fontSize', value)}
            />
            <SegmentedSetting
              label={isEn ? 'Margins' : '页边距'}
              value={settings.margin}
              options={[
                ['compact', t.marginCompact],
                ['standard', t.marginStandard],
                ['relaxed', t.marginRelaxed],
              ] as Array<[PaperMargin, string]>}
              onChange={(value) => updateSetting('margin', value)}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span>{isEn ? 'Paper size' : '纸张规格'}</span>
              <span className="text-[9px] font-normal text-slate-400">
                {settings.paperSize === 'letter' ? '215.9 × 279.4 mm (US / CA)' : '210 × 297 mm (A4 markets)'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                aria-pressed={(settings.paperSize || 'a4') === 'a4'}
                onClick={() => updateSetting('paperSize', 'a4')}
                className={`rounded-lg px-2 py-1.5 text-[10px] font-bold transition ${
                  (settings.paperSize || 'a4') === 'a4'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                A4 (210 × 297 mm)
              </button>
              <button
                type="button"
                aria-pressed={settings.paperSize === 'letter'}
                onClick={() => updateSetting('paperSize', 'letter')}
                className={`rounded-lg px-2 py-1.5 text-[10px] font-bold transition ${
                  settings.paperSize === 'letter'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                US Letter (8.5 × 11 in)
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
              {isEn ? 'Spacing' : '间距'}
            </span>
            <button
              type="button"
              onClick={() => {
                updateSetting('lineHeight', 1.6);
                updateSetting('blockGap', 1.0);
                updateSetting('letterSpacing', 0);
              }}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
            >
              {isEn ? 'Reset' : '重置'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => {
                updateSetting('lineHeight', 1.4);
                updateSetting('blockGap', 0.6);
                updateSetting('letterSpacing', -0.01);
              }}
              aria-pressed={spacingMode === 'compact'}
              className={`rounded-lg px-2 py-1.5 text-[10px] font-bold transition ${
                spacingMode === 'compact'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {isEn ? 'Compact' : '紧凑'}
            </button>
            <button
              type="button"
              onClick={() => {
                updateSetting('lineHeight', 1.6);
                updateSetting('blockGap', 1.0);
                updateSetting('letterSpacing', 0);
              }}
              aria-pressed={spacingMode === 'balanced'}
              className={`rounded-lg px-2 py-1.5 text-[10px] font-bold transition ${
                spacingMode === 'balanced'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {isEn ? 'Balanced' : '标准'}
            </button>
            <button
              type="button"
              onClick={() => {
                updateSetting('lineHeight', 1.8);
                updateSetting('blockGap', 1.3);
                updateSetting('letterSpacing', 0.01);
              }}
              aria-pressed={spacingMode === 'spacious'}
              className={`rounded-lg px-2 py-1.5 text-[10px] font-bold transition ${
                spacingMode === 'spacious'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {isEn ? 'Spacious' : '宽松'}
            </button>
          </div>

          <CustomSlider
            label={isEn ? 'Line height' : '行高'}
            value={settings.lineHeight}
            onChange={(value) => updateSetting('lineHeight', value)}
            min={1.2}
            max={2.2}
            step={0.05}
            valueDisplay={settings.lineHeight.toFixed(2)}
            size="sm"
          />
          <CustomSlider
            label={isEn ? 'Section gap' : '段距'}
            value={settings.blockGap}
            onChange={(value) => updateSetting('blockGap', value)}
            min={0.3}
            max={2}
            step={0.05}
            valueDisplay={settings.blockGap.toFixed(2)}
            size="sm"
          />
          <CustomSlider
            label={isEn ? 'Letter spacing' : '字距'}
            value={settings.letterSpacing}
            onChange={(value) => updateSetting('letterSpacing', value)}
            min={-0.04}
            max={0.12}
            step={0.01}
            valueDisplay={`${settings.letterSpacing > 0 ? '+' : ''}${settings.letterSpacing.toFixed(2)}`}
            size="sm"
          />
        </section>
      </div>
    </SettingsPopover>
  );
}

function SegmentedSetting<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<[T, string]>;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="grid grid-cols-3 gap-0.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {options.map(([optionValue, optionLabel]) => (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className={`rounded-lg px-1 py-1.5 text-[9px] font-bold transition ${
              value === optionValue
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
