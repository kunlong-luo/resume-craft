import { describe, expect, it } from 'vitest';
import { reconcileActiveBootstrapProfile } from '../lib/resume-bootstrap-state';

type FakeProfile = {
  id: string;
  markdown: string;
  settings: { lang: string; marketRegion: string };
};

const profiles: FakeProfile[] = [
  { id: 'active', markdown: '# Old draft', settings: { lang: 'zh', marketRegion: 'cn' } },
  { id: 'other', markdown: '# Keep this draft', settings: { lang: 'en', marketRegion: 'uk' } },
];

describe('active resume bootstrap reconciliation', () => {
  it('restores the newer authoritative active document and lightweight market settings', () => {
    const result = reconcileActiveBootstrapProfile(
      profiles,
      'active',
      '# Saved document',
      { lang: 'en', marketRegion: 'us' },
    );

    expect(result[0].markdown).toBe('# Saved document');
    expect(result[0].settings).toEqual({ lang: 'en', marketRegion: 'us' });
    expect(result[1]).toBe(profiles[1]);
  });

  it('respects a deliberately blank document after reload', () => {
    const result = reconcileActiveBootstrapProfile(profiles, 'active', '', null);
    expect(result[0].markdown).toBe('');
    expect(result[0].settings).toEqual(profiles[0].settings);
  });

  it('keeps archived state intact when no active snapshot is available', () => {
    const result = reconcileActiveBootstrapProfile(profiles, 'active', null, null);
    expect(result).toEqual(profiles);
  });
});
