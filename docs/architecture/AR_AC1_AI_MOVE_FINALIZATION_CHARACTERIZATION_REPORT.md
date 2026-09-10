# AR-AC1 — AI Move Finalization Characterization

Date: 2026-09-07  
Baseline: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS**

## Scope

The oracle freezes `finishBotMove` before and after extraction, including all early returns, short-circuit checks, mutations, collaborator order and error propagation.

## Preserved behaviour

- non-field units return immediately without mutation or effects;
- War Push is consumed before its historical log, stationary action and action end;
- actionable infantry performs its stationary action before ending;
- `moveAttack` attempts attack-only behaviour before ending;
- failed infantry and move-attack capability checks remain two independent `canAct` calls;
- the default path ends without an unnecessary capability query;
- logging and attack errors propagate at their historical point and prevent later effects.

## Verification

| Gate | Result |
| --- | --- |
| Pre-extraction characterization | **PASS — 18/18** |
| Post-extraction characterization | **PASS — 19/19** |
| Finalization boundary contract | **PASS — 46/46** |
| Adjacent execution characterization | **PASS — 11/11** |
| Historical F9T0 smoke | **PASS — 38/38** |
| Complete Node suite | **PASS — 152/152** |
| Complete Python/browser checks | **PASS — 69/69** |
| JavaScript syntax | **PASS — 268/268** |
| Golden Matches | **PASS — all five hashes unchanged and deterministic** |
| `git diff --check` | **PASS** |

Tests not run: none in the current inventories. The extra post-extraction assertion verifies that the facade still emits the exact historical War Push message.
