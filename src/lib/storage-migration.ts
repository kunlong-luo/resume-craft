import type { ResumeDraft, ResumeProfile } from '../types';
import { storage, STORAGE_KEYS } from './storage';
import { resumeRepository } from './resume-repository';

export const STORAGE_MIGRATION_META_KEY = 'storage-migration-version';
export const STORAGE_MIGRATION_VERSION = '1';

export interface StorageMigrationResult {
  status: 'migrated' | 'already-migrated' | 'no-legacy-data';
}

const MIGRATED_LEGACY_KEYS = [
  STORAGE_KEYS.MARKDOWN,
  STORAGE_KEYS.PROFILES,
  STORAGE_KEYS.DRAFTS,
] as const;

function removeMigratedLegacyKeys(): void {
  for (const key of MIGRATED_LEGACY_KEYS) {
    storage.remove(key);
  }
}

export async function migrateLegacyStorageToIndexedDb(): Promise<StorageMigrationResult> {
  const completedVersion = await resumeRepository.getMeta(STORAGE_MIGRATION_META_KEY);
  if (completedVersion === STORAGE_MIGRATION_VERSION) {
    removeMigratedLegacyKeys();
    return { status: 'already-migrated' };
  }

  const markdown = storage.get<string | null>(STORAGE_KEYS.MARKDOWN, null);
  const profiles = storage.get<ResumeProfile[] | null>(STORAGE_KEYS.PROFILES, null);
  const drafts = storage.get<ResumeDraft[] | null>(STORAGE_KEYS.DRAFTS, null);
  const hasLegacyData = markdown !== null || Boolean(profiles?.length) || Boolean(drafts?.length);

  if (!hasLegacyData) {
    await resumeRepository.setMeta(STORAGE_MIGRATION_META_KEY, STORAGE_MIGRATION_VERSION);
    return { status: 'no-legacy-data' };
  }

  // Write first. Legacy localStorage remains untouched until all verification succeeds.
  if (markdown !== null) await resumeRepository.saveActiveMarkdown(markdown);
  if (profiles) await resumeRepository.replaceProfiles(profiles);
  if (drafts) await resumeRepository.replaceDrafts(drafts);

  const [storedMarkdown, storedProfiles, storedDrafts] = await Promise.all([
    resumeRepository.getActiveMarkdown(),
    resumeRepository.getProfiles(),
    resumeRepository.getDrafts(),
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

  // Mark complete only after verified writes, then remove only the core keys
  // that now have a verified IndexedDB copy. Lightweight UI preferences stay.
  await resumeRepository.setMeta(STORAGE_MIGRATION_META_KEY, STORAGE_MIGRATION_VERSION);
  removeMigratedLegacyKeys();
  return { status: 'migrated' };
}
