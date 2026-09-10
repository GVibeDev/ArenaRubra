# AR-AC1 — State ownership boundary

`state` remains the authoritative, backward-compatible serialized match object. AR-AC1 does not rename, delete or migrate its persisted fields.

`ArenaStateDomains` adds read-only clone/projection boundaries:

- `authoritative`: gameplay and persistence state;
- `ai`: planning/memory fields isolated from core state consumers;
- `telemetry`: diagnostics and match analytics;
- `uiInteraction`: selection, hover and presentation interaction state.

The projections do not become additional writers. Legacy gameplay functions remain the writers during this compatibility extraction; `GameCore` reaches them only through explicit action handlers in `src/core/runtime.js`. Match-record construction and migration remain owned by `src/data/match_data.js`, outside `src/ui.js`.

This is intentionally an ownership boundary, not a storage-schema migration. The existing MatchRecord migration and 4-player browser persistence tests are the compatibility gate.
