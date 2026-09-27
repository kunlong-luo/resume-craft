import { describe, it, expect } from 'vitest';
import { TEMPLATES } from '../data';
import { getTemplatePresentation, getTemplatePreview } from '../lib/template-presentation';

describe('Phase 6: Multi-Market Template Center & Starter Data', () => {
  it('contains comprehensive authentic templates for US, UK, Canada, China and Global markets', () => {
    const ids = TEMPLATES.map(t => t.id);
    expect(ids).toContain('us_swe');
    expect(ids).toContain('us_new_grad');
    expect(ids).toContain('uk_cv');
    expect(ids).toContain('ca_tech');
    expect(ids).toContain('english');
    expect(ids).toContain('ai_backend');
    expect(ids).toContain('frontend');
    expect(ids).toContain('pm_lead');
    expect(ids).toContain('operations');
    expect(ids).toContain('campus');
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
