import type { Page } from '@playwright/test';

export async function readActiveMarkdown(page: Page): Promise<string | null> {
  return page.evaluate(() => new Promise<string | null>((resolve, reject) => {
    const request = indexedDB.open('resume-craft');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('documents', 'readonly');
      const getRequest = tx.objectStore('documents').get('active');
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => {
        const record = getRequest.result as { markdown?: string } | undefined;
        resolve(record?.markdown ?? null);
        db.close();
      };
    };
  }));
}

export async function readProfiles(
  page: Page,
): Promise<Array<{ id: string; name: string; markdown: string }>> {
  return page.evaluate(() => new Promise<Array<{ id: string; name: string; markdown: string }>>((resolve, reject) => {
    const request = indexedDB.open('resume-craft');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('profiles', 'readonly');
      const getRequest = tx.objectStore('profiles').getAll();
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => {
        resolve((getRequest.result ?? []).map((profile: { id: string; name: string; markdown: string }) => ({
          id: profile.id,
          name: profile.name,
          markdown: profile.markdown,
        })));
        db.close();
      };
    };
  }));
}
