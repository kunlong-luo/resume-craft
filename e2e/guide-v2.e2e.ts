import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('resume-onboarding-v1-complete', '1');
    window.localStorage.setItem('resume-settings', JSON.stringify({ lang: 'en' }));
  });
});

async function openGuide(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('button', { name: 'Help' }).click();
  const guide = page.getByRole('dialog', { name: 'Help & Privacy' });
  await expect(guide).toBeVisible();
  return guide;
}

test.describe('task-oriented user guide', () => {
  test('shows the streamlined five-step workflow and current version', async ({ page }) => {
    await page.goto('/');
    const guide = await openGuide(page);

    await expect(guide.getByText('A simple path to a finished resume')).toBeVisible();
    for (const step of [
      'Start with your content',
      'Adjust layout',
      'Polish the style',
      'Run Resume Check',
      'Download, back up, and share',
    ]) {
      await expect(guide.getByText(step, { exact: true })).toBeVisible();
    }
    await expect(guide).toContainText('v2.2.0');
  });

  test('keeps a permanent replay entry for onboarding', async ({ page }) => {
    await page.goto('/');
    const guide = await openGuide(page);
    const replay = guide.getByRole('button', { name: 'Replay the interface tour' });
    await expect(replay).toBeVisible();
    await replay.click();
    await expect(guide).toBeHidden();
  });
});
