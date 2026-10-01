/**
 * Section Title and Standard Resume Headers Translator
 * Supports bidirectional translation between Chinese (zh) and English (en)
 */

export interface TitleMapping {
  zh: string[];
  en: string;
  defaultZh: string;
}

export const STANDARD_SECTION_MAPPINGS: TitleMapping[] = [
  {
    zh: ['个人优势', '核心优势', '个人亮点', '优势要点', '综合优势', '核心竞争力', '个人简介', '个人介绍', '关于我', '自我评价', '个人评价', '自我总结', '个人总结'],
    en: 'Summary',
    defaultZh: '个人优势'
  },
  {
    zh: ['专业技能', '核心技能', '核心能力', '技能特长', '技术栈', '专业技能与技术栈', '技能与专长', '掌握技能'],
    en: 'Skills',
    defaultZh: '专业技能'
  },
  {
    zh: ['工作经历', '工作经验', '从业经历', '职业经历', '工作背景'],
    en: 'Work Experience',
    defaultZh: '工作经历'
  },
  {
    zh: ['实习经历', '实习经验', '校园实习'],
    en: 'Internships',
    defaultZh: '实习经历'
  },
  {
    zh: ['代表项目', '项目经历', '项目经验', '主要项目', '核心项目', '开源项目', '重点项目'],
    en: 'Projects',
    defaultZh: '代表项目'
  },
  {
    zh: ['教育背景', '教育经历', '学历背景', '学习经历'],
    en: 'Education',
    defaultZh: '教育背景'
  },
  {
    zh: ['荣誉奖项', '获奖情况', '荣誉表彰', '主要荣誉', '荣誉与奖项', '个人荣誉'],
    en: 'Honors & Awards',
    defaultZh: '荣誉奖项'
  },
  {
    zh: ['资质证书', '证书资质', '专业证书', '资格认证', '职业证书'],
    en: 'Certifications',
    defaultZh: '资质证书'
  },
  {
    zh: ['社交主页', '社交链接', '作品链接'],
    en: 'Links & Portfolio',
    defaultZh: '社交主页'
  }
];

/**
 * Translates a single section title to the target language if a standard mapping exists
 */
export function translateSectionTitle(title: string, targetLang: 'zh' | 'en'): string {
  const trimmed = (title || '').trim();
  if (!trimmed) return trimmed;

  if (targetLang === 'en') {
    // Chinese to English
    for (const mapping of STANDARD_SECTION_MAPPINGS) {
      if (mapping.zh.some(k => trimmed.toLowerCase() === k.toLowerCase() || trimmed.includes(k))) {
        return mapping.en;
      }
    }

    // Canonicalize common English aliases so templates use one consistent
    // section vocabulary in English mode.
    const lower = trimmed.toLowerCase();
    if (['summary', 'professional profile', 'profile', 'about me'].includes(lower)) return 'Summary';
    if (['skills', 'technical skills', 'core competencies', 'core technical skills', 'technical competencies'].includes(lower)) return 'Skills';
    if (['experience', 'work experience', 'professional experience', 'career history', 'employment history'].includes(lower)) return 'Work Experience';
    if (['projects', 'key projects', 'project experience', 'selected projects'].includes(lower)) return 'Projects';
    if (['education', 'education & qualifications', 'education and qualifications', 'academic background'].includes(lower)) return 'Education';
    if (['honors & awards', 'honours & awards', 'awards & honors', 'awards & honours'].includes(lower)) return 'Honors & Awards';
    if (['certifications', 'certificates', 'licenses & certifications', 'licences & certifications'].includes(lower)) return 'Certifications';

    return trimmed;
  } else {
    // English to Chinese
    const lower = trimmed.toLowerCase();
    for (const mapping of STANDARD_SECTION_MAPPINGS) {
      if (lower === mapping.en.toLowerCase()) {
        return mapping.defaultZh;
      }
    }
    if (lower.includes('summary') || lower.includes('strength') || lower.includes('profile')) return '个人优势';
    if (lower.includes('skill') || lower.includes('tech stack') || lower.includes('technologies')) return '专业技能';
    if (lower.includes('work') || lower.includes('experience') || lower.includes('employment') || lower.includes('career')) return '工作经历';
    if (lower.includes('intern')) return '实习经历';
    if (lower.includes('project') || lower.includes('portfolio')) return '代表项目';
    if (lower.includes('edu') || lower.includes('academic') || lower.includes('degree')) return '教育背景';
    if (lower.includes('award') || lower.includes('honor')) return '荣誉奖项';
    if (lower.includes('cert') || lower.includes('licens')) return '资质证书';
    if (lower.includes('about')) return '自我评价';
    return trimmed;
  }
}

/**
 * Checks if a title is eligible for translation into targetLang
 */
export function canTranslateSectionTitle(title: string, targetLang: 'zh' | 'en'): boolean {
  const trimmed = (title || '').trim();
  if (!trimmed) return false;
  const translated = translateSectionTitle(trimmed, targetLang);
  return translated !== trimmed;
}

/**
 * Bidirectionally converts standard section headings, sub-item labels, and time strings in Markdown
 */
export function translateMarkdownContent(markdown: string, targetLang: 'zh' | 'en'): string {
  if (!markdown) return markdown;

  let result = markdown;

  if (targetLang === 'en') {
    // 1. Section Headings (## <Title>)
    result = result.replace(/^##\s+(.+)$/gm, (match, title) => {
      const translated = translateSectionTitle(title, 'en');
      return `## ${translated}`;
    });

    // 2. Standard Education sub-items
    result = result
      .replace(/^- \*\*(?:在校表现|学业成绩|成绩|在校表现及绩点)\*\*[:：\s]*/gm, '- **GPA / Performance**: ')
      .replace(/^- \*\*(?:主修课程|核心课程|专业课程|主修学科)\*\*[:：\s]*/gm, '- **Core Courses**: ')
      .replace(/^- \*\*(?:荣誉成就|主要荣誉|所获荣誉|荣誉表彰)\*\*[:：\s]*/gm, '- **Honors & Awards**: ');

    // 3. Time ranges (e.g. 2024.03 — 至今 -> 2024.03 - Present)
    result = result.replace(/(?<=\b(?:19|20)\d{2}(?:[.\-/年]\d{1,2})?\s*[-—–~至到]\s*)至今/g, 'Present');
    result = result.replace(/\*至今\*/g, '*Present*');
  } else {
    // 1. Section Headings (## <Title>)
    result = result.replace(/^##\s+(.+)$/gm, (match, title) => {
      const translated = translateSectionTitle(title, 'zh');
      return `## ${translated}`;
    });

    // 2. Standard Education sub-items
    result = result
      .replace(/^- \*\*(?:GPA \/ Performance|Academic Performance|GPA|Performance)\*\*[:：\s]*/gm, '- **在校表现**：')
      .replace(/^- \*\*(?:Core Courses|Courses|Major Courses)\*\*[:：\s]*/gm, '- **主修课程**：')
      .replace(/^- \*\*(?:Honors & Awards|Honors|Awards|Achievements)\*\*[:：\s]*/gm, '- **荣誉成就**：');

    // 3. Time ranges (e.g. 2024.03 - Present -> 2024.03 — 至今)
    result = result.replace(/(?<=\b(?:19|20)\d{2}(?:[.\-/]\d{1,2})?\s*[-—–~]\s*)(?:Present|present|Current|current|Now|now)/g, '至今');
    result = result.replace(/\*(?:Present|present)\*/g, '*至今*');
  }

  return result;
}
