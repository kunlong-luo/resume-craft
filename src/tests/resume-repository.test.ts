import { describe, expect, it } from 'vitest';
import type { ResumeDraft, ResumeProfile } from '../types';
import {
  fromDraftRecords,
  fromProfileRecords,
  toDraftRecords,
  toProfileRecords,
} from '../lib/resume-repository';

const settings = {
  themeColor: 'indigo',
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
} as const;

describe('resume repository record mapping', () => {
  it('preserves profile order through sortIndex without leaking persistence metadata', () => {
    const profiles: ResumeProfile[] = [
      {
        id: 'profile_b',
        name: 'Second by id, first by user order',
        markdown: '# One',
        settings,
        createdAt: '2026-09-30T00:00:00.000Z',
        updatedAt: '2026-09-30T00:00:00.000Z',
      },
      {
        id: 'profile_a',
        name: 'First by id, second by user order',
        markdown: '# Two',
        settings,
        createdAt: '2026-09-30T00:00:01.000Z',
        updatedAt: '2026-09-30T00:00:01.000Z',
      },
    ];

    const records = toProfileRecords(profiles);
    expect(records.map((record) => record.sortIndex)).toEqual([0, 1]);

    const restored = fromProfileRecords([records[1], records[0]]);
    expect(restored).toEqual(profiles);
    expect(restored.every((profile) => !('sortIndex' in profile))).toBe(true);
  });

  it('preserves draft order through sortIndex', () => {
    const drafts: ResumeDraft[] = [
      {
        id: 'draft_new',
        title: 'Newest',
        markdown: '# Newest',
        settings,
        timestamp: '2026-09-30 10:00:00',
        isAutoSave: true,
      },
      {
        id: 'draft_old',
        title: 'Older',
        markdown: '# Older',
        settings,
        timestamp: '2026-09-29 10:00:00',
      },
    ];

    const records = toDraftRecords(drafts);
    expect(records.map((record) => record.sortIndex)).toEqual([0, 1]);
    expect(fromDraftRecords([records[1], records[0]])).toEqual(drafts);
  });
});
