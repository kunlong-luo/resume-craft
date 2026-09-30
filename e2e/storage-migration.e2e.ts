import { expect, test, type Page } from '@playwright/test';

const legacyProfile = {
  id: 'profile_legacy',
  name: 'Legacy v2.2 Resume',
  targetRole: 'Migration Test',
  markdown: '# Migrated Candidate\n\n## Skills\n- TypeScript',
  settings: {
    themeColor: 'indigo',
    fontSize: 'standard',
    fontFamily: 'sans',
    margin: 'standard',
    layoutMode: 'split',
    h2Style: 'accent-line',
    topAccentLine: true,
    lineHeight: 1.6,
    blockGap: 1,
    letterSpacing: 0,
    showPageBreakLine: true,
    templateLayout: 'single',
    lang: 'en',
    marketRegion: 'international',
    paperSize: 'a4',
    dateStyle: 'month-short',
    themeMode: 'light',
  },
  customFileName: '',
  updatedAt: '2026-09-30T00:00:00.000Z',
  createdAt: '2026-09-30T00:00:00.000Z',
  isDefault: true,
};

async function readIndexedDb(page: Page) {
  return page.evaluate(() => new Promise<{
    activeMarkdown: string | null;
    profiles: Array<{ id: string; markdown: string }>;
    drafts: Array<{ id: string; markdown: string }>;
    migrationVersion: string | null;
  }>((resolve, reject) => {
    const request = indexedDB.open('resume-craft');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(['documents', 'profiles', 'drafts', 'meta'], 'readonly');
      const documentRequest = tx.objectStore('documents').get('active');
      const profilesRequest = tx.objectStore('profiles').getAll();
      const draftsRequest = tx.objectStore('drafts').getAll();
      const migrationRequest = tx.objectStore('meta').get('storage-migration-version');

      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => {
        const active = documentRequest.result as { markdown?: string } | undefined;
        const meta = migrationRequest.result as { value?: string } | undefined;
        resolve({
          activeMarkdown: active?.markdown ?? null,
          profiles: (profilesRequest.result ?? []).map((profile: { id: string; markdown: string }) => ({
            id: profile.id,
            markdown: profile.markdown,
          })),
          drafts: (draftsRequest.result ?? []).map((draft: { id: string; markdown: string }) => ({
            id: draft.id,
            markdown: draft.markdown,
          })),
          migrationVersion: meta?.value ?? null,
        });
        db.close();
      };
    };
  }));
}

async function openHelp(page: Page) {
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('button', { name: 'Help' }).click();
  const dialog = page.getByRole('dialog', { name: 'Help & Privacy' });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe('v2.3 local data migration', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('resume-onboarding-v1-complete', '1');
    });
  });

  test('migrates verified v2.2 core data to IndexedDB and removes legacy core keys', async ({ page }) => {
    await page.addInitScript((profile) => {
      const draft = {
        id: 'draft_legacy',
        title: 'Legacy draft',
        markdown: '# Legacy draft',
        settings: profile.settings,
        timestamp: '2026-09-30 00:00:00',
        isAutoSave: false,
      };
      window.localStorage.setItem('resume-markdown', profile.markdown);
      window.localStorage.setItem('resume-profiles', JSON.stringify([profile]));
      window.localStorage.setItem('resume-drafts', JSON.stringify([draft]));
      window.localStorage.setItem('resume-active-profile-id', profile.id);
      window.localStorage.setItem('resume-settings', JSON.stringify(profile.settings));
    }, legacyProfile);

    await page.goto('/');

    await page.getByRole('button', { name: /^(Markdown source editor|Markdown 源码编辑模式)$/ }).click();
    await expect(page.locator('#markdown-textarea')).toHaveValue(legacyProfile.markdown);

    await expect.poll(() => page.evaluate(() => ({
      markdown: localStorage.getItem('resume-markdown'),
      profiles: localStorage.getItem('resume-profiles'),
      drafts: localStorage.getItem('resume-drafts'),
    }))).toEqual({
      markdown: null,
      profiles: null,
      drafts: null,
    });

    const db = await readIndexedDb(page);
    expect(db.activeMarkdown).toBe(legacyProfile.markdown);
    expect(db.profiles).toEqual([
      expect.objectContaining({ id: legacyProfile.id, markdown: legacyProfile.markdown }),
    ]);
    expect(db.drafts).toEqual([
      expect.objectContaining({ id: 'draft_legacy', markdown: '# Legacy draft' }),
    ]);
    expect(db.migrationVersion).toBe('1');
  });

  test('clear local data removes IndexedDB records while preserving unrelated origin data', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => new Promise<void>((resolve, reject) => {
      localStorage.setItem('another-app:key', 'keep-me');
      const request = indexedDB.open('resume-craft');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('drafts', 'readwrite');
        tx.objectStore('drafts').put({
          id: 'draft_clear_sentinel',
          sortIndex: 0,
          title: 'Delete me',
          markdown: '# Sensitive',
          settings: {},
          timestamp: '2026-09-30 00:00:00',
        });
        tx.onerror = () => reject(tx.error);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
      };
    }));

    let dialog = await openHelp(page);
    await dialog.getByRole('button', { name: 'Privacy' }).click();
    await dialog.getByRole('button', { name: 'Clear local data…' }).click();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      dialog.getByRole('button', { name: 'Delete permanently' }).click(),
    ]);
    await expect(page.getByRole('button', { name: 'More actions' })).toBeVisible();

    await expect.poll(() => page.evaluate(() => localStorage.getItem('another-app:key'))).toBe('keep-me');

    const db = await readIndexedDb(page);
    expect(db.drafts.some((draft) => draft.id === 'draft_clear_sentinel')).toBe(false);
  });
});
