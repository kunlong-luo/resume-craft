import React, { useState, useEffect, useRef } from 'react';
import { X, Database, History, FileJson, AlertCircle, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResumeSettings, ResumeDraft } from '../../types';
import { ProfilesTab } from './ProfilesTab';
import { DraftsTab } from './DraftsTab';
import { BackupTab } from './BackupTab';
import { useConfirm } from '../../context/ConfirmContext';
import { useResumeStore } from '../../store/useResumeStore';
import { resumeRepository } from '../../lib/resume-repository';
import { normalizeResumeBackup } from '../../lib/import-validation';
import { TEMPLATES } from '../../data';
import { useDialogFocus } from '../../hooks/useDialogFocus';

const MAX_BACKUP_IMPORT_FILE_SIZE = 3 * 1024 * 1024;

export function BackupDraftModal() {
  const {
    markdown,
    settings,
    isBackupHubOpen: isOpen,
    setIsBackupHubOpen,
    currentTemplateId,
    replaceDocument,
    uiLanguage,
  } = useResumeStore();

  const onClose = () => setIsBackupHubOpen(false);

  const onRestore = (
    newMarkdown: string,
    newSettings: ResumeSettings,
    templateId?: string,
  ) => {
    const safeTemplateId =
      templateId && (templateId === 'custom' || TEMPLATES.some(template => template.id === templateId))
        ? templateId
        : 'custom';

    replaceDocument(newMarkdown, newSettings, safeTemplateId);
  };

  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<'profiles' | 'drafts' | 'backup'>('profiles');
  const [drafts, setDrafts] = useState<ResumeDraft[]>([]);
  const [newDraftTitle, setNewDraftTitle] = useState('');
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [importDragActive, setImportDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus({ isOpen, dialogRef, onClose });

  useEffect(() => {
    if (isOpen) {
      void loadDrafts();
    }
  }, [isOpen]);

  const loadDrafts = async () => {
    try {
      const parsed = await resumeRepository.getDrafts();
      const sanitized = parsed.map((draft) => {
        if (draft.isAutoSave && draft.title?.includes('自动备份 - ')) {
          return {
            ...draft,
            title: draft.title.replace('自动备份 - ', ''),
          };
        }
        return draft;
      });
      setDrafts(sanitized);
    } catch (error) {
      console.error('Error loading drafts from IndexedDB', error);
      setDrafts([]);
    }
  };

  const saveDraftsList = (updatedDrafts: ResumeDraft[]) => {
    setDrafts(updatedDrafts);
    void resumeRepository.replaceDrafts(updatedDrafts).catch((error) => {
      console.error('Error saving drafts to IndexedDB', error);
      setErrorMessage(uiLanguage === 'en' ? 'Failed to save local draft.' : '本地草稿保存失败。');
      setTimeout(() => setErrorMessage(''), 3000);
    });
  };

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(''), 3000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    const isEn = uiLanguage === 'en';
    const title = newDraftTitle.trim() || (isEn ? `Draft - ${new Date().toLocaleString('en-US', { hour12: false })}` : `草稿版 - ${new Date().toLocaleString('zh-CN', { hour12: false })}`);
    
    const newDraft: ResumeDraft = {
      id: `draft_${Date.now()}`,
      title,
      markdown,
      settings,
      templateId: currentTemplateId,
      timestamp: new Date().toLocaleString(isEn ? 'en-US' : 'zh-CN', { hour12: false }),
      isAutoSave: false
    };

    const updated = [newDraft, ...drafts];
    saveDraftsList(updated);
    setNewDraftTitle('');
    showToast(isEn ? 'Draft saved successfully!' : '草稿保存成功！');
  };

  const handleRestoreDraft = async (draft: ResumeDraft) => {
    const isEn = uiLanguage === 'en';
    const confirmed = await confirm({
      title: isEn ? 'Restore Draft' : '恢复草稿确认',
      message: isEn 
        ? `Are you sure you want to restore draft "${draft.title}"? Your current editor content and styles will be overwritten.`
        : `确认要恢复草稿「${draft.title}」吗？您当前的编辑内容和排版格式将被覆盖。`,
      confirmText: isEn ? 'Restore' : '确认恢复',
      cancelText: isEn ? 'Cancel' : '取消',
      type: 'warning'
    });
    if (confirmed) {
      onRestore(draft.markdown, draft.settings, draft.templateId);
      showToast(isEn ? 'Draft restored successfully!' : '草稿恢复成功！');
      setTimeout(() => onClose(), 800);
    }
  };

  const handleDeleteDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isEn = uiLanguage === 'en';
    const confirmed = await confirm({
      title: isEn ? 'Delete Draft' : '删除草稿确认',
      message: isEn
        ? 'Are you sure you want to delete this draft? This action cannot be undone.'
        : '确定要删除这个草稿吗？此操作无法撤销。',
      confirmText: isEn ? 'Delete' : '确认删除',
      cancelText: isEn ? 'Cancel' : '取消',
      type: 'danger'
    });
    if (confirmed) {
      const updated = drafts.filter(d => d.id !== id);
      saveDraftsList(updated);
      showToast(isEn ? 'Draft deleted' : '草稿已删除');
    }
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingTitle.trim()) return;
    const isEn = uiLanguage === 'en';
    const updated = drafts.map(d => d.id === id ? { ...d, title: editingTitle.trim() } : d);
    saveDraftsList(updated);
    setEditingDraftId(null);
    showToast(isEn ? 'Renamed successfully' : '重命名成功');
  };

  const handleExportConfig = () => {
    const isEn = uiLanguage === 'en';
    try {
      const backupData = {
        version: "markdown-resume-backup-v1",
        exportedAt: new Date().toLocaleString(isEn ? 'en-US' : 'zh-CN', { hour12: false }),
        markdown,
        settings,
        templateId: currentTemplateId,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      let title = 'my-resume-backup';
      const nameMatch = markdown.match(/#\s+([^\n]+)/);
      if (nameMatch && nameMatch[1]) {
        title = nameMatch[1].trim().replace(/[\\\/:*?"<>|]/g, '-');
      }

      link.href = url;
      link.setAttribute('download', `${title}_full_backup.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(isEn ? 'Configuration exported successfully!' : '配置文件导出成功！');
    } catch (e) {
      showToast(isEn ? 'Export failed, please try again' : '导出失败，请重试', true);
    }
  };

  const handleImportConfig = (file: File) => {
    if (!file) return;
    const isEn = uiLanguage === 'en';
    const fileName = file.name.toLowerCase();
    if (file.type !== 'application/json' && !fileName.endsWith('.json')) {
      showToast(isEn ? 'Only .json files are supported' : '仅支持导入 .json 格式的备份文件', true);
      return;
    }
    if (file.size > MAX_BACKUP_IMPORT_FILE_SIZE) {
      showToast(
        isEn
          ? 'Backup files must be smaller than 3 MB.'
          : '备份文件需小于 3 MB。',
        true,
      );
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      showToast(
        isEn
          ? 'The backup file could not be read.'
          : '无法读取备份文件，请检查文件后重试。',
        true,
      );
    };
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = normalizeResumeBackup(JSON.parse(text), settings);

        if (!parsed) {
          showToast(isEn ? 'Invalid or unsupported resume backup file' : '备份文件无效、损坏或包含不支持的配置', true);
          return;
        }

        const confirmed = await confirm({
          title: isEn ? 'Import Configuration' : '导入备份配置文件',
          message: isEn
            ? `Backup file loaded successfully (created at: ${parsed.exportedAt || 'unknown'}).\nAre you sure you want to import? This will overwrite your current content and settings.`
            : `解析成功！文件备份于: ${parsed.exportedAt || '未知时间'}。\n确认导入吗？这将覆盖您当前所有的简历内容与排版配置。`,
          confirmText: isEn ? 'Import' : '确认导入',
          cancelText: isEn ? 'Cancel' : '取消',
          type: 'warning'
        });

        if (confirmed) {
          onRestore(parsed.markdown, parsed.settings, parsed.templateId);
          showToast(isEn ? 'Configuration imported successfully!' : '备份文件导入并恢复成功！');
          setTimeout(() => onClose(), 800);
        }
      } catch (err) {
        showToast(isEn ? 'Failed to parse JSON backup' : '解析 JSON 失败，文件可能已损坏', true);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setImportDragActive(true);
    } else if (e.type === 'dragleave') {
      setImportDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImportDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImportConfig(e.dataTransfer.files[0]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[3px] cursor-pointer"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="backup-hub-title"
            aria-describedby="backup-hub-description"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-4xl h-[640px] max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden z-10 flex flex-col transition-colors"
          >
            {/* Top Gradient Accent Bar */}
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            {/* Header Area */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-5 border-b border-slate-100/80 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100/50 dark:border-indigo-800/60 shrink-0">
                  <Database className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 id="backup-hub-title" className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm tracking-tight flex items-center gap-2">
                    {uiLanguage === 'en' ? 'Resume Management' : '简历管理'}
                  </h3>
                  <p id="backup-hub-description" className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                    {uiLanguage === 'en' 
                      ? 'Manage resumes, drafts, and backups.'
                      : '管理简历、草稿和备份。'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label={uiLanguage === 'en' ? 'Close resume management dialog' : '关闭简历管理弹窗'}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Switched Navigation Bar */}
            <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-100/80 dark:border-slate-800 overflow-x-auto scrollbar-none">
              <div className="flex p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl gap-1 shrink-0">
                {(
                  [
                    { id: 'profiles', icon: Layers, label: uiLanguage === 'en' ? 'Resumes' : '简历' },
                    { id: 'drafts', icon: History, label: uiLanguage === 'en' ? `Drafts (${drafts.length})` : `草稿 (${drafts.length})` },
                    { id: 'backup', icon: FileJson, label: uiLanguage === 'en' ? 'Backup' : '备份' }
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`relative flex items-center gap-1.5 py-1 sm:py-1.5 px-2.5 sm:px-4 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 whitespace-nowrap z-10 ${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-300'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="backupTabActiveCapsule"
                          className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm ring-1 ring-slate-100 dark:ring-slate-600 z-[-1]"
                          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                        />
                      )}
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>


            </div>

            <AnimatePresence>
              {(successMessage || errorMessage) && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  role={errorMessage ? 'alert' : 'status'}
                  aria-live={errorMessage ? 'assertive' : 'polite'}
                  className={`absolute top-[125px] left-6 right-6 z-20 p-3.5 rounded-xl text-xs flex items-center gap-2.5 shadow-md border backdrop-blur-md ${
                    errorMessage 
                      ? 'bg-rose-50/95 dark:bg-rose-950/95 border-rose-100 dark:border-rose-900 text-rose-800 dark:text-rose-200' 
                      : 'bg-emerald-50/95 dark:bg-emerald-950/95 border-emerald-100 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
                  }`}
                >
                  <AlertCircle className={`w-4 h-4 ${errorMessage ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                  <span className="font-bold">{successMessage || errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Modal Body Container */}
            <div className="flex-1 overflow-y-auto p-0 sm:p-6 bg-white dark:bg-slate-900 scrollbar-thin">
              {activeTab === 'profiles' ? (
                <ProfilesTab
                  lang={uiLanguage}
                  showToast={showToast}
                />
              ) : activeTab === 'drafts' ? (
                <DraftsTab 
                  drafts={drafts}
                  newDraftTitle={newDraftTitle}
                  setNewDraftTitle={setNewDraftTitle}
                  handleCreateDraft={handleCreateDraft}
                  handleRestoreDraft={handleRestoreDraft}
                  editingDraftId={editingDraftId}
                  setEditingDraftId={setEditingDraftId}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  handleSaveRename={handleSaveRename}
                  handleDeleteDraft={handleDeleteDraft}
                  lang={uiLanguage}
                />
              ) : (
                <BackupTab 
                  handleExportConfig={handleExportConfig}
                  handleDrag={handleDrag}
                  handleDrop={handleDrop}
                  importDragActive={importDragActive}
                  fileInputRef={fileInputRef}
                  handleImportConfig={handleImportConfig}
                  lang={uiLanguage}
                />
              )}
            </div>

            {/* Modal Footer Area */}
            <div className="px-6 py-4.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm active:scale-98"
              >
                {uiLanguage === 'en' ? 'Close' : '关闭'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}