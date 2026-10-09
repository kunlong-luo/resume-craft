import { describe, it, expect } from 'vitest';
import {
  isTimeString,
  splitItemTitle,
  formatPhoneNumber,
  parseContactString,
  parseExperienceField,
  serializeExperienceField,
  parseMarkdownToForm,
  parseFormToMarkdown
} from '../lib/markdown-parser';
import { parseBasicInfoMetadata, parseResumeHeader } from '../lib/preview-utils';
import { TEMPLATES } from '../data';

describe('markdown-parser', () => {
  describe('isTimeString', () => {
    it('should identify valid time strings', () => {
      expect(isTimeString('2021.09 - 2025.06')).toBe(true);
      expect(isTimeString('2023.03 — 至今')).toBe(true);
      expect(isTimeString('2020 - Present')).toBe(true);
      expect(isTimeString('2022年毕业')).toBe(true);
      expect(isTimeString('高级前端工程师')).toBe(false);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should preserve local phone numbers when no country or region is known', () => {
      expect(formatPhoneNumber('13800138000')).toBe('13800138000');
    });

    it('should format +86 prefix numbers', () => {
      expect(formatPhoneNumber('+8613800138000')).toBe('+86 138 0013 8000');
    });

    it('should preserve ambiguous local landline numbers', () => {
      expect(formatPhoneNumber('01088888888')).toBe('01088888888');
      expect(formatPhoneNumber('057188888888')).toBe('057188888888');
    });

    it('should not assume a 10-digit local number belongs to the US', () => {
      expect(formatPhoneNumber('2125551234')).toBe('2125551234');
    });
  });

  describe('splitItemTitle', () => {
    it('should parse org, degree, role and time', () => {
      const res = splitItemTitle('浙江大学 ｜ 硕士 ｜ 计算机科学与技术 ｜ *2021.09 — 2024.06*');
      expect(res.org).toBe('浙江大学');
      expect(res.degree).toBe('硕士');
      expect(res.role).toBe('计算机科学与技术');
      expect(res.time).toContain('2021.09 — 2024.06');
    });

    it('should parse company and role with time', () => {
      const res = splitItemTitle('阿里巴巴 ｜ 资深前端开发专家 ｜ 2021.06 - 至今');
      expect(res.org).toBe('阿里巴巴');
      expect(res.role).toBe('资深前端开发专家');
      expect(res.time).toBe('2021.06 - 至今');
    });

    it('should preserve full project name containing hyphens with explicit pipe role', () => {
      const res = splitItemTitle(
        'FlexAgent - 开源大模型多Agent低代码编排系统 ｜ 独立作者与主导设计 ｜ *2025.01 — 至今*'
      );
      expect(res.org).toBe('FlexAgent - 开源大模型多Agent低代码编排系统');
      expect(res.role).toBe('独立作者与主导设计');
      expect(res.time).toContain('2025.01 — 至今');
    });

    it('should preserve full project name containing hyphens without explicit role', () => {
      const res = splitItemTitle(
        'FlexAgent - 开源大模型多Agent低代码编排系统 *2025.01 — 至今*'
      );
      expect(res.org).toBe('FlexAgent - 开源大模型多Agent低代码编排系统');
      expect(res.role).toBe('');
      expect(res.time).toContain('2025.01 — 至今');
    });
  });

  describe('parseResumeHeader contact preservation', () => {
    it('preserves underscores in email addresses and social handles', () => {
      const parsed = parseResumeHeader([
        '# 罗昆龙',
        '高级后端工程师',
        'kunlong_luo@163.com · GitHub: kunlong_luo · LinkedIn: kunlong_luo',
        '',
        '## 工作经历',
        '- 示例内容',
      ].join('\n'));

      expect(parsed.contacts).toContain('kunlong_luo@163.com');
      expect(parsed.contacts).toContain('GitHub: kunlong_luo');
      expect(parsed.contacts).toContain('LinkedIn: kunlong_luo');
    });

    it('removes only outer markdown emphasis around a contact token', () => {
      const parsed = parseResumeHeader([
        '# Candidate',
        'Software Engineer',
        '**dev_user@example.com** · _GitHub: dev_user_',
        '',
        '## Experience',
        '- Built a service',
      ].join('\n'));

      expect(parsed.contacts).toContain('dev_user@example.com');
      expect(parsed.contacts).toContain('GitHub: dev_user');
    });
  });

  describe('parseContactString', () => {
    it('should extract email, phone and social accounts', () => {
      const parsed = parseContactString('13800138000 · test@example.com · github.com/user · 微信: mywechat');
      expect(parsed.email).toBe('test@example.com');
      expect(parsed.phone).toBe('13800138000');
      expect(parsed.wechat).toBe('mywechat');
      expect(parsed.social).toContain('github.com/user');
    });

    it('should keep an inline city separate from social links', () => {
      const parsed = parseContactString(
        'alex@example.com | San Francisco, CA | [GitHub](https://github.com/alex)',
      );

      expect(parsed.email).toBe('alex@example.com');
      expect(parsed.city).toBe('San Francisco, CA');
      expect(parsed.social).toBe('[GitHub](https://github.com/alex)');
    });

    it('should not classify social URLs containing city names as locations', () => {
      const parsed = parseContactString(
        'alex@example.com | [GitHub](https://github.com/seattle-dev)',
      );

      expect(parsed.city).toBe('');
      expect(parsed.social).toBe('[GitHub](https://github.com/seattle-dev)');

      const labelLike = parseContactString('alex@example.com | Remote, GitHub');
      expect(labelLike.city).toBe('');
      expect(labelLike.social).toBe('Remote · GitHub');
    });
  });

  describe('parseExperienceField & serializeExperienceField', () => {
    it('should parse experience tags correctly', () => {
      const parsed = parseExperienceField('5年经验 ｜ 硕士 ｜ 28岁 ｜ 杭州 / 上海 ｜ 在职-随时到岗');
      expect(parsed.workYears).toBe('5年经验');
      expect(parsed.degree).toBe('硕士');
      expect(parsed.age).toBe('28');
      expect(parsed.city).toContain('杭州');
      expect(parsed.jobStatus).toBe('在职-随时到岗');
    });

    it('should serialize experience correctly', () => {
      const serialized = serializeExperienceField({
        workYears: '3年经验',
        degree: '本科',
        age: '25',
        city: '北京',
        jobStatus: '随时到岗'
      });
      expect(serialized).toBe('3年经验 ｜ 本科 ｜ 25 ｜ 北京 ｜ 随时到岗');
    });
  });

  describe('inline header location parsing', () => {
    it('preserves city metadata when location shares the contact line', () => {
      const form = parseMarkdownToForm(`# Alex Morgan
> **Senior Cloud Architect**
alex@example.com | San Francisco, CA | [GitHub](https://github.com/alexmorgan)

## Skills

- TypeScript
`);

      expect(form.city).toBe('San Francisco, CA');
      expect(form.social).toBe('[GitHub](https://github.com/alexmorgan)');
    });

    it('preserves a Chinese city when it shares the contact line', () => {
      const form = parseMarkdownToForm(`# 李明
高级前端工程师
liming@example.com | 杭州 | 微信: liming_dev

## 技能

- TypeScript
`);

      expect(form.city).toBe('杭州');
      expect(form.wechat).toBe('liming_dev');
    });
  });

  describe('Bi-directional Markdown <-> Form roundtrip', () => {
    it('should parse markdown and serialize back preserving key data', () => {
      const sampleMd = `# 张三
高级全栈工程师
138 0013 8000 · zhangsan@example.com · github.com/zhangsan · 微信: zhangsan_dev
5年经验 ｜ 硕士 ｜ 28 ｜ 杭州 ｜ 随时到岗

## 工作经历

### 字节跳动 ｜ 资深前端工程师 ｜ *2022.03 — 至今*
- 负责抖音电商核心结算架构升级
- 优化前端性能与监控指标

## 教育背景

### 浙江大学 ｜ 硕士 ｜ 计算机科学 ｜ *2019.09 — 2022.03*
- **在校表现**：GPA 3.9 / 专业前 5%
- **主修课程**：分布式计算、高级算法
`;

      const form = parseMarkdownToForm(sampleMd);
      expect(form.name).toBe('张三');
      expect(form.subtitle).toBe('高级全栈工程师');
      expect(form.phone).toBe('138 0013 8000');
      expect(form.email).toBe('zhangsan@example.com');
      expect(form.sections.length).toBe(2);

      const generatedMd = parseFormToMarkdown(form);
      expect(generatedMd).toContain('# 张三');
      expect(generatedMd).toContain('## 工作经历');
      expect(generatedMd).toContain('字节跳动');
      expect(generatedMd).toContain('## 教育背景');
      expect(generatedMd).toContain('浙江大学');
    });
  });

  describe('project field normalization', () => {
    it('extracts a legacy project-role line into the structured role field', () => {
      const legacyMd = `# 张三
后端工程师

## 代表项目

### Ares 智能体服务路由网关系统　*2025.02 — 至今*
- **项目角色：** 独立架构师与全栈设计人
- **技术选型：** Spring Cloud Alibaba, Spring AI, pgvector
- **核心贡献：**
  - 从零研发高并发智能体编排与 API 路由系统。
`;

      const form = parseMarkdownToForm(legacyMd);
      const projectSection = form.sections.find(section => section.title === '代表项目');
      const project = projectSection?.items[0];

      expect(project?.org).toBe('Ares 智能体服务路由网关系统');
      expect(project?.role).toBe('独立架构师与全栈设计人');
      expect(project?.content).not.toContain('项目角色');
      expect(project?.content).toContain('技术选型');

      const generatedMd = parseFormToMarkdown(form);
      expect(generatedMd).toContain(
        '### Ares 智能体服务路由网关系统 ｜ 独立架构师与全栈设计人 ｜ *2025.02 — 至今*',
      );
      expect(generatedMd).not.toContain('- **项目角色：**');
    });

    it('keeps built-in template project roles out of the description body', () => {
      for (const template of TEMPLATES) {
        expect(template.content).not.toMatch(/^- \*\*项目角色[：:]\*\*/m);
      }
    });

    it('parses and roundtrips the full FlexAgent project name in the frontend template', () => {
      const frontendTpl = TEMPLATES.find(t => t.id === 'frontend')!;
      expect(frontendTpl).toBeDefined();

      const form = parseMarkdownToForm(frontendTpl.content);
      const projectSec = form.sections.find(s => s.title.includes('项目'));
      expect(projectSec).toBeDefined();

      const flexItem = projectSec?.items.find(item => item.org.includes('FlexAgent'));
      expect(flexItem).toBeDefined();
      expect(flexItem?.org).toBe('FlexAgent - 开源大模型多Agent低代码编排系统');
      expect(flexItem?.role).toBe('独立作者与主导设计');

      const regeneratedMd = parseFormToMarkdown(form);
      expect(regeneratedMd).toContain(
        '### FlexAgent - 开源大模型多Agent低代码编排系统 ｜ 独立作者与主导设计 ｜ *2025.01 — 至今*'
      );
    });
  });

  describe('parseBasicInfoMetadata', () => {
    it('should correctly parse standard pipe-separated profile line', () => {
      const items = parseBasicInfoMetadata('7年工作经验 ｜ 本科 ｜ 29 ｜ 杭州 · 远程 ｜ 随时到岗');
      expect(items.length).toBe(5);
      
      const expItem = items.find(i => i.type === 'exp');
      expect(expItem?.text).toBe('7年工作经验');

      const degreeItem = items.find(i => i.type === 'degree');
      expect(degreeItem?.text).toBe('本科');

      const ageItem = items.find(i => i.type === 'age');
      expect(ageItem?.text).toBe('29岁');

      const locItem = items.find(i => i.type === 'location');
      expect(locItem?.text).toBe('杭州 · 远程');

      const statusItem = items.find(i => i.type === 'status');
      expect(statusItem?.text).toBe('随时到岗');
      expect(statusItem?.statusType).toBe('available');
    });

    it('should handle unstructured space-separated line with bare numbers like "本科 9 杭州 远程 随时到岗"', () => {
      const items = parseBasicInfoMetadata('本科 9 杭州 远程 随时到岗');
      
      const degreeItem = items.find(i => i.type === 'degree');
      expect(degreeItem?.text).toBe('本科');

      const expItem = items.find(i => i.type === 'exp');
      expect(expItem?.text).toBe('9年工作经验');

      const locItem = items.find(i => i.type === 'location');
      expect(locItem?.text).toBe('杭州 · 远程');

      const statusItem = items.find(i => i.type === 'status');
      expect(statusItem?.text).toBe('随时到岗');
      expect(statusItem?.statusType).toBe('available');
    });

    it('should handle considering status and english locale', () => {
      const items = parseBasicInfoMetadata('5年经验 ｜ 硕士 ｜ 28岁 ｜ 深圳 / 广州 ｜ 在职-考虑机会');
      const statusItem = items.find(i => i.type === 'status');
      expect(statusItem?.statusType).toBe('considering');

      const enItems = parseBasicInfoMetadata('5 Years Exp | Master | 28 | Seattle | Open to work', 'en');
      const ageEn = enItems.find(i => i.type === 'age');
      expect(ageEn?.text).toBe('28 yrs');
    });
  });
});

