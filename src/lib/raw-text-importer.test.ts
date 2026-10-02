import { describe, expect, it } from 'vitest';
import { parseRawTextToResumeMarkdown } from './raw-text-importer';
import { detectResumeLanguage } from './resume-language';

describe('raw text resume import', () => {
  it('detects international phone numbers from pasted resume text', () => {
    const result = parseRawTextToResumeMarkdown(
      [
        'Alex Morgan',
        '+44 20 7946 0958 | alex@example.com',
        'Software Engineer',
        'Experience',
        'Example Ltd',
      ].join('\n'),
    );

    expect(result).toContain('+44 20 7946 0958');
    expect(result).toContain('alex@example.com');
  });

  it('does not inject a China-specific phone placeholder when none exists', () => {
    const result = parseRawTextToResumeMarkdown(
      ['Alex Morgan', 'alex@example.com', 'Software Engineer'].join('\n'),
    );

    expect(result).not.toContain('138-0000-0000');
  });

  it('detects short English resume snippets even when the fallback language is Chinese', () => {
    expect(
      detectResumeLanguage(
        ['Alex Morgan', 'Software Engineer', 'Experience'].join('\n'),
        'zh',
      ),
    ).toBe('en');
  });

  it('generates English structure for English raw text without Chinese placeholders', () => {
    const result = parseRawTextToResumeMarkdown(
      [
        'Alex Morgan',
        'Software Engineer',
        'alex@example.com | Seattle',
        'Work Experience',
        'Example Technologies | Engineer | 2023.01 - Present',
        '- Built distributed services.',
        'Skills',
        'TypeScript, Java, PostgreSQL',
      ].join('\n'),
    );

    expect(result).toContain('# Alex Morgan');
    expect(result).toContain('## Work Experience');
    expect(result).toContain('## Skills');
    expect(result).not.toMatch(/求职者姓名|个人简介|经历概述|工作经历|专业技能|City \/ 城市|微信:/);
  });

  it('uses English fallback labels when an English import has no name or contacts', () => {
    const result = parseRawTextToResumeMarkdown(
      [
        '2023.01 - 2025.06',
        'Built reliable distributed services for global customers.',
        'Improved deployment quality and release speed.',
      ].join('\n'),
      'en',
    );

    expect(result).toContain('# Candidate Name');
    expect(result).toContain('your_email@example.com | City');
    expect(result).toContain('## Summary');
    expect(result).toContain('- 2023.01 - 2025.06');
    expect(result).not.toContain('- 023.01 - 2025.06');
    expect(result).not.toContain('求职者姓名');
    expect(result).not.toContain('城市');
  });

  it('keeps Chinese structure for Chinese raw text', () => {
    const result = parseRawTextToResumeMarkdown(
      [
        '张三',
        '后端工程师',
        'zhangsan@example.com | 杭州',
        '工作经历',
        '示例科技有限公司 | Java 工程师 | 2023.01 - 至今',
        '- 负责核心服务开发。',
        '专业技能',
        'Java、Spring Boot、PostgreSQL',
      ].join('\n'),
    );

    expect(result).toContain('# 张三');
    expect(result).toContain('## 工作经历');
    expect(result).toContain('## 专业技能');
    expect(result).not.toContain('## Work Experience');
  });
});
