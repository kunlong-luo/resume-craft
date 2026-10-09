import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('IndexedDB hydration import ordering', () => {
  it('does not statically import Store consumers from the startup entrypoint', () => {
    const entry = readFileSync(resolve(process.cwd(), 'src/main.tsx'), 'utf8');
    const staticImports = entry.split('async function bootstrap()')[0];
    for (const path of [
      './App.tsx',
      './store/useResumeStore.ts',
      './context/ConfirmContext.tsx',
      './components/ui/Toast.tsx',
      './components/ui/ErrorBoundary.tsx',
    ]) {
      expect(staticImports).not.toContain(`from '${path}'`);
    }
    expect(entry).toContain('setResumeBootstrapSnapshot({ markdown, profiles, jdText })');
    expect(entry.indexOf("import('./components/ui/Toast.tsx')")).toBeGreaterThan(
      entry.indexOf('setResumeBootstrapSnapshot({ markdown, profiles, jdText })'),
    );
  });
});
