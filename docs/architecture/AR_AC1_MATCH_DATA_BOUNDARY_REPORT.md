# AR-AC1 — Match Data Boundary Report

Date: 2026-09-02  
Entry gate: SetupAdapter boundary **PASS**  
Frozen catalog hash: `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`  
Comparison anchor: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS — second AC1 boundary complete.**

## Outcome

MatchRecord normalization, legacy-history migration, telemetry persistence and result recording no longer belong to `src/ui.js`. They now load as a DOM-free data module between the existing match-telemetry provider and Control Center/UI consumers:

```text
match_telemetry -> data/match_data -> control_center -> ui projections
```

The movement was deliberately mechanical. The public globals, storage keys, synchronous mirrors, migration rules and schema identifiers remain unchanged. `AR-MATCH-2` remains the canonical history schema and `AR-TELEMETRY-2` remains the separately stored telemetry schema. Existing Control Center HTML, CSV/stat projections and DOM rendering remain in `src/ui.js`.

The characterization test was executed before extraction and again after extraction. It continued to prove canonical four-player records, separate telemetry, compact statistics, HTML/CSV projections, idempotent legacy migration and the existing tutorial/Match Lab recording exclusions.

## Files changed and reasons

- `src/data/match_data.js`: owns MatchRecord/telemetry schemas, canonical construction, legacy normalization and migration, history/telemetry persistence, result recording and history export bridges; contains no DOM access.
- `src/ui.js`: retains presentation-only Match Data projections and boot orchestration; removed the data-core definitions moved above.
- `index.html`: loads the new module after `src/match_telemetry.js` and before `src/control_center.js` and `src/ui.js`.
- `tests/f9w1a_match_data_v2_smoke.js`: evaluates the canonical data module together with the unchanged UI projections instead of extracting both responsibilities from `ui.js`.
- `tests/ar_ac1_match_data_boundary_contract_smoke.js`: checks schema/API ownership, DOM absence, unique definitions and loader direction.
- `docs/architecture/AR_AC1_DEPENDENCY_MAP.md`: records the two completed one-way boundaries without rewriting the historical baseline inventory.
- `docs/architecture/AR_AC1_TEST_COVERAGE_MAP.md`: records the added Match Data characterization evidence and current suite counts.
- `docs/architecture/AR_AC1_MATCH_DATA_BOUNDARY_REPORT.md`: milestone evidence and review gate.

No gameplay, balance, catalog, map, AI, tutorial, CSS, MatchRecord field, telemetry field or persistence key was changed.

## Tests executed

| Gate | Result | Notes |
| --- | --- | --- |
| Pre-extraction F9W1a characterization | **PASS** | Original `ui.js` ownership; canonical 4P, migration, storage separation and projections |
| Post-extraction F9W1a characterization | **PASS** | Same assertions against `src/data/match_data.js` plus UI projections |
| Match Data boundary contract | **PASS** | DOM-free core, schemas and loader order |
| Targeted browser regressions | **PASS 4/4** | Match Data 4P, Control Center, telemetry foundation and telemetry hotfix |
| Starter manifest | **PASS** | Frozen catalog hash unchanged |
| JavaScript syntax | **PASS 200/200** | All JavaScript under `src/`, `tests/` and `tools/` in the current runner scope |
| Complete Node suite | **PASS 117/117** | No skip/expected-failure list |
| Complete Python/browser suite | **PASS 68/68** | Includes SetupAdapter, 4P Match Data, Control Center, tutorial 5×5 and all prior browser paths |
| Diff hygiene | **PASS** | Generated Control Center screenshots restored; `git diff --check` clean |

## Regressions explicitly sought

- exact `AR-MATCH-2` and `AR-TELEMETRY-2` schema identities;
- canonical 2P/3P/4P participant and winner representation, including the characterized 4P path;
- legacy history readability and idempotent normalization/migration;
- history and telemetry remaining separate but linked by `matchId`;
- unchanged storage envelopes, keys and synchronous compatibility mirrors;
- tutorial, Challenge/Academy and Match Lab exclusion from competitive history;
- stable compact statistics, history/telemetry HTML and CSV exports;
- Control Center history, statistics and telemetry panels;
- absence of `document`, selectors, listeners, classes and `innerHTML` from the new core module;
- script-order and global-override compatibility across the 96 classic runtime scripts;
- all existing gameplay, AI, tutorial, map, theme, layout and profile smokes.

## Tests not executed / residual risks

- No clean-checkout CI run, physical-device validation, Desktop wrapper packaging or manual visual/UX sign-off was performed.
- `src/ui.js` still owns Match Data projections and calls migration/readiness during boot; presentation and boot orchestration are not yet independently packaged.
- `src/data/match_data.js` still depends on shared classic-script globals and deliberately overrides legacy global entrypoints. Explicit dependency injection and a smaller published API remain future work.
- The underlying persistence stack is still split between `data_store.js`, the synchronous `storage.js` facade and direct persistence users elsewhere in the repository.
- The runtime now has 96 ordered classic scripts. The 94-script dependency inventory remains a labeled historical baseline and should be regenerated only as a separate measured audit.
- No Golden Matches exist yet, so Advanced AI, Expert AI and central-rule extraction remain blocked by the roadmap's stronger characterization requirement.
- The current candidate remains **not product-validated**; passing this architectural gate does not advance release status.

## Rollback

Rollback is mechanical and migration-free: move the data-core block and three compatibility exports back into `src/ui.js`, remove the new script tag/file, point the characterization test back to the original block and rerun the same gates. No stored record needs conversion because schemas and keys did not change.

## Gate conclusion

The second AC1 extraction is green and reversible. It establishes a DOM-free Match Data/persistence boundary while preserving serialized compatibility and UI behaviour. This is the required review stop: map/catalog extraction, AI work, central action APIs, CSS decomposition and Distribution loading are not included.
