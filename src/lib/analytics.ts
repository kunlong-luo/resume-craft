export const ANALYTICS_EVENTS = [
  'editing_started',
  'pdf_export_success',
  'browser_print_started',
  'ats_check_completed',
  'auto_fit_used',
  'share_created',
  'pwa_install',
  'feedback_opened',
  'local_data_cleared',
  'runtime_error',
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

declare global {
  interface Window {
    sa_event?: (event: string) => void;
    sa_pageview?: (path?: string) => void;
  }
}

const OFFICIAL_HOSTNAME = 'kunlong-luo.github.io';
const APP_PATH_PREFIX = '/resume-craft';
const SIMPLE_ANALYTICS_SCRIPT_ID = 'simple-analytics';
const SIMPLE_ANALYTICS_SCRIPT_URL = 'https://scripts.simpleanalyticscdn.com/latest.js';
const IGNORED_METRICS =
  'country,session,timeonpage,scrolled,useragent,screensize,viewportsize,language';

const trackedEventsThisPage = new Set<AnalyticsEvent>();
let analyticsScriptPromise: Promise<void> | null = null;

export function isOfficialAnalyticsContext(hostname: string, pathname: string) {
  return hostname === OFFICIAL_HOSTNAME && (
    pathname === APP_PATH_PREFIX || pathname.startsWith(`${APP_PATH_PREFIX}/`)
  );
}

export function isDoNotTrackEnabled(
  navigatorLike: Pick<Navigator, 'doNotTrack'> & { msDoNotTrack?: string },
  windowDoNotTrack?: string | null,
) {
  const value = navigatorLike.doNotTrack ?? navigatorLike.msDoNotTrack ?? windowDoNotTrack;
  return value === '1' || value === 'yes';
}

export function isAllowedAnalyticsEvent(event: string): event is AnalyticsEvent {
  return (ANALYTICS_EVENTS as readonly string[]).includes(event);
}

export function getSafeAnalyticsPath(pathname: string, search: string, hash: string = '') {
  try {
    const queryParams = new URLSearchParams(search);
    const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
    const fragmentParams = new URLSearchParams(fragment);

    if (queryParams.has('share') || fragmentParams.has('share')) {
      return `${APP_PATH_PREFIX}/shared`;
    }
  } catch {
    // Fall back to the browser pathname below.
  }

  return pathname;
}

function analyticsAllowedInCurrentBrowser() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (!isOfficialAnalyticsContext(window.location.hostname, window.location.pathname)) return false;

  const nav = navigator as Navigator & { msDoNotTrack?: string };
  const win = window as Window & { doNotTrack?: string | null };
  return !isDoNotTrackEnabled(nav, win.doNotTrack);
}

function ensureAnalyticsScript(): Promise<void> {
  if (analyticsScriptPromise) return analyticsScriptPromise;

  analyticsScriptPromise = new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }

    const existing = document.getElementById(SIMPLE_ANALYTICS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (typeof window.sa_pageview === 'function' || typeof window.sa_event === 'function') {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Analytics script failed to load')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SIMPLE_ANALYTICS_SCRIPT_ID;
    script.async = true;
    script.src = SIMPLE_ANALYTICS_SCRIPT_URL;
    script.dataset.autoCollect = 'false';
    script.dataset.collectDnt = 'false';
    script.dataset.ignoreMetrics = IGNORED_METRICS;
    script.referrerPolicy = 'no-referrer';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Analytics script failed to load')), { once: true });

    document.head.appendChild(script);
  });

  return analyticsScriptPromise;
}

export function initAnalyticsPageview() {
  if (!analyticsAllowedInCurrentBrowser()) return;

  void ensureAnalyticsScript()
    .then(() => {
      window.sa_pageview?.(
        getSafeAnalyticsPath(
          window.location.pathname,
          window.location.search,
          window.location.hash,
        ),
      );
    })
    .catch(() => {
      // Analytics must never affect the product experience.
    });
}

export function trackAnalyticsEvent(event: AnalyticsEvent) {
  if (!isAllowedAnalyticsEvent(event)) return;
  if (!analyticsAllowedInCurrentBrowser()) return;

  // Product events are visit-level signals, not click counters.
  // Keep deduplication in memory only so it never becomes a persistent identifier.
  if (trackedEventsThisPage.has(event)) return;
  trackedEventsThisPage.add(event);

  void ensureAnalyticsScript()
    .then(() => {
      window.sa_event?.(event);
    })
    .catch(() => {
      // Analytics must never affect the product experience.
    });
}
