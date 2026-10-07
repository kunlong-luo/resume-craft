import { FormItem, FormSection, ResumeFormModel } from './form-types';
import { findPhoneCandidate, normalizePhoneForResume } from './phone-utils';
import { COMPREHENSIVE_DATE_REGEX, parseDateRange } from './date-parser';

export function isTimeString(s: string): boolean {
  const clean = s.replace(/[*_]/g, '').trim();
  if (parseDateRange(clean)) {
    return true;
  }
  if (/\b(?:19|20)\d{2}\b/.test(clean) || clean.includes('至今') || /present|current|now|毕业/i.test(clean)) {
    return true;
  }
  return false;
}

export function cleanPart(s: string): string {
  let res = s.trim();
  // Strip outer markdown bold and italics
  while (
    (res.startsWith('**') && res.endsWith('**')) ||
    (res.startsWith('*') && res.endsWith('*')) ||
    (res.startsWith('__') && res.endsWith('__')) ||
    (res.startsWith('_') && res.endsWith('_'))
  ) {
    if (res.startsWith('**') && res.endsWith('**')) res = res.slice(2, -2).trim();
    else if (res.startsWith('*') && res.endsWith('*')) res = res.slice(1, -1).trim();
    else if (res.startsWith('__') && res.endsWith('__')) res = res.slice(2, -2).trim();
    else if (res.startsWith('_') && res.endsWith('_')) res = res.slice(1, -1).trim();
  }
  return res;
}

const DEGREE_REGEX = /^(本科|学士|硕士|博士|大专|高职|专科|中专|高中|双学士|研究生|PhD|Ph\.D|Master|Bachelor|Associate)$/i;
const DEGREE_EXTRACT_REGEX = /[（\(](本科|学士|硕士|博士|大专|高职|专科|双学士|研究生|PhD|Master|Bachelor)[）\)]/i;
const ROLE_REGEX = /(?:工程师|架构|开发|研发|设计|产品|运营|总监|经理|专家|顾问|专员|研究员|应用|全栈|算法|前端|后端|大数据|数据分析|实习生|助理|负责人|作者|架构师|Lead|Manager|Engineer|Developer|Architect|Consultant|Intern|Specialist|Designer)/i;

export function splitItemTitle(titleStr: string): { org: string; role: string; time: string; degree?: string } {
  let clean = titleStr.trim();
  if (clean.startsWith('**') && clean.endsWith('**')) {
    clean = clean.slice(2, -2).trim();
  }
  
  // 1. Check for time range and extract it if explicitly present
  // Matches: 2024.03 — 至今, *2024.03 — 至今*, Mar 2024 – Present, March 2024 - Present, 2021.06 - 2024.02, 2018 - 2022, etc.
  let extractedTime = '';
  const comprehensiveMatch = clean.match(COMPREHENSIVE_DATE_REGEX);
  if (comprehensiveMatch && comprehensiveMatch.index !== undefined) {
    extractedTime = cleanPart(comprehensiveMatch[0]);
    clean = (clean.slice(0, comprehensiveMatch.index) + ' ' + clean.slice(comprehensiveMatch.index + comprehensiveMatch[0].length)).trim();
  }

  // Clean trailing and leading delimiters & leftover markdown formatting from time extraction
  clean = clean.replace(/^[\s|｜\u3000·•●▪/／\-—–―,，\*\_]+|[\s|｜\u3000·•●▪/／\-—–―,，\*\_]+$/g, '').trim();

  // 2. Split remainder by delimiter precedence:
  // - High priority: Explicit full/half-width pipes (| or ｜) or full-width ideographic space (\u3000)
  // - Medium priority: Middle dots / bullets (·, •, etc.) or slashes with spaces (/ or ／)
  // - Lower priority: Multiple spaces (\s{2,})
  // - Lowest priority: Hyphens/dashes with spaces (\s+[-—–―]\s+), ONLY if a trailing segment is a recognized role or degree.
  //   This prevents project or company subtitles (e.g., "FlexAgent - 开源大模型多Agent低代码编排系统") from being broken in half.
  let rawParts: string[];
  if (/[|｜\u3000]/.test(clean)) {
    rawParts = clean.split(/\s*[|｜\u3000]\s*/).map(p => cleanPart(p)).filter(Boolean);
  } else if (/[·•●▪]/.test(clean)) {
    rawParts = clean.split(/\s*[·•●▪]\s*/).map(p => cleanPart(p)).filter(Boolean);
  } else if (/\s+[/／]\s+/.test(clean)) {
    rawParts = clean.split(/\s+[/／]\s+/).map(p => cleanPart(p)).filter(Boolean);
  } else if (/\s{2,}/.test(clean)) {
    rawParts = clean.split(/\s{2,}/).map(p => cleanPart(p)).filter(Boolean);
  } else if (/\s+[-—–―]\s+/.test(clean)) {
    const candidateParts = clean.split(/\s+[-—–―]\s+/).map(p => cleanPart(p)).filter(Boolean);
    const hasRoleOrDegree = candidateParts.slice(1).some(p => 
      DEGREE_REGEX.test(p) || ROLE_REGEX.test(p)
    );
    if (hasRoleOrDegree) {
      rawParts = candidateParts;
    } else {
      rawParts = [clean];
    }
  } else {
    rawParts = [clean];
  }

  let org = '';
  let role = '';
  let degree = '';
  let time = extractedTime;

  // If time wasn't found via regex, check if the last segment is a time string
  if (!time && rawParts.length > 1 && isTimeString(rawParts[rawParts.length - 1])) {
    time = rawParts.pop()!;
  }

  // 3. Process remaining segments
  if (rawParts.length === 1) {
    org = rawParts[0];
  } else if (rawParts.length === 2) {
    const p0 = rawParts[0];
    const p1 = rawParts[1];
    if (DEGREE_REGEX.test(p1)) {
      org = p0;
      degree = p1;
    } else if (DEGREE_REGEX.test(p0)) {
      degree = p0;
      role = p1;
    } else if (ROLE_REGEX.test(p0) && !ROLE_REGEX.test(p1)) {
      org = p1;
      role = p0;
    } else {
      org = p0;
      role = p1;
    }
  } else if (rawParts.length === 3) {
    const p0 = rawParts[0];
    const p1 = rawParts[1];
    const p2 = rawParts[2];
    if (DEGREE_REGEX.test(p1)) {
      org = p0;
      degree = p1;
      role = p2;
    } else if (DEGREE_REGEX.test(p2)) {
      org = p0;
      role = p1;
      degree = p2;
    } else {
      org = p0;
      role = `${p1} ｜ ${p2}`;
    }
  } else if (rawParts.length >= 4) {
    org = rawParts[0];
    if (DEGREE_REGEX.test(rawParts[1])) {
      degree = rawParts[1];
      role = rawParts.slice(2).join(' ｜ ');
    } else {
      role = rawParts.slice(1).join(' ｜ ');
    }
  }

  // 4. Secondary check: Extract embedded degree from parentheses (e.g. "计算机科学 (硕士)")
  if (!degree) {
    const roleMatch = role.match(DEGREE_EXTRACT_REGEX);
    if (roleMatch) {
      degree = roleMatch[1];
      role = role.replace(DEGREE_EXTRACT_REGEX, '').trim();
    } else {
      const orgMatch = org.match(DEGREE_EXTRACT_REGEX);
      if (orgMatch) {
        degree = orgMatch[1];
        org = org.replace(DEGREE_EXTRACT_REGEX, '').trim();
      }
    }
  }

  return { org, role, time, degree };
}

export function formatPhoneNumber(val: string): string {
  if (!val) return '';

  const trimmed = val.trim();

  // Only normalize when the number is already explicitly international.
  // Local numbers are preserved until the user selects a country/region.
  if (trimmed.startsWith('+')) {
    return normalizePhoneForResume(trimmed);
  }

  return trimmed;
}

const LOCATION_PREFIX_REGEX =
  /^(?:意向城市|期望城市|现居|现居地|所在城市|城市|常驻|期望工作地|工作地点|地点|location|city)[:：\s]*/i;

const KNOWN_LOCATION_REGEX =
  /^(?:北京|上海|广州|深圳|杭州|成都|武汉|南京|西安|厦门|苏州|天津|重庆|长沙|青岛|大连|宁波|郑州|合肥|无锡|福州|昆明|济南|佛山|东莞|珠海|南昌|贵阳|南宁|海口|三亚|长春|沈阳|哈尔滨|石家庄|太原|兰州|银川|西宁|乌鲁木齐|呼和浩特|拉萨|香港|澳门|台北|远程|全国|海外|硅谷|旧金山|西雅图|纽约|伦敦|东京|新加坡|多伦多|温哥华|悉尼|墨尔本|beijing|shanghai|shenzhen|hangzhou|guangzhou|san francisco|new york|seattle|london|singapore|toronto|vancouver|sydney|melbourne|tokyo|hong kong|macau|taipei|dublin|remote)(?:\s*,\s*(?:[a-z]{2,3}|usa|united states|uk|united kingdom|canada|australia|china|singapore|japan)){0,2}$/i;

function isCityOrLocationValue(value: string): boolean {
  const clean = value.trim();
  if (!clean) return false;

  if (LOCATION_PREFIX_REGEX.test(clean)) return true;

  if (/https?:\/\/|\[[^\]]+]\([^)]*\)|@/.test(clean)) {
    return false;
  }

  if (KNOWN_LOCATION_REGEX.test(clean)) return true;

  const combinedLocations = clean
    .split(/\s*[/·•、|｜]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (
    combinedLocations.length > 1 &&
    combinedLocations.every((part) => KNOWN_LOCATION_REGEX.test(part))
  ) {
    return true;
  }

  return /^[\u4e00-\u9fa5\w\s/、·•\-]+[市省区县]$/.test(clean);
}

export function parseContactString(contactStr: string) {
  let remaining = contactStr.trim();
  let phone = '';
  let email = '';
  let wechat = '';
  let social = '';
  let city = '';

  // 1. Extract email first (standard emails with domain)
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = remaining.match(emailRegex);
  if (emailMatch) {
    email = emailMatch[0].trim();
    remaining = remaining.replace(emailRegex, '').trim();
  }

  // 2. Extract a labeled phone first, then fall back to a generic
  // international/local candidate. Formatting is delegated to phone-utils.
  const phonePrefixRegex =
    /(?:电话|手机|手机号|手机号码|电话号码|联系方式|联系电话|Tel|Mobile|Phone|Contact)[:：\s-]*([+\d][+\d\s().-]{6,26}\d)/i;
  const phonePrefixMatch = remaining.match(phonePrefixRegex);

  if (phonePrefixMatch) {
    phone = formatPhoneNumber(phonePrefixMatch[1].trim());
    remaining = remaining.replace(phonePrefixRegex, '').trim();
  } else {
    const detected = findPhoneCandidate(remaining);
    if (detected) {
      phone = detected.e164 ? detected.display : formatPhoneNumber(detected.raw);
      remaining = remaining.replace(detected.raw, '').trim();
    }
  }

  // 3. Extract WeChat if present
  const wechatRegex = /(?:微信|微信号|WeChat|Wechat|wechat|wx|WX)[:：\s]+([a-zA-Z0-9_\-]+|[^\s·|｜••,，;；\t]+)/i;
  const wechatMatch = remaining.match(wechatRegex);
  if (wechatMatch) {
    wechat = wechatMatch[1].trim();
    remaining = remaining.replace(wechatRegex, '').trim();
  }

  // 4. Extract recognizable locations before treating the rest as social.
  // Keep commas intact here so values such as "San Francisco, CA" remain one location.
  const locationAwareParts = remaining
    .split(/\s*[·|｜••;；\t]\s*|\s{2,}|\s+\/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const nonLocationParts: string[] = [];
  for (const part of locationAwareParts) {
    if (!city && isCityOrLocationValue(part)) {
      city = part.replace(LOCATION_PREFIX_REGEX, '').trim();
    } else {
      nonLocationParts.push(part);
    }
  }
  remaining = nonLocationParts.join(' · ');

  const separatorRegex = /\s*[·|｜••,，;；\t]\s*|\s{2,}|\s+\/\s+/;
  const parts = remaining
    .split(separatorRegex)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^[-·|｜••,，;；\t/\\\s]+$/.test(part));

  social = parts.join(' · ');

  // 5. Fallback for legacy compact contact lines.
  if (!phone && !email && !wechat && !social && contactStr.trim()) {
    const rawParts = contactStr
      .split(separatorRegex)
      .map((part) => part.trim())
      .filter(Boolean);

    if (rawParts.length > 0) {
      const detected = findPhoneCandidate(rawParts[0] || '');
      phone = detected
        ? detected.e164
          ? detected.display
          : formatPhoneNumber(detected.raw)
        : '';
      email = rawParts[1] || '';
      social = rawParts.slice(phone ? 2 : 1).join(' · ');
    }
  }

  return { phone, email, wechat, social, city };
}

export function classifySubsequentLines(subsequent: string[]): { subtitle: string; phone: string; email: string; wechat: string; social: string; experience: string } {
  let subtitle = '';
  let phone = '';
  let email = '';
  let wechat = '';
  let social = '';
  let experience = '';
  const contactCities: string[] = [];

  const isContactLine = (s: string) => {
    const clean = s.toLowerCase();
    if (clean.includes('@')) return true;
    const hasDateRange = /(?:19|20)\d{2}(?:[\.\-\/]\d{1,2})?\s*[-—–~至到]/i.test(clean);
    if (!hasDateRange) {
      if (/^(?:电话|手机|手机号|手机号码|联系方式|联系电话|tel|mobile|phone|contact)[:：\s-]*/i.test(clean) && findPhoneCandidate(clean)) return true;
      if (findPhoneCandidate(clean) && !/(?:经验|运营|负责|工作|年限|学校|学历|能力)/.test(clean)) return true;
    }
    if (clean.includes('github') || clean.includes('gitee') || clean.includes('wechat') || clean.includes('微信') || clean.includes('博客') || clean.includes('blog') || clean.includes('linkedin') || clean.includes('http') || clean.includes('https') || clean.includes('电话') || clean.includes('手机') || clean.includes('邮箱') || clean.includes('tel') || clean.includes('phone') || clean.includes('mobile')) return true;
    return false;
  };

  const isRoleOrSubtitleLine = (s: string) => {
    const clean = s.trim();
    if (/^(?:求职方向|求职意向|求职目标|目标岗位|应聘职位|应聘岗位|意向岗位|个人标签|专业标签)[:：\s]*/.test(clean)) return true;
    return /(?:工程师|架构|开发|研发|设计|产品|运营|总监|经理|专家|顾问|专员|研究员|应用|全栈|算法|前端|后端|大数据|数据分析|实习生|助理|负责人|作者|架构师)/i.test(clean);
  };

  const isStructuredExpLine = (s: string) => {
    const clean = s.toLowerCase();
    if (/^\d+\s*年(?:工作|经验|从业|全栈)?经验?$/i.test(clean)) return true;
    if (/\d+年(?:工作经验|从业经验)/i.test(clean)) return true;
    if (/应届毕业生|在校生|应届生/.test(clean)) return true;
    if (/本科|硕士|博士|大专|学历/.test(clean)) return true;
    if (/^(?:意向城市|期望城市|现居|现居地|所在城市|城市|常驻|期望工作地|工作地点|地点|location|city)[:：\s]/i.test(clean)) return true;
    if (/在职|随时到岗|离职|月内到岗/.test(clean)) return true;
    if (/^(?:\d+年(?:工作经验|经验)?\s*[｜|·•]\s*)+/i.test(clean)) return true;
    return false;
  };

  const contactLines: string[] = [];
  const nonContactLines: string[] = [];

  subsequent.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '---' || trimmed === '***' || trimmed === '___') return;
    let stripped = trimmed
      .replace(/^[-*+•●▪■◆]\s+/, '')
      .replace(/^\d{1,2}[\.\)）]\s+/, '')
      .trim();

    if ((stripped.startsWith('**') && stripped.endsWith('**')) || (stripped.startsWith('__') && stripped.endsWith('__'))) {
      stripped = stripped.slice(2, -2).trim();
    } else if ((stripped.startsWith('*') && stripped.endsWith('*')) || (stripped.startsWith('_') && stripped.endsWith('_'))) {
      stripped = stripped.slice(1, -1).trim();
    }
    if (!stripped) return;

    if (isContactLine(stripped)) {
      contactLines.push(stripped);
    } else {
      nonContactLines.push(stripped);
    }
  });

  if (contactLines.length > 0) {
    const parsed = parseContactString(contactLines[0]);
    phone = parsed.phone;
    email = parsed.email;
    wechat = parsed.wechat;
    social = parsed.social;
    if (parsed.city) contactCities.push(parsed.city);
    
    if (contactLines.length > 1) {
      for (let i = 1; i < contactLines.length; i++) {
        const extraParsed = parseContactString(contactLines[i]);
        if (extraParsed.phone && !phone) phone = extraParsed.phone;
        if (extraParsed.email && !email) email = extraParsed.email;
        if (extraParsed.wechat && !wechat) wechat = extraParsed.wechat;
        if (extraParsed.social) {
          social = social ? `${social} · ${extraParsed.social}` : extraParsed.social;
        }
        if (extraParsed.city) contactCities.push(extraParsed.city);
      }
    }
  }

  // Parse non-contact lines into subtitle vs experience
  if (nonContactLines.length === 1) {
    const line = nonContactLines[0];
    if (isStructuredExpLine(line) && !isRoleOrSubtitleLine(line)) {
      experience = line;
    } else {
      subtitle = line.replace(/^(?:求职方向|求职意向|求职目标|目标岗位|应聘职位|应聘岗位|意向岗位)[:：\s]*/, '').trim();
    }
  } else if (nonContactLines.length > 1) {
    const subtitleCandidates: string[] = [];
    const expCandidates: string[] = [];

    nonContactLines.forEach((line, idx) => {
      const isRole = isRoleOrSubtitleLine(line);
      const isExp = isStructuredExpLine(line);

      if (isRole && !isExp) {
        subtitleCandidates.push(line);
      } else if (isExp && !isRole) {
        expCandidates.push(line);
      } else if (idx === 0) {
        // First line under name is overwhelmingly the subtitle
        subtitleCandidates.push(line);
      } else {
        expCandidates.push(line);
      }
    });

    if (subtitleCandidates.length > 0) {
      subtitle = subtitleCandidates.map(s => s.replace(/^(?:求职方向|求职意向|求职目标|目标岗位|应聘职位|应聘岗位|意向岗位)[:：\s]*/, '').trim()).join(' ｜ ');
    }
    if (expCandidates.length > 0) {
      experience = expCandidates.join(' ｜ ');
    }
  }

  if (contactCities.length > 0) {
    const contactLocation = [...new Set(contactCities)].join(' · ');
    experience = experience
      ? `${experience} ｜ ${contactLocation}`
      : contactLocation;
  }

  return { subtitle, phone, email, wechat, social, experience };
}

export function getSectionCategory(title: string): 'work' | 'project' | 'edu' | 'default' {
  const t = title.trim();
  if (t.includes('教育') || t.includes('学校') || t.includes('本科') || t.includes('硕士') || t.includes('博士') || t.toLowerCase().includes('education') || t.toLowerCase().includes('academic')) {
    return 'edu';
  }
  if (t.includes('项目') || t.includes('产品') || t.includes('开源') || t.toLowerCase().includes('project') || t.toLowerCase().includes('portfolio')) {
    return 'project';
  }
  if (t.includes('工作') || t.includes('经历') || t.includes('实习') || t.toLowerCase().includes('work') || t.toLowerCase().includes('experience') || t.toLowerCase().includes('career')) {
    return 'work';
  }
  return 'default';
}

export function parseTextSectionToItems(text: string, category: 'edu' | 'work' | 'project'): FormItem[] {
  const lines = text.split('\n');
  const items: FormItem[] = [];
  let currentItem: FormItem | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if current line is an attribute of the existing currentItem (time, role/degree)
    if (currentItem && currentItem.org) {
      if (!currentItem.time && isTimeString(trimmed)) {
        currentItem.time = cleanPart(trimmed);
        continue;
      }
      if (category === 'edu' && (!currentItem.role || !currentItem.degree) && !trimmed.startsWith('- ') && !trimmed.startsWith('* ') && !trimmed.startsWith('### ')) {
        const cleanT = cleanPart(trimmed);
        const parts = cleanT.split(/[｜|　]|\s{2,}/).map(p => p.trim()).filter(Boolean);
        if (parts.length > 0) {
          if (parts.length === 1) {
            if (/大专|本科|硕士|博士|学士|双学位|高中|中专/.test(parts[0])) {
              currentItem.degree = parts[0];
            } else {
              currentItem.role = parts[0];
            }
          } else {
            // Find which part is degree
            const degIdx = parts.findIndex(p => /大专|本科|硕士|博士|学士|双学位|高中|中专/.test(p));
            if (degIdx !== -1) {
              currentItem.degree = parts[degIdx];
              const rest = parts.filter((_, idx) => idx !== degIdx);
              currentItem.role = rest.join(' · ');
            } else {
              currentItem.role = parts.join(' · ');
            }
          }
          continue;
        }
      }
      if ((category === 'work' || category === 'project') && !currentItem.role && !trimmed.startsWith('- ') && !trimmed.startsWith('* ') && !trimmed.startsWith('### ')) {
        if (trimmed.startsWith('**') || trimmed.includes('｜') || trimmed.includes('|')) {
          const cleanT = cleanPart(trimmed);
          currentItem.role = cleanT;
          continue;
        }
      }
    }

    let isHeader = false;

    if (trimmed.startsWith('### ')) {
      isHeader = true;
    } else if (trimmed.startsWith('**') && !trimmed.startsWith('- ') && !trimmed.startsWith('* ')) {
      isHeader = true;
    } else if (isTimeString(trimmed) && !trimmed.startsWith('- ') && !trimmed.startsWith('* ')) {
      isHeader = true;
    } else if (!trimmed.startsWith('- ') && !trimmed.startsWith('* ') && !trimmed.startsWith('>') && !trimmed.startsWith('1.') && !trimmed.startsWith('2.') && !trimmed.startsWith('3.')) {
      const lower = trimmed.toLowerCase();
      if (category === 'edu' && (lower.includes('大学') || lower.includes('学院') || lower.includes('学校') || lower.includes('university') || lower.includes('school') || lower.includes('college'))) {
        isHeader = true;
      } else if (category === 'work' && (lower.includes('公司') || lower.includes('集团') || lower.includes('中心') || lower.includes('co.,') || lower.includes('company') || lower.includes('corp') || lower.includes('inc') || lower.includes('科技') || lower.includes('工作室'))) {
        isHeader = true;
      } else if (category === 'project' && (lower.includes('系统') || lower.includes('平台') || lower.includes('软件') || lower.includes('项目') || lower.includes('app') || lower.includes('system') || lower.includes('platform') || lower.includes('引擎') || lower.includes('工具'))) {
        isHeader = true;
      }
    }

    if (isHeader) {
      if (currentItem) {
        items.push(currentItem);
      }
      
      const cleanLine = trimmed.replace(/^###\s+/, '');
      const { org, role, time, degree } = splitItemTitle(cleanLine);
      currentItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}_${i}`,
        org,
        role: role || '',
        time: time || '',
        degree: degree || '',
        content: ''
      };
    } else {
      if (!currentItem) {
        currentItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}_${i}`,
          org: category === 'edu' ? '教育背景' : (category === 'work' ? '工作经历' : '项目经历'),
          role: '',
          time: '',
          degree: '',
          content: ''
        };
      }
      
      currentItem.content += line + '\n';
    }
  }

  if (currentItem) {
    items.push(currentItem);
  }

  items.forEach(item => {
    item.content = item.content.trim();
  });

  return items;
}

export function parseMarkdownToForm(md: string): ResumeFormModel {
  const model: ResumeFormModel = {
    name: '',
    subtitle: '',
    phone: '',
    email: '',
    social: '',
    experience: '',
    sections: []
  };

  const lines = md.split('\n');
  let currentSection: FormSection | null = null;
  let currentItem: FormItem | null = null;
  
  const headerLines: string[] = [];
  let foundFirstH2 = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('## ')) {
      foundFirstH2 = true;
      const title = trimmed.substring(3).trim();
      
      if (currentSection) {
        if (currentItem) {
          currentSection.items.push(currentItem);
          currentItem = null;
        }
        model.sections.push(currentSection);
      }

      currentSection = {
        id: `sec_${i}_${Math.random().toString(36).substring(2, 7)}`,
        title,
        type: 'text',
        textValue: '',
        items: []
      };
      continue;
    }

    if (!foundFirstH2) {
      headerLines.push(line);
      continue;
    }

    if (currentSection) {
      if (trimmed.startsWith('### ')) {
        currentSection.type = 'items';
        if (currentItem) {
          currentSection.items.push(currentItem);
        }
        const itemTitle = trimmed.substring(4).trim();
        let { org, role, time, degree } = splitItemTitle(itemTitle);

        // Look ahead for subsequent lines defining role or date (common in resumes where role & date are on lines 2 & 3)
        let nextIdx = i + 1;
        while (nextIdx < lines.length && nextIdx <= i + 4) {
          const nextTrimmed = lines[nextIdx].trim();
          if (!nextTrimmed) {
            nextIdx++;
            continue;
          }
          if (nextTrimmed.startsWith('#') || nextTrimmed.startsWith('- ') || nextTrimmed.startsWith('* ') || nextTrimmed.startsWith('>')) {
            break;
          }

          // Check if next line is a time string, e.g. **2024.01 — 2026.02**
          if (!time && isTimeString(nextTrimmed)) {
            time = cleanPart(nextTrimmed);
            i = nextIdx;
            nextIdx++;
            continue;
          }

          // Check if next line is bold role/details line, e.g. **跨境电商亚马逊运营｜Amazon 美国站**
          const isBoldOrDetails = (nextTrimmed.startsWith('**') && nextTrimmed.endsWith('**')) || nextTrimmed.includes('｜') || nextTrimmed.includes('|');
          if (isBoldOrDetails && (!role || !time)) {
            const parsed = splitItemTitle(nextTrimmed);
            if (!role && parsed.org && !isTimeString(nextTrimmed)) {
              role = parsed.role ? `${parsed.org} · ${parsed.role}` : parsed.org;
            } else if (!role && parsed.role) {
              role = parsed.role;
            }
            if (!time && parsed.time) {
              time = parsed.time;
            }
            if (!degree && parsed.degree) {
              degree = parsed.degree;
            }
            i = nextIdx;
            nextIdx++;
            continue;
          }

          break;
        }

        currentItem = {
          id: `item_${i}_${Math.random().toString(36).substring(2, 7)}`,
          org,
          role,
          time,
          degree,
          content: ''
        };
      } else {
        if (currentSection.type === 'items') {
          if (currentItem) {
            currentItem.content += line + '\n';
          }
        } else {
          currentSection.textValue += line + '\n';
        }
      }
    }
  }

  if (currentSection) {
    if (currentItem) {
      currentSection.items.push(currentItem);
    }
    model.sections.push(currentSection);
  }

  let nameIndex = -1;
  for (let i = 0; i < headerLines.length; i++) {
    const hl = headerLines[i].trim();
    if (/^#\s+[^\#]/.test(hl) || /^#[^\#\s]+/.test(hl)) {
      model.name = hl.replace(/^#+\s*/, '').replace(/[\*\_]+/g, '').trim();
      nameIndex = i;
      break;
    } else if (hl && nameIndex === -1 && !hl.startsWith('- ') && !hl.startsWith('* ') && !hl.startsWith('+ ')) {
      model.name = hl.replace(/[\*\_]+/g, '').trim();
      nameIndex = i;
    }
  }

  const subsequent: string[] = [];
  for (let i = 0; i < headerLines.length; i++) {
    if (i === nameIndex) continue;
    const hl = headerLines[i].trim();
    if (hl) {
      const cleanedHl = hl
        .replace(/^[-*+•●▪■◆]\s+/, '')
        .replace(/^\d{1,2}[\.\)）]\s+/, '')
        .trim();
      if (cleanedHl) {
        subsequent.push(cleanedHl);
      }
    }
  }

  const classified = classifySubsequentLines(subsequent);
  model.subtitle = classified.subtitle;
  model.phone = classified.phone;
  model.email = classified.email;
  model.wechat = classified.wechat;
  model.social = classified.social;
  model.experience = classified.experience;

  const parsedExp = parseExperienceField(classified.experience);
  model.workYears = parsedExp.workYears;
  model.degree = parsedExp.degree;
  model.city = parsedExp.city;
  model.jobStatus = parsedExp.jobStatus;
  model.age = parsedExp.age;

  model.sections.forEach(sec => {
    const category = getSectionCategory(sec.title);
    if (sec.type === 'text') {
      sec.textValue = sec.textValue.trim();
      if (category === 'work' || category === 'project' || category === 'edu') {
        if (sec.textValue === '') {
          sec.type = 'items';
        } else {
          const parsedItems = parseTextSectionToItems(sec.textValue, category);
          if (parsedItems.length > 0) {
            sec.items = parsedItems;
            sec.type = 'items';
            sec.textValue = '';
          }
          // If no items parsed, preserve sec.type = 'text' gracefully rather than injecting fake items
        }
      }
    }

    if (sec.type === 'items') {
      sec.items.forEach(item => {
        let content = item.content.trim();
        if (category === 'edu') {
          const lines = content.split('\n');
          const remainingLines: string[] = [];
          for (const line of lines) {
            const t = line.trim();
            if (t.match(/^- \*\*(学业成绩|在校表现|成绩|学术成绩|GPA \/ Performance|GPA|Performance)\*\*[:：\s]/)) {
              item.gpa = t.replace(/^- \*\*(学业成绩|在校表现|成绩|学术成绩|GPA \/ Performance|GPA|Performance)\*\*[:：\s]*/, '').trim();
            } else if (t.match(/^- \*\*(主修课程|核心课程|课程|Core Courses|Courses)\*\*[:：\s]/)) {
              item.courses = t.replace(/^- \*\*(主修课程|核心课程|课程|Core Courses|Courses)\*\*[:：\s]*/, '').trim();
            } else if (t.match(/^- \*\*(荣誉成就|主要荣誉|荣誉|实践成就|校园成就|Honors & Awards|Honors|Awards)\*\*[:：\s]/)) {
              item.honors = t.replace(/^- \*\*(荣誉成就|主要荣誉|荣誉|实践成就|校园成就|Honors & Awards|Honors|Awards)\*\*[:：\s]*/, '').trim();
            } else {
              remainingLines.push(line);
            }
          }
          item.content = remainingLines.join('\n').trim();
        } else if (category === 'project') {
          const lines = content.split('\n');
          const remainingLines: string[] = [];

          for (const line of lines) {
            const t = line.trim();
            const projectRoleMatch = t.match(
              /^[-*+]\s+\*\*(?:项目角色|Project Role)\s*[:：]?\*\*\s*[:：]?\s*(.+)$/i,
            );

            if (projectRoleMatch) {
              if (!item.role?.trim()) {
                item.role = projectRoleMatch[1].trim();
              }
              continue;
            }

            remainingLines.push(line);
          }

          item.content = remainingLines.join('\n').trim();
        } else {
          item.content = content;
        }
      });
    }
  });

  return model;
}

export function parseExperienceField(expString: string) {
  let workYears = '';
  let degree = '';
  let city = '';
  let jobStatus = '';
  let age = '';

  if (!expString) return { workYears, degree, city, jobStatus, age };

  // Split by pipeline | or ｜ (preserve dots/slashes in cities like 杭州 / 上海 or 深圳 · 远程)
  const parts = expString.split(/[｜|]/).map(p => p.trim()).filter(Boolean);

  parts.forEach(p => {
    const pl = p.toLowerCase();
    if (
      /在职|离职|到岗|考虑|随时到岗|寻实习|找实习|暂不考虑/i.test(pl) ||
      /employed|unemployed|open to offers|not looking|immediate|looking for internship/i.test(pl)
    ) {
      jobStatus = p;
    } else if (
      /年(?:工作|经验|从业)|^\d+\s*年$/i.test(pl) ||
      /^\d+\s*(?:years?|yrs?|exp)/i.test(pl) ||
      pl.includes('工作经验') ||
      pl.includes('在校生') ||
      pl.includes('应届生') ||
      pl.includes('应届毕业生') ||
      /student\s*\/\s*new graduate|new grad(?:uate)?/i.test(pl)
    ) {
      workYears = p;
    } else if (/本科|硕士|博士|大专|等学|中专|学士|研究生|学位|phd|master|bachelor|associate/i.test(pl)) {
      degree = p;
    } else if (/岁|生于|出生于|19\d{2}|20\d{2}/.test(pl) || /^(?:1[6-9]|[2-6]\d|70)$/.test(pl.trim())) {
      const numMatch = p.trim().match(/^(\d+)\s*(?:岁|years?\s*old|yrs)?$/i);
      age = numMatch ? numMatch[1] : p.replace(/^(?:年龄|age)[:：\s]*/i, '').trim();
    } else if (isCityOrLocationValue(p)) {
      const rawCity = p.replace(LOCATION_PREFIX_REGEX, '').trim();
      const parsedCities = rawCity.split(/[\s]*[/·•、|｜]+[\s]*/).map(c => c.trim()).filter(Boolean);
      const formattedCity = parsedCities.length > 0 ? parsedCities.join(' · ') : rawCity;
      if (!city) {
        city = formattedCity;
      } else {
        city += ' · ' + formattedCity;
      }
    }
  });

  return { workYears, degree, city, jobStatus, age };
}

export function serializeExperienceField(fields: { workYears?: string; degree?: string; city?: string; jobStatus?: string; age?: string }): string {
  const parts: string[] = [];
  if (fields.workYears?.trim()) parts.push(fields.workYears.trim());
  if (fields.degree?.trim()) parts.push(fields.degree.trim());
  if (fields.age?.trim()) parts.push(fields.age.trim());
  if (fields.city?.trim()) parts.push(fields.city.trim());
  if (fields.jobStatus?.trim()) parts.push(fields.jobStatus.trim());
  return parts.join(' ｜ ');
}

export function generateContactString(phone: string, email: string, social: string, wechat?: string): string {
  const parts: string[] = [];
  if (phone && phone.trim()) parts.push(phone.trim());
  if (email && email.trim()) parts.push(email.trim());
  if (wechat && wechat.trim()) {
    const cleanWx = wechat.trim();
    if (/^(?:微信|微信号|wechat|wx)[:：\s]*/i.test(cleanWx)) {
      parts.push(cleanWx);
    } else {
      parts.push(`微信: ${cleanWx}`);
    }
  }
  if (social && social.trim()) parts.push(social.trim());
  return parts.join(' · ');
}

export function parseFormToMarkdown(model: ResumeFormModel): string {
  let md = '';
  
  if (model.name) {
    md += `# ${model.name}\n`;
  }
  if (model.subtitle) {
    md += `${model.subtitle}\n`;
  }
  
  const contactStr = generateContactString(model.phone, model.email, model.social, model.wechat);
  if (contactStr) {
    md += `${contactStr}\n`;
  }
  
  const expStr = serializeExperienceField({
    workYears: model.workYears,
    degree: model.degree,
    city: model.city,
    jobStatus: model.jobStatus,
    age: model.age
  }) || model.experience;

  if (expStr) {
    md += `${expStr}\n`;
  }
  
  md += '\n';

  model.sections.forEach(sec => {
    md += `## ${sec.title}\n`;
    
    if (sec.type === 'items') {
      md += '\n';
      sec.items.forEach(item => {
        let titleParts: string[] = [];
        if (item.org && item.org.trim()) titleParts.push(item.org.trim());
        if (item.degree && item.degree.trim()) titleParts.push(item.degree.trim());
        if (item.role && item.role.trim()) titleParts.push(item.role.trim());
        if (item.time && item.time.trim()) {
          let t = item.time.trim();
          if (!t.startsWith('*')) t = `*${t}*`;
          titleParts.push(t);
        }

        const itemTitle = titleParts.join(' ｜ ');
        md += `### ${itemTitle}\n`;
        
        const category = getSectionCategory(sec.title);
        if (category === 'edu') {
          const isEnglish = !/[\u4e00-\u9fa5]/.test(sec.title);
          
          if (item.gpa && item.gpa.trim()) {
            md += isEnglish 
              ? `- **GPA / Performance**: ${item.gpa.trim()}\n`
              : `- **在校表现**：${item.gpa.trim()}\n`;
          }
          if (item.courses && item.courses.trim()) {
            md += isEnglish
              ? `- **Core Courses**: ${item.courses.trim()}\n`
              : `- **主修课程**：${item.courses.trim()}\n`;
          }
          if (item.honors && item.honors.trim()) {
            md += isEnglish
              ? `- **Honors & Awards**: ${item.honors.trim()}\n`
              : `- **荣誉成就**：${item.honors.trim()}\n`;
          }
          if (item.content && item.content.trim()) {
            md += `${item.content.trim()}\n`;
          }
          md += '\n';
        } else {
          if (item.content) {
            md += `${item.content.trim()}\n\n`;
          } else {
            md += '\n';
          }
        }
      });
    } else {
      if (sec.textValue) {
        md += `${sec.textValue}\n\n`;
      } else {
        md += '\n';
      }
    }
  });

  return md.trim() + '\n';
}
