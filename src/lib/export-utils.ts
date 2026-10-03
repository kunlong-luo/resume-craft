import { DateStyle, Language, MarketRegion, PaperSize, ResumeSettings } from '../types';
import { parseMarkdownToForm } from './markdown-parser';
import { getMarketProfile } from './market-profile';
import { normalizeAllDatesInMarkdown, sanitizeSensitiveFieldsForMarket } from './resume-auto-fixer';
import { translateMarkdownContent } from './section-translator';
import { detectResumeLanguage } from './resume-language';
import { parseDateRange } from './date-parser';

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
  return Array.from(name.trim())
    .map((char) => {
      const code = char.charCodeAt(0);
      return code < 32 || code === 127 ? '-' : char;
    })
    .join('')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/[. ]+$/g, '')
    .replace(/^\.+$/g, '');
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
      const baseCustom = cleanCustom
        .replace(/\.(?:pdf|txt|json|md|markdown)$/i, '')
        .replace(/[. ]+$/g, '');

      if (!extension) {
        if (baseCustom) return baseCustom;
      } else {
        const normalizedExtension = extension.replace(/^\./, '').toLowerCase();
        if (baseCustom) {
          return `${baseCustom}.${normalizedExtension}`;
        }
      }
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

function splitResumeDateRange(raw: string | undefined): {
  startDate?: string;
  endDate?: string;
} {
  if (!raw?.trim()) return {};

  const parsed = parseDateRange(raw);
  if (!parsed?.start) return { startDate: raw.trim() };

  const startDate = parsed.start.raw.trim();
  if (parsed.hasRange && parsed.end) {
    return {
      startDate,
      endDate: parsed.end.raw.trim(),
    };
  }

  return { startDate };
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

function parsePrimarySocialLink(rawSocial: string | undefined): {
  url: string;
  network: string;
  username: string;
} | null {
  const raw = rawSocial?.trim();
  if (!raw) return null;

  const markdownLink = raw.match(/\[([^\]]+)]\((https?:\/\/[^)\s]+)\)/i);
  let url = markdownLink?.[2];
  let networkHint = markdownLink?.[1]?.trim() || '';

  if (!url) {
    const absoluteUrl = raw.match(/https?:\/\/[^\s·|｜]+/i)?.[0];
    if (absoluteUrl) {
      url = absoluteUrl;
    }
  }

  if (!url) {
    const bareDomain = raw.match(
      /(?:^|[\s·|｜])((?:www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s·|｜]*)?)/i,
    )?.[1];
    if (bareDomain) {
      url = `https://${bareDomain}`;
    }
  }

  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (!networkHint) {
      if (host.includes('github.com')) networkHint = 'GitHub';
      else if (host.includes('linkedin.com')) networkHint = 'LinkedIn';
      else if (host.includes('gitlab.com')) networkHint = 'GitLab';
      else networkHint = 'Portfolio / Social';
    }

    return {
      url: parsed.toString(),
      network: networkHint,
      username:
        parsed.pathname.replace(/^\/+|\/+$/g, '') ||
        parsed.hostname,
    };
  } catch {
    return null;
  }
}

/**
 * Convert Markdown resume into standard JSON Resume format.
 */
export function exportToJsonResume(
  markdown: string,
  settings: ResumeSettings
): JsonResumeStandard {
  const formModel = parseMarkdownToForm(markdown);
  const primarySocial = parsePrimarySocialLink(formModel.social);
  const json: JsonResumeStandard = {
    basics: {
      name: stripMarkdownFormatting(formModel.name) || '',
      label: stripMarkdownFormatting(formModel.subtitle) || '',
      email: formModel.email || undefined,
      phone: formModel.phone || undefined,
      url: primarySocial?.url,
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

  if (primarySocial) {
    json.basics.profiles?.push(primarySocial);
  }

  for (const sec of formModel.sections) {
    const titleLower = sec.title.toLowerCase();

    if (
      !json.basics.summary &&
      (
        titleLower.includes('summary') ||
        titleLower.includes('profile') ||
        titleLower.includes('about me') ||
        titleLower.includes('个人简介') ||
        titleLower.includes('个人总结') ||
        titleLower.includes('自我评价')
      )
    ) {
      const summarySource =
        sec.type === 'text'
          ? sec.textValue || ''
          : sec.items
              .flatMap((item) => [item.content, item.role, item.org])
              .filter((value): value is string => Boolean(value?.trim()))
              .join('\n');

      const summary = summarySource
        .split('\n')
        .map((line) =>
          stripMarkdownFormatting(
            line.trim().replace(/^[•⁃－—–·●▪■◆\-*+]\s*/, ''),
          ),
        )
        .filter(Boolean)
        .join('\n')
        .trim();

      if (summary) {
        json.basics.summary = summary;
      }
    } else if (
      titleLower.includes('work') ||
      titleLower.includes('experience') ||
      titleLower.includes('工作') ||
      titleLower.includes('职业')
    ) {
      sec.items.forEach((item) => {
        const { startDate, endDate } = splitResumeDateRange(item.time);
        const highlights = (item.content || '')
          .split('\n')
          .map((l) => l.trim().replace(/^[•⁃－—–·●▪■◆\-\*\+]\s*/, ''))
          .filter(Boolean);

        json.work?.push({
          name: item.org || '',
          position: item.role || '',
          startDate,
          endDate,
          highlights: highlights.length > 0 ? highlights : undefined,
        });
      });
    } else if (
      titleLower.includes('edu') ||
      titleLower.includes('教育') ||
      titleLower.includes('学历')
    ) {
      sec.items.forEach((item) => {
        const { startDate, endDate } = splitResumeDateRange(item.time);
        json.education?.push({
          institution: item.org || '',
          studyType: item.degree || undefined,
          area: item.role || undefined,
          startDate,
          endDate,
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
        const { startDate, endDate } = splitResumeDateRange(item.time);
        const highlights = (item.content || '')
          .split('\n')
          .map((l) => l.trim().replace(/^[•⁃－—–·●▪■◆\-\*\+]\s*/, ''))
          .filter(Boolean);

        json.projects?.push({
          name: item.org || '',
          description: item.role || undefined,
          startDate,
          endDate,
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
  if (typeof jsonObj !== 'object' || jsonObj === null || Array.isArray(jsonObj)) {
    return { markdown: '' };
  }

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
  const stringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

  const raw = jsonObj as Record<string, unknown>;
  const basics = isRecord(raw.basics)
    ? (raw.basics as unknown as JsonResumeStandard['basics'])
    : { name: 'Candidate' };
  const meta = isRecord(raw.meta)
    ? (raw.meta as unknown as NonNullable<JsonResumeStandard['meta']>)
    : undefined;
  const work = Array.isArray(raw.work)
    ? raw.work.filter(isRecord) as unknown as NonNullable<JsonResumeStandard['work']>
    : [];
  const education = Array.isArray(raw.education)
    ? raw.education.filter(isRecord) as unknown as NonNullable<JsonResumeStandard['education']>
    : [];
  const projects = Array.isArray(raw.projects)
    ? raw.projects.filter(isRecord) as unknown as NonNullable<JsonResumeStandard['projects']>
    : [];
  const skills = Array.isArray(raw.skills)
    ? raw.skills.filter(isRecord) as unknown as NonNullable<JsonResumeStandard['skills']>
    : [];
  const profiles = Array.isArray(basics.profiles)
    ? basics.profiles.filter(isRecord)
    : [];
  const location = isRecord(basics.location) ? basics.location : undefined;
  const detectedSettings: Partial<ResumeSettings> = {};

  const validMarkets: readonly MarketRegion[] = ['cn', 'us', 'ca', 'uk', 'ie', 'international'];
  const validPaperSizes: readonly PaperSize[] = ['a4', 'letter'];
  const validLanguages: readonly Language[] = ['zh', 'en'];
  const validDateStyles: readonly DateStyle[] = ['cn-dot', 'month-short', 'month-long'];

  if (
    typeof meta?.targetMarket === 'string' &&
    validMarkets.includes(meta.targetMarket as MarketRegion)
  ) {
    detectedSettings.marketRegion = meta.targetMarket as MarketRegion;
  }
  if (
    typeof meta?.paperSize === 'string' &&
    validPaperSizes.includes(meta.paperSize as PaperSize)
  ) {
    detectedSettings.paperSize = meta.paperSize as PaperSize;
  }
  if (
    typeof meta?.lang === 'string' &&
    validLanguages.includes(meta.lang as Language)
  ) {
    detectedSettings.lang = meta.lang as Language;
  }
  if (
    typeof meta?.dateStyle === 'string' &&
    validDateStyles.includes(meta.dateStyle as DateStyle)
  ) {
    detectedSettings.dateStyle = meta.dateStyle as DateStyle;
  }

  if (!detectedSettings.lang) {
    const languageSample = [
      basics.name,
      basics.label,
      basics.summary,
      typeof location?.city === 'string' ? location.city : undefined,
      ...work.flatMap((item) => [
        item.name,
        item.position,
        item.summary,
        ...stringArray(item.highlights),
      ]),
      ...education.flatMap((item) => [
        item.institution,
        item.area,
        item.studyType,
        ...stringArray(item.courses),
      ]),
      ...projects.flatMap((item) => [
        item.name,
        item.description,
        ...stringArray(item.highlights),
      ]),
      ...skills.flatMap((item) => [
        item.name,
        ...stringArray(item.keywords),
      ]),
    ]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .join('\n');

    const fallbackLang: Language =
      detectedSettings.marketRegion && detectedSettings.marketRegion !== 'cn'
        ? 'en'
        : 'zh';
    detectedSettings.lang = detectResumeLanguage(languageSample, fallbackLang);
  }

  const isEn = detectedSettings.lang === 'en' || (detectedSettings.marketRegion && detectedSettings.marketRegion !== 'cn');
  let md = `# ${basics.name || (isEn ? 'Candidate Name' : '求职者姓名')}\n`;

  if (basics.label) {
    md += `> **${basics.label}**\n`;
  }

  const contacts: string[] = [];
  if (basics.phone) contacts.push(basics.phone);
  if (basics.email) contacts.push(basics.email);
  if (typeof location?.city === 'string') contacts.push(location.city);
  if (basics.url) contacts.push(`[Website](${basics.url})`);

  if (profiles.length > 0) {
    const seenProfileUrls = new Set(
      typeof basics.url === 'string' && basics.url.trim()
        ? [basics.url.trim()]
        : [],
    );
    for (const p of profiles) {
      if (p.network && p.url && !seenProfileUrls.has(p.url)) {
        contacts.push(`[${p.network}](${p.url})`);
        seenProfileUrls.add(p.url);
      }
    }
  }

  if (contacts.length > 0) {
    md += `${contacts.join(' | ')}\n\n`;
  } else {
    md += `\n`;
  }

  if (typeof basics.summary === 'string' && basics.summary.trim()) {
    md += `## ${isEn ? 'Summary' : '个人简介'}\n\n`;
    md += `${basics.summary.trim()}\n\n`;
  }

  // Work Experience
  if (work.length > 0) {
    md += `## ${isEn ? 'Work Experience' : '工作经历'}\n\n`;
    for (const w of work) {
      const dates = [w.startDate, w.endDate].filter(Boolean).join(' – ');
      const sub = [w.position, dates].filter(Boolean).join(' | ');
      md += `### ${w.name}${sub ? ` | ${sub}` : ''}\n`;
      if (w.summary) {
        md += `- ${w.summary}\n`;
      }
      const highlights = stringArray(w.highlights);
      if (highlights.length > 0) {
        for (const h of highlights) {
          md += `- ${h}\n`;
        }
      }
      md += `\n`;
    }
  }

  // Projects
  if (projects.length > 0) {
    md += `## ${isEn ? 'Projects' : '项目经历'}\n\n`;
    for (const p of projects) {
      const dates = [p.startDate, p.endDate].filter(Boolean).join(' – ');
      const sub = [p.description, dates].filter(Boolean).join(' | ');
      md += `### ${p.name}${sub ? ` | ${sub}` : ''}\n`;
      const highlights = stringArray(p.highlights);
      if (highlights.length > 0) {
        for (const h of highlights) {
          md += `- ${h}\n`;
        }
      }
      md += `\n`;
    }
  }

  // Education
  if (education.length > 0) {
    md += `## ${isEn ? 'Education' : '教育背景'}\n\n`;
    for (const e of education) {
      const dates = [e.startDate, e.endDate].filter(Boolean).join(' – ');
      const sub = [e.studyType, e.area, dates].filter(Boolean).join(' | ');
      md += `### ${e.institution}${sub ? ` | ${sub}` : ''}\n`;
      const courses = stringArray(e.courses);
      if (courses.length > 0) {
        for (const c of courses) {
          md += `- ${c}\n`;
        }
      }
      md += `\n`;
    }
  }

  // Skills
  if (skills.length > 0) {
    md += `## ${isEn ? 'Skills' : '专业技能'}\n\n`;
    for (const s of skills) {
      const keywords = stringArray(s.keywords);
      if (keywords.length > 0) {
        md += `- **${s.name}**: ${keywords.join(', ')}\n`;
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

