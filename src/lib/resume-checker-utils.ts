import { formatChineseEnglishSpacing } from './format-utils';
import { parseMarkdownToForm } from './markdown-parser';
import { findPhoneCandidate } from './phone-utils';
import { getMarketProfile } from './market-profile';
import { normalizeAllDatesInMarkdown, sanitizeSensitiveFieldsForMarket } from './resume-auto-fixer';
import { DateStyle, MarketRegion } from '../types';

export interface IssueItem {
  type: 'error' | 'warning' | 'success';
  title: string;
  desc: string;
  fixable?: boolean;
  onFix?: () => void;
  category?: 'market' | 'ats' | 'content' | 'formatting';
}

export interface AnalysisResult {
  score: number;
  issues: IssueItem[];
  hasPlaceholders: boolean;
  metricCount: number;
  foundVerbsCount: number;
  marketRegion?: MarketRegion;
  marketLabel?: string;
}

export function analyzeResume(
  markdown: string,
  onUpdateMarkdown: (newMarkdown: string, immediate?: boolean) => void,
  lang?: string,
  marketRegion?: MarketRegion,
  dateStyle?: DateStyle
): AnalysisResult {
  const issues: IssueItem[] = [];
  let score = 100;
  const isEn = lang === 'en';
  const effectiveMarket = marketRegion || (isEn ? 'us' : 'cn');
  const marketProfile = getMarketProfile(effectiveMarket);
  const targetDateStyle = dateStyle || marketProfile.dateStyle;

  // 1. Check Name (H1)
  const hasH1 = markdown.trim().split('\n').some(line => line.startsWith('# '));
  if (hasH1) {
    issues.push({
      type: 'success',
      category: 'content',
      title: isEn ? 'Basic Info: Name header found' : '基本信息：姓名标题已设置',
      desc: isEn 
        ? 'Your resume starts with a level 1 heading (# Name), which is standard and easy to read.'
        : '简历顶部包含 # 姓名 格式的一级标题，利于系统和HR检索。'
    });
  } else {
    score -= 20;
    issues.push({
      type: 'error',
      category: 'content',
      title: isEn ? 'Basic Info: Missing name header (#)' : '基本信息：缺失姓名一级标题',
      desc: isEn 
        ? 'The very top of your resume should start with your name, styled as "# Your Name".'
        : '简历最顶部应该使用「# 您的姓名」作为标题。',
      fixable: true,
      onFix: () => {
        onUpdateMarkdown(isEn ? '# John Doe\n' : '# 张三\n' + markdown, true);
      }
    });
  }

  // 2. Check Contact details
  const hasEmail = markdown.includes('@') && !markdown.includes('your-email') && !markdown.includes('your.email');
  const phoneCandidate = findPhoneCandidate(markdown);
  const hasPhone = Boolean(phoneCandidate);

  if (hasEmail) {
    issues.push({
      type: 'success',
      category: 'content',
      title: isEn ? 'Contact Info: Email address is valid' : '联系方式：电子邮箱有效',
      desc: isEn 
        ? 'A valid email address has been found.' 
        : '已包含有效的邮箱联系方式。'
    });
  } else {
    score -= 10;
    issues.push({
      type: 'warning',
      category: 'content',
      title: isEn ? 'Contact Info: Email is missing or placeholder' : '联系方式：邮箱缺失或为默认占位符',
      desc: isEn 
        ? 'No valid email address was found. Email is the primary channel for recruiters to reach you.'
        : '简历中未找到或含有默认的邮箱地址。电子邮箱是HR发出面试通知的核心渠道。',
      fixable: true,
      onFix: () => {
        const lines = markdown.split('\n');
        const h1Idx = lines.findIndex(l => l.startsWith('# '));
        if (h1Idx !== -1) {
          lines.splice(h1Idx + 1, 0, isEn ? '13812345678 | your.email@email.com | github.com/yourgithub' : '13812345678 ｜ your.email@email.com ｜ github.com/yourgithub');
          onUpdateMarkdown(lines.join('\n'), true);
        } else {
          onUpdateMarkdown('your.email@email.com\n' + markdown, true);
        }
      }
    });
  }

  if (hasPhone && phoneCandidate) {
    issues.push({
      type: 'success',
      category: 'content',
      title: isEn ? 'Contact Info: Phone number found' : '联系方式：已识别电话号码',
      desc: phoneCandidate.isInternational
        ? isEn
          ? 'An international-format phone number was found and is easier to use across regions.'
          : '已检测到带国家/地区代码的国际号码，跨地区投递时更容易直接联系。'
        : isEn
          ? 'A phone number was found. For cross-border applications, consider using +country calling code format.'
          : '已检测到电话号码。若投递海外或跨地区岗位，建议使用 +国家/地区代码 的国际格式。'
    });
  } else {
    score -= 10;
    issues.push({
      type: 'warning',
      category: 'content',
      title: isEn ? 'Contact Info: Phone number is missing or placeholder' : '联系方式：电话号码缺失或为占位符',
      desc: isEn 
        ? 'No recognizable phone number was found, or the resume still contains a placeholder.'
        : '简历中未识别到可用电话号码，或仍保留了模板占位号码。',
    });
  }

  // 3. Market Anti-Bias / Sensitive Personal Information Audit
  const isWesternMarket = ['us', 'ca', 'uk', 'ie', 'international'].includes(effectiveMarket);
  if (isWesternMarket) {
    const hasPhoto = /!\[.*?\]\(.*?\)|<img[^>]*>/i.test(markdown);
    const hasAge = /\b\d{1,2}\s*(?:岁|years?\s*old)\b/i.test(markdown) || /出生[年月于]/i.test(markdown) || /\b(?:DOB|Date of birth|Born in)\b/i.test(markdown);
    const hasMaritalOrGender = /(?:未婚|已婚|婚姻状况|性别|政治面貌|群众|党员|团员|国籍|籍贯|民族|Marital\s*Status|Gender|Sex|Nationality|Citizenship)\b/i.test(markdown);
    
    if (hasPhoto || hasAge || hasMaritalOrGender) {
      score -= 10;
      const detectedItems: string[] = [];
      if (hasPhoto) detectedItems.push(isEn ? 'Photo' : '证件照片');
      if (hasAge) detectedItems.push(isEn ? 'Age/DOB' : '年龄/出生年月');
      if (hasMaritalOrGender) detectedItems.push(isEn ? 'Marital/Gender/Nationality' : '婚姻/性别/国籍等');

      issues.push({
        type: 'warning',
        category: 'market',
        title: isEn
          ? `Market Guidance: Personal details to review (${detectedItems.join(', ')})`
          : `市场建议：检测到通常可省略的个人信息 (${detectedItems.join('、')})`,
        desc: isEn
          ? `For ${marketProfile.labelEn} resumes, details such as photos, age, marital status, and nationality are commonly omitted so the document stays focused on qualifications. Consider removing them unless they are relevant or specifically requested.`
          : `面向 ${marketProfile.labelZh} 求职时，照片、年龄、婚姻、国籍等个人信息通常可以省略，让简历更聚焦于专业资历。若岗位没有明确要求，可考虑移除。`,
        fixable: true,
        onFix: () => {
          const sanitized = sanitizeSensitiveFieldsForMarket(markdown);
          onUpdateMarkdown(sanitized.markdown, true);
        }
      });
    } else {
      issues.push({
        type: 'success',
        category: 'market',
        title: isEn ? 'Market Guidance: No discouraged personal details detected' : '市场建议：未发现通常可省略的个人信息',
        desc: isEn
          ? `No photo, age, or marital-status fields were detected. This is consistent with common ${marketProfile.labelEn} resume conventions.`
          : `未检测到照片、年龄、婚育等字段，符合 ${marketProfile.labelZh} 简历中常见的精简做法。`
      });
    }
  }

  // 4. Market Date Style Consistency Check
  const dateCheckResult = normalizeAllDatesInMarkdown(markdown, targetDateStyle, isEn);
  if (dateCheckResult.convertedCount > 0) {
    score -= 5;
    issues.push({
      type: 'warning',
      category: 'market',
      title: isEn 
        ? `Market Date Format: ${dateCheckResult.convertedCount} date range(s) can be normalized` 
        : `日期格式：发现 ${dateCheckResult.convertedCount} 处可统一为${marketProfile.labelZh}推荐格式`,
      desc: isEn 
        ? `Target market (${marketProfile.labelEn}) recommended date format is "${targetDateStyle}". Click Auto Fix to normalize the detected date ranges.`
        : `当前目标市场（${marketProfile.labelZh}）推荐采用「${targetDateStyle}」日期风格。点击智能修正可一键将简历内经历与教育时间全部统一。`,
      fixable: true,
      onFix: () => {
        onUpdateMarkdown(dateCheckResult.markdown, true);
      }
    });
  } else {
    issues.push({
      type: 'success',
      category: 'market',
      title: isEn ? `Market Date Format: Standardized (${targetDateStyle})` : `日期格式：已使用${marketProfile.labelZh}推荐格式`,
      desc: isEn 
        ? `All detected date ranges already use the selected ${targetDateStyle} style for ${marketProfile.labelEn}.`
        : `检测到的日期区间已使用 ${marketProfile.labelZh} 推荐的日期格式。`
    });
  }

  // 5. Template leftovers/placeholders check
  const placeholders = [
    '13800000000', '13812345678', 'your-email', 'your.email', 'yourgithub', 
    '【请在此处', '请替换', '[请填写', '某某公司', '某某大学', 'xxxx', 'XXXX'
  ];
  const foundPlaceholders = placeholders.filter(p => markdown.includes(p));
  
  if (foundPlaceholders.length === 0) {
    issues.push({
      type: 'success',
      category: 'content',
      title: isEn ? 'Content Compliance: No template placeholders found' : '内容合规：未发现模版残留文本',
      desc: isEn 
        ? 'All template tags and brackets have been replaced successfully.'
        : '简历中的占位文本和模版标签已全部替换完毕。'
    });
  } else {
    score -= (foundPlaceholders.length * 8);
    issues.push({
      type: 'error',
      category: 'content',
      title: isEn ? `Content Warning: Found ${foundPlaceholders.length} template leftovers` : `内容警告：存在 ${foundPlaceholders.length} 处模版残留`,
      desc: isEn 
        ? `Placeholder fields detected: ${foundPlaceholders.map(p => `"${p}"`).join(', ')}. Please update them with your real information!`
        : `检测到模版残留字段: ${foundPlaceholders.map(p => `"${p}"`).join(', ')}。请尽快将它们修改为您自己的真实信息！`,
    });
  }

  // 6. Quantifiable metrics evaluation
  const metricWords = ['%', '％', '万', '亿', '倍', '提升', '增长', '降低', '优化', '减少', '节省', '达到', 'ms', 'qps', 'tps', 'rps', 'gb', 'tb', 'pb'];
  let metricCount = 0;
  const lines = markdown.split('\n');
  lines.forEach(line => {
    let lineHasMetric = false;
    if (/\d+(?:\.\d+)?(?:%|％|万|亿|倍|x|k|m|\$|¥|€|£)/i.test(line)) lineHasMetric = true;
    if (/\b\d+(?:\.\d+)?\s*(?:ms|s|qps|tps|rps|gb|tb|pb)\b/i.test(line)) lineHasMetric = true;
    metricWords.forEach(w => {
      if (line.toLowerCase().includes(w.toLowerCase())) lineHasMetric = true;
    });
    if (lineHasMetric) metricCount++;
  });

  if (metricCount >= 5) {
    issues.push({
      type: 'success',
      category: 'content',
      title: isEn ? `Quantified Results: Excellent (${metricCount} data metrics)` : `量化成果：丰富 (${metricCount} 处数据指标)`,
      desc: isEn 
        ? 'Your resume integrates rich metrics and quantified achievements, making it highly persuasive and professional!'
        : '您的简历在职责和项目中融入了丰富的数据指标和成果描述，非常专业且具说服力！'
    });
  } else if (metricCount >= 1) {
    score -= 5;
    issues.push({
      type: 'warning',
      category: 'content',
      title: isEn ? `Quantified Results: Slightly thin (${metricCount} metric(s))` : `量化成果：稍显薄弱 (${metricCount} 处指标)`,
      desc: isEn 
        ? 'Some metrics or numbers are present but limited. Consider specifying achievements (e.g., "boosted throughput by 30%", "shortened dev cycles by 2 weeks").'
        : '简历中包含了一些数据或动词，但较少。建议补充具体业绩，如：「高并发处理提升30%」、「研发周期缩短2周」等。'
    });
  } else {
    score -= 15;
    issues.push({
      type: 'error',
      category: 'content',
      title: isEn ? 'Quantified Results: Extremely scarce (no metric data)' : '量化成果：极度匮乏 (无数据支持)',
      desc: isEn 
        ? 'No metrics or business achievements detected. Professional resumes should follow the STAR methodology, including quantified metrics to prove your impact.'
        : '未检测到具体的业务指标或量化结果。优秀的简历遵循 STAR 法则，必须包含具体的数值（如百分比、资金、效率提升等）来证明成效。'
    });
  }

  // 7. Action Verbs analysis (Bilingual)
  const actionVerbsZh = ['负责', '主导', '重构', '重写', '设计', '架构', '编写', '实现', '优化', '搭建', '协调', '落地', '推行', '维护', '驱动', '研发', '带领', '攻坚'];
  const actionVerbsEn = ['spearheaded', 'architected', 'engineered', 'designed', 'developed', 'implemented', 'orchestrated', 'optimized', 'accelerated', 'streamlined', 'directed', 'executed', 'managed', 'led', 'formulated', 'built', 'deployed', 'reduced', 'increased', 'boosted', 'scaled'];
  
  const foundVerbsZh = actionVerbsZh.filter(v => markdown.includes(v));
  const foundVerbsEn = actionVerbsEn.filter(v => new RegExp(`\\b${v}\\b`, 'i').test(markdown));
  const totalFoundVerbsCount = foundVerbsZh.length + foundVerbsEn.length;

  if (totalFoundVerbsCount >= 6) {
    issues.push({
      type: 'success',
      category: 'content',
      title: isEn ? `Action Verbs: Excellent (${totalFoundVerbsCount} strong verbs used)` : `专业动词：表现极佳 (已使用 ${totalFoundVerbsCount} 个强动词)`,
      desc: isEn 
        ? `Uses strong action-oriented verbs, effectively demonstrating your leadership and engineering ownership.`
        : '使用了丰富的专业行动词汇，能很好地展示您的专业深度与业务担当。'
    });
  } else if (totalFoundVerbsCount >= 2) {
    score -= 5;
    issues.push({
      type: 'warning',
      category: 'content',
      title: isEn ? `Action Verbs: Recommended to add (only ${totalFoundVerbsCount} verb(s) found)` : `专业动词：建议补充 (仅发现 ${totalFoundVerbsCount} 个动词)`,
      desc: isEn 
        ? 'Consider starting your experience items with dynamic action verbs (e.g., refactored, spearheaded, optimized) rather than generic words like "worked on" or "responsible for".'
        : `建议更多地使用强有力的行动词汇（例如：重构、主导、独立设计、优化等）作为每项工作描述的开头，避免单一使用「负责」或「做过」。`
    });
  } else {
    score -= 15;
    issues.push({
      type: 'error',
      category: 'content',
      title: isEn ? 'Action Verbs: Flat descriptions' : '专业动词：动作描述苍白',
      desc: isEn 
        ? 'Almost no professional action verbs detected. Use words like "spearheaded", "engineered", or "architected" to highlight technical competence.'
        : '简历中几乎没有检测到专业的行业行动词汇。请在工作/项目经历开头使用诸如「搭建...」、「重构...」、「主导研发...」来彰显专业深度。'
    });
  }

  // 8. Page split control
  const pureContent = markdown
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/[#*`_~>[\]()-]/g, '')
    .replace(/\s+/g, '')
    .trim();
  const pureCharCount = pureContent.length;
  const hasPageBreak = /<!--\s*pagebreak\s*-->/gi.test(markdown);
  
  if (pureCharCount > 2400) {
    if (hasPageBreak) {
      issues.push({
        type: 'success',
        category: 'formatting',
        title: isEn ? 'Layout Control: Manual pagebreak used' : '排版控制：已使用分页符',
        desc: isEn
          ? 'Your resume is relatively long and includes a manual page break. Confirm the final page split in Preview before exporting.'
          : '简历内容较长，并已使用手动分页符。导出前建议在预览中确认最终分页位置。'
      });
    } else {
      score -= 10;
      issues.push({
        type: 'warning',
        category: 'formatting',
        title: isEn ? 'Layout Warning: Pagebreak recommended' : '排版警告：建议插入分页符',
        desc: isEn
          ? 'Your resume has a high content count. Review the measured page count in Preview; if a section splits awkwardly, a manual "<!-- pagebreak -->" can help control the break.'
          : '当前简历内容较多。建议先在预览中查看实际页数；如果章节跨页位置不理想，可使用「<!-- pagebreak -->」手动控制分页。',
        fixable: true,
        onFix: () => {
          const linesArr = markdown.split('\n');
          let insertIdx = -1;
          for (let i = Math.floor(linesArr.length * 0.45); i < linesArr.length; i++) {
            if (linesArr[i].trim().startsWith('## ')) {
              insertIdx = i;
              break;
            }
          }
          if (insertIdx !== -1) {
            linesArr.splice(insertIdx, 0, '<!-- pagebreak -->');
            onUpdateMarkdown(linesArr.join('\n'), true);
          } else {
            onUpdateMarkdown(markdown + '\n\n<!-- pagebreak -->\n', true);
          }
        }
      });
    }
  } else {
    issues.push({
      type: 'success',
      category: 'formatting',
      title: isEn ? 'Layout Control: Moderate content length' : '排版控制：内容长度适中',
      desc: isEn
        ? 'The content length does not trigger the long-resume heuristic. Confirm the actual page count in Preview before exporting.'
        : '当前内容长度未触发长简历提醒。导出前仍建议以预览中的实际页数为准。'
    });
  }

  // 9. First-person pronoun audit
  const pronounRegex = isEn
    ? /\b(?:I|[Ww]e|[Mm]y|[Oo]ur|[Mm]yself|[Oo]urselves)\b/g
    : /我(?:们)?|自己/g;
  const pronounMatches = markdown.match(pronounRegex) || [];
  const pronounCount = pronounMatches.length;
  const hasFixableEnglishPronoun = /^(\s*[-*+]\s+)(?:I|[Ww]e)\s+/m.test(markdown);

  if (pronounCount > 0) {
    score -= Math.min(15, pronounCount * 3);
    issues.push({
      type: 'warning',
      category: 'content',
      title: isEn ? `First-person Pronouns: Detected ${pronounCount} instance(s)` : `主观人称：检测到 ${pronounCount} 处第一人称表达`,
      desc: isEn
        ? 'Resume bullets are usually more concise when they begin directly with an action verb instead of first-person pronouns such as "I" or "we".'
        : '简历条目通常直接以行动词开头更简洁，可减少“我”“我们”“自己”等第一人称表达。',
      fixable: isEn ? hasFixableEnglishPronoun : true,
      onFix: () => {
        let fixed = markdown;

        if (isEn) {
          fixed = fixed.replace(/^(\s*[-*+]\s+)(?:I|[Ww]e)\s+/gm, '$1');
        } else {
          fixed = fixed.replace(/^-\s*我负责了/gm, '- 负责');
          fixed = fixed.replace(/^-\s*我负责/gm, '- 负责');
          fixed = fixed.replace(/^-\s*我自己主导了/gm, '- 主导');
          fixed = fixed.replace(/^-\s*我自己主导/gm, '- 主导');
          fixed = fixed.replace(/^-\s*我主导了/gm, '- 主导');
          fixed = fixed.replace(/^-\s*我主导/gm, '- 主导');
          fixed = fixed.replace(/^-\s*我完成了/gm, '- 完成');
          fixed = fixed.replace(/^-\s*我完成/gm, '- 完成');
          fixed = fixed.replace(/^-\s*我参与了/gm, '- 参与');
          fixed = fixed.replace(/^-\s*我参与/gm, '- 参与');
          fixed = fixed.replace(/^-\s*我/gm, '- ');
          fixed = fixed.replace(/^-\s*自己/gm, '- ');
          fixed = fixed.replace(/^-\s*我们/gm, '- ');
        }

        onUpdateMarkdown(fixed, true);
      }
    });
  } else {
    issues.push({
      type: 'success',
      category: 'content',
      title: isEn ? 'First-person Pronouns: None detected' : '主观人称：未检测到第一人称表达',
      desc: isEn
        ? 'No first-person pronouns were detected in the resume text.'
        : '未检测到“我”“我们”“自己”等第一人称表达。'
    });
  }

  // 10. CJK Spacing Audit
  const formattedText = formatChineseEnglishSpacing(markdown);
  const missingSpacesCount = formattedText.length - markdown.length;

  if (missingSpacesCount > 0) {
    score -= 10;
    issues.push({
      type: 'warning',
      category: 'formatting',
      title: isEn ? `Typography: Found ${missingSpacesCount} missing spaces (CN/EN)` : `排版美化：发现 ${missingSpacesCount} 处中英/数字缺少空格`,
      desc: isEn 
        ? 'Adding a space between Chinese characters, English words, and numbers is standard practice, greatly enhancing readability (e.g., "React开发" to "React 开发").'
        : '中英文、数字混排时，在它们之间添加一个半角空格是标准的专业排版规范（例如：“React开发” 优化为 “React 开发”），能极大提升视觉易读性。',
      fixable: true,
      onFix: () => {
        onUpdateMarkdown(formattedText, true);
      }
    });
  } else {
    issues.push({
      type: 'success',
      category: 'formatting',
      title: isEn ? 'Typography: Perfect spacing formatting' : '排版美化：中英混排格式完美',
      desc: isEn 
        ? 'All Chinese characters, English words, and numbers are separated by standard half-width spaces. Clean and professional!'
        : '简历中的中文、英文以及数字之间均有标准的半角空格分隔，视觉排版极其舒适和专业。'
    });
  }

  // 11. ATS Compatibility Check
  const hasEmojis = /[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu.test(markdown);
  const hasTables = /\|.+\|.+\|/g.test(markdown);

  if (hasEmojis || hasTables) {
    score -= 5;
    let descParts: string[] = [];
    if (hasEmojis) {
      descParts.push(isEn 
        ? 'Emojis or non-standard graphics detected. Applicant Tracking Systems (ATS) may misinterpret them as scrambled characters; suggest using standard list points "-".'
        : '检测到简历中含有彩色表情符号或生僻图形。大厂 ATS（申请人跟踪系统）机器读取时可能将其识别为乱码或导致周围文本解析错误，建议仅使用常规列表圆点「-」或「·」作为前缀。');
    }
    if (hasTables) {
      descParts.push(isEn 
        ? 'Markdown tables detected. Some ATS parsers may flatten or reorder table content. Consider rebuilding them as standard resume items.'
        : '检测到 Markdown 表格。部分 ATS 在解析表格时可能出现内容顺序变化或字段合并，建议改为标准经历条目。');
    }
    issues.push({
      type: 'warning',
      category: 'ats',
      title: isEn ? 'ATS Friendliness: Potential parsing risks detected' : 'ATS 友好度：检测到潜在解析风险',
      desc: descParts.join(' ')
    });
  } else {
    issues.push({
      type: 'success',
      category: 'ats',
      title: isEn ? 'ATS Friendliness: No obvious parsing risks detected' : 'ATS 友好度：未发现明显解析风险',
      desc: isEn
        ? 'No emojis or Markdown tables were detected. This reduces common machine-readability risks, though behavior still varies across ATS products.'
        : '未检测到表情符号或 Markdown 表格，可减少常见的机器解析风险；不同 ATS 产品的实际解析结果仍可能存在差异。'
    });
  }

  // 12. English Verb Tense Verification
  const model = parseMarkdownToForm(markdown);
  let pastTenseInconsistency = false;
  let checkedRolesCount = 0;
  const offendingOrgs: string[] = [];
  const englishPresentRegex = /^\s*-\s*\b(develop|lead|manage|create|build|optimize|implement|design|write|coordinate|maintain|support|solve|analyze|execute|deploy|integrate)\b/i;

  model.sections.forEach(sec => {
    if (sec.type === 'items') {
      sec.items.forEach(item => {
        const hasEnglishBullets = /-\s*[a-zA-Z]{3,}/.test(item.content);
        if (hasEnglishBullets && item.time) {
          const isPastExperience = !/(至今|现在|present|Present|now)/i.test(item.time);
          if (isPastExperience) {
            checkedRolesCount++;
            const itemLines = item.content.split('\n');
            const hasPresentVerb = itemLines.some(l => englishPresentRegex.test(l));
            if (hasPresentVerb) {
              pastTenseInconsistency = true;
              if (item.org && !offendingOrgs.includes(item.org)) {
                offendingOrgs.push(item.org);
              }
            }
          }
        }
      });
    }
  });

  if (pastTenseInconsistency) {
    score -= 5;
    issues.push({
      type: 'warning',
      category: 'content',
      title: isEn ? 'Tense Agreement: Suggest using past tense for past roles' : '时态规范：已结束经历建议采用过去式动词',
      desc: isEn 
        ? `Detected present tense verbs (e.g., Develop, Lead) in your past experience items (e.g., ${offendingOrgs.join(', ')}). Past roles should consistently use past tense verbs (e.g., Developed, Led).`
        : `检测到已结束的工作/项目经历（如：${offendingOrgs.join('、')}）的英文描述中含有现在时行动词（例如：Develop, Lead）。根据专业英文简历规范，已经结束的经历中所有行为条目应当统一使用过去式动词开头（例如：将 Develop 改为 Developed，Lead 改为 Led）。`
    });
  } else if (checkedRolesCount > 0) {
    issues.push({
      type: 'success',
      category: 'content',
      title: isEn ? 'Tense Agreement: Perfect verbs tense consistency' : '时态规范：英文经历动作时态高度一致',
      desc: isEn 
        ? 'All past roles use past tense action verbs perfectly, demonstrating excellent professional rigor.'
        : '所有已结束经历的英文动作条目均正确采用过去式行动词，时态规范完美，彰显出极佳的求职专业度。'
    });
  }
  
  const finalScore = Math.max(25, Math.min(100, score));

  const sortedIssues = [...issues].sort((a, b) => {
    const priority = { error: 0, warning: 1, success: 2 };
    return priority[a.type] - priority[b.type];
  });

  return {
    score: finalScore,
    issues: sortedIssues,
    hasPlaceholders: foundPlaceholders.length > 0,
    metricCount,
    foundVerbsCount: totalFoundVerbsCount,
    marketRegion: effectiveMarket,
    marketLabel: isEn ? marketProfile.labelEn : marketProfile.labelZh,
  };
}
