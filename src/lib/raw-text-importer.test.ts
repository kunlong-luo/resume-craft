import { describe, expect, it } from 'vitest';
import { parseRawTextToResumeMarkdown } from './raw-text-importer';

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
  it('keeps English raw imports free of Chinese-generated placeholders and headings', () => {
    const result = parseRawTextToResumeMarkdown(
      [
        'Alex Morgan',
        'Software Engineer',
        'alex@example.com | Seattle, WA',
        'Experience',
        'Example Labs | Senior Engineer | 2023.01 - Present',
        '- Built distributed systems that improved reliability and reduced deployment time across production services.',
        'Skills',
        '- TypeScript, React, Node.js, PostgreSQL',
      ].join('\n'),
    );

    expect(result).toContain('# Alex Morgan');
    expect(result).toContain('## Work Experience');
    expect(result).toContain('## Skills');
    expect(result).not.toMatch(/[求职者姓名工作经历专业技能个人简介城市]/);
  });

  it('keeps Chinese raw imports in Chinese content language', () => {
    const result = parseRawTextToResumeMarkdown(
      [
        '张三',
        '后端工程师',
        'zhangsan@example.com',
        '工作经历',
        '示例科技有限公司 | 高级工程师 | 2023.01 - 至今',
        '- 负责核心平台研发与性能优化，持续提升系统稳定性。',
      ].join('\n'),
    );

    expect(result).toContain('# 张三');
    expect(result).toContain('## 工作经历');
    expect(result).not.toContain('## Work Experience');
  });

});
