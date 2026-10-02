import { describe, expect, it } from 'vitest';
import { getDegreeOptions, getJobStatusOptions } from '../lib/form-constants';
import { getPresetSection } from '../lib/form-helpers';
import { parseExperienceField } from '../lib/markdown-parser';
import { parseBasicInfoMetadata } from '../lib/preview-utils';
import { translateMarkdownContent } from '../lib/section-translator';
import { formatDateRange } from '../lib/date-parser';

describe('i18n language contract', () => {
  it('stores structured select values in the resume language', () => {
    expect(getDegreeOptions('en').map((option) => option.value)).toContain('Bachelor');
    expect(getDegreeOptions('en').map((option) => option.value)).not.toContain('本科');
    expect(getDegreeOptions('zh').map((option) => option.value)).toContain('本科');

    expect(getJobStatusOptions('en').map((option) => option.value)).toContain('Employed - Open to Offers');
    expect(getJobStatusOptions('en').map((option) => option.value)).not.toContain('在职-考虑机会');
    expect(getJobStatusOptions('zh').map((option) => option.value)).toContain('在职-考虑机会');
  });

  it('translates structured header metadata when resume language changes', () => {
    const zh = [
      '# 张三',
      '后端工程师',
      '3年工作经验 ｜ 本科 ｜ 在职-考虑机会',
      '',
      '## 工作经历',
      '- 示例',
    ].join('\n');

    const en = translateMarkdownContent(zh, 'en');
    expect(en).toContain('3 Years Experience ｜ Bachelor ｜ Employed - Open to Offers');
    expect(en).toContain('## Work Experience');

    const roundTrip = translateMarkdownContent(en, 'zh');
    expect(roundTrip).toContain('3年工作经验 ｜ 本科 ｜ 在职-考虑机会');
    expect(roundTrip).toContain('## 工作经历');
  });

  it('preserves already-English source headings while normalizing structured header metadata', () => {
    const source = [
      '# Alex',
      'Student / New Graduate | Bachelor | Employed - Open to Offers',
      '',
      '## Experience',
      '- Example',
    ].join('\n');

    expect(translateMarkdownContent(source, 'en')).toBe(source);
  });

  it('parses English graduate and job-status metadata after reload', () => {
    const parsed = parseExperienceField(
      'Student / New Graduate ｜ Bachelor ｜ Seattle ｜ Employed - Open to Offers',
    );

    expect(parsed.workYears).toBe('Student / New Graduate');
    expect(parsed.degree).toBe('Bachelor');
    expect(parsed.city).toBe('Seattle');
    expect(parsed.jobStatus).toBe('Employed - Open to Offers');
  });

  it('classifies English structured metadata correctly in preview', () => {
    const items = parseBasicInfoMetadata(
      'Student / New Graduate ｜ Bachelor ｜ Seattle ｜ Employed - Open to Offers',
      'en',
    );

    expect(items.map((item) => item.type)).toEqual(['exp', 'degree', 'location', 'status']);
  });

  it('formats ongoing dates from the resume language rather than the UI language', () => {
    expect(formatDateRange('2024.03 - 至今', 'month-short', true)).toBe('Mar 2024 – Present');
    expect(formatDateRange('2024.03 - 至今', 'cn-dot', false)).toBe('2024.03 - 至今');
  });

  it('uses canonical section titles for English presets', () => {
    expect(getPresetSection('summary', 'en').title).toBe('Summary');
    expect(getPresetSection('project', 'en').title).toBe('Projects');
    expect(getPresetSection('work', 'en').title).toBe('Work Experience');
  });
});
