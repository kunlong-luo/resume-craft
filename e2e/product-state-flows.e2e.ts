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
