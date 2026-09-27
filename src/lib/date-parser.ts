import { DateStyle } from '../types';

export interface ParsedDatePoint {
  raw: string;
  year?: number;
  month?: number; // 1-12
  isPresent?: boolean;
}

export interface ParsedDateRange {
  raw: string;
  start?: ParsedDatePoint;
  end?: ParsedDatePoint;
  hasRange: boolean;
}

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const MONTH_NAMES_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

// Recognize present/ongoing words across Chinese and English
export const PRESENT_REGEX = /^(?:至今|现在|目前|现今|present|Present|current|Current|now|Now|ongoing|Ongoing|毕业)$/i;

// Regex to capture date expressions including:
// 1. English month + year: "March 2024", "Mar 2024", "Mar. 2024", "03/2024"
// 2. Numeric dot/dash/slash: "2024.03", "2024-03", "2024/03", "2024年03月"
// 3. Year only: "2024", "2024年"
export const DATE_POINT_PATTERN_STR = 
  '(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.,]?\\s*(?:19|20)\\d{2}' +
  '|(?:19|20)\\d{2}(?:[.\\-/年]\\d{1,2}(?:[月.\\-/]\\d{1,2})?|年)?' +
  '|\\d{1,2}[/\\-.](?:19|20)\\d{2}' +
  '|至今|现在|目前|现今|present|Present|current|Current|now|Now|毕业)';

// Range separator: " - ", " – ", " — ", " ~ ", " ～ ", " 至 ", " 到 "
export const RANGE_SEP_REGEX = /\s*(?:[-—–―~～至到]|--+)\s*/;

export const DATE_RANGE_REGEX = new RegExp(
  `(${DATE_POINT_PATTERN_STR})\\s*(?:[-—–―~～至到]|--+)\\s*(${DATE_POINT_PATTERN_STR})`,
  'i'
);

// Match standalone date point or full range, optionally enclosed in markdown bold/italic formatting (* or _)
export const COMPREHENSIVE_DATE_REGEX = new RegExp(
  `(?<=^|[\\s|｜·•●▪/／~～至到—–\\-])[*_]*(?:(${DATE_POINT_PATTERN_STR})\\s*(?:[-—–―~～至到]|--+)\\s*(${DATE_POINT_PATTERN_STR})|\\b(?:19|20)\\d{2}(?:[.\\-/年]\\d{1,2})?\\b|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.,]?\\s*(?:19|20)\\d{2})[*_]*`,
  'i'
);

export function parseDatePoint(str: string): ParsedDatePoint | null {
  const clean = str.replace(/[*_]/g, '').trim();
  if (!clean) return null;

  if (PRESENT_REGEX.test(clean)) {
    return { raw: clean, isPresent: true };
  }

  // 1. English month word + year: e.g. "March 2024", "Mar 2024", "Mar. 2024"
  const enMatch = clean.match(/^([a-zA-Z]{3,9})[.,]?\s+((?:19|20)\d{2})$/i);
  if (enMatch) {
    const monthKey = enMatch[1].toLowerCase().replace(/\./g, '');
    const month = MONTH_MAP[monthKey];
    const year = parseInt(enMatch[2], 10);
    if (month && year) {
      return { raw: clean, year, month };
    }
  }

  // 2. Year first: e.g. "2024.03", "2024-3", "2024/03", "2024年3月", "2024年"
  const yrFirstMatch = clean.match(/^((?:19|20)\d{2})(?:[.\-/年](\d{1,2}))?/);
  if (yrFirstMatch) {
    const year = parseInt(yrFirstMatch[1], 10);
    const month = yrFirstMatch[2] ? parseInt(yrFirstMatch[2], 10) : undefined;
    return { raw: clean, year, month };
  }

  // 3. Month first numeric: e.g. "03/2024", "3-2024"
  const mFirstMatch = clean.match(/^(\d{1,2})[/.-]((?:19|20)\d{2})$/);
  if (mFirstMatch) {
    const month = parseInt(mFirstMatch[1], 10);
    const year = parseInt(mFirstMatch[2], 10);
    if (month >= 1 && month <= 12) {
      return { raw: clean, year, month };
    }
  }

  return { raw: clean };
}

export function parseDateRange(str: string): ParsedDateRange | null {
  const clean = str.replace(/[*_]/g, '').trim();
  if (!clean) return null;

  const match = clean.match(DATE_RANGE_REGEX);
  if (match) {
    const startPoint = parseDatePoint(match[1]);
    const endPoint = parseDatePoint(match[2]);
    return {
      raw: clean,
      start: startPoint || undefined,
      end: endPoint || undefined,
      hasRange: true,
    };
  }

  // Single date point (e.g. "2024.03" or "March 2024")
  const single = parseDatePoint(clean);
  if (single && (single.year || single.isPresent)) {
    return {
      raw: clean,
      start: single,
      hasRange: false,
    };
  }

  return null;
}

export function formatDatePoint(
  point: ParsedDatePoint,
  style: DateStyle = 'cn-dot',
  isEn: boolean = false
): string {
  if (point.isPresent) {
    return isEn ? 'Present' : '至今';
  }

  const { year, month } = point;
  if (!year) return point.raw;

  if (style === 'month-short') {
    if (month && month >= 1 && month <= 12) {
      return `${MONTH_NAMES_SHORT[month - 1]} ${year}`;
    }
    return `${year}`;
  }

  if (style === 'month-long') {
    if (month && month >= 1 && month <= 12) {
      return `${MONTH_NAMES_LONG[month - 1]} ${year}`;
    }
    return `${year}`;
  }

  // cn-dot: "2024.03" or "2024"
  if (month && month >= 1 && month <= 12) {
    const paddedMonth = month < 10 ? `0${month}` : `${month}`;
    return `${year}.${paddedMonth}`;
  }
  return `${year}`;
}

export function formatDateRange(
  rawRangeStr: string,
  style: DateStyle = 'cn-dot',
  isEn: boolean = false
): string {
  const parsed = parseDateRange(rawRangeStr);
  if (!parsed || !parsed.start) {
    return rawRangeStr;
  }

  const rangeSeparator = isEn ? ' – ' : ' — ';

  const formattedStart = formatDatePoint(parsed.start, style, isEn);
  if (parsed.hasRange && parsed.end) {
    const formattedEnd = formatDatePoint(parsed.end, style, isEn);
    return `${formattedStart}${rangeSeparator}${formattedEnd}`;
  }

  return formattedStart;
}
