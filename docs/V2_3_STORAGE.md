# v2.3 Local Data Architecture

Resume Craft v2.3 moves durable resume-owned data from large synchronous `localStorage` payloads to IndexedDB through Dexie while preserving the local-first, no-account product model.

## Architecture

```
React UI
  ↓
Zustand runtime state
  ↓
Repository / persistence coordinator
  ↓
Dexie
  ↓
IndexedDB
```

Zustand remains the live editor state. IndexedDB is the durable source of truth for core resume data.

## Data placement

### IndexedDB

- active resume Markdown
- resume profiles
- drafts and automatic backups
- JD text
- migration metadata
- future growing structured resume-owned records

### localStorage

Only small bootstrap/UI preferences remain:

- theme mode
- language and lightweight layout/settings cache
- preview zoom
- split ratio
- onboarding flags
- active profile ID
- support prompt state
- other small UI-only preferences

Core Markdown, profiles, drafts, and JD text are not kept live in localStorage after a verified v2.3 migration.

## v2.2 → v2.3 migration

The migration is intentionally one-way for core storage ownership:

1. Read legacy v2.2 core keys from localStorage.
2. Write them to IndexedDB.
3. Read the IndexedDB records back and verify them.
4. Write the migration-version marker.
5. Remove only the verified legacy core keys.
6. Keep lightweight UI/bootstrap preferences in localStorage.

If verification fails, the migration marker is not written and the legacy core keys are not removed. Startup falls back to the legacy data path so the resume remains recoverable.

The migration is idempotent. A completed migration can run again safely and will only clean stale migrated legacy keys.

## Startup

Startup performs migration before importing the Zustand store. After migration, an in-memory bootstrap snapshot passes IndexedDB state into the synchronous Zustand initializer.

This avoids keeping duplicate core data in localStorage only to make store creation synchronous.

## Persistence

Editor updates change Zustand immediately. Core persistence is asynchronous and debounced.

Rapid changes are coalesced before IndexedDB writes. Writes are serialized inside a tab, and browsers that support Web Locks also serialize Resume Craft IndexedDB writes across tabs.

Manual save writes the current Markdown and profiles directly through the repository.

Draft autosave and the backup/draft manager also use the repository rather than localStorage.

## Multi-tab behavior

Resume Craft detects another active Resume Craft tab through `BroadcastChannel` and warns the user against simultaneous editing of the same resume.

Web Locks reduce concurrent write races where supported, but v2.3 does not implement collaborative merge semantics. The latest persisted edit can still replace an older state from another tab.

## Clear local data

**Clear local data** deletes the Resume Craft IndexedDB database first and then removes only Resume Craft-owned localStorage keys.

It never calls `localStorage.clear()`, so unrelated applications sharing the same origin are not intentionally erased.

## Storage health

IndexedDB autosave failures use the same local-save health notification path as localStorage failures. A later successful IndexedDB write emits a recovery event.

## Security boundary

v2.3 does not add transparent default encryption-at-rest.

Encryption whose key is automatically stored beside the encrypted data provides limited protection against same-origin script compromise. A future optional password-protected local vault can use Web Crypto with a user-held secret as a separate feature.

## Validation gates

Before v2.3 is released:

- TypeScript, strict-boundary checks, ESLint, unit tests, and production build must pass.
- Full Chromium E2E must pass.
- Critical Firefox/WebKit E2E must pass on the PR.
- Migration E2E must prove existing v2.2 Markdown/profiles/drafts survive the move to IndexedDB.
- Clear-data E2E must prove IndexedDB data is removed while unrelated origin storage survives.
- Reload/profile/import/onboarding/template flows must validate persistence through IndexedDB rather than legacy core localStorage keys.
