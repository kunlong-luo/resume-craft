import { describe, expect, it } from 'vitest';
import {
  normalizeImportedProfiles,
  normalizeImportedSettings,
  normalizeResumeBackup,
} from '../lib/import-validation';
import type { ResumeSettings } from '../types';

const fallbackSettings: ResumeSettings = {
  themeColor: 'indigo',
  customColor: '#4F46E5',
  themeMode: 'light',
  fontSize: 'standard',
  fontFamily: 'sans',
  margin: 'standard',
  layoutMode: 'split',
  h2Style: 'accent-line',
  topAccentLine: true,
  lineHeight: 1.6,
  blockGap: 1,
  letterSpacing: 0,
  showPageBreakLine: true,
  templateLayout: 'single',
  lang: 'zh',
  paperSize: 'a4',
  marketRegion: 'cn',
  dateStyle: 'cn-dot',
  isPrivacyMasked: false,
};

describe('import validation', () => {
  it('normalizes imported settings without allowing invalid enum values', () => {
    const normalized = normalizeImportedSettings(
      {
        themeColor: 'not-a-theme',
        fontSize: 'relaxed',
        fontFamily: 'unknown-font',
        margin: 'compact',
        layoutMode: 'preview',
        h2Style: 'minimal-clean',
        templateLayout: 'two-column',
        themeMode: 'system',
        lang: 'en',
        lineHeight: 99,
        blockGap: -20,
        letterSpacing: 9,
        topAccentLine: false,
        showPageBreakLine: false,
        customColor: 'javascript:red',
      },
      fallbackSettings,
    );

    expect(normalized).not.toBeNull();
    expect(normalized?.themeColor).toBe('indigo');
    expect(normalized?.fontSize).toBe('relaxed');
    expect(normalized?.fontFamily).toBe('sans');
    expect(normalized?.margin).toBe('compact');
    expect(normalized?.layoutMode).toBe('preview');
    expect(normalized?.lineHeight).toBe(2.5);
    expect(normalized?.blockGap).toBe(0);
    expect(normalized?.letterSpacing).toBe(2);
    expect(normalized?.customColor).toBe('#4F46E5');
  });

  it('preserves market, paper, and explicit date style across imports', () => {
    const normalized = normalizeImportedSettings(
      {
        themeColor: 'teal',
        paperSize: 'letter',
        marketRegion: 'us',
        dateStyle: 'month-long',
      },
      fallbackSettings,
    );

    expect(normalized).toMatchObject({
      themeColor: 'teal',
      paperSize: 'letter',
      marketRegion: 'us',
      dateStyle: 'month-long',
    });
  });

  it('derives missing paper and date defaults from an imported target market', () => {
    const normalized = normalizeImportedSettings(
      {
        marketRegion: 'us',
      },
      fallbackSettings,
    );

    expect(normalized?.marketRegion).toBe('us');
    expect(normalized?.paperSize).toBe('letter');
    expect(normalized?.dateStyle).toBe('month-short');
  });

  it('rejects invalid date styles and falls back safely', () => {
    const normalized = normalizeImportedSettings(
      {
        dateStyle: 'quarter-year',
      },
      fallbackSettings,
    );

    expect(normalized?.dateStyle).toBe('cn-dot');
  });

  it('accepts an older partial settings object using safe fallbacks', () => {
    const normalized = normalizeImportedSettings(
      {
        fontSize: 'compact',
        lineHeight: 1.4,
      },
      fallbackSettings,
    );

    expect(normalized).toMatchObject({
      fontSize: 'compact',
      lineHeight: 1.4,
      themeColor: 'indigo',
      margin: 'standard',
      templateLayout: 'single',
    });
  });

  it('rejects malformed backups and normalizes valid backups', () => {
    expect(
      normalizeResumeBackup(
        {
          version: 'wrong-version',
          markdown: '# Resume',
          settings: {},
        },
        fallbackSettings,
      ),
    ).toBeNull();

    const backup = normalizeResumeBackup(
      {
        version: 'markdown-resume-backup-v1',
        markdown: '# Resume',
        settings: {
          fontSize: 'relaxed',
          margin: 'compact',
          paperSize: 'letter',
          marketRegion: 'uk',
          dateStyle: 'month-long',
        },
        exportedAt: '2026-09-25',
      },
      fallbackSettings,
    );

    expect(backup?.markdown).toBe('# Resume');
    expect(backup?.settings.fontSize).toBe('relaxed');
    expect(backup?.settings.margin).toBe('compact');
    expect(backup?.settings.paperSize).toBe('letter');
    expect(backup?.settings.marketRegion).toBe('uk');
    expect(backup?.settings.dateStyle).toBe('month-long');
  });

  it('rejects malformed profiles and duplicate ids', () => {
    const duplicateProfiles = [
      {
        id: 'same-id',
        name: 'First',
        markdown: '# First',
        settings: fallbackSettings,
      },
      {
        id: 'same-id',
        name: 'Second',
        markdown: '# Second',
        settings: fallbackSettings,
      },
    ];

    expect(
      normalizeImportedProfiles(duplicateProfiles, fallbackSettings),
    ).toBeNull();

    expect(
      normalizeImportedProfiles(
        [
          {
            id: '',
            name: 'Broken',
            markdown: '# Broken',
            settings: fallbackSettings,
          },
        ],
        fallbackSettings,
      ),
    ).toBeNull();
  });

  it('normalizes a valid profile archive', () => {
    const profiles = normalizeImportedProfiles(
      [
        {
          id: 'profile-imported',
          name: 'Imported Resume',
          targetRole: 'Frontend',
          markdown: '# Imported',
          settings: {
            themeColor: 'teal',
            fontSize: 'relaxed',
          },
        },
      ],
      fallbackSettings,
    );

    expect(profiles).toHaveLength(1);
    expect(profiles?.[0]).toMatchObject({
      id: 'profile-imported',
      name: 'Imported Resume',
      targetRole: 'Frontend',
      markdown: '# Imported',
    });
    expect(profiles?.[0].settings.themeColor).toBe('teal');
    expect(profiles?.[0].settings.fontSize).toBe('relaxed');
    expect(profiles?.[0].settings.margin).toBe('standard');
  });
});
