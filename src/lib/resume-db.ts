import Dexie, { type EntityTable } from 'dexie';
import type { ResumeDraft, ResumeProfile } from '../types';

export const RESUME_DB_NAME = 'resume-craft';
export const RESUME_DB_VERSION = 2;

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
    // v1 existed briefly during v2.3 development. Keep its real schema
    // declared so preview/test databases can upgrade without a schema mismatch.
    this.version(1).stores({
      documents: 'id, updatedAt',
      profiles: 'id, updatedAt, createdAt',
      drafts: 'id, timestamp, isAutoSave',
      meta: 'key, updatedAt',
    });

    this.version(RESUME_DB_VERSION)
      .stores({
        documents: 'id, updatedAt',
        profiles: 'id, sortIndex, updatedAt, createdAt',
        drafts: 'id, sortIndex, timestamp',
        meta: 'key, updatedAt',
      })
      .upgrade(async (tx) => {
        let profileIndex = 0;
        await tx.table<ResumeProfileRecord, string>('profiles').toCollection().modify((profile) => {
          if (!Number.isFinite(profile.sortIndex)) profile.sortIndex = profileIndex;
          profileIndex += 1;
        });

        let draftIndex = 0;
        await tx.table<ResumeDraftRecord, string>('drafts').toCollection().modify((draft) => {
          if (!Number.isFinite(draft.sortIndex)) draft.sortIndex = draftIndex;
          draftIndex += 1;
        });
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
