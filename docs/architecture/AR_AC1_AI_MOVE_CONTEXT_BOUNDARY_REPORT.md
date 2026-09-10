# AR-AC1 — Advanced AI Move Context Boundary Report

Date: 2026-09-06  
Baseline: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS**

## Extracted boundary

Advanced F9T0 movement-context construction now has one canonical owner in `src/ai/move_context.js`.

The frozen `createAiMoveContextService()` API exposes only `botCreateAdvancedMoveContextF9T0(unit, options, status)`.

The service prepares the read model consumed by the legacy scoring functions. It returns common strategic data, active-faction targets and ordered per-coordinate feature vectors while preserving historical reference identity.

## Preserved orchestration

`src/ai.js` retains the historical global function as a thin facade. Its lazy singleton supplies all battlefield, faction and feature collaborators through late-bound callbacks.

`chooseAdvancedMove` still obtains Strategic Status, calls the same global context builder, evaluates `botAdvancedMoveScoreF9T0` for every candidate, applies the historical tie value and returns the selected coordinate. No scoring or selection code moved with this boundary.

The facade still passes `includeFaction:false` to general doctrine scoring, `includeDoctrine:false` and `includeGate:false` to C2E3 scoring, and zero when `botMissionMoveBonus` is unavailable.

## Exclusions

The service contains no DOM, browser storage, IndexedDB, direct `window`, global `state`, telemetry, RNG, sorting, final score aggregation, tie-breaking, movement action or rendering.

It has a deliberately broad read-port list because collapsing those collaborators into an opaque global callback would hide the dependency graph this milestone is intended to expose.

## Loading

The relevant classic-script order ends with:

```text
src/ai/pressure_perception.js
  -> src/ai/finalization_memory.js
  -> src/ai/faction_maturity.js
  -> src/ai/garrison_planning.js
  -> src/ai/strategic_status.js
  -> src/ai/move_context.js
  -> src/ai.js
```

The runtime now contains 110 ordered scripts. The service performs no construction-time game read.

## Verification

| Gate | Result |
| --- | --- |
| Move-context pre/post characterization | **PASS — 47/47** |
| Boundary/facade/loader contract | **PASS — 58/58** |
| Historical F9T0 compatibility smoke | **PASS — 38/38** |
| Finalization-memory characterization | **PASS — 40/40** |
| Garrison-planning characterization | **PASS — 30/30** |
| Complete Node smoke suite | **PASS — 145/145** |
| Complete executable Python/browser suite | **PASS — 69/69 in 521.3 seconds** |
| JavaScript syntax | **PASS — 257/257** |
| Starter 1.0 semantic manifest | **PASS — `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`** |
| Map characterization hashes | **PASS — all five unchanged** |
| Golden Match hashes | **PASS — all five unchanged and deterministic** |
| `git diff --check` | **PASS** |

The browser gate used Python UTF-8 mode, Playwright 1.62.0 and system Chrome. Generated Python 3.12 bytecode and regenerated reference screenshots were removed or restored. The ignored `.tmp_ar_ac1_pydeps` directory remains because its package-created child ACLs deny deletion to both the sandbox identity and the available elevated account; it is not loaded by the application or included in Git status.

## Preserved Golden outputs

- `GOLDEN-001`: `07b533c8bf5fa42687ec7b617852995a325e352428f37c10156205a5a94031d6`;
- `GOLDEN-002`: `24a4a01759db83a561ffd79a9943eac3cf8828e19531fd3ff8f522b7c755e2f5`;
- `GOLDEN-003`: `11d215c48edd022bcc9a8bd8d4fc1c120017ec70b2e9c8f339adf7695eee1f34`;
- `GOLDEN-004-3P`: `493699236a59069d20f41a185bfcdacb8ed9a32ffb9a3388a34ae7484c88fee8`;
- `GOLDEN-005-4P`: `d899ba0fa2603f44422c5aebcec8206afd46907e8c32a5050b908e8907aa8ab5`.

No AI feature value, score, choice, gameplay rule, state schema, persistence payload, catalog or build metadata changed.

## Rollback

Rollback is mechanical and migration-free: restore the characterized builder in `src/ai.js`, remove the service script and loader entry, restore VM harness routing, and rerun the same focused, Node, browser, manifest and hash gates.

## Review stop

The movement-context seam is green and reversible. Deterministic aggregation and selection were subsequently characterized and extracted into `src/ai/move_selection.js`; faction-specific base scoring and action execution remain the next adjacent candidates.
