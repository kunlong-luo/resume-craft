import { describe, it, expect } from 'vitest';
import {
  getMarketDefaultFileName,
  generateCleanAtsPlainText,
  exportToJsonResume,
  importFromJsonResume,
  adaptMarkdownToTargetMarket,
} from '../lib/export-utils';
import { detectResumeMarket } from '../lib/raw-text-importer';
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
    });

    it('imports standard JSON Resume back to Markdown with correct sections', () => {
      const json = exportToJsonResume(sampleUsMarkdown, baseSettings);
      const { markdown } = importFromJsonResume(json);

      expect(markdown).toContain('# Alex Morgan');
      expect(markdown).toContain('Senior Cloud Architect');
      expect(markdown).toContain('Work Experience');
      expect(markdown).toContain('Amazon Web Services');
      expect(markdown).toContain('Education');
      expect(markdown).toContain('UC Berkeley');
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
