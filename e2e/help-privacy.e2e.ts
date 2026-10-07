import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('resume-onboarding-v1-complete', '1');
    window.localStorage.setItem('resume-settings', JSON.stringify({ lang: 'en' }));
  });
});

async function openHelp(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('button', { name: 'Help' }).click();
  const dialog = page.getByRole('dialog', { name: 'Help & Privacy' });
  await expect(dialog).toBeVisible();
  return dialog;
}

test('help shows the package version and replay entry', async ({ page }) => {
  await page.goto('/');
  const dialog = await openHelp(page);
  await expect(dialog).toContainText('v2.4.0');
  await expect(dialog.getByRole('button', { name: 'Replay the interface tour' })).toBeVisible();
});

test('clear local data is scoped and requires confirmation', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('resume-markdown', '# Sensitive resume');
    localStorage.setItem('resume-craft.support-prompt.v1', '{"nextPromptAt":1,"exportCount":2}');
    localStorage.setItem('resume-craft.support-prompt.v2', '{"prompted":true,"exportCount":1}');
    localStorage.setItem('another-app:key', 'keep-me');
  });

  const dialog = await openHelp(page);
  await dialog.getByRole('button', { name: 'Privacy' }).click();
  await dialog.getByRole('button', { name: 'Clear local data…' }).click();
  await expect(dialog.getByText('Delete all local Resume Craft data?')).toBeVisible();
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    dialog.getByRole('button', { name: 'Delete permanently' }).click(),
  ]);
  await expect(page.getByRole('button', { name: 'More actions' })).toBeVisible();

  const values = await page.evaluate(() => ({
    resume: localStorage.getItem('resume-markdown'),
    supportLegacy: localStorage.getItem('resume-craft.support-prompt.v1'),
    supportCurrent: localStorage.getItem('resume-craft.support-prompt.v2'),
    unrelated: localStorage.getItem('another-app:key'),
  }));
  expect(values.resume).toBeNull();
  expect(values.supportLegacy).toBeNull();
  expect(values.supportCurrent).toBeNull();
  expect(values.unrelated).toBe('keep-me');
});
