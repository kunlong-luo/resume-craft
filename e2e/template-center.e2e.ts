import { expect, test } from '@playwright/test';
import { readActiveMarkdown } from './helpers/indexeddb';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('resume-onboarding-v1-complete', '1');
    window.localStorage.setItem(
      'resume-settings',
      JSON.stringify({ lang: 'en' }),
    );
  });
});

test.describe('template center', () => {
  test('exposes one template library entry and removes the legacy template selector', async ({ page }) => {
    await page.goto('/');

    const toolbar = page.locator('#resume-main-toolbar');
    await expect(
      toolbar.getByRole('button', { name: /Browse resume templates|浏览与切换简历模板/ }),
    ).toHaveCount(1);

    await expect(
      toolbar.locator(
        'button[aria-haspopup="listbox"][title="Custom / Starter"]',
      ),
    ).toHaveCount(0);

    await expect(
      toolbar.locator(
        'button[aria-haspopup="listbox"][title="AI Backend Developer"]',
      ),
    ).toHaveCount(0);
  });

  test('keeps resume management separate from template selection', async ({ page }) => {
    await page.goto('/');

    await page.locator('button[aria-controls="resume-profile-panel"]:visible').first().click();

    const profilePanel = page.locator('#resume-profile-panel');
    await expect(profilePanel).toBeVisible();
    await expect(profilePanel.getByText(/My resumes|我的简历/, { exact: true })).toBeVisible();
    await expect(
      profilePanel.getByRole('button', { name: /New blank|新建空白/ }),
    ).toBeVisible();
    await expect(
      profilePanel.getByText(/Fast load from benchmark templates|快速选用标杆模板创建/),
    ).toHaveCount(0);
    await expect(
      profilePanel.getByRole('button', { name: /AI Frontend Developer|AI 前端工程师/ }),
    ).toHaveCount(0);
  });

  test('filters templates by job-seeking scenario', async ({ page }) => {
    await page.goto('/');

    await page
      .getByRole('button', { name: /Browse resume templates|浏览与切换简历模板/ })
      .click();

    const dialog = page.getByRole('dialog', {
      name: /Choose a content template|选择内容模板/,
    });

    await dialog.getByRole('button', { name: 'Product & Ops' }).click();
    await expect(
      dialog.getByRole('button', { name: 'Technical PM / Engineering Director' }),
    ).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: 'Product Operations / Growth' }),
    ).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: 'AI Frontend Developer' }),
    ).toHaveCount(0);

    await dialog.getByRole('button', { name: 'Graduate' }).click();
    await expect(
      dialog.getByRole('button', { name: 'Graduate / Campus Engineering' }),
    ).toBeVisible();
  });

  test('shows all China-market templates under CN Standard', async ({ page }) => {
    await page.goto('/');

    await page
      .getByRole('button', { name: /Browse resume templates|浏览与切换简历模板/ })
      .click();

    const dialog = page.getByRole('dialog', {
      name: /Choose a content template|选择内容模板/,
    });

    await dialog.getByRole('button', { name: /CN Standard|中文标准/ }).click();

    await expect(
      dialog.getByRole('button', { name: /Chinese General Demo|中文通用示例/ }),
    ).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: /AI Frontend Developer|AI 前端工程师/ }),
    ).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: /Graduate \/ Campus Engineering|应届生 \/ 校园研发/ }),
    ).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: /US Software Engineer/ }),
    ).toHaveCount(0);
  });

  test('previews a template without changing the active resume', async ({ page }) => {
    await page.goto('/');

    await expect.poll(() => readActiveMarkdown(page)).not.toBeNull();
    const originalMarkdown = await readActiveMarkdown(page);

    await page
      .getByRole('button', { name: /Browse resume templates|浏览与切换简历模板/ })
      .click();

    const dialog = page.getByRole('dialog', {
      name: /Choose a content template|选择内容模板/,
    });
    await expect(dialog).toBeVisible();

    await dialog
      .getByRole('button', {
        name: /AI Frontend Developer|AI 前端工程师/,
      })
      .click();

    await expect(
      dialog.getByRole('heading', {
        name: /AI Frontend Developer|AI 前端工程师/,
      }),
    ).toBeVisible();

    await expect.poll(() => readActiveMarkdown(page)).toBe(originalMarkdown);
  });

  test('applies a selected template only after confirmation', async ({ page }) => {
    await page.goto('/');

    await page
      .getByRole('button', { name: /Browse resume templates|浏览与切换简历模板/ })
      .click();

    const dialog = page.getByRole('dialog', {
      name: /Choose a content template|选择内容模板/,
    });

    await dialog
      .getByRole('button', {
        name: /AI Frontend Developer|AI 前端工程师/,
      })
      .click();

    await dialog
      .getByRole('button', {
        name: /Use content template|使用内容模板/,
      })
      .click();

    const confirmDialog = page.getByRole('dialog', {
      name: /Use this content template\?|使用这个内容模板？/,
    });
    await expect(confirmDialog).toBeVisible();

    await confirmDialog
      .getByRole('button', { name: /Use content template|使用内容模板/ })
      .click();

    await expect(dialog).toBeHidden();

    await expect.poll(() => readActiveMarkdown(page)).toContain('林智远');
  });

  test('applies content without changing layout or style', async ({ page }) => {
    // This flow crosses several dialogs and state re-checks; WebKit is
    // consistently slower than the default 20-second per-test budget.
    test.slow();
    await page.goto('/');

    const toolbar = page.locator('#resume-main-toolbar');

    await toolbar.getByRole('button', { name: /Open layout settings|打开排版设置/ }).click();
    const layoutDialog = page.getByRole('dialog', { name: 'Layout' });
    await layoutDialog.getByRole('button', { name: /Two columns/ }).click();
    await layoutDialog.getByRole('button', { name: 'Close Layout' }).click();

    await toolbar.getByRole('button', { name: /Open style settings|打开样式设置/ }).click();
    const styleDialog = page.getByRole('dialog', { name: 'Style' });
    await styleDialog.getByRole('button', { name: 'Tech & Internet' }).click();
    await styleDialog.getByRole('button', { name: 'Close Style' }).click();

    await toolbar
      .getByRole('button', { name: /Browse resume templates|浏览与切换简历模板/ })
      .click();

    const templateDialog = page.getByRole('dialog', {
      name: /Choose a content template|选择内容模板/,
    });
    await templateDialog
      .getByRole('button', { name: 'AI Frontend Developer' })
      .click();
    await templateDialog
      .getByRole('button', { name: /Use content template|使用内容模板/ })
      .click();

    const confirmDialog = page.getByRole('dialog', {
      name: /Use this content template\?|使用这个内容模板？/,
    });
    await confirmDialog
      .getByRole('button', { name: /Use content template|使用内容模板/ })
      .click();

    await toolbar.getByRole('button', { name: /Open layout settings|打开排版设置/ }).click();
    const layoutAfter = page.getByRole('dialog', { name: 'Layout' });
    await expect(
      layoutAfter.getByRole('button', { name: /Two columns/ }),
    ).toHaveAttribute('aria-pressed', 'true');
    await layoutAfter.getByRole('button', { name: 'Close Layout' }).click();

    await toolbar.getByRole('button', { name: /Open style settings|打开样式设置/ }).click();
    const styleAfter = page.getByRole('dialog', { name: 'Style' });
    await expect(
      styleAfter.getByRole('button', { name: 'Tech & Internet' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('restores toolbar focus when closed with Escape', async ({ page }) => {
    await page.goto('/');

    const trigger = page.getByRole('button', {
      name: /Browse resume templates|浏览与切换简历模板/,
    });
    await trigger.focus();
    await trigger.press('Enter');

    const dialog = page.getByRole('dialog', {
      name: /Choose a content template|选择内容模板/,
    });
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
