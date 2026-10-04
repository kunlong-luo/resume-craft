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

function resolveNamedSectionParts(
  org: string | undefined,
  role: string | undefined,
  kind: 'award' | 'certificate' | 'publication',
): { name: string; issuer?: string } {
  const primary = stripMarkdownFormatting(org || '');
  const secondary = stripMarkdownFormatting(role || '');
  if (!secondary) return { name: primary };

  if (kind === 'publication') {
    const publisherPattern =
      /(?:\bacm\b|\bieee\b|springer|elsevier|journal|press|conference|transactions|review|magazine|出版社|期刊|会议|学报)/i;
    const primaryLooksLikePublisher = publisherPattern.test(primary);
    const secondaryLooksLikePublisher = publisherPattern.test(secondary);

    if (primaryLooksLikePublisher && !secondaryLooksLikePublisher) {
      return { name: secondary, issuer: primary || undefined };
    }

    return { name: primary, issuer: secondary || undefined };
  }

  const secondaryLooksLikeTitle =
    kind === 'award'
      ? /(?:award|honou?r|prize|medal|winner|荣誉|奖|表彰)/i.test(secondary)
      : /(?:certif|certificate|credential|licen[cs]e|architect|associate|professional|specialty|expert|认证|证书|资质|资格)/i.test(secondary);
  const primaryLooksLikeTitle =
    kind === 'award'
      ? /(?:award|honou?r|prize|medal|winner|荣誉|奖|表彰)/i.test(primary)
      : /(?:certif|certificate|credential|licen[cs]e|architect|associate|professional|specialty|expert|认证|证书|资质|资格)/i.test(primary);

  if (secondaryLooksLikeTitle && !primaryLooksLikeTitle) {
    return { name: secondary, issuer: primary || undefined };
  }

  return { name: primary, issuer: secondary || undefined };
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
  awards?: Array<{
    title: string;
    date?: string;
    awarder?: string;
    summary?: string;
  }>;
  certificates?: Array<{
    name: string;
    date?: string;
    issuer?: string;
    url?: string;
  }>;
  volunteer?: Array<{
    organization: string;
    position?: string;
    url?: string;
    startDate?: string;
    endDate?: string;
    summary?: string;
    highlights?: string[];
  }>;
  publications?: Array<{
    name: string;
    publisher?: string;
    releaseDate?: string;
    url?: string;
    summary?: string;
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

function parseSingleSocialLink(rawSocial: string | undefined): {
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
    const isHostOrSubdomain = (domain: string) =>
      host === domain || host.endsWith(`.${domain}`);

    if (!networkHint) {
      if (isHostOrSubdomain('github.com')) networkHint = 'GitHub';
      else if (isHostOrSubdomain('linkedin.com')) networkHint = 'LinkedIn';
      else if (isHostOrSubdomain('gitlab.com')) networkHint = 'GitLab';
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

function parseSocialLinks(rawSocial: string | undefined): Array<{
  url: string;
  network: string;
  username: string;
}> {
  if (!rawSocial?.trim()) return [];

  const candidates = rawSocial
    .split(/\s*[·|｜]\s*/)
    .map((value) => value.trim())
    .filter(Boolean);

  const links: Array<{ url: string; network: string; username: string }> = [];
  const seenUrls = new Set<string>();

  for (const candidate of candidates) {
    const parsed = parseSingleSocialLink(candidate);
    if (!parsed || seenUrls.has(parsed.url)) continue;
    seenUrls.add(parsed.url);
    links.push(parsed);
  }

  return links;
}

/**
 * Convert Markdown resume into standard JSON Resume format.
 */
export function exportToJsonResume(
  markdown: string,
  settings: ResumeSettings
): JsonResumeStandard {
  const formModel = parseMarkdownToForm(markdown);
  const socialLinks = parseSocialLinks(formModel.social);
  const primarySocial = socialLinks[0];
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
    awards: [],
    certificates: [],
    volunteer: [],
    publications: [],
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

  if (socialLinks.length > 0) {
    json.basics.profiles?.push(...socialLinks);
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
      titleLower.includes('volunteer') ||
      titleLower.includes('volunteering') ||
      titleLower.includes('志愿') ||
      titleLower.includes('公益')
    ) {
      sec.items.forEach((item) => {
        const { startDate, endDate } = splitResumeDateRange(item.time);
        const highlights = (item.content || '')
          .split('\n')
          .map((line) =>
            stripMarkdownFormatting(
              line.trim().replace(/^[•⁃－—–·●▪■◆\-*+]\s*/, ''),
            ),
          )
          .filter(Boolean);

        json.volunteer?.push({
          organization: stripMarkdownFormatting(item.org || ''),
          position: stripMarkdownFormatting(item.role || '') || undefined,
          startDate,
          endDate,
          highlights: highlights.length > 0 ? highlights : undefined,
        });
      });
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
        const courses = (item.courses || '')
          .split(/[,，、|\n]/)
          .map((value) => value.trim())
          .filter(Boolean);

        json.education?.push({
          institution: item.org || '',
          studyType: item.degree || undefined,
          area: item.role || undefined,
          startDate,
          endDate,
          score: item.gpa?.trim() || undefined,
          courses: courses.length > 0 ? courses : undefined,
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
      titleLower.includes('publication') ||
      titleLower.includes('paper') ||
      titleLower.includes('论文') ||
      titleLower.includes('发表') ||
      titleLower.includes('出版')
    ) {
      if (sec.type === 'text' && sec.textValue) {
        sec.textValue
          .split('\n')
          .map((line) =>
            stripMarkdownFormatting(
              line.trim().replace(/^[•⁃－—–·●▪■◆\-*+]\s*/, ''),
            ),
          )
          .filter(Boolean)
          .forEach((name) => {
            json.publications?.push({ name });
          });
      } else {
        sec.items.forEach((item) => {
          const { startDate, endDate } = splitResumeDateRange(item.time);
          const { name, issuer: publisher } = resolveNamedSectionParts(
            item.org,
            item.role,
            'publication',
          );
          const publicationUrl = (item.content || '').match(/https?:\/\/[^\s)]+/i)?.[0];
          const summary = (item.content || '')
            .split('\n')
            .filter((line) => !publicationUrl || !line.includes(publicationUrl))
            .map((line) =>
              stripMarkdownFormatting(
                line.trim().replace(/^[•⁃－—–·●▪■◆\-*+]\s*/, ''),
              ),
            )
            .filter(Boolean)
            .join('\n');

          json.publications?.push({
            name,
            publisher,
            releaseDate: endDate || startDate,
            url: publicationUrl,
            summary: summary || undefined,
          });
        });
      }
    } else if (
      titleLower.includes('award') ||
      titleLower.includes('honor') ||
      titleLower.includes('honour') ||
      titleLower.includes('荣誉') ||
      titleLower.includes('获奖')
    ) {
      if (sec.type === 'text' && sec.textValue) {
        sec.textValue
          .split('\n')
          .map((line) =>
            stripMarkdownFormatting(
              line.trim().replace(/^[•⁃－—–·●▪■◆\-*+]\s*/, ''),
            ),
          )
          .filter(Boolean)
          .forEach((title) => {
            json.awards?.push({ title });
          });
      } else {
        sec.items.forEach((item) => {
          const { startDate, endDate } = splitResumeDateRange(item.time);
          const { name: title, issuer: awarder } = resolveNamedSectionParts(
            item.org,
            item.role,
            'award',
          );
          const summary = (item.content || '')
            .split('\n')
            .map((line) =>
              stripMarkdownFormatting(
                line.trim().replace(/^[•⁃－—–·●▪■◆\-*+]\s*/, ''),
              ),
            )
            .filter(Boolean)
            .join('\n');

          json.awards?.push({
            title,
            awarder,
            date: endDate || startDate,
            summary: summary || undefined,
          });
        });
      }
    } else if (
      titleLower.includes('certif') ||
      titleLower.includes('certificate') ||
      titleLower.includes('license') ||
      titleLower.includes('licence') ||
      titleLower.includes('证书') ||
      titleLower.includes('认证') ||
      titleLower.includes('资质')
    ) {
      if (sec.type === 'text' && sec.textValue) {
        sec.textValue
          .split('\n')
          .map((line) =>
            stripMarkdownFormatting(
              line.trim().replace(/^[•⁃－—–·●▪■◆\-*+]\s*/, ''),
            ),
          )
          .filter(Boolean)
          .forEach((name) => {
            json.certificates?.push({ name });
          });
      } else {
        sec.items.forEach((item) => {
          const { startDate, endDate } = splitResumeDateRange(item.time);
          const { name, issuer } = resolveNamedSectionParts(
            item.org,
            item.role,
            'certificate',
          );
          const certificateUrl = (item.content || '').match(/https?:\/\/[^\s)]+/i)?.[0];

          json.certificates?.push({
            name,
            issuer,
            date: endDate || startDate,
            url: certificateUrl,
          });
        });
      }
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
  const stringValue = (value: unknown): string =>
    typeof value === 'string' ? value.trim() : '';
  const httpUrlValue = (value: unknown): string => {
    const rawUrl = stringValue(value);
    if (!rawUrl) return '';
    try {
      const parsed = new URL(rawUrl);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
        ? parsed.toString()
        : '';
    } catch {
      return '';
    }
  };
  const stringArray = (value: unknown): string[] =>
    Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

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
  const awards = Array.isArray(raw.awards)
    ? raw.awards.filter(isRecord) as unknown as NonNullable<JsonResumeStandard['awards']>
    : [];
  const certificates = Array.isArray(raw.certificates)
    ? raw.certificates.filter(isRecord) as unknown as NonNullable<JsonResumeStandard['certificates']>
    : [];
  const volunteer = Array.isArray(raw.volunteer)
    ? raw.volunteer.filter(isRecord) as unknown as NonNullable<JsonResumeStandard['volunteer']>
    : [];
  const publications = Array.isArray(raw.publications)
    ? raw.publications.filter(isRecord) as unknown as NonNullable<JsonResumeStandard['publications']>
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
      ...awards.flatMap((item) => [
        item.title,
        item.awarder,
        item.summary,
      ]),
      ...certificates.flatMap((item) => [
        item.name,
        item.issuer,
      ]),
      ...volunteer.flatMap((item) => [
        item.organization,
        item.position,
        item.summary,
        ...stringArray(item.highlights),
      ]),
      ...publications.flatMap((item) => [
        item.name,
        item.publisher,
        item.summary,
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
  const basicsName = stringValue(basics.name);
  const basicsLabel = stringValue(basics.label);
  const basicsPhone = stringValue(basics.phone);
  const basicsEmail = stringValue(basics.email);
  const basicsUrl = httpUrlValue(basics.url);
  const basicsSummary = stringValue(basics.summary);
  const locationCity = stringValue(location?.city);

  let md = `# ${basicsName || (isEn ? 'Candidate Name' : '求职者姓名')}\n`;

  if (basicsLabel) {
    md += `> **${basicsLabel}**\n`;
  }

  const contacts: string[] = [];
  if (basicsPhone) contacts.push(basicsPhone);
  if (basicsEmail) contacts.push(basicsEmail);
  if (locationCity) contacts.push(locationCity);
  if (basicsUrl) contacts.push(`[Website](${basicsUrl})`);

  if (profiles.length > 0) {
    const seenProfileUrls = new Set(basicsUrl ? [basicsUrl] : []);
    for (const p of profiles) {
      const network = stringValue(p.network);
      const url = httpUrlValue(p.url);
      if (network && url && !seenProfileUrls.has(url)) {
        contacts.push(`[${network}](${url})`);
        seenProfileUrls.add(url);
      }
    }
  }

  if (contacts.length > 0) {
    md += `${contacts.join(' | ')}\n\n`;
  } else {
    md += `\n`;
  }

  if (basicsSummary) {
    md += `## ${isEn ? 'Summary' : '个人简介'}\n\n`;
    md += `${basicsSummary}\n\n`;
  }

  // Work Experience
  if (work.length > 0) {
    md += `## ${isEn ? 'Work Experience' : '工作经历'}\n\n`;
    for (const w of work) {
      const name = stringValue(w.name) || (isEn ? 'Company' : '公司');
      const position = stringValue(w.position);
      const startDate = stringValue(w.startDate);
      const endDate = stringValue(w.endDate);
      const summary = stringValue(w.summary);
      const dates = [startDate, endDate].filter(Boolean).join(' – ');
      const sub = [position, dates].filter(Boolean).join(' | ');
      md += `### ${name}${sub ? ` | ${sub}` : ''}\n`;
      if (summary) {
        md += `- ${summary}\n`;
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

  // Volunteer Experience
  if (volunteer.length > 0) {
    md += `## ${isEn ? 'Volunteer Experience' : '志愿经历'}\n\n`;
    for (const item of volunteer) {
      const organization =
        stringValue(item.organization) || (isEn ? 'Organization' : '组织');
      const position = stringValue(item.position);
      const startDate = stringValue(item.startDate);
      const endDate = stringValue(item.endDate);
      const summary = stringValue(item.summary);
      const dates = [startDate, endDate].filter(Boolean).join(' – ');
      const sub = [position, dates].filter(Boolean).join(' | ');
      md += `### ${organization}${sub ? ` | ${sub}` : ''}\n`;
      if (summary) {
        md += `- ${summary}\n`;
      }
      for (const highlight of stringArray(item.highlights)) {
        md += `- ${highlight}\n`;
      }
      md += `\n`;
    }
  }

  // Projects
  if (projects.length > 0) {
    md += `## ${isEn ? 'Projects' : '项目经历'}\n\n`;
    for (const p of projects) {
      const name = stringValue(p.name) || (isEn ? 'Project' : '项目');
      const description = stringValue(p.description);
      const startDate = stringValue(p.startDate);
      const endDate = stringValue(p.endDate);
      const dates = [startDate, endDate].filter(Boolean).join(' – ');
      const sub = [description, dates].filter(Boolean).join(' | ');
      md += `### ${name}${sub ? ` | ${sub}` : ''}\n`;
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
      const institution = stringValue(e.institution) || (isEn ? 'Institution' : '学校');
      const studyType = stringValue(e.studyType);
      const area = stringValue(e.area);
      const startDate = stringValue(e.startDate);
      const endDate = stringValue(e.endDate);
      const score = stringValue(e.score);
      const dates = [startDate, endDate].filter(Boolean).join(' – ');
      const sub = [studyType, area, dates].filter(Boolean).join(' | ');
      md += `### ${institution}${sub ? ` | ${sub}` : ''}\n`;
      if (score) {
        md += isEn
          ? `- **GPA / Performance**: ${score}\n`
          : `- **在校表现**：${score}\n`;
      }
      const courses = stringArray(e.courses);
      if (courses.length > 0) {
        md += isEn
          ? `- **Core Courses**: ${courses.join(', ')}\n`
          : `- **主修课程**：${courses.join('、')}\n`;
      }
      md += `\n`;
    }
  }

  // Skills
  if (skills.length > 0) {
    md += `## ${isEn ? 'Skills' : '专业技能'}\n\n`;
    for (const s of skills) {
      const name = stringValue(s.name) || (isEn ? 'Skills' : '技能');
      const keywords = stringArray(s.keywords);
      if (keywords.length > 0) {
        md += `- **${name}**: ${keywords.join(', ')}\n`;
      } else if (stringValue(s.name)) {
        md += `- ${name}\n`;
      }
    }
    md += `\n`;
  }

  // Publications
  if (publications.length > 0) {
    md += `## ${isEn ? 'Publications' : '发表与出版'}\n\n`;
    for (const publication of publications) {
      const name = stringValue(publication.name);
      if (!name) continue;
      const publisher = stringValue(publication.publisher);
      const releaseDate = stringValue(publication.releaseDate);
      const url = httpUrlValue(publication.url);
      const summary = stringValue(publication.summary);
      const sub = [publisher, releaseDate].filter(Boolean).join(' | ');
      md += `### ${name}${sub ? ` | ${sub}` : ''}\n`;
      if (summary) {
        for (const line of summary.split('\n').map((value) => value.trim()).filter(Boolean)) {
          md += `- ${line}\n`;
        }
      }
      if (url) {
        md += `- [${isEn ? 'Publication' : '查看发表'}](${url})\n`;
      }
      md += `\n`;
    }
  }

  // Honors & Awards
  if (awards.length > 0) {
    md += `## ${isEn ? 'Honors & Awards' : '荣誉奖项'}\n\n`;
    for (const award of awards) {
      const title = stringValue(award.title);
      if (!title) continue;
      const awarder = stringValue(award.awarder);
      const date = stringValue(award.date);
      const summary = stringValue(award.summary);
      const sub = [awarder, date].filter(Boolean).join(' | ');
      md += `### ${title}${sub ? ` | ${sub}` : ''}\n`;
      if (summary) {
        for (const line of summary.split('\n').map((value) => value.trim()).filter(Boolean)) {
          md += `- ${line}\n`;
        }
      }
      md += `\n`;
    }
  }

  // Certifications
  if (certificates.length > 0) {
    md += `## ${isEn ? 'Certifications' : '资质证书'}\n\n`;
    for (const certificate of certificates) {
      const name = stringValue(certificate.name);
      if (!name) continue;
      const issuer = stringValue(certificate.issuer);
      const date = stringValue(certificate.date);
      const url = httpUrlValue(certificate.url);
      const sub = [issuer, date].filter(Boolean).join(' | ');
      md += `### ${name}${sub ? ` | ${sub}` : ''}\n`;
      if (url) {
        md += `- [${isEn ? 'Credential' : '证书链接'}](${url})\n`;
      }
      md += `\n`;
    }
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

