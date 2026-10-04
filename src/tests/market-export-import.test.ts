import { describe, it, expect } from 'vitest';
import {
  getMarketDefaultFileName,
  generateCleanAtsPlainText,
  exportToJsonResume,
  importFromJsonResume,
  adaptMarkdownToTargetMarket,
} from '../lib/export-utils';
import { detectResumeMarket } from '../lib/raw-text-importer';
import { detectResumeLanguage } from '../lib/resume-language';
import { ResumeSettings } from '../types';

const baseSettings: ResumeSettings = {
  themeColor: 'indigo',
  fontSize: 'standard',
  fontFamily: 'sans',
  margin: 'standard',
  layoutMode: 'split',
  h2Style: 'accent-line',
  topAccentLine: true,
  lineHeight: 1.5,
  blockGap: 1.5,
  letterSpacing: 0,
  showPageBreakLine: true,
  templateLayout: 'single',
  paperSize: 'letter',
  marketRegion: 'us',
  dateStyle: 'month-short',
  lang: 'en',
};

describe('Phase 6: Multi-Market Export, Import & Formatting Ecosystem', () => {
  const sampleUsMarkdown = `# Alex Morgan
> **Senior Cloud Architect**
alex@example.com | (415) 555-0199 | San Francisco, CA | [GitHub](https://github.com/alexmorgan)

## Work Experience

### Amazon Web Services | Principal Engineer | 2021.03 – Present
- Designed serverless data ingestion pipelines processing 50TB+ daily.
- Improved query latency by 42% using multi-region caching.

## Education

### UC Berkeley | B.S. Computer Science | 2016.09 – 2020.06
- GPA: 3.9/4.0, Dean's Honors List.
`;

  const sampleCnMarkdown = `# 李明
> **高级前端工程师**
13800000000 | liming@example.com | 杭州 | 微信: liming_dev

## 工作经历

### 阿里巴巴 | 前端技术专家 | 2021.06 - 至今
- 负责核心中台微前端架构设计与落地实施。
- 优化首屏加载性能，耗时降低 50%。

## 教育背景

### 浙江大学 | 软件工程 (本科) | 2017.09 - 2021.06
`;

  const sampleUkMarkdown = `# Oliver Smith
> **Full Stack Developer**
oliver@example.co.uk | +44 7700 900077 | London, UK | Postcode: EC1A 1BB

## Work Experience

### Barclays | Senior Engineer | October 2020 – Present
- Built real-time transaction monitoring microservices.
`;

  describe('Market-Aware Default Export Filenames', () => {
    it('generates US/CA standard filename format', () => {
      const filename = getMarketDefaultFileName({
        markdown: sampleUsMarkdown,
        settings: { ...baseSettings, marketRegion: 'us', lang: 'en' },
      });
      expect(filename).toBe('Alex Morgan - Senior Cloud Architect - Resume');
    });

    it('generates UK/IE standard filename format (Curriculum Vitae)', () => {
      const filename = getMarketDefaultFileName({
        markdown: sampleUsMarkdown,
        settings: { ...baseSettings, marketRegion: 'uk', lang: 'en' },
      });
      expect(filename).toBe('Alex Morgan - Senior Cloud Architect - Curriculum Vitae');
    });

    it('generates CN standard filename format (个人简历)', () => {
      const filename = getMarketDefaultFileName({
        markdown: sampleCnMarkdown,
        settings: { ...baseSettings, marketRegion: 'cn', lang: 'zh' },
      });
      expect(filename).toBe('李明 - 高级前端工程师 - 个人简历');
    });

    it('respects custom filename when specified', () => {
      const filename = getMarketDefaultFileName({
        markdown: sampleUsMarkdown,
        settings: baseSettings,
        customFileName: 'My_Custom_Resume_2026',
        extension: 'pdf',
      });
      expect(filename).toBe('My_Custom_Resume_2026.pdf');
    });

    it('does not duplicate known export extensions in custom file names', () => {
      expect(
        getMarketDefaultFileName({
          markdown: sampleUsMarkdown,
          settings: baseSettings,
          customFileName: 'Alex Resume.pdf',
        }),
      ).toBe('Alex Resume');

      expect(
        getMarketDefaultFileName({
          markdown: sampleUsMarkdown,
          settings: baseSettings,
          customFileName: 'Alex Resume.pdf',
          extension: 'pdf',
        }),
      ).toBe('Alex Resume.pdf');

      expect(
        getMarketDefaultFileName({
          markdown: sampleUsMarkdown,
          settings: baseSettings,
          customFileName: 'Alex Resume.JSON',
          extension: 'json',
        }),
      ).toBe('Alex Resume.json');

      expect(
        getMarketDefaultFileName({
          markdown: sampleUsMarkdown,
          settings: baseSettings,
          customFileName: 'Alex Resume.md',
          extension: 'pdf',
        }),
      ).toBe('Alex Resume.pdf');
    });

    it('falls back safely when the custom name is only an extension or ends in dots', () => {
      const extensionOnly = getMarketDefaultFileName({
        markdown: sampleUsMarkdown,
        settings: baseSettings,
        customFileName: '.pdf',
        extension: 'pdf',
      });
      expect(extensionOnly).toBe('Alex Morgan - Senior Cloud Architect - Resume.pdf');

      const trailingDot = getMarketDefaultFileName({
        markdown: sampleUsMarkdown,
        settings: baseSettings,
        customFileName: 'Alex Resume.',
        extension: 'pdf',
      });
      expect(trailingDot).toBe('Alex Resume.pdf');
    });

    it('sanitizes unsafe path characters from filenames', () => {
      const filename = getMarketDefaultFileName({
        markdown: `# Jane Doe/Architect:Special\n> **Lead <Dev> & PM**`,
        settings: baseSettings,
      });
      expect(filename).not.toMatch(/[\\/:*?"<>|]/);
    });
  });

  describe('Clean ATS Plain Text Export', () => {
    it('produces plain text stripped of markdown syntax and bold asterisks', () => {
      const plainText = generateCleanAtsPlainText(sampleUsMarkdown, {
        marketRegion: 'us',
        lang: 'en',
      });

      expect(plainText).toContain('ALEX MORGAN');
      expect(plainText).toContain('Senior Cloud Architect');
      expect(plainText).toContain('WORK EXPERIENCE');
      expect(plainText).toContain('Amazon Web Services  --  Principal Engineer');
      expect(plainText).not.toContain('**');
      expect(plainText).not.toContain('###');
    });
  });

  describe('Standard JSON Resume Export & Import Round-trip', () => {
    it('exports to JSON Resume schema compliant structure', () => {
      const json = exportToJsonResume(sampleUsMarkdown, baseSettings);

      expect(json.basics.name).toBe('Alex Morgan');
      expect(json.basics.label).toBe('Senior Cloud Architect');
      expect(json.basics.email).toBe('alex@example.com');
      expect(json.work?.length).toBeGreaterThan(0);
      expect(json.work?.[0].name).toBe('Amazon Web Services');
      expect(json.work?.[0].position).toBe('Principal Engineer');
      expect(json.education?.[0].institution).toBe('UC Berkeley');
      expect(json.meta?.targetMarket).toBe('us');
      expect(json.meta?.paperSize).toBe('letter');
      expect(json.meta?.dateStyle).toBe('month-short');
    });

    it('preserves complete date points when exporting dashed and ongoing ranges', () => {
      const markdown = `# Date Range Candidate
> **Engineer**
date@example.com

## Work Experience

### Example Co | Engineer | 2024-03 - 2025-04
- Built production systems.

## Projects

### Migration Program | Lead | October 2020 – Present
- Led the migration.

## Education

### Example University | Bachelor | 2017.09 – 2021.06
`;

      const json = exportToJsonResume(markdown, baseSettings);

      expect(json.work?.[0]).toMatchObject({
        startDate: '2024-03',
        endDate: '2025-04',
      });
      expect(json.projects?.[0]).toMatchObject({
        startDate: 'October 2020',
        endDate: 'Present',
      });
      expect(json.education?.[0]).toMatchObject({
        startDate: '2017.09',
        endDate: '2021.06',
      });
    });

    it('round-trips education GPA and core courses through standard JSON Resume fields', () => {
      const markdown = `# Education Candidate
> **Engineer**
edu@example.com

## Education

### Example University | Bachelor | Computer Science | 2018.09 – 2022.06
- **GPA / Performance**: 3.9/4.0
- **Core Courses**: Distributed Systems, Databases, Algorithms
`;

      const json = exportToJsonResume(markdown, baseSettings);
      expect(json.education?.[0]).toMatchObject({
        institution: 'Example University',
        studyType: 'Bachelor',
        area: 'Computer Science',
        score: '3.9/4.0',
        courses: ['Distributed Systems', 'Databases', 'Algorithms'],
      });

      const imported = importFromJsonResume(json);
      expect(imported.markdown).toContain('- **GPA / Performance**: 3.9/4.0');
      expect(imported.markdown).toContain(
        '- **Core Courses**: Distributed Systems, Databases, Algorithms',
      );
    });

    it('exports Markdown and bare-domain social contacts as valid JSON Resume URLs', () => {
      const markdownLinkResume = `# Social Candidate
> **Engineer**
social@example.com | [GitHub](https://github.com/social-candidate)
`;

      const markdownJson = exportToJsonResume(markdownLinkResume, baseSettings);
      expect(markdownJson.basics.url).toBe('https://github.com/social-candidate');
      expect(markdownJson.basics.profiles?.[0]).toMatchObject({
        network: 'GitHub',
        username: 'social-candidate',
        url: 'https://github.com/social-candidate',
      });

      const bareDomainResume = `# Portfolio Candidate
> **Designer**
portfolio@example.com | portfolio.example.com/case-study
`;

      const bareJson = exportToJsonResume(bareDomainResume, baseSettings);
      expect(bareJson.basics.url).toBe('https://portfolio.example.com/case-study');
    });

    it('preserves multiple social links as JSON Resume profiles', () => {
      const markdown = `# Multi Social Candidate
> **Engineer**
multi@example.com | [GitHub](https://github.com/multi-social) | [LinkedIn](https://www.linkedin.com/in/multi-social) | portfolio.example.com/work
`;

      const json = exportToJsonResume(markdown, baseSettings);

      expect(json.basics.url).toBe('https://github.com/multi-social');
      expect(json.basics.profiles).toEqual([
        {
          network: 'GitHub',
          username: 'multi-social',
          url: 'https://github.com/multi-social',
        },
        {
          network: 'LinkedIn',
          username: 'in/multi-social',
          url: 'https://www.linkedin.com/in/multi-social',
        },
        {
          network: 'Portfolio / Social',
          username: 'work',
          url: 'https://portfolio.example.com/work',
        },
      ]);

      const imported = importFromJsonResume(json);
      expect(imported.markdown.match(/https:\/\/github\.com\/multi-social/g)?.length).toBe(1);
      expect(imported.markdown).toContain(
        '[LinkedIn](https://www.linkedin.com/in/multi-social)',
      );
      expect(imported.markdown).toContain(
        '[Portfolio / Social](https://portfolio.example.com/work)',
      );
    });

    it('does not classify lookalike hosts as trusted social networks', () => {
      const json = exportToJsonResume(
        `# Lookalike Candidate
> **Engineer**
lookalike@example.com | https://github.com.evil.example/alex
`,
        baseSettings,
      );

      expect(json.basics.url).toBe('https://github.com.evil.example/alex');
      expect(json.basics.profiles?.[0]).toMatchObject({
        network: 'Portfolio / Social',
        url: 'https://github.com.evil.example/alex',
      });
    });

    it('does not manufacture invalid URLs from non-URL social text', () => {
      const json = exportToJsonResume(
        `# Handle Candidate
> **Engineer**
handle@example.com | GitHub: handle-only
`,
        baseSettings,
      );

      expect(json.basics.url).toBeUndefined();
      expect(json.basics.profiles).toEqual([]);
    });

    it('round-trips the standard summary field and avoids duplicate profile links', () => {
      const markdown = `# Summary Candidate
> **Platform Engineer**
summary@example.com | https://example.com

## Summary

- Builds reliable distributed systems.
- Leads platform modernization.

## Work Experience

### Example Systems | Engineer | 2022.01 – Present
- Built production services.
`;

      const json = exportToJsonResume(markdown, baseSettings);
      expect(json.basics.summary).toBe(
        'Builds reliable distributed systems.\nLeads platform modernization.',
      );

      const imported = importFromJsonResume(json);
      expect(imported.markdown).toContain('## Summary');
      expect(imported.markdown).toContain('Builds reliable distributed systems.');
      expect(imported.markdown.match(/https:\/\/example\.com/g)?.length).toBe(1);
    });

    it('imports a third-party JSON Resume basics.summary into the resume body', () => {
      const imported = importFromJsonResume({
        basics: {
          name: 'Jordan Lee',
          label: 'Senior Engineer',
          summary: 'Backend engineer focused on reliable distributed systems.',
        },
        meta: { lang: 'en' },
      });

      expect(imported.markdown).toContain('## Summary');
      expect(imported.markdown).toContain(
        'Backend engineer focused on reliable distributed systems.',
      );
    });

    it('infers English section titles for standard JSON Resume without custom lang metadata', () => {
      const { markdown, detectedSettings } = importFromJsonResume({
        basics: {
          name: 'Jordan Lee',
          label: 'Senior Software Engineer',
          summary: 'Backend engineer focused on reliable distributed systems and cloud infrastructure.',
        },
        work: [
          {
            name: 'Example Systems',
            position: 'Senior Engineer',
            highlights: [
              'Built distributed services for high-volume production workloads.',
              'Improved deployment reliability through automated release checks.',
            ],
          },
        ],
        education: [
          {
            institution: 'Example University',
            studyType: 'B.S. Computer Science',
          },
        ],
      });

      expect(detectedSettings?.lang).toBe('en');
      expect(markdown).toContain('## Work Experience');
      expect(markdown).toContain('## Education');
      expect(markdown).not.toContain('## 工作经历');
    });

    it('preserves valid extended metadata and rejects invalid enum values', () => {
      const valid = importFromJsonResume({
        basics: { name: 'Taylor Example' },
        meta: {
          targetMarket: 'uk',
          paperSize: 'a4',
          dateStyle: 'month-long',
          lang: 'en',
        },
      });

      expect(valid.detectedSettings).toMatchObject({
        marketRegion: 'uk',
        paperSize: 'a4',
        dateStyle: 'month-long',
        lang: 'en',
      });

      const invalid = importFromJsonResume({
        basics: { name: 'Malformed Metadata' },
        meta: {
          targetMarket: 'mars',
          paperSize: 'legal',
          dateStyle: 'quarter-year',
          lang: 'fr',
        },
      });

      expect(invalid.detectedSettings?.marketRegion).toBeUndefined();
      expect(invalid.detectedSettings?.paperSize).toBeUndefined();
      expect(invalid.detectedSettings?.dateStyle).toBeUndefined();
      expect(invalid.detectedSettings?.lang).toBe('zh');
    });

    it('does not throw on malformed collection shapes from external JSON', () => {
      expect(() =>
        importFromJsonResume({
          basics: { name: 'Safe Candidate' },
          meta: { lang: 'en' },
          work: { length: 1 },
          education: 'not-an-array',
          projects: [{ name: 'Project', highlights: { length: 1 } }],
          skills: [{ name: 'Skills', keywords: { length: 2 } }],
        }),
      ).not.toThrow();

      const result = importFromJsonResume({
        basics: { name: 'Safe Candidate' },
        meta: { lang: 'en' },
        work: { length: 1 },
        projects: [{ name: 'Project', highlights: { length: 1 } }],
        skills: [{ name: 'Skills', keywords: { length: 2 } }],
      });

      expect(result.markdown).toContain('# Safe Candidate');
      expect(result.markdown).toContain('## Projects');
      expect(result.markdown).toContain('## Skills');
    });

    it('imports standard JSON Resume back to Markdown with correct sections and language metadata', () => {
      const json = exportToJsonResume(sampleUsMarkdown, baseSettings);
      const { markdown, detectedSettings } = importFromJsonResume(json);

      expect(detectedSettings?.lang).toBe('en');
      expect(detectedSettings?.marketRegion).toBe('us');
      expect(detectedSettings?.paperSize).toBe('letter');
      expect(detectedSettings?.dateStyle).toBe('month-short');
      expect(markdown).toContain('# Alex Morgan');
      expect(markdown).toContain('Senior Cloud Architect');
      expect(markdown).toContain('Work Experience');
      expect(markdown).toContain('Amazon Web Services');
      expect(markdown).toContain('Education');
      expect(markdown).toContain('UC Berkeley');
    });
  });

  describe('Resume Language Auto-Detection', () => {
    it('detects English Markdown independently from the current UI or resume state', () => {
      expect(detectResumeLanguage(sampleUsMarkdown, 'zh')).toBe('en');
    });

    it('detects Chinese Markdown independently from the current UI or resume state', () => {
      expect(detectResumeLanguage(sampleCnMarkdown, 'en')).toBe('zh');
    });
  });

  describe('Resume Market Auto-Detection', () => {
    it('detects China market for Chinese resumes with +86 and WeChat', () => {
      const result = detectResumeMarket(sampleCnMarkdown);
      expect(result.detectedMarket).toBe('cn');
      expect(result.confidence).toBe('high');
    });

    it('detects UK market for UK resume with +44, London and Postcode', () => {
      const result = detectResumeMarket(sampleUkMarkdown);
      expect(result.detectedMarket).toBe('uk');
      expect(result.confidence).toBe('high');
    });

    it('detects US market for US contact info and GPA notation', () => {
      const result = detectResumeMarket(sampleUsMarkdown);
      expect(result.detectedMarket).toBe('us');
    });
  });

  describe('Target Market Adaptation', () => {
    it('adapts dates and section titles when targeting international market', () => {
      const mixedMarkdown = `# Test User
> **Developer**
13800000000 | test@example.com | 28岁

## 工作经历

### Tech Co | Engineer | 2022年3月 - 2024年5月
- Worked on core systems.
`;

      const result = adaptMarkdownToTargetMarket(mixedMarkdown, 'us', 'en');
      expect(result.appliedFixes.length).toBeGreaterThan(0);
      // Sensitive age "28岁" should be cleaned for US EEO standards
      expect(result.adaptedMarkdown).not.toContain('28岁');
      // Section header should be converted to Work Experience
      expect(result.adaptedMarkdown).toContain('Work Experience');
    });
  });
});
