/**
 * Centralized Type-Safe Local Storage & Cache Management
 * 统一客户端本地存储与缓存管理模块
 */

export const STORAGE_KEYS = {
  MARKDOWN: 'resume-markdown',
  SETTINGS: 'resume-settings',
  UI_LANGUAGE: 'resume_ui_language',
  THEME_MODE: 'resume_theme_mode',
  PREVIEW_ZOOM: 'resume_preview_zoom',
  DRAFTS: 'resume-drafts',
  MATRIX: 'resume-matrix',
  PROFILES: 'resume-profiles',
  ACTIVE_PROFILE_ID: 'resume-active-profile-id',
  JD_TEXT: 'resume-jd-text',
  CUSTOM_FILE_NAME: 'resume-custom-filename',
  CHECKER_STATE: 'resume-checker-state',
  PHONE_REGIONS: 'resume-phone-regions',
  ONBOARDING_FIRST_VISIT: 'resume-onboarding-first-visit',
  ONBOARDING_COMPLETE: 'resume-onboarding-v1-complete',
  SPLIT_RATIO: 'resume-split-ratio',
  SUPPORT_PROMPT: 'resume-craft.support-prompt.v1',
} as const;

export const STORAGE_HEALTH_EVENT = 'resume-craft:storage-health';

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS] | string;
export type StorageOperation = 'set' | 'remove' | 'clear';

export interface StorageHealthDetail {
  status: 'error' | 'recovered';
  operation: StorageOperation;
  key?: string;
  quotaExceeded?: boolean;
}

let hasWriteFailure = false;

export function isQuotaExceededError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false;

  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  );
}

function emitStorageHealth(detail: StorageHealthDetail) {
  if (
    typeof window === 'undefined' ||
    typeof window.dispatchEvent !== 'function' ||
    typeof CustomEvent === 'undefined'
  ) {
    return;
  }

  window.dispatchEvent(new CustomEvent<StorageHealthDetail>(STORAGE_HEALTH_EVENT, { detail }));
}

function reportWriteSuccess(operation: StorageOperation, key?: StorageKey) {
  if (!hasWriteFailure) return;

  hasWriteFailure = false;
  const detail: StorageHealthDetail = {
    status: 'recovered',
    operation,
  };
  if (key !== undefined) detail.key = String(key);
  emitStorageHealth(detail);
}

function reportWriteFailure(operation: StorageOperation, error: unknown, key?: StorageKey) {
  const shouldNotify = !hasWriteFailure;
  hasWriteFailure = true;

  if (!shouldNotify) return;

  const detail: StorageHealthDetail = {
    status: 'error',
    operation,
    quotaExceeded: isQuotaExceededError(error),
  };
  if (key !== undefined) detail.key = String(key);
  emitStorageHealth(detail);
}

export const storage = {
  /** Get an item from localStorage with type safety and fallback. */
  get<T>(key: StorageKey, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(key);
      if (item === null || item === undefined) return fallback;
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as unknown as T;
      }
    } catch (error) {
      console.warn(`[storage] Error reading key "${key}":`, error);
      return fallback;
    }
  },

  /** Get raw string from localStorage. */
  getString(key: StorageKey, fallback: string = ''): string {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(key);
      return item !== null ? item : fallback;
    } catch (error) {
      console.warn(`[storage] Error reading string key "${key}":`, error);
      return fallback;
    }
  },

  /** Set an item in localStorage. */
  set<T>(key: StorageKey, value: T): boolean {
    if (typeof window === 'undefined') return false;
    try {
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }

      reportWriteSuccess('set', key);
      return true;
    } catch (error) {
      console.error(`[storage] Error setting key "${key}":`, error);
      reportWriteFailure('set', error, key);
      return false;
    }
  },

  /** Remove an item from localStorage. */
  remove(key: StorageKey): boolean {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.removeItem(key);
      reportWriteSuccess('remove', key);
      return true;
    } catch (error) {
      console.warn(`[storage] Error removing key "${key}":`, error);
      reportWriteFailure('remove', error, key);
      return false;
    }
  },

  /**
   * Clear only Resume Craft-owned local data. Never call localStorage.clear(),
   * because another app may share the same origin during development/self-hosting.
   */
  clearAllResumeData(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
      reportWriteSuccess('clear');
      return true;
    } catch (error) {
      console.error('[storage] Error clearing resume data:', error);
      reportWriteFailure('clear', error);
      return false;
    }
  }
};
