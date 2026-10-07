import { describe, it, expect } from 'vitest';
import { TEMPLATES } from '../data';
import { getTemplatePresentation, getTemplatePreview } from '../lib/template-presentation';
import { translateMarkdownContent, translateSectionTitle } from '../lib/section-translator';
import { getMarketProfile } from '../lib/market-profile';
import { parseContactString } from '../lib/markdown-parser';

describe('Phase 6: Multi-Market Template Center & Starter Data', () => {
  it('contains comprehensive authentic templates for US, UK, Canada, China and Global markets', () => {
    const ids = TEMPLATES.map(t => t.id);
    expect(ids).toContain('us_swe');
    expect(ids).toContain('us_new_grad');
    expect(ids).toContain('uk_cv');
    expect(ids).toContain('ca_tech');
    expect(ids).toContain('english');
    expect(ids).toContain('cn_demo');
    expect(ids).toContain('ai_backend');
    expect(ids).toContain('frontend');
    expect(ids).toContain('pm_lead');
    expect(ids).toContain('operations');
    expect(ids).toContain('campus');
  });

  describe('Template content and metadata contract', () => {
    it('keeps every template aligned with its target market defaults', () => {
      for (const template of TEMPLATES) {
        expect(template.targetMarket, template.id).toBeTruthy();
        expect(template.defaultPaperSize, template.id).toBe(
          getMarketProfile(template.targetMarket).defaultPaperSize,
        );
        expect(template.dateStyle, template.id).toBe(
          getMarketProfile(template.targetMarket).dateStyle,
        );
      }
    });

    it('keeps template headings and ongoing-date vocabulary aligned with suggested language', () => {
      for (const template of TEMPLATES) {
        const h2Headings = template.content
          .split('\n')
          .filter((line) => line.startsWith('## '))
          .map((line) => line.slice(3).trim());

        expect(h2Headings.length, template.id).toBeGreaterThan(0);

        if (template.suggestedLang === 'en') {
          for (const heading of h2Headings) {
            expect(heading, template.id).not.toMatch(/[\u4e00-\u9fff]/);
          }
          expect(template.content, template.id).not.toContain('至今');
        } else {
          expect(
            h2Headings.some((heading) => /[\u4e00-\u9fff]/.test(heading)),
            template.id,
          ).toBe(true);
          expect(template.content, template.id).not.toMatch(/\bPresent\b/i);
        }
      }
    });
  });

  describe('Template Market Metadata Integrity', () => {
    it('configures US Software Engineer template with Letter paper and month-short date style', () => {
      const usTemplate = TEMPLATES.find(t => t.id === 'us_swe')!;
      expect(usTemplate).toBeDefined();
      expect(usTemplate.targetMarket).toBe('us');
      expect(usTemplate.defaultPaperSize).toBe('letter');
      expect(usTemplate.dateStyle).toBe('month-short');
      expect(usTemplate.suggestedLang).toBe('en');

      // Content verification
      expect(usTemplate.content).toContain('Mar 2024 – Present');
      expect(usTemplate.content).not.toContain('岁');
      expect(usTemplate.content).not.toContain('![photo]');
      expect(usTemplate.content).not.toContain('Honors & GPA');
      expect(usTemplate.content).not.toContain('Relevant Coursework');
    });

    it('configures US New Grad with education-first Letter metadata', () => {
      const template = TEMPLATES.find(t => t.id === 'us_new_grad')!;
      expect(template).toBeDefined();
      expect(template.targetMarket).toBe('us');
      expect(template.defaultPaperSize).toBe('letter');
      expect(template.dateStyle).toBe('month-short');
      expect(template.suggestedLang).toBe('en');

      const educationIndex = template.content.indexOf('## Education');
      const experienceIndex = template.content.indexOf('## Experience');
      expect(educationIndex).toBeGreaterThan(-1);
      expect(educationIndex).toBeLessThan(experienceIndex);
      expect(template.content).toContain('**GPA:**');
      expect(template.content).toContain('**Relevant Coursework:**');
      expect(template.content).toContain('**Honors:**');
    });

    it('configures UK Tech Lead CV with A4 paper and month-long date style', () => {
      const ukTemplate = TEMPLATES.find(t => t.id === 'uk_cv')!;
      expect(ukTemplate).toBeDefined();
      expect(ukTemplate.targetMarket).toBe('uk');
      expect(ukTemplate.defaultPaperSize).toBe('a4');
      expect(ukTemplate.dateStyle).toBe('month-long');
      expect(ukTemplate.suggestedLang).toBe('en');

      // Content verification
      expect(ukTemplate.content).toContain('March 2023 – Present');
      expect(ukTemplate.content).toContain('First Class Honours');
      expect(ukTemplate.content).toContain('Professional Profile');
    });

    it('provides a neutral Chinese demo template with China market metadata', () => {
      const demo = TEMPLATES.find(t => t.id === 'cn_demo')!;
      expect(demo).toBeDefined();
      expect(demo.targetMarket).toBe('cn');
      expect(demo.defaultPaperSize).toBe('a4');
      expect(demo.dateStyle).toBe('cn-dot');
      expect(demo.suggestedLang).toBe('zh');
      expect(demo.content).toContain('Resume Craft 中文通用 Demo');
      expect(demo.content).toContain('## 工作经历');
    });

    it('configures China AI Backend template with A4 paper and cn-dot date style', () => {
      const cnTemplate = TEMPLATES.find(t => t.id === 'ai_backend')!;
      expect(cnTemplate).toBeDefined();
      expect(cnTemplate.targetMarket).toBe('cn');
      expect(cnTemplate.defaultPaperSize).toBe('a4');
      expect(cnTemplate.dateStyle).toBe('cn-dot');
      expect(cnTemplate.suggestedLang).toBe('zh');

      expect(cnTemplate.content).toContain('2024.03 — 至今');
    });
  });

  describe('Senior template content hygiene', () => {
    it('keeps senior global education concise', () => {
      const globalTemplate = TEMPLATES.find(t => t.id === 'english')!;
      expect(globalTemplate.content).not.toContain('GPA 3.82');
      expect(globalTemplate.content).not.toContain('Academic Honors');
    });

    it('does not emphasize coursework in the experienced UK template', () => {
      const ukTemplate = TEMPLATES.find(t => t.id === 'uk_cv')!;
      expect(ukTemplate.content).not.toContain('Key Modules');
    });
  });

  describe('Template demo contact safety', () => {
    it('uses explicit placeholders instead of realistic third-party identities', () => {
      for (const template of TEMPLATES) {
        const emails = [...template.content.matchAll(/[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g)];
        for (const match of emails) {
          expect(match[1], template.id).toBe('example.com');
        }

        expect(template.content, template.id).not.toMatch(
          /(?:@163\.com|@gmail\.com|@fake-email\.com|alex-chen-ai|alexchen-dev|mayapatel-dev|marcus-cloud|marcusroy-ca|xiaomeng-zhao|linzy-ai-frontend|chenjie-ai-backend)/i,
        );

        const githubRefs = [...template.content.matchAll(/github\.com\/([^\s·]+)/gi)];
        for (const match of githubRefs) {
          expect(match[1], template.id).toBe('<your-username>');
        }

        const linkedinRefs = [...template.content.matchAll(/linkedin\.com\/in\/([^\s·]+)/gi)];
        for (const match of linkedinRefs) {
          expect(match[1], template.id).toBe('<your-profile>');
        }
      }
    });

    it('parses the US demo contact line without orphan phone punctuation', () => {
      const template = TEMPLATES.find(t => t.id === 'us_swe')!;
      const contactLine = template.content.split('\n')[1];
      const parsed = parseContactString(contactLine);

      expect(parsed.email).toBe('alex.chen@example.com');
      expect(parsed.city).toBe('San Francisco, CA');
      expect(parsed.social).toContain('github.com/<your-username>');
      expect(parsed.social).toContain('linkedin.com/in/<your-profile>');
      expect(parsed.social).not.toMatch(/^\s*[()·]/);
    });
  });

  describe('Canonical section title localization', () => {
    it('translates Chinese capability headings into the standard English vocabulary', () => {
      expect(translateSectionTitle('核心能力', 'en')).toBe('Skills');
      expect(translateSectionTitle('专业技能', 'en')).toBe('Skills');
      expect(translateSectionTitle('个人简介', 'en')).toBe('Summary');
      expect(translateSectionTitle('自我评价', 'en')).toBe('Summary');
    });

    it('keeps existing English Markdown headings unchanged while standardizing display labels', () => {
      const source = '# Candidate\n\n## Experience\n- Built something\n\n## Technical Skills\n- TypeScript';
      expect(translateMarkdownContent(source, 'en')).toBe(source);
      expect(translateSectionTitle('Experience', 'en')).toBe('Work Experience');
      expect(translateSectionTitle('Technical Skills', 'en')).toBe('Skills');
    });

    it('normalizes English template aliases into consistent section names', () => {
      expect(translateSectionTitle('Technical Skills', 'en')).toBe('Skills');
      expect(translateSectionTitle('Core Competencies', 'en')).toBe('Skills');
      expect(translateSectionTitle('Professional Experience', 'en')).toBe('Work Experience');
      expect(translateSectionTitle('Career History', 'en')).toBe('Work Experience');
      expect(translateSectionTitle('Key Projects', 'en')).toBe('Projects');
      expect(translateSectionTitle('Education & Qualifications', 'en')).toBe('Education');
    });
  });

  describe('Template Presentation & Badges Localization', () => {
    it('groups US New Grad with graduate templates while retaining US market metadata', () => {
      const template = TEMPLATES.find(t => t.id === 'us_new_grad')!;
      const presentation = getTemplatePresentation(template, 'en');

      expect(presentation.group).toBe('graduate');
      expect(presentation.targetMarket).toBe('us');
      expect(presentation.defaultPaperSize).toBe('letter');
      expect(presentation.name).toContain('US New Grad');
    });

    it('returns localized presentation and market badges in Chinese', () => {
      const usTemplate = TEMPLATES.find(t => t.id === 'us_swe')!;
      const presentationZh = getTemplatePresentation(usTemplate, 'zh');

      expect(presentationZh.name).toContain('美版');
      expect(presentationZh.marketBadge).toContain('🇺🇸 US');
      expect(presentationZh.group).toBe('us');
    });

    it('returns localized presentation and market badges in English', () => {
      const ukTemplate = TEMPLATES.find(t => t.id === 'uk_cv')!;
      const presentationEn = getTemplatePresentation(ukTemplate, 'en');

      expect(presentationEn.name).toContain('UK Tech Lead');
      expect(presentationEn.marketBadge).toContain('🇬🇧 UK CV');
      expect(presentationEn.group).toBe('uk');
    });

    it('standardizes Chinese template preview section names in English mode', () => {
      const cnTemplate = TEMPLATES.find(t => t.id === 'cn_demo')!;
      const preview = getTemplatePreview(cnTemplate.content, 'en');

      expect(preview.sections).toEqual([
        'Summary',
        'Skills',
        'Work Experience',
        'Projects',
      ]);
      expect(preview.sections.some(section => /[\u4e00-\u9fa5]/.test(section))).toBe(false);
    });

    it('extracts template preview information cleanly', () => {
      const usTemplate = TEMPLATES.find(t => t.id === 'us_swe')!;
      const preview = getTemplatePreview(usTemplate.content);

      expect(preview.name).toBe('Alex Chen');
      expect(preview.sections).toContain('Summary');
      expect(preview.sections).toContain('Technical Skills');
      expect(preview.sections).toContain('Professional Experience');
      expect(preview.firstBullet).toBeTruthy();
    });
  });
});
