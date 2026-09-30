import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS, storage } from './storage';

describe('storage.clearAllResumeData', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes every Resume Craft-owned key', () => {
    for (const key of Object.values(STORAGE_KEYS)) {
      localStorage.setItem(key, 'test');
    }

    expect(storage.clearAllResumeData()).toBe(true);

    for (const key of Object.values(STORAGE_KEYS)) {
      expect(localStorage.getItem(key)).toBeNull();
    }
  });

  it('does not remove unrelated origin data', () => {
    localStorage.setItem('another-app:key', 'keep-me');
    localStorage.setItem(STORAGE_KEYS.MARKDOWN, '# Resume');

    expect(storage.clearAllResumeData()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.MARKDOWN)).toBeNull();
    expect(localStorage.getItem('another-app:key')).toBe('keep-me');
  });
});
