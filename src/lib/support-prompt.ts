export const SUPPORT_REPO_URL = 'https://github.com/kunlong-luo/resume-craft';
export const SUPPORT_PROMPT_STORAGE_KEY = 'resume-craft.support-prompt.v2';
const LEGACY_SUPPORT_PROMPT_STORAGE_KEY = 'resume-craft.support-prompt.v1';

export type SupportPromptDecision = 'supported' | 'dismissed';

interface SupportPromptState {
  prompted: boolean;
  exportCount: number;
  decision?: SupportPromptDecision;
}

interface ShouldShowSupportPromptOptions {
  hostname: string;
  pathname: string;
  prompted?: boolean;
  exportCount?: number;
}

export function isOfficialHostedApp(hostname: string, pathname: string) {
  return hostname === 'kunlong-luo.github.io' && (
    pathname === '/resume-craft' || pathname.startsWith('/resume-craft/')
  );
}

export function shouldShowSupportPrompt({
  hostname,
  pathname,
  prompted = false,
  exportCount = 0,
}: ShouldShowSupportPromptOptions) {
  if (!isOfficialHostedApp(hostname, pathname)) return false;
  if (prompted) return false;

  // This function is evaluated only after an export has finished. Keep the
  // count guard explicit so tests and future call sites cannot accidentally
  // show the prompt before the user has received value.
  return exportCount >= 1;
}

function readStateFromStorage(key: string): unknown {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readSupportPromptState(): SupportPromptState {
  const current = readStateFromStorage(SUPPORT_PROMPT_STORAGE_KEY) as Partial<SupportPromptState> | null;
  if (current && typeof current.prompted === 'boolean') {
    return {
      prompted: current.prompted,
      exportCount: typeof current.exportCount === 'number' ? current.exportCount : 0,
      decision:
        current.decision === 'supported' || current.decision === 'dismissed'
          ? current.decision
          : undefined,
    };
  }

  // v1 used cooldown timestamps and could interrupt a later export. If a v1
  // state exists, treat that user as already prompted so the migration never
  // causes a surprise repeat reminder.
  const legacy = readStateFromStorage(LEGACY_SUPPORT_PROMPT_STORAGE_KEY);
  if (legacy) {
    return {
      prompted: true,
      exportCount: 1,
      decision: 'dismissed',
    };
  }

  return {
    prompted: false,
    exportCount: 0,
  };
}

function writeSupportPromptState(state: SupportPromptState) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(SUPPORT_PROMPT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Export should never fail because localStorage is unavailable.
  }
}

export function recordSuccessfulPdfExportAndShouldPrompt() {
  if (typeof window === 'undefined') return false;

  const current = readSupportPromptState();
  const next: SupportPromptState = {
    ...current,
    exportCount: current.exportCount + 1,
  };
  writeSupportPromptState(next);

  return shouldShowSupportPrompt({
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    prompted: next.prompted,
    exportCount: next.exportCount,
  });
}

export function markSupportPrompt(decision: SupportPromptDecision) {
  if (typeof window === 'undefined') return;

  const current = readSupportPromptState();
  writeSupportPromptState({
    ...current,
    prompted: true,
    decision,
  });
}
