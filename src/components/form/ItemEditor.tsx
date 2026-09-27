import React from 'react';
import { Wand2, ArrowUp, ArrowDown, Trash2, GripVertical } from 'lucide-react';
import { FormItem } from '../../lib/form-types';
import { FormTextareaToolbar } from './FormTextareaToolbar';
import { MonthRangePicker } from './MonthRangePicker';
import { SmartMarkdownTextarea } from './SmartMarkdownTextarea';
import { Tooltip } from '../ui/Tooltip';
import { getTranslation } from '../../i18n';
import { MarketRegion } from '../../types';

interface ItemEditorProps {
  item: FormItem;
  index: number;
  totalItems: number;
  category: string;
  onFieldChange: (field: any, value: string) => void;
  onContentChange: (content: string) => void;
  onMove: (direction: 'up' | 'down') => void;
  onReorderItem?: (fromIndex: number, toIndex: number) => void;
  onDelete: () => void;
  onInsertStarTemplate: () => void;
  lang?: string;
  marketRegion?: MarketRegion;
}

const CATEGORY_CONFIGS = {
  zh: {
    default: {
      orgLabel: '经历单位',
      orgPlaceholder: '如：腾讯科技、某开源项目组',
      roleLabel: '职位 / 角色',
      rolePlaceholder: '如：高级前端开发、核心贡献者',
      timePlaceholder: '如：2023.06 - 至今',
      contentLabel: '职责与产出',
      contentPlaceholder: `- **核心职责**：描述你负责的主导模块、要解决的核心问题\n- **量化结果**：列出清晰可证明的业务成效或量化数据\n- **项目收益**：项目顺利上线，得到了部门领导和用户的肯定`,
      starTitle: '导入 STAR 描述示例',
    },
    edu: {
      orgLabel: '学校名称',
      orgPlaceholder: '如：北京大学、清华大学',
      roleLabel: '专业与学历',
      rolePlaceholder: '如：计算机科学与技术 (硕士)',
      timePlaceholder: '如：2020.09 - 2024.06',
      contentLabel: '在校表现与荣誉',
      contentPlaceholder: `- **学业成绩**：绩点 GPA 3.8/4.0，专业前 5%\n- **主修课程**：高级数据结构、算法设计、操作系统、分布式计算\n- **荣誉成就**：国家奖学金、算法竞赛一等奖`,
      starTitle: '导入学术履历模板',
    },
    project: {
      orgLabel: '项目名称',
      orgPlaceholder: '如：高并发支付系统、微服务架构重构',
      roleLabel: '项目角色',
      rolePlaceholder: '如：核心研发、架构师',
      timePlaceholder: '如：2024.01 - 2024.04',
      contentLabel: '项目描述',
      contentPlaceholder: `- **[Situation 业务背景]**：高并发下面临什么性能瓶颈\n- **[Task 核心任务]**：你负责攻克什么模块、调优指标\n- **[Action 关键行动]**：你做了什么核心技术方案、架构重构\n- **[Result 实际产出]**：响应延迟缩短 %，QPS 提升`,
      starTitle: '导入 STAR 项目模板',
    },
    work: {
      orgLabel: '公司名称',
      orgPlaceholder: '如：腾讯科技、字节跳动',
      roleLabel: '职位名称',
      rolePlaceholder: '如：高级前端开发工程师',
      timePlaceholder: '如：2022.06 - 至今',
      contentLabel: '职责与产出',
      contentPlaceholder: `- **核心职责**：负责并主导...模块研发\n- **关键业绩**：攻克了...技术难关\n- **量化结果**：提升了...% 吞吐量或降低了故障率`,
      starTitle: '导入 STAR 工作模板',
    }
  },
  en: {
    default: {
      orgLabel: 'Organization',
      orgPlaceholder: 'e.g. Acme Corp, Open Source Group',
      roleLabel: 'Role / Title',
      rolePlaceholder: 'e.g. Lead Frontend Developer, Contributor',
      timePlaceholder: 'e.g. 2023.06 - Present',
      contentLabel: 'Responsibilities & Impact',
      contentPlaceholder: `- **Key Responsibilities**: Describe the module you owned and key problems solved\n- **Quantifiable Results**: Highlight clear, measurable business metrics or technical improvements\n- **Impact**: Delivered smoothly, receiving recognition from leadership and clients`,
      starTitle: 'Import professional STAR description template',
    },
    edu: {
      orgLabel: 'Institution Name',
      orgPlaceholder: 'e.g. Harvard University',
      roleLabel: 'Major & Degree',
      rolePlaceholder: 'e.g. M.S. in Computer Science',
      timePlaceholder: 'e.g. 2020.09 - 2024.06',
      contentLabel: 'Academic Performance & Honors',
      contentPlaceholder: `- **Academic Performance**: GPA 3.8/4.0, Top 5% of class\n- **Core Courses**: Advanced Data Structures, Algorithms, Distributed Systems\n- **Honors**: Dean's List, First Prize in Hackathon`,
      starTitle: 'Import academic education template',
    },
    project: {
      orgLabel: 'Project Name',
      orgPlaceholder: 'e.g. High-Concurrency Payment System',
      roleLabel: 'Project Role',
      rolePlaceholder: 'e.g. Lead Architect, Core Developer',
      timePlaceholder: 'e.g. 2024.01 - 2024.04',
      contentLabel: 'Project Description',
      contentPlaceholder: `- **[Situation]**: Bottleneck faced under high concurrent traffic\n- **[Task]**: Target optimization metrics and your primary assignment\n- **[Action]**: Core architectural designs, optimization strategies, and solutions applied\n- **[Result]**: Reduced latency by %, improved QPS capability to `,
      starTitle: 'Import professional STAR project template',
    },
    work: {
      orgLabel: 'Company Name',
      orgPlaceholder: 'e.g. Google, Microsoft',
      roleLabel: 'Job Title',
      rolePlaceholder: 'e.g. Senior Frontend Engineer',
      timePlaceholder: 'e.g. 2022.06 - Present',
      contentLabel: 'Responsibilities & Impact',
      contentPlaceholder: `- **Key Responsibilities**: Spearheaded the design and development of ...\n- **Core Achievements**: Resolved ... critical latency bugs\n- **Quantifiable Results**: Enhanced throughput by ...% or decreased incident frequency by ...%`,
      starTitle: 'Import professional STAR work experience template',
    }
  }
};

export function ItemEditor({
  item, index, totalItems, category,
  onFieldChange, onContentChange, onMove, onReorderItem, onDelete, onInsertStarTemplate,
  lang = 'zh',
  marketRegion
}: ItemEditorProps) {
  const activeLang = lang === 'en' ? 'en' : 'zh';
  const translations = getTranslation(activeLang);
  const secT = translations.form.section;
  const eduT = translations.form.edu;
  
  const dict = activeLang === 'en' ? CATEGORY_CONFIGS.en : CATEGORY_CONFIGS.zh;
  const catKey = (category in dict) ? (category as 'edu' | 'project' | 'work') : 'default';
  const cat = dict[catKey];

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (!isNaN(sourceIndex) && sourceIndex !== index && onReorderItem) {
      onReorderItem(sourceIndex, index);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="p-3 sm:p-4 border border-slate-200/60 dark:border-slate-800 rounded-xl bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-850 dark:to-slate-900/90 relative space-y-2.5 sm:space-y-3 transition-all group/item shadow-[0_2px_6px_rgba(15,23,42,0.01),inset_0_1.5px_2px_rgba(255,255,255,0.95)] dark:shadow-none hover:border-slate-300 dark:hover:border-slate-700"
    >
      <div className="flex items-center justify-end gap-1 sm:absolute sm:right-3 sm:top-3 sm:opacity-40 sm:group-hover/item:opacity-100 transition-opacity">
        {onReorderItem && (
          <Tooltip content={secT.dragToReorder} side="top">
            <div
              draggable
              onDragStart={handleDragStart}
              className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded cursor-grab active:cursor-grabbing transition-colors"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          </Tooltip>
        )}
        <Tooltip content={cat.starTitle} side="top">
          <button type="button" onClick={onInsertStarTemplate} className="p-1 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded transition-colors cursor-pointer">
            <Wand2 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip content={secT.moveItemUp} side="top" disabled={index === 0}>
          <button type="button" onClick={() => onMove('up')} disabled={index === 0} className={`p-1 rounded transition-colors ${index === 0 ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-750 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer'}`}>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip content={secT.moveItemDown} side="top" disabled={index === totalItems - 1}>
          <button type="button" onClick={() => onMove('down')} disabled={index === totalItems - 1} className={`p-1 rounded transition-colors ${index === totalItems - 1 ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-750 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer'}`}>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip content={secT.deleteItem} side="top">
          <button type="button" onClick={onDelete} className="p-1 hover:bg-red-50 dark:hover:bg-rose-950/50 text-red-500 dark:text-rose-400 hover:text-red-700 dark:hover:text-rose-300 rounded transition-colors cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>

      <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 sm:pr-24">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">{cat.orgLabel}</label>
            {(item.org || '').length > 20 && (
              <Tooltip content={secT.charCountWarn} side="top">
                <span className="text-[10px] text-amber-500 font-medium cursor-help">
                  {activeLang === 'en' ? `${item.org.length} chars` : `${item.org.length}字`}
                </span>
              </Tooltip>
            )}
          </div>
          <div className="relative">
            <input 
              type="text" 
              value={item.org || ''} 
              onChange={(e) => onFieldChange('org', e.target.value)} 
              className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 tactile-input" 
              placeholder={cat.orgPlaceholder} 
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">{cat.roleLabel}</label>
            {(item.role || '').length > 18 && (
              <Tooltip content={secT.charCountWarn} side="top">
                <span className="text-[10px] text-amber-500 font-medium cursor-help">
                  {activeLang === 'en' ? `${item.role.length} chars` : `${item.role.length}字`}
                </span>
              </Tooltip>
            )}
          </div>
          <div className="relative">
            <input 
              type="text" 
              value={item.role || ''} 
              onChange={(e) => onFieldChange('role', e.target.value)} 
              className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 tactile-input" 
              placeholder={cat.rolePlaceholder} 
            />
          </div>
        </div>
        <div className="w-full md:w-[220px] shrink-0">
          <div className="mb-1">
            <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">{secT.periodLabel}</label>
          </div>
          <MonthRangePicker
            value={item.time || ''}
            onChange={(val) => onFieldChange('time', val)}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 tactile-input font-mono"
            placeholder={cat.timePlaceholder}
            lang={lang}
            marketRegion={marketRegion}
            showPresentToggle={index === 0 && (category === 'work' || category === 'project')}
          />
        </div>
      </div>

      {category === 'edu' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">{eduT.gpaLabel}</label>
            <input type="text" value={item.gpa || ''} onChange={(e) => onFieldChange('gpa', e.target.value)} className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 tactile-input" placeholder={eduT.gpaPlaceholder} />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">{eduT.coursesLabel}</label>
            <input type="text" value={item.courses || ''} onChange={(e) => onFieldChange('courses', e.target.value)} className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 tactile-input" placeholder={eduT.coursesPlaceholder} />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">{eduT.honorsLabel}</label>
            <input type="text" value={item.honors || ''} onChange={(e) => onFieldChange('honors', e.target.value)} className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 tactile-input" placeholder={eduT.honorsPlaceholder} />
          </div>
        </div>
      )}

      <div>
        <div className="mb-1">
          <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
            {category === 'edu' ? eduT.descLabel : cat.contentLabel}
          </label>
        </div>
        <div className="flex flex-col mt-1">
          <FormTextareaToolbar textareaId={item.id} value={item.content} onChange={onContentChange} lang={lang} />
          <SmartMarkdownTextarea 
            id={item.id} 
            value={item.content} 
            onChange={onContentChange} 
            minRows={category === 'edu' ? 3 : 5} 
            className="w-full p-2.5 text-xs font-mono leading-relaxed bg-slate-50/10 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-750 rounded-b-lg rounded-t-none border-t-0 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 shadow-[inset_0_1.5px_3px_rgba(15,23,42,0.04)] focus:shadow-none transition-all duration-200" 
            placeholder={category === 'edu' ? eduT.descPlaceholder : cat.contentPlaceholder} 
          />
        </div>
      </div>
    </div>
  );
}
