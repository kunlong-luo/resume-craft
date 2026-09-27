import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/min';

export type PhoneRegionCode = CountryCode | '';

export function getDefaultPhoneRegionForLocale(
  locale: 'zh' | 'en',
): PhoneRegionCode {
  return locale === 'zh' ? 'CN' : '';
}

export interface PhoneRegionOption {
  code: CountryCode;
  callingCode: string;
  name: string;
  englishName: string;
  priority: boolean;
}

export interface PhoneAnalysis {
  raw: string;
  display: string;
  e164?: string;
  country?: CountryCode;
  callingCode?: string;
  isValid: boolean;
  isPossible: boolean;
  isInternational: boolean;
}

const PRIORITY_REGIONS: CountryCode[] = [
  'CN',
  'HK',
  'MO',
  'TW',
  'SG',
  'US',
  'CA',
  'GB',
  'IE',
  'AU',
  'NZ',
  'MY',
  'PH',
  'IN',
  'ZA',
  'AE',
  'DE',
  'FR',
  'NL',
  'CH',
  'SE',
  'NO',
  'DK',
  'FI',
  'ES',
  'IT',
  'PT',
  'BE',
  'AT',
];

const PLACEHOLDER_DIGITS = new Set([
  '13800000000',
  '13812345678',
  '1234567890',
  '12345678901',
  '0000000000',
  '00000000000',
]);

function getDisplayNames(locale: 'zh' | 'en') {
  try {
    return new Intl.DisplayNames([locale === 'zh' ? 'zh-Hans' : 'en'], {
      type: 'region',
    });
  } catch {
    return null;
  }
}

function regionName(code: CountryCode, locale: 'zh' | 'en') {
  return getDisplayNames(locale)?.of(code) || code;
}

function englishRegionName(code: CountryCode) {
  return getDisplayNames('en')?.of(code) || code;
}

export function getPhoneRegionOptions(
  locale: 'zh' | 'en',
): PhoneRegionOption[] {
  const countries = getCountries();
  const prioritySet = new Set(PRIORITY_REGIONS);

  return countries
    .map((code) => ({
      code,
      callingCode: getCountryCallingCode(code),
      name: regionName(code, locale),
      englishName: englishRegionName(code),
      priority: prioritySet.has(code),
    }))
    .sort((a, b) => {
      const aPriority = PRIORITY_REGIONS.indexOf(a.code);
      const bPriority = PRIORITY_REGIONS.indexOf(b.code);

      if (aPriority !== -1 || bPriority !== -1) {
        if (aPriority === -1) return 1;
        if (bPriority === -1) return -1;
        return aPriority - bPriority;
      }

      return a.name.localeCompare(b.name, locale === 'zh' ? 'zh-Hans' : 'en');
    });
}

export function inferPhoneRegion(value: string): PhoneRegionCode {
  const trimmed = value.trim();
  if (!trimmed.startsWith('+')) return '';

  try {
    return parsePhoneNumberFromString(trimmed)?.country || '';
  } catch {
    return '';
  }
}

export function formatPhoneDraft(
  value: string,
  country?: PhoneRegionCode,
): string {
  const trimmed = value.trimStart();
  if (!trimmed) return '';

  try {
    if (trimmed.startsWith('+')) {
      return new AsYouType().input(trimmed);
    }

    if (country) {
      return new AsYouType(country).input(trimmed);
    }
  } catch {
    // Keep the user's input when a partial number cannot be formatted yet.
  }

  return trimmed.replace(/[^\d+().\-\s]/g, '');
}

export function analyzePhoneNumber(
  value: string,
  country?: PhoneRegionCode,
): PhoneAnalysis {
  const raw = value.trim();
  const digits = raw.replace(/\D/g, '');

  if (!raw || PLACEHOLDER_DIGITS.has(digits)) {
    return {
      raw,
      display: raw,
      isValid: false,
      isPossible: false,
      isInternational: raw.startsWith('+'),
    };
  }

  try {
    const parsed = raw.startsWith('+')
      ? parsePhoneNumberFromString(raw)
      : country
        ? parsePhoneNumberFromString(raw, country)
        : undefined;

    if (parsed) {
      return {
        raw,
        display: parsed.formatInternational(),
        e164: parsed.number,
        country: parsed.country,
        callingCode: parsed.countryCallingCode,
        isValid: parsed.isValid(),
        isPossible: parsed.isPossible(),
        isInternational: raw.startsWith('+'),
      };
    }
  } catch {
    // Fall through to permissive legacy handling.
  }

  const phoneLike = digits.length >= 7 && digits.length <= 15;
  return {
    raw,
    display: raw,
    isValid: false,
    isPossible: phoneLike,
    isInternational: raw.startsWith('+'),
  };
}

export function normalizePhoneForResume(
  value: string,
  country?: PhoneRegionCode,
): string {
  const analysis = analyzePhoneNumber(value, country);

  if (analysis.e164 && (analysis.isValid || analysis.isPossible)) {
    return analysis.display;
  }

  return formatPhoneDraft(value, country).trim();
}

export function reformatPhoneForCountry(
  value: string,
  country: CountryCode,
): string {
  const raw = value.trim();
  if (!raw) return '';

  try {
    const parsed = raw.startsWith('+')
      ? parsePhoneNumberFromString(raw)
      : undefined;

    const national = parsed?.nationalNumber || raw.replace(/\D/g, '');
    return new AsYouType(country).input(national);
  } catch {
    return raw;
  }
}

export function findPhoneCandidate(text: string): PhoneAnalysis | null {
  const candidates =
    text.match(/(?:\+\d[\d\s().-]{6,24}\d)|(?:\b\d[\d\s().-]{6,18}\d\b)/g) ||
    [];

  for (const candidate of candidates) {
    if (candidate.trim().startsWith('+')) {
      const international = analyzePhoneNumber(candidate);
      if (international.isValid || international.isPossible) {
        return international;
      }
      continue;
    }

    const digits = candidate.replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) {
      return {
        raw: candidate.trim(),
        display: candidate.trim(),
        isValid: false,
        isPossible: true,
        isInternational: false,
      };
    }
  }

  return null;
}
