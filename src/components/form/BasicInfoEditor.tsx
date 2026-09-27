import React, { useState, useRef, useMemo } from 'react';
import { User, Mail, Link, Layers, ChevronDown, ChevronUp, X, Code, Globe, GraduationCap, Briefcase, MapPin, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResumeFormModel } from '../../lib/form-types';
import { CustomSelect } from '../ui/CustomSelect';
import { AgeInputWithPicker } from './AgeInputWithPicker';
import { Tooltip } from '../ui/Tooltip';
import { getTranslation } from '../../i18n';
import { getDegreeOptions, getJobStatusOptions, getPopularCities } from '../../lib/form-constants';
import { InternationalPhoneField } from './InternationalPhoneField';

import { MarketRegion } from '../../types';
import { getMarketProfile } from '../../lib/market-profile';

interface BasicInfoEditorProps {
  model: ResumeFormModel;
  onChange: (model: ResumeFormModel) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  showOptional: boolean;
  onToggleOptional: () => void;
  lang?: 'zh' | 'en';
  marketRegion?: MarketRegion;
}

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const WeChatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M8.5 3C4.36 3 1 5.91 1 9.5c0 1.98.99 3.76 2.56 4.96-.13.72-.47 2.1-1.06 2.94 1.25-.16 2.66-.69 3.65-1.42.74.22 1.54.34 2.35.34.28 0 .55-.02.82-.05-.2-.58-.32-1.2-.32-1.85 0-3.37 3.25-6.11 7.27-6.11.23 0 .46.01.69.04C16.14 5.09 12.63 3 8.5 3zm-2.25 4.5c.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25S5 9.44 5 8.75 5.56 7.5 6.25 7.5zm4.5 0c.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25-.56-1.25-.56-1.25.56-1.25 1.25-1.25zM15.5 10c-3.59 0-6.5 2.46-6.5 5.5 0 3.04 2.91 5.5 6.5 5.5.7 0 1.37-.1 2-.29.83.61 2.02 1.05 3.08 1.19-.5-.71-.79-1.87-.9-2.48 1.34-1.02 2.18-2.53 2.18-4.2 0-3.04-2.91-5.5-6.5-5.5zm-1.88 3.75c.52 0 .94.42.94.94s-.42.94-.94.94-.94-.42-.94-.94.42-.94.94-.94zm3.75 0c.52 0 .94.42.94.94s-.42.94-.94.94-.94-.42-.94-.94.42-.94.94-.94z" />
  </svg>
);

export function BasicInfoEditor({ model, onChange, expanded, onToggleExpanded, showOptional, onToggleOptional, lang = 'zh', marketRegion }: BasicInfoEditorProps) {
  const [tagInput, setTagInput] = useState('');
  
  const activeLang = lang === 'en' ? 'en' : 'zh';
  const translations = getTranslation(activeLang);
  const t = translations.form.basic;
  const commonT = translations.common;
  const degreeOptions = getDegreeOptions(activeLang);
  const jobStatusOptions = getJobStatusOptions(activeLang);
  const popularCities = getPopularCities(activeLang);
  const marketProfile = getMarketProfile(marketRegion);
  const isAgeDiscouraged = marketProfile.discouragedPersonalFields.includes('age');

  const [customDegree, setCustomDegree] = useState(() => {
    return !!model.degree && !degreeOptions.some(o => o.value === model.degree);
  });
  const [customJobStatus, setCustomJobStatus] = useState(() => {
    return !!model.jobStatus && !jobStatusOptions.some(o => o.value === model.jobStatus);
  });

  React.useEffect(() => {
    if (model.degree && !degreeOptions.some(o => o.value === model.degree)) {
      setCustomDegree(true);
    }
    if (model.jobStatus && !jobStatusOptions.some(o => o.value === model.jobStatus)) {
      setCustomJobStatus(true);
    }
  }, [model.degree, model.jobStatus, activeLang]);

  const getNumericYears = (wy: string | undefined): string => {
    if (!wy) return '';
    if (/应届|在校|student|grad/i.test(wy)) return '';
    const match = wy.match(/\d+/);
    return match ? match[0] : '';
  };

  const isStudentGrad = /应届|在校|student|grad/i.test(model.workYears || '');

  const handleYearsNumberChange = (val: string) => {
    if (val === '') {
      handleStructuredFieldChange('workYears', '');
      return;
    }
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 0) {
      handleStructuredFieldChange('workYears', '');
      return;
    }
    if (n === 0) {
      handleStructuredFieldChange('workYears', activeLang === 'en' ? 'Student / New Graduate' : '在校生/应届生');
      return;
    }
    const formatted = activeLang === 'en' 
      ? `${n} ${n === 1 ? 'Year' : 'Years'} Experience`
      : `${n}年工作经验`;
    handleStructuredFieldChange('workYears', formatted);
  };
  
  const handleBasicInfoChange = (field: keyof Omit<ResumeFormModel, 'sections'>, newVal: string) => {
    onChange({
      ...model,
      [field]: newVal
    });
  };

  const handleStructuredFieldChange = (field: 'workYears' | 'degree' | 'age' | 'city' | 'jobStatus', value: string) => {
    const updatedModel = {
      ...model,
      [field]: value
    };
    
    // Compute consolidated experience string
    const parts: string[] = [];
    if (updatedModel.workYears?.trim()) parts.push(updatedModel.workYears.trim());
    if (updatedModel.degree?.trim()) parts.push(updatedModel.degree.trim());
    if (updatedModel.age?.trim()) parts.push(updatedModel.age.trim());
    if (updatedModel.city?.trim()) parts.push(updatedModel.city.trim());
    if (updatedModel.jobStatus?.trim()) parts.push(updatedModel.jobStatus.trim());
    
    updatedModel.experience = parts.join(' ｜ ');
    
    onChange(updatedModel);
  };

  const addTagsFromString = (raw: string) => {
    if (!raw.trim()) return;
    const incoming = raw
      .split(/[｜|、,，;/；\n]+/)
      .map(item => item.trim())
      .filter(Boolean);
    if (incoming.length === 0) return;

    const existingTags = model.subtitle ? model.subtitle.split(/[｜|]/).map(item => item.trim()).filter(Boolean) : [];
    const set = new Set(existingTags);
    const updated = [...existingTags];
    for (const tag of incoming) {
      if (!set.has(tag)) {
        set.add(tag);
        updated.push(tag);
      }
    }
    handleBasicInfoChange('subtitle', updated.join(' ｜ '));
    setTagInput('');
  };

  const handleAddTag = (e?: React.KeyboardEvent<HTMLInputElement>) => {
    if (e && e.key !== 'Enter') return;
    if (e) e.preventDefault();
    addTagsFromString(tagInput);
  };

  const handleTagPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (/[｜|、,，;/；\n]/.test(pasted)) {
      e.preventDefault();
      addTagsFromString(pasted);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const tags = model.subtitle ? model.subtitle.split(/[｜|]/).map(item => item.trim()).filter(Boolean) : [];
    const newTags = tags.filter(item => item !== tagToRemove);
    handleBasicInfoChange('subtitle', newTags.join(' ｜ '));
  };

  const cityInputRef = useRef<HTMLInputElement>(null);
  const [cityInputDraft, setCityInputDraft] = useState('');

  const cityList = useMemo(() => {
    if (!model.city) return [];
    return model.city
      .split(/[\s]*[·•/、|｜,，]+[\s]*/)
      .map(c => c.trim())
      .filter(Boolean);
  }, [model.city]);

  const updateCityList = (newList: string[]) => {
    const unique = Array.from(new Set(newList.map(c => c.trim()).filter(Boolean)));
    handleStructuredFieldChange('city', unique.join(' · '));
  };

  const handleAddCity = (cityToAdd: string) => {
    const trimmed = cityToAdd.trim();
    if (!trimmed) return;
    const parsed = trimmed
      .split(/[\s,，、/·•]+/)
      .map(c => c.trim())
      .filter(Boolean);
    if (parsed.length > 0) {
      updateCityList([...cityList, ...parsed]);
    }
  };

  const handleRemoveCity = (cityToRemove: string) => {
    updateCityList(cityList.filter(c => c !== cityToRemove));
  };

  const toggleCity = (cityToToggle: string) => {
    if (cityList.includes(cityToToggle)) {
      handleRemoveCity(cityToToggle);
    } else {
      handleAddCity(cityToToggle);
    }
  };

  const tags = model.subtitle ? model.subtitle.split(/[｜|]/).map(t => t.trim()).filter(Boolean) : [];

  return (
    <div 
      id="form-sec-basic" 
      className={`rounded-xl overflow-hidden scroll-mt-20 transition-all duration-300 ${
        expanded 
          ? 'tactile-card shadow-[0_16px_36px_rgba(30,41,59,0.06),0_3px_10px_rgba(30,41,59,0.03)] border-indigo-200/50 dark:border-slate-800 scale-[1.002] ring-1 ring-indigo-50/50 dark:ring-slate-800 mb-5' 
          : 'bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 shadow-[0_2px_6px_rgba(30,41,59,0.015)] opacity-85 hover:opacity-100 scale-[0.995] hover:scale-100 mb-3'
      }`}
    >
      <div 
        className={`flex items-center justify-between px-5 py-3.5 bg-gradient-to-r cursor-pointer select-none transition-all duration-300 ${
          expanded 
            ? 'from-indigo-50/40 to-slate-50 dark:from-indigo-950/30 dark:to-slate-900/60 border-b border-indigo-100/40 dark:border-indigo-900/40 hover:from-indigo-50/60 hover:to-slate-100/60 dark:hover:from-indigo-950/50 dark:hover:to-slate-900/80' 
            : 'from-slate-50/80 to-slate-100/30 dark:from-slate-850/60 dark:to-slate-900/40 border-b border-slate-200/40 dark:border-slate-800 dark:hover:from-slate-800 dark:hover:to-slate-800/80 hover:from-slate-100/60 hover:to-slate-100/90'
        }`}
        onClick={onToggleExpanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg border bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/60 shrink-0 flex items-center justify-center shadow-2xs">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 px-1 py-0.5">{t.title}</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                {t.pinnedTop}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 px-1 truncate max-w-xs sm:max-w-md">
              {t.desc}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="p-0.5 transition-transform duration-200 active:scale-75 cursor-pointer" onClick={onToggleExpanded}>
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" /> : <ChevronDown className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />}
          </div>
        </div>
      </div>
      
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="p-5 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
            {/* 姓名 */}
            <div className="space-y-2">
              <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">{t.nameLabel}</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 pointer-events-none"><User className="w-4 h-4" /></span>
                <input 
                  type="text" 
                  value={model.name || ''}
                  onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-semibold tactile-input text-slate-800 dark:text-slate-100"
                  placeholder={t.namePlaceholder}
                />
              </div>
            </div>

            {/* International phone */}
            <InternationalPhoneField
              value={model.phone || ''}
              onChange={(value) => handleBasicInfoChange('phone', value)}
              lang={activeLang}
              label={t.phoneLabel}
              placeholder={t.phonePlaceholder}
              marketRegion={marketRegion}
            />

            {/* 电子邮箱 */}
            <div className="space-y-2">
              <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">{t.emailLabel}</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 pointer-events-none"><Mail className="w-4 h-4" /></span>
                <input 
                  type="email"
                  inputMode="email"
                  value={model.email || ''}
                  onChange={(e) => handleBasicInfoChange('email', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm tactile-input font-mono text-slate-800 dark:text-slate-100"
                  placeholder={t.emailPlaceholder}
                />
              </div>
            </div>

            {/* 求职意向 */}
            <div className="space-y-2">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{t.targetJobLabel}</label>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-slate-400 pointer-events-none"><Layers className="w-4 h-4" /></span>
                  <input 
                    type="text" 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    onPaste={handleTagPaste}
                    className="w-full pl-9 pr-3 py-2 text-sm tactile-input"
                    placeholder={t.tagPlaceholder}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg transition-all border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.02),inset_0_1.5px_2px_rgba(255,255,255,0.95)] cursor-pointer active:translate-y-px shrink-0"
                >
                  {t.addTagBtn}
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50/75 text-blue-700 border border-blue-100/80 rounded-md shadow-sm group"
                    >
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(tag)}
                        className="text-blue-400 hover:text-blue-700 hover:bg-blue-100 rounded-full p-0.5 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {showOptional && (
              <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                {/* 1. 微信号 & 社交主页/作品集（2列并排） */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
                  {/* 微信号 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">
                        {t.wechatLabel}
                      </label>
                      {model.phone && !model.wechat && (
                        <button
                          type="button"
                          onClick={() => handleBasicInfoChange('wechat', model.phone)}
                          className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline cursor-pointer transition-colors"
                        >
                          {t.wechatSameAsPhone}
                        </button>
                      )}
                    </div>
                    <div className="relative group/field">
                      <span className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
                        <WeChatIcon className="w-4 h-4" />
                      </span>
                      <input 
                        type="text" 
                        value={model.wechat || ''}
                        onChange={(e) => handleBasicInfoChange('wechat', e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-sm tactile-input font-mono text-slate-800 dark:text-slate-100"
                        placeholder={t.wechatPlaceholder}
                      />
                      {model.wechat && (
                        <Tooltip content={commonT.clear} side="top">
                          <button
                            type="button"
                            onClick={() => handleBasicInfoChange('wechat', '')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors opacity-0 group-hover/field:opacity-100 focus:opacity-100 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  {/* 社交链接 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{t.socialLabel}</label>
                    </div>
                    <div className="relative group/field">
                      <span className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
                        {(() => {
                          const tLower = (model.social || '').toLowerCase();
                          if (tLower.includes('github')) return <GitHubIcon className="w-4 h-4 text-slate-800 dark:text-slate-200" />;
                          if (tLower.includes('linkedin')) return <Globe className="w-4 h-4 text-sky-600" />;
                          if (tLower.includes('twitter') || /^(?:https?:\/\/)?(?:www\.)?x\.com(?:\/|$)/i.test((model.social || '').trim())) return <Globe className="w-4 h-4 text-blue-400" />;
                          if (tLower.includes('zhihu') || tLower.includes('juejin')) return <Code className="w-4 h-4 text-blue-600" />;
                          if (tLower.includes('blog') || tLower.includes('web') || tLower.includes('http')) return <Globe className="w-4 h-4 text-indigo-500" />;
                          return <Link className="w-4 h-4" />;
                        })()}
                      </span>
                      <input 
                        type="text" 
                        value={model.social || ''}
                        onChange={(e) => handleBasicInfoChange('social', e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-sm tactile-input font-mono"
                        placeholder={t.socialPlaceholder}
                      />
                      {model.social && (
                        <Tooltip content={commonT.clear} side="top">
                          <button
                            type="button"
                            onClick={() => handleBasicInfoChange('social', '')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors opacity-0 group-hover/field:opacity-100 focus:opacity-100 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. 基本属性网格（4列：工作经验、最高学历、年龄、求职状态） */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                  {/* 工作经验年限 */}
                  <div className="space-y-1.5">
                    <div className="h-6 flex items-center justify-between">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none select-none">{t.expLabel}</label>
                      <Tooltip content={t.studentGradTooltip} side="top">
                        <button
                          type="button"
                          onClick={() => {
                            if (isStudentGrad) {
                              handleStructuredFieldChange('workYears', '');
                            } else {
                              handleStructuredFieldChange('workYears', activeLang === 'en' ? 'Student / New Graduate' : '在校生/应届生');
                            }
                          }}
                          className={`h-5 text-[10px] px-2 rounded font-medium cursor-pointer transition-all inline-flex items-center border ${
                            isStudentGrad 
                              ? 'bg-blue-50 text-blue-700 font-bold border-blue-200 shadow-xs' 
                              : 'text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border-slate-200/60'
                          }`}
                        >
                          {t.studentGradBadge}
                        </button>
                      </Tooltip>
                    </div>
                    <div className="relative flex items-center h-9.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"><Briefcase className="w-4 h-4" /></span>
                      <input 
                        type="number" 
                        min="0"
                        max="50"
                        value={isStudentGrad ? '' : getNumericYears(model.workYears)}
                        onChange={(e) => handleYearsNumberChange(e.target.value)}
                        className={`w-full h-9.5 pl-9 ${activeLang === 'en' ? 'pr-12' : 'pr-8'} text-sm tactile-input font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-white rounded-lg`}
                        placeholder={isStudentGrad ? t.studentGradBadge : t.expPlaceholder}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none select-none">
                        {isStudentGrad ? '' : t.expSuffix}
                      </span>
                    </div>
                  </div>

                  {/* 最高学历 */}
                  <div className="space-y-1.5">
                    <div className="h-6 flex items-center justify-between">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none select-none">{t.degreeLabel}</label>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomDegree(!customDegree);
                          if (customDegree) {
                            handleStructuredFieldChange('degree', '');
                          }
                        }}
                        className="h-5 text-[10px] text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer transition-colors inline-flex items-center"
                      >
                        {customDegree ? t.presetBtn : t.customBtn}
                      </button>
                    </div>
                    <div className="relative h-9.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"><GraduationCap className="w-4 h-4" /></span>
                      {customDegree ? (
                        <input 
                          type="text" 
                          value={model.degree || ''}
                          onChange={(e) => handleStructuredFieldChange('degree', e.target.value)}
                          className="w-full h-9.5 pl-9 pr-3 text-sm tactile-input rounded-lg"
                          placeholder={t.degreePlaceholder}
                        />
                      ) : (
                        <CustomSelect
                          value={model.degree || ''}
                          onChange={(val) => {
                            if (val === '__custom__') {
                              setCustomDegree(true);
                            } else {
                              handleStructuredFieldChange('degree', val);
                            }
                          }}
                          options={[
                            ...(model.degree && !degreeOptions.some(opt => opt.value === model.degree) ? [{ value: model.degree, label: model.degree }] : []),
                            ...degreeOptions,
                            { value: '__custom__', label: t.customManual }
                          ]}
                          size="md"
                          className="w-full h-9.5"
                          triggerClassName="w-full h-9.5 pl-9 pr-3 text-sm tactile-input font-normal bg-white rounded-lg"
                          placeholder={t.degreePlaceholder}
                        />
                      )}
                    </div>
                  </div>

                  {/* 年龄 / 出生年份 */}
                  <div className="space-y-1.5">
                    <div className="h-6 flex items-center justify-between">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none select-none">
                        {t.ageLabel}
                        {isAgeDiscouraged && (
                          <span className="ml-1.5 text-[9px] font-normal lowercase tracking-normal text-slate-400/80">
                            {activeLang === 'en' ? '(optional / usually omitted in US/UK)' : '(美加英等通常不填)'}
                          </span>
                        )}
                      </label>
                    </div>
                    <AgeInputWithPicker 
                      value={model.age || ''}
                      onChange={(val) => handleStructuredFieldChange('age', val)}
                      placeholder={t.agePlaceholder}
                      lang={activeLang}
                      className="w-full"
                    />
                  </div>

                  {/* 求职状态 */}
                  <div className="space-y-1.5">
                    <div className="h-6 flex items-center justify-between">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none select-none">{t.statusLabel}</label>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomJobStatus(!customJobStatus);
                          if (customJobStatus) {
                            handleStructuredFieldChange('jobStatus', '');
                          }
                        }}
                        className="h-5 text-[10px] text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer transition-colors inline-flex items-center"
                      >
                        {customJobStatus ? t.presetBtn : t.customBtn}
                      </button>
                    </div>
                    <div className="relative h-9.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"><Activity className="w-4 h-4" /></span>
                      {customJobStatus ? (
                        <input 
                          type="text" 
                          value={model.jobStatus || ''}
                          onChange={(e) => handleStructuredFieldChange('jobStatus', e.target.value)}
                          className="w-full h-9.5 pl-9 pr-3 text-sm tactile-input rounded-lg"
                          placeholder={t.statusLabel}
                        />
                      ) : (
                        <CustomSelect
                          value={model.jobStatus || ''}
                          onChange={(val) => {
                            if (val === '__custom__') {
                              setCustomJobStatus(true);
                            } else {
                              handleStructuredFieldChange('jobStatus', val);
                            }
                          }}
                          options={[
                            ...(model.jobStatus && !jobStatusOptions.some(opt => opt.value === model.jobStatus) ? [{ value: model.jobStatus, label: model.jobStatus }] : []),
                            ...jobStatusOptions,
                            { value: '__custom__', label: t.customManual }
                          ]}
                          size="md"
                          className="w-full h-9.5"
                          triggerClassName="w-full h-9.5 pl-9 pr-3 text-sm tactile-input font-normal bg-white rounded-lg"
                          placeholder={t.statusLabel}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. 意向城市（单独一行） */}
                <div className="space-y-1.5 pt-1">
                  <div className="h-6 flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none select-none">{t.cityLabel}</label>
                    {cityList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleStructuredFieldChange('city', '')}
                        className="h-5 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium cursor-pointer transition-colors inline-flex items-center"
                      >
                        {t.clearCity}
                      </button>
                    )}
                  </div>
                  {/* Tag/Chip Container */}
                  <div 
                    onClick={() => cityInputRef.current?.focus()}
                    className="min-h-9.5 w-full pl-9 pr-2.5 py-1.5 tactile-input rounded-lg flex flex-wrap items-center gap-1.5 cursor-text relative bg-white dark:bg-slate-900 transition-all focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950 focus-within:border-indigo-500"
                  >
                    <span className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
                      <MapPin className="w-4 h-4" />
                    </span>

                    {cityList.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 animate-in fade-in zoom-in-95 duration-100 select-none"
                      >
                        <span>{c}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCity(c);
                          }}
                          className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 p-0.5 rounded-xs transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                    <input
                      ref={cityInputRef}
                      type="text"
                      value={cityInputDraft}
                      onChange={(e) => setCityInputDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',' || e.key === '，' || e.key === '、') {
                          e.preventDefault();
                          if (cityInputDraft.trim()) {
                            handleAddCity(cityInputDraft);
                            setCityInputDraft('');
                          }
                        } else if (e.key === 'Backspace' && !cityInputDraft && cityList.length > 0) {
                          handleRemoveCity(cityList[cityList.length - 1]);
                        }
                      }}
                      onBlur={() => {
                        if (cityInputDraft.trim()) {
                          handleAddCity(cityInputDraft);
                          setCityInputDraft('');
                        }
                      }}
                      className="flex-1 min-w-[110px] bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none border-none p-0 h-6"
                      placeholder={cityList.length === 0 ? t.cityPlaceholder : t.addCityPlaceholder}
                    />
                  </div>

                  {/* Quick Popular Cities */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {popularCities.map((c) => {
                      const isSelected = cityList.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCity(c)}
                          className={`text-[11px] px-2 py-0.5 rounded-md border transition-all cursor-pointer select-none font-medium ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-slate-200/60 dark:border-slate-700'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}{c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {!showOptional && (
              <div className="md:col-span-2 pt-2">
                <button
                  type="button"
                  onClick={onToggleOptional}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
                >
                  {t.addMoreBtn}
                </button>
              </div>
            )}
            
            {showOptional && (
              <div className="md:col-span-2 text-right">
                <button
                  type="button"
                  onClick={onToggleOptional}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                >
                  {t.collapseBtn}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
}
