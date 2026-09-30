import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfirmProvider } from './context/ConfirmContext.tsx';
import { ToastProvider } from './components/ui/Toast.tsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx';
import './index.css';
import { initAnalyticsPageview } from './lib/analytics';
import { migrateLegacyStorageToIndexedDb } from './lib/storage-migration';
import { createResumePersistenceCoordinator } from './lib/resume-persistence';
import { resumeRepository } from './lib/resume-repository';
import { setResumeBootstrapSnapshot } from './lib/resume-bootstrap-state';

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
  // Verified legacy core keys are removed after migration; lightweight UI/bootstrap preferences remain in localStorage.
  try {
    await migrateLegacyStorageToIndexedDb();
    const [markdown, profiles, jdText] = await Promise.all([
      resumeRepository.getActiveMarkdown(),
      resumeRepository.getProfiles(),
      resumeRepository.getJdText(),
    ]);
    setResumeBootstrapSnapshot({ markdown, profiles, jdText });
  } catch (error) {
    setResumeBootstrapSnapshot(null);
    console.error('[bootstrap] IndexedDB migration failed; continuing with legacy storage:', error);
  }

  const [{ default: App }, { useResumeStore }] = await Promise.all([
    import('./App.tsx'),
    import('./store/useResumeStore.ts'),
  ]);

  const persistence = createResumePersistenceCoordinator();
  let previous = useResumeStore.getState();

  // Persist sanitized/default bootstrap state too, including first-run profiles.
  persistence.schedule({
    markdown: previous.markdown,
    profiles: previous.profiles,
    jdText: previous.jdText,
  });

  const unsubscribe = useResumeStore.subscribe((state) => {
    if (
      state.markdown === previous.markdown &&
      state.profiles === previous.profiles &&
      state.jdText === previous.jdText
    ) {
      previous = state;
      return;
    }
    previous = state;
    persistence.schedule({
      markdown: state.markdown,
      profiles: state.profiles,
      jdText: state.jdText,
    });
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
