import React, { useState } from 'react';
import { 
  Layers, 
  Check, 
  Plus, 
  Copy, 
  Trash2, 
  Edit2, 
  GitCompare, 
  Calendar
} from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { ResumeProfile } from '../../types';
import { NewProfileModal } from '../profile/NewProfileModal';
import { useConfirm } from '../../context/ConfirmContext';
import { Tooltip } from '../ui/Tooltip';
import { BLANK_MARKDOWN } from '../../data';

interface ProfilesTabProps {
  lang?: string;
  showToast: (msg: string, isError?: boolean) => void;
}

export function ProfilesTab({ lang, showToast }: ProfilesTabProps) {
  const isEn = lang === 'en';
  const { 
    profiles, 
    activeProfileId, 
    switchProfile, 
    duplicateProfile, 
    createProfile,
    renameProfile, 
    deleteProfile
  } = useResumeStore();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  
  // Comparison modal state
  const [compareTargetId, setCompareTargetId] = useState<string | null>(null);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  const handleFastBlank = () => {
    const count = profiles.length + 1;
    const newProfile = createProfile({
      name: `${isEn ? 'Resume Version' : '简历档案'} ${count}`,
      targetRole: isEn ? 'New Role' : '求职版',
      markdown: BLANK_MARKDOWN,
      templateId: 'custom',
    });
    showToast(isEn ? `Created "${newProfile.name}"` : `已新建「${newProfile.name}」并自动切换`);
  };
  const handleStartEdit = (p: ResumeProfile) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditRole(p.targetRole || '');
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      renameProfile(id, editName.trim(), editRole.trim() || undefined);
      showToast(isEn ? 'Profile updated' : '简历档案信息已更新');
    }
    setEditingId(null);
  };

  const { confirm } = useConfirm();

  const handleDelete = async (id: string, name: string) => {
    if (profiles.length <= 1) {
      showToast(isEn ? 'Cannot delete the only remaining profile' : '至少需要保留一份简历档案，无法删除', true);
      return;
    }
    const confirmed = await confirm({
      title: isEn ? 'Delete Profile' : '确认删除档案',
      message: isEn ? `Are you sure you want to delete profile "${name}"?` : `确定要删除简历档案「${name}」吗？此操作无法撤销。`,
      confirmText: isEn ? 'Delete' : '确认删除',
      cancelText: isEn ? 'Cancel' : '取消',
      type: 'danger'
    });
    if (confirmed) {
      deleteProfile(id);
      showToast(isEn ? 'Profile deleted' : '档案已删除');
    }
  };

  const handleDuplicate = (id: string) => {
    const dup = duplicateProfile(id);
    showToast(isEn ? `Duplicated as "${dup.name}"` : `已创建副本「${dup.name}」并自动切换`);
  };


  const compareTarget = profiles.find(p => p.id === compareTargetId);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
      {/* Clean Sub-Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 shrink-0">
            <Layers className="w-4 h-4" />
          </span>
          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {isEn ? 'Resume Profiles' : '简历档案库'}
          </h4>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
            {profiles.length}
          </span>
        </div>

        <Tooltip content={isEn ? 'Create from current resume, a template, or a blank profile' : '从当前简历、模板或空白档案创建'}>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isEn ? 'New Profile' : '新建档案'}</span>
          </button>
        </Tooltip>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((p) => {
          const isActive = p.id === activeProfileId;
          const isEditing = editingId === p.id;
          const previewLines = p.markdown
            .split('\n')
            .filter(line => line.trim().length > 0 && !line.startsWith('##'))
            .slice(0, 3)
            .join(' · ')
            .replace(/[#*`]+/g, '');

          return (
            <div
              key={p.id}
              onClick={() => {
                if (!isActive && !isEditing) {
                  switchProfile(p.id);
                  showToast(isEn ? `Switched to "${p.name}"` : `已切换为「${p.name}」`);
                }
              }}
              className={`group relative rounded-2xl border p-4.5 flex flex-col justify-between transition-all duration-200 ${
                isActive
                  ? 'bg-white dark:bg-slate-850 border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                  : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-750 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
              }`}
            >
              {/* Header & Editing Form */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="space-y-2 p-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-indigo-200 dark:border-indigo-800"
                      >
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(p.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          placeholder={isEn ? 'Profile name' : '档案名称'}
                          className="w-full text-xs font-bold px-2.5 py-1 bg-white dark:bg-slate-900 border border-indigo-400 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(p.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          placeholder={isEn ? 'Target role tag' : '岗位标签（如：前端高级工程师）'}
                          className="w-full text-[11px] px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none"
                        />
                        <div className="flex items-center gap-1.5 justify-end pt-1">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md text-[11px] font-medium cursor-pointer"
                          >
                            {isEn ? 'Cancel' : '取消'}
                          </button>
                          <button
                            onClick={() => handleSaveEdit(p.id)}
                            className="px-2.5 py-1 bg-indigo-600 text-white rounded-md text-[11px] font-bold cursor-pointer"
                          >
                            {isEn ? 'Save' : '保存'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-tight truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {p.name}
                          </h5>
                          {p.targetRole && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                              {p.targetRole}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {isActive && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800 flex items-center gap-1 shrink-0 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      <span>{isEn ? 'Active' : '正在编辑中'}</span>
                    </span>
                  )}
                </div>

                {/* Content Preview Snippet Box */}
                {!isEditing && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/80 font-mono text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {previewLines || (isEn ? 'No content preview' : '暂无内容概要')}
                  </div>
                )}

                {/* Metadata tags */}
                <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'Active'}</span>
                  </span>
                  <span>·</span>
                  <span className="capitalize">
                    {p.settings?.themeColor || 'Indigo'} · {p.settings?.fontSize || 'Standard'}
                  </span>
                </div>
              </div>

              {/* Bottom Actions Toolbar */}
              <div className="flex items-center justify-between gap-1 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px]">
                  {isActive && (
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{isEn ? 'Active Profile' : '当前激活简历'}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Tooltip content={isEn ? 'Duplicate as new profile' : '复制为独立副本'}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(p.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>

                  <Tooltip content={isEn ? 'Rename profile' : '重命名档案'}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(p);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>

                  {!isActive && (
                    <Tooltip content={isEn ? 'Compare with active profile' : '与当前档案进行双向内容对比'}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCompareTargetId(p.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/50 transition-colors cursor-pointer"
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  )}

                  {profiles.length > 1 && (
                    <Tooltip content={isEn ? 'Delete profile' : '删除此档案'}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p.id, p.name);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Create New Blank Profile Tile */}
        <button
          onClick={handleFastBlank}
          className="group min-h-[160px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-750 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/40 hover:bg-indigo-50/30 dark:bg-slate-900/30 dark:hover:bg-indigo-950/20 p-5 flex flex-col items-center justify-center text-center transition-all cursor-pointer group active:scale-[0.98]"
        >
          <div className="p-3 rounded-full bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-100 dark:border-slate-700 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="mt-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {isEn ? 'Create Blank Profile' : '创建空白简历档案'}
          </span>
        </button>
      </div>

      {/* Comparison Modal */}
      {compareTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-3xl w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-purple-600" />
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                  {isEn ? 'Profile Comparison' : '档案内容双向对比'}
                </h4>
              </div>
              <button
                onClick={() => setCompareTargetId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 flex-1 overflow-hidden">
              <div className="flex flex-col h-full border border-slate-200 dark:border-slate-750 rounded-xl overflow-hidden">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 border-b border-indigo-100 dark:border-indigo-900">
                  {isEn ? 'Current Active' : '当前激活'}: {activeProfile.name}
                </div>
                <div className="p-3 font-mono text-[11px] overflow-y-auto whitespace-pre-wrap bg-slate-50/50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex-1">
                  {activeProfile.markdown}
                </div>
              </div>

              <div className="flex flex-col h-full border border-slate-200 dark:border-slate-750 rounded-xl overflow-hidden">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-xs font-bold text-purple-700 dark:text-purple-300 border-b border-purple-100 dark:border-purple-900">
                  {isEn ? 'Compared Profile' : '对比目标'}: {compareTarget.name}
                </div>
                <div className="p-3 font-mono text-[11px] overflow-y-auto whitespace-pre-wrap bg-slate-50/50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex-1">
                  {compareTarget.markdown}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setCompareTargetId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
              >
                {isEn ? 'Close' : '关闭'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Profile Modal */}
      <NewProfileModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
