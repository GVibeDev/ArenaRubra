# AR-AC1 — Map Pathfinding Boundary Report

Date: 2026-09-03  
Entry gate: Map Normalization boundary **PASS**  
Frozen catalog hash: `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`  
Comparison anchor: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS — sixth AC1 boundary complete.**

## Outcome

Geometry indexing, hex distance/neighbors, reachability, shortest paths, articulation-point warnings and obstacle-symmetry checks no longer belong to the mixed map runtime/persistence file. They now reside in the DOM/storage/state-free `src/map_pathfinding.js` service:

```text
geometry + terrain + directions + performance counters
                         |
                         v
                    pathfinding
                    /         \
             validation     movement / AI
```

`src/map_runtime.js` constructs the service lazily and preserves all eight legacy facades: `mapRuntimeCellIndex`, `mapRuntimeHexDistance`, `mapRuntimeNeighbors`, `mapRuntimeReachableKeys`, `mapRuntimeSingleCellChokes`, `mapRuntimeObstacleSymmetryIssues`, `findMapPath` and `mapReachableCells`. Terrain lookup, coordinate semantics, direction ordering and the existing `MAP_RUNTIME_PERF` object are passed explicitly.

A deterministic corpus was captured before extraction. It covers neighbor order, valid/invalid distances, shortest-path tie-breaking, difficult terrain, occupied intermediates versus occupied targets, invalid/outside endpoints, reachable-cell ordering and costs, flood reachability, chokes, symmetry, index identity and performance counters. Its SHA-256 remained exactly `a50e8ecd652690c5b9f3cd1bcdae092c117f09eaef0ab83809c0e20a66fccd52` after extraction. The independent normalization and validation hashes also remained unchanged.

## Files changed and reasons

- `src/map_pathfinding.js`: new state-free pathfinding/geometry owner with explicit terrain, direction, coordinate and telemetry dependencies.
- `src/map_runtime.js`: removes embedded algorithms/cache and retains the performance object, lazy service bridge and unchanged public facades.
- `index.html`: loads pathfinding between normalization and validation; the runtime now contains 100 ordered classic scripts.
- `tools/generate_starter_1_0_manifest.js`: loads the pathfinding service before validation/runtime catalog checks.
- `tests/ar_ac1_map_pathfinding_characterization_smoke.js`: exact pre/post path, reachability, cache and performance snapshot.
- `tests/ar_ac1_map_pathfinding_boundary_contract_smoke.js`: enforces ownership, explicit dependencies, DOM/storage/state absence, facade uniqueness and loader direction.
- Map/runtime Node harnesses: load the service before validation/runtime without changing functional expectations.
- `docs/architecture/AR_AC1_DEPENDENCY_MAP.md` and `docs/architecture/AR_AC1_TEST_COVERAGE_MAP.md`: record the sixth boundary while preserving historical entry measurements.
- `docs/architecture/AR_AC1_MAP_PATHFINDING_BOUNDARY_REPORT.md`: milestone evidence and review gate.

No terrain cost, neighbor order, path tie-break, occupancy rule, reachability order, validation result, gameplay rule, balance value, AI decision contract, map data or storage schema was intentionally changed.

## Tests executed

| Gate | Result | Notes |
| --- | --- | --- |
| Pre-extraction pathfinding characterization | **PASS** | Paths, costs, occupancy, reachability, chokes, symmetry, cache and counters |
| Post-extraction pathfinding characterization | **PASS** | Exact pathfinding hash unchanged |
| Independent normalization/validation characterization | **PASS** | Both prior hashes unchanged |
| Map Pathfinding boundary contract | **PASS** | Explicit dependencies, state/DOM/storage-free owner, facades and loader order |
| Performance regression | **PASS** | Deterministic ordering, geometry-cache reuse and 104-query counter preserved |
| Targeted map/runtime regressions | **PASS** | Foundation, movement terrain, editor, backgrounds, multiplayer, pressure, SetupAdapter and manifest |
| Starter manifest | **PASS** | Frozen semantic hash unchanged |
| JavaScript syntax | **PASS 226/226** | Every project JavaScript file under `src/`, `data/`, `tests/` and `tools/` |
| Complete Node suite | **PASS 124/124** | No skip/expected-failure list |
| Complete Python/browser suite | **PASS 68/68** | UTF-8 runner; includes movement/AI, Tutorial 5×5 and all prior browser paths |
| Diff hygiene | **PASS** | Temporary Playwright/CPython 3.12 artifacts removed; tracked fixture and generated screenshots restored |

## Regressions explicitly sought

- exact six-direction neighbor ordering and cube-coordinate distance behavior;
- deterministic shortest-path coordinates and costs under equal-cost alternatives;
- difficult-terrain cost and blocked terrain exclusion;
- occupied cells blocking intermediate traversal while an occupied target remains reachable;
- invalid/outside/same-cell endpoint behavior;
- exact reachable-cell insertion order for multiple budgets and occupied sets;
- flood reachability, single-cell choke and declared-symmetry diagnostics;
- WeakMap index reuse and unchanged `cellIndexBuilds`, `shortestPathQueries` and `reachableQueries` semantics;
- no mutation of caller-owned `occupiedKeys`;
- unchanged validation, normalization, movement, editor, official-map and Expert AI behavior;
- unchanged frozen Starter 1.0 catalog hash.

## Tests not executed / residual risks

- The geometry cache still invalidates only when the cell-array identity or length changes. In-place coordinate replacement at unchanged length can retain a stale index; this pre-existing behavior is preserved, not fixed in AC1.
- Performance counters remain intentional side effects passed into an otherwise state-free service.
- State-aware player/terrain lookup facades and custom-map persistence remain in `src/map_runtime.js`.
- `createMapPathfindingService` and the legacy facades remain classic-script globals, so loader order still matters even though it is explicit and contract-tested.
- No ESM packaging, clean-checkout GitHub Actions run, physical-device validation, Desktop wrapper packaging or manual visual/UX sign-off was performed.
- No Golden Matches exist yet, so broader Advanced AI, Expert AI and central-rule extraction remain blocked by the roadmap's stronger characterization requirement.
- The current candidate remains **not product-validated**; passing this architectural gate does not advance release status.

## Rollback

Rollback is mechanical and migration-free: restore the cache and algorithms to `src/map_runtime.js`, remove the service bridge and script tag, restore affected test/tool loaders, then rerun all three exact map-core hashes and the complete suites. No stored map or content manifest requires conversion.

## Gate conclusion

The sixth AC1 boundary is green and reversible. Pathfinding now has a DOM/storage/state-free owner with named dependencies while movement, validation and AI continue through unchanged facades. This is the required review stop: custom-map persistence work, broader AI/rules work, CSS decomposition, ESM conversion and Distribution loader changes are not included.
