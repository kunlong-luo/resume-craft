import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_EVENTS,
  getSafeAnalyticsPath,
  isAllowedAnalyticsEvent,
  isDoNotTrackEnabled,
  isOfficialAnalyticsContext,
} from '../lib/analytics';

describe('privacy-friendly analytics', () => {
  it('only enables analytics on the official hosted app', () => {
    expect(isOfficialAnalyticsContext('kunlong-luo.github.io', '/resume-craft/')).toBe(true);
    expect(isOfficialAnalyticsContext('kunlong-luo.github.io', '/resume-craft/shared')).toBe(true);
    expect(isOfficialAnalyticsContext('localhost', '/resume-craft/')).toBe(false);
    expect(isOfficialAnalyticsContext('example.com', '/resume-craft/')).toBe(false);
  });

  it('normalizes share URLs without exposing the share payload', () => {
    const payload = 'private-resume-payload';
    const path = getSafeAnalyticsPath(
      '/resume-craft/',
      `?share=${encodeURIComponent(payload)}&utm_source=test`,
    );

    expect(path).toBe('/resume-craft/shared');
    expect(path).not.toContain(payload);
    expect(path).not.toContain('share=');

    const fragmentPath = getSafeAnalyticsPath(
      '/resume-craft/',
      '',
      `#share=${encodeURIComponent(payload)}`,
    );
    expect(fragmentPath).toBe('/resume-craft/shared');
    expect(fragmentPath).not.toContain(payload);
  });

  it('keeps normal app paths and ignores ordinary query data', () => {
    expect(getSafeAnalyticsPath('/resume-craft/', '?utm_source=github')).toBe('/resume-craft/');
  });

  it('respects Do Not Track values', () => {
    expect(isDoNotTrackEnabled({ doNotTrack: '1' })).toBe(true);
    expect(isDoNotTrackEnabled({ doNotTrack: 'yes' })).toBe(true);
    expect(isDoNotTrackEnabled({ doNotTrack: '0' })).toBe(false);
    expect(isDoNotTrackEnabled({ doNotTrack: null })).toBe(false);
  });

  it('uses a fixed event allowlist with no user-derived event names', () => {
    expect(ANALYTICS_EVENTS).toEqual([
      'editing_started',
      'pdf_export_success',
      'browser_print_started',
      'ats_check_completed',
      'auto_fit_used',
      'share_created',
      'pwa_install',
      'feedback_opened',
      'local_data_cleared',
      'runtime_error',
    ]);

    expect(isAllowedAnalyticsEvent('share_created')).toBe(true);
    expect(isAllowedAnalyticsEvent('local_data_cleared')).toBe(true);
    expect(isAllowedAnalyticsEvent('runtime_error')).toBe(true);
    expect(isAllowedAnalyticsEvent('resume:Jane Doe')).toBe(false);
    expect(isAllowedAnalyticsEvent('jd:senior frontend engineer')).toBe(false);
    expect(isAllowedAnalyticsEvent('file:private-resume.pdf')).toBe(false);
  });
});
