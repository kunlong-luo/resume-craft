import type { ResumeDraft, ResumeProfile } from '../types';
import { getResumeDatabase, type ResumeDraftRecord, type ResumeProfileRecord } from './resume-db';

const ACTIVE_DOCUMENT_ID = 'active';

export interface ResumeRepository {
  getActiveMarkdown(): Promise<string | null>;
  saveActiveMarkdown(markdown: string): Promise<void>;
  getProfiles(): Promise<ResumeProfile[]>;
  replaceProfiles(profiles: ResumeProfile[]): Promise<void>;
  getDrafts(): Promise<ResumeDraft[]>;
  replaceDrafts(drafts: ResumeDraft[]): Promise<void>;
  getMeta(key: string): Promise<string | null>;
  setMeta(key: string, value: string): Promise<void>;
}

function stripSortIndex<T extends { sortIndex: number }>(record: T): Omit<T, 'sortIndex'> {
  const { sortIndex: _sortIndex, ...value } = record;
  return value;
}

export class IndexedDbResumeRepository implements ResumeRepository {
  async getActiveMarkdown(): Promise<string | null> {
    const record = await getResumeDatabase().documents.get(ACTIVE_DOCUMENT_ID);
    return record?.markdown ?? null;
  }

  async saveActiveMarkdown(markdown: string): Promise<void> {
    await getResumeDatabase().documents.put({
      id: ACTIVE_DOCUMENT_ID,
      markdown,
      updatedAt: new Date().toISOString(),
    });
  }

  async getProfiles(): Promise<ResumeProfile[]> {
    const records = await getResumeDatabase().profiles.orderBy('sortIndex').toArray();
    return records.map((record) => stripSortIndex(record) as ResumeProfile);
  }

  async replaceProfiles(profiles: ResumeProfile[]): Promise<void> {
    const db = getResumeDatabase();
    const records: ResumeProfileRecord[] = profiles.map((profile, sortIndex) => ({ ...profile, sortIndex }));
    await db.transaction('rw', db.profiles, async () => {
      await db.profiles.clear();
      if (records.length > 0) await db.profiles.bulkPut(records);
    });
  }

  async getDrafts(): Promise<ResumeDraft[]> {
    const records = await getResumeDatabase().drafts.orderBy('sortIndex').toArray();
    return records.map((record) => stripSortIndex(record) as ResumeDraft);
  }

  async replaceDrafts(drafts: ResumeDraft[]): Promise<void> {
    const db = getResumeDatabase();
    const records: ResumeDraftRecord[] = drafts.map((draft, sortIndex) => ({ ...draft, sortIndex }));
    await db.transaction('rw', db.drafts, async () => {
      await db.drafts.clear();
      if (records.length > 0) await db.drafts.bulkPut(records);
    });
  }

  async getMeta(key: string): Promise<string | null> {
    const record = await getResumeDatabase().meta.get(key);
    return record?.value ?? null;
  }

  async setMeta(key: string, value: string): Promise<void> {
    await getResumeDatabase().meta.put({
      key,
      value,
      updatedAt: new Date().toISOString(),
    });
  }
}

export const resumeRepository: ResumeRepository = new IndexedDbResumeRepository();
