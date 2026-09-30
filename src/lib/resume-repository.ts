import type { ResumeDraft, ResumeProfile } from '../types';
import { getResumeDatabase } from './resume-db';

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
    return getResumeDatabase().profiles.toArray();
  }

  async replaceProfiles(profiles: ResumeProfile[]): Promise<void> {
    const db = getResumeDatabase();
    await db.transaction('rw', db.profiles, async () => {
      await db.profiles.clear();
      if (profiles.length > 0) await db.profiles.bulkPut(profiles);
    });
  }

  async getDrafts(): Promise<ResumeDraft[]> {
    return getResumeDatabase().drafts.toArray();
  }

  async replaceDrafts(drafts: ResumeDraft[]): Promise<void> {
    const db = getResumeDatabase();
    await db.transaction('rw', db.drafts, async () => {
      await db.drafts.clear();
      if (drafts.length > 0) await db.drafts.bulkPut(drafts);
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
