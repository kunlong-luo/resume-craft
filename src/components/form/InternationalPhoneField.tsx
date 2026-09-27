import React, { useEffect, useMemo, useState } from 'react';
import { Phone } from 'lucide-react';
import type { CountryCode } from 'libphonenumber-js/min';
import { useResumeStore } from '../../store/useResumeStore';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import {
  formatPhoneDraft,
  getPhoneRegionOptions,
  inferPhoneRegion,
  normalizePhoneForResume,
  reformatPhoneForCountry,
  type PhoneRegionCode,
} from '../../lib/phone-utils';

import { MarketRegion } from '../../types';

function getSavedRegion(profileId: string): PhoneRegionCode {
  const saved = storage.get<Record<string, PhoneRegionCode>>(
    STORAGE_KEYS.PHONE_REGIONS,
    {},
  );
  return saved[profileId] || '';
}

function getDefaultRegionFromMarket(market?: MarketRegion, lang: 'zh' | 'en' = 'zh'): PhoneRegionCode {
  if (market === 'us') return 'US';
  if (market === 'ca') return 'CA';
  if (market === 'uk') return 'GB';
  if (market === 'ie') return 'IE';
  if (market === 'cn') return 'CN';
  if (market === 'international') return lang === 'zh' ? 'CN' : 'US';
  return lang === 'zh' ? 'CN' : 'US';
}

function saveRegion(profileId: string, nextRegion: PhoneRegionCode) {
  const saved = storage.get<Record<string, PhoneRegionCode>>(
    STORAGE_KEYS.PHONE_REGIONS,
    {},
  );
  storage.set(STORAGE_KEYS.PHONE_REGIONS, {
    ...saved,
    [profileId]: nextRegion,
  });
}

interface InternationalPhoneFieldProps {
  value: string;
  onChange: (value: string) => void;
  lang: 'zh' | 'en';
  label: string;
  placeholder: string;
  marketRegion?: MarketRegion;
}

export function InternationalPhoneField({
  value,
  onChange,
  lang,
  label,
  placeholder,
  marketRegion,
}: InternationalPhoneFieldProps) {
  const activeProfileId = useResumeStore((state) => state.activeProfileId);
  const detectedRegion = inferPhoneRegion(value);
  const [region, setRegion] = useState<PhoneRegionCode>(
    detectedRegion || getSavedRegion(activeProfileId) || getDefaultRegionFromMarket(marketRegion, lang),
  );

  useEffect(() => {
    const detected = inferPhoneRegion(value);
    if (detected) {
      setRegion(detected);
      saveRegion(activeProfileId, detected);
      return;
    }

    setRegion(getSavedRegion(activeProfileId) || getDefaultRegionFromMarket(marketRegion, lang));
  }, [activeProfileId, marketRegion, lang]);

  useEffect(() => {
    const detected = inferPhoneRegion(value);
    if (detected && detected !== region) {
      setRegion(detected);
      saveRegion(activeProfileId, detected);
    }
  }, [activeProfileId, region, value]);

  const options = useMemo(() => getPhoneRegionOptions(lang), [lang]);
  const popular = options.filter((option) => option.priority);
  const other = options.filter((option) => !option.priority);

  const handleRegionChange = (next: string) => {
    const nextRegion = next as PhoneRegionCode;
    setRegion(nextRegion);
    saveRegion(activeProfileId, nextRegion);

    if (nextRegion && value.trim()) {
      onChange(reformatPhoneForCountry(value, nextRegion as CountryCode));
    }
  };

  const handlePhoneChange = (next: string) => {
    const formatted = formatPhoneDraft(next, region);
    onChange(formatted);

    const detected = inferPhoneRegion(formatted);
    if (detected) {
      setRegion(detected);
      saveRegion(activeProfileId, detected);
    }
  };

  const handleBlur = () => {
    if (!value.trim()) return;
    onChange(normalizePhoneForResume(value, region));
  };

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">
        {label}
      </label>

      <div className="grid grid-cols-[minmax(118px,0.8fr)_minmax(0,1.7fr)] gap-2">
        <div className="relative">
          <select
            value={region}
            onChange={(event) => handleRegionChange(event.target.value)}
            aria-label={lang === 'en' ? 'Country or region' : '国家或地区'}
            className="h-full min-h-10 w-full appearance-none rounded-lg border border-slate-200/90 bg-white px-2.5 pr-7 text-[11px] font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="">
              {lang === 'en' ? 'Country / region' : '国家 / 地区'}
            </option>
            <optgroup label={lang === 'en' ? 'Popular' : '常用地区'}>
              {popular.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name} +{option.callingCode}
                </option>
              ))}
            </optgroup>
            <optgroup label={lang === 'en' ? 'All countries & regions' : '全部国家与地区'}>
              {other.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name} +{option.callingCode}
                </option>
              ))}
            </optgroup>
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400"
          >
            ▾
          </span>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Phone className="w-4 h-4" />
          </span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={value}
            onChange={(event) => handlePhoneChange(event.target.value)}
            onBlur={handleBlur}
            className="w-full pl-9 pr-3 py-2 text-sm tactile-input font-mono text-slate-800 dark:text-slate-100"
            placeholder={placeholder}
            aria-label={label}
          />
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
        {lang === 'en'
          ? 'Choose a region for local numbers, or paste a full international number starting with +.'
          : '本地号码可先选择国家/地区；也可以直接粘贴以 + 开头的完整国际号码。'}
      </p>
    </div>
  );
}
