import React from 'react';
import { DownloadCloud, UploadCloud, FileJson } from 'lucide-react';

interface BackupTabProps {
  handleExportConfig: () => void;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  importDragActive: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImportConfig: (file: File) => void;
  lang?: string;
}

export function BackupTab({
  handleExportConfig,
  handleDrag,
  handleDrop,
  importDragActive,
  fileInputRef,
  handleImportConfig,
  lang
}: BackupTabProps) {
  const isEn = lang === 'en';

  return (
    <div className="space-y-6 h-full flex flex-col justify-between">
      <div className="space-y-5">
        {/* Informational Card */}
        <div className="bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100/60 dark:border-indigo-800/60 rounded-xl p-4.5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed space-y-1.5 shadow-sm">
          <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-[12px]">
            <span>📦</span>
            <span>{isEn ? 'What is the Full Configuration File (.json)?' : '什么是 JSON 配置文件？'}</span>
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-justify text-[11px] font-medium leading-relaxed">
            {isEn ? (
              <>
                Compared to exporting pure Markdown text, the <strong>Full Configuration File (.json)</strong> packs your <strong>resume content and all customized layout options (fonts, theme colors, spacing fine-tuning, page guide lines, etc.)</strong> into a single JSON file. Importing this file restores the Resume Craft content and layout settings saved in the backup.
              </>
            ) : (
              <>
                JSON 备份包含简历全部文字及自定义排版参数（如字体、行高、页边距、主题色等）。在其他设备或浏览器导入后，可恢复备份中保存的简历内容与 Resume Craft 排版设置。
              </>
            )}
          </p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Export Section */}
          <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-850 shadow-sm flex flex-col justify-between space-y-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
            <div className="space-y-2.5">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit border border-indigo-100/40 dark:border-indigo-800/60">
                <DownloadCloud className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                {isEn ? 'Export Full Backup' : '导出 JSON 备份'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {isEn 
                  ? 'Bundle current resume markdown, line heights, spacing increments, font family, margins, and advanced parameters into a single JSON.'
                  : '打包并下载当前的简历文字与全部排版参数。'}
              </p>
            </div>
            <button
              onClick={handleExportConfig}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/10 cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>{isEn ? 'Generate & Download .json' : '导出 .json 备份'}</span>
            </button>
          </div>

          {/* Drag & Drop Import Box */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-3.5 ${
              importDragActive
                ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/20 dark:bg-slate-850 hover:bg-indigo-50/10 dark:hover:bg-slate-800'
            }`}
          >
            <div className={`p-2.5 rounded-xl transition-colors border ${importDragActive ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 shadow-sm'}`}>
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                {isEn ? 'Import Backup & Restore' : '导入 JSON 恢复'}
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[200px] mx-auto mt-1 leading-relaxed font-medium">
                {isEn 
                  ? 'Drag & drop your configuration backup (.json) here, or click to browse and upload.'
                  : '拖拽备份文件 (.json) 到此处或点击上传，瞬间还原简历排版。'}
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,.JSON,application/json"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImportConfig(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
