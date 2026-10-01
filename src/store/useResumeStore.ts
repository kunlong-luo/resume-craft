import { create } from 'zustand';
import { STARTER_MARKDOWN, STARTER_MARKDOWN_EN, TEMPLATES } from '../data';
import { ResumeSettings, ResumeProfile, MarketRegion } from '../types';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { translateMarkdownContent } from '../lib/section-translator';
import { migrateStoredMarkdown } from '../lib/markdown-migrations';
import { getMarketProfile, isMarketRegion, resolveDefaultPaperSize } from '../lib/market-profile';
import { isPaperSize } from '../lib/paper';
import { getResumeBootstrapSnapshot } from '../lib/resume-bootstrap-state';

interface ResumeState {
  // States
  markdown: string;
  settings: ResumeSettings;
  currentTemplateId: string;
  lastSaved: string;
  isSaving: boolean;
  saveStatus: 'saved' | 'editing' | 'saving';
  storageStatus: 'ok' | 'error';
  storageErrorIsQuota: boolean;
  history: string[];
  historyIndex: number;
  customFileName: string;
  isCheckerOpen: boolean;
  isIframeModalOpen: boolean;
  isBackupHubOpen: boolean;
  isHelpLegalOpen: boolean;
  isExportingPDF: boolean;
  pdfExportProgress: string | null;
  atsKeywords: string[];
  jdText: string;
  measuredPageCount: number | null;

  // Multi-Profile States
  profiles: ResumeProfile[];
  activeProfileId: string;
  isProfileHubOpen: boolean;

  // Actions
  setMarkdown: (markdown: string) => void;
  setSettings: (settings: ResumeSettings) => void;
  setCurrentTemplateId: (id: string) => void;
  setLastSaved: (lastSaved: string) => void;
  setStorageHealth: (status: 'ok' | 'error', isQuotaExceeded?: boolean) => void;
  setCustomFileName: (name: string) => void;
  setIsCheckerOpen: (open: boolean) => void;
  setIsIframeModalOpen: (open: boolean) => void;
  setIsBackupHubOpen: (open: boolean) => void;
  setIsHelpLegalOpen: (open: boolean) => void;
  setIsExportingPDF: (isExporting: boolean) => void;
  setPdfExportProgress: (progress: string | null) => void;
  setAtsKeywords: (keywords: string[]) => void;
  setJdText: (text: string) => void;
  setMeasuredPageCount: (count: number | null) => void;
  setIsProfileHubOpen: (open: boolean) => void;

  // Profile Management Actions
  switchProfile: (profileId: string) => void;
  createProfile: (data: { name: string; targetRole?: string; markdown?: string; settings?: ResumeSettings; templateId?: string }) => ResumeProfile;
  duplicateProfile: (profileId: string) => ResumeProfile;
  renameProfile: (profileId: string, name: string, targetRole?: string) => void;
  deleteProfile: (profileId: string) => boolean;
  importProfiles: (profiles: ResumeProfile[]) => void;
  
  handleMarkdownChange: (newVal: string, immediate?: boolean) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  updateSetting: <K extends keyof ResumeSettings>(key: K, value: ResumeSettings[K]) => void;
  updateSettings: (newSettings: Partial<ResumeSettings>) => void;
}

// Module-level variable for debouncing history push & save status
let debounceTimer: NodeJS.Timeout | null = null;
let typingTimer: NodeJS.Timeout | null = null;
let saveStatusTimer: NodeJS.Timeout | null = null;
let isUndoRedoAction = false;

// Helper to initialize markdown
const getInitialMarkdown = (): string => {
  const bootstrap = getResumeBootstrapSnapshot();
  const saved = bootstrap?.markdown ?? storage.get<string | null>(STORAGE_KEYS.MARKDOWN, null);
  const savedProfiles = bootstrap?.profiles ?? storage.get<ResumeProfile[] | null>(STORAGE_KEYS.PROFILES, null);
  const hasSavedMarkdown = saved !== null;
  const isFirstVisit = !hasSavedMarkdown && (!savedProfiles || savedProfiles.length === 0);

  if (isFirstVisit) {
    storage.set(STORAGE_KEYS.ONBOARDING_FIRST_VISIT, '1');
  } else {
    storage.remove(STORAGE_KEYS.ONBOARDING_FIRST_VISIT);
  }

  const browserLanguage =
    typeof navigator !== 'undefined' &&
    (navigator.language || '').toLowerCase().startsWith('zh')
      ? 'zh'
      : 'en';
  const original = saved ?? (browserLanguage === 'zh' ? STARTER_MARKDOWN : STARTER_MARKDOWN_EN);
  const migrated = migrateStoredMarkdown(original);

  return migrated;
};

// Helper to initialize currentTemplateId
const getInitialTemplateId = (initialMarkdown: string): string => {
  const match = TEMPLATES.find(t => t.content === initialMarkdown);
  return match ? match.id : 'custom';
};

// Helper to initialize and migrate settings
const sanitizeSettings = (raw: Partial<ResumeSettings> | null, defaultSettings: ResumeSettings): ResumeSettings => {
  if (!raw || typeof raw !== 'object') return defaultSettings;

  const merged = { ...defaultSettings, ...raw };

  // Sanitize numeric bounds to prevent corrupted stored state
  merged.lineHeight = typeof merged.lineHeight === 'number' && !isNaN(merged.lineHeight)
    ? Math.min(Math.max(merged.lineHeight, 1.0), 2.5)
    : defaultSettings.lineHeight;

  merged.blockGap = typeof merged.blockGap === 'number' && !isNaN(merged.blockGap)
    ? Math.min(Math.max(merged.blockGap, 0.0), 3.0)
    : defaultSettings.blockGap;

  merged.letterSpacing = typeof merged.letterSpacing === 'number' && !isNaN(merged.letterSpacing)
    ? Math.min(Math.max(merged.letterSpacing, -1.0), 2.0)
    : defaultSettings.letterSpacing;

  // Sanitize themeMode
  if (!merged.themeMode || !['light', 'dark', 'system'].includes(merged.themeMode)) {
    merged.themeMode = 'light';
  }

  // Sanitize fontSize
  if (!['compact', 'standard', 'relaxed'].includes(merged.fontSize)) {
    merged.fontSize = 'standard';
  }

  // Sanitize marketRegion
  if (!merged.marketRegion || !isMarketRegion(merged.marketRegion)) {
    merged.marketRegion = merged.lang === 'zh' ? 'cn' : 'international';
  }

  // Sanitize paperSize
  if (!merged.paperSize || !isPaperSize(merged.paperSize)) {
    merged.paperSize = resolveDefaultPaperSize(merged.marketRegion);
  }

  // Sanitize dateStyle and derive a market-appropriate default for legacy data.
  if (!merged.dateStyle || !['cn-dot', 'month-short', 'month-long'].includes(merged.dateStyle)) {
    merged.dateStyle = getMarketProfile(merged.marketRegion).dateStyle;
  }

  return merged;
};

const getBrowserLanguage = (): 'zh' | 'en' => {
  if (typeof navigator !== 'undefined') {
    const navLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
    if (navLang.startsWith('zh')) return 'zh';
  }
  return 'en';
};

const getInitialSettings = (): ResumeSettings => {
  const initialLang = getBrowserLanguage();
  const initialMarket: MarketRegion = initialLang === 'zh' ? 'cn' : 'international';

  const defaultSettings: ResumeSettings = {
    themeColor: 'indigo',
    customColor: '#4F46E5',
    fontSize: 'standard',
    fontFamily: 'sans',
    margin: 'standard',
    layoutMode: 'split',
    h2Style: 'accent-line',
    topAccentLine: true,
    lineHeight: 1.6,
    blockGap: 1.0,
    letterSpacing: 0.0,
    showPageBreakLine: true,
    templateLayout: 'single',
    lang: initialLang,
    marketRegion: initialMarket,
    paperSize: resolveDefaultPaperSize(initialMarket),
    dateStyle: getMarketProfile(initialMarket).dateStyle,
    themeMode: (storage.getString(STORAGE_KEYS.THEME_MODE, 'light') || 'light') as 'light' | 'dark' | 'system',
  };
  
  const savedSettings = storage.get<Partial<ResumeSettings> | null>(STORAGE_KEYS.SETTINGS, null);
  return sanitizeSettings(savedSettings, defaultSettings);
};

// Helper to initialize Multi-Profile Archive with migration
const getInitialProfiles = (
  defaultMd: string,
  defaultSettings: ResumeSettings
): { profiles: ResumeProfile[]; activeId: string } => {
  const bootstrapProfiles = getResumeBootstrapSnapshot()?.profiles;
  const savedProfiles = bootstrapProfiles?.length
    ? bootstrapProfiles
    : storage.get<ResumeProfile[] | null>(STORAGE_KEYS.PROFILES, null);
  const savedActiveId = storage.getString(STORAGE_KEYS.ACTIVE_PROFILE_ID, '');

  if (savedProfiles && Array.isArray(savedProfiles) && savedProfiles.length > 0) {
    // Apply only deterministic, content-preserving migrations.
    let shouldPersistMigration = false;
    const migratedProfiles = savedProfiles.map(p => {
      const markdown = typeof p.markdown === 'string'
        ? migrateStoredMarkdown(p.markdown)
        : defaultMd;
      const settings = sanitizeSettings(p.settings, defaultSettings);
      const templateId =
        typeof p.templateId === 'string' && (p.templateId === 'custom' || TEMPLATES.some(t => t.id === p.templateId))
          ? p.templateId
          : getInitialTemplateId(markdown);
      const name = p.name || '未命名简历草稿';
      const updatedAt = p.updatedAt || new Date().toISOString();
      const createdAt = p.createdAt || new Date().toISOString();

      if (
        markdown !== p.markdown ||
        JSON.stringify(settings) !== JSON.stringify(p.settings) ||
        name !== p.name ||
        updatedAt !== p.updatedAt ||
        createdAt !== p.createdAt ||
        templateId !== p.templateId
      ) {
        shouldPersistMigration = true;
      }

      return {
        ...p,
        markdown,
        settings,
        templateId,
        name,
        updatedAt,
        createdAt
      };
    });

    // Sanitized profiles are persisted asynchronously to IndexedDB after store bootstrap.
    void shouldPersistMigration;

    const activeId = migratedProfiles.some(p => p.id === savedActiveId) ? savedActiveId : migratedProfiles[0].id;
    return { profiles: migratedProfiles, activeId };
  }

  // First time initialization: seed default profiles
  const now = new Date().toISOString();
  const defaultProfile: ResumeProfile = {
    id: 'profile_default',
    name: defaultSettings.lang === 'en' ? 'Starter Resume' : '起始简历',
    targetRole: defaultSettings.lang === 'en' ? 'General' : '通用版',
    markdown: defaultMd,
    settings: defaultSettings,
    templateId: getInitialTemplateId(defaultMd),
    customFileName: storage.getString(STORAGE_KEYS.CUSTOM_FILE_NAME, ''),
    updatedAt: now,
    createdAt: now,
    isDefault: true
  };

  if (storage.getString(STORAGE_KEYS.ONBOARDING_FIRST_VISIT) === '1') {
    const firstVisitProfiles = [defaultProfile];
    storage.set(STORAGE_KEYS.ACTIVE_PROFILE_ID, defaultProfile.id);
    return { profiles: firstVisitProfiles, activeId: defaultProfile.id };
  }

  const frontendTemplate = TEMPLATES.find(t => t.id === 'frontend')?.content || defaultMd.replace('AI后端开发工程师', '资深前端工程师');
  const frontendProfile: ResumeProfile = {
    id: 'profile_frontend',
    name: '前端与全栈架构版',
    targetRole: 'Web/全栈',
    markdown: frontendTemplate,
    settings: { ...defaultSettings, themeColor: 'indigo' },
    templateId: 'frontend',
    customFileName: '',
    updatedAt: now,
    createdAt: now,
    isDefault: false
  };

  const englishTemplateRecord = TEMPLATES.find(t => t.id === 'english');
  const englishTemplate = englishTemplateRecord?.content || defaultMd;
  const englishMarket: MarketRegion = englishTemplateRecord?.targetMarket || 'international';
  const englishProfile: ResumeProfile = {
    id: 'profile_english',
    name: 'English CV (Global)',
    targetRole: 'Overseas',
    markdown: englishTemplate,
    templateId: englishTemplateRecord?.id || getInitialTemplateId(englishTemplate),
    settings: {
      ...defaultSettings,
      lang: 'en',
      themeColor: 'teal',
      marketRegion: englishMarket,
      paperSize: englishTemplateRecord?.defaultPaperSize || resolveDefaultPaperSize(englishMarket),
      dateStyle: englishTemplateRecord?.dateStyle || getMarketProfile(englishMarket).dateStyle,
    },
    customFileName: '',
    updatedAt: now,
    createdAt: now,
    isDefault: false
  };

  const initialProfiles = [defaultProfile, frontendProfile, englishProfile];
  storage.set(STORAGE_KEYS.ACTIVE_PROFILE_ID, defaultProfile.id);

  return { profiles: initialProfiles, activeId: defaultProfile.id };
};

const baseMarkdown = getInitialMarkdown();
const baseSettings = getInitialSettings();
const { profiles: initialProfiles, activeId: initialActiveId } = getInitialProfiles(baseMarkdown, baseSettings);
const activeProfile = initialProfiles.find(p => p.id === initialActiveId) || initialProfiles[0];

export const useResumeStore = create<ResumeState>((set, get) => ({
  // Initial States derived from Active Profile
  markdown: activeProfile.markdown,
  settings: activeProfile.settings,
  currentTemplateId: activeProfile.templateId || getInitialTemplateId(activeProfile.markdown),
  lastSaved: new Date().toLocaleTimeString(),
  isSaving: false,
  saveStatus: 'saved',
  storageStatus: 'ok',
  storageErrorIsQuota: false,
  history: [activeProfile.markdown],
  historyIndex: 0,
  customFileName: activeProfile.customFileName || '',
  isCheckerOpen: false,
  isIframeModalOpen: false,
  isBackupHubOpen: false,
  isHelpLegalOpen: false,
  isExportingPDF: false,
  pdfExportProgress: null,
  atsKeywords: [],
  jdText: getResumeBootstrapSnapshot()?.jdText ?? storage.getString(STORAGE_KEYS.JD_TEXT, ''),
  measuredPageCount: null,

  // Multi-Profile States
  profiles: initialProfiles,
  activeProfileId: activeProfile.id,
  isProfileHubOpen: false,

  // Simple setters
  setMarkdown: (markdown) => {
    const { profiles, activeProfileId } = get();
    const updatedProfiles = profiles.map(p =>
      p.id === activeProfileId
        ? { ...p, markdown, updatedAt: new Date().toISOString() }
        : p
    );
    set({ markdown, profiles: updatedProfiles, measuredPageCount: null });
  },
  setSettings: (settings) => {
    const { profiles, activeProfileId } = get();
    const updatedProfiles = profiles.map(p =>
      p.id === activeProfileId
        ? { ...p, settings, updatedAt: new Date().toISOString() }
        : p
    );
    storage.set(STORAGE_KEYS.SETTINGS, settings);
    set({ settings, profiles: updatedProfiles, measuredPageCount: null });
  },
  setCurrentTemplateId: (currentTemplateId) => {
    const { profiles, activeProfileId } = get();
    const updatedProfiles = profiles.map(p =>
      p.id === activeProfileId
        ? { ...p, templateId: currentTemplateId, updatedAt: new Date().toISOString() }
        : p
    );
    set({ currentTemplateId, profiles: updatedProfiles });
  },
  setLastSaved: (lastSaved) => set({ lastSaved }),
  setStorageHealth: (storageStatus, storageErrorIsQuota = false) => set({
    storageStatus,
    storageErrorIsQuota,
  }),
  setCustomFileName: (customFileName) => {
    const { profiles, activeProfileId } = get();
    const updatedProfiles = profiles.map(p =>
      p.id === activeProfileId
        ? { ...p, customFileName, updatedAt: new Date().toISOString() }
        : p
    );
    storage.set(STORAGE_KEYS.CUSTOM_FILE_NAME, customFileName);
    set({ customFileName, profiles: updatedProfiles });
  },
  setIsCheckerOpen: (isCheckerOpen) => set({ isCheckerOpen }),
  setIsIframeModalOpen: (isIframeModalOpen) => set({ isIframeModalOpen }),
  setIsBackupHubOpen: (isBackupHubOpen) => set({ isBackupHubOpen }),
  setIsHelpLegalOpen: (isHelpLegalOpen) => set({ isHelpLegalOpen }),
  setIsExportingPDF: (isExportingPDF) => set({ isExportingPDF }),
  setPdfExportProgress: (pdfExportProgress) => set({ pdfExportProgress }),
  setAtsKeywords: (atsKeywords) => set({ atsKeywords }),
  setJdText: (jdText) => set({ jdText }),
  setMeasuredPageCount: (measuredPageCount) => set({ measuredPageCount }),
  setIsProfileHubOpen: (isProfileHubOpen) => set({ isProfileHubOpen }),

  // Multi-Profile Operations
  switchProfile: (profileId: string) => {
    const { profiles, activeProfileId, markdown, settings, customFileName } = get();
    if (profileId === activeProfileId) return;

    const target = profiles.find(p => p.id === profileId);
    if (!target) return;

    // 1. Save current active profile before switching
    const updatedProfiles = profiles.map(p => {
      if (p.id === activeProfileId) {
        return {
          ...p,
          markdown,
          settings,
          customFileName,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    // 2. Persist only lightweight bootstrap preferences to localStorage.
    // Core markdown/profile content is persisted asynchronously to IndexedDB.
    storage.set(STORAGE_KEYS.ACTIVE_PROFILE_ID, target.id);
    storage.set(STORAGE_KEYS.SETTINGS, target.settings);
    if (target.customFileName !== undefined) {
      storage.set(STORAGE_KEYS.CUSTOM_FILE_NAME, target.customFileName);
    } else {
      storage.remove(STORAGE_KEYS.CUSTOM_FILE_NAME);
    }

    // 3. Switch active state
    set({
      profiles: updatedProfiles,
      activeProfileId: target.id,
      markdown: target.markdown,
      settings: target.settings,
      customFileName: target.customFileName || '',
      history: [target.markdown],
      historyIndex: 0,
      currentTemplateId: target.templateId || getInitialTemplateId(target.markdown),
      lastSaved: new Date().toLocaleTimeString(),
      measuredPageCount: null
    });
  },

  createProfile: ({ name, targetRole, markdown: newMd, settings: newSettings, templateId }) => {
    const { profiles, settings: curSettings, markdown: curMd, currentTemplateId } = get();
    const now = new Date().toISOString();
    const id = `profile_${Date.now()}`;
    const newProfile: ResumeProfile = {
      id,
      name: name.trim() || '新建简历档案',
      targetRole: targetRole?.trim() || '求职版本',
      markdown: newMd !== undefined ? newMd : curMd,
      settings: newSettings || curSettings,
      templateId: templateId ?? (newMd !== undefined ? getInitialTemplateId(newMd) : currentTemplateId),
      customFileName: '',
      updatedAt: now,
      createdAt: now,
      isDefault: false
    };

    const updatedProfiles = [...profiles, newProfile];
    set({ profiles: updatedProfiles });

    // Switch to new profile
    get().switchProfile(id);
    return newProfile;
  },

  duplicateProfile: (profileId: string) => {
    const { profiles } = get();
    const source = profiles.find(p => p.id === profileId);
    if (!source) return profiles[0];

    const isEn = source.settings.lang === 'en';
    const now = new Date().toISOString();
    const id = `profile_${Date.now()}`;
    const newProfile: ResumeProfile = {
      ...source,
      id,
      name: `${source.name} ${isEn ? '(Copy)' : '(副本)'}`,
      targetRole: source.targetRole || (isEn ? 'Tailored' : '定制版'),
      updatedAt: now,
      createdAt: now,
      isDefault: false
    };

    const updatedProfiles = [...profiles, newProfile];
    set({ profiles: updatedProfiles });

    get().switchProfile(id);
    return newProfile;
  },

  renameProfile: (profileId: string, name: string, targetRole?: string) => {
    const { profiles } = get();
    const updated = profiles.map(p => {
      if (p.id === profileId) {
        return {
          ...p,
          name: name.trim() || p.name,
          targetRole: targetRole !== undefined ? targetRole.trim() : p.targetRole,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    set({ profiles: updated });
  },

  deleteProfile: (profileId: string) => {
    const { profiles, activeProfileId } = get();
    if (profiles.length <= 1) {
      return false; // Cannot delete the last remaining profile
    }

    const updated = profiles.filter(p => p.id !== profileId);

    if (activeProfileId === profileId) {
      const nextActive = updated[0];
      storage.set(STORAGE_KEYS.ACTIVE_PROFILE_ID, nextActive.id);
      storage.set(STORAGE_KEYS.SETTINGS, nextActive.settings);
      if (nextActive.customFileName !== undefined) {
        storage.set(STORAGE_KEYS.CUSTOM_FILE_NAME, nextActive.customFileName);
      } else {
        storage.remove(STORAGE_KEYS.CUSTOM_FILE_NAME);
      }
      set({ 
        profiles: updated,
        activeProfileId: nextActive.id,
        markdown: nextActive.markdown,
        settings: nextActive.settings,
        customFileName: nextActive.customFileName || '',
        measuredPageCount: null
      });
    } else {
      set({ profiles: updated });
    }
    return true;
  },

  importProfiles: (importedProfiles: ResumeProfile[]) => {
    if (!Array.isArray(importedProfiles) || importedProfiles.length === 0) return;

    const nextActive = importedProfiles[0];
    storage.set(STORAGE_KEYS.ACTIVE_PROFILE_ID, nextActive.id);
    storage.set(STORAGE_KEYS.SETTINGS, nextActive.settings);

    if (nextActive.customFileName !== undefined) {
      storage.set(STORAGE_KEYS.CUSTOM_FILE_NAME, nextActive.customFileName);
    } else {
      storage.remove(STORAGE_KEYS.CUSTOM_FILE_NAME);
    }

    set({
      profiles: importedProfiles,
      activeProfileId: nextActive.id,
      markdown: nextActive.markdown,
      settings: nextActive.settings,
      customFileName: nextActive.customFileName || '',
      history: [nextActive.markdown],
      historyIndex: 0,
      currentTemplateId: nextActive.templateId || getInitialTemplateId(nextActive.markdown),
      lastSaved: new Date().toLocaleTimeString(),
      isSaving: false,
      saveStatus: 'saved',
      measuredPageCount: null,
    });
  },

  // Complex operations
  handleMarkdownChange: (newVal, immediate = false) => {
    const { profiles, activeProfileId } = get();

    // Auto-update active profile in profiles array
    const updatedProfiles = profiles.map(p =>
      p.id === activeProfileId
        ? { ...p, markdown: newVal, updatedAt: new Date().toISOString() }
        : p
    );
    if (typingTimer) clearTimeout(typingTimer);
    if (saveStatusTimer) clearTimeout(saveStatusTimer);

    if (immediate) {
      set({
        markdown: newVal,
        profiles: updatedProfiles,
        lastSaved: new Date().toLocaleTimeString(),
        isSaving: false,
        saveStatus: 'saved',
        measuredPageCount: null
      });
    } else {
      set({ markdown: newVal, profiles: updatedProfiles, isSaving: true, saveStatus: 'editing', measuredPageCount: null });
      
      typingTimer = setTimeout(() => {
        set({ saveStatus: 'saving' });
        saveStatusTimer = setTimeout(() => {
          set({
            lastSaved: new Date().toLocaleTimeString(),
            isSaving: false,
            saveStatus: 'saved'
          });
        }, 400);
      }, 350);
    }

    if (isUndoRedoAction) {
      isUndoRedoAction = false;
      return;
    }

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const pushToHistory = () => {
      const { history, historyIndex } = get();
      const nextHistory = history.slice(0, historyIndex + 1);
      if (nextHistory[nextHistory.length - 1] !== newVal) {
        const updated = [...nextHistory, newVal];
        if (updated.length > 50) {
          updated.shift();
          set({ history: updated, historyIndex: updated.length - 1 });
        } else {
          set({ history: updated, historyIndex: updated.length - 1 });
        }
      }
    };

    if (immediate) {
      pushToHistory();
    } else {
      debounceTimer = setTimeout(() => {
        pushToHistory();
      }, 800);
    }
  },

  handleUndo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      isUndoRedoAction = true;
      get().handleMarkdownChange(history[prevIndex], true);
      set({ historyIndex: prevIndex });
    }
  },

  handleRedo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      isUndoRedoAction = true;
      get().handleMarkdownChange(history[nextIndex], true);
      set({ historyIndex: nextIndex });
    }
  },

  updateSetting: (key, value) => {
    const prevLang = get().settings?.lang;
    const newSettings = { ...get().settings, [key]: value };
    storage.set(STORAGE_KEYS.SETTINGS, newSettings);
    if (key === 'themeMode') {
      storage.set(STORAGE_KEYS.THEME_MODE, value);
    }

    let nextMarkdown = get().markdown;
    if (key === 'lang' && value !== prevLang && (value === 'zh' || value === 'en')) {
      nextMarkdown = translateMarkdownContent(nextMarkdown, value);
    }

    const { profiles, activeProfileId } = get();
    const updatedProfiles = profiles.map(p =>
      p.id === activeProfileId
        ? { ...p, settings: newSettings, markdown: nextMarkdown, updatedAt: new Date().toISOString() }
        : p
    );
    set({ settings: newSettings, markdown: nextMarkdown, profiles: updatedProfiles, measuredPageCount: null });
  },

  updateSettings: (partialSettings) => {
    const prevLang = get().settings?.lang;
    const newSettings = { ...get().settings, ...partialSettings };
    storage.set(STORAGE_KEYS.SETTINGS, newSettings);
    if (partialSettings.themeMode) {
      storage.set(STORAGE_KEYS.THEME_MODE, partialSettings.themeMode);
    }

    let nextMarkdown = get().markdown;
    if (partialSettings.lang && partialSettings.lang !== prevLang && (partialSettings.lang === 'zh' || partialSettings.lang === 'en')) {
      nextMarkdown = translateMarkdownContent(nextMarkdown, partialSettings.lang);
    }

    const { profiles, activeProfileId } = get();
    const updatedProfiles = profiles.map(p =>
      p.id === activeProfileId
        ? { ...p, settings: newSettings, markdown: nextMarkdown, updatedAt: new Date().toISOString() }
        : p
    );
    set({ settings: newSettings, markdown: nextMarkdown, profiles: updatedProfiles, measuredPageCount: null });
  }
}));