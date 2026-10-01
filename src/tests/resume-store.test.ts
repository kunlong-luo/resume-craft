import { beforeEach, describe, expect, it } from 'vitest';
import { useResumeStore } from '../store/useResumeStore';
import type { ResumeProfile } from '../types';

function buildProfile(id: string, markdown: string, customFileName?: string): ResumeProfile {
  const settings = useResumeStore.getState().settings;
  const now = new Date().toISOString();

  return {
    id,
    name: id,
    targetRole: 'Test',
    markdown,
    settings,
    customFileName,
    updatedAt: now,
    createdAt: now,
    isDefault: false,
  };
}

describe('resume store state consistency', () => {
  beforeEach(() => {
    const profile = buildProfile('profile_test', 'second', 'resume-second');

    useResumeStore.setState({
      profiles: [profile],
      activeProfileId: profile.id,
      markdown: 'second',
      customFileName: 'resume-second',
      history: ['first', 'second'],
      historyIndex: 1,
      isSaving: false,
      saveStatus: 'saved',
      measuredPageCount: null,
    });
  });

  it('invalidates measured page count when content or layout changes', () => {
    useResumeStore.setState({ measuredPageCount: 2 });

    useResumeStore.getState().handleMarkdownChange('changed content', true);
    expect(useResumeStore.getState().measuredPageCount).toBeNull();

    useResumeStore.setState({ measuredPageCount: 2 });
    useResumeStore.getState().updateSetting('paperSize', 'letter');
    expect(useResumeStore.getState().measuredPageCount).toBeNull();

    useResumeStore.setState({ measuredPageCount: 2 });
    useResumeStore.getState().setMarkdown('direct content');
    expect(useResumeStore.getState().measuredPageCount).toBeNull();
  });

  it('persists undo into the active profile and keeps the next edit in history', () => {
    useResumeStore.getState().handleUndo();

    let state = useResumeStore.getState();
    expect(state.markdown).toBe('first');
    expect(state.profiles[0].markdown).toBe('first');
    expect(state.historyIndex).toBe(0);

    state.handleMarkdownChange('branched edit', true);
    state = useResumeStore.getState();

    expect(state.markdown).toBe('branched edit');
    expect(state.profiles[0].markdown).toBe('branched edit');
    expect(state.history).toEqual(['first', 'branched edit']);
    expect(state.historyIndex).toBe(1);
  });

  it('persists redo into the active profile', () => {
    useResumeStore.setState({
      markdown: 'first',
      profiles: [buildProfile('profile_test', 'first', 'resume-first')],
      history: ['first', 'second'],
      historyIndex: 0,
    });

    useResumeStore.getState().handleRedo();

    const state = useResumeStore.getState();
    expect(state.markdown).toBe('second');
    expect(state.profiles[0].markdown).toBe('second');
    expect(state.historyIndex).toBe(1);
  });

  it('fully switches template and history state when deleting the active profile', () => {
    const first = {
      ...buildProfile('profile_first', 'first content'),
      templateId: 'ca_tech',
    };
    const second = {
      ...buildProfile('profile_second', 'second content'),
      templateId: 'cn_demo',
    };

    useResumeStore.setState({
      profiles: [first, second],
      activeProfileId: first.id,
      markdown: first.markdown,
      settings: first.settings,
      currentTemplateId: 'ca_tech',
      history: ['older', first.markdown],
      historyIndex: 1,
    });

    expect(useResumeStore.getState().deleteProfile(first.id)).toBe(true);

    const state = useResumeStore.getState();
    expect(state.activeProfileId).toBe(second.id);
    expect(state.markdown).toBe(second.markdown);
    expect(state.currentTemplateId).toBe('cn_demo');
    expect(state.history).toEqual([second.markdown]);
    expect(state.historyIndex).toBe(0);
  });

  it('activates imported data even when the imported profile id matches the current id', () => {
    useResumeStore.setState({
      activeProfileId: 'profile_same',
      markdown: 'stale current content',
      profiles: [buildProfile('profile_same', 'stale current content', 'stale-name')],
      customFileName: 'stale-name',
    });

    const imported = {
      ...buildProfile('profile_same', 'restored imported content'),
      templateId: 'removed-template',
    };

    useResumeStore.getState().importProfiles([imported]);

    const state = useResumeStore.getState();
    expect(state.activeProfileId).toBe('profile_same');
    expect(state.markdown).toBe('restored imported content');
    expect(state.profiles[0].markdown).toBe('restored imported content');
    expect(state.customFileName).toBe('');
    expect(state.history).toEqual(['restored imported content']);
    expect(state.historyIndex).toBe(0);
  });


  it('persists template identity independently from edited markdown', () => {
    const source = {
      ...buildProfile('profile_source', 'template content'),
      templateId: 'ca_tech',
    };
    const other = {
      ...buildProfile('profile_other', 'other content'),
      templateId: 'custom',
    };

    useResumeStore.setState({
      profiles: [source, other],
      activeProfileId: source.id,
      markdown: source.markdown,
      settings: source.settings,
      currentTemplateId: 'ca_tech',
      history: [source.markdown],
      historyIndex: 0,
    });

    useResumeStore.getState().handleMarkdownChange('edited template content', true);
    useResumeStore.getState().switchProfile(other.id);
    useResumeStore.getState().switchProfile(source.id);

    const state = useResumeStore.getState();
    expect(state.currentTemplateId).toBe('ca_tech');
    expect(state.markdown).toBe('edited template content');
    expect(state.profiles.find(profile => profile.id === source.id)?.templateId).toBe('ca_tech');
  });

  it('stores an explicitly selected template id on the active profile', () => {
    useResumeStore.getState().setCurrentTemplateId('cn_demo');

    const state = useResumeStore.getState();
    expect(state.currentTemplateId).toBe('cn_demo');
    expect(state.profiles[0].templateId).toBe('cn_demo');
  });

  it('applies a template atomically with market metadata and a fresh history baseline', () => {
    useResumeStore.setState({
      markdown: 'old custom content',
      currentTemplateId: 'custom',
      history: ['older', 'old custom content'],
      historyIndex: 1,
      settings: {
        ...useResumeStore.getState().settings,
        marketRegion: 'ca',
        paperSize: 'letter',
        dateStyle: 'month-short',
      },
    });

    const applied = useResumeStore.getState().applyTemplate('cn_demo');
    expect(applied).toBe(true);

    const state = useResumeStore.getState();
    expect(state.currentTemplateId).toBe('cn_demo');
    expect(state.settings.marketRegion).toBe('cn');
    expect(state.settings.paperSize).toBe('a4');
    expect(state.settings.dateStyle).toBe('cn-dot');
    expect(state.markdown).toContain('Resume Craft 中文通用 Demo');
    expect(state.profiles[0].templateId).toBe('cn_demo');
    expect(state.profiles[0].settings.marketRegion).toBe('cn');
    expect(state.history).toEqual([state.markdown]);
    expect(state.historyIndex).toBe(0);
  });

  it('does not partially mutate state when applying an unknown template', () => {
    const before = useResumeStore.getState();

    const applied = useResumeStore.getState().applyTemplate('missing-template');

    expect(applied).toBe(false);
    const after = useResumeStore.getState();
    expect(after.markdown).toBe(before.markdown);
    expect(after.settings).toEqual(before.settings);
    expect(after.currentTemplateId).toBe(before.currentTemplateId);
  });

  it('clears a previous filename when switching to a profile without one', () => {
    const first = buildProfile('profile_first', 'first content', 'first-file');
    const second = buildProfile('profile_second', 'second content');

    useResumeStore.setState({
      profiles: [first, second],
      activeProfileId: first.id,
      markdown: first.markdown,
      settings: first.settings,
      customFileName: 'first-file',
      history: [first.markdown],
      historyIndex: 0,
    });

    useResumeStore.getState().switchProfile(second.id);

    const state = useResumeStore.getState();
    expect(state.activeProfileId).toBe(second.id);
    expect(state.customFileName).toBe('');
  });
});
