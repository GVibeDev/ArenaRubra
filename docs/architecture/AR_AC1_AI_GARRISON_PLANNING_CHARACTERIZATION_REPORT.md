# AR-AC1 — Advanced AI Garrison Planning Characterization

Date: 2026-09-06  
Scope: pre/post-extraction characterization of F9T0 garrison priority and plan construction.  
Result: **PASS — 30/30 deterministic assertions before and after extraction**

## Candidate slice

The slice is limited to:

- `botGarrisonCellPriorityF9T0`;
- `botBuildGarrisonPlanF9T0`.

These helpers rank already controlled strategic points and construct a read-only reservation plan consumed by Strategic Status and later movement/purchase queries. They do not move a unit, mutate the board, update AI memory or emit telemetry.

## Frozen behaviour

`tests/ar_ac1_ai_garrison_planning_characterization_smoke.js` covers:

- exact threat, center, HQ-proximity, Pressure-lock and isolation score terms;
- the historical empty-plan shape, including omission of `entries`;
- one-PS, close-lock, Pressure-emergency, small-HQ-danger, stalled, mature-winning and default budget branches;
- critical threatened cells raising the computed budget;
- central-cell criticality during the Pressure window;
- deterministic score/id ordering;
- ordered `keepCells` and `keepKeys` contents;
- empty, hostile-occupied and undermanned friendly guard targets;
- exclusion of sufficiently supported friendly occupants;
- no mutation of cells, units or Strategic Status.

## Dependency surface

The slice needs six read ports: controlled PS cells, nearby enemies, nearby allies, coordinate equality, hex distance and cell occupancy. Its production source has no DOM, storage, direct state-global, telemetry, RNG or action dependency.

## Qualification

| Gate | Result |
| --- | --- |
| Focused characterization before extraction | **PASS — 30/30** |
| Pre-extraction complete Node suite | **PASS — 140/140** |
| Pre-extraction JavaScript syntax | **PASS — 249/249** |
| Focused characterization after extraction | **PASS — 30/30** |
| Boundary/facade/loader contract | **PASS — 35/35** |
| Historical F9T0 compatibility smoke | **PASS — 38/38** |
| Complete Node suite | **PASS — 141/141** |
| Complete executable Python/browser suite | **PASS — 69/69** |
| JavaScript syntax | **PASS — 251/251** |
| `git diff --check` | **PASS** |

Manifest, map-corpus and Golden Match hashes remained unchanged.

## Extraction constraint

Only deterministic priority and plan construction moved. Strategic Status still owns attachment sequencing through its legacy facade. Finalization memory, release policy, nearest-target selection, stall scoring, doctrine scoring and every action remain outside this service.
