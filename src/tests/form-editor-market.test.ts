import { describe, it, expect } from 'vitest';
import { getMarketProfile, MARKET_PROFILES } from '../lib/market-profile';
import { formatDateRange, parseDateRange } from '../lib/date-parser';

describe('Phase 4: Form Editor & Market Adaptations', () => {
  describe('Market profile date styles integration', () => {
    it('uses month-short for US and Canada market regions', () => {
      const usProfile = getMarketProfile('us');
      const caProfile = getMarketProfile('ca');

      expect(usProfile.dateStyle).toBe('month-short');
      expect(caProfile.dateStyle).toBe('month-short');

      const formattedUs = formatDateRange('2022.03 - 2024.06', usProfile.dateStyle, true);
      expect(formattedUs).toBe('Mar 2022 – Jun 2024');

      const formattedOngoing = formatDateRange('2023.01 - 至今', usProfile.dateStyle, true);
      expect(formattedOngoing).toBe('Jan 2023 – Present');
    });

    it('uses month-long for UK and Ireland market regions', () => {
      const ukProfile = getMarketProfile('uk');
      const ieProfile = getMarketProfile('ie');

      expect(ukProfile.dateStyle).toBe('month-long');
      expect(ieProfile.dateStyle).toBe('month-long');

      const formattedUk = formatDateRange('2022.03 - 2024.06', ukProfile.dateStyle, true);
      expect(formattedUk).toBe('March 2022 – June 2024');

      const formattedOngoing = formatDateRange('2023.01 - 至今', ukProfile.dateStyle, true);
      expect(formattedOngoing).toBe('January 2023 – Present');
    });

    it('uses cn-dot for China market region', () => {
      const cnProfile = getMarketProfile('cn');
      expect(cnProfile.dateStyle).toBe('cn-dot');

      const formattedCn = formatDateRange('Mar 2022 – Jun 2024', cnProfile.dateStyle, false);
      expect(formattedCn).toBe('2022.03 — 2024.06');

      const formattedOngoing = formatDateRange('Jan 2023 – Present', cnProfile.dateStyle, false);
      expect(formattedOngoing).toBe('2023.01 — 至今');
    });
  });

  describe('Discouraged personal fields for Western/International markets', () => {
    it('identifies age, photo, marital, and gender as discouraged for US/CA/UK', () => {
      expect(MARKET_PROFILES.us.discouragedPersonalFields).toContain('age');
      expect(MARKET_PROFILES.us.discouragedPersonalFields).toContain('photo');
      expect(MARKET_PROFILES.ca.discouragedPersonalFields).toContain('age');
      expect(MARKET_PROFILES.uk.discouragedPersonalFields).toContain('age');
    });

    it('does not discourage age for China market region', () => {
      expect(MARKET_PROFILES.cn.discouragedPersonalFields).not.toContain('age');
    });
  });

  describe('Month range parser robust roundtripping', () => {
    it('correctly parses and re-formats various date formats cleanly', () => {
      const parsed1 = parseDateRange('2021.09 - 2024.06');
      expect(parsed1?.start?.year).toBe(2021);
      expect(parsed1?.start?.month).toBe(9);
      expect(parsed1?.end?.year).toBe(2024);
      expect(parsed1?.end?.month).toBe(6);

      const parsed2 = parseDateRange('Sep 2021 – Jun 2024');
      expect(parsed2?.start?.year).toBe(2021);
      expect(parsed2?.start?.month).toBe(9);
      expect(parsed2?.end?.year).toBe(2024);
      expect(parsed2?.end?.month).toBe(6);

      const parsed3 = parseDateRange('September 2021 — Present');
      expect(parsed3?.start?.year).toBe(2021);
      expect(parsed3?.start?.month).toBe(9);
      expect(parsed3?.end?.isPresent).toBe(true);
    });
  });
});
