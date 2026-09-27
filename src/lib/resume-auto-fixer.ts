import { formatChineseEnglishSpacing } from './format-utils';
import { parseMarkdownToForm, parseFormToMarkdown } from './markdown-parser';
import { DATE_RANGE_REGEX, formatDateRange } from './date-parser';
import { getMarketProfile } from './market-profile';
import { MarketRegion, DateStyle } from '../types';

export interface AutoCleanResult {
  cleanedMarkdown: string;
  hasChanges: boolean;
  fixesCount: number;
  details: {
    missingSpacesFixed: number;
    consecutiveBlankLinesFixed: number;
    trailingSpacesFixed: number;
    asteriskSpacingFixed: number;
    datesNormalized: number;
    sensitiveFieldsSanitized: number;
  };
}

/**
 * Normalizes all date ranges in the markdown to the specified or market-standard format.
 */
export function normalizeAllDatesInMarkdown(
  markdown: string,
  dateStyle: DateStyle = 'month-short',
  isEn: boolean = false
): { markdown: string; convertedCount: number } {
  let convertedCount = 0;
  const dateRangeRegex = new RegExp(DATE_RANGE_REGEX.source, 'gi');

  const normalized = markdown
    .split('\n')
    .map((line) => {
      // Structured resume item dates live in item headings. Patching only the
      // matched date range keeps all unrelated custom Markdown byte-for-byte.
      if (!/^#{3,4}\s+/.test(line)) return line;

      return line.replace(dateRangeRegex, (rawRange) => {
        const formatted = formatDateRange(rawRange, dateStyle, isEn);
        if (!formatted || formatted === rawRange) return rawRange;
        convertedCount++;
        return formatted;
      });
    })
    .join('\n');

  return {
    markdown: convertedCount > 0 ? normalized : markdown,
    convertedCount,
  };
}

/**
 * Sanitizes discouraged personal details (photo, age, gender, marital status, nationality)
 * for US/UK/CA/IE/International compliance with anti-discrimination employment practices.
 */
export function sanitizeSensitiveFieldsForMarket(
  markdown: string
): { markdown: string; sanitizedFieldsCount: number } {
  let text = markdown;
  let count = 0;

  // 1. Remove markdown images / photo tags: ![...](...) or <img ... />
  const imgRegex = /!\[.*?\]\(.*?\)|<img[^>]*>/gi;
  if (imgRegex.test(text)) {
    count++;
    text = text.replace(imgRegex, '');
  }

  // 2. Direct regex sweep on header contact tags for age/gender/marital
  const sensitivePatterns = [
    /(?:[|｜·•\s]*\b\d{1,2}\s*岁\b[|｜·•\s]*)/g,
    /(?:[|｜·•\s]*\b\d{1,2}\s*years?\s*old\b[|｜·•\s]*)/gi,
    /(?:[|｜·•\s]*\b(?:未婚|已婚|男|女|政治面貌[:：\s]*\S+|群众|党员|团员)\b[|｜·•\s]*)/g,
    /(?:[|｜·•\s]*\b(?:Single|Married|Male|Female|Nationality[:\s]*\S+)\b[|｜·•\s]*)/gi,
  ];

  for (const pat of sensitivePatterns) {
    if (pat.test(text)) {
      count++;
      text = text.replace(pat, ' | ');
    }
  }

  // Clean up dangling or doubled pipes and middots
  text = text
    .split('\n')
    .map((line) => {
      if (line.startsWith('#') || line.startsWith('##') || line.startsWith('-') || line.startsWith('>')) {
        return line;
      }
      return line
        .replace(/[|｜·•]\s*[|｜·•]+/g, ' | ')
        .replace(/^[|｜·•\s]+|[|｜·•\s]+$/g, '')
        .trim();
    })
    .join('\n');

  // 3. Parse form model to sanitize personal fields from structured model
  const model = parseMarkdownToForm(text);
  if (model.age) {
    model.age = '';
    count++;
  }

  const sensitiveTagRegex = /^(?:\d{1,2}\s*岁|\d{1,2}\s*years?\s*old|男|女|未婚|已婚|政治面貌[:：\s]*\S+|群众|党员|团员|国籍|籍贯|汉族|Single|Married|Nationality|Chinese|Male|Female)$/i;

  // Sanitize subtitle tags if containing age, gender, marital, nationality, etc.
  if (model.subtitle) {
    const parts = model.subtitle.split(/[｜|]/).map(s => s.trim()).filter(Boolean);
    const cleanedParts = parts.filter(p => {
      const isSensitive = sensitiveTagRegex.test(p) || /\d{1,2}\s*岁/.test(p) || /\d{1,2}\s*years?\s*old/i.test(p);
      if (isSensitive) count++;
      return !isSensitive;
    });
    model.subtitle = cleanedParts.join(' ｜ ');
  }

  // Sanitize social tags if containing age, gender, marital, nationality, etc.
  if (model.social) {
    const parts = model.social.split(/\s*[·|｜••,，;；\t]\s*/).map(s => s.trim()).filter(Boolean);
    const cleanedParts = parts.filter(p => {
      const isSensitive = sensitiveTagRegex.test(p) || /\d{1,2}\s*岁/.test(p) || /\d{1,2}\s*years?\s*old/i.test(p);
      if (isSensitive) count++;
      return !isSensitive;
    });
    model.social = cleanedParts.join(' · ');
  }

  // Re-serialize if changes occurred
  if (count > 0) {
    text = parseFormToMarkdown(model);
  }

  return { markdown: text, sanitizedFieldsCount: count };
}

/**
 * Automatically inspects and formats markdown resume content:
 * 1. Chinese-English and Number half-width spacing (e.g. "React开发" -> "React 开发")
 * 2. Compresses excessive blank lines (reduces 3+ consecutive line breaks to standard 2)
 * 3. Trims invisible trailing whitespace on each line
 * 4. Fixes common list punctuation and bullet spaces (e.g. "-text" -> "- text")
 * 5. Optionally normalizes date formats and sanitizes market-sensitive fields
 */
export function autoFormatAndCleanResume(
  markdown: string,
  options?: {
    marketRegion?: MarketRegion;
    lang?: string;
    dateStyle?: DateStyle;
    sanitizeMarketFields?: boolean;
  }
): AutoCleanResult {
  let text = markdown;
  let missingSpacesFixed = 0;
  let consecutiveBlankLinesFixed = 0;
  let trailingSpacesFixed = 0;
  let asteriskSpacingFixed = 0;
  let datesNormalized = 0;
  let sensitiveFieldsSanitized = 0;

  const isEn = options?.lang === 'en';
  const marketProfile = getMarketProfile(options?.marketRegion);
  const targetDateStyle = options?.dateStyle || marketProfile.dateStyle;

  // 1. Market date normalization
  if (targetDateStyle) {
    const dateResult = normalizeAllDatesInMarkdown(text, targetDateStyle, isEn);
    if (dateResult.convertedCount > 0) {
      text = dateResult.markdown;
      datesNormalized = dateResult.convertedCount;
    }
  }

  // 2. Optional market anti-bias sanitation
  if (options?.sanitizeMarketFields) {
    const sanitizeResult = sanitizeSensitiveFieldsForMarket(text);
    if (sanitizeResult.sanitizedFieldsCount > 0) {
      text = sanitizeResult.markdown;
      sensitiveFieldsSanitized = sanitizeResult.sanitizedFieldsCount;
    }
  }

  // 3. Fix bullet formatting like "-text" -> "- text" or "-*bold" -> "- *bold" (excluding "---" or "--" or bold "**")
  const bulletNormalized = text
    .replace(/^(\s*[-+])([^\s\-+])/gm, (_match, p1, p2) => {
      asteriskSpacingFixed++;
      return `${p1} ${p2}`;
    })
    .replace(/^(\s*\*)[ \t]*([^\s*])/gm, (_match, p1, p2) => {
      asteriskSpacingFixed++;
      return `${p1} ${p2}`;
    });
  text = bulletNormalized;

  // 4. Chinese-English Spacing
  const spaced = formatChineseEnglishSpacing(text);
  if (spaced !== text) {
    missingSpacesFixed = Math.max(1, spaced.length - text.length);
    text = spaced;
  }

  // 5. Compress redundant blank lines (>=3 down to 2)
  const lineCompressed = text.replace(/\n{3,}/g, () => {
    consecutiveBlankLinesFixed++;
    return '\n\n';
  });
  text = lineCompressed;

  // 6. Remove trailing spaces on lines
  const linesTrimmed = text.split('\n').map(line => {
    const trimmed = line.trimEnd();
    if (trimmed.length < line.length) {
      trailingSpacesFixed++;
    }
    return trimmed;
  }).join('\n');
  text = linesTrimmed;

  const fixesCount = missingSpacesFixed +
    consecutiveBlankLinesFixed +
    trailingSpacesFixed +
    asteriskSpacingFixed +
    datesNormalized +
    sensitiveFieldsSanitized;

  return {
    cleanedMarkdown: text,
    hasChanges: text !== markdown,
    fixesCount,
    details: {
      missingSpacesFixed,
      consecutiveBlankLinesFixed,
      trailingSpacesFixed,
      asteriskSpacingFixed,
      datesNormalized,
      sensitiveFieldsSanitized,
    }
  };
}
