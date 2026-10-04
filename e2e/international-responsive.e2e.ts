import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  { width: 320, height: 568, label: 'compact-mobile' },
  { width: 360, height: 800, label: 'small-mobile' },
  { width: 390, height: 844, label: 'mobile' },
  { width: 768, height: 900, label: 'tablet' },
  { width: 1024, height: 900, label: 'small-desktop' },
  { width: 1280, height: 900, label: 'desktop' },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('resume-onboarding-v1-complete', '1');
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
});

async function expectInsideViewport(
  locator: import('@playwright/test').Locator,
  width: number,
  height: number,
) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(height + 1);
}

test.describe('international responsive UX', () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.label}: template center and layout stay within the viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      const templateTrigger = page.getByRole('button', {
        name: /Browse resume templates|浏览与切换简历模板/,
      });
      await templateTrigger.click();

      const templateDialog = page.getByRole('dialog', {
        name: /Choose a content template|选择内容模板/,
      });
      await expectInsideViewport(templateDialog, viewport.width, viewport.height);
      await expect.poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      ).toBe(true);
      await page.keyboard.press('Escape');
      await expect(templateDialog).toBeHidden();

      const toolbar = page.locator('#resume-main-toolbar');
      await toolbar
        .getByRole('button', { name: /Open layout settings|打开排版设置/ })
        .click();

      const layoutDialog = page.getByRole('dialog', { name: /Layout|排版/ });
      await expectInsideViewport(layoutDialog, viewport.width, viewport.height);
      await expect(layoutDialog.getByText('Target market', { exact: true })).toBeVisible();
      await expect(layoutDialog.getByRole('button', { name: 'International', exact: true })).toBeVisible();
      await expect(layoutDialog.getByRole('button', { name: /US Letter/ })).toBeVisible();

      await expect.poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      ).toBe(true);
    });
  }


  test('compact mobile keeps import and resume-management dialogs operable', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');

    await expect.poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    ).toBe(true);

    const quickActions = page.getByRole('button', {
      name: /Open quick actions menu|打开快捷功能菜单/,
    });

    await quickActions.click();
    await page.getByRole('button', { name: /^(Import|导入)$/ }).click();

    const importDialog = page.getByRole('dialog', {
      name: /Import Resume|导入简历/,
    });
    await expect(importDialog).toBeVisible();
    const importBox = await importDialog.boundingBox();
    expect(importBox).not.toBeNull();
    expect(importBox!.x).toBeGreaterThanOrEqual(0);
    expect(importBox!.x + importBox!.width).toBeLessThanOrEqual(321);

    const closeImport = importDialog.getByRole('button', {
      name: /Close import dialog|关闭导入弹窗/,
    });
    await closeImport.scrollIntoViewIfNeeded();
    await expect(closeImport).toBeVisible();
    await closeImport.click();
    await expect(importDialog).toBeHidden();

    await quickActions.click();
    await page.getByRole('button', { name: /Resume management|简历管理/ }).click();

    const management = page.getByRole('dialog', {
      name: /Resume Management|简历管理/,
    });
    await expectInsideViewport(management, 320, 568);
    await management.getByRole('button', { name: /^(Backup|备份)$/ }).click();

    await expect(
      management.getByRole('button', {
        name: /Generate & Download \.json|导出 \.json 备份/,
      }),
    ).toBeVisible();
    await expect(
      management.getByRole('button', {
        name: /Close resume management dialog|关闭简历管理弹窗/,
      }),
    ).toBeVisible();

    await expect.poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    ).toBe(true);
  });

  test('mobile: primary workspace, resume switcher, and download sheet stay usable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const dock = page.getByRole('navigation', {
      name: /Mobile workspace actions|移动端工作区操作/,
    });
    await expectInsideViewport(dock, 390, 844);

    await dock.getByRole('button', { name: /Open mobile download options|打开移动端下载选项/ }).click();
    const dockDownloadDialog = page.getByRole('dialog', {
      name: /Download options|下载选项/,
    });
    await expectInsideViewport(dockDownloadDialog, 390, 844);
    await expect(dockDownloadDialog.getByRole('button', { name: /Quick PDF|快速 PDF/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dockDownloadDialog).toBeHidden();

    await dock.getByRole('button', { name: /Preview|预览/ }).click();
    await expect(page.locator('#resume-preview-wrapper')).toBeVisible();
    await expect.poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    ).toBe(true);

    await page.getByRole('button', {
      name: /Open resume switcher|打开简历切换器/,
    }).click();
    const resumeSwitcher = page.getByRole('dialog', {
      name: /Resume switcher|简历切换器/,
    });
    await expectInsideViewport(resumeSwitcher, 390, 844);
    await expect(resumeSwitcher.getByRole('button', { name: /Copy current|复制当前/ })).toBeVisible();
    await page.mouse.click(6, 6);
    await expect(resumeSwitcher).toBeHidden();

    await page.getByRole('button', {
      name: /Open header download options|打开顶部下载选项/,
    }).click();
    const downloadDialog = page.getByRole('dialog', {
      name: /Download options|下载选项/,
    });
    await expectInsideViewport(downloadDialog, 390, 844);
    await expect(downloadDialog.getByLabel(/File name|文件名/)).toBeVisible();
    await expect(downloadDialog.getByRole('button', { name: /Quick PDF|快速 PDF/ })).toBeVisible();
  });

  test('english split view keeps Graduate aligned with Work Experience', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.addInitScript(() => {
      window.localStorage.setItem('resume_ui_language', 'en');
      window.localStorage.setItem(
        'resume-settings',
        JSON.stringify({
          lang: 'en',
          marketRegion: 'international',
          paperSize: 'a4',
          dateStyle: 'month-short',
          layoutMode: 'split',
        }),
      );
      window.localStorage.setItem(
        'resume-markdown',
        '# Alex Morgan\nSoftware Engineer\nalex@example.com\nStudent / New Graduate | Bachelor | Seattle\n\n## 核心能力\n- TypeScript, React, Java\n\n## Experience\n\n### Example Labs | Engineering Intern | Jun 2026 – Sep 2026\n- Built and shipped a production feature.\n',
      );
    });

    await page.goto('/');

    const formButton = page.getByRole('button', { name: /Form editor|表单编辑/ });
    if (await formButton.count()) {
      await formButton.click();
    }

    const basic = page.locator('#form-sec-basic');
    await expect(basic).toBeVisible();

    const metaGrid = basic.getByTestId('basic-meta-grid');
    await expect(metaGrid).toBeVisible();
    await expect.poll(async () => {
      const columns = await metaGrid.evaluate((element) =>
        getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length,
      );
      return columns;
    }).toBe(2);

    const workHeader = basic.getByTestId('work-experience-header');
    const label = workHeader.getByText('Work Experience', { exact: true });
    const studentButton = workHeader.getByRole('button', { name: 'Graduate' });

    await expect(label).toBeVisible();
    await expect(studentButton).toBeVisible();

    await expect(page.locator('input[value="Skills"]')).toBeVisible();
    await expect(page.locator('#resume-print-content h2').filter({ hasText: /^Skills$/ })).toBeVisible();
    await expect(page.locator('#resume-print-content h2').filter({ hasText: /^Work Experience$/ })).toBeVisible();

    const labelBox = await label.boundingBox();
    const buttonBox = await studentButton.boundingBox();
    expect(labelBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
    expect(labelBox!.x + labelBox!.width).toBeLessThanOrEqual(buttonBox!.x - 4);

    await expect.poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    ).toBe(true);
  });

  test('mobile: month picker fits the viewport and exposes older experience years', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.getByRole('button', { name: 'Form editor' }).click();

    const expandAll = page.getByRole('button', { name: /Expand all sections/ });
    if (await expandAll.count()) {
      await expandAll.click();
    }

    const pickerTrigger = page.getByRole('button', { name: 'Open date picker' }).first();
    await expect(pickerTrigger).toBeVisible();
    await pickerTrigger.click();

    const picker = page.getByRole('dialog', { name: 'Select period' });
    await expectInsideViewport(picker, 390, 844);

    const currentYear = new Date().getFullYear();
    await picker
      .getByRole('button', { name: String(currentYear), exact: true })
      .first()
      .click();
    await expect(
      page.getByRole('option', { name: String(currentYear - 50), exact: true }),
    ).toBeVisible();
  });
});
