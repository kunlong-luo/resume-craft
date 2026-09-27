import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('resume-onboarding-v1-complete', '1');
  });
});

test.describe('critical resume flows', () => {
  test('persists Markdown edits locally across reloads', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /源码编辑|Markdown/ }).click();
    const editor = page.locator('#markdown-textarea');
    await expect(editor).toBeVisible();

    const markdown = [
      '# E2E Candidate',
      '',
      '## 技能',
      '- TypeScript',
      '- React',
    ].join('\n');

    await editor.fill(markdown);

    await expect
      .poll(() =>
        page.evaluate(() => window.localStorage.getItem('resume-markdown')),
      )
      .toBe(markdown);

    await page.reload();
    await page.getByRole('button', { name: /源码编辑|Markdown/ }).click();
    await expect(page.locator('#markdown-textarea')).toHaveValue(markdown);
  });

  test('ATS PDF action reaches the browser print pipeline', async ({ page }) => {
    await page.addInitScript(() => {
      const notifyPrint = () => {
        window.top?.postMessage('resume-craft-e2e-print-called', '*');
      };

      window.print = notifyPrint;

      const originalAppendChild = Node.prototype.appendChild;
      Node.prototype.appendChild = function <T extends Node>(node: T): T {
        const appended = originalAppendChild.call(this, node) as T;

        if (node instanceof HTMLIFrameElement) {
          const stubIframePrint = () => {
            try {
              if (node.contentWindow) {
                node.contentWindow.print = notifyPrint;
              }
            } catch {
              // Same-origin print iframe is expected, but never fail the test
              // setup if a browser blocks direct frame access.
            }
          };

          stubIframePrint();
          node.addEventListener('load', stubIframePrint, { once: true });
        }

        return appended;
      };
    });

    await page.goto('/');

    await page.evaluate(() => {
      (window as Window & { __e2ePrintCalled?: boolean }).__e2ePrintCalled = false;
      window.addEventListener('message', (event) => {
        if (event.data === 'resume-craft-e2e-print-called') {
          (window as Window & { __e2ePrintCalled?: boolean }).__e2ePrintCalled = true;
        }
      });
    });

    const atsButton = page.getByRole('button', {
      name: /Download|下载/,
    }).first();

    await expect(atsButton).toBeVisible();
    await atsButton.click();

    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              (window as Window & { __e2ePrintCalled?: boolean })
                .__e2ePrintCalled,
          ),
        { timeout: 10_000 },
      )
      .toBe(true);
  });

  test('generates an encrypted share in the UI, rejects a wrong password, and decrypts with the correct one', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /分享简历|Share resume/ }).click();
    const shareDialog = page.getByRole('dialog', { name: /分享简历|Share resume/ });
    await expect(shareDialog).toBeVisible();
    await expect
      .poll(() => shareDialog.evaluate((element) => element.closest('header') === null))
      .toBe(true);

    const password = 'E2E-share-password!42';
    await page.locator('#share-password').fill(password);
    await page.getByRole('button', { name: /生成链接|Generate link/ }).click();

    const generatedLink = page.locator('#generated-share-link');
    await expect(generatedLink).toBeVisible();
    const shareUrl = await generatedLink.inputValue();
    expect(shareUrl).toContain('#share=');
    expect(shareUrl).not.toContain(password);

    await page.keyboard.press('Escape');
    await expect(shareDialog).toBeHidden();

    await page.getByRole('button', { name: /分享简历|Share resume/ }).click();
    await expect(page.locator('#generated-share-link')).toHaveCount(0);
    await expect(page.locator('#share-password')).toHaveValue('');
    await page.keyboard.press('Escape');
    await expect(shareDialog).toBeHidden();

    await page.goto('about:blank');
    await page.goto(shareUrl);

    await expect(
      page.getByRole('heading', { name: /加密简历分享|Encrypted Resume Share/ }),
    ).toBeVisible();

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('wrong-password');
    await page.getByRole('button', { name: /解密并查看简历|Decrypt & Read Resume/ }).click();

    await expect(
      page.getByText(
        /密码错误，或加密分享链接已被修改|Incorrect password or the encrypted link has been modified/,
      ),
    ).toBeVisible();

    await passwordInput.fill(password);
    await page.getByRole('button', { name: /解密并查看简历|Decrypt & Read Resume/ }).click();

    await expect(
      page.getByRole('heading', {
        name: /在线简历分享|Online Interactive Portfolio/,
      }),
    ).toBeVisible();
  });
});
