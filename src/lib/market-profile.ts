import { PaperSize, MarketRegion, DocumentNomenclature, DateStyle, PersonalField } from '../types';

export interface MarketProfile {
  region: MarketRegion;
  labelZh: string;
  labelEn: string;
  documentName: DocumentNomenclature;
  defaultPaperSize: PaperSize;
  dateStyle: DateStyle;
  recommendedPageRange: [number, number];
  discouragedPersonalFields: PersonalField[];
  defaultHeadlineEn: string;
  defaultHeadlineZh: string;
}

export const MARKET_PROFILES: Record<MarketRegion, MarketProfile> = {
  us: {
    region: 'us',
    labelZh: '美国',
    labelEn: 'United States',
    documentName: 'resume',
    defaultPaperSize: 'letter',
    dateStyle: 'month-short', // e.g. "Mar 2024 – Present"
    recommendedPageRange: [1, 2],
    discouragedPersonalFields: ['photo', 'age', 'gender', 'marital', 'nationality', 'political', 'hometown'],
    defaultHeadlineEn: 'Resume',
    defaultHeadlineZh: '美版简历 (Resume)',
  },
  ca: {
    region: 'ca',
    labelZh: '加拿大',
    labelEn: 'Canada',
    documentName: 'resume',
    defaultPaperSize: 'letter',
    dateStyle: 'month-short',
    recommendedPageRange: [1, 2],
    discouragedPersonalFields: ['photo', 'age', 'gender', 'marital', 'nationality', 'political', 'hometown'],
    defaultHeadlineEn: 'Resume',
    defaultHeadlineZh: '加版简历 (Resume)',
  },
  uk: {
    region: 'uk',
    labelZh: '英国',
    labelEn: 'United Kingdom',
    documentName: 'cv',
    defaultPaperSize: 'a4',
    dateStyle: 'month-long', // e.g. "March 2024 – Present" or "Sept 2024 – Present"
    recommendedPageRange: [1, 2],
    discouragedPersonalFields: ['photo', 'age', 'gender', 'marital', 'nationality', 'political'],
    defaultHeadlineEn: 'Curriculum Vitae',
    defaultHeadlineZh: '英版简历 (CV)',
  },
  ie: {
    region: 'ie',
    labelZh: '爱尔兰',
    labelEn: 'Ireland',
    documentName: 'cv',
    defaultPaperSize: 'a4',
    dateStyle: 'month-long',
    recommendedPageRange: [1, 2],
    discouragedPersonalFields: ['photo', 'age', 'gender', 'marital', 'nationality'],
    defaultHeadlineEn: 'Curriculum Vitae',
    defaultHeadlineZh: '爱尔兰版简历 (CV)',
  },
  cn: {
    region: 'cn',
    labelZh: '中国大陆',
    labelEn: 'China',
    documentName: 'resume',
    defaultPaperSize: 'a4',
    dateStyle: 'cn-dot', // e.g. "2024.03 — 至今"
    recommendedPageRange: [1, 2],
    discouragedPersonalFields: ['political'],
    defaultHeadlineEn: 'Resume',
    defaultHeadlineZh: '中文简历',
  },
  international: {
    region: 'international',
    labelZh: '国际通用',
    labelEn: 'Global / Remote',
    documentName: 'resume',
    defaultPaperSize: 'a4',
    dateStyle: 'month-short',
    recommendedPageRange: [1, 2],
    discouragedPersonalFields: ['photo', 'age', 'gender', 'marital', 'nationality'],
    defaultHeadlineEn: 'Resume',
    defaultHeadlineZh: '国际通用简历',
  },
};

export const MARKET_REGIONS: MarketRegion[] = ['us', 'ca', 'uk', 'ie', 'international', 'cn'];

export function getMarketProfile(region?: MarketRegion): MarketProfile {
  if (region && MARKET_PROFILES[region]) {
    return MARKET_PROFILES[region];
  }
  return MARKET_PROFILES.international;
}

export function isMarketRegion(value: unknown): value is MarketRegion {
  return typeof value === 'string' && value in MARKET_PROFILES;
}

export function resolveDefaultPaperSize(region?: MarketRegion): PaperSize {
  return getMarketProfile(region).defaultPaperSize;
}
