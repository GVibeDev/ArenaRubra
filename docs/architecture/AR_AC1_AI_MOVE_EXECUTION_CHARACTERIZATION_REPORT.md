# AR-AC1 — AI Move Execution Characterization

Date: 2026-09-07  
Baseline: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS**

## Scope

The oracle freezes `botMoveUnitF9T0` before and after extraction. It observes the Advanced-mode check, optional movement-history recording and authoritative `moveUnit` call without replacing any movement rule.

## Preserved behaviour

- Advanced AI records the chosen coordinate before movement;
- non-Advanced AI skips history but still moves;
- the orchestrator does not mutate the unit or coordinate;
- a recording error prevents movement and propagates unchanged;
- a movement error propagates after history was recorded;
- the historical facade returns `undefined`.

## Verification

| Gate | Result |
| --- | --- |
| Pre/post characterization | **PASS — 11/11** |
| Execution boundary contract | **PASS — 26/26** |
| Historical F9T0 smoke | **PASS — 38/38** |
| Complete Node suite | **PASS — 152/152** |
| Complete Python/browser checks | **PASS — 69/69** |
| JavaScript syntax | **PASS — 268/268** |
| Golden Matches | **PASS — all five hashes unchanged and deterministic** |
| `git diff --check` | **PASS** |

Tests not run: none in the current Node, Python/browser or JavaScript-syntax inventories. No gameplay, balance, content, persistence, catalog or build-metadata change was introduced.
