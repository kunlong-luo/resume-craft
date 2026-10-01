import React, { useMemo } from 'react';
import { Check, Palette, Wand2 } from 'lucide-react';
import { H2Style, ResumeSettings } from '../../types';
import { useResumeStore } from '../../store/useResumeStore';
import { CustomColorPicker } from '../ui/CustomColorPicker';
import { SettingsPopover } from './SettingsPopover';
import { MASTER_PRESETS, THEME_COLOR_PALETTES, TOOLBAR_TRANSLATIONS } from './toolbar-presets';

interface StyleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function StyleDrawer({
  isOpen,
  onClose,
  triggerRef,
}: StyleDrawerProps) {
  const { settings, uiLanguage, updateSetting, updateSettings } = useResumeStore();
  const isEn = uiLanguage === 'en';
  const t = isEn ? TOOLBAR_TRANSLATIONS.en : TOOLBAR_TRANSLATIONS.zh;

  const visualThemes = useMemo(
    () =>
      MASTER_PRESETS.map((preset) => ({
        id: preset.id,
        name: isEn ? preset.nameEn : preset.name,
        settings: {
          themeColor: preset.settings.themeColor,
          customColor: preset.settings.customColor,
          h2Style: preset.settings.h2Style,
          topAccentLine: preset.settings.topAccentLine,
        } as Partial<ResumeSettings>,
      })),
    [isEn],
  );

  const isVisualThemeActive = (themeSettings: Partial<ResumeSettings>) =>
    Object.entries(themeSettings).every(
      ([key, value]) => settings[key as keyof ResumeSettings] === value,
    );

  const titleStyles: Array<{ value: H2Style; label: string }> = [
    { value: 'accent-line', label: t.titleStyleLine },
    { value: 'modern-badge', label: t.titleStyleBadge },
    { value: 'minimal-clean', label: t.titleStyleMinimal },
    { value: 'academic-line', label: t.titleStyleAcademic },
    { value: 'bracket-tag', label: t.titleStyleBracket },
  ];

  return (
    <SettingsPopover
      isOpen={isOpen}
      onClose={onClose}
      triggerRef={triggerRef}
      title={isEn ? 'Style' : '样式'}
      description={
        isEn
          ? 'Control visual theme, accent color, headings, and decoration.'
          : '管理视觉主题、强调色、章节标题和装饰效果。'
      }
      icon={<Palette className="h-4 w-4" />}
    >
      <div className="space-y-5">
        <section>
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            <Wand2 className="h-3.5 w-3.5 text-indigo-500" />
            {isEn ? 'Visual themes' : '视觉主题'}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {visualThemes.map((theme) => {
              const active = isVisualThemeActive(theme.settings);
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => updateSettings(theme.settings)}
                  aria-pressed={active}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    active
                      ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-500/10 dark:border-indigo-700 dark:bg-indigo-950/50'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2 text-[11px] font-black text-slate-800 dark:text-slate-100">
                    {theme.name}
                    {active && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />}
                  </span>
                  <span className="mt-1 block text-[9px] text-slate-400">
                    {isEn ? 'Visual only' : '仅调整视觉样式'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            {isEn ? 'Accent color' : '强调色'}
          </div>
          <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/60">
            {THEME_COLOR_PALETTES.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => updateSetting('themeColor', color.name)}
                aria-label={`${isEn ? 'Accent color' : '强调色'}: ${color.name}`}
                aria-pressed={settings.themeColor === color.name}
                className={`relative h-6 w-6 rounded-full ${color.bg} transition-transform hover:scale-110 ${
                  settings.themeColor === color.name
                    ? `ring-2 ring-offset-2 ${color.ring}`
                    : 'opacity-85 hover:opacity-100'
                }`}
              >
                {settings.themeColor === color.name && (
                  <Check className="absolute inset-0 m-auto h-3 w-3 stroke-[4] text-white" />
                )}
              </button>
            ))}

            <div className="ml-0.5 flex items-center gap-2 border-l border-slate-200 pl-2.5 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  updateSetting('themeColor', 'custom');
                  if (!settings.customColor) updateSetting('customColor', '#4f46e5');
                }}
                aria-label={isEn ? 'Custom accent color' : '自定义强调色'}
                className={`h-6 w-6 rounded-full border border-slate-300 dark:border-slate-600 ${
                  settings.themeColor === 'custom'
                    ? 'ring-2 ring-indigo-500/30 ring-offset-2'
                    : ''
                }`}
                style={{
                  background:
                    settings.themeColor === 'custom'
                      ? settings.customColor || '#4f46e5'
                      : 'conic-gradient(from 0deg, red, yellow, green, cyan, blue, magenta, red)',
                }}
              />
              {settings.themeColor === 'custom' && (
                <CustomColorPicker
                  value={settings.customColor || '#4f46e5'}
                  onChange={(color) => updateSetting('customColor', color)}
                  size="xs"
                />
              )}
            </div>
          </div>
        </section>

        <section className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            {isEn ? 'Section title style' : '章节标题样式'}
          </div>
          <div className="space-y-1.5">
            {titleStyles.map((option) => {
              const active = settings.h2Style === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateSetting('h2Style', option.value)}
                  aria-pressed={active}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-[11px] font-bold transition ${
                    active
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                  }`}
                >
                  <span>{option.label}</span>
                  <span
                    className={`h-1 w-16 rounded-full ${
                      active ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={() => updateSetting('topAccentLine', !settings.topAccentLine)}
            aria-pressed={settings.topAccentLine}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left dark:border-slate-700 dark:bg-slate-900"
          >
            <span>
              <span className="block text-[11px] font-black text-slate-800 dark:text-slate-100">
                {isEn ? 'Top accent line' : '顶部强调线'}
              </span>
              <span className="mt-0.5 block text-[9px] text-slate-400">
                {isEn ? 'Adds a subtle color line above the resume.' : '在简历顶部增加一条轻量强调色装饰。'}
              </span>
            </span>
            <span
              className={`relative h-5 w-9 rounded-full transition ${
                settings.topAccentLine ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  settings.topAccentLine ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`}
              />
            </span>
          </button>
        </section>
      </div>
    </SettingsPopover>
  );
}
