import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('resume-onboarding-v1-complete', '1');
    window.localStorage.setItem(
      'resume-settings',
      JSON.stringify({ lang: 'en' }),
    );
  });
});

test.describe('simplified workspace actions', () => {
  test('separates layout controls from visual style controls', async ({ page }) => {
    await page.goto('/');

    const toolbar = page.locator('#resume-main-toolbar');

    await expect(
      toolbar.getByRole('button', { name: 'Open template library' }),
    ).toBeVisible();
    await expect(toolbar.getByRole('button', { name: 'Layout' })).toBeVisible();
    await expect(toolbar.getByRole('button', { name: 'Style' })).toBeVisible();
    await expect(toolbar.getByRole('button', { name: 'Fit Page' })).toBeVisible();
    await expect(toolbar.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(toolbar.getByRole('button', { name: 'Split' })).toBeVisible();
    await expect(toolbar.getByRole('button', { name: 'Preview' })).toBeVisible();

    await toolbar.getByRole('button', { name: 'Layout' }).click();

    const layoutDialog = page.getByRole('dialog', { name: 'Layout' });
    await expect(layoutDialog).toBeVisible();
    await expect(layoutDialog.getByText('Page layout', { exact: true })).toBeVisible();
    await expect(layoutDialog.getByText('Typography', { exact: true })).toBeVisible();
    await expect(layoutDialog.getByText('Spacing', { exact: true })).toBeVisible();
    await expect(layoutDialog.getByText('Accent color', { exact: true })).toHaveCount(0);

    await layoutDialog.getByRole('button', { name: /Two columns/ }).click();
    await layoutDialog.getByRole('button', { name: 'Close Layout' }).click();
    await expect(layoutDialog).toBeHidden();

    const styleButton = toolbar.getByRole('button', { name: 'Style' });
    await expect(styleButton).toBeVisible();
    await styleButton.click();

    const styleDialog = page.getByRole('dialog', { name: 'Style' });
    await expect(styleDialog).toBeVisible();
    await expect(styleDialog.getByText('Visual themes', { exact: true })).toBeVisible();
    await expect(styleDialog.getByText('Accent color', { exact: true })).toBeVisible();
    await expect(styleDialog.getByText('Section title style', { exact: true })).toBeVisible();
    await expect(styleDialog.getByText('Page layout', { exact: true })).toHaveCount(0);

    await styleDialog.getByRole('button', { name: 'Tech & Internet' }).click();
    await styleDialog.getByRole('button', { name: 'Close Style' }).click();
    await expect(styleDialog).toBeHidden();

    await toolbar.getByRole('button', { name: 'Layout' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Layout' }).getByRole('button', { name: /Two columns/ }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('keeps page break guide with view controls', async ({ page }) => {
    await page.goto('/');

    const toolbar = page.locator('#resume-main-toolbar');
    const pageGuide = toolbar.getByRole('button', {
      name: 'Toggle page break guide',
    });

    await expect(pageGuide).toBeVisible();
    const initialState = await pageGuide.getAttribute('aria-pressed');
    expect(initialState === 'true' || initialState === 'false').toBe(true);

    await pageGuide.click();
    await expect(pageGuide).toHaveAttribute(
      'aria-pressed',
      initialState === 'true' ? 'false' : 'true',
    );
  });

  test('uses one PDF download action with ATS and Quick choices', async ({ page }) => {
    await page.goto('/');

    const download = page.getByRole('button', { name: 'Download' }).first();
    await expect(download).toBeVisible();

    await expect(
      page.getByRole('button', { name: /^ATS PDF$/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /^Quick PDF$/ }),
    ).toHaveCount(0);

    await page
      .getByRole('button', { name: 'Choose PDF export mode' })
      .click();

    await expect(page.getByText('PDF file name', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^ATS PDF$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Quick PDF$/ }),
    ).toBeVisible();
  });

  test('moves lower-frequency actions into More', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Share resume' })).toBeVisible();
    const resumeCheck = page.getByRole('button', { name: 'Check' });
    await expect(resumeCheck).toBeVisible();
    await expect(page.getByRole('button', { name: 'More actions' })).toBeVisible();

    await resumeCheck.click();
    const checkDialog = page.getByRole('dialog', { name: 'Resume Check' });
    await expect(checkDialog).toBeVisible();
    await expect(checkDialog.getByText('Check Results', { exact: true })).toBeVisible();
    await expect(
      checkDialog.getByText(
        'Check resume structure, wording, and ATS readability with local analysis.',
        { exact: true },
      ),
    ).toBeVisible();
    await page.keyboard.press('Escape');

    await expect(
      page.getByRole('button', { name: /^Guide$/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /^Import$/ }),
    ).toHaveCount(0);

    await page.getByRole('button', { name: 'More actions' }).click();

    await expect(
      page.getByRole('button', { name: 'Import' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Export Markdown' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Versions & backup' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Help' }),
    ).toBeVisible();

    await page.keyboard.press('Escape');

    const profileTrigger = page
      .locator('button[aria-controls="resume-profile-panel"]:visible')
      .first();
    await profileTrigger.click();

    const profilePanel = page.locator('#resume-profile-panel');
    await expect(
      profilePanel.getByRole('button', { name: 'Manage resumes' }),
    ).toBeVisible();
    await profilePanel.getByRole('button', { name: 'Manage resumes' }).click();

    const management = page.getByRole('dialog', { name: 'Resume Management' });
    await expect(management).toBeVisible();
    await expect(management.getByRole('button', { name: 'Resumes' })).toBeVisible();
    await expect(management.getByRole('button', { name: /Drafts \(\d+\)/ })).toBeVisible();
    await expect(management.getByRole('button', { name: 'Backup' })).toBeVisible();
  });
});
