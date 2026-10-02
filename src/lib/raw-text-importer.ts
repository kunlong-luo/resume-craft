/**
 * Utility to parse unformatted / raw text copied from job boards or plain text documents
 * into clean, structured Markdown resume format.
 */

import type { Language, MarketRegion } from '../types';
import { findPhoneCandidate } from './phone-utils';
import { detectResumeLanguage } from './resume-language';

export interface MarketDetectionResult {
  detectedMarket: MarketRegion;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
}

/**
 * Heuristics to automatically detect the likely target job market of a resume text.
 */
export function detectResumeMarket(rawText: string): MarketDetectionResult {
  if (!rawText || !rawText.trim()) {
    return { detectedMarket: 'cn', confidence: 'low', reasons: ['Empty text'] };
  }

  const reasons: string[] = [];
  let scoreCn = 0;
  let scoreUs = 0;
  let scoreUk = 0;
  let scoreCa = 0;
  let scoreIe = 0;

  // 1. Phone numbers
  if (/\+86[\s\-]|\b1[3-9]\d{9}\b/.test(rawText)) {
    scoreCn += 4;
    reasons.push('Contains China phone number (+86)');
  }
  if (/\+1[\s\-]|(?:\b\(\d{3}\)\s*\d{3}[-\s]\d{4}\b)/.test(rawText)) {
    scoreUs += 3;
    scoreCa += 2;
    reasons.push('Contains North American phone format (+1 / (xxx) xxx-xxxx)');
  }
  if (/\+44[\s\-]|\b07\d{9}\b/.test(rawText)) {
    scoreUk += 4;
    reasons.push('Contains UK phone format (+44)');
  }
  if (/\+353[\s\-]/.test(rawText)) {
    scoreIe += 4;
    reasons.push('Contains Ireland phone format (+353)');
  }

  // 2. Language & Character density
  const cjkMatches = rawText.match(/[\u4e00-\u9fa5]/g) || [];
  if (cjkMatches.length > 30) {
    scoreCn += 5;
    reasons.push('Contains significant Chinese text');
  }

  // 3. Nomenclature & Vocabulary
  if (/\b(?:Curriculum Vitae|CV)\b/i.test(rawText)) {
    scoreUk += 3;
    scoreIe += 2;
    reasons.push('Uses "Curriculum Vitae / CV" heading');
  }
  if (/\b(?:Postcode|Postal Code)\b/i.test(rawText)) {
    scoreUk += 2;
    scoreCa += 2;
    reasons.push('Uses Postcode / Postal Code');
  }
  if (/\b(?:Zip Code|ZIP)\b/i.test(rawText)) {
    scoreUs += 3;
    reasons.push('Uses ZIP code notation');
  }
  if (/\b(?:GPA|Magna Cum Laude|Dean's List)\b/i.test(rawText)) {
    scoreUs += 3;
    scoreCa += 2;
    reasons.push('Uses US academic honors (GPA / Dean’s List)');
  }
  if (/\b(?:GCSE|A-Levels|First Class Honours|2:1 Honours)\b/i.test(rawText)) {
    scoreUk += 4;
    reasons.push('Uses UK educational grading terms (GCSE / Honours)');
  }
  if (/\b(?:WeChat|微信号|微信)\b/i.test(rawText)) {
    scoreCn += 3;
    reasons.push('Mentions WeChat');
  }
  if (/\b(?:Canada|Ontario|Toronto|Vancouver|Montreal|Quebec|British Columbia)\b/i.test(rawText)) {
    scoreCa += 4;
    reasons.push('Mentions Canadian locations');
  }
  if (/\b(?:London|Manchester|Birmingham|Edinburgh|Glasgow|United Kingdom|UK)\b/i.test(rawText)) {
    scoreUk += 4;
    reasons.push('Mentions UK locations');
  }
  if (/\b(?:Dublin|Cork|Galway|Limerick|Ireland)\b/i.test(rawText)) {
    scoreIe += 4;
    reasons.push('Mentions Ireland locations');
  }
  if (/\b(?:New York|California|San Francisco|Seattle|Austin|Boston|Chicago|USA|United States)\b/i.test(rawText)) {
    scoreUs += 4;
    reasons.push('Mentions US locations');
  }

  const scores: Record<MarketRegion, number> = {
    cn: scoreCn,
    us: scoreUs,
    uk: scoreUk,
    ca: scoreCa,
    ie: scoreIe,
    international: 0,
  };

  const sorted = (Object.keys(scores) as MarketRegion[]).sort((a, b) => scores[b] - scores[a]);
  const best = sorted[0];
  const highestScore = scores[best];

  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (highestScore >= 6) {
    confidence = 'high';
  } else if (highestScore >= 3) {
    confidence = 'medium';
  }

  return {
    detectedMarket: best,
    confidence,
    reasons: reasons.slice(0, 3),
  };
}

export function parseRawTextToResumeMarkdown(
  rawText: string,
  language?: Language,
): string {
  if (!rawText || rawText.trim() === '') return '';

  const contentLanguage = language ?? detectResumeLanguage(rawText, 'zh');
  const isEn = contentLanguage === 'en';
  const labels = isEn
    ? {
        candidateName: 'Candidate Name',
        city: 'City',
        wechat: 'WeChat',
        summary: 'Summary',
        overview: 'Experience Overview',
        education: 'Education',
        work: 'Work Experience',
        projects: 'Projects',
        skills: 'Skills',
      }
    : {
        candidateName: '求职者姓名',
        city: '城市',
        wechat: '微信',
        summary: '个人简介',
        overview: '经历概述',
        education: '教育背景',
        work: '工作经历',
        projects: '项目经历',
        skills: '专业技能',
      };

  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) return '';

  let name = '';
  let phone = '';
  let email = '';
  let wechat = '';
  let role = '';
  let github = '';

  const emailRegex = /([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/;
  const wechatRegex = /(?:微信|微信号|WeChat|Wechat|wechat|wx|WX)[:：\s]+([a-zA-Z0-9_-]+)/i;
  const githubRegex = /(?:github\.com\/([a-zA-Z0-9_-]+)|git@github\.com:([a-zA-Z0-9_-]+))/i;

  const remainingLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!phone) {
      const candidate = findPhoneCandidate(line);
      if (candidate) {
        phone = candidate.display;
      }
    }

    if (!email && emailRegex.test(line)) {
      const match = line.match(emailRegex);
      if (match) email = match[1];
    }

    if (!wechat && wechatRegex.test(line)) {
      const match = line.match(wechatRegex);
      if (match) wechat = match[1];
    }

    if (!github && githubRegex.test(line)) {
      const match = line.match(githubRegex);
      if (match) github = `https://github.com/${match[1] || match[2]}`;
    }

    if (!name && i < 4 && line.length >= 2 && line.length <= 40 && !/\d/.test(line) && !line.includes('@')) {
      name = line;
      continue;
    }

    if (
      !role &&
      i < 6 &&
      (
        line.includes('工程师') ||
        line.includes('开发') ||
        line.includes('主管') ||
        line.includes('经理') ||
        line.includes('专家') ||
        /\b(?:Developer|Engineer|Designer|Architect|Manager|Analyst|Consultant|Specialist)\b/i.test(line)
      )
    ) {
      role = line;
      continue;
    }

    remainingLines.push(line);
  }

  name = name || labels.candidateName;

  const contacts: string[] = [];
  if (phone) contacts.push(phone);
  if (email) contacts.push(email);
  if (wechat) contacts.push(`${labels.wechat}: ${wechat}`);
  if (github) contacts.push(`[GitHub](${github})`);

  let markdown = `# ${name}\n`;
  if (role) {
    markdown += `> **${role}**\n`;
  }
  if (contacts.length > 0) {
    markdown += `${contacts.join(' | ')}\n\n`;
  } else {
    markdown += `your_email@example.com | ${labels.city}\n\n`;
  }

  const isEduHeader = (s: string) =>
    /^(教育背景|教育经历|学术背景|学习经历|学历背景|Education|Academic Background)/i.test(s);
  const isWorkHeader = (s: string) =>
    /^(工作经历|工作经验|职业经历|从业经历|实习经历|Work Experience|Professional Experience|Experience|Employment|Work History)/i.test(s);
  const isProjectHeader = (s: string) =>
    /^(项目经历|项目经验|代表项目|开源项目|主要项目|Projects|Project Experience|Portfolio)/i.test(s);
  const isSkillHeader = (s: string) =>
    /^(专业技能|技术栈|核心技能|技能特长|技能清单|Skills|Technical Skills|Core Skills)/i.test(s);
  const isAdvantageHeader = (s: string) =>
    /^(个人优势|核心优势|自我评价|个人总结|Summary|Professional Summary|Profile|About Me)/i.test(s);

  let currentSection = '';
  const sections: { title: string; lines: string[] }[] = [];
  let currentLines: string[] = [];

  for (const line of remainingLines) {
    let matchedTitle = '';
    if (isEduHeader(line)) matchedTitle = labels.education;
    else if (isWorkHeader(line)) matchedTitle = labels.work;
    else if (isProjectHeader(line)) matchedTitle = labels.projects;
    else if (isSkillHeader(line)) matchedTitle = labels.skills;
    else if (isAdvantageHeader(line)) matchedTitle = labels.summary;

    if (matchedTitle) {
      if (currentSection || currentLines.length > 0) {
        sections.push({ title: currentSection || labels.summary, lines: currentLines });
      }
      currentSection = matchedTitle;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentSection || currentLines.length > 0) {
    sections.push({ title: currentSection || labels.overview, lines: currentLines });
  }

  if (sections.length === 0 || (sections.length === 1 && !currentSection)) {
    markdown += `## ${labels.summary}\n`;
    for (const line of remainingLines) {
      markdown += `- ${line.replace(/^[-*•\d.]\s*/, '')}\n`;
    }
    return markdown;
  }

  for (const section of sections) {
    markdown += `## ${section.title}\n\n`;
    for (const line of section.lines) {
      const dateMatch = line.match(/(?:19|20)\d{2}[\.\-\/年\s]\d{1,2}/);
      const organizationKeyword =
        /(?:公司|科技|大学|学院|系统|平台)|\b(?:Company|Inc\.?|Ltd\.?|LLC|Corp\.?|Corporation|University|College|Institute|Laboratory|Labs|Technologies|Systems|Platform)\b/i;
      const isHeaderLine =
        (dateMatch && line.length < 80) ||
        (
          !line.startsWith('-') &&
          !line.startsWith('•') &&
          line.length < 80 &&
          organizationKeyword.test(line)
        );

      if (isHeaderLine) {
        markdown += `### ${line.replace(/^###?\s*/, '')}\n`;
      } else {
        const cleanedBullet = line
          .replace(/^[•⁃－—–·●▪■◆\-*+]\s*/, '')
          .replace(/^\d+[\.、]\s*/, '');
        if (cleanedBullet.trim()) {
          markdown += `- ${cleanedBullet}\n`;
        }
      }
    }
    markdown += '\n';
  }

  return markdown.trim() + '\n';
}
