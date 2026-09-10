# AR-AC1 — Map State Queries Boundary Report

Date: 2026-09-03  
Entry gate: Custom Map Persistence boundary **PASS**  
Frozen catalog hash: `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`  
Comparison anchor: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS — eighth AC1 boundary complete.**

## Outcome

State-aware map, terrain and player projections no longer belong to the mixed map runtime. They now reside in `src/map_state_queries.js`, which receives state, map, terrain, geometry and late gameplay hooks through explicit ports:

```text
state + map + terrain + geometry + late lifecycle hooks
                         |
                         v
                 map state queries
                         |
                         v
       runtime facade -> board / movement / rules / AI / UI
```

`src/map_runtime.js` constructs the service lazily and preserves all 26 historical globals, including active map/cell lookup, HQ and strategic-point projections, terrain costs/modifiers, player lifecycle queries, enemy-unit filtering and next-player selection. `isPlayerActive`, `combatUnits` and `getHq` are capability-checked at call time because their scripts load after the runtime and some VM tests intentionally omit them.

A deterministic pre-extraction corpus covers missing-state fallback, live state identity, explicit/default cell lookup, HQ/PS/deployment clone semantics, central-point precedence and distances, terrain usage/cost/defense behavior, movement clamp, player-ID coercion, active/eliminated/enemy sets, turn-order edge cases and optional lifecycle/combat/HQ hooks. Its SHA-256 remained exactly `b4a63f5aad2ba5b118d7648012ea83c845e4ff29247825a8b25011e71fab2f5c` after extraction. Persistence, pathfinding, normalization and validation hashes also remained unchanged.

## Files changed and reasons

- `src/map_state_queries.js`: new owner of map/terrain/player projections with explicit providers and no direct DOM, storage or global `state` access.
- `src/map_runtime.js`: removes embedded query implementations, wires dependencies lazily and retains the 26 unchanged compatibility facades.
- `index.html`: loads state queries after persistence and before runtime; the application now has 102 ordered classic scripts.
- `tools/generate_starter_1_0_manifest.js`: loads the query factory before runtime during catalog verification.
- `tests/ar_ac1_map_state_queries_characterization_smoke.js`: exact pre/post state, terrain, lifecycle and fallback snapshot.
- `tests/ar_ac1_map_state_queries_boundary_contract_smoke.js`: enforces ownership, explicit ports, facade uniqueness, forbidden global/API absence, late hook resolution and loader direction.
- Map/runtime Node harnesses: load the new factory before runtime without changing their feature expectations.
- `docs/architecture/AR_AC1_DEPENDENCY_MAP.md` and `docs/architecture/AR_AC1_TEST_COVERAGE_MAP.md`: record the eighth boundary while preserving historical entry measurements.
- `docs/architecture/AR_AC1_MAP_STATE_QUERIES_BOUNDARY_REPORT.md`: milestone evidence and review gate.

No gameplay rule, map definition, terrain value, player lifecycle rule, turn order, clone depth, public global API, storage schema, validation result, AI behavior or balance value was intentionally changed.

## Tests executed

| Gate | Result | Notes |
| --- | --- | --- |
| Pre-extraction state-query characterization | **PASS** | Missing/live state, map, terrain, players, hooks, identity and clone semantics |
| Post-extraction state-query characterization | **PASS** | Exact state-query hash unchanged |
| Independent persistence/pathfinding/normalization/validation characterization | **PASS** | All four prior hashes unchanged |
| Map State Queries boundary contract | **PASS** | Explicit providers, 26 facades, forbidden globals/APIs and loader order |
| Targeted map/runtime regressions | **PASS** | Foundation, terrain, elimination, editor, backgrounds and manifest |
| Partial-VM regression found and repaired | **PASS** | `terrainDefinition` now resolves only when a terrain query actually runs |
| Starter manifest | **PASS** | Frozen semantic hash unchanged |
| JavaScript syntax | **PASS 232/232** | Every project JavaScript file under `src/`, `data/`, `tests/` and `tools/` |
| Complete Node suite | **PASS 128/128** | No skip/expected-failure list |
| Complete Python/browser suite | **PASS 68/68** | UTF-8 runner with Playwright 1.62.0 and system Chrome |
| Diff hygiene | **PASS** | Temporary Playwright/CPython 3.12 artifacts removed; generated screenshots restored; `git diff --check` clean |

## Regressions explicitly sought

- built-in fallback behavior when no global state exists;
- preservation of live `mapDefinition` and `cells` identities from state;
- explicit-definition versus active-state cell lookup;
- exact HQ, strategic-point, central-point and deployment lookup behavior;
- historical clone depth, including cloned coordinates and shared nested PS tags;
- terrain fallback, usage counts, blocked movement, movement cost and derived defense without accumulation;
- movement multiplier clamp to the existing 1–3 range;
- player-ID number coercion and non-integer filtering;
- active/eliminated/enemy calculations with and without `isPlayerActive`;
- combat-unit filtering and HQ lookup with and without late-loaded hooks;
- turn-order wrap, missing-current-player and all-eliminated behavior;
- unchanged map-core hashes and frozen Starter 1.0 catalog hash.

## Tests not executed / residual risks

- Active definitions, active cell arrays and player objects intentionally remain live references; callers can mutate authoritative state through them, as before.
- Strategic-point results clone each coordinate but retain other nested references such as `tags`; this historical shallow-clone behavior is characterized, not corrected here.
- `isPlayerActive`, `combatUnits`, `getHq` and `terrainDefinition` remain late global capabilities behind runtime adapters. Missing terrain capability still fails only when a terrain query is invoked, matching partial-VM behavior.
- The factory and 26 compatibility facades remain classic-script globals, so loader order still matters even though it is explicit and contract-tested.
- Low-level sanitizers plus duplicate/import/export orchestration remain in `src/map_runtime.js`.
- No clean-checkout GitHub Actions run, physical-device validation, Desktop wrapper packaging or manual visual/UX sign-off was performed.
- No Golden Matches exist yet, so broader Advanced AI, Expert AI and central-rule extraction remain blocked by the roadmap's stronger characterization requirement.
- The current candidate remains **not product-validated**; passing this architectural gate does not advance release status.

## Rollback

Rollback is mechanical and migration-free: restore the 26 query implementations to `src/map_runtime.js`, remove the service bridge and script tag, restore affected test/tool loaders, then rerun all five exact map hashes and the complete suites. No stored map, state shape or content manifest requires conversion.

## Gate conclusion

The eighth AC1 boundary is green and reversible. Map, terrain and player projections now have a named owner with explicit dependencies while every gameplay/UI consumer continues through unchanged globals. This is the required review stop: broader AI/rules work, CSS decomposition, ESM conversion and Distribution loader changes are not included.
