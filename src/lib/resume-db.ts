import Dexie, { type EntityTable } from 'dexie';
import type { ResumeDraft, ResumeProfile } from '../types';

export const RESUME_DB_NAME = 'resume-craft';
export const RESUME_DB_VERSION = 1;

export interface ResumeDocumentRecord {
  id: string;
  markdown: string;
  updatedAt: string;
}

export interface ResumeProfileRecord extends ResumeProfile {
  sortIndex: number;
}

export interface ResumeDraftRecord extends ResumeDraft {
  sortIndex: number;
}

export interface ResumeMetaRecord {
  key: string;
  value: string;
  updatedAt: string;
}

export class ResumeCraftDatabase extends Dexie {
  documents!: EntityTable<ResumeDocumentRecord, 'id'>;
  profiles!: EntityTable<ResumeProfileRecord, 'id'>;
  drafts!: EntityTable<ResumeDraftRecord, 'id'>;
  meta!: EntityTable<ResumeMetaRecord, 'key'>;

  constructor() {
    super(RESUME_DB_NAME);
    this.version(RESUME_DB_VERSION).stores({
      documents: 'id, sortIndex, updatedAt',
      profiles: 'id, sortIndex, updatedAt, createdAt',
      drafts: 'id, sortIndex, timestamp, isAutoSave',
      meta: 'key, updatedAt',
    });
  }
}

let database: ResumeCraftDatabase | null = null;

export function getResumeDatabase(): ResumeCraftDatabase {
  database ??= new ResumeCraftDatabase();
  return database;
}

export async function deleteResumeDatabase(): Promise<void> {
  if (database) {
    database.close();
    database = null;
  }
  await Dexie.delete(RESUME_DB_NAME);
}
