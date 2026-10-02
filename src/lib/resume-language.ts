import type { Language } from '../types';

/**
 * Detect the dominant language of resume body text without consulting UI state.
 *
 * This intentionally stays dependency-light because it is used by strict
 * import/share validation paths as well as the interactive import flow.
 */
export function detectResumeLanguage(
  rawText: string,
  fallback: Language = 'zh',
): Language {
  if (!rawText || !rawText.trim()) return fallback;

  const cjkCount = (rawText.match(/[\u4e00-\u9fff]/g) || []).length;
  const latinWordCount = (rawText.match(/\b[A-Za-z]{2,}\b/g) || []).length;

  // Require a meaningful Chinese signal rather than treating a few names or
  // company labels as sufficient to flip an otherwise English resume.
  if (cjkCount >= 12 && cjkCount >= latinWordCount * 0.35) {
    return 'zh';
  }

  if (latinWordCount >= 12) {
    return 'en';
  }

  return cjkCount > 0 ? 'zh' : fallback;
}
