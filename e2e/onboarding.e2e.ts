import { expect, test } from '@playwright/test';

test.describe('first-run onboarding', () => {
  test('guides a first-time user through three steps and loads the example only by choice', async ({
    page,
  }) => {
    await page.goto('/');

    const tour = page.getByRole('dialog', {
      name: /Getting started tour|新手引导/,
    });
    await expect(tour).toBeVisible();

    await expect(
      page.getByRole('heading', {
        name: /Step 1.*Edit your resume here|第一步.*从这里编辑简历/,
      }),
    ).toBeVisible();

    await page.getByRole('button', { name: /Next|下一步/ }).click();

    await expect(
      page.getByRole('heading', {
        name: /Step 2.*Adjust layout and tools here|第二步.*调整排版与工具/,
      }),
    ).toBeVisible();

    await page.getByRole('button', { name: /Next|下一步/ }).click();

    await expect(
      page.getByRole('heading', {
        name: /Step 3.*How would you like to start|第三步.*你想从哪里开始/,
      }),
    ).toBeVisible();

    await page
      .getByRole('button', {
        name: /Use the full example resume|使用完整示例简历/,
      })
      .click();

    await expect(tour).toBeHidden();

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.localStorage.getItem('resume-onboarding-v1-complete'),
        ),
      )
      .toBe('1');

    await expect
      .poll(() =>
        page.evaluate(() => window.localStorage.getItem('resume-markdown') || ''),
      )
      .toMatch(/钟晨杰|Alex Chen/);

    await page.reload();

    await expect(
      page.getByRole('dialog', {
        name: /Getting started tour|新手引导/,
      }),
    ).toHaveCount(0);
  });

  test('can replay the onboarding from the help center', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('resume-onboarding-v1-complete', '1');
    });
    await page.goto('/');

    await page.getByRole('button', { name: /More actions|更多操作/ }).click();
    await page
      .getByRole('button', { name: /^(Help|帮助)$/ })
      .click();

    await expect(
      page.getByRole('heading', { name: /Help & Privacy|帮助与隐私/ }),
    ).toBeVisible();

    await page
      .getByRole('button', {
        name: /Replay the interface tour|重新观看新手教程/,
      })
      .click();

    await expect(
      page.getByRole('dialog', {
        name: /Getting started tour|新手引导/,
      }),
    ).toBeVisible();
  });

  test('can open the existing import flow from the final onboarding step', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Next|下一步/ }).click();
    await page.getByRole('button', { name: /Next|下一步/ }).click();

    await page
      .getByRole('button', {
        name: /Import an existing resume|导入已有简历/,
      })
      .click();

    await expect(
      page.getByRole('heading', { name: /Import Resume|导入简历/ }),
    ).toBeVisible();
  });

  test('supports keyboard escape and mobile onboarding layout', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const tour = page.getByRole('dialog', {
      name: /Getting started tour|新手引导/,
    });
    await expect(tour).toBeVisible();

    await expect(
      page.getByRole('button', { name: /Next|下一步/ }),
    ).toBeFocused();

    await page.getByRole('button', { name: /Next|下一步/ }).click();

    await expect(
      page.getByRole('heading', {
        name: /Step 2.*Adjust layout and tools here|第二步.*调整排版与工具/,
      }),
    ).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(tour).toBeHidden();

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.localStorage.getItem('resume-onboarding-v1-complete'),
        ),
      )
      .toBe('1');
  });
  test('does not overwrite an existing resume when replaying without confirmation', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('resume-onboarding-v1-complete', '1');
      window.localStorage.setItem('resume-markdown', '# Existing Resume\n\nKeep this content.');
    });
    await page.goto('/');

    await page.getByRole('button', { name: /More actions|更多操作/ }).click();
    await page
      .getByRole('button', { name: /^(Help|帮助)$/ })
      .click();
    await page
      .getByRole('button', {
        name: /Replay the interface tour|重新观看新手教程/,
      })
      .click();

    await page.getByRole('button', { name: /Next|下一步/ }).click();
    await page.getByRole('button', { name: /Next|下一步/ }).click();

    await page
      .getByRole('button', {
        name: /Use the full example resume|使用完整示例简历/,
      })
      .click();

    await expect(
      page.getByText(/Replace your current resume\?|要替换当前简历吗？/),
    ).toBeVisible();

    await expect
      .poll(() =>
        page.evaluate(() => window.localStorage.getItem('resume-markdown')),
      )
      .toBe('# Existing Resume\n\nKeep this content.');

    await page
      .getByRole('button', {
        name: /Keep current resume|保留当前简历/,
      })
      .click();

    await expect(
      page.getByRole('button', {
        name: /Use the full example resume|使用完整示例简历/,
      }),
    ).toBeVisible();

    await expect
      .poll(() =>
        page.evaluate(() => window.localStorage.getItem('resume-markdown')),
      )
      .toBe('# Existing Resume\n\nKeep this content.');
  });

  test('can start completely blank and preserve the blank resume across reload', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Next|下一步/ }).click();
    await page.getByRole('button', { name: /Next|下一步/ }).click();

    await page
      .getByRole('button', {
        name: /Start completely blank|从完全空白简历开始/,
      })
      .click();

    await expect(
      page.getByRole('dialog', {
        name: /Getting started tour|新手引导/,
      }),
    ).toBeHidden();

    await expect
      .poll(() =>
        page.evaluate(() => window.localStorage.getItem('resume-markdown')),
      )
      .toBe('');

    await page.reload();

    await expect
      .poll(() =>
        page.evaluate(() => window.localStorage.getItem('resume-markdown')),
      )
      .toBe('');

    await expect(
      page.getByRole('dialog', {
        name: /Getting started tour|新手引导/,
      }),
    ).toHaveCount(0);
  });

});
