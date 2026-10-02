export interface TranslationSchema {
  common: {
    confirm: string;
    cancel: string;
    close: string;
    save: string;
    delete: string;
    copy: string;
    copied: string;
    edit: string;
    reset: string;
    done: string;
    loading: string;
    success: string;
    error: string;
    clear: string;
  };
  header: {
    title: string;
    subtitle: string;
    aiChecker: string;
    rawImporter: string;
    shareH5: string;
    backupHub: string;
    exportPdf: string;
    exportingPdf: string;
    legalHelp: string;
    themeToggleLight: string;
    themeToggleDark: string;
    langToggle: string;
  };
  toolbar: {
    visualMode: string;
    markdownMode: string;
    splitMode: string;
    previewMode: string;
    aesthetics: string;
    sectionSorter: string;
    autoFit: string;
    autoFitTooltip: string;
    typesettingSpace: string;
    typesettingSpaceTooltip: string;
    pageBreakLine: string;
    foldLine: string;
    gridLines: string;
    zoomIn: string;
    zoomOut: string;
    zoomReset: string;
    historyUndo: string;
    historyRedo: string;
    wordCount: string;
    charCount: string;
    lineCount: string;
  };
  aesthetics: {
    title: string;
    themeColor: string;
    customColor: string;
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
    blockGap: string;
    margin: string;
    h2Style: string;
    topAccentLine: string;
    templateLayout: string;
    presets: {
      sans: string;
      serif: string;
      mono: string;
      standardFontSize: string;
      compactFontSize: string;
      spaciousFontSize: string;
      standardMargin: string;
      compactMargin: string;
      spaciousMargin: string;
      accentLineH2: string;
      bgBarH2: string;
      minimalH2: string;
      singleColumn: string;
      twoColumn: string;
    };
  };
  form: {
    basic: {
      title: string;
      desc: string;
      pinnedTop: string;
      nameLabel: string;
      namePlaceholder: string;
      phoneLabel: string;
      phonePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      wechatLabel: string;
      wechatPlaceholder: string;
      wechatSameAsPhone: string;
      targetJobLabel: string;
      tagPlaceholder: string;
      addTagBtn: string;
      socialLabel: string;
      socialPlaceholder: string;
      expLabel: string;
      expPlaceholder: string;
      expSuffix: string;
      studentGradBadge: string;
      studentGradTooltip: string;
      degreeLabel: string;
      degreePlaceholder: string;
      customBtn: string;
      presetBtn: string;
      customManual: string;
      ageLabel: string;
      agePlaceholder: string;
      cityLabel: string;
      cityPlaceholder: string;
      addCityPlaceholder: string;
      statusLabel: string;
      addMoreBtn: string;
      collapseBtn: string;
      clearCity: string;
    };
    edu: {
      subtitle: string;
      schoolLabel: string;
      schoolPlaceholder: string;
      degreeLabel: string;
      degreeChoosePreset: string;
      degreeCustom: string;
      degreePlaceholder: string;
      majorLabel: string;
      majorPlaceholder: string;
      timeLabel: string;
      timePlaceholder: string;
      gpaLabel: string;
      gpaPlaceholder: string;
      coursesLabel: string;
      coursesPlaceholder: string;
      honorsLabel: string;
      honorsPlaceholder: string;
      descLabel: string;
      descPlaceholder: string;
      addBtn: string;
      textLabel: string;
      textPlaceholder: string;
      customOption: string;
    };
    section: {
      textLabel: string;
      textPlaceholder: string;
      noItems: string;
      addItem: string;
      formatSpacing: string;
      moveUp: string;
      moveDown: string;
      deleteSec: string;
      dragToReorder: string;
      moveItemUp: string;
      moveItemDown: string;
      deleteItem: string;
      customTextSection: string;
      customItemSection: string;
      standardModules: string;
      customModules: string;
      charCountWarn: string;
      periodLabel: string;
    };
    dialogs: {
      deleteSecTitle: string;
      deleteSecMsg: (title: string) => string;
      deleteItemTitle: string;
      deleteItemMsg: (name: string) => string;
      overwriteTitle: string;
      overwriteMsg: string;
      confirmImport: string;
      confirmDelete: string;
    };
  };
  importer: {
    title: string;
    description: string;
    placeholder: string;
    importBtn: string;
    privacyNotice: string;
  };
  errorBoundary: {
    title: string;
    subtitle: string;
    backupCopy: string;
    backupCopied: string;
    reload: string;
    reset: string;
    confirmReset: string;
  };
}

export const zh: TranslationSchema = {
  common: {
    confirm: '确认',
    cancel: '取消',
    close: '关闭',
    save: '保存',
    delete: '删除',
    copy: '复制',
    copied: '已复制',
    edit: '编辑',
    reset: '重置',
    done: '完成',
    loading: '加载中...',
    success: '成功',
    error: '错误',
    clear: '清空',
  },
  header: {
    title: '简匠',
    subtitle: '开源简历编辑与排版工具',
    aiChecker: '简历检查',
    rawImporter: '导入简历',
    shareH5: '分享',
    backupHub: '简历管理',
    exportPdf: '下载 PDF',
    exportingPdf: '生成 PDF 中...',
    legalHelp: '帮助与隐私',
    themeToggleLight: '深色模式',
    themeToggleDark: '浅色模式',
    langToggle: 'Language',
  },
  toolbar: {
    visualMode: '表单',
    markdownMode: 'Markdown',
    splitMode: '分屏',
    previewMode: '预览',
    aesthetics: '排版与样式',
    sectionSorter: '板块排序',
    autoFit: '单页适配',
    autoFitTooltip: '自动微调间距与边距，收纳于 1 页内',
    typesettingSpace: '中英排版',
    typesettingSpaceTooltip: '自动在中文与英文、数字之间插入空格',
    pageBreakLine: 'A4 辅助线',
    foldLine: '折页指示线',
    gridLines: '12px 网格',
    zoomIn: '放大预览',
    zoomOut: '缩小预览',
    zoomReset: '自适应 100%',
    historyUndo: '撤销 (Ctrl+Z)',
    historyRedo: '重做 (Ctrl+Y)',
    wordCount: '词',
    charCount: '字符',
    lineCount: '行',
  },
  aesthetics: {
    title: '排版与视觉设置',
    themeColor: '主题色彩',
    customColor: '自定义 HEX 颜色',
    fontFamily: '字体系统',
    fontSize: '基础字号',
    lineHeight: '文本行高',
    blockGap: '段落间距',
    margin: '页面边距',
    h2Style: '二级标题样式',
    topAccentLine: '顶部装饰条',
    templateLayout: '页面版式布局',
    presets: {
      sans: '现代无衬线 (Inter / Noto)',
      serif: '经典衬线 (Georgia / 宋体)',
      mono: '极客等宽 (JetBrains Mono)',
      standardFontSize: '标准 (14px)',
      compactFontSize: '紧凑 (13px)',
      spaciousFontSize: '宽松 (15px)',
      standardMargin: '标准 (20mm)',
      compactMargin: '紧凑 (15mm)',
      spaciousMargin: '宽松 (25mm)',
      accentLineH2: '左侧主题下划线',
      bgBarH2: '主题色背景块',
      minimalH2: '极简纯文本加粗',
      singleColumn: '标准单栏',
      twoColumn: '双栏布局',
    }
  },
  form: {
    basic: {
      title: '基本信息',
      desc: '姓名、联系方式与个人标签',
      pinnedTop: '固定置顶',
      nameLabel: '姓名',
      namePlaceholder: '例如：张三',
      phoneLabel: '电话号码',
      phonePlaceholder: '例如：+86 138 0013 8000',
      emailLabel: '电子邮箱',
      emailPlaceholder: '例如：zhangsan@example.com',
      wechatLabel: '微信号',
      wechatPlaceholder: '例如：wx_dev666 或 同手机号',
      wechatSameAsPhone: '同手机号',
      targetJobLabel: '求职意向',
      tagPlaceholder: '输入标签后按回车添加',
      addTagBtn: '添加',
      socialLabel: '社交链接',
      socialPlaceholder: '例如：https://github.com/username ｜ https://blog.example.com',
      expLabel: '工作经验',
      expPlaceholder: '例如：5',
      expSuffix: '年',
      studentGradBadge: '应届生',
      studentGradTooltip: '点击快速切换为应届生/在校生',
      degreeLabel: '最高学历',
      degreePlaceholder: '硕士 或 本科',
      customBtn: '自定义',
      presetBtn: '选择预设',
      customManual: '自定义输入',
      ageLabel: '年龄',
      agePlaceholder: '例如：28',
      cityLabel: '意向城市',
      cityPlaceholder: '例如：杭州、上海 或 远程',
      addCityPlaceholder: '输入城市按回车添加...',
      statusLabel: '求职状态',
      addMoreBtn: '+ 可选字段',
      collapseBtn: '收起可选字段',
      clearCity: '清空',
    },
    edu: {
      subtitle: '院校名称、学历专业与就读表现',
      schoolLabel: '院校名称',
      schoolPlaceholder: '如：清华大学',
      degreeLabel: '学历',
      degreeChoosePreset: '选择预设',
      degreeCustom: '自定义',
      degreePlaceholder: '如：本科',
      majorLabel: '专业名称',
      majorPlaceholder: '如：计算机科学与技术',
      timeLabel: '就读时间',
      timePlaceholder: '如：2020.09 - 2024.06',
      gpaLabel: '学业成绩 (选填)',
      gpaPlaceholder: '如：绩点 3.8/4.0，专业前 5%',
      coursesLabel: '核心课程 (选填)',
      coursesPlaceholder: '如：数据结构、高级算法、计算机系统',
      honorsLabel: '荣誉奖项 (选填)',
      honorsPlaceholder: '如：国家奖学金、算法竞赛一等奖',
      descLabel: '补充描述 (选填)',
      descPlaceholder: '如有其他校园经历、社团活动或实践活动可在此处填写（支持 Markdown）',
      addBtn: '添加一段教育背景',
      textLabel: '文本内容',
      textPlaceholder: '请输入教育背景，支持 Markdown...',
      customOption: '自定义输入',
    },
    section: {
      textLabel: '文本内容',
      textPlaceholder: '- **核心技能 1**：描述您的核心竞争力...',
      noItems: '该模块下暂无经历子项',
      addItem: '添加一条新经历',
      formatSpacing: '格式化中英空格',
      moveUp: '上移模块',
      moveDown: '下移模块',
      deleteSec: '删除模块',
      dragToReorder: '按住拖拽排序',
      moveItemUp: '上移此项',
      moveItemDown: '下移此项',
      deleteItem: '删除此项',
      customTextSection: '文本自由块',
      customItemSection: '经历列表块',
      standardModules: '常用模块',
      customModules: '自定义模块',
      charCountWarn: '标题较长可能会在简历单行中折行',
      periodLabel: '起止时间',
    },
    dialogs: {
      deleteSecTitle: '删除模块确认',
      deleteSecMsg: (title: string) => `确定要删除模块「${title}」吗？此操作将移除该模块的所有内容且无法撤销。`,
      deleteItemTitle: '删除经历项确认',
      deleteItemMsg: (name: string) => `确定要删除此条经历「${name || '未命名经历'}」吗？此操作将彻底删除此项内容且无法撤销。`,
      overwriteTitle: '覆盖内容提示',
      overwriteMsg: '这将会覆盖您当前已输入的内容，确定要导入推荐的内容模板吗？',
      confirmImport: '确认导入',
      confirmDelete: '确认删除',
    },
  },
  importer: {
    title: '文本解析与导入',
    description: '粘贴旧简历或纯文本，自动清洗提取为规范 Markdown。',
    placeholder: '在此粘贴您的旧简历或纯文本...\n例如：张三 手机 13800138000 邮箱 zhangsan@example.com 5年前端经验...',
    importBtn: '开始提取解析',
    privacyNotice: '所有解析纯前端完成，隐私安全零泄露。',
  },
  errorBoundary: {
    title: '遇到未预期的运行时异常',
    subtitle: '应用已停止异常渲染。若浏览器本地存储仍可读取，可先复制 Markdown 备份再重试。',
    backupCopy: '复制 Markdown 备份',
    backupCopied: '已复制 Markdown 备份',
    reload: '刷新页面重试',
    reset: '重置 Resume Craft 本地简历数据',
    confirmReset: '确定要清空 Resume Craft 的本地简历数据并重置吗？建议先备份当前简历文本。',
  }
};
