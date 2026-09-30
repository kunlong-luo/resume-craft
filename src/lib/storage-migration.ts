import type { ResumeDraft, ResumeProfile } from '../types';
import { storage, STORAGE_KEYS } from './storage';
import { resumeRepository, type ResumeRepository } from './resume-repository';

export const STORAGE_MIGRATION_META_KEY = 'storage-migration-version';
export const STORAGE_MIGRATION_VERSION = '1';

export interface StorageMigrationResult {
  status: 'migrated' | 'already-migrated' | 'no-legacy-data';
}

const MIGRATED_LEGACY_KEYS = [
  STORAGE_KEYS.MARKDOWN,
  STORAGE_KEYS.PROFILES,
  STORAGE_KEYS.DRAFTS,
  STORAGE_KEYS.JD_TEXT,
] as const;

function removeMigratedLegacyKeys(): void {
  for (const key of MIGRATED_LEGACY_KEYS) {
    storage.remove(key);
  }
}

export async function migrateLegacyStorageToIndexedDb(
  repository: ResumeRepository = resumeRepository,
): Promise<StorageMigrationResult> {
  const completedVersion = await repository.getMeta(STORAGE_MIGRATION_META_KEY);
  if (completedVersion === STORAGE_MIGRATION_VERSION) {
    removeMigratedLegacyKeys();
    return { status: 'already-migrated' };
  }

  const markdown = storage.get<string | null>(STORAGE_KEYS.MARKDOWN, null);
  const profiles = storage.get<ResumeProfile[] | null>(STORAGE_KEYS.PROFILES, null);
  const drafts = storage.get<ResumeDraft[] | null>(STORAGE_KEYS.DRAFTS, null);
  const jdText = storage.get<string | null>(STORAGE_KEYS.JD_TEXT, null);
  const hasLegacyData =
    markdown !== null ||
    Boolean(profiles?.length) ||
    Boolean(drafts?.length) ||
    jdText !== null;

  if (!hasLegacyData) {
    await repository.setMeta(STORAGE_MIGRATION_META_KEY, STORAGE_MIGRATION_VERSION);
    removeMigratedLegacyKeys();
    return { status: 'no-legacy-data' };
  }

  // Write the legacy core snapshot in one transaction. Legacy localStorage
  // remains untouched until all verification succeeds.
  await repository.saveSnapshot({
    markdown,
    profiles,
    drafts,
    jdText,
  });

  const [storedMarkdown, storedProfiles, storedDrafts, storedJdText] = await Promise.all([
    repository.getActiveMarkdown(),
    repository.getProfiles(),
    repository.getDrafts(),
    repository.getJdText(),
  ]);

  if (markdown !== null && storedMarkdown !== markdown) {
    throw new Error('IndexedDB migration verification failed for active markdown');
  }
  if (profiles && JSON.stringify(storedProfiles) !== JSON.stringify(profiles)) {
    throw new Error('IndexedDB migration verification failed for profiles');
  }
  if (drafts && JSON.stringify(storedDrafts) !== JSON.stringify(drafts)) {
    throw new Error('IndexedDB migration verification failed for drafts');
  }
  if (jdText !== null && storedJdText !== jdText) {
    throw new Error('IndexedDB migration verification failed for JD text');
  }

  // Mark complete only after verified writes, then remove only the core keys
  // that now have a verified IndexedDB copy. Lightweight UI preferences stay.
  await repository.setMeta(STORAGE_MIGRATION_META_KEY, STORAGE_MIGRATION_VERSION);
  removeMigratedLegacyKeys();
  return { status: 'migrated' };
}
