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
