# AR-AC1 — Advanced AI Garrison Planning Boundary Report

Date: 2026-09-06  
Baseline: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS**

## Extracted boundary

F9T0 garrison priority and plan construction now have one canonical owner in `src/ai/garrison_planning.js`.

The frozen `createAiGarrisonPlanningService()` API exposes exactly:

- `botGarrisonCellPriorityF9T0(player, cell, status)`;
- `botBuildGarrisonPlanF9T0(player, status)`.

The service produces a new plan object, new ranked-entry and keep-cell arrays, and a new coordinate-key `Set`. It does not mutate the supplied status, cells, units or their source collections.

## Preserved policy

All historical scoring terms, budget precedence, critical-cell promotion, score/id ordering and guard-target rules are unchanged. The zero-cell result still omits `entries`; non-empty plans retain `budget`, `keepCells`, `keepKeys`, `guardTargets` and ranked `entries`.

The legacy global names remain thin facades in `src/ai.js`. A lazy singleton supplies six late-bound query ports, preserving the classic-script loader and the availability of state/gameplay helpers only after `ai.js` itself has loaded.

Strategic Status still calls `botBuildGarrisonPlanF9T0(player, result)` after deterministic status composition and attaches the returned plan. `nearestControlledPsNeedingGuard` and `shouldReleasePsGarrison` continue through the same global helpers.

## Explicit ports and exclusions

The boundary receives ports for controlled PS cells, nearby enemies, nearby allies, coordinate equality, hex distance and occupancy.

It contains no DOM, browser storage, IndexedDB, direct `window`, global `state`, telemetry, RNG, movement, purchase, scoring outside garrison priority, memory mutation or action execution.

## Loading

The relevant classic-script order is:

```text
src/ai/pressure_perception.js
  -> src/ai/faction_maturity.js
  -> src/ai/garrison_planning.js
  -> src/ai/strategic_status.js
  -> src/ai.js
```

The runtime now contains 108 ordered scripts. The service file performs no construction-time battlefield read.

## Verification

| Gate | Result |
| --- | --- |
| Garrison-planning pre/post characterization | **PASS — 30/30** |
| Boundary/facade/loader contract | **PASS — 35/35** |
| Historical F9T0 compatibility smoke | **PASS — 38/38** |
| Strategic Status characterization | **PASS — 26/26** |
| Strategic Status boundary contract | **PASS — 27/27** |
| Complete Node smoke suite | **PASS — 141/141** |
| Complete executable Python/browser suite | **PASS — 69/69 in 449.4 seconds** |
| JavaScript syntax | **PASS — 251/251** |
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

No AI decision, garrison policy, scoring coefficient, gameplay rule, state schema, persistence payload, catalog or build metadata changed.

## Rollback

Rollback is mechanical and migration-free: restore the two characterized implementations in `src/ai.js`, remove the service script and loader entry, restore VM harness routing, and rerun the same focused, Node, browser, manifest and hash gates.

## Review stop

The garrison-planning seam is green and reversible. Finalization memory was the next adjacent stateful candidate and has since been independently characterized and extracted behind its own mutation/telemetry boundary.
