import type { ResumeTemplate } from '../data';
import { MarketRegion, PaperSize, DateStyle } from '../types';

export type TemplateGroup = 'engineering' | 'product' | 'graduate' | 'global' | 'us' | 'uk' | 'cn';

export interface TemplatePresentation {
  name: string;
  category: string;
  description: string;
  tags: string[];
  language: string;
  group: TemplateGroup;
  experience: string;
  targetMarket?: MarketRegion;
  defaultPaperSize?: PaperSize;
  dateStyle?: DateStyle;
  marketBadge?: string;
}

type TemplatePresentationPair = {
  zh: TemplatePresentation;
  en: TemplatePresentation;
};

const TEMPLATE_PRESENTATION: Record<string, TemplatePresentationPair> = {
  cn_demo: {
    zh: {
      name: '中文通用示例 (Demo)',
      category: '中文通用',
      description: '一份简洁、中性的中文示例简历，用于快速体验编辑、检查、排版和 PDF 导出流程。',
      tags: ['中文 Demo', 'A4', '通用结构'],
      language: '中文',
      group: 'product',
      experience: '通用 / 社招',
      targetMarket: 'cn',
      defaultPaperSize: 'a4',
      dateStyle: 'cn-dot',
      marketBadge: '🇨🇳 中文标准 · A4 · Demo',
    },
    en: {
      name: 'Chinese General Demo',
      category: 'China Market',
      description: 'A neutral Chinese demo resume for trying editing, checking, layout, and PDF export.',
      tags: ['Chinese Demo', 'A4', 'General'],
      language: 'Chinese',
      group: 'product',
      experience: 'General',
      targetMarket: 'cn',
      defaultPaperSize: 'a4',
      dateStyle: 'cn-dot',
      marketBadge: '🇨🇳 CN Standard · A4 · Demo',
    },
  },
  ai_backend: {
    zh: {
      name: 'AI 后端架构师',
      category: '研发开发',
      description: '突出高并发后端、AI Agent、RAG 与分布式系统项目成果。',
      tags: ['AI / LLM', '后端架构', '高并发'],
      language: '中文',
      group: 'engineering',
      experience: '资深 / 社招',
      targetMarket: 'cn',
      defaultPaperSize: 'a4',
      dateStyle: 'cn-dot',
      marketBadge: '🇨🇳 中文标准 · A4',
    },
    en: {
      name: 'AI Backend Architect',
      category: 'Engineering',
      description: 'Highlights backend architecture, AI agents, RAG, and distributed systems impact.',
      tags: ['AI / LLM', 'Backend', 'Experienced'],
      language: 'Chinese',
      group: 'engineering',
      experience: 'Experienced',
      targetMarket: 'cn',
      defaultPaperSize: 'a4',
      dateStyle: 'cn-dot',
      marketBadge: '🇨🇳 CN Standard · A4',
    },
  },
  frontend: {
    zh: {
      name: 'AI 前端工程师',
      category: '研发开发',
      description: '强调 React / TypeScript、AI 应用前端和全栈工程化能力。',
      tags: ['React', 'TypeScript', 'AI 应用'],
      language: '中文',
      group: 'engineering',
      experience: '社招',
      targetMarket: 'cn',
      defaultPaperSize: 'a4',
      dateStyle: 'cn-dot',
      marketBadge: '🇨🇳 中文标准 · A4',
    },
    en: {
      name: 'AI Frontend Developer',
      category: 'Engineering',
      description: 'Focused on React, TypeScript, AI application interfaces, and full-stack delivery.',
      tags: ['React', 'TypeScript', 'AI Apps'],
      language: 'Chinese',
      group: 'engineering',
      experience: 'Experienced',
      targetMarket: 'cn',
      defaultPaperSize: 'a4',
      dateStyle: 'cn-dot',
      marketBadge: '🇨🇳 CN Standard · A4',
    },
  },
  pm_lead: {
    zh: {
      name: '技术产品经理 / 研发总监',
      category: '产品管理',
      description: '兼顾技术理解、产品规划、团队协作与商业化结果的管理型模板。',
      tags: ['产品战略', '技术管理', '团队协作'],
      language: '中文',
      group: 'product',
      experience: '管理 / 资深',
      targetMarket: 'cn',
      defaultPaperSize: 'a4',
      dateStyle: 'cn-dot',
      marketBadge: '🇨🇳 中文标准 · A4',
    },
    en: {
      name: 'Technical PM / Engineering Director',
      category: 'Product & Leadership',
      description: 'Balances technical depth, product strategy, leadership, and business outcomes.',
      tags: ['Strategy', 'Leadership', 'Technical PM'],
      language: 'Chinese',
      group: 'product',
      experience: 'Leadership',
      targetMarket: 'cn',
      defaultPaperSize: 'a4',
      dateStyle: 'cn-dot',
      marketBadge: '🇨🇳 CN Standard · A4',
    },
  },
  operations: {
    zh: {
      name: '产品运营 / 用户增长',
      category: '产品运营',
      description: '适合增长、活动、内容和商业化运营，强化数据指标与业务影响。',
      tags: ['用户增长', '活动运营', '数据驱动'],
      language: '中文',
      group: 'product',
      experience: '社招',
      targetMarket: 'cn',
      defaultPaperSize: 'a4',
      dateStyle: 'cn-dot',
      marketBadge: '🇨🇳 中文标准 · A4',
    },
    en: {
      name: 'Product Operations / Growth',
      category: 'Operations & Growth',
      description: 'Built for growth, campaigns, content, and monetization with measurable outcomes.',
      tags: ['Growth', 'Operations', 'Metrics'],
      language: 'Chinese',
      group: 'product',
      experience: 'Experienced',
      targetMarket: 'cn',
      defaultPaperSize: 'a4',
      dateStyle: 'cn-dot',
      marketBadge: '🇨🇳 CN Standard · A4',
    },
  },
  campus: {
    zh: {
      name: '应届生 / 校园研发',
      category: '应届生求职',
      description: '突出教育背景、实习、项目、竞赛和可迁移技术能力。',
      tags: ['应届生', '实习', '竞赛获奖'],
      language: '中文',
      group: 'graduate',
      experience: '应届 / 实习',
      targetMarket: 'cn',
      defaultPaperSize: 'a4',
      dateStyle: 'cn-dot',
      marketBadge: '🇨🇳 中文标准 · A4',
    },
    en: {
      name: 'Graduate / Campus Engineering',
      category: 'Graduate',
      description: 'Emphasizes education, internships, projects, awards, and transferable engineering skills.',
      tags: ['Graduate', 'Internship', 'Projects'],
      language: 'Chinese',
      group: 'graduate',
      experience: 'Graduate',
      targetMarket: 'cn',
      defaultPaperSize: 'a4',
      dateStyle: 'cn-dot',
      marketBadge: '🇨🇳 CN Standard · A4',
    },
  },
  us_swe: {
    zh: {
      name: '美版软件工程师 (US Resume)',
      category: '海外求职',
      description: '面向美国技术岗位的常见简历结构，采用 Letter 纸张、英文月份日期与结果导向表达。',
      tags: ['US Resume', 'Letter Size', 'ATS Friendly'],
      language: 'English',
      group: 'us',
      experience: 'Senior / Staff',
      targetMarket: 'us',
      defaultPaperSize: 'letter',
      dateStyle: 'month-short',
      marketBadge: '🇺🇸 US · Letter · ATS',
    },
    en: {
      name: 'US Software Engineer (Resume)',
      category: 'Global',
      description: 'US-oriented tech resume using Letter format, concise achievement-focused bullets, and common US resume conventions.',
      tags: ['US Resume', 'Letter Size', 'ATS Friendly'],
      language: 'English',
      group: 'us',
      experience: 'Senior / Staff',
      targetMarket: 'us',
      defaultPaperSize: 'letter',
      dateStyle: 'month-short',
      marketBadge: '🇺🇸 US · Letter · ATS',
    },
  },
  us_new_grad: {
    zh: {
      name: '美国应届软件工程师 (US New Grad)',
      category: '海外应届求职',
      description: '面向美国应届技术岗位，教育背景前置，突出 GPA、课程、荣誉、实习与项目。',
      tags: ['US New Grad', 'Education First', 'Letter Size'],
      language: 'English',
      group: 'graduate',
      experience: '应届 / 实习',
      targetMarket: 'us',
      defaultPaperSize: 'letter',
      dateStyle: 'month-short',
      marketBadge: '🇺🇸 US New Grad · Letter',
    },
    en: {
      name: 'US New Grad Software Engineer',
      category: 'Graduate',
      description: 'US new-grad format with education first, plus GPA, coursework, honors, internships, and projects.',
      tags: ['US New Grad', 'Education First', 'Letter Size'],
      language: 'English',
      group: 'graduate',
      experience: 'New Grad',
      targetMarket: 'us',
      defaultPaperSize: 'letter',
      dateStyle: 'month-short',
      marketBadge: '🇺🇸 US New Grad · Letter',
    },
  },
  uk_cv: {
    zh: {
      name: '英版技术经理 / 全栈 (UK CV)',
      category: '海外求职',
      description: '标准英国 Curriculum Vitae 结构，A4 尺寸，包含 Professional Profile 与荣誉学位。',
      tags: ['UK CV', 'A4 Size', 'Lead / Staff'],
      language: 'English',
      group: 'uk',
      experience: 'Lead / Senior',
      targetMarket: 'uk',
      defaultPaperSize: 'a4',
      dateStyle: 'month-long',
      marketBadge: '🇬🇧 UK CV · A4',
    },
    en: {
      name: 'UK Tech Lead & Full-Stack (CV)',
      category: 'Global',
      description: 'Standard British CV format with Professional Profile, UK date style, and honours degree.',
      tags: ['UK CV', 'A4 Size', 'Lead / Staff'],
      language: 'English',
      group: 'uk',
      experience: 'Lead / Senior',
      targetMarket: 'uk',
      defaultPaperSize: 'a4',
      dateStyle: 'month-long',
      marketBadge: '🇬🇧 UK CV · A4',
    },
  },
  ca_tech: {
    zh: {
      name: '加拿大云原生与数据工程师 (Resume)',
      category: '海外求职',
      description: '契合加拿大科技公司标准，Letter 纸张，强调 DevOps 与分布式数据管道成果。',
      tags: ['Canada', 'Cloud Platform', 'Letter Size'],
      language: 'English',
      group: 'global',
      experience: 'Experienced',
      targetMarket: 'ca',
      defaultPaperSize: 'letter',
      dateStyle: 'month-short',
      marketBadge: '🇨🇦 Canada · Letter',
    },
    en: {
      name: 'Canadian Cloud & Data Engineer',
      category: 'Global',
      description: 'Canadian tech resume with Letter page size, FinOps, and data engineering achievements.',
      tags: ['Canada', 'Cloud Platform', 'Letter Size'],
      language: 'English',
      group: 'global',
      experience: 'Experienced',
      targetMarket: 'ca',
      defaultPaperSize: 'letter',
      dateStyle: 'month-short',
      marketBadge: '🇨🇦 Canada · Letter',
    },
  },
  english: {
    zh: {
      name: '国际通用远程全栈架构师',
      category: '海外求职',
      description: '国际通用英文 Resume，强调跨国远程协作与高并发 AI 基础设施经验。',
      tags: ['Remote', 'Global Standard', 'AI Stack'],
      language: 'English',
      group: 'global',
      experience: 'Principal / Lead',
      targetMarket: 'international',
      defaultPaperSize: 'a4',
      dateStyle: 'month-short',
      marketBadge: '🌐 Global · Remote',
    },
    en: {
      name: 'Global Full-Stack & Remote (Resume)',
      category: 'Global',
      description: 'International resume emphasizing global remote leadership and AI infrastructure.',
      tags: ['Remote', 'Global Standard', 'AI Stack'],
      language: 'English',
      group: 'global',
      experience: 'Principal / Lead',
      targetMarket: 'international',
      defaultPaperSize: 'a4',
      dateStyle: 'month-short',
      marketBadge: '🌐 Global · Remote',
    },
  },
};

export function getTemplatePresentation(
  template: ResumeTemplate,
  lang: 'zh' | 'en',
): TemplatePresentation {
  const presentation = TEMPLATE_PRESENTATION[template.id]?.[lang];
  if (presentation) return presentation;

  return {
    name: template.name,
    category: template.category,
    description:
      lang === 'en'
        ? 'A ready-to-edit resume template.'
        : '一份可直接编辑使用的简历模板。',
    tags: [],
    language: lang === 'en' ? 'Mixed' : '混合',
    group: 'engineering',
    experience: lang === 'en' ? 'General' : '通用',
    targetMarket: template.targetMarket,
    defaultPaperSize: template.defaultPaperSize,
    dateStyle: template.dateStyle,
    marketBadge: template.targetMarket?.toUpperCase(),
  };
}

export function getTemplatePreview(content: string) {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const name =
    lines.find((line) => line.startsWith('# '))?.replace(/^#\s+/, '') ??
    'Resume';

  const nameIndex = lines.findIndex((line) => line.startsWith('# '));
  const subtitle =
    lines
      .slice(Math.max(0, nameIndex + 1))
      .find(
        (line) =>
          !line.startsWith('#') &&
          !line.startsWith('- ') &&
          !line.startsWith('* '),
      ) ?? '';

  const sections = lines
    .filter((line) => line.startsWith('## '))
    .slice(0, 4)
    .map((line) => line.replace(/^##\s+/, ''));

  const firstBullet =
    lines
      .find((line) => line.startsWith('- '))
      ?.replace(/^[-*]\s+/, '')
      .replace(/\*\*/g, '') ?? '';

  return { name, subtitle, sections, firstBullet };
}
