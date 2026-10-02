import { expect, test } from '@playwright/test';
import { readActiveMarkdown, readProfiles } from './helpers/indexeddb';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('resume-onboarding-v1-complete', '1');
  });
});

test.describe('product state flows', () => {
  test('imports a Markdown file through the real import UI', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /More actions|更多操作/ }).click();
    await page
      .getByRole('button', { name: /^(Import|导入)$/ })
      .click();

    await expect(
      page.getByRole('heading', { name: /Import Resume|导入简历/ }),
    ).toBeVisible();

    const markdown = [
      '# Imported E2E Candidate',
      '',
      '## Experience',
      '- Imported from a Markdown file',
    ].join('\n');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'e2e-resume.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from(markdown),
    });

    await expect(page.getByText('e2e-resume.md')).toBeVisible();
    await page
      .getByRole('button', { name: /Import This File|确认导入/ })
      .click();

    await expect.poll(() => readActiveMarkdown(page)).toBe(markdown);
  });

  test('keeps English TXT import in English even with a Chinese UI', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('resume_ui_language', 'zh');
      window.localStorage.setItem(
        'resume-settings',
        JSON.stringify({
          lang: 'en',
          marketRegion: 'us',
          paperSize: 'letter',
          dateStyle: 'month-short',
        }),
      );
    });

    await page.goto('/');

    await page.getByRole('button', { name: /更多操作|More actions/ }).click();
    await page.getByRole('button', { name: /^(导入|Import)$/ }).click();

    const rawEnglishResume = [
      'Alex Morgan',
      'Software Engineer',
      'alex@example.com | Seattle, WA',
      'Work Experience',
      'Example Technologies | Senior Engineer | 2023.01 - Present',
      '- Built distributed services for production systems.',
      'Skills',
      'TypeScript, Java, PostgreSQL',
    ].join('\n');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'english-resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(rawEnglishResume),
    });

    await expect(page.getByText('english-resume.txt')).toBeVisible();
    await page.getByRole('button', { name: /Import This File|确认导入/ }).click();

    await expect.poll(() => readActiveMarkdown(page)).toContain('## Work Experience');
    await expect.poll(() => readActiveMarkdown(page)).toContain('## Skills');
    await expect.poll(() => readActiveMarkdown(page)).not.toMatch(
      /求职者姓名|工作经历|专业技能|个人简介|经历概述/,
    );
  });

  test('imports uppercase JSON Resume with its own market metadata intact', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'resume-settings',
        JSON.stringify({
          lang: 'zh',
          marketRegion: 'cn',
          paperSize: 'a4',
          dateStyle: 'cn-dot',
        }),
      );
    });

    await page.goto('/');

    await page.getByRole('button', { name: /More actions|更多操作/ }).click();
    await page.getByRole('button', { name: /^(Import|导入)$/ }).click();

    const jsonResume = {
      basics: {
        name: 'Jordan Taylor',
        label: 'Platform Engineer',
        email: 'jordan@example.com',
        location: { city: 'London' },
      },
      work: [
        {
          name: 'Example Systems Ltd',
          position: 'Senior Platform Engineer',
          startDate: 'March 2023',
          endDate: 'Present',
          highlights: ['Built reliable cloud infrastructure for production services.'],
        },
      ],
      meta: {
        targetMarket: 'uk',
        paperSize: 'a4',
        dateStyle: 'month-long',
        lang: 'en',
      },
    };

    await page.locator('input[type="file"]').setInputFiles({
      name: 'UK-Resume.JSON',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(jsonResume)),
    });

    await expect(page.getByText('UK-Resume.JSON')).toBeVisible();
    await page.getByRole('button', { name: /Import This File|确认导入/ }).click();

    await expect.poll(() => readActiveMarkdown(page)).toContain('## Work Experience');
    await expect.poll(() => readActiveMarkdown(page)).not.toContain('## 工作经历');
    await expect.poll(() =>
      page.evaluate(() => JSON.parse(window.localStorage.getItem('resume-settings') || '{}')),
    ).toMatchObject({
      lang: 'en',
      marketRegion: 'uk',
      paperSize: 'a4',
      dateStyle: 'month-long',
    });
  });

  test('restores a full Resume Craft backup exactly through the regular import UI', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /More actions|更多操作/ }).click();
    await page.getByRole('button', { name: /^(Import|导入)$/ }).click();

    const backupMarkdown = [
      '# Exact Backup Candidate',
      '',
      '## Work Experience',
      '',
      '### Example Systems | Platform Engineer | March 2023 – Present',
      '- This line must survive backup restore without market adaptation.',
    ].join('\n');

    const backup = {
      version: 'markdown-resume-backup-v1',
      exportedAt: '2026-10-02T08:00:00.000Z',
      markdown: backupMarkdown,
      templateId: 'uk_cv',
      settings: {
        themeColor: 'indigo',
        fontSize: 'standard',
        fontFamily: 'sans',
        margin: 'compact',
        layoutMode: 'split',
        h2Style: 'accent-line',
        topAccentLine: true,
        lineHeight: 1.4,
        blockGap: 1.1,
        letterSpacing: 0,
        showPageBreakLine: false,
        templateLayout: 'single',
        paperSize: 'a4',
        marketRegion: 'uk',
        dateStyle: 'month-long',
        lang: 'en',
      },
    };

    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume-craft-full-backup.JSON',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup)),
    });

    await expect(page.getByText('resume-craft-full-backup.JSON')).toBeVisible();
    await expect(page.getByText(/Full Resume Craft backup detected|已识别 Resume Craft 完整备份/)).toBeVisible();

    await page.getByRole('button', { name: /Import This File|确认导入/ }).click();

    await expect.poll(() => readActiveMarkdown(page)).toBe(backupMarkdown);
    await expect.poll(() =>
      page.evaluate(() => JSON.parse(window.localStorage.getItem('resume-settings') || '{}')),
    ).toMatchObject({
      lang: 'en',
      marketRegion: 'uk',
      paperSize: 'a4',
      dateStyle: 'month-long',
      margin: 'compact',
      lineHeight: 1.4,
      blockGap: 1.1,
    });

    await expect.poll(async () => {
      const activeId = await page.evaluate(() => window.localStorage.getItem('resume-active-profile-id'));
      const profiles = await readProfiles(page);
      return profiles.find((profile) => profile.id === activeId)?.templateId ?? null;
    }).toBe('uk_cv');
  });

  test('rejects malformed and unsupported JSON instead of importing raw JSON text', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /More actions|更多操作/ }).click();
    await page.getByRole('button', { name: /^(Import|导入)$/ }).click();

    const fileInput = page.locator('input[type="file"]');
    const importButton = page.getByRole('button', { name: /Import This File|确认导入/ });
    const originalMarkdown = await readActiveMarkdown(page);

    await fileInput.setInputFiles({
      name: 'broken.JSON',
      mimeType: 'application/json',
      buffer: Buffer.from('{"basics": {"name": "Broken"'),
    });

    await expect(page.getByRole('alert')).toContainText(
      /malformed|格式损坏/,
    );
    await expect(importButton).toBeDisabled();
    await expect.poll(() => readActiveMarkdown(page)).toBe(originalMarkdown);

    await fileInput.setInputFiles({
      name: 'unknown.JSON',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ foo: 'bar', answer: 42 })),
    });

    await expect(page.getByRole('alert')).toContainText(
      /supported resume format|受支持的简历格式/,
    );
    await expect(importButton).toBeDisabled();
    await expect.poll(() => readActiveMarkdown(page)).toBe(originalMarkdown);
  });

  test('persists dark theme across reloads', async ({ page }) => {
    await page.goto('/');

    const themeButton = page.getByRole('button', {
      name: /Theme: Light|主题: 浅色/,
    }).first();

    await expect(themeButton).toBeVisible();
    await themeButton.click();

    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('html')).not.toHaveClass(/view-transition-active/);
    await expect
      .poll(() =>
        page.evaluate(() => window.localStorage.getItem('resume_theme_mode')),
      )
      .toBe('dark');

    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('html')).not.toHaveClass(/view-transition-active/);
  });

  test('duplicates and renames a resume profile and restores it after reload', async ({
    page,
  }) => {
    await page.goto('/');

    const profileTrigger = page
      .locator('button:visible')
      .filter({ hasText: /起始简历|Starter Resume|默认简历|Default/ })
      .first();
    await expect(profileTrigger).toBeVisible();
    await profileTrigger.click();

    const fastCopy = page
      .locator('button:visible')
      .filter({ hasText: /^(Copy current|复制当前)$/ })
      .first();
    await fastCopy.click();

    const profileNameInput = page.getByPlaceholder(
      /Profile name|输入档案名称/,
    );
    await expect(profileNameInput).toBeVisible();
    await profileNameInput.fill('E2E Profile');
    await profileNameInput.press('Enter');

    await expect
      .poll(async () => (await readProfiles(page)).some((profile) => profile.name === 'E2E Profile'))
      .toBe(true);

    await page.reload();

    await expect(
      page
        .locator('button:visible')
        .filter({ hasText: 'E2E Profile' })
        .first(),
    ).toBeVisible();
  });
});
