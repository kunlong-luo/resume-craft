import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfirmProvider } from './context/ConfirmContext.tsx';
import { ToastProvider } from './components/ui/Toast.tsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx';
import './index.css';
import { initAnalyticsPageview } from './lib/analytics';
import { migrateLegacyStorageToIndexedDb } from './lib/storage-migration';
import { createResumePersistenceCoordinator } from './lib/resume-persistence';

// Suppress benign ResizeObserver loop notification messages that can occur during layout/zoom updates
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.message &&
      (event.message.includes('ResizeObserver loop completed with undelivered notifications') ||
        event.message.includes('ResizeObserver loop limit exceeded'))
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });
}

async function bootstrap() {
  // Complete and verify the v2.2 -> v2.3 copy before the store module initializes.
  // Legacy localStorage remains available as a rollback source during this release.
  try {
    await migrateLegacyStorageToIndexedDb();
  } catch (error) {
    console.error('[bootstrap] IndexedDB migration failed; continuing with legacy storage:', error);
  }

  const [{ default: App }, { useResumeStore }] = await Promise.all([
    import('./App.tsx'),
    import('./store/useResumeStore.ts'),
  ]);

  const persistence = createResumePersistenceCoordinator();
  let previous = useResumeStore.getState();

  const unsubscribe = useResumeStore.subscribe((state) => {
    if (state.markdown === previous.markdown && state.profiles === previous.profiles) {
      previous = state;
      return;
    }
    previous = state;
    persistence.schedule({ markdown: state.markdown, profiles: state.profiles });
  });

  const flushBeforeExit = () => {
    void persistence.flush();
  };
  window.addEventListener('pagehide', flushBeforeExit);

  initAnalyticsPageview();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <ConfirmProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ConfirmProvider>
      </ErrorBoundary>
    </StrictMode>,
  );

  // Keep references reachable for the lifetime of the page.
  window.addEventListener('beforeunload', () => {
    unsubscribe();
    flushBeforeExit();
  }, { once: true });
}

void bootstrap();
