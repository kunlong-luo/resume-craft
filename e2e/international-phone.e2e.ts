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

test.describe('international contact phone', () => {
  test('does not guess a country from language or target market', async ({ page }) => {
    await page.goto('/');

    const country = page.getByLabel('Country or region');
    await expect(country).toBeVisible();
    await expect(country).toHaveValue('');

    await page.evaluate(() => {
      const settings = JSON.parse(window.localStorage.getItem('resume-settings') || '{}');
      window.localStorage.setItem(
        'resume-settings',
        JSON.stringify({ ...settings, marketRegion: 'us', lang: 'en' }),
      );
    });
    await page.reload();

    await expect(page.getByLabel('Country or region')).toHaveValue('');
  });

  test('normalizes a local UK number and resume check recognizes it', async ({
    page,
  }) => {
    await page.goto('/');

    const country = page.getByLabel('Country or region');
    const phone = page.getByLabel('Phone Number');

    await expect(country).toBeVisible();
    await expect(phone).toBeVisible();

    await country.selectOption('GB');
    await phone.fill('020 7946 0958');
    await phone.blur();

    await expect(phone).toHaveValue('+44 20 7946 0958');

    await expect.poll(() => readActiveMarkdown(page)).toContain('+44 20 7946 0958');

    await page.getByRole('button', { name: /^(Check|检查)$/ }).click();

    const checker = page.getByRole('dialog', {
      name: /Resume Check|简历检查/,
    });
    await expect(checker).toBeVisible();
    await expect(
      checker.getByText(/Contact Info: Phone number found|联系方式：已识别电话号码/),
    ).toBeVisible();
  });

  test('remembers the selected region before a phone number is complete', async ({
    page,
  }) => {
    await page.goto('/');

    const country = page.getByLabel('Country or region');
    await country.selectOption('AU');
    await expect(country).toHaveValue('AU');

    await page.reload();

    await expect(page.getByLabel('Country or region')).toHaveValue('AU');
    await expect
      .poll(() =>
        page.evaluate(() => window.localStorage.getItem('resume-phone-regions') || ''),
      )
      .toContain('AU');
  });

  test('detects the region when a full international number is pasted', async ({
    page,
  }) => {
    await page.goto('/');

    const country = page.getByLabel('Country or region');
    const phone = page.getByLabel('Phone Number');

    await phone.fill('+852 91234567');
    await phone.blur();

    await expect(country).toHaveValue('HK');
    await expect(phone).toHaveValue('+852 9123 4567');
  });
});
