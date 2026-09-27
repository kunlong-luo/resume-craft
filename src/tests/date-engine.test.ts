import { describe, it, expect } from 'vitest';
import {
  parseDatePoint,
  parseDateRange,
  formatDatePoint,
  formatDateRange,
  COMPREHENSIVE_DATE_REGEX,
} from '../lib/date-parser';
import { splitItemTitle, isTimeString } from '../lib/markdown-parser';

describe('Phase 3: Parser / Date Engine', () => {
  describe('parseDatePoint', () => {
    it('parses English short months and year', () => {
      const pt1 = parseDatePoint('Mar 2024');
      expect(pt1?.year).toBe(2024);
      expect(pt1?.month).toBe(3);

      const pt2 = parseDatePoint('Sept. 2023');
      expect(pt2?.year).toBe(2023);
      expect(pt2?.month).toBe(9);

      const pt3 = parseDatePoint('Jan 2019');
      expect(pt3?.year).toBe(2019);
      expect(pt3?.month).toBe(1);
    });

    it('parses English full months and year', () => {
      const pt = parseDatePoint('September 2022');
      expect(pt?.year).toBe(2022);
      expect(pt?.month).toBe(9);
    });

    it('parses standard dot / slash / dash date notations', () => {
      const ptDot = parseDatePoint('2024.03');
      expect(ptDot?.year).toBe(2024);
      expect(ptDot?.month).toBe(3);

      const ptDash = parseDatePoint('2021-06');
      expect(ptDash?.year).toBe(2021);
      expect(ptDash?.month).toBe(6);

      const ptSlash = parseDatePoint('03/2024');
      expect(ptSlash?.year).toBe(2024);
      expect(ptSlash?.month).toBe(3);
    });

    it('parses year-only notation', () => {
      const pt = parseDatePoint('2018');
      expect(pt?.year).toBe(2018);
      expect(pt?.month).toBeUndefined();
    });

    it('identifies present/current ongoing markers', () => {
      expect(parseDatePoint('至今')?.isPresent).toBe(true);
      expect(parseDatePoint('现在')?.isPresent).toBe(true);
      expect(parseDatePoint('Present')?.isPresent).toBe(true);
      expect(parseDatePoint('present')?.isPresent).toBe(true);
      expect(parseDatePoint('Current')?.isPresent).toBe(true);
    });
  });

  describe('parseDateRange', () => {
    it('parses English date ranges with en-dash or hyphen', () => {
      const range = parseDateRange('Mar 2024 – Present');
      expect(range).not.toBeNull();
      expect(range?.start?.year).toBe(2024);
      expect(range?.start?.month).toBe(3);
      expect(range?.end?.isPresent).toBe(true);
      expect(range?.hasRange).toBe(true);
    });

    it('parses long month English range', () => {
      const range = parseDateRange('September 2021 - June 2024');
      expect(range?.start?.year).toBe(2021);
      expect(range?.start?.month).toBe(9);
      expect(range?.end?.year).toBe(2024);
      expect(range?.end?.month).toBe(6);
    });

    it('parses Chinese dot date range with em-dash', () => {
      const range = parseDateRange('2021.06 — 2024.02');
      expect(range?.start?.year).toBe(2021);
      expect(range?.start?.month).toBe(6);
      expect(range?.end?.year).toBe(2024);
      expect(range?.end?.month).toBe(2);
    });

    it('parses single date point as non-range', () => {
      const range = parseDateRange('2024.03');
      expect(range?.hasRange).toBe(false);
      expect(range?.start?.year).toBe(2024);
    });
  });

  describe('formatDatePoint & formatDateRange', () => {
    it('formats single date points with formatDatePoint', () => {
      expect(formatDatePoint({ raw: 'Mar 2024', year: 2024, month: 3 }, 'cn-dot', false)).toBe('2024.03');
      expect(formatDatePoint({ raw: '2024.03', year: 2024, month: 3 }, 'month-short', true)).toBe('Mar 2024');
      expect(formatDatePoint({ raw: '2024.03', year: 2024, month: 3 }, 'month-long', true)).toBe('March 2024');
      expect(formatDatePoint({ raw: 'present', isPresent: true }, 'month-short', true)).toBe('Present');
      expect(formatDatePoint({ raw: '至今', isPresent: true }, 'cn-dot', false)).toBe('至今');
    });

    it('formats into cn-dot style correctly', () => {
      const formatted = formatDateRange('Mar 2024 – Present', 'cn-dot', false);
      expect(formatted).toBe('2024.03 — 至今');
    });

    it('formats into month-short style correctly (US / CA)', () => {
      const formatted = formatDateRange('2024.03 — 至今', 'month-short', true);
      expect(formatted).toBe('Mar 2024 – Present');

      const fullRange = formatDateRange('2021.06 - 2024.02', 'month-short', true);
      expect(fullRange).toBe('Jun 2021 – Feb 2024');
    });

    it('formats into month-long style correctly (UK / IE)', () => {
      const formatted = formatDateRange('2024.03 — 至今', 'month-long', true);
      expect(formatted).toBe('March 2024 – Present');

      const fullRange = formatDateRange('2021.06 - 2024.02', 'month-long', true);
      expect(fullRange).toBe('June 2021 – February 2024');
    });

    it('formats year-only gracefully', () => {
      const formatted = formatDateRange('2018 - 2022', 'month-short', true);
      expect(formatted).toBe('2018 – 2022');
    });
  });

  describe('splitItemTitle integration with English dates', () => {
    it('successfully extracts English date range from resume section header', () => {
      const parsed = splitItemTitle(
        'Apex Nexus Technologies Inc. ｜ Lead AI Systems Architect ｜ *Mar 2024 – Present*'
      );
      expect(parsed.org).toBe('Apex Nexus Technologies Inc.');
      expect(parsed.role).toBe('Lead AI Systems Architect');
      expect(parsed.time).toContain('Mar 2024 – Present');
    });

    it('extracts English full-month date range without pipe', () => {
      const parsed = splitItemTitle(
        'CloudWing Dynamics Inc.　Senior Backend Engineer　*September 2021 - February 2024*'
      );
      expect(parsed.org).toBe('CloudWing Dynamics Inc.');
      expect(parsed.role).toBe('Senior Backend Engineer');
      expect(parsed.time).toContain('September 2021 - February 2024');
    });

    it('is recognized by isTimeString', () => {
      expect(isTimeString('Mar 2024 – Present')).toBe(true);
      expect(isTimeString('September 2021 - June 2024')).toBe(true);
      expect(isTimeString('2024.03 — 至今')).toBe(true);
      expect(isTimeString('Random Project Name')).toBe(false);
    });

    it('matches dates with COMPREHENSIVE_DATE_REGEX', () => {
      expect(COMPREHENSIVE_DATE_REGEX.test('Mar 2024 – Present')).toBe(true);
      expect(COMPREHENSIVE_DATE_REGEX.test('2024.03 — 至今')).toBe(true);
      expect(COMPREHENSIVE_DATE_REGEX.test('2021.06 - 2024.02')).toBe(true);
    });
  });
});
