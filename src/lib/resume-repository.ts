import type { ResumeDraft, ResumeProfile } from '../types';
import { getResumeDatabase, type ResumeDraftRecord, type ResumeProfileRecord } from './resume-db';

const ACTIVE_DOCUMENT_ID = 'active';
const JD_DOCUMENT_ID = 'jd';

export interface ResumeRepositorySnapshot {
  markdown?: string | null;
  profiles?: ResumeProfile[] | null;
  drafts?: ResumeDraft[] | null;
  jdText?: string | null;
}

export interface ResumeRepository {
  getActiveMarkdown(): Promise<string | null>;
  saveActiveMarkdown(markdown: string): Promise<void>;
  getJdText(): Promise<string | null>;
  saveJdText(text: string): Promise<void>;
  saveSnapshot(snapshot: ResumeRepositorySnapshot): Promise<void>;
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

export function toProfileRecords(profiles: ResumeProfile[]): ResumeProfileRecord[] {
  return profiles.map((profile, sortIndex) => ({ ...profile, sortIndex }));
}

export function fromProfileRecords(records: ResumeProfileRecord[]): ResumeProfile[] {
  return [...records]
    .sort((a, b) => a.sortIndex - b.sortIndex)
    .map((record) => stripSortIndex(record) as ResumeProfile);
}

export function toDraftRecords(drafts: ResumeDraft[]): ResumeDraftRecord[] {
  return drafts.map((draft, sortIndex) => ({ ...draft, sortIndex }));
}

export function fromDraftRecords(records: ResumeDraftRecord[]): ResumeDraft[] {
  return [...records]
    .sort((a, b) => a.sortIndex - b.sortIndex)
    .map((record) => stripSortIndex(record) as ResumeDraft);
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

  async getJdText(): Promise<string | null> {
    const record = await getResumeDatabase().documents.get(JD_DOCUMENT_ID);
    return record?.markdown ?? null;
  }

  async saveJdText(text: string): Promise<void> {
    await getResumeDatabase().documents.put({
      id: JD_DOCUMENT_ID,
      markdown: text,
      updatedAt: new Date().toISOString(),
    });
  }

  async saveSnapshot(snapshot: ResumeRepositorySnapshot): Promise<void> {
    const db = getResumeDatabase();
    const now = new Date().toISOString();
    const profileRecords: ResumeProfileRecord[] | null =
      snapshot.profiles == null
        ? null
        : toProfileRecords(snapshot.profiles);
    const draftRecords: ResumeDraftRecord[] | null =
      snapshot.drafts == null
        ? null
        : toDraftRecords(snapshot.drafts);

    await db.transaction('rw', db.documents, db.profiles, db.drafts, async () => {
      if (snapshot.markdown != null) {
        await db.documents.put({
          id: ACTIVE_DOCUMENT_ID,
          markdown: snapshot.markdown,
          updatedAt: now,
        });
      }
      if (snapshot.jdText != null) {
        await db.documents.put({
          id: JD_DOCUMENT_ID,
          markdown: snapshot.jdText,
          updatedAt: now,
        });
      }
      if (profileRecords) {
        await db.profiles.clear();
        if (profileRecords.length > 0) await db.profiles.bulkPut(profileRecords);
      }
      if (draftRecords) {
        await db.drafts.clear();
        if (draftRecords.length > 0) await db.drafts.bulkPut(draftRecords);
      }
    });
  }

  async getProfiles(): Promise<ResumeProfile[]> {
    const records = await getResumeDatabase().profiles.orderBy('sortIndex').toArray();
    return fromProfileRecords(records);
  }

  async replaceProfiles(profiles: ResumeProfile[]): Promise<void> {
    const db = getResumeDatabase();
    const records = toProfileRecords(profiles);
    await db.transaction('rw', db.profiles, async () => {
      await db.profiles.clear();
      if (records.length > 0) await db.profiles.bulkPut(records);
    });
  }

  async getDrafts(): Promise<ResumeDraft[]> {
    const records = await getResumeDatabase().drafts.orderBy('sortIndex').toArray();
    return fromDraftRecords(records);
  }

  async replaceDrafts(drafts: ResumeDraft[]): Promise<void> {
    const db = getResumeDatabase();
    const records = toDraftRecords(drafts);
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
