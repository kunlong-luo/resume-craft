import { expect, test } from '@playwright/test';
import { readActiveMarkdown } from './helpers/indexeddb';

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

async function openLayout(page: import('@playwright/test').Page) {
  const toolbar = page.locator('#resume-main-toolbar');
  await toolbar
    .getByRole('button', { name: /Open layout settings|打开排版设置/ })
    .click();
  return page.getByRole('dialog', { name: /Layout|排版/ });
}

async function applyTemplate(
  page: import('@playwright/test').Page,
  templateName: string,
) {
  await page
    .getByRole('button', { name: /Browse resume templates|浏览与切换简历模板/ })
    .click();
  const dialog = page.getByRole('dialog', {
    name: /Choose a content template|选择内容模板/,
  });
  await dialog.getByRole('button', { name: templateName }).click();
  await dialog
    .getByRole('button', { name: /Use content template|使用内容模板/ })
    .click();
  const confirm = page.getByRole('dialog', {
    name: /Use this content template\?|使用这个内容模板？/,
  });
  await confirm
    .getByRole('button', { name: /Use content template|使用内容模板/ })
    .click();
  await expect(dialog).toBeHidden();
}

test.describe('international market flows', () => {
  test('download menu keeps Chinese Canada market label on one line', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'resume-settings',
        JSON.stringify({
          lang: 'zh',
          marketRegion: 'ca',
          paperSize: 'letter',
          dateStyle: 'month-short',
        }),
      );
    });

    await page.goto('/');
    const exportModeButton = page.getByRole('button', {
      name: /Choose PDF export mode|选择 PDF 下载方式/,
    });
    await expect(exportModeButton).toBeVisible();
    await exportModeButton.click();

    const marketLabel = page.getByTestId('export-market-label');
    const paperLabel = page.getByTestId('export-paper-label');

    await expect(marketLabel).toHaveText('加拿大');
    await expect(marketLabel).toHaveCSS('white-space', 'nowrap');
    await expect(paperLabel).toHaveText('Letter · 215.9 × 279.4 mm');
    await expect(paperLabel).toHaveCSS('white-space', 'nowrap');
  });

  test('reset current template restores its market metadata and download label', async ({ page }) => {
    await page.goto('/');
    await applyTemplate(page, 'Canadian Cloud & Data Engineer');

    let layout = await openLayout(page);
    await layout.getByRole('button', { name: 'US', exact: true }).click();
    await layout.getByRole('button', { name: 'Close Layout' }).click();

    await expect.poll(() =>
      page.evaluate(() => JSON.parse(window.localStorage.getItem('resume-settings') || '{}')),
    ).toMatchObject({
      marketRegion: 'us',
      paperSize: 'letter',
      dateStyle: 'month-short',
    });

    await page.getByRole('button', { name: 'Reset current template' }).click();

    const confirm = page.getByRole('dialog', { name: 'Reset current template' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Reset template' }).click();

    await expect.poll(() =>
      page.evaluate(() => JSON.parse(window.localStorage.getItem('resume-settings') || '{}')),
    ).toMatchObject({
      marketRegion: 'ca',
      paperSize: 'letter',
      dateStyle: 'month-short',
    });

    await page.getByRole('button', { name: 'Choose PDF export mode' }).click();
    await expect(page.getByTestId('export-market-label')).toHaveText('Canada');
    await expect(page.getByTestId('export-paper-label')).toHaveText(
      'Letter · 215.9 × 279.4 mm',
    );
  });

  test('US template synchronizes Letter market settings and survives reload', async ({ page }) => {
    await page.goto('/');
    await applyTemplate(page, 'US Software Engineer (Resume)');

    await expect(page.locator('#resume-print-content')).toHaveAttribute(
      'data-paper-size',
      'letter',
    );

    await expect.poll(() =>
      page.evaluate(() => JSON.parse(window.localStorage.getItem('resume-settings') || '{}')),
    ).toMatchObject({
      marketRegion: 'us',
      paperSize: 'letter',
      dateStyle: 'month-short',
    });

    await page.reload();
    const layout = await openLayout(page);
    await expect(layout.getByRole('button', { name: 'US', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(layout.getByRole('button', { name: /US Letter/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('UK template synchronizes A4 and long-month dates', async ({ page }) => {
    await page.goto('/');
    await applyTemplate(page, 'UK Tech Lead & Full-Stack (CV)');

    await expect(page.locator('#resume-print-content')).toHaveAttribute(
      'data-paper-size',
      'a4',
    );
    await expect.poll(() =>
      page.evaluate(() => JSON.parse(window.localStorage.getItem('resume-settings') || '{}')),
    ).toMatchObject({
      marketRegion: 'uk',
      paperSize: 'a4',
      dateStyle: 'month-long',
    });

    const layout = await openLayout(page);
    await expect(layout.getByRole('button', { name: 'UK', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('China market remains A4 and market switching preserves manual overrides', async ({ page }) => {
    await page.goto('/');

    let layout = await openLayout(page);
    await layout.getByRole('button', { name: 'China', exact: true }).click();
    await expect.poll(() =>
      page.evaluate(() => JSON.parse(window.localStorage.getItem('resume-settings') || '{}')),
    ).toMatchObject({
      marketRegion: 'cn',
      paperSize: 'a4',
      dateStyle: 'cn-dot',
    });

    await layout.getByRole('button', { name: /US Letter/ }).click();
    await layout.getByRole('button', { name: 'March 2024', exact: true }).click();
    await layout.getByRole('button', { name: 'UK', exact: true }).click();

    await expect.poll(() =>
      page.evaluate(() => JSON.parse(window.localStorage.getItem('resume-settings') || '{}')),
    ).toMatchObject({
      marketRegion: 'uk',
      paperSize: 'letter',
      dateStyle: 'month-long',
    });

    await page.reload();
    layout = await openLayout(page);
    await expect(layout.getByRole('button', { name: 'UK', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(layout.getByRole('button', { name: /US Letter/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('US New Grad template uses Letter and education-first content', async ({ page }) => {
    await page.goto('/');
    await applyTemplate(page, 'US New Grad Software Engineer');

    await expect(page.locator('#resume-print-content')).toHaveAttribute(
      'data-paper-size',
      'letter',
    );
    await expect.poll(() => readActiveMarkdown(page)).toContain('## Education');

    await expect.poll(() =>
      page.evaluate(() => JSON.parse(window.localStorage.getItem('resume-settings') || '{}')),
    ).toMatchObject({
      marketRegion: 'us',
      paperSize: 'letter',
      dateStyle: 'month-short',
    });
  });

  test('international optional fields prioritize global contact details', async ({ page }) => {
    await page.goto('/');

    const optional = page.getByRole('button', { name: '+ Optional Fields' });
    const globalContactLabel = page.getByText('LinkedIn / GitHub / Portfolio', { exact: true });

    // App startup is asynchronous in v2.3 because storage migration completes before
    // the editor bundle mounts. Wait for either state instead of using a zero-wait count.
    await expect.poll(async () =>
      (await optional.count()) + (await globalContactLabel.count()),
    ).toBeGreaterThan(0);

    if (await optional.count()) {
      await optional.click();
    }

    await expect(globalContactLabel).toBeVisible();
    await expect(page.getByText('WeChat', { exact: true })).toHaveCount(0);

    const layout = await openLayout(page);
    await layout.getByRole('button', { name: 'China', exact: true }).click();
    await layout.getByRole('button', { name: 'Close Layout' }).click();

    await expect(page.getByText('WeChat', { exact: true })).toBeVisible();
  });

  test('manual date style override survives target market changes', async ({ page }) => {
    await page.goto('/');

    const layout = await openLayout(page);
    await layout.getByRole('button', { name: 'March 2024', exact: true }).click();
    await layout.getByRole('button', { name: 'US', exact: true }).click();

    await expect.poll(() =>
      page.evaluate(() => JSON.parse(window.localStorage.getItem('resume-settings') || '{}')),
    ).toMatchObject({
      marketRegion: 'us',
      dateStyle: 'month-long',
    });

    await expect(layout.getByRole('button', { name: 'March 2024', exact: true }))
      .toHaveAttribute('aria-pressed', 'true');
  });

  test('resume checker uses guidance wording instead of ATS or legal guarantees', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Check' }).click();

    const checker = page.getByRole('dialog', { name: 'Resume Check' });
    await expect(checker).toBeVisible();
    await expect(checker).not.toContainText('Perfect machine parsing compatibility');
    await expect(checker).not.toContainText('automatically disqualified');
    await expect(checker).not.toContainText('strictly avoid');
  });
});
