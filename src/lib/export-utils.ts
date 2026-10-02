import { DateStyle, Language, MarketRegion, PaperSize, ResumeSettings } from '../types';
import { parseMarkdownToForm } from './markdown-parser';
import { getMarketProfile, isMarketRegion } from './market-profile';
import { isPaperSize } from './paper';
import { normalizeAllDatesInMarkdown, sanitizeSensitiveFieldsForMarket } from './resume-auto-fixer';
import { translateMarkdownContent } from './section-translator';

export interface ExportFileNameOptions {
  markdown: string;
  settings: ResumeSettings;
  customFileName?: string;
  extension?: string;
}

/**
 * Clean and sanitize a string to be safely used as a filename across Windows, macOS, and Linux.
 */
export function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/[\\/:*?"<>|\r\n]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate a market-standard default export filename based on candidate name, target role,
 * target market conventions, and active document language.
 *
 * Examples:
 * - US/CA: "Alex Smith - Senior Software Engineer - Resume"
 * - UK/IE: "Alex Smith - Senior Software Engineer - Curriculum Vitae"
 * - CN: "张伟 - 高级前端工程师 - 个人简历"
 * - International: "Alex Smith - Senior Software Engineer - Resume"
 */
export function getMarketDefaultFileName({
  markdown,
  settings,
  customFileName,
  extension,
}: ExportFileNameOptions): string {
  if (customFileName && customFileName.trim()) {
    const cleanCustom = sanitizeFilename(customFileName);
    if (cleanCustom) {
      return extension ? `${cleanCustom}.${extension.replace(/^\./, '')}` : cleanCustom;
    }
  }

  const lines = markdown.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  let candidateName = '';
  let targetRole = '';

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    if (!candidateName && line.startsWith('# ')) {
      candidateName = line.replace(/^#\s+/, '').trim();
    } else if (!targetRole && line.startsWith('> **') && line.endsWith('**')) {
      targetRole = line.replace(/^>\s*\*\*/, '').replace(/\*\*$/, '').trim();
    } else if (!targetRole && line.startsWith('>') && line.length < 50 && !line.includes('|')) {
      targetRole = line.replace(/^>\s*/, '').trim();
    }
  }

  const market = settings.marketRegion || 'cn';
  const isEn = settings.lang === 'en' || market !== 'cn';

  if (!candidateName) {
    candidateName = isEn ? 'Candidate' : '求职者';
  }

  let docTypeSuffix = 'Resume';
  if (market === 'uk' || market === 'ie') {
    docTypeSuffix = isEn ? 'Curriculum Vitae' : 'CV';
  } else if (market === 'cn' && !isEn) {
    docTypeSuffix = '个人简历';
  } else if (market === 'cn' && isEn) {
    docTypeSuffix = 'Resume';
  } else {
    docTypeSuffix = 'Resume';
  }

  let baseName = candidateName;
  if (targetRole) {
    baseName += ` - ${targetRole}`;
  }
  baseName += ` - ${docTypeSuffix}`;

  const sanitized = sanitizeFilename(baseName);
  return extension ? `${sanitized}.${extension.replace(/^\./, '')}` : sanitized;
}

function stripMarkdownFormatting(str: string): string {
  if (!str) return '';
  return str
    .replace(/^>\s*/, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)')
    .trim();
}

/**
 * Generate clean ATS Plain Text format stripped of raw markdown formatting,
 * HTML, and table syntax, optimized for direct copy-pasting into ATS job application portals.
 */
export function generateCleanAtsPlainText(
  markdown: string,
  _options: { marketRegion?: MarketRegion; lang?: Language } = {}
): string {
  if (!markdown || !markdown.trim()) return '';

  const formModel = parseMarkdownToForm(markdown);
  const out: string[] = [];

  // Header / Basic Info
  if (formModel.name) {
    out.push(stripMarkdownFormatting(formModel.name).toUpperCase());
  }
  if (formModel.subtitle) {
    out.push(stripMarkdownFormatting(formModel.subtitle));
  }

  const contacts: string[] = [];
  if (formModel.phone) contacts.push(stripMarkdownFormatting(formModel.phone));
  if (formModel.email) contacts.push(stripMarkdownFormatting(formModel.email));
  if (formModel.city) contacts.push(stripMarkdownFormatting(formModel.city));
  if (formModel.social) contacts.push(stripMarkdownFormatting(formModel.social));
  if (formModel.wechat) contacts.push(`WeChat: ${stripMarkdownFormatting(formModel.wechat)}`);

  if (contacts.length > 0) {
    out.push(contacts.join(' | '));
  }
  out.push('');

  // Iterate sections
  for (const sec of formModel.sections) {
    if (!sec.title && sec.items.length === 0 && !sec.textValue) continue;

    out.push(`==================== ${stripMarkdownFormatting(sec.title).toUpperCase()} ====================`);
    out.push('');

    if (sec.type === 'text' && sec.textValue) {
      const textLines = sec.textValue.split('\n').map((l) => l.trim()).filter(Boolean);
      for (const tl of textLines) {
        const cleanLine = stripMarkdownFormatting(tl.replace(/^[•⁃－—–·●▪■◆\-\*\+]\s*/, ''));
        out.push(`  • ${cleanLine}`);
      }
      out.push('');
    } else {
      for (const item of sec.items) {
        const headerParts: string[] = [];
        if (item.org) headerParts.push(stripMarkdownFormatting(item.org));
        if (item.role) headerParts.push(stripMarkdownFormatting(item.role));
        if (item.degree) headerParts.push(stripMarkdownFormatting(item.degree));
        if (item.time) headerParts.push(stripMarkdownFormatting(item.time));

        if (headerParts.length > 0) {
          out.push(headerParts.join('  --  '));
        }

        if (item.content) {
          const descLines = item.content.split('\n').map((l) => l.trim()).filter(Boolean);
          for (const dl of descLines) {
            const cleanLine = stripMarkdownFormatting(dl.replace(/^[•⁃－—–·●▪■◆\-\*\+]\s*/, ''));
            out.push(`  • ${cleanLine}`);
          }
        }
        out.push('');
      }
    }
  }

  return out.join('\n').trim() + '\n';
}

/**
 * Standard JSON Resume (schema.jsonresume.org) interface with multi-market extensions.
 */
export interface JsonResumeStandard {
  basics: {
    name: string;
    label?: string;
    image?: string;
    email?: string;
    phone?: string;
    url?: string;
    summary?: string;
    location?: {
      address?: string;
      postalCode?: string;
      city?: string;
      countryCode?: string;
      region?: string;
    };
    profiles?: Array<{
      network: string;
      username?: string;
      url: string;
    }>;
  };
  work?: Array<{
    name: string;
    position: string;
    url?: string;
    startDate?: string;
    endDate?: string;
    summary?: string;
    highlights?: string[];
  }>;
  education?: Array<{
    institution: string;
    url?: string;
    area?: string;
    studyType?: string;
    startDate?: string;
    endDate?: string;
    score?: string;
    courses?: string[];
  }>;
  skills?: Array<{
    name: string;
    level?: string;
    keywords?: string[];
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    highlights?: string[];
    keywords?: string[];
    startDate?: string;
    endDate?: string;
    url?: string;
  }>;
  meta?: {
    canonical?: string;
    version?: string;
    lastModified?: string;
    targetMarket?: MarketRegion;
    paperSize?: PaperSize;
    dateStyle?: DateStyle;
    lang?: Language;
  };
}

/**
 * Convert Markdown resume into standard JSON Resume format.
 */
export function exportToJsonResume(
  markdown: string,
  settings: ResumeSettings
): JsonResumeStandard {
  const formModel = parseMarkdownToForm(markdown);
  const json: JsonResumeStandard = {
    basics: {
      name: stripMarkdownFormatting(formModel.name) || '',
      label: stripMarkdownFormatting(formModel.subtitle) || '',
      email: formModel.email || undefined,
      phone: formModel.phone || undefined,
      url: formModel.social ? (formModel.social.startsWith('http') ? formModel.social : `https://${formModel.social}`) : undefined,
      summary: undefined,
      location: formModel.city ? { city: stripMarkdownFormatting(formModel.city) } : undefined,
      profiles: [],
    },
    work: [],
    education: [],
    skills: [],
    projects: [],
    meta: {
      canonical: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
      version: 'v1.0.0',
      lastModified: new Date().toISOString(),
      targetMarket: settings.marketRegion || 'us',
      paperSize: settings.paperSize || 'letter',
      dateStyle: settings.dateStyle,
      lang: settings.lang || 'en',
    },
  };

  if (formModel.social) {
    json.basics.profiles?.push({
      network: 'Portfolio / Social',
      username: formModel.social.replace(/^https?:\/\//, ''),
      url: formModel.social.startsWith('http')
        ? formModel.social
        : `https://${formModel.social}`,
    });
  }

  for (const sec of formModel.sections) {
    const titleLower = sec.title.toLowerCase();

    if (
      titleLower.includes('work') ||
      titleLower.includes('experience') ||
      titleLower.includes('工作') ||
      titleLower.includes('职业')
    ) {
      sec.items.forEach((item) => {
        const dateParts = (item.time || '').split(/[-–—至~]/).map((s) => s.trim());
        const highlights = (item.content || '')
          .split('\n')
          .map((l) => l.trim().replace(/^[•⁃－—–·●▪■◆\-\*\+]\s*/, ''))
          .filter(Boolean);

        json.work?.push({
          name: item.org || '',
          position: item.role || '',
          startDate: dateParts[0] || undefined,
          endDate: dateParts[1] || undefined,
          highlights: highlights.length > 0 ? highlights : undefined,
        });
      });
    } else if (
      titleLower.includes('edu') ||
      titleLower.includes('教育') ||
      titleLower.includes('学历')
    ) {
      sec.items.forEach((item) => {
        const dateParts = (item.time || '').split(/[-–—至~]/).map((s) => s.trim());
        json.education?.push({
          institution: item.org || '',
          studyType: item.degree || undefined,
          area: item.role || undefined,
          startDate: dateParts[0] || undefined,
          endDate: dateParts[1] || undefined,
          courses: (item.content || '')
            .split('\n')
            .map((l) => l.trim().replace(/^[•⁃－—–·●▪■◆\-\*\+]\s*/, ''))
            .filter(Boolean),
        });
      });
    } else if (
      titleLower.includes('project') ||
      titleLower.includes('项目')
    ) {
      sec.items.forEach((item) => {
        const dateParts = (item.time || '').split(/[-–—至~]/).map((s) => s.trim());
        const highlights = (item.content || '')
          .split('\n')
          .map((l) => l.trim().replace(/^[•⁃－—–·●▪■◆\-\*\+]\s*/, ''))
          .filter(Boolean);

        json.projects?.push({
          name: item.org || '',
          description: item.role || undefined,
          startDate: dateParts[0] || undefined,
          endDate: dateParts[1] || undefined,
          highlights: highlights.length > 0 ? highlights : undefined,
        });
      });
    } else if (
      titleLower.includes('skill') ||
      titleLower.includes('技能')
    ) {
      if (sec.type === 'text' && sec.textValue) {
        const keywords = sec.textValue
          .split(/[,，、|\n]/)
          .map((k) => k.trim().replace(/^[•⁃－—–·●▪■◆\-\*\+]\s*/, ''))
          .filter(Boolean);

        json.skills?.push({
          name: sec.title || 'Skills',
          keywords: keywords.length > 0 ? keywords : undefined,
        });
      } else {
        sec.items.forEach((item) => {
          const keywords = (item.content || '')
            .split(/[,，、|\n]/)
            .map((k) => k.trim().replace(/^[•⁃－—–·●▪■◆\-\*\+]\s*/, ''))
            .filter(Boolean);

          json.skills?.push({
            name: item.org || 'Skills',
            keywords: keywords.length > 0 ? keywords : undefined,
          });
        });
      }
    }
  }

  return json;
}

/**
 * Convert JSON Resume object back into clean Markdown resume.
 */
export function importFromJsonResume(jsonObj: unknown): {
  markdown: string;
  detectedSettings?: Partial<ResumeSettings>;
} {
  if (typeof jsonObj !== 'object' || jsonObj === null) {
    return { markdown: '' };
  }

  const res = jsonObj as Partial<JsonResumeStandard>;
  const basics = res.basics || { name: 'Candidate' };
  const detectedSettings: Partial<ResumeSettings> = {};

  if (isMarketRegion(res.meta?.targetMarket)) {
    detectedSettings.marketRegion = res.meta.targetMarket;
  }
  if (isPaperSize(res.meta?.paperSize)) {
    detectedSettings.paperSize = res.meta.paperSize;
  }
  if (res.meta?.lang === 'zh' || res.meta?.lang === 'en') {
    detectedSettings.lang = res.meta.lang;
  }
  if (
    res.meta?.dateStyle === 'cn-dot' ||
    res.meta?.dateStyle === 'month-short' ||
    res.meta?.dateStyle === 'month-long'
  ) {
    detectedSettings.dateStyle = res.meta.dateStyle;
  }

  const isEn = detectedSettings.lang === 'en' || (detectedSettings.marketRegion && detectedSettings.marketRegion !== 'cn');
  let md = `# ${basics.name || (isEn ? 'Candidate Name' : '求职者姓名')}\n`;

  if (basics.label) {
    md += `> **${basics.label}**\n`;
  }

  const contacts: string[] = [];
  if (basics.phone) contacts.push(basics.phone);
  if (basics.email) contacts.push(basics.email);
  if (basics.location?.city) contacts.push(basics.location.city);
  if (basics.url) contacts.push(`[Website](${basics.url})`);

  if (basics.profiles && basics.profiles.length > 0) {
    for (const p of basics.profiles) {
      if (p.network && p.url) {
        contacts.push(`[${p.network}](${p.url})`);
      }
    }
  }

  if (contacts.length > 0) {
    md += `${contacts.join(' | ')}\n\n`;
  } else {
    md += `\n`;
  }

  // Work Experience
  if (res.work && res.work.length > 0) {
    md += `## ${isEn ? 'Work Experience' : '工作经历'}\n\n`;
    for (const w of res.work) {
      const dates = [w.startDate, w.endDate].filter(Boolean).join(' – ');
      const sub = [w.position, dates].filter(Boolean).join(' | ');
      md += `### ${w.name}${sub ? ` | ${sub}` : ''}\n`;
      if (w.summary) {
        md += `- ${w.summary}\n`;
      }
      if (w.highlights && w.highlights.length > 0) {
        for (const h of w.highlights) {
          md += `- ${h}\n`;
        }
      }
      md += `\n`;
    }
  }

  // Projects
  if (res.projects && res.projects.length > 0) {
    md += `## ${isEn ? 'Projects' : '项目经历'}\n\n`;
    for (const p of res.projects) {
      const dates = [p.startDate, p.endDate].filter(Boolean).join(' – ');
      const sub = [p.description, dates].filter(Boolean).join(' | ');
      md += `### ${p.name}${sub ? ` | ${sub}` : ''}\n`;
      if (p.highlights && p.highlights.length > 0) {
        for (const h of p.highlights) {
          md += `- ${h}\n`;
        }
      }
      md += `\n`;
    }
  }

  // Education
  if (res.education && res.education.length > 0) {
    md += `## ${isEn ? 'Education' : '教育背景'}\n\n`;
    for (const e of res.education) {
      const dates = [e.startDate, e.endDate].filter(Boolean).join(' – ');
      const sub = [e.studyType, e.area, dates].filter(Boolean).join(' | ');
      md += `### ${e.institution}${sub ? ` | ${sub}` : ''}\n`;
      if (e.courses && e.courses.length > 0) {
        for (const c of e.courses) {
          md += `- ${c}\n`;
        }
      }
      md += `\n`;
    }
  }

  // Skills
  if (res.skills && res.skills.length > 0) {
    md += `## ${isEn ? 'Skills' : '专业技能'}\n\n`;
    for (const s of res.skills) {
      if (s.keywords && s.keywords.length > 0) {
        md += `- **${s.name}**: ${s.keywords.join(', ')}\n`;
      } else if (s.name) {
        md += `- ${s.name}\n`;
      }
    }
    md += `\n`;
  }

  return { markdown: md.trim() + '\n', detectedSettings };
}

/**
 * Automatically adapt and normalize an imported resume markdown text to the target market standards.
 */
export function adaptMarkdownToTargetMarket(
  markdown: string,
  targetMarket: MarketRegion,
  targetLang: Language = 'zh'
): {
  adaptedMarkdown: string;
  appliedFixes: string[];
} {
  const fixes: string[] = [];
  let currentMd = markdown;

  const profile = getMarketProfile(targetMarket);
  const isEn = targetLang === 'en' || targetMarket !== 'cn';

  // 1. Normalize dates according to target market
  const dateResult = normalizeAllDatesInMarkdown(currentMd, profile.dateStyle, isEn);
  if (dateResult.convertedCount > 0) {
    currentMd = dateResult.markdown;
    fixes.push(`已自动将 ${dateResult.convertedCount} 处日期转换为目标市场标准`);
  }

  // 2. Sanitize discouraged personal fields for target market (e.g. US/UK EEO standards)
  if (profile.discouragedPersonalFields.length > 0) {
    const sanitizeResult = sanitizeSensitiveFieldsForMarket(currentMd);
    if (sanitizeResult.sanitizedFieldsCount > 0) {
      currentMd = sanitizeResult.markdown;
      fixes.push(`已依据 ${isEn ? profile.labelEn : profile.labelZh} 招聘规范优化个人敏感字段`);
    }
  }

  // 3. Translate section titles if needed
  if (targetLang === 'en' && targetMarket !== 'cn') {
    const translated = translateMarkdownContent(currentMd, 'en');
    if (translated !== currentMd) {
      currentMd = translated;
      fixes.push('已将模块标题转换为标准英文 ATS 标题');
    }
  } else if (targetLang === 'zh' && targetMarket === 'cn') {
    const translated = translateMarkdownContent(currentMd, 'zh');
    if (translated !== currentMd) {
      currentMd = translated;
      fixes.push('已将模块标题转换为标准中文简历标题');
    }
  }

  return {
    adaptedMarkdown: currentMd,
    appliedFixes: fixes,
  };
}

