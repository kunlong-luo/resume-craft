import { expect, test } from '@playwright/test';

async function openHelp(page: import('@playwright/test').Page) {
  const helpButton = page.getByRole('button', { name: /帮助|help/i }).first();
  await helpButton.click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test('help shows current version and can replay onboarding', async ({ page }) => {
  await page.goto('./');
  await openHelp(page);

  await expect(page.getByRole('dialog')).toContainText('v2.1.0');
  const replay = page.getByRole('button', { name: /重新观看新手教程|replay the interface tour/i });
  await expect(replay).toBeVisible();
});

test('clear local data is scoped and requires confirmation', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => {
    localStorage.setItem('resume-markdown', '# Sensitive resume');
    localStorage.setItem('resume-craft.support-prompt.v1', '{"nextPromptAt":1,"exportCount":2}');
    localStorage.setItem('another-app:key', 'keep-me');
  });

  await openHelp(page);
  await page.getByRole('button', { name: /隐私与数据|privacy/i }).click();
  await page.getByRole('button', { name: /清空本地数据|clear local data/i }).click();

  await expect(page.getByText(/确定删除全部 Resume Craft 本地数据|delete all local Resume Craft data/i)).toBeVisible();
  await page.getByRole('button', { name: /永久删除|delete permanently/i }).click();
  await page.waitForLoadState('domcontentloaded');

  const values = await page.evaluate(() => ({
    resume: localStorage.getItem('resume-markdown'),
    support: localStorage.getItem('resume-craft.support-prompt.v1'),
    unrelated: localStorage.getItem('another-app:key'),
  }));
  expect(values.resume).toBeNull();
  expect(values.support).toBeNull();
  expect(values.unrelated).toBe('keep-me');
});
