import { describe, expect, it } from 'vitest';
import { getSharedResumePaperName } from '../components/share/SharedResumePage';

describe('shared resume paper copy', () => {
  it('uses US Letter for letter-sized shared resumes', () => {
    expect(getSharedResumePaperName('letter', true)).toBe('US Letter');
    expect(getSharedResumePaperName('letter', false)).toBe('US Letter');
  });

  it('uses A4 for A4 and legacy shared resumes without paper metadata', () => {
    expect(getSharedResumePaperName('a4', true)).toBe('A4');
    expect(getSharedResumePaperName(undefined, false)).toBe('A4');
  });
});
