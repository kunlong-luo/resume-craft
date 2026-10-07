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
import { parseMarkdownToForm } from '../lib/markdown-parser';
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

    it('round-trips structured entry summaries and URLs without leaking labels into highlights', () => {
      const imported = importFromJsonResume({
        basics: {
          name: 'Metadata Candidate',
          label: 'Engineer',
          email: 'metadata@example.com',
        },
        work: [
          {
            name: 'Example Co',
            position: 'Engineer',
            url: 'https://example.com/company',
            startDate: '2023-01',
            endDate: 'Present',
            summary: 'Platform engineering role.',
            highlights: ['Reduced latency by 40%.'],
          },
        ],
        volunteer: [
          {
            organization: 'Open Source Org',
            position: 'Maintainer',
            url: 'https://example.com/volunteer',
            summary: 'Maintains community tooling.',
            highlights: ['Reviewed 100+ contributions.'],
          },
        ],
        projects: [
          {
            name: 'Project Atlas',
            description: 'Lead Developer',
            url: 'https://example.com/atlas',
            highlights: ['Built the public API.'],
          },
        ],
        education: [
          {
            institution: 'Example University',
            url: 'https://example.edu',
            studyType: 'Bachelor',
            area: 'Computer Science',
          },
        ],
        meta: { lang: 'en', targetMarket: 'us' },
      });

      expect(imported.markdown).toContain(
        '- **Summary**: Platform engineering role.',
      );
      expect(imported.markdown).toContain(
        '- **Website**: https://example.com/company',
      );
      expect(imported.markdown).toContain(
        '- **Project URL**: https://example.com/atlas',
      );
      expect(imported.markdown).toContain(
        '- **Institution URL**: https://example.edu',
      );

      const reexported = exportToJsonResume(imported.markdown, baseSettings);

      expect(reexported.work?.[0]).toMatchObject({
        summary: 'Platform engineering role.',
        url: 'https://example.com/company',
        highlights: ['Reduced latency by 40%.'],
      });
      expect(reexported.volunteer?.[0]).toMatchObject({
        summary: 'Maintains community tooling.',
        url: 'https://example.com/volunteer',
        highlights: ['Reviewed 100+ contributions.'],
      });
      expect(reexported.projects?.[0]).toMatchObject({
        url: 'https://example.com/atlas',
        highlights: ['Built the public API.'],
      });
      expect(reexported.education?.[0]).toMatchObject({
        url: 'https://example.edu/',
      });

      expect(reexported.work?.[0].highlights).not.toEqual(
        expect.arrayContaining([expect.stringContaining('Website')]),
      );
      expect(reexported.projects?.[0].highlights).not.toEqual(
        expect.arrayContaining([expect.stringContaining('Project URL')]),
      );
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

    it('round-trips dedicated natural-language sections without confusing programming languages', () => {
      const markdown = `# Language Candidate
> **Platform Engineer**
language@example.com

## Skills

- **Languages:** Java, Go, TypeScript
- **Data:** PostgreSQL, Redis

## Languages

- **English**: Professional
- **中文**：Native
`;

      const json = exportToJsonResume(markdown, baseSettings);

      expect(json.skills).toEqual(
        expect.arrayContaining([
          { name: 'Languages', keywords: ['Java', 'Go', 'TypeScript'] },
          { name: 'Data', keywords: ['PostgreSQL', 'Redis'] },
        ]),
      );
      expect(json.languages).toEqual([
        { language: 'English', fluency: 'Professional' },
        { language: '中文', fluency: 'Native' },
      ]);

      const imported = importFromJsonResume(json);
      expect(imported.markdown).toContain('## Languages');
      expect(imported.markdown).toContain('- **English**: Professional');
      expect(imported.markdown).toContain('- **中文**: Native');
    });

    it('ignores malformed natural-language scalar values from external JSON Resume data', () => {
      const imported = importFromJsonResume({
        basics: { name: 'Safe Language Candidate' },
        languages: [
          { language: 'English', fluency: 'Native' },
          { language: { unsafe: true }, fluency: ['bad'] },
          { language: 'Japanese', fluency: 42 },
        ],
        meta: { lang: 'en' },
      });

      expect(imported.markdown).toContain('## Languages');
      expect(imported.markdown).toContain('- **English**: Native');
      expect(imported.markdown).toContain('- **Japanese**: —');
      expect(imported.markdown).not.toContain('[object Object]');
    });

    it('round-trips interests and references through standard JSON Resume fields', () => {
      const markdown = `# Well-Rounded Candidate
> **Platform Engineer**
candidate@example.com

## Interests

- **Photography**: Street, Architecture
- **Open Source**: Developer Tools, AI

## References

### Jane Smith
- Consistently delivered reliable systems and strong cross-team communication.
`;

      const json = exportToJsonResume(markdown, baseSettings);

      expect(json.interests).toEqual([
        { name: 'Photography', keywords: ['Street', 'Architecture'] },
        { name: 'Open Source', keywords: ['Developer Tools', 'AI'] },
      ]);
      expect(json.references).toEqual([
        {
          name: 'Jane Smith',
          reference: 'Consistently delivered reliable systems and strong cross-team communication.',
        },
      ]);

      const imported = importFromJsonResume(json);
      expect(imported.markdown).toContain('## Interests');
      expect(imported.markdown).toContain('- **Photography**: Street, Architecture');
      expect(imported.markdown).toContain('## References');
      expect(imported.markdown).toContain('### Jane Smith');
      expect(imported.markdown).toContain(
        '- Consistently delivered reliable systems and strong cross-team communication.',
      );
    });

    it('sanitizes malformed external interests and references values', () => {
      const imported = importFromJsonResume({
        basics: { name: 'Safe Candidate' },
        interests: [
          { name: 'Cinema', keywords: ['Sci-Fi', 42, { unsafe: true }] },
          { name: { unsafe: true }, keywords: ['Ignored'] },
        ],
        references: [
          { name: 'Jane Smith', reference: 'Strong collaborator.' },
          { name: 'Invalid', reference: { unsafe: true } },
          { name: ['bad'], reference: 'Ignored' },
        ],
        meta: { lang: 'en' },
      });

      expect(imported.markdown).toContain('## Interests');
      expect(imported.markdown).toContain('- **Cinema**: Sci-Fi');
      expect(imported.markdown).toContain('## References');
      expect(imported.markdown).toContain('### Jane Smith');
      expect(imported.markdown).toContain('- Strong collaborator.');
      expect(imported.markdown).not.toContain('[object Object]');
      expect(imported.markdown).not.toContain('### Invalid');
    });

    it('keeps volunteer experience out of work and round-trips publications', () => {
      const markdown = `# Community Candidate
> **Platform Engineer**
community@example.com

## Volunteer Experience

### Code for Community | Mentor | 2023 – Present
- Mentored students in backend engineering.
- Built open-source learning materials.

## Publications

### Reliable Systems at Scale | Engineering Journal | 2025
- Practical patterns for operating distributed services.
- [Publication](https://example.com/reliable-systems)
`;

      const json = exportToJsonResume(markdown, baseSettings);

      expect(json.work).toEqual([]);
      expect(json.volunteer).toEqual([
        {
          organization: 'Code for Community',
          position: 'Mentor',
          startDate: '2023',
          endDate: 'Present',
          highlights: [
            'Mentored students in backend engineering.',
            'Built open-source learning materials.',
          ],
        },
      ]);
      expect(json.publications).toEqual([
        {
          name: 'Reliable Systems at Scale',
          publisher: 'Engineering Journal',
          releaseDate: '2025',
          url: 'https://example.com/reliable-systems',
          summary: 'Practical patterns for operating distributed services.',
        },
      ]);

      const imported = importFromJsonResume(json);
      expect(imported.markdown).toContain('## Volunteer Experience');
      expect(imported.markdown).toContain(
        '### Code for Community | Mentor | 2023 – Present',
      );
      expect(imported.markdown).toContain('Mentored students in backend engineering.');
      expect(imported.markdown).toContain('## Publications');
      expect(imported.markdown).toContain(
        '### Reliable Systems at Scale | Engineering Journal | 2025',
      );
      expect(imported.markdown).toContain(
        '- [Publication](https://example.com/reliable-systems)',
      );
    });

    it('keeps publication titles ahead of recognized publisher names', () => {
      const json = exportToJsonResume(
        `# Publication Candidate
> **Engineer**
pub@example.com

## Publications

### Engineering Reliable Systems | ACM | 2025
- [Publication](https://example.com/engineering-reliable-systems)
`,
        baseSettings,
      );

      expect(json.publications?.[0]).toMatchObject({
        name: 'Engineering Reliable Systems',
        publisher: 'ACM',
        releaseDate: '2025',
        url: 'https://example.com/engineering-reliable-systems',
      });
    });

    it('sanitizes malformed volunteer and publication scalar fields', () => {
      const imported = importFromJsonResume({
        basics: { name: 'Safe Community Candidate' },
        volunteer: [
          {
            organization: 'Open Source Group',
            position: 'Maintainer',
            startDate: '2022',
            endDate: 'Present',
            highlights: ['Maintained documentation.', 123],
          },
          {
            organization: { unsafe: true },
            position: false,
            summary: { unsafe: true },
          },
        ],
        publications: [
          {
            name: 'Safe Publication',
            publisher: 'Example Publisher',
            releaseDate: '2024',
            summary: 'A valid summary.',
            url: 'https://example.com/publication',
          },
          {
            name: { unsafe: true },
            publisher: 42,
            url: 'javascript:alert(1)',
          },
        ],
        meta: { lang: 'en' },
      });

      expect(imported.markdown).toContain('## Volunteer Experience');
      expect(imported.markdown).toContain(
        '### Open Source Group | Maintainer | 2022 – Present',
      );
      expect(imported.markdown).toContain('- Maintained documentation.');
      expect(imported.markdown).toContain('## Publications');
      expect(imported.markdown).toContain(
        '### Safe Publication | Example Publisher | 2024',
      );
      expect(imported.markdown).toContain('- A valid summary.');
      expect(imported.markdown).toContain(
        '- [Publication](https://example.com/publication)',
      );
      expect(imported.markdown).not.toContain('[object Object]');
      expect(imported.markdown).not.toContain('javascript:');
    });

    it('round-trips honors and certifications through standard JSON Resume fields', () => {
      const markdown = `# Credential Candidate
> **Platform Engineer**
credential@example.com

## Honors & Awards

### Engineering Excellence Award | Example Systems | 2025
- Recognized for improving platform reliability across critical services.

## Certifications

### AWS Certified Solutions Architect | Amazon Web Services | 2024
- [Credential](https://example.com/aws-cert)
`;

      const json = exportToJsonResume(markdown, baseSettings);

      expect(json.awards).toEqual([
        {
          title: 'Engineering Excellence Award',
          awarder: 'Example Systems',
          date: '2025',
          summary: 'Recognized for improving platform reliability across critical services.',
        },
      ]);
      expect(json.certificates).toEqual([
        {
          name: 'AWS Certified Solutions Architect',
          issuer: 'Amazon Web Services',
          date: '2024',
          url: 'https://example.com/aws-cert',
        },
      ]);

      const imported = importFromJsonResume(json);
      expect(imported.markdown).toContain('## Honors & Awards');
      expect(imported.markdown).toContain(
        '### Engineering Excellence Award | Example Systems | 2025',
      );
      expect(imported.markdown).toContain(
        '- Recognized for improving platform reliability across critical services.',
      );
      expect(imported.markdown).toContain('## Certifications');
      expect(imported.markdown).toContain(
        '### AWS Certified Solutions Architect | Amazon Web Services | 2024',
      );
      expect(imported.markdown).toContain(
        '- [Credential](https://example.com/aws-cert)',
      );
    });

    it('imports third-party awards and certifications safely and ignores malformed scalar values', () => {
      const imported = importFromJsonResume({
        basics: { name: 'Safe Credentials Candidate' },
        awards: [
          {
            title: 'Reliability Award',
            awarder: 'Engineering Org',
            date: '2025',
            summary: 'Recognized for production reliability.',
          },
          {
            title: { unsafe: true },
            awarder: 42,
            summary: ['unsafe'],
          },
        ],
        certificates: [
          {
            name: 'Cloud Certificate',
            issuer: 'Cloud Provider',
            date: '2024',
            url: 'https://example.com/cloud-cert',
          },
          {
            name: { unsafe: true },
            issuer: false,
            url: 'javascript:alert(1)',
          },
        ],
        meta: { lang: 'en' },
      });

      expect(imported.markdown).toContain('## Honors & Awards');
      expect(imported.markdown).toContain(
        '### Reliability Award | Engineering Org | 2025',
      );
      expect(imported.markdown).toContain('Recognized for production reliability.');
      expect(imported.markdown).toContain('## Certifications');
      expect(imported.markdown).toContain(
        '### Cloud Certificate | Cloud Provider | 2024',
      );
      expect(imported.markdown).toContain(
        '- [Credential](https://example.com/cloud-cert)',
      );
      expect(imported.markdown).not.toContain('[object Object]');
      expect(imported.markdown).not.toContain('javascript:');
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

    it('preserves dedicated Links & Portfolio sections as JSON Resume profiles', () => {
      const markdown = `# Links Section Candidate
> **Engineer**
links@example.com | [GitHub](https://github.com/links-candidate)

## Links & Portfolio

- [GitHub](https://github.com/links-candidate)
- [LinkedIn](https://www.linkedin.com/in/links-candidate)
- Portfolio: portfolio.example.com/work
- GitHub handle only: links-candidate
`;

      const json = exportToJsonResume(markdown, baseSettings);

      expect(json.basics.url).toBe('https://github.com/links-candidate');
      expect(json.basics.profiles).toEqual([
        {
          network: 'GitHub',
          username: 'links-candidate',
          url: 'https://github.com/links-candidate',
        },
        {
          network: 'LinkedIn',
          username: 'in/links-candidate',
          url: 'https://www.linkedin.com/in/links-candidate',
        },
        {
          network: 'Portfolio / Social',
          username: 'work',
          url: 'https://portfolio.example.com/work',
        },
      ]);

      const imported = importFromJsonResume(json);
      expect(imported.markdown.match(/https:\/\/github\.com\/links-candidate/g)?.length).toBe(1);
      expect(imported.markdown).toContain(
        '[LinkedIn](https://www.linkedin.com/in/links-candidate)',
      );
      expect(imported.markdown).toContain(
        '[Portfolio / Social](https://portfolio.example.com/work)',
      );
      expect(imported.markdown).not.toContain('GitHub handle only');
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

    it('preserves location.city across JSON Resume import and re-export', () => {
      const imported = importFromJsonResume({
        basics: {
          name: 'Location Candidate',
          label: 'Engineer',
          email: 'location@example.com',
          location: { city: 'Seattle' },
        },
        meta: { lang: 'en', targetMarket: 'us' },
      });

      expect(imported.markdown).toContain('Location: Seattle');

      const reparsed = parseMarkdownToForm(imported.markdown);
      expect(reparsed.city).toBe('Seattle');
      expect(reparsed.social).toBe('');

      const reexported = exportToJsonResume(imported.markdown, baseSettings);
      expect(reexported.basics.location).toEqual({ city: 'Seattle' });
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

    it('ignores non-string scalar fields from malformed external JSON Resume data', () => {
      const imported = importFromJsonResume({
        basics: {
          name: { unsafe: true },
          label: 42,
          email: 'safe@example.com',
          phone: ['not', 'a', 'phone'],
          summary: { text: 'unsafe summary' },
          location: { city: { nested: true } },
          url: 'javascript:alert(1)',
          profiles: [
            { network: { unsafe: true }, url: 'https://example.com/bad-network' },
            { network: 'Unsafe', url: 'data:text/html,unsafe' },
            { network: 'GitHub', url: 'https://github.com/safe-user' },
          ],
        },
        work: [
          {
            name: { unsafe: true },
            position: 99,
            startDate: ['2024'],
            endDate: 'Present',
            summary: { unsafe: true },
            highlights: ['Valid highlight', 123, { bad: true }],
          },
        ],
        education: [
          {
            institution: { unsafe: true },
            studyType: 'Bachelor',
            area: false,
            score: { value: 4 },
            courses: ['Databases', 123],
          },
        ],
        skills: [
          {
            name: { unsafe: true },
            keywords: ['TypeScript', 123, 'PostgreSQL'],
          },
        ],
        meta: { lang: 'en' },
      });

      expect(imported.markdown).not.toContain('[object Object]');
      expect(imported.markdown).not.toContain('unsafe summary');
      expect(imported.markdown).not.toContain('bad-network');
      expect(imported.markdown).not.toContain('javascript:');
      expect(imported.markdown).not.toContain('data:text/html');
      expect(imported.markdown).toContain('# Candidate Name');
      expect(imported.markdown).toContain('safe@example.com');
      expect(imported.markdown).toContain('[GitHub](https://github.com/safe-user)');
      expect(imported.markdown).toContain('### Company | Present');
      expect(imported.markdown).toContain('- Valid highlight');
      expect(imported.markdown).toContain('### Institution | Bachelor');
      expect(imported.markdown).toContain('- **Core Courses**: Databases');
      expect(imported.markdown).toContain('- **Skills**: TypeScript, PostgreSQL');
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
