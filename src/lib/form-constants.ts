export interface SelectOptionItem {
  value: string;
  label: string;
}

export const getDegreeOptions = (lang: 'zh' | 'en' = 'zh'): SelectOptionItem[] =>
  lang === 'en'
    ? [
        { value: '', label: '' },
        { value: 'Associate', label: 'Associate' },
        { value: 'Bachelor', label: 'Bachelor' },
        { value: 'Master', label: 'Master' },
        { value: 'PhD', label: 'PhD' },
      ]
    : [
        { value: '', label: '' },
        { value: '大专', label: '大专' },
        { value: '本科', label: '本科' },
        { value: '硕士', label: '硕士' },
        { value: '博士', label: '博士' },
      ];

export const getJobStatusOptions = (lang: 'zh' | 'en' = 'zh'): SelectOptionItem[] =>
  lang === 'en'
    ? [
        { value: '', label: '' },
        { value: 'Employed - Immediate', label: 'Employed - Immediate' },
        { value: 'Employed - Open to Offers', label: 'Employed - Open to Offers' },
        { value: 'Employed - Not Looking', label: 'Employed - Not Looking' },
        { value: 'Unemployed - Immediate', label: 'Unemployed - Immediate' },
        { value: 'Student - Looking for Internship', label: 'Student - Looking for Internship' },
      ]
    : [
        { value: '', label: '' },
        { value: '在职-随时到岗', label: '在职 - 随时到岗' },
        { value: '在职-考虑机会', label: '在职 - 考虑机会' },
        { value: '在职-暂不考虑', label: '在职 - 暂不考虑' },
        { value: '离职-随时到岗', label: '离职 - 随时到岗' },
        { value: '在校-寻找实习', label: '在校 - 寻找实习' },
      ];

export const getPopularCities = (lang: 'zh' | 'en' = 'zh'): string[] => {
  return lang === 'en'
    ? ['Remote', 'San Francisco', 'New York', 'Seattle', 'London', 'Singapore']
    : ['北京', '上海', '深圳', '杭州', '广州', '成都', '远程'];
};
