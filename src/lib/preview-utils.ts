import { ResumeSettings } from '../types';
import { COMPREHENSIVE_DATE_REGEX } from './date-parser';

export const THEME_MAP = {
  blue: {
    accentText: 'text-blue-600 hover:text-blue-800',
    h2Accent: 'before:bg-blue-600',
    liAccent: 'before:bg-blue-500/50',
    blockquoteAccent: 'border-l-blue-600/20 bg-blue-50/50',
    badgeBg: 'bg-blue-50/60 border-blue-100/50 text-blue-700',
    iconColor: 'text-blue-500',
    topAccentColor: 'bg-blue-600',
    h2BadgeBg: 'bg-blue-50/40',
    h2BadgeBorder: 'border-l-[3.5px] border-blue-600',
    h2BadgeText: 'text-blue-850',
  },
  emerald: {
    accentText: 'text-emerald-600 hover:text-emerald-800',
    h2Accent: 'before:bg-emerald-600',
    liAccent: 'before:bg-emerald-500/50',
    blockquoteAccent: 'border-l-emerald-600/20 bg-emerald-50/50',
    badgeBg: 'bg-emerald-50/60 border-emerald-100/50 text-emerald-700',
    iconColor: 'text-emerald-500',
    topAccentColor: 'bg-emerald-600',
    h2BadgeBg: 'bg-emerald-50/40',
    h2BadgeBorder: 'border-l-[3.5px] border-emerald-600',
    h2BadgeText: 'text-emerald-850',
  },
  slate: {
    accentText: 'text-slate-700 hover:text-slate-900',
    h2Accent: 'before:bg-slate-700',
    liAccent: 'before:bg-slate-500/50',
    blockquoteAccent: 'border-l-slate-700/20 bg-slate-50/50',
    badgeBg: 'bg-slate-50 border-slate-200/50 text-slate-700',
    iconColor: 'text-slate-600',
    topAccentColor: 'bg-slate-700',
    h2BadgeBg: 'bg-slate-50/80',
    h2BadgeBorder: 'border-l-[3.5px] border-slate-700',
    h2BadgeText: 'text-slate-850',
  },
  indigo: {
    accentText: 'text-indigo-600 hover:text-indigo-800',
    h2Accent: 'before:bg-indigo-600',
    liAccent: 'before:bg-indigo-500/50',
    blockquoteAccent: 'border-l-indigo-600/20 bg-indigo-50/50',
    badgeBg: 'bg-indigo-50/60 border-indigo-100/50 text-indigo-700',
    iconColor: 'text-indigo-500',
    topAccentColor: 'bg-indigo-600',
    h2BadgeBg: 'bg-indigo-50/40',
    h2BadgeBorder: 'border-l-[3.5px] border-indigo-600',
    h2BadgeText: 'text-indigo-850',
  },
  crimson: {
    accentText: 'text-rose-600 hover:text-rose-800',
    h2Accent: 'before:bg-rose-600',
    liAccent: 'before:bg-rose-500/50',
    blockquoteAccent: 'border-l-rose-600/20 bg-rose-50/50',
    badgeBg: 'bg-rose-50/60 border-rose-100/50 text-rose-700',
    iconColor: 'text-rose-500',
    topAccentColor: 'bg-rose-600',
    h2BadgeBg: 'bg-rose-50/40',
    h2BadgeBorder: 'border-l-[3.5px] border-rose-600',
    h2BadgeText: 'text-rose-850',
  },
  amber: {
    accentText: 'text-amber-700 hover:text-amber-900',
    h2Accent: 'before:bg-amber-700',
    liAccent: 'before:bg-amber-500/50',
    blockquoteAccent: 'border-l-amber-700/20 bg-amber-50/50',
    badgeBg: 'bg-amber-50/60 border-amber-200/50 text-amber-800',
    iconColor: 'text-amber-600',
    topAccentColor: 'bg-amber-600',
    h2BadgeBg: 'bg-amber-50/40',
    h2BadgeBorder: 'border-l-[3.5px] border-amber-600',
    h2BadgeText: 'text-amber-900',
  },
  teal: {
    accentText: 'text-teal-600 hover:text-teal-800',
    h2Accent: 'before:bg-teal-600',
    liAccent: 'before:bg-teal-500/50',
    blockquoteAccent: 'border-l-teal-600/20 bg-teal-50/50',
    badgeBg: 'bg-teal-50/60 border-teal-100/50 text-teal-700',
    iconColor: 'text-teal-500',
    topAccentColor: 'bg-teal-600',
    h2BadgeBg: 'bg-teal-50/40',
    h2BadgeBorder: 'border-l-[3.5px] border-teal-600',
    h2BadgeText: 'text-teal-900',
  },
  bronze: {
    accentText: 'text-[rgb(141,96,55)] hover:text-[rgb(115,75,40)]',
    h2Accent: 'before:bg-[rgb(141,96,55)]',
    liAccent: 'before:bg-[rgb(141,96,55)]/50',
    blockquoteAccent: 'border-l-[rgb(141,96,55)]/20 bg-[rgb(253,249,245)]',
    badgeBg: 'bg-[rgb(253,249,245)] border-[rgb(243,230,215)] text-[rgb(141,96,55)]',
    iconColor: 'text-[rgb(141,96,55)]',
    topAccentColor: 'bg-[rgb(141,96,55)]',
    h2BadgeBg: 'bg-[rgb(253,249,245)]',
    h2BadgeBorder: 'border-l-[3.5px] border-[rgb(141,96,55)]',
    h2BadgeText: 'text-[rgb(115,75,40)]',
  },
  custom: {
    accentText: 'custom-accent-text',
    h2Accent: 'custom-h2-accent',
    liAccent: 'custom-li-accent',
    blockquoteAccent: 'custom-blockquote-accent',
    badgeBg: 'custom-badge-bg',
    iconColor: 'custom-icon-color',
    topAccentColor: 'custom-top-accent',
    h2BadgeBg: 'custom-h2-badge-bg',
    h2BadgeBorder: 'custom-h2-badge-border',
    h2BadgeText: 'custom-h2-badge-text',
  },
};

export const FONT_FAMILY_CLASSES = {
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono text-[12px]',
};

// Helper parser to intelligently layout the resume header
export function parseResumeHeader(markdown: string) {
  const lines = markdown.split('\n');
  let name = '';
  let titles: string[] = [];
  let contacts: string[] = [];
  let experience = '';
  let h1Index = -1;
  let foundH1 = false;

  // Locate the name (H1 or first header)
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i].trim();
    if (/^#\s+[^\#]/.test(line) || /^#[^\#\s]+/.test(line)) {
      name = line.replace(/^#+\s*/, '').replace(/[\*\_]+/g, '').trim();
      foundH1 = true;
      h1Index = i;
      break;
    }
  }

  if (foundH1) {
    let bodyStartIndex = h1Index + 1;
    const expParts: string[] = [];

    // Inspect next non-empty lines for profile information until first H2
    for (let i = h1Index + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('##')) {
        bodyStartIndex = i;
        break;
      }
      if (line === '' || line === '---' || line === '***' || line === '___') {
        bodyStartIndex = i + 1;
        continue;
      }

      // Safely strip bullet points (- , * , + , • , 1. ) WITHOUT stripping digits of phone numbers!
      let stripped = line
        .replace(/^[-*+•●▪■◆]\s+/, '')
        .replace(/^\d{1,2}[\.\)）]\s+/, '')
        .trim();

      // Strip outer wrapping markdown bold/italic (**...** or *...*)
      if ((stripped.startsWith('**') && stripped.endsWith('**')) || (stripped.startsWith('__') && stripped.endsWith('__'))) {
        stripped = stripped.slice(2, -2).trim();
      } else if ((stripped.startsWith('*') && stripped.endsWith('*')) || (stripped.startsWith('_') && stripped.endsWith('_'))) {
        stripped = stripped.slice(1, -1).trim();
      }

      const lower = stripped.toLowerCase();
      // 1. Check if job target / intention line
      const isTargetJob = /^(?:\*\*|\*|)(?:求职方向|求职意向|求职目标|目标岗位|应聘职位|应聘岗位|意向岗位)[:：\s]*/.test(stripped) ||
        (titles.length === 0 && !line.startsWith('- ') && !line.startsWith('* ') && (lower.includes('运营') || lower.includes('工程师') || lower.includes('开发') || lower.includes('架构师') || lower.includes('总监') || lower.includes('经理') || lower.includes('主管') || lower.includes('专员') || lower.includes('设计师') || lower.includes('产品') || lower.includes('developer') || lower.includes('engineer') || lower.includes('manager')));

      // 2. Check if contact line (phone, email, social link, etc.)
      const hasDateRange = COMPREHENSIVE_DATE_REGEX.test(stripped);
      const isPhoneLike = !hasDateRange && (
        /^(?:电话|手机|手机号|手机号码|联系方式|联系电话|Tel|Mobile|Phone|Contact)[:：\s-]*[+0-9\s\-()]{7,25}/i.test(stripped) ||
        (/(?:\+?86[\s-]?)?1[3-9](?:[\s-]?\d){9}/.test(stripped) && !/(?:经验|运营|负责|工作|年限|学校|学历|能力)/.test(stripped)) ||
        (/^\+?[\d\s\-\(\)]{7,20}$/.test(stripped))
      );

      const isContact = lower.includes('@') ||
        isPhoneLike ||
        /^(?:电话|手机|手机号|手机号码|邮箱|微信|wechat|tel|phone|mobile|email|github|gitee|linkedin|blog|博客|网站|主页)[:：\s]/i.test(stripped) ||
        lower.includes('github') || lower.includes('gitee') || lower.includes('wechat') || lower.includes('微信') || lower.includes('linkedin') || lower.includes('领英') ||
        lower.includes('http://') || lower.includes('https://') || lower.includes('www.');

      // 3. Check if experience / background / status / degree / english ability
      const isExpOrSkill = /^(?:经验|工作经验|工作年限|经验年限|年限|工作|在职|离职|到岗|年龄|岁|学历|学位|本科|硕士|大专|英语能力|英语|语言|资格)[:：\s]*/.test(stripped) ||
        /(?:经验|年工作|在校|大学|学院|本科|硕士|大专|英语|CET|六级|四级)/i.test(stripped) ||
        /(?:\d+\s*(?:years?|yrs?)\s*(?:of\s+)?experience|student\s*\/\s*new graduate|new grad(?:uate)?|\b(?:associate|bachelor|master|phd)\b|\b(?:employed|unemployed)\b|open to offers|not looking|looking for internship)/i.test(stripped);

      if (isTargetJob) {
        const cleaned = stripped.replace(/[\*\_]+/g, '').replace(/^(?:求职方向|求职意向|求职目标|目标岗位|应聘职位|应聘岗位|意向岗位)[:：\s]*/, '').trim();
        const parts = cleaned.split(/[\/|｜·•,，]|\s{2,}/).map(t => t.trim()).filter(Boolean);
        if (parts.length > 0) {
          titles.push(...parts);
        }
        bodyStartIndex = i + 1;
      } else if (isContact) {
        const contactSeparatorRegex = /[·•●▪■◆・|｜;；\t]|\s{2,}|\s+[\/／]\s+/;
        const subContacts = stripped.split(contactSeparatorRegex).map(c => c.replace(/[\*\_]+/g, '').trim()).filter(Boolean);
        contacts.push(...subContacts);
        bodyStartIndex = i + 1;
      } else if (isExpOrSkill) {
        const cleanExp = stripped.replace(/[\*\_]+/g, '').trim();
        expParts.push(cleanExp);
        bodyStartIndex = i + 1;
      } else {
        if (titles.length === 0 && stripped.length < 60) {
          const cleaned = stripped.replace(/[\*\_]+/g, '').trim();
          titles = cleaned.split(/[\/|｜·•,，]|\s{2,}/).map(t => t.trim()).filter(Boolean);
          bodyStartIndex = i + 1;
        } else {
          break;
        }
      }
    }

    if (expParts.length > 0) {
      experience = expParts.join(' ｜ ');
    }

    // Skip any trailing empty lines or dividers (like `---`) between header and body start
    while (bodyStartIndex < lines.length) {
      const nextLine = lines[bodyStartIndex].trim();
      if (nextLine === '' || nextLine === '---' || nextLine === '***' || nextLine === '___') {
        bodyStartIndex++;
      } else {
        break;
      }
    }

    const bodyMarkdown = lines.slice(bodyStartIndex).join('\n');
    return {
      hasHeader: true,
      name,
      titles,
      contacts,
      experience,
      bodyMarkdown,
    };
  }

  return {
    hasHeader: false,
    name: '',
    titles: [],
    contacts: [],
    experience: '',
    bodyMarkdown: markdown,
  };
}

export function cleanMarkdown(markdown: string): string {
  if (!markdown) return '';
  let processed = markdown;
  // Fix bold with space after opening asterisks, e.g., "** 10+**" -> "**10+**" (limited to single line)
  processed = processed.replace(/\*\*\s+([^\*\n]+?)\s*\*\*/g, '**$1**');
  // Fix bold with space before closing asterisks, e.g., "**10+ **" -> "**10+**" (limited to single line)
  processed = processed.replace(/\*\*\s*([^\*\n]+?)\s+\*\*/g, '**$1**');
  // Fix italic with space after/before asterisks, e.g., "* text*" -> "*text*" or "*text *" -> "*text*" (limited to single line)
  processed = processed.replace(/(?<!\*)\*\s+([^\*\n]+?)\s*\*(?!\*)/g, '*$1*');
  processed = processed.replace(/(?<!\*)\*\s*([^\*\n]+?)\s+\*(?!\*)/g, '*$1*');

  // Ensure bold (**...**) has surrounding spaces if adjacent to non-whitespace characters (essential for CJK/Chinese text parsing, limited to single line)
  processed = processed.replace(/(?<!\*)\*\*([^\*\n]+?)\*\*(?!\*)/g, (match, content, offset, string) => {
    const charBefore = offset > 0 ? string[offset - 1] : '';
    const matchEndIndex = offset + match.length;
    const charAfter = matchEndIndex < string.length ? string[matchEndIndex] : '';

    const needSpaceBefore = charBefore && !/\s/.test(charBefore);
    const needSpaceAfter = charAfter && !/\s/.test(charAfter);

    return `${needSpaceBefore ? ' ' : ''}**${content}**${needSpaceAfter ? ' ' : ''}`;
  });

  // Ensure italic (*...*) has surrounding spaces if adjacent to non-whitespace characters (limited to single line)
  processed = processed.replace(/(?<!\*)\*([^\*\n]+?)\*(?!\*)/g, (match, content, offset, string) => {
    const charBefore = offset > 0 ? string[offset - 1] : '';
    const matchEndIndex = offset + match.length;
    const charAfter = matchEndIndex < string.length ? string[matchEndIndex] : '';

    const needSpaceBefore = charBefore && !/\s/.test(charBefore);
    const needSpaceAfter = charAfter && !/\s/.test(charAfter);

    return `${needSpaceBefore ? ' ' : ''}*${content}*${needSpaceAfter ? ' ' : ''}`;
  });

  // Detect and split lines that contain bullet points or list markers in the middle of a single line
  // e.g., "Title - Bullet content" -> "Title\n- Bullet content"
  // Preceded by space, Chinese character, or asterisks. Followed by a Chinese character or a word/letter (excluding numeric date ranges).
  // Note: We only split on dash-like markers (-, –, —, －) here to prevent breaking inline lists separated by dots (·, •, ●, etc.) or contact details.
  // CRITICAL FIX: Must NOT split if preceded by a date or followed by ongoing date terms (至今, 现在, 目前, present, etc.)
  // or English month names (Jan, Feb, Mar, etc.)
  processed = processed.replace(
    /(?<!\n|^)(?<!\b(?:19|20)\d{2}(?:[.\-/年]\d{1,2}(?:[月.\-/]\d{1,2})?)?\s*)(?<!\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.,]?\s*(?:19|20)\d{2}\s*)(?<=\s|[\u4e00-\u9fa5]|\*\*\*|\*\*|\*)\s*[-–—－]\s*(?!\s*(?:至今|现在|目前|present|Present|now|current|毕业|\b(?:19|20)\d{2}|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)))(?=[\u4e00-\u9fa5]|[a-zA-Z]{2,})/gi,
    '\n- '
  );

  // Ensure list items immediately following normal text lines are separated by a blank line 
  // to prevent them from merging into a single line in Markdown rendering.
  // Also normalize any non-standard bullet characters (like •, ⁃, －, etc.) or missing spaces after bullets.
  const lines = processed.split('\n');
  const adjustedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    let isList = false;
    let normalizedLine = line;
    
    // 1. Check for standard markdown list markers
    const standardUnorderedMatch = trimmed.match(/^([-\*\+])\s+(.*)/);
    const standardOrderedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    
    if (standardUnorderedMatch) {
      if (!trimmed.startsWith('---') && !trimmed.startsWith('***') && !trimmed.startsWith('___')) {
        isList = true;
      }
    } else if (standardOrderedMatch) {
      isList = true;
    } else {
      // 2. Check for non-standard bullets or missing space after standard ones
      const anyBulletMatch = trimmed.match(/^([•⁃－—–·●▪■◆\-\*\+])\s*(.*)/);
      if (anyBulletMatch) {
        const bullet = anyBulletMatch[1];
        const content = anyBulletMatch[2];
        
        const isNegativeNumber = bullet === '-' && /^\d/.test(content);
        const isHr = (bullet === '-' || bullet === '*') && trimmed.replace(new RegExp('\\' + bullet, 'g'), '').trim() === '';
        const isBoldOrItalic = (bullet === '*' && (content.startsWith('*') || !content.includes('*')));
        
        if (!isNegativeNumber && !isHr && !isBoldOrItalic && content.trim() !== '') {
          isList = true;
          const leadingSpaces = line.match(/^(\s*)/)?.[1] || '';
          normalizedLine = `${leadingSpaces}- ${content}`;
        }
      }
    }
    
    // If it is a list item, check if we need to insert a blank line before it
    if (isList && i > 0) {
      const prevLine = adjustedLines[adjustedLines.length - 1];
      const prevTrimmed = prevLine ? prevLine.trim() : '';
      
      if (prevTrimmed !== '') {
        const isPrevList = /^(?:[-\*\+]\s|\d+\.\s)/.test(prevTrimmed);
        const isPrevHeading = prevTrimmed.startsWith('#');
        const isPrevBlockquote = prevTrimmed.startsWith('>');
        const isPrevHr = /^(?:-{3,}|\*{3,}|\_{3,})$/.test(prevTrimmed);
        
        if (!isPrevList && !isPrevHeading && !isPrevBlockquote && !isPrevHr) {
          adjustedLines.push('');
        }
      }
    }
    
    adjustedLines.push(normalizedLine);
  }
  processed = adjustedLines.join('\n');

  return processed;
}

export const getH2ClassName = (
  fontSize: 'compact' | 'standard' | 'relaxed',
  theme: any,
  style: 'accent-line' | 'modern-badge' | 'minimal-clean' | 'academic-line' | 'bracket-tag' = 'accent-line'
) => {
  const sizeMap = {
    compact: {
      text: 'text-[12px] tracking-widest mt-4 mb-2.5 pb-1',
      bottomLine: 'before:w-8 before:h-[1.5px]',
      badgePadding: 'px-2 py-0.5 rounded'
    },
    standard: {
      text: 'text-[13.5px] tracking-widest mt-6 mb-3 pb-1.5',
      bottomLine: 'before:w-10 before:h-[2px]',
      badgePadding: 'px-2.5 py-1 rounded'
    },
    relaxed: {
      text: 'text-[15px] tracking-widest mt-8 mb-4 pb-2',
      bottomLine: 'before:w-12 before:h-[2px]',
      badgePadding: 'px-3 py-1.5 rounded'
    }
  }[fontSize];

  const base = `font-bold text-gray-955 uppercase break-after-avoid ${sizeMap.text}`;

  if (style === 'accent-line') {
    return `${base} border-b border-gray-200 relative before:content-[''] before:absolute before:left-0 before:bottom-[-1px] ${sizeMap.bottomLine} ${theme.h2Accent}`;
  } else if (style === 'modern-badge') {
    return `${base} ${theme.h2BadgeBg} ${theme.h2BadgeBorder} ${theme.h2BadgeText} ${sizeMap.badgePadding} block w-full`;
  } else if (style === 'academic-line') {
    return `${base} border-b-2 border-t border-gray-800/80 py-1 tracking-wider text-center font-serif`;
  } else if (style === 'bracket-tag') {
    return `${base} flex items-center gap-1.5 before:content-['['] before:text-gray-400 after:content-[']'] after:text-gray-400 border-b border-dashed border-gray-200`;
  } else {
    // minimal-clean
    return `${base} border-b border-gray-200`;
  }
};

export function parseH2Sections(md: string) {
  const lines = md.split('\n');
  const sectionsList: { title: string; rawTitleLine: string; content: string }[] = [];
  
  let currentTitle = '';
  let currentRawLine = '';
  let currentLinesList: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      if (currentRawLine || currentLinesList.length > 0) {
        sectionsList.push({
          title: currentTitle,
          rawTitleLine: currentRawLine,
          content: currentLinesList.join('\n')
        });
      }
      currentRawLine = line;
      currentTitle = trimmed.replace(/^##\s+/, '');
      currentLinesList = [];
    } else {
      currentLinesList.push(line);
    }
  }

  if (currentRawLine || currentLinesList.length > 0) {
    sectionsList.push({
      title: currentTitle,
      rawTitleLine: currentRawLine,
      content: currentLinesList.join('\n')
    });
  }
  return sectionsList;
}

export function smartAutoFit(settings: ResumeSettings, onChangeSettings: (key: keyof ResumeSettings, value: any) => void) {
  let adjusted = false;

  if (settings.margin === 'relaxed') {
    onChangeSettings('margin', 'standard');
    adjusted = true;
  } else if (settings.margin === 'standard') {
    onChangeSettings('margin', 'compact');
    adjusted = true;
  } else if (settings.blockGap > 0.8) {
    onChangeSettings('blockGap', Math.max(0.6, Number((settings.blockGap - 0.15).toFixed(2))));
    adjusted = true;
  } else if (settings.lineHeight > 1.45) {
    onChangeSettings('lineHeight', Math.max(1.35, Number((settings.lineHeight - 0.1).toFixed(2))));
    adjusted = true;
  } else if (settings.fontSize === 'relaxed') {
    onChangeSettings('fontSize', 'standard');
    adjusted = true;
  } else if (settings.fontSize === 'standard') {
    onChangeSettings('fontSize', 'compact');
    adjusted = true;
  } else if (settings.blockGap > 0.4) {
    onChangeSettings('blockGap', Math.max(0.3, Number((settings.blockGap - 0.1).toFixed(2))));
    adjusted = true;
  } else if (settings.lineHeight > 1.25) {
    onChangeSettings('lineHeight', Math.max(1.2, Number((settings.lineHeight - 0.05).toFixed(2))));
    adjusted = true;
  }

  if (!adjusted) {
    onChangeSettings('margin', 'compact');
    onChangeSettings('blockGap', 0.4);
    onChangeSettings('lineHeight', 1.3);
    onChangeSettings('fontSize', 'compact');
  }
}

export function getSizeClasses(fontSize: string, theme: any) {
  const map = {
    compact: {
      h1: 'text-2xl font-black text-gray-955 tracking-tight mb-2',
      h3: 'text-[12px] font-bold text-gray-950 mt-3 mb-1 break-after-avoid',
      p: 'text-[11.5px] text-gray-750 leading-[1.5] mb-1.5 text-justify break-inside-avoid',
      ul: 'list-none p-0 m-0 mb-2 space-y-0.5',
      ol: 'list-decimal list-outside ml-4 mb-2 text-[11.5px] text-gray-750',
      li: `text-[11.5px] text-gray-755 leading-[1.5] text-justify relative pl-3 before:content-[''] before:absolute before:left-0 before:top-[6px] before:w-1 before:h-1 ${theme.liAccent} before:rounded-full break-inside-avoid`,
      th: 'text-[11.5px] border-b-2 border-gray-100 py-1 pr-4 font-semibold text-gray-950 whitespace-nowrap',
      td: 'text-[11.5px] py-1.5 pr-4 text-gray-755 leading-[1.5]',
      table: 'w-full mb-2 break-inside-avoid',
      hr: 'my-4 border-gray-100',
    },
    standard: {
      h1: 'text-3xl font-black text-gray-955 tracking-tight mb-3',
      h3: 'text-[13px] font-bold text-gray-955 mt-4.5 mb-1 break-after-avoid',
      p: 'text-[12.5px] text-gray-750 leading-[1.65] mb-2 text-justify break-inside-avoid',
      ul: 'list-none p-0 m-0 mb-3 space-y-1',
      ol: 'list-decimal list-outside ml-4 mb-3 text-[12.5px] text-gray-755',
      li: `text-[12.5px] text-gray-755 leading-[1.65] text-justify relative pl-3.5 before:content-[''] before:absolute before:left-0 before:top-[7.5px] before:w-1 before:h-1 ${theme.liAccent} before:rounded-full break-inside-avoid`,
      th: 'text-[12.5px] border-b-2 border-gray-200 py-1.5 pr-4 font-semibold text-gray-955 whitespace-nowrap',
      td: 'text-[12.5px] py-2 pr-4 text-gray-755 leading-[1.65]',
      table: 'w-full mb-3 break-inside-avoid',
      hr: 'my-5 border-gray-100',
    },
    relaxed: {
      h1: 'text-4xl font-black text-gray-955 tracking-tight mb-4',
      h3: 'text-[14px] font-bold text-gray-955 mt-5.5 mb-1.5 break-after-avoid',
      p: 'text-[13.5px] text-gray-755 leading-[1.8] mb-3 text-justify break-inside-avoid',
      ul: 'list-none p-0 m-0 mb-4 space-y-1.5',
      ol: 'list-decimal list-outside ml-4 mb-4 text-[13.5px] text-gray-755',
      li: `text-[13.5px] text-gray-755 leading-[1.8] text-justify relative pl-4 before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-1 before:h-1 ${theme.liAccent} before:rounded-full break-inside-avoid`,
      th: 'text-[13.5px] border-b-2 border-gray-200 py-2 pr-4 font-semibold text-gray-955 whitespace-nowrap',
      td: 'text-[13.5px] py-2.5 pr-4 text-gray-755 leading-[1.8]',
      table: 'w-full mb-4 break-inside-avoid',
      hr: 'my-6 border-gray-100',
    }
  };
  return (map as any)[fontSize];
}

export interface BasicInfoItem {
  key: string;
  type: 'exp' | 'degree' | 'age' | 'location' | 'status' | 'other';
  raw: string;
  text: string;
  statusType?: 'available' | 'considering' | 'employed' | 'neutral';
}

export function isDegreeToken(s: string): boolean {
  const clean = s.trim();
  if (/^(?:最高学历|学历|学位)[:：\s]*/i.test(clean)) return true;
  if (/^(?:本科|学士|硕士|博士|大专|高职|专科|双学士|双学位|研究生|博士后|中专|高中|PhD|Ph\.D|Master|Bachelor|Associate)$/i.test(clean)) return true;
  return /(?:本科|学士|硕士|博士|大专|高职|专科|双学士|研究生|PhD|Master|Bachelor)/i.test(clean);
}

export function isStatusToken(s: string): boolean {
  const clean = s.trim();
  if (/^(?:求职状态|求职意向|状态)[:：\s]*/i.test(clean)) return true;
  return /(?:随时到岗|在职|离职|考虑机会|看机会|暂不考虑|急寻|找工作|寻实习|在校生-寻实习|月内到岗|一周内到岗|两周内到岗|open to work|actively looking|available|employed|unemployed|open to offers|not looking|immediate|looking for internship)/i.test(clean);
}

export function isLocationToken(s: string): boolean {
  const clean = s.trim();
  if (!clean) return false;
  if (/^(?:意向城市|期望城市|现居|现居地|所在城市|城市|常驻|期望工作地|工作地点|地点|location|city)[:：\s]*/i.test(clean)) {
    return true;
  }
  if (/(?:北京|上海|广州|深圳|杭州|成都|武汉|南京|西安|厦门|苏州|天津|重庆|长沙|青岛|大连|宁波|郑州|合肥|无锡|福州|昆明|济南|佛山|东莞|珠海|南昌|贵阳|南宁|海口|三亚|长春|沈阳|哈尔滨|石家庄|太原|兰州|银川|西宁|乌鲁木齐|呼和浩特|拉萨|香港|澳门|台北|远程|全国|海外|硅谷|旧金山|西雅图|纽约|伦敦|东京|新加坡|多伦多|温哥华|悉尼|墨尔本|beijing|shanghai|shenzhen|hangzhou|guangzhou|remote)/i.test(clean)) {
    return true;
  }
  if (/^[\u4e00-\u9fa5\w\s/、·•\-]+[市省区县]$/.test(clean)) {
    return true;
  }
  return false;
}

export function parseBasicInfoMetadata(rawExp: string, lang: 'zh' | 'en' = 'zh'): BasicInfoItem[] {
  if (!rawExp || !rawExp.trim()) return [];

  const trimmed = rawExp.trim();

  // 1. Identify segments by primary separator
  let rawSegments: string[] = [];

  if (/[|｜]/.test(trimmed)) {
    rawSegments = trimmed.split(/[|｜]/).map(s => s.trim()).filter(Boolean);
  } else if (/[•●▪]/.test(trimmed)) {
    rawSegments = trimmed.split(/[•●▪]/).map(s => s.trim()).filter(Boolean);
  } else if (/\s{2,}/.test(trimmed)) {
    rawSegments = trimmed.split(/\s{2,}/).map(s => s.trim()).filter(Boolean);
  } else if (trimmed.includes('·')) {
    rawSegments = trimmed.split(/\s*·\s*/).map(s => s.trim()).filter(Boolean);
  } else {
    // Space separated, like "本科 9 杭州 远程 随时到岗"
    rawSegments = trimmed.split(/\s+/).map(s => s.trim()).filter(Boolean);
  }

  // Pre-process adjacent location words: e.g. ["杭州", "远程"] or ["深圳", "广州"]
  const mergedSegments: string[] = [];
  for (let i = 0; i < rawSegments.length; i++) {
    const cur = rawSegments[i];
    const next = rawSegments[i + 1];
    if (isLocationToken(cur) && next && (next === '远程' || next === 'Remote' || isLocationToken(next)) && !isStatusToken(next)) {
      mergedSegments.push(`${cur} · ${next}`);
      i++; // skip next
    } else {
      mergedSegments.push(cur);
    }
  }

  // First pass to detect explicit experience or age
  let hasExperience = false;
  let hasAge = false;

  mergedSegments.forEach(seg => {
    if (/\d+\s*年|(?:工作|从业|全栈)?经验|应届|在校|student|grad/i.test(seg)) {
      hasExperience = true;
    }
    if (/岁|years?\s*old|生于|出生|age/i.test(seg) || /^(?:1[6-9]|[2-6]\d|70)$/.test(seg)) {
      hasAge = true;
    }
  });

  const items: BasicInfoItem[] = [];

  mergedSegments.forEach((seg, idx) => {
    const clean = seg.trim();
    if (!clean) return;

    // A. Degree
    if (isDegreeToken(clean)) {
      items.push({
        key: `degree-${idx}`,
        type: 'degree',
        raw: clean,
        text: clean.replace(/^(?:最高学历|学历|学位)[:：\s]*/i, ''),
      });
      return;
    }

    // B. Status
    if (isStatusToken(clean)) {
      let statusType: BasicInfoItem['statusType'] = 'neutral';
      if (/随时到岗|离职|open to work|actively looking|available|unemployed|immediate/i.test(clean)) {
        statusType = 'available';
      } else if (/考虑|看机会|在职-考虑|open to offers|looking for internship/i.test(clean)) {
        statusType = 'considering';
      } else if (/在职|employed|not looking/i.test(clean)) {
        statusType = 'employed';
      }
      items.push({
        key: `status-${idx}`,
        type: 'status',
        raw: clean,
        text: clean.replace(/^(?:求职状态|状态)[:：\s]*/i, ''),
        statusType,
      });
      return;
    }

    // C. Explicit Work Experience
    if (/\d+\s*年|(?:工作|从业|全栈)?经验|应届|在校生?|毕业生|实习生|无工作经验|years?\s*(?:of)?\s*exp|student\s*\/\s*new graduate|new grad(?:uate)?/i.test(clean)) {
      items.push({
        key: `exp-${idx}`,
        type: 'exp',
        raw: clean,
        text: clean.replace(/^(?:工作经验|从业经验|经验)[:：\s]*/i, ''),
      });
      return;
    }

    // D. Explicit Age or Pure 2-digit number (16-70)
    if (/^(?:年龄|age)[:：\s]*\d+/i.test(clean) || /^\d+\s*(?:岁|years?\s*old|yrs)$/i.test(clean) || /^(?:1[6-9]|[2-6]\d|70)$/.test(clean)) {
      const numMatch = clean.match(/\d+/);
      const num = numMatch ? numMatch[0] : clean;
      items.push({
        key: `age-${idx}`,
        type: 'age',
        raw: clean,
        text: lang === 'en' ? `${num} yrs` : `${num}岁`,
      });
      return;
    }

    // E. Pure number without unit (e.g. "9" or "5")
    if (/^\d{1,2}$/.test(clean)) {
      const num = parseInt(clean, 10);
      if (num >= 16 && num <= 70) {
        items.push({
          key: `age-${idx}`,
          type: 'age',
          raw: clean,
          text: lang === 'en' ? `${num} yrs` : `${num}岁`,
        });
        return;
      } else if (num < 16) {
        if (!hasExperience) {
          hasExperience = true;
          items.push({
            key: `exp-${idx}`,
            type: 'exp',
            raw: clean,
            text: lang === 'en' ? `${num} ${num === 1 ? 'Year' : 'Years'} Exp` : `${num}年工作经验`,
          });
          return;
        } else if (!hasAge) {
          hasAge = true;
          items.push({
            key: `age-${idx}`,
            type: 'age',
            raw: clean,
            text: lang === 'en' ? `${num} yrs` : `${num}岁`,
          });
          return;
        }
      }
    }

    // F. Location / City
    if (isLocationToken(clean)) {
      const cleanLoc = clean.replace(/^(?:意向城市|期望城市|现居|现居地|所在城市|城市|常驻|期望工作地|工作地点|地点|location|city)[:：\s]*/i, '');
      items.push({
        key: `loc-${idx}`,
        type: 'location',
        raw: clean,
        text: cleanLoc,
      });
      return;
    }

    // G. Fallback: other tag
    items.push({
      key: `other-${idx}`,
      type: 'other',
      raw: clean,
      text: clean,
    });
  });

  return items;
}

