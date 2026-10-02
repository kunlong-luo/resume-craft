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

  // Short English resumes and pasted snippets often contain fewer than 12
  // words. When there is no Chinese text, a small but clear Latin signal or
  // a canonical resume heading is enough to classify the content as English.
  if (
    cjkCount === 0 &&
    (
      latinWordCount >= 3 ||
      /\b(?:experience|education|skills|summary|projects?|resume|curriculum vitae)\b/i.test(rawText)
    )
  ) {
    return 'en';
  }

  return cjkCount > 0 ? 'zh' : fallback;
}
