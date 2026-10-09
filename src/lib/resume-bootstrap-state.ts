import type { ResumeProfile } from '../types';

export interface ResumeBootstrapSnapshot {
  markdown: string | null;
  profiles: ResumeProfile[];
  jdText: string | null;
}

let bootstrapSnapshot: ResumeBootstrapSnapshot | null = null;

/**
 * In-memory handoff from the async IndexedDB bootstrap to the synchronously
 * created Zustand store. This avoids keeping core resume data in localStorage
 * just to make initial store creation synchronous.
 */
export function setResumeBootstrapSnapshot(snapshot: ResumeBootstrapSnapshot | null): void {
  bootstrapSnapshot = snapshot;
}

export function getResumeBootstrapSnapshot(): ResumeBootstrapSnapshot | null {
  return bootstrapSnapshot;
}

/**
 * Recover the authoritative active document and separately persisted settings
 * when a page closes while the profile archive is still being written.
 * Preserve all other profiles verbatim.
 */
export function reconcileActiveBootstrapProfile<T extends {
  id: string;
  markdown: string;
  settings: object;
}>(
  profiles: T[],
  activeId: string,
  savedDocument: string | null | undefined,
  activeSettings: T['settings'] | null | undefined,
): T[] {
  return profiles.map((profile) =>
    profile.id === activeId
      ? {
          ...profile,
          markdown: savedDocument ?? profile.markdown,
          settings: activeSettings ?? profile.settings,
        }
      : profile,
  );
}
