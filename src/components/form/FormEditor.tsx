import React from 'react';
import { BasicInfoEditor } from './BasicInfoEditor';
import { FormSectionEditor } from './FormSectionEditor';
import { EduSectionEditor } from './EduSectionEditor';
import { QuickNav } from './QuickNav';
import { SectionPresets } from './SectionPresets';
import { getSectionCategory } from '../../lib/markdown-parser';
import { useFormEditor } from '../../hooks/useFormEditor';
import { useResumeStore } from '../../store/useResumeStore';

interface FormEditorProps {
  value: string;
  onChange: (value: string, immediate?: boolean) => void;
  settings?: any;
}

export const FormEditor = React.memo(function FormEditor({ value, onChange, settings }: FormEditorProps) {
  const { uiLanguage } = useResumeStore();
  const contentLanguage = settings?.lang === 'en' ? 'en' : 'zh';
  const {
    localModel,
    expandedSections,
    setExpandedSections,
    showOptionalBasic,
    setShowOptionalBasic,
    handleModelChange,
    toggleSection,
    handleSectionTitleChange,
    handleSectionTextChange,
    handleSectionTypeChange,
    moveSection,
    deleteSection,
    addPresetSection,
    handleItemFieldChange,
    handleItemContentChange,
    moveItem,
    reorderItems,
    deleteItem,
    addItem,
    applyChineseEnglishSpacingToSection,
    insertStarTemplateToItem
  } = useFormEditor(value, onChange, settings, uiLanguage);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/60 min-w-0 overflow-x-hidden flex flex-col">
      <QuickNav 
        sections={localModel.sections} 
        expandedSections={expandedSections} 
        setExpandedSections={setExpandedSections} 
        lang={uiLanguage} 
      />

      <div className="p-6 space-y-6">
        <BasicInfoEditor
          model={localModel}
          onChange={handleModelChange}
          expanded={expandedSections['basic'] !== false}
          onToggleExpanded={() => setExpandedSections(prev => ({ ...prev, basic: prev['basic'] === false }))}
          showOptional={showOptionalBasic}
          onToggleOptional={() => setShowOptionalBasic(!showOptionalBasic)}
          lang={uiLanguage}
          contentLang={contentLanguage}
          marketRegion={settings?.marketRegion}
        />
        
        {localModel.sections.map((sec, secIndex) => {
          const category = getSectionCategory(sec.title);
          
          if (category === 'edu') {
            return (
              <EduSectionEditor
                key={sec.id}
                section={sec}
                expanded={expandedSections[sec.id] !== false}
                onToggle={() => toggleSection(sec.id)}
                onItemChange={(itemId, field, val) => handleItemFieldChange(sec.id, itemId, field as any, val)}
                onAddItem={() => addItem(sec.id, sec.title)}
                onDeleteItem={(itemId, org) => deleteItem(sec.id, itemId, org)}
                onTitleChange={(newTitle) => handleSectionTitleChange(sec.id, newTitle)}
                onApplySpacing={() => applyChineseEnglishSpacingToSection(sec.id)}
                onMove={(direction) => moveSection(secIndex, direction)}
                onDelete={() => deleteSection(sec.id, sec.title)}
                isFirst={secIndex === 0}
                isLast={secIndex === localModel.sections.length - 1}
                onTextChange={(text) => handleSectionTextChange(sec.id, text)}
                onTypeChange={(newType) => handleSectionTypeChange(sec.id, newType)}
                onMoveItem={(itemIndex, direction) => moveItem(sec.id, itemIndex, direction)}
                onReorderItem={(fromIdx, toIdx) => reorderItems(sec.id, fromIdx, toIdx)}
                lang={uiLanguage}
                contentLang={contentLanguage}
                marketRegion={settings?.marketRegion}
              />
            );
          }

          return (
            <FormSectionEditor
              key={sec.id}
              sec={sec}
              secIndex={secIndex}
              totalSectionsCount={localModel.sections.length}
              isExpanded={expandedSections[sec.id] !== false}
              onToggle={() => toggleSection(sec.id)}
              onTitleChange={(newTitle) => handleSectionTitleChange(sec.id, newTitle)}
              onTextChange={(text) => handleSectionTextChange(sec.id, text)}
              onMove={(direction) => moveSection(secIndex, direction)}
              onDelete={() => deleteSection(sec.id, sec.title)}
              onApplySpacing={() => applyChineseEnglishSpacingToSection(sec.id)}
              onAddItem={() => addItem(sec.id, sec.title)}
              onMoveItem={(itemIndex, direction) => moveItem(sec.id, itemIndex, direction)}
              onReorderItem={(fromIdx, toIdx) => reorderItems(sec.id, fromIdx, toIdx)}
              onDeleteItem={(itemId, itemOrg) => deleteItem(sec.id, itemId, itemOrg)}
              onItemFieldChange={(itemId, field, val) => handleItemFieldChange(sec.id, itemId, field, val)}
              onItemContentChange={(itemId, content) => handleItemContentChange(sec.id, itemId, content)}
              onInsertStarTemplate={(itemId, currentContent) => insertStarTemplateToItem(sec.id, itemId, currentContent, sec.title)}
              onTypeChange={(newType) => handleSectionTypeChange(sec.id, newType)}
              lang={uiLanguage}
              contentLang={contentLanguage}
              marketRegion={settings?.marketRegion}
            />
          );
        })}

        <SectionPresets onAddPreset={addPresetSection} sections={localModel.sections} lang={uiLanguage} />
      </div>
    </div>
  );
});
export default FormEditor;
