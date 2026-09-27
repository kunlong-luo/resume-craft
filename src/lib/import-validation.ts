import type {
  FontFamily,
  FontSize,
  H2Style,
  Language,
  LayoutMode,
  PaperMargin,
  ResumeProfile,
  ResumeSettings,
  TemplateLayout,
  ThemeColor,
  ThemeMode,
  PaperSize,
  MarketRegion,
  DateStyle,
} from '../types';
import { getMarketProfile } from './market-profile';

type UnknownRecord = Record<string, unknown>;

const THEME_COLORS = [
  'blue',
  'emerald',
  'slate',
  'indigo',
  'crimson',
  'amber',
  'teal',
  'bronze',
  'custom',
] as const satisfies readonly ThemeColor[];

const FONT_SIZES = ['compact', 'standard', 'relaxed'] as const satisfies readonly FontSize[];
const FONT_FAMILIES = ['sans', 'serif', 'mono'] as const satisfies readonly FontFamily[];
const PAPER_MARGINS = ['compact', 'standard', 'relaxed'] as const satisfies readonly PaperMargin[];
const LAYOUT_MODES = ['split', 'editor', 'preview'] as const satisfies readonly LayoutMode[];
const H2_STYLES = [
  'accent-line',
  'modern-badge',
  'minimal-clean',
  'academic-line',
  'bracket-tag',
] as const satisfies readonly H2Style[];
const TEMPLATE_LAYOUTS = [
  'single',
  'two-column',
  'academic',
  'modern-card',
] as const satisfies readonly TemplateLayout[];
const LANGUAGES = ['zh', 'en'] as const satisfies readonly Language[];
const THEME_MODES = ['light', 'dark', 'system'] as const satisfies readonly ThemeMode[];
const PAPER_SIZES = ['a4', 'letter'] as const satisfies readonly PaperSize[];
const MARKET_REGIONS = ['cn', 'us', 'ca', 'uk', 'ie', 'international'] as const satisfies readonly MarketRegion[];
const DATE_STYLES = ['cn-dot', 'month-short', 'month-long'] as const satisfies readonly DateStyle[];

const MAX_MARKDOWN_LENGTH = 2_000_000;
const MAX_PROFILE_TEXT_LENGTH = 240;
const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

export interface ResumeBackupV1 {
  version: 'markdown-resume-backup-v1';
  markdown: string;
  settings: ResumeSettings;
  exportedAt?: string;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T {
  return typeof value === 'string' && allowed.includes(value as T);
}

function normalizedString(
  value: unknown,
  fallback: string,
  maxLength = MAX_PROFILE_TEXT_LENGTH,
): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLength);
}

function optionalString(
  value: unknown,
  maxLength = MAX_PROFILE_TEXT_LENGTH,
): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

function booleanOrFallback(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function normalizeImportedSettings(
  value: unknown,
  fallback: ResumeSettings,
): ResumeSettings | null {
  if (!isRecord(value)) return null;

  const normalized: ResumeSettings = {
    themeColor: isOneOf(value.themeColor, THEME_COLORS)
      ? value.themeColor
      : fallback.themeColor,
    fontSize: isOneOf(value.fontSize, FONT_SIZES)
      ? value.fontSize
      : fallback.fontSize,
    fontFamily: isOneOf(value.fontFamily, FONT_FAMILIES)
      ? value.fontFamily
      : fallback.fontFamily,
    margin: isOneOf(value.margin, PAPER_MARGINS)
      ? value.margin
      : fallback.margin,
    layoutMode: isOneOf(value.layoutMode, LAYOUT_MODES)
      ? value.layoutMode
      : fallback.layoutMode,
    h2Style: isOneOf(value.h2Style, H2_STYLES)
      ? value.h2Style
      : fallback.h2Style,
    topAccentLine: booleanOrFallback(value.topAccentLine, fallback.topAccentLine),
    lineHeight: clampNumber(value.lineHeight, 1, 2.5, fallback.lineHeight),
    blockGap: clampNumber(value.blockGap, 0, 3, fallback.blockGap),
    letterSpacing: clampNumber(value.letterSpacing, -1, 2, fallback.letterSpacing),
    showPageBreakLine: booleanOrFallback(
      value.showPageBreakLine,
      fallback.showPageBreakLine,
    ),
    templateLayout: isOneOf(value.templateLayout, TEMPLATE_LAYOUTS)
      ? value.templateLayout
      : fallback.templateLayout,
  };

  const customColor =
    typeof value.customColor === 'string' && HEX_COLOR_RE.test(value.customColor)
      ? value.customColor
      : fallback.customColor;
  if (customColor !== undefined) normalized.customColor = customColor;

  const themeMode = isOneOf(value.themeMode, THEME_MODES)
    ? value.themeMode
    : fallback.themeMode;
  if (themeMode !== undefined) normalized.themeMode = themeMode;

  const lang = isOneOf(value.lang, LANGUAGES) ? value.lang : fallback.lang;
  if (lang !== undefined) normalized.lang = lang;

  const hasExplicitMarket = isOneOf(value.marketRegion, MARKET_REGIONS);
  const marketRegion = hasExplicitMarket ? value.marketRegion : fallback.marketRegion;
  if (marketRegion !== undefined) normalized.marketRegion = marketRegion;

  const marketDefaults = marketRegion ? getMarketProfile(marketRegion) : undefined;

  const paperSize = isOneOf(value.paperSize, PAPER_SIZES)
    ? value.paperSize
    : hasExplicitMarket
      ? marketDefaults?.defaultPaperSize
      : fallback.paperSize;
  if (paperSize !== undefined) normalized.paperSize = paperSize;

  const dateStyle = isOneOf(value.dateStyle, DATE_STYLES)
    ? value.dateStyle
    : hasExplicitMarket
      ? marketDefaults?.dateStyle
      : fallback.dateStyle;
  if (dateStyle !== undefined) normalized.dateStyle = dateStyle;

  const isPrivacyMasked =
    typeof value.isPrivacyMasked === 'boolean'
      ? value.isPrivacyMasked
      : fallback.isPrivacyMasked;
  if (isPrivacyMasked !== undefined) normalized.isPrivacyMasked = isPrivacyMasked;

  return normalized;
}

export function normalizeResumeBackup(
  value: unknown,
  fallbackSettings: ResumeSettings,
): ResumeBackupV1 | null {
  if (!isRecord(value)) return null;
  if (value.version !== 'markdown-resume-backup-v1') return null;
  if (
    typeof value.markdown !== 'string' ||
    value.markdown.length === 0 ||
    value.markdown.length > MAX_MARKDOWN_LENGTH
  ) {
    return null;
  }

  const settings = normalizeImportedSettings(value.settings, fallbackSettings);
  if (!settings) return null;

  const backup: ResumeBackupV1 = {
    version: 'markdown-resume-backup-v1',
    markdown: value.markdown,
    settings,
  };

  if (typeof value.exportedAt === 'string') {
    backup.exportedAt = value.exportedAt.slice(0, MAX_PROFILE_TEXT_LENGTH);
  }

  return backup;
}

export function normalizeImportedProfile(
  value: unknown,
  fallbackSettings: ResumeSettings,
): ResumeProfile | null {
  if (!isRecord(value)) return null;

  if (
    typeof value.id !== 'string' ||
    value.id.trim().length === 0 ||
    typeof value.name !== 'string' ||
    value.name.trim().length === 0 ||
    typeof value.markdown !== 'string' ||
    value.markdown.length === 0 ||
    value.markdown.length > MAX_MARKDOWN_LENGTH
  ) {
    return null;
  }

  const settings = normalizeImportedSettings(value.settings, fallbackSettings);
  if (!settings) return null;

  const now = new Date().toISOString();

  const profile: ResumeProfile = {
    id: value.id.trim().slice(0, MAX_PROFILE_TEXT_LENGTH),
    name: normalizedString(value.name, 'Imported Resume'),
    markdown: value.markdown,
    settings,
    updatedAt: normalizedString(value.updatedAt, now),
    createdAt: normalizedString(value.createdAt, now),
    isDefault: typeof value.isDefault === 'boolean' ? value.isDefault : false,
  };

  const targetRole = optionalString(value.targetRole);
  if (targetRole !== undefined) profile.targetRole = targetRole;

  const customFileName = optionalString(value.customFileName);
  if (customFileName !== undefined) profile.customFileName = customFileName;

  return profile;
}

export function normalizeImportedProfiles(
  value: unknown,
  fallbackSettings: ResumeSettings,
): ResumeProfile[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) {
    return null;
  }

  const profiles: ResumeProfile[] = [];
  const ids = new Set<string>();

  for (const item of value) {
    const profile = normalizeImportedProfile(item, fallbackSettings);
    if (!profile || ids.has(profile.id)) return null;

    ids.add(profile.id);
    profiles.push(profile);
  }

  return profiles;
}
