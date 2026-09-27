import { describe, expect, it } from 'vitest';
import { migrateStoredMarkdown } from '../lib/markdown-migrations';

describe('stored Markdown migrations', () => {
  it('preserves ordinary user content while applying structural rewrites', () => {
    const input = [
      '# Candidate',
      '',
      'Worked at Example Company on a privacy-sensitive project.',
      '',
      'GitHub：github.com/example',
      '',
      '## 教育经历',
      'Example University',
    ].join('\n');

    const migrated = migrateStoredMarkdown(input);

    expect(migrated).toContain('Worked at Example Company on a privacy-sensitive project.');
    expect(migrated).toContain('https://github.com/example');
    expect(migrated).toContain('## 教育背景');
  });

  it('moves legacy project roles into structured project headings', () => {
    const input = [
      '# Candidate',
      '',
      '## 代表项目',
      '',
      '### FlexAgent - 开源大模型多Agent低代码编排系统　*2025.01 — 至今*',
      '- **项目角色：** 独立作者与主导设计',
      '- **技术选型：** Next.js, FastAPI, PostgreSQL',
      '- **核心贡献：**',
      '  - Built the orchestration engine.',
    ].join('\n');

    const migrated = migrateStoredMarkdown(input);

    expect(migrated).toContain(
      '### FlexAgent - 开源大模型多Agent低代码编排系统 ｜ 独立作者与主导设计 ｜ *2025.01 — 至今*',
    );
    expect(migrated).not.toContain('- **项目角色：** 独立作者与主导设计');
    expect(migrated).toContain('- **技术选型：** Next.js, FastAPI, PostgreSQL');
    expect(migrated).toContain('  - Built the orchestration engine.');
  });

  it('supports legacy English Project Role lines', () => {
    const input = [
      '# Candidate',
      '',
      '## Projects',
      '',
      '### Search Platform *2024.01 - Present*',
      '- **Project Role:** Lead Developer',
      '- Improved retrieval quality.',
    ].join('\n');

    const migrated = migrateStoredMarkdown(input);

    expect(migrated).toContain(
      '### Search Platform ｜ Lead Developer ｜ *2024.01 - Present*',
    );
    expect(migrated).not.toContain('**Project Role:**');
  });

  it('does not move project-role-like bullets outside project sections', () => {
    const input = [
      '# Candidate',
      '',
      '## 工作经历',
      '',
      '### Example Company *2024.01 - Present*',
      '- **项目角色：** 负责内部项目协调',
    ].join('\n');

    expect(migrateStoredMarkdown(input)).toContain(
      '- **项目角色：** 负责内部项目协调',
    );
  });

  it('removes duplicate education sections without deleting unrelated sections', () => {
    const input = [
      '# Candidate',
      '',
      '## 教育背景',
      'School A',
      '',
      '## 项目经历',
      'Project A',
      '',
      '## 教育背景',
      'School B',
    ].join('\n');

    const migrated = migrateStoredMarkdown(input);

    expect(migrated.match(/## 教育背景/g)).toHaveLength(1);
    expect(migrated).toContain('## 项目经历');
    expect(migrated).toContain('Project A');
  });
});
