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

  test('auto-adapting JSON Resume keeps the current target market and resume language', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('resume_ui_language', 'en');
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
        name: 'Alex Morgan',
        label: 'Software Engineer',
        email: 'alex@example.com',
      },
      work: [
        {
          name: 'Example Labs',
          position: 'Senior Engineer',
          startDate: '2023.01',
          endDate: 'Present',
          highlights: ['Built reliable distributed services for production workloads.'],
        },
      ],
      meta: {
        targetMarket: 'us',
        paperSize: 'letter',
        dateStyle: 'month-short',
        lang: 'en',
      },
    };

    await page.locator('input[type="file"]').setInputFiles({
      name: 'us-resume.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(jsonResume)),
    });

    await page.getByRole('button', { name: /Import This File|确认导入/ }).click();

    await expect.poll(() => readActiveMarkdown(page)).toContain('## 工作经历');
    await expect
      .poll(() =>
        page.evaluate(() => {
          const raw = window.localStorage.getItem('resume-settings');
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return {
            lang: parsed.lang,
            marketRegion: parsed.marketRegion,
            paperSize: parsed.paperSize,
            dateStyle: parsed.dateStyle,
          };
        }),
      )
      .toEqual({
        lang: 'zh',
        marketRegion: 'cn',
        paperSize: 'a4',
        dateStyle: 'cn-dot',
      });
  });

  test('mobile English new-profile flow uses localized template names', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      window.localStorage.setItem('resume_ui_language', 'en');
      window.localStorage.setItem(
        'resume-settings',
        JSON.stringify({
          lang: 'en',
          marketRegion: 'international',
          paperSize: 'a4',
          dateStyle: 'month-short',
        }),
      );
    });

    await page.goto('/');

    await page.getByRole('button', { name: 'Open resume switcher' }).click();
    const switcher = page.getByRole('dialog', { name: 'Resume switcher' });
    await switcher.getByRole('button', { name: 'Manage resumes' }).click();

    const management = page.getByRole('dialog', { name: 'Resume Management' });
    await expect(management).toBeVisible();
    await management.getByRole('button', { name: 'New Profile' }).click();

    await expect(page.getByText('Create New Resume Profile', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'From Template' }).click();

    const templateSelect = page.getByRole('combobox');
    await expect(templateSelect.locator('option[value="us_swe"]')).toHaveText(
      '[Global] US Software Engineer (Resume)',
    );

    await page.getByRole('button', { name: 'Create & Switch' }).click();

    await expect
      .poll(async () => (await readProfiles(page)).map((profile) => profile.name))
      .toContain('US Software Engineer (Resume)');
    await expect
      .poll(async () => (await readProfiles(page)).map((profile) => profile.name))
      .not.toContain('美版软件工程师 (US Resume)');
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
