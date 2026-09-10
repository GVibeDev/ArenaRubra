# AR-AC1 — Advanced AI Finalization Memory Boundary Report

Date: 2026-09-06  
Baseline: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS**

## Extracted boundary

F9T0 progress and movement-history memory now have one canonical owner in `src/ai/finalization_memory.js`.

The frozen `createAiFinalizationMemoryService()` API exposes exactly four operations:

- `ensureAiFinalizationMemoryF9T0()`;
- `botProgressSnapshotF9T0(player)`;
- `botUpdateFinalizationMemoryF9T0(player)`;
- `botRecordMoveChoiceF9T0(unit, coord)`.

The boundary intentionally mutates only the memory object supplied through its storage ports. It does not hold a direct reference to global game state.

## Preserved stateful semantics

The `F9T0-1` schema, object identities, same-round early return, progress criteria, early-round reset, nine-round stall cap, coordinate cloning and return detection are unchanged.

The two optional telemetry behaviours are also preserved. The service emits `recordMaxStalledRounds(player, value)` after a new round record and `recordOscillationMove(side)` only for a detected return. The facade implements those effects only when `state.aiTelemetry` exists, retaining legacy branch creation and counters.

## Legacy compatibility

`src/ai.js` retains all four historical global names as thin facades. A lazy singleton supplies explicit late-bound storage, state-query, battlefield and telemetry-effect ports.

Strategic Status still advances memory exactly once before maturity queries and deterministic composition. `botMoveUnitF9T0` still records a choice only when Advanced AI is enabled and then invokes the historical `moveUnit` action.

## Exclusions

The service contains no DOM, browser storage, IndexedDB, direct `window`, global `state`, direct `aiTelemetry`, RNG, renderer, movement action, purchase, tactic or doctrine dependency.

It does not own stall scoring or any decision policy. It records observations used by those policies.

## Loading

The relevant classic-script order is:

```text
src/ai/pressure_perception.js
  -> src/ai/finalization_memory.js
  -> src/ai/faction_maturity.js
  -> src/ai/garrison_planning.js
  -> src/ai/strategic_status.js
  -> src/ai.js
```

The runtime now contains 109 ordered scripts. The service performs no construction-time state read.

## Verification

| Gate | Result |
| --- | --- |
| Finalization-memory pre/post characterization | **PASS — 40/40** |
| Boundary/facade/loader contract | **PASS — 49/49** |
| Historical F9T0 compatibility smoke | **PASS — 38/38** |
| Strategic Status characterization | **PASS — 26/26** |
| Strategic Status boundary contract | **PASS — 27/27** |
| Complete Node smoke suite | **PASS — 143/143** |
| Complete executable Python/browser suite | **PASS — 69/69 in 450.0 seconds** |
| JavaScript syntax | **PASS — 254/254** |
| Starter 1.0 semantic manifest | **PASS — `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`** |
| Map characterization hashes | **PASS — all five unchanged** |
| Golden Match hashes | **PASS — all five unchanged and deterministic** |
| `git diff --check` | **PASS** |

The browser gate used Python UTF-8 mode, Playwright 1.62.0 and system Chrome. Temporary dependencies, generated Python 3.12 bytecode and regenerated reference screenshots were removed or restored afterward.

## Preserved Golden outputs

- `GOLDEN-001`: `07b533c8bf5fa42687ec7b617852995a325e352428f37c10156205a5a94031d6`;
- `GOLDEN-002`: `24a4a01759db83a561ffd79a9943eac3cf8828e19531fd3ff8f522b7c755e2f5`;
- `GOLDEN-003`: `11d215c48edd022bcc9a8bd8d4fc1c120017ec70b2e9c8f339adf7695eee1f34`;
- `GOLDEN-004-3P`: `493699236a59069d20f41a185bfcdacb8ed9a32ffb9a3388a34ae7484c88fee8`;
- `GOLDEN-005-4P`: `d899ba0fa2603f44422c5aebcec8206afd46907e8c32a5050b908e8907aa8ab5`.

No AI decision, progress criterion, telemetry counter, gameplay rule, state schema, persistence payload, catalog or build metadata changed.

## Rollback

Rollback is mechanical and migration-free: restore the four characterized implementations in `src/ai.js`, remove the service script and loader entry, restore VM harness routing, and rerun the same focused, Node, browser, manifest and hash gates.

## Review stop

The finalization-memory seam is green and reversible. Movement-context construction and deterministic score/tie selection were subsequently characterized and extracted into `src/ai/move_context.js` and `src/ai/move_selection.js`. Faction-specific base scoring and action execution remain the next Advanced AI candidates.
