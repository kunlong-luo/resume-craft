# Resume Craft v2.3.0

## Highlights

- Migrates core resume-owned data from synchronous localStorage blobs to Dexie + IndexedDB.
- Stores active Markdown, profiles, drafts / automatic backups, and JD text in IndexedDB while keeping lightweight UI/bootstrap preferences in localStorage.
- Adds a verified, idempotent v2.2 → v2.3 migration that writes first, reads back for verification, then removes only the migrated legacy core keys.
- Moves editor persistence to asynchronous debounced and serialized writes, with Web Locks serialization where supported.
- Adds multi-tab presence warnings, repository-backed draft/backup flows, and scoped Clear local data across both Resume Craft storage layers.
- Adds migration, repository, clear-data, Chromium, Firefox, and WebKit validation coverage.
- Includes an IndexedDB v1 → v2 upgrade path for development-preview databases.

## Storage architecture

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

Core resume content is stored locally in the browser. Resume Craft still does not require an account or provide an application backend for persisting resume content.

## Release status

v2.3.0 was published from main after PR #113 passed the quality, Chromium, and cross-browser CI gates. The release workflow also completed dependency-policy checks, tests, production build, tag creation, packaging, checksums, and GitHub Release publication.

Release: https://github.com/kunlong-luo/resume-craft/releases/tag/v2.3.0
