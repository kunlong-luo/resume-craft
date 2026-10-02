
import { FormItem, FormSection } from './form-types';

export const getPresetSection = (presetType: string, lang = 'zh'): Omit<FormSection, 'id'> => {
  const isEn = lang === 'en';
  let title = '';
  let type: 'text' | 'items' = 'items';
  let textValue = '';
  let items: FormItem[] = [];

  const now = Date.now();

  switch (presetType) {
    case 'work':
      title = isEn ? 'Work Experience' : '工作经历';
      type = 'items';
      items = [{
        id: `item_${now}_1`,
        org: isEn ? 'Company / Enterprise Name' : '企业或公司名称',
        role: isEn ? 'Role / Title' : '职位角色',
        time: isEn ? '2023.01 - Present' : '2023.01 — 至今',
        content: isEn 
          ? '- **Key Responsibilities**: Managed and led...\n- **Core Achievements**: Tackled...\n- **Quantifiable Results**: Achieved ...% improvement'
          : '- **工作职责**：负责并主导...\n- **关键业绩**：攻克了...\n- **量化结果**：带来了...% 提升'
      }];
      break;
    case 'project':
      title = isEn ? 'Projects' : '代表项目';
      type = 'items';
      items = [{
        id: `item_${now}_1`,
        org: isEn ? 'Project Name' : '项目名称',
        role: isEn ? 'Project Role' : '项目角色',
        time: isEn ? '2024.01 - 2024.06' : '2024.01 — 2024.06',
        content: isEn
          ? '- **[Situation]**: Describe the background, performance bottlenecks, or business requirements.\n- **[Task]**: Clarify the core modules you were responsible for and specific target metrics.\n- **[Action]**: Elaborate on the architecture refactoring, optimization techniques, design patterns, or high-concurrency components applied.\n- **[Result]**: List the final quantitative outcome (e.g., response latency reduced by ...%, QPS increased).'
          : '- **[Situation]**：描述项目产生的背景，当前面临的主要性能瓶颈和业务需求\n- **[Task]**：明确你在项目里负责攻克的核心模块以及设立的具体调优指标\n- **[Action]**：详细写你主导了什么架构改造，使用了哪些优化手段、设计模式和高并发组件\n- **[Result]**：列出项目上线后的最终量化成效，比如核心响应延迟降低...%，QPS提升...% 或者是按期高质量交付'
      }];
      break;
    case 'edu':
      title = isEn ? 'Education' : '教育背景';
      type = 'items';
      items = [{
        id: `item_${now}_1`,
        org: isEn ? 'Institution / School Name' : '学校或研究机构名称',
        degree: isEn ? 'Bachelor' : '本科',
        role: isEn ? 'Major / Study Field' : '专业或学科名称',
        time: isEn ? '2020.09 - 2024.06' : '2020.09 — 2024.06',
        content: isEn
          ? '- **Academic Performance**: GPA 3.8/4.0, First-Class Scholarship\n- **Core Courses**: Majored in Computer Networks, Advanced Data Structures, Algorithms, etc.'
          : '- **在校成绩**：绩点 GPA 3.8/4.0，获得一等奖学金\n- **学术经历**：主修计算机网络、高级数据结构、算法分析等核心领域'
      }];
      break;
    case 'skills':
      title = isEn ? 'Skills' : '专业技能';
      type = 'text';
      textValue = isEn
        ? '- **Frontend**: Proficient in React, TypeScript, Tailwind CSS, Next.js, and main frontend toolchains.\n- **Backend**: Proficient in Node.js / Java / Go with practical experience in Redis caching and high-concurrency scenarios.\n- **Engineering**: Emphasize team standards, CI/CD, and Git workflows.'
        : '- **前端开发**：熟练掌握 React, TypeScript, Tailwind CSS, Next.js 等主流工程技术栈\n- **后端技术**：熟练掌握 Node.js / Java / Go 开发，对 Redis 缓存设计与高并发场景处理有实践心得\n- **工程素养**：注重团队规范协作，熟练掌握 CI/CD 与 Git 工作流体系';
      break;
    case 'summary':
      title = isEn ? 'Summary' : '个人优势';
      type = 'text';
      textValue = isEn
        ? 'Experienced software engineer with X years of practical experience in high-concurrency internet projects. Passionate about solving technical challenges and improving development efficiency. Excellent collaboration and communication skills.'
        : '具备 X 年专业互联网项目实践经验，热衷技术攻关与效率改善。具备良好的团队协作、跨领域沟通素养以及持续深耕的业务理解力，能承受高强度的技术攻关。';
      break;
    case 'custom_text':
      title = isEn ? 'Custom Text Section' : '自定义文本模块';
      type = 'text';
      textValue = isEn
        ? '- Highlight point 1\n- Highlight point 2'
        : '- 优势要点描述 1\n- 优势要点描述 2';
      break;
    case 'custom_items':
      title = isEn ? 'Custom List Section' : '自定义经历模块';
      type = 'items';
      items = [{
        id: `item_${now}_1`,
        org: isEn ? 'Organization or Project Name' : '组织或项目名称',
        role: isEn ? 'Role / Responsibility' : '担任角色',
        time: isEn ? '2024.01 - Present' : '2024.01 — 至今',
        content: isEn
          ? '- Detail description 1\n- Detail description 2'
          : '- 核心细节内容描述 1\n- 核心细节内容描述 2'
      }];
      break;
  }

  return { title, type, textValue, items };
};

export const getStarTemplate = (sectionTitle: string, lang = 'zh'): Partial<FormItem> => {
  const isEn = lang === 'en';
  const category = sectionTitle.includes('教育') || sectionTitle.includes('学校') || sectionTitle.includes('本科') || sectionTitle.includes('硕士') || sectionTitle.includes('博士') || sectionTitle.toLowerCase().includes('education') || sectionTitle.toLowerCase().includes('academic') ? 'edu' :
                   sectionTitle.includes('项目') || sectionTitle.includes('产品') || sectionTitle.includes('开源') || sectionTitle.toLowerCase().includes('project') || sectionTitle.toLowerCase().includes('portfolio') ? 'project' :
                   sectionTitle.includes('工作') || sectionTitle.includes('经历') || sectionTitle.includes('实习') || sectionTitle.toLowerCase().includes('work') || sectionTitle.toLowerCase().includes('experience') || sectionTitle.toLowerCase().includes('career') ? 'work' : 'default';

  if (category === 'edu') {
    return { 
      gpa: isEn ? 'GPA 3.8/4.0, Top 5% in major for 3 consecutive years' : '绩点 GPA 3.8/4.0，连续三年专业前 5%',
      courses: isEn ? 'Data Structures & Algorithms, Computer Networks, Operating Systems, Distributed Systems' : '数据结构与算法分析、计算机网络、操作系统、分布式架构设计',
      honors: isEn ? 'National Scholarship, First-Class Scholarship' : '国家奖学金、校一等奖学金',
      content: isEn
        ? '- **Academics**: Participated in Provincial Key Lab projects, in charge of core module design\n- **Campus Activity**: President of Computer Association, organized 3 campus-wide coding competitions'
        : '- **科研学术**：参与省重点实验室项目，负责核心模块设计\n- **校园实践**：担任计算机协会会长，成功筹备 3 场全校算法挑战赛' 
    };
  } else if (category === 'project') {
    return { 
      content: isEn
        ? `- **[Situation]**: Under peak QPS of 10,000, the legacy payment system encountered lag and high latency, causing payment conversion rate to drop by 12%\n- **[Task]**: As lead backend engineer, responsible for rebuilding the processing pipeline to bring down average latency below 300ms in 2 months\n- **[Action]**: 1. Disintegrated legacy monolith into microservices using Spring Cloud; 2. Optimized slow SQL queries and introduced Redis write-back/caching\n- **[Result]**: Reduced core latency from 3.5s to 0.2s, supported Double-11 shopping festival with zero downtime, and increased payment conversion rate by 14%`
        : `- **[Situation 业务背景]**：在并发量达万级时，原有支付系统出现大面积卡顿和高耗时问题，导致订单流失率上升了 12%\n- **[Task 核心任务]**：作为主程负责链路重构，在 2 个月内完成性能调优，将平均延迟控制在 300ms 以内\n- **[Action 关键行动]**：1. 使用 Spring Cloud 核心组件做微服务拆分；2. 优化慢 SQL 并对热点数据进行 Redis 强缓存设计\n- **[Result 实际产出]**：核心响应耗时从 3.5s 降至 0.2s，双十一并发高峰零故障，核心订单转化率提升 14%` 
    };
  } else if (category === 'work') {
    return { 
      content: isEn
        ? `- **Core Responsibilities**: Responsible for core e-commerce transaction pathways, shopping cart, and checkout service development, participating in high-concurrency/high-availability designs\n- **Technical Achievements**: Led slow query governance, Redis cache avalanche prevention, and asymmetric encryption optimizations, substantially boosting safety and throughput\n- **Quantitative Results**: Reduced average response time by 35%, increased core API throughput (QPS) by 120%, ensuring stable system execution during big promotional campaigns`
        : `- **核心职责**：负责公司核心电商交易链路、购物车及结算服务模块研发，参与高可用高并发方案设计\n- **技术攻坚**：主导了慢查询治理、Redis 缓存雪崩应对以及非对称加密优化，将全链路安全性与吞吐性能大幅提升\n- **量化结果**：所负责模块接口平均耗时减少 35%，核心接口吞吐量 QPS 提升 120%，保障了大促期间平稳无故障运行` 
    };
  } else {
    return { 
      content: isEn
        ? `- **Scope of Responsibility**: Managed daily operations and core module development of the project, leading cross-functional teams with high efficiency\n- **Key Actions**: 1. Refactored the core workflow using a modern lightweight framework; 2. Defined weekly Code Review guidelines and accumulated development docs\n- **Concrete Impact**: Shortened project cycle by 20%, improved onboarding speed and overall delivery quality`
        : `- **职责范围**：负责组织或项目的日常运营与核心模块编写，带领团队高效协作\n- **工作行动**：1. 采用新框架重构核心业务流；2. 制定每周 Code Review 规范与开发文档沉淀\n- **具体成效**：项目周期缩短了 20%，团队新人上手熟练度及日常交付质量明显提升` 
    };
  }
};

/**
 * Scroll smoothly to a section card in the form editor with sticky header offset correction
 */
export const scrollToSectionElement = (sectionId: string, expandFn?: (id: string) => void) => {
  if (!sectionId) return;

  if (expandFn) {
    expandFn(sectionId);
  }

  const scrollAction = () => {
    const targetId = `form-sec-${sectionId}`;
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    targetEl.classList.add('ring-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'transition-all');
    setTimeout(() => {
      targetEl.classList.remove('ring-2', 'ring-indigo-500', 'dark:ring-indigo-400');
    }, 2000);

    const container = targetEl.closest('.overflow-y-auto') as HTMLElement | null;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const relativeTop = targetRect.top - containerRect.top;
      // Account for QuickNav sticky top header height (~52px) + top padding (18px) = 70px offset
      const desiredScrollTop = container.scrollTop + relativeTop - 70;

      container.scrollTo({
        top: Math.max(0, desiredScrollTop),
        behavior: 'smooth'
      });
    } else {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  scrollAction();
  setTimeout(scrollAction, 100);
  setTimeout(scrollAction, 260);
};

