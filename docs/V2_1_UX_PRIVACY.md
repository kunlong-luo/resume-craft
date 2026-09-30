# v2.1 UX & Privacy Release

This release closes the pre-promotion UX/privacy work without expanding product scope.

## Included

- Help displays the package version from the build-time `__APP_VERSION__` constant.
- Help keeps a permanent entry to replay onboarding without resetting resume content.
- The guide is streamlined into a five-step task flow: content → layout → style → check → download/share.
- Privacy copy explains the local-first model in user-facing language rather than tying the promise to one browser storage API.
- Clear Local Data has an explicit destructive-action confirmation and backup warning.
- Clearing data removes only Resume Craft-owned localStorage keys and leaves unrelated same-origin keys untouched.
- Split-ratio and support-prompt state are included in Resume Craft-owned storage keys.
- Browser E2E coverage verifies version display, replay entry, confirmation, scoped deletion, and preservation of unrelated localStorage data.

## Deferred to v2.2

Core resume persistence migration to Dexie + IndexedDB is tracked separately in #110. The v2.1 release intentionally does not mix a storage-engine migration into the UX/privacy release.
