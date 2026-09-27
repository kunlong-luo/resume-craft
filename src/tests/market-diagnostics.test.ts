import { describe, it, expect, vi } from 'vitest';
import { analyzeResume } from '../lib/resume-checker-utils';
import {
  autoFormatAndCleanResume,
  normalizeAllDatesInMarkdown,
  sanitizeSensitiveFieldsForMarket,
} from '../lib/resume-auto-fixer';

describe('Phase 5: Market-Aware ATS Diagnostics and Auto-Fixing Engine', () => {
  const mockUpdateMarkdown = vi.fn();

  describe('Anti-Bias & Sensitive Information Audit (US/UK/CA/IE/International)', () => {
    it('flags sensitive personal fields (age, photo, marital) on US/UK resumes and provides auto-fix', () => {
      const resumeWithSensitiveInfo = `# Alex Taylor
26岁 ｜ 男 ｜ 中国国籍 ｜ 未婚
13812345678 · alex@example.com
![photo](https://example.com/avatar.png)

## Experience
### Tech Corp | Frontend Engineer | 2022.03 - 2024.05
- Spearheaded web architecture and boosted performance by 35%
`;

      const analysisUs = analyzeResume(resumeWithSensitiveInfo, mockUpdateMarkdown, 'en', 'us');
      const marketIssue = analysisUs.issues.find(i => i.category === 'market' && i.title.includes('Market Guidance'));

      expect(marketIssue).toBeDefined();
      expect(marketIssue?.type).toBe('warning');
      expect(marketIssue?.fixable).toBe(true);

      // Test sanitization function
      const sanitized = sanitizeSensitiveFieldsForMarket(resumeWithSensitiveInfo);
      expect(sanitized.sanitizedFieldsCount).toBeGreaterThan(0);
      expect(sanitized.markdown).not.toContain('![photo]');
      expect(sanitized.markdown).not.toContain('26岁');
    });

    it('does not penalize personal fields when targeting China (CN) market where demographics are standard', () => {
      const resumeCn = `# 张三
26岁 ｜ 5年经验 ｜ 本科 ｜ 杭州
13812345678 ｜ zhangsan@example.com

## 工作经历
### 某科技公司 ｜ 前端技术专家 ｜ 2021.03 — 至今
- 主导前端核心架构重构，页面加载速度提升 40%
`;

      const analysisCn = analyzeResume(resumeCn, mockUpdateMarkdown, 'zh', 'cn');
      const sensitiveIssue = analysisCn.issues.find(i => i.category === 'market' && i.title.includes('市场建议'));
      expect(sensitiveIssue).toBeUndefined();
    });
  });

  describe('Market Date Format Audit & 1-Click Normalization', () => {
    it('detects un-normalized dates for US market and normalizes them to month-short', () => {
      const resume = `# Alex Taylor
alex@example.com | 13812345678

## Work Experience
### Tech Corp | Engineer | 2022.03 - 2024.06
- Architected distributed backend handling 20000 QPS

### Startup Inc | Intern | 2021.09 - 2022.02
- Built automated test pipeline
`;

      const analysis = analyzeResume(resume, mockUpdateMarkdown, 'en', 'us');
      const dateIssue = analysis.issues.find(i => i.category === 'market' && i.title.includes('Date Format'));

      expect(dateIssue).toBeDefined();
      expect(dateIssue?.fixable).toBe(true);

      const normalized = normalizeAllDatesInMarkdown(resume, 'month-short', true);
      expect(normalized.convertedCount).toBe(2);
      expect(normalized.markdown).toContain('Mar 2022 – Jun 2024');
      expect(normalized.markdown).toContain('Sep 2021 – Feb 2022');
    });

    it('normalizes dates to month-long for UK/Ireland market', () => {
      const resume = `# Jane Smith
jane@example.com | +44 7911 123456

## Employment History
### Global Financial Ltd | Analyst | 2022.03 - 至今
- Engineered financial models
`;

      const normalized = normalizeAllDatesInMarkdown(resume, 'month-long', true);
      expect(normalized.convertedCount).toBe(1);
      expect(normalized.markdown).toContain('March 2022 – Present');
    });
  });

  describe('First-person pronoun audit', () => {
    it('detects English first-person pronouns and safely removes bullet-leading I/We', () => {
      mockUpdateMarkdown.mockClear();
      const resume = `# Alex Taylor
alex@example.com | +1 206 555 0123

## Experience
### Tech Corp | Engineer | Mar 2022 – Present
- I led the migration to a new platform.
- We reduced build time by 30%.
`;

      const analysis = analyzeResume(resume, mockUpdateMarkdown, 'en', 'us');
      const issue = analysis.issues.find(i => i.title.includes('First-person Pronouns'));

      expect(issue?.type).toBe('warning');
      expect(issue?.fixable).toBe(true);

      issue?.onFix?.();

      const fixed = mockUpdateMarkdown.mock.calls.at(-1)?.[0] as string;
      expect(fixed).toContain('- led the migration to a new platform.');
      expect(fixed).toContain('- reduced build time by 30%.');
      expect(fixed).not.toContain('- I ');
      expect(fixed).not.toContain('- We ');
    });

    it('does not mistake the country abbreviation US for a first-person pronoun', () => {
      const resume = `# Alex Taylor
Seattle, US | alex@example.com | +1 206 555 0123

## Experience
### Tech Corp | Engineer | Mar 2022 – Present
- Led platform migration and improved reliability by 30%.
`;

      const analysis = analyzeResume(resume, mockUpdateMarkdown, 'en', 'us');
      const issue = analysis.issues.find(i => i.title.includes('First-person Pronouns'));

      expect(issue?.type).toBe('success');
      expect(issue?.title).toContain('None detected');
    });
  });

  describe('Explicit date style settings', () => {
    it('uses an explicit date style instead of forcing the market default', () => {
      const resume = `# Alex Taylor
alex@example.com | +1 206 555 0123

## Experience
### Tech Corp | Engineer | Mar 2022 – Jun 2024
- Led platform migration and improved reliability by 30%.
`;

      const analysis = analyzeResume(
        resume,
        mockUpdateMarkdown,
        'en',
        'us',
        'month-long',
      );
      const issue = analysis.issues.find(i => i.title.includes('Date Format'));

      expect(issue?.type).toBe('warning');
      expect(issue?.desc).toContain('month-long');
    });
  });

  describe('Comprehensive Auto-Fixer (autoFormatAndCleanResume)', () => {
    it('fixes spacing, bullets, empty lines, and market dates in a single pass', () => {
      const messyResume = `# Alex Taylor
alex@example.com | 13812345678


## Experience
### Tech Corp | Developer | 2022.03 - 2024.06
-*React开发提升30%性能
-Vue3重构前端架构   
`;

      const cleaned = autoFormatAndCleanResume(messyResume, {
        marketRegion: 'us',
        lang: 'en',
        dateStyle: 'month-short',
        sanitizeMarketFields: true,
      });

      expect(cleaned.hasChanges).toBe(true);
      expect(cleaned.details.missingSpacesFixed).toBeGreaterThan(0);
      expect(cleaned.details.datesNormalized).toBeGreaterThan(0);
      expect(cleaned.cleanedMarkdown).toContain('Mar 2022 – Jun 2024');
      expect(cleaned.cleanedMarkdown).toContain('- *React 开发提升 30%性能');
      expect(cleaned.cleanedMarkdown).toContain('- Vue3 重构前端架构');
    });
  });
});
