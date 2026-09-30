import { beforeEach, describe, expect, it } from 'vitest';
import type { ResumeDraft, ResumeProfile } from '../types';
import type { ResumeRepository } from '../lib/resume-repository';
import {
  migrateLegacyStorageToIndexedDb,
  STORAGE_MIGRATION_META_KEY,
  STORAGE_MIGRATION_VERSION,
} from '../lib/storage-migration';
import { STORAGE_KEYS } from '../lib/storage';

function installLocalStorage() {
  let values = new Map<string, string>();
  const localStorageMock: Storage = {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, String(value));
    },
  };

  (globalThis as unknown as { localStorage: Storage }).localStorage = localStorageMock;
  (globalThis as unknown as { window: { localStorage: Storage } }).window = {
    localStorage: localStorageMock,
  };
  return localStorageMock;
}

function createFakeRepository() {
  const state = {
    markdown: null as string | null,
    jdText: null as string | null,
    profiles: [] as ResumeProfile[],
    drafts: [] as ResumeDraft[],
    meta: new Map<string, string>(),
  };

  const repository: ResumeRepository = {
    async getActiveMarkdown() {
      return state.markdown;
    },
    async saveActiveMarkdown(markdown) {
      state.markdown = markdown;
    },
    async getJdText() {
      return state.jdText;
    },
    async saveJdText(text) {
      state.jdText = text;
    },
    async getProfiles() {
      return structuredClone(state.profiles);
    },
    async replaceProfiles(profiles) {
      state.profiles = structuredClone(profiles);
    },
    async getDrafts() {
      return structuredClone(state.drafts);
    },
    async replaceDrafts(drafts) {
      state.drafts = structuredClone(drafts);
    },
    async getMeta(key) {
      return state.meta.get(key) ?? null;
    },
    async setMeta(key, value) {
      state.meta.set(key, value);
    },
  };

  return { repository, state };
}

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

describe('v2.2 -> v2.3 storage migration', () => {
  beforeEach(() => {
    installLocalStorage();
  });

  it('copies and verifies all core records before removing legacy keys', async () => {
    const { repository, state } = createFakeRepository();
    const profile: ResumeProfile = {
      id: 'profile_1',
      name: 'Primary',
      markdown: '# Candidate',
      settings,
      createdAt: '2026-09-30T00:00:00.000Z',
      updatedAt: '2026-09-30T00:00:00.000Z',
    };
    const draft: ResumeDraft = {
      id: 'draft_1',
      title: 'Draft',
      markdown: '# Draft',
      settings,
      timestamp: '2026-09-30 00:00:00',
    };

    localStorage.setItem(STORAGE_KEYS.MARKDOWN, profile.markdown);
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify([profile]));
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify([draft]));
    localStorage.setItem(STORAGE_KEYS.JD_TEXT, 'Senior TypeScript engineer');

    const result = await migrateLegacyStorageToIndexedDb(repository);

    expect(result.status).toBe('migrated');
    expect(state.markdown).toBe(profile.markdown);
    expect(state.profiles).toEqual([profile]);
    expect(state.drafts).toEqual([draft]);
    expect(state.jdText).toBe('Senior TypeScript engineer');
    expect(state.meta.get(STORAGE_MIGRATION_META_KEY)).toBe(STORAGE_MIGRATION_VERSION);

    expect(localStorage.getItem(STORAGE_KEYS.MARKDOWN)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.PROFILES)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.DRAFTS)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.JD_TEXT)).toBeNull();
  });

  it('cleans stale legacy core keys when migration was already verified', async () => {
    const { repository, state } = createFakeRepository();
    state.meta.set(STORAGE_MIGRATION_META_KEY, STORAGE_MIGRATION_VERSION);
    localStorage.setItem(STORAGE_KEYS.MARKDOWN, '# stale rollback copy');
    localStorage.setItem(STORAGE_KEYS.PROFILES, '[]');

    const result = await migrateLegacyStorageToIndexedDb(repository);

    expect(result.status).toBe('already-migrated');
    expect(localStorage.getItem(STORAGE_KEYS.MARKDOWN)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.PROFILES)).toBeNull();
  });

  it('keeps legacy data when verification fails', async () => {
    const { repository } = createFakeRepository();
    localStorage.setItem(STORAGE_KEYS.MARKDOWN, '# Must survive');

    repository.getActiveMarkdown = async () => '# corrupted';

    await expect(migrateLegacyStorageToIndexedDb(repository)).rejects.toThrow(
      'IndexedDB migration verification failed for active markdown',
    );

    expect(localStorage.getItem(STORAGE_KEYS.MARKDOWN)).toBe('# Must survive');
    expect(await repository.getMeta(STORAGE_MIGRATION_META_KEY)).toBeNull();
  });
});
