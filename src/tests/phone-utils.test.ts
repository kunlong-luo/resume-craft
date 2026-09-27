import { describe, expect, it } from 'vitest';
import {
  getDefaultPhoneRegionForLocale,
  inferPhoneRegion,
  normalizePhoneForResume,
} from '../lib/phone-utils';

describe('international phone defaults', () => {
  it('keeps the English locale neutral instead of assuming a US phone number', () => {
    expect(getDefaultPhoneRegionForLocale('en')).toBe('');
  });

  it('keeps the Chinese locale convenience default for local CN numbers', () => {
    expect(getDefaultPhoneRegionForLocale('zh')).toBe('CN');
  });

  it('prefers the country encoded in a full international number', () => {
    expect(inferPhoneRegion('+44 20 7946 0958')).toBe('GB');
    expect(normalizePhoneForResume('+44 20 7946 0958')).toContain('+44');
  });
});
