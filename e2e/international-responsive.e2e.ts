import { expect, test } from '@playwright/test';

const VIEWPORTS = [
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
