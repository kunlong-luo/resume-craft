import { describe, expect, it, vi } from 'vitest';
import { getDegreeOptions, getJobStatusOptions } from '../lib/form-constants';
import { getPresetSection, getStarTemplate } from '../lib/form-helpers';
import { parseExperienceField } from '../lib/markdown-parser';
import { parseBasicInfoMetadata } from '../lib/preview-utils';
import { translateMarkdownContent, translateSectionTitle } from '../lib/section-translator';
import { formatDateRange } from '../lib/date-parser';
import { getTranslation } from '../i18n';
import { analyzeResume } from '../lib/resume-checker-utils';

describe('i18n language contract', () => {
  it.each([
    { ui: 'zh', resume: 'zh', uiTitle: '基本信息', sectionTitle: '工作经历', ongoing: '2024.03 — 至今', starText: '核心职责' },
    { ui: 'zh', resume: 'en', uiTitle: '基本信息', sectionTitle: 'Work Experience', ongoing: 'Mar 2024 – Present', starText: 'Core Responsibilities' },
    { ui: 'en', resume: 'zh', uiTitle: 'Basic Info', sectionTitle: '工作经历', ongoing: '2024.03 — 至今', starText: '核心职责' },
    { ui: 'en', resume: 'en', uiTitle: 'Basic Info', sectionTitle: 'Work Experience', ongoing: 'Mar 2024 – Present', starText: 'Core Responsibilities' },
  ] as const)(
    'keeps UI $ui independent from resume $resume',
    ({ ui, resume, uiTitle, sectionTitle, ongoing, starText }) => {
      const uiCopy = getTranslation(ui);
      const preset = getPresetSection('work', resume);
      const star = getStarTemplate(preset.title, resume);

      expect(uiCopy.form.basic.title).toBe(uiTitle);
      expect(preset.title).toBe(sectionTitle);
      expect(star.content).toContain(starText);
      expect(
        formatDateRange(
          '2024.03 - 至今',
          resume === 'en' ? 'month-short' : 'cn-dot',
          resume === 'en',
        ),
      ).toBe(ongoing);
    },
  );

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
    expect(formatDateRange('2024.03 - 至今', 'cn-dot', false)).toBe('2024.03 — 至今');
  });

  it('standardizes dedicated natural-language headings bidirectionally', () => {
    expect(translateSectionTitle('语言能力', 'en')).toBe('Languages');
    expect(translateSectionTitle('外语能力', 'en')).toBe('Languages');
    expect(translateSectionTitle('Languages', 'zh')).toBe('语言能力');
    expect(translateSectionTitle('Language Proficiency', 'zh')).toBe('语言能力');
  });

  it('standardizes interests and references headings bidirectionally', () => {
    expect(translateSectionTitle('兴趣爱好', 'en')).toBe('Interests');
    expect(translateSectionTitle('推荐人', 'en')).toBe('References');
    expect(translateSectionTitle('Hobbies', 'zh')).toBe('兴趣爱好');
    expect(translateSectionTitle('Professional References', 'zh')).toBe('推荐人');
  });

  it('standardizes volunteer and publications headings bidirectionally', () => {
    expect(translateSectionTitle('志愿服务', 'en')).toBe('Volunteer Experience');
    expect(translateSectionTitle('论文发表', 'en')).toBe('Publications');
    expect(translateSectionTitle('Volunteer Work', 'zh')).toBe('志愿经历');
    expect(translateSectionTitle('Published Work', 'zh')).toBe('发表与出版');
  });

  it('uses canonical section titles for English presets', () => {
    expect(getPresetSection('summary', 'en').title).toBe('Summary');
    expect(getPresetSection('project', 'en').title).toBe('Projects');
    expect(getPresetSection('work', 'en').title).toBe('Work Experience');
  });
  describe('checker fixes follow resume language, not interface language', () => {
    it.each([
      { ui: 'en', resume: 'zh', expectedName: '# 你的姓名' },
      { ui: 'zh', resume: 'en', expectedName: '# Your Name' },
      { ui: 'en', resume: 'en', expectedName: '# Your Name' },
      { ui: 'zh', resume: 'zh', expectedName: '# 你的姓名' },
    ] as const)(
      'preserves the source while adding a $resume name heading in $ui UI',
      ({ ui, resume, expectedName }) => {
        const source = 'name@example.com\\n\\n## Custom Section\\n- Keep **all** original data';
        const onChange = vi.fn();
        const analysis = analyzeResume(source, onChange, ui, resume === 'en' ? 'us' : 'cn', null, resume);
        const fix = analysis.issues.find((issue) => issue.category === 'content' && issue.title.includes(ui === 'en' ? 'Missing name' : '缺失姓名'));
        expect(fix?.fixable).toBe(true);
        fix?.onFix?.();
        expect(onChange).toHaveBeenCalledTimes(1);
        const fixed = onChange.mock.calls[0][0] as string;
        expect(fixed).toContain(expectedName);
        expect(fixed).toContain(source);
      },
    );

    it.each([
      { ui: 'zh', resume: 'en', bullet: '- I built the service.', fixed: '- Built the service.' },
      { ui: 'en', resume: 'zh', bullet: '- 我主导了平台设计。', fixed: '- 主导平台设计。' },
    ] as const)(
      'detects and fixes $resume pronouns with $ui UI',
      ({ ui, resume, bullet, fixed }) => {
        const source = ['# Candidate', '', '## Work Experience', bullet].join('\\n');
        const onChange = vi.fn();
        const analysis = analyzeResume(source, onChange, ui, resume === 'en' ? 'us' : 'cn', null, resume);
        const issue = analysis.issues.find((entry) => entry.title.includes(ui === 'en' ? 'Subjective Pronouns' : '主观人称'));
        expect(issue?.type).toBe('warning');
        expect(issue?.fixable).toBe(true);
        issue?.onFix?.();
        expect(onChange.mock.calls[0][0]).toContain(fixed);
      },
    );

    it('uses English resume vocabulary when the UI is Chinese for date normalization', () => {
      const source = '# Candidate\\n\\n## Experience\\n### Acme | Engineer | 2024.03 - 至今\\n- Built tools.';
      const onChange = vi.fn();
      const analysis = analyzeResume(source, onChange, 'zh', 'us', null, 'en');
      const issue = analysis.issues.find((entry) => entry.category === 'market' && entry.fixable);
      expect(issue).toBeDefined();
      issue?.onFix?.();
      expect(onChange.mock.calls[0][0]).toContain('Mar 2024 – Present');
    });
  });

});
