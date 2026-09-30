import { expect, test } from '@playwright/test';
import { readActiveMarkdown } from './helpers/indexeddb';

const TEST_RESUME_PDF_BASE64 =
  'JVBERi0xLjMKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GMSAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL0NvbnRlbnRzIDcgMCBSIC9NZWRpYUJveCBbIDAgMCA2MTIgNzkyIF0gL1BhcmVudCA2IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9QYWdlTW9kZSAvVXNlTm9uZSAvUGFnZXMgNiAwIFIgL1R5cGUgL0NhdGFsb2cKPj4KZW5kb2JqCjUgMCBvYmoKPDwKL0F1dGhvciAoYW5vbnltb3VzKSAvQ3JlYXRpb25EYXRlIChEOjIwMjYwOTI2MDE0ODAxKzAwJzAwJykgL0NyZWF0b3IgKGFub255bW91cykgL0tleXdvcmRzICgpIC9Nb2REYXRlIChEOjIwMjYwOTI2MDE0ODAxKzAwJzAwJykgL1Byb2R1Y2VyIChSZXBvcnRMYWIgUERGIExpYnJhcnkgLSBcKG9wZW5zb3VyY2VcKSkgCiAgL1N1YmplY3QgKHVuc3BlY2lmaWVkKSAvVGl0bGUgKHVudGl0bGVkKSAvVHJhcHBlZCAvRmFsc2UKPj4KZW5kb2JqCjYgMCBvYmoKPDwKL0NvdW50IDEgL0tpZHMgWyAzIDAgUiBdIC9UeXBlIC9QYWdlcwo+PgplbmRvYmoKNyAwIG9iago8PAovTGVuZ3RoIDc3MAo+PgpzdHJlYW0KMSAwIDAgMSAwIDAgY20gIEJUIC9GMSAxMiBUZiAxNC40IFRMIEVUCkJUIDEgMCAwIDEgNzIgNzUwIFRtIChBbGV4IENoZW4pIFRqIFQqIEVUCkJUIDEgMCAwIDEgNzIgNzI2IFRtIChhbGV4QGV4YW1wbGUuY29tIHwgKzEgNTU1IDEyMyA0NTY3KSBUaiBUKiBFVApCVCAxIDAgMCAxIDcyIDcwMiBUbSAoU3VtbWFyeSkgVGogVCogRVQKQlQgMSAwIDAgMSA3MiA2NzggVG0gKFNvZnR3YXJlIGVuZ2luZWVyIGZvY3VzZWQgb24gZGlzdHJpYnV0ZWQgc3lzdGVtcyBhbmQgcmVsaWFibGUgcHJvZHVjdHMuKSBUaiBUKiBFVApCVCAxIDAgMCAxIDcyIDY1NCBUbSAoRXhwZXJpZW5jZSkgVGogVCogRVQKQlQgMSAwIDAgMSA3MiA2MzAgVG0gKEV4YW1wbGUgQ29ycCB8IFNlbmlvciBFbmdpbmVlciB8IDIwMjIgLSBQcmVzZW50KSBUaiBUKiBFVApCVCAxIDAgMCAxIDcyIDYwNiBUbSAoTGVkIHBsYXRmb3JtIG1vZGVybml6YXRpb24gYW5kIGltcHJvdmVkIHJlbGlhYmlsaXR5IGFjcm9zcyBwcm9kdWN0aW9uIHN5c3RlbXMuKSBUaiBUKiBFVApCVCAxIDAgMCAxIDcyIDU4MiBUbSAoU2tpbGxzKSBUaiBUKiBFVApCVCAxIDAgMCAxIDcyIDU1OCBUbSAoVHlwZVNjcmlwdCBSZWFjdCBQeXRob24gU1FMIEt1YmVybmV0ZXMpIFRqIFQqIEVUCkJUIDEgMCAwIDEgNzIgNTM0IFRtIChFZHVjYXRpb24pIFRqIFQqIEVUCkJUIDEgMCAwIDEgNzIgNTEwIFRtIChFeGFtcGxlIFVuaXZlcnNpdHkgfCBCLlMuIENvbXB1dGVyIFNjaWVuY2UgfCAyMDE4IC0gMjAyMikgVGogVCogRVQKIAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA4CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDA2MSAwMDAwMCBuIAowMDAwMDAwMDkyIDAwMDAwIG4gCjAwMDAwMDAxOTkgMDAwMDAgbiAKMDAwMDAwMDM5MiAwMDAwMCBuIAowMDAwMDAwNDYwIDAwMDAwIG4gCjAwMDAwMDA3MjEgMDAwMDAgbiAKMDAwMDAwMDc4MCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9JRCAKWzxlYWFiY2UxM2FiNzExM2M4MmQ1OGYxMzYyM2ViMGY1MT48ZWFhYmNlMTNhYjcxMTNjODJkNThmMTM2MjNlYjBmNTE+XQolIFJlcG9ydExhYiBnZW5lcmF0ZWQgUERGIGRvY3VtZW50IC0tIGRpZ2VzdCAob3BlbnNvdXJjZSkKCi9JbmZvIDUgMCBSCi9Sb290IDQgMCBSCi9TaXplIDgKPj4Kc3RhcnR4cmVmCjE2MDAKJSVFT0YK';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('resume-onboarding-v1-complete', '1');
    window.localStorage.setItem(
      'resume-settings',
      JSON.stringify({ lang: 'en' }),
    );
  });
});

test('imports a text-based PDF locally and shows machine-readability feedback', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByRole('button', { name: /More actions|更多操作/ }).click();
  await page
    .getByRole('button', { name: /^(Import|导入)$/ })
    .click();

  const dialog = page.getByRole('dialog', {
    name: /Import Resume|导入简历/,
  });
  await expect(dialog).toBeVisible();

  const fileInput = dialog.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'alex-chen-resume.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(TEST_RESUME_PDF_BASE64, 'base64'),
  });

  await expect(dialog.getByText('alex-chen-resume.pdf')).toBeVisible();
  await expect(
    dialog.getByText(/PDF machine-readability|PDF 机器可读性/),
  ).toBeVisible();
  await expect(dialog.getByText(/1 pages|1 页/)).toBeVisible();

  await dialog
    .getByRole('button', { name: /Import This File|确认导入/ })
    .click();

  await expect(dialog).toBeHidden();

  await expect.poll(() => readActiveMarkdown(page)).toContain('Alex Chen');
  await expect.poll(() => readActiveMarkdown(page)).toContain('Experience');
});
