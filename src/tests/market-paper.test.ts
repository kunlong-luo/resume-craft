import { describe, it, expect } from 'vitest';
import { PAPER_SPECS, getPaperSpec, isPaperSize } from '../lib/paper';
import {
  MARKET_PROFILES,
  getMarketProfile,
  isMarketRegion,
  resolveDefaultPaperSize,
} from '../lib/market-profile';
import { getPageDimensions } from '../lib/page-layout';
import { normalizeImportedSettings } from '../lib/import-validation';
import { ResumeSettings } from '../types';

describe('Phase 1 Foundation: Paper Specs & Market Profiles', () => {
  describe('PAPER_SPECS (Single Source of Truth for paper dimensions)', () => {
    it('defines accurate constants in PAPER_SPECS dictionary', () => {
      expect(PAPER_SPECS.a4.widthMm).toBe(210);
      expect(PAPER_SPECS.letter.widthMm).toBe(215.9);
    });

    it('provides accurate A4 physical and digital specifications', () => {
      const a4 = getPaperSpec('a4');
      expect(a4.id).toBe('a4');
      expect(a4.widthMm).toBe(210);
      expect(a4.heightMm).toBe(297);
      expect(a4.baseWidthPx).toBe(794);
      expect(a4.cssPageSize).toBe('A4');
      expect(a4.aspectRatio).toBeCloseTo(297 / 210, 4);
    });

    it('provides accurate US Letter physical and digital specifications', () => {
      const letter = getPaperSpec('letter');
      expect(letter.id).toBe('letter');
      expect(letter.widthMm).toBe(215.9);
      expect(letter.heightMm).toBe(279.4);
      expect(letter.baseWidthPx).toBe(816);
      expect(letter.cssPageSize).toBe('Letter');
      expect(letter.aspectRatio).toBeCloseTo(279.4 / 215.9, 4);
    });

    it('gracefully falls back to A4 for undefined or invalid paper size', () => {
      expect(getPaperSpec(undefined).id).toBe('a4');
      expect(getPaperSpec('unknown' as any).id).toBe('a4');
    });

    it('correctly validates paper sizes with isPaperSize', () => {
      expect(isPaperSize('a4')).toBe(true);
      expect(isPaperSize('letter')).toBe(true);
      expect(isPaperSize('legal')).toBe(false);
      expect(isPaperSize(null)).toBe(false);
    });

    it('derives getPageDimensions from PAPER_SPECS consistently', () => {
      const a4Dims = getPageDimensions('a4');
      expect(a4Dims.widthMm).toBe(210);
      expect(a4Dims.heightMm).toBe(297);
      expect(a4Dims.baseWidthPx).toBe(794);

      const letterDims = getPageDimensions('letter');
      expect(letterDims.widthMm).toBe(215.9);
      expect(letterDims.heightMm).toBe(279.4);
      expect(letterDims.baseWidthPx).toBe(816);
    });
  });

  describe('MARKET_PROFILES (Market-aware defaults & policies)', () => {
    it('defines market profiles in MARKET_PROFILES dictionary', () => {
      expect(MARKET_PROFILES.us.defaultPaperSize).toBe('letter');
      expect(MARKET_PROFILES.uk.defaultPaperSize).toBe('a4');
    });

    it('configures US market profile with Letter paper and Resume nomenclature', () => {
      const us = getMarketProfile('us');
      expect(us.documentName).toBe('resume');
      expect(us.defaultPaperSize).toBe('letter');
      expect(us.dateStyle).toBe('month-short');
      expect(us.discouragedPersonalFields).toContain('photo');
      expect(us.discouragedPersonalFields).toContain('age');
      expect(us.discouragedPersonalFields).toContain('gender');
      expect(us.discouragedPersonalFields).toContain('marital');
    });

    it('configures Canada market profile with Letter paper and Resume nomenclature', () => {
      const ca = getMarketProfile('ca');
      expect(ca.documentName).toBe('resume');
      expect(ca.defaultPaperSize).toBe('letter');
      expect(ca.discouragedPersonalFields).toContain('age');
    });

    it('configures UK market profile with A4 paper and CV nomenclature', () => {
      const uk = getMarketProfile('uk');
      expect(uk.documentName).toBe('cv');
      expect(uk.defaultPaperSize).toBe('a4');
      expect(uk.dateStyle).toBe('month-long');
      expect(uk.discouragedPersonalFields).toContain('photo');
      expect(uk.discouragedPersonalFields).toContain('age');
    });

    it('configures Ireland market profile with A4 paper and CV nomenclature', () => {
      const ie = getMarketProfile('ie');
      expect(ie.documentName).toBe('cv');
      expect(ie.defaultPaperSize).toBe('a4');
    });

    it('configures China market profile with A4 paper, dot date style and Resume nomenclature', () => {
      const cn = getMarketProfile('cn');
      expect(cn.documentName).toBe('resume');
      expect(cn.defaultPaperSize).toBe('a4');
      expect(cn.dateStyle).toBe('cn-dot');
    });

    it('configures International profile as neutral fallback', () => {
      const intl = getMarketProfile('international');
      expect(intl.documentName).toBe('resume');
      expect(intl.defaultPaperSize).toBe('a4');
      expect(getMarketProfile(undefined).region).toBe('international');
    });

    it('resolves default paper size per market correctly', () => {
      expect(resolveDefaultPaperSize('us')).toBe('letter');
      expect(resolveDefaultPaperSize('ca')).toBe('letter');
      expect(resolveDefaultPaperSize('uk')).toBe('a4');
      expect(resolveDefaultPaperSize('cn')).toBe('a4');
      expect(resolveDefaultPaperSize('international')).toBe('a4');
    });

    it('validates market regions with isMarketRegion', () => {
      expect(isMarketRegion('us')).toBe(true);
      expect(isMarketRegion('ca')).toBe(true);
      expect(isMarketRegion('uk')).toBe(true);
      expect(isMarketRegion('ie')).toBe(true);
      expect(isMarketRegion('cn')).toBe(true);
      expect(isMarketRegion('international')).toBe(true);
      expect(isMarketRegion('mars')).toBe(false);
    });
  });

  describe('Three-way Decoupling: Language ⟂ Market ⟂ Paper', () => {
    it('permits any combination of language, market, and paper size', () => {
      // UK applicant writing in English on A4
      const ukSettings: Partial<ResumeSettings> = {
        lang: 'en',
        marketRegion: 'uk',
        paperSize: 'a4',
      };
      expect(ukSettings.lang).toBe('en');
      expect(ukSettings.marketRegion).toBe('uk');
      expect(ukSettings.paperSize).toBe('a4');

      // US applicant writing in English on Letter
      const usSettings: Partial<ResumeSettings> = {
        lang: 'en',
        marketRegion: 'us',
        paperSize: 'letter',
      };
      expect(usSettings.paperSize).toBe('letter');

      // Chinese applicant writing in English for a domestic foreign enterprise on A4
      const foreignEnterpriseSettings: Partial<ResumeSettings> = {
        lang: 'en',
        marketRegion: 'cn',
        paperSize: 'a4',
      };
      expect(foreignEnterpriseSettings.lang).toBe('en');
      expect(foreignEnterpriseSettings.paperSize).toBe('a4');
    });
  });

  describe('Import and persistence normalization', () => {
    const fallback: ResumeSettings = {
      themeColor: 'indigo',
      fontSize: 'standard',
      fontFamily: 'sans',
      margin: 'standard',
      layoutMode: 'split',
      h2Style: 'accent-line',
      topAccentLine: true,
      lineHeight: 1.6,
      blockGap: 1.0,
      letterSpacing: 0.0,
      showPageBreakLine: true,
      templateLayout: 'single',
      lang: 'en',
      paperSize: 'a4',
      marketRegion: 'international',
      dateStyle: 'month-short',
    };

    it('normalizes and preserves valid paperSize and marketRegion', () => {
      const normalized = normalizeImportedSettings(
        {
          themeColor: 'blue',
          paperSize: 'letter',
          marketRegion: 'us',
          dateStyle: 'month-long',
        },
        fallback
      );

      expect(normalized?.paperSize).toBe('letter');
      expect(normalized?.marketRegion).toBe('us');
      expect(normalized?.dateStyle).toBe('month-long');
    });

    it('falls back to safe defaults when paperSize or marketRegion is missing or invalid', () => {
      const normalized = normalizeImportedSettings(
        {
          themeColor: 'blue',
          paperSize: 'invalid-paper',
          marketRegion: 'invalid-region',
          dateStyle: 'invalid-date-style',
        },
        fallback
      );

      expect(normalized?.paperSize).toBe('a4');
      expect(normalized?.marketRegion).toBe('international');
      expect(normalized?.dateStyle).toBe('month-short');
    });
  });
});
