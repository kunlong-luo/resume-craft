# Resume Craft v2.2 Performance

v2.2 focuses on the interactive preview hot path while preserving the existing local-first data model.

## What changed

- Paper measurement observers now remain stable while Markdown or settings change instead of being torn down and recreated on each edit.
- Preview DOM changes are measured through a shared `MutationObserver` and `ResizeObserver`, coalesced with `requestAnimationFrame`.
- Page-count callbacks are held through a ref so callback identity changes do not rebuild the measurement pipeline.
- Measurement state updates are skipped when the calculated values are unchanged, reducing avoidable React renders.
- Existing `useDeferredValue` preview rendering remains in place so editor input stays ahead of expensive preview work.

## Audit findings

The remaining largest performance opportunity is persistence. The current Zustand store serializes the complete profile collection to synchronous `localStorage` in several write paths, including Markdown editing. A Dexie/IndexedDB migration remains the preferred follow-up because it changes persistence semantics and deserves its own migration/rollback test plan rather than being bundled into the preview optimization.

## Acceptance criteria

- Markdown edits continue to update the preview and page count.
- A4 and US Letter measurement continue to work.
- Auto-fit continues to receive current overflow metrics.
- Zoom persistence remains unchanged.
- Preview measurement observers are not recreated merely because Markdown text or settings object identity changed.
- CI must pass lint, typecheck, unit tests, build and the repository's configured browser checks before release.
