import type { ResumeProfile } from '../types';
import { resumeRepository } from './resume-repository';
import { STORAGE_HEALTH_EVENT } from './storage';

export interface PersistedResumeSnapshot {
  markdown: string;
  profiles: ResumeProfile[];
  jdText: string;
}

const DEFAULT_DEBOUNCE_MS = 350;

/**
 * Coalesces rapid editor updates into a single asynchronous IndexedDB write.
 * localStorage remains the v2.2 rollback source during the v2.3 rollout.
 */
export function createResumePersistenceCoordinator(debounceMs = DEFAULT_DEBOUNCE_MS) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: PersistedResumeSnapshot | null = null;
  let writeChain: Promise<void> = Promise.resolve();
  let hasWriteFailure = false;

  const emitHealth = (status: 'error' | 'recovered', error?: unknown) => {
    if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') return;
    const errorName =
      error && typeof error === 'object' && 'name' in error
        ? String((error as { name?: unknown }).name ?? '')
        : '';
    window.dispatchEvent(new CustomEvent(STORAGE_HEALTH_EVENT, {
      detail: {
        status,
        operation: 'set',
        key: 'indexeddb',
        quotaExceeded: errorName === 'QuotaExceededError',
      },
    }));
  };

  const persist = (snapshot: PersistedResumeSnapshot) => {
    // A failed write must not poison every later autosave attempt.
    writeChain = writeChain
      .catch(() => undefined)
      .then(async () => {
        try {
          const writeSnapshot = async () => {
            await resumeRepository.saveSnapshot({
              markdown: snapshot.markdown,
              profiles: snapshot.profiles,
              jdText: snapshot.jdText,
            });
          };

          if (typeof navigator !== 'undefined' && navigator.locks?.request) {
            await navigator.locks.request('resume-craft:indexeddb-write', writeSnapshot);
          } else {
            await writeSnapshot();
          }

          if (hasWriteFailure) emitHealth('recovered');
          hasWriteFailure = false;
        } catch (error) {
          if (!hasWriteFailure) emitHealth('error', error);
          hasWriteFailure = true;
          throw error;
        }
      });
    return writeChain;
  };

  const flush = async () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const snapshot = pending;
    pending = null;
    if (snapshot) await persist(snapshot);
    await writeChain;
  };

  const schedule = (snapshot: PersistedResumeSnapshot) => {
    pending = snapshot;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      const next = pending;
      pending = null;
      if (next) void persist(next).catch((error) => {
        console.error('[resume-persistence] IndexedDB autosave failed:', error);
      });
    }, debounceMs);
  };

  const dispose = async () => {
    await flush();
  };

  return { schedule, flush, dispose };
}
