# AR-AC1 — Map Catalog Boundary Report

Date: 2026-09-02  
Entry gate: Match Data boundary **PASS**  
Frozen catalog hash: `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`  
Comparison anchor: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS — third AC1 boundary complete.**

## Outcome

Snow BF is now canonical built-in map data rather than a payload and runtime patch owned by `src/ui.js`. Its dependency direction is explicit:

```text
official_maps_f9w2a1 -> map_definitions -> map_runtime -> Setup/UI consumers
```

`data/map_definitions.js` merges the Snow provider exactly once. The two UI-owned writers that wrapped `getBuiltinMapDefinitions` and `getMapDefinitionById`, together with the late Snow installer, have been removed. This preserves the existing classic-script API while eliminating the catalog's dependency on UI boot order.

The move was mechanical and characterized before and after extraction. Snow BF retains its exact identity, geometry, gameplay and background payloads; the full Starter 1.0 manifest remains byte-for-byte equivalent at its frozen semantic hash.

## Files changed and reasons

- `data/official_maps_f9w2a1.js`: new DOM-free provider containing the unchanged Snow BF official map definition.
- `data/map_definitions.js`: merges the Snow provider into the canonical built-in definitions exactly once.
- `index.html`: loads the provider before map definitions and map runtime; the runtime now contains 97 ordered classic scripts.
- `src/ui.js`: removes the Snow payload, clone/installer functions and the two catalog monkey patches; retains UI and boot responsibilities.
- `tools/generate_starter_1_0_manifest.js`: reads the canonical provider instead of extracting a literal from `src/ui.js`.
- `tests/f9w2a1_snow_bf_official_map_smoke.js` and `tests/f9w2a1_snow_bf_regression_f9w2b.js`: characterize the provider directly and retain exact payload hashes.
- `tests/f9w2a1_browser_snow_bf_smoke.py`: proves canonical runtime availability and the absence of the legacy UI installer across Setup and Distribution paths.
- `tests/f9w2b_menu_theme_smoke.js` and `tests/f9w2c_global_theme_scope_smoke.js`: follow the relocated predecessor markers while keeping theme/profile assertions UI-scoped.
- `tests/ar_ac1_map_catalog_boundary_contract_smoke.js`: enforces data-only ownership, unique registration, loader direction and absence of the former UI wrappers.
- `docs/architecture/AR_AC1_DEPENDENCY_MAP.md` and `docs/architecture/AR_AC1_TEST_COVERAGE_MAP.md`: distinguish the historical entry inventory from the current third-boundary state.
- `docs/architecture/AR_AC1_MAP_CATALOG_BOUNDARY_REPORT.md`: milestone evidence and review gate.

No map identity, cell, pressure source, hazard, movement multiplier, background, gameplay rule, balance value, UI behavior or stored schema was intentionally changed.

## Tests executed

| Gate | Result | Notes |
| --- | --- | --- |
| Pre-extraction Snow characterization | **PASS** | Official payload, regression, map foundation, pressure, deck selection and manifest checks |
| Post-extraction Snow characterization | **PASS** | Same exact geometry, counts, distances and content hashes against the new provider |
| Map Catalog boundary contract | **PASS** | DOM-free provider, unique catalog ownership, loader direction and no UI monkey patches |
| Targeted browser regressions | **PASS 4/4** | Snow BF, all official-map pressure, all official decks in Setup and Control Center |
| Starter manifest | **PASS** | Frozen semantic hash unchanged |
| JavaScript syntax | **PASS 217/217** | Every JavaScript file under `src/`, `data/`, `tests/` and `tools/` |
| Complete Node suite | **PASS 118/118** | No skip/expected-failure list |
| Complete Python/browser suite | **PASS 68/68** | Includes Setup, Distribution, 2P/3P/4P paths and all prior browser coverage |
| Diff hygiene | **PASS** | Generated Control Center screenshots restored; whitespace check clean |

## Regressions explicitly sought

- exact Snow BF id `map10_snow_bf_4pl_3x`, 349 cells, four players, 13 pressure sources, four hazards and movement multiplier ×3;
- equal center distance of 15 for all four starts;
- unchanged gameplay hash `119055f3cc7cfcbd7b36a0fd5ce0f856b4369e8164f71ca4b162432a0da90a8f`;
- unchanged background hash `6cb3ea1fa2f67c7b509a6e57dca0d787fcf5deac3c7e8059796d605be779e8dd`;
- exactly ten active official maps plus two disabled legacy definitions, with order and identity preserved;
- exactly one Snow registration in the canonical built-in catalog;
- unchanged Setup and Distribution visibility/selection behavior;
- pressure and deck-selection behavior across every official map and supported 2P/3P/4P setup;
- absence of the old installer, clone helper and wrappers around catalog lookup functions;
- unchanged Control Center, gameplay, AI, tutorial, theme, layout and profile suites;
- unchanged frozen Starter 1.0 catalog hash.

## Tests not executed / residual risks

- This boundary resolves Map Catalog data ownership; it does not extract a pure hex/map validation package.
- `src/map_runtime.js` still combines normalization, validation, custom-map persistence and path/query behavior.
- Other map providers remain classic-script globals containing large literals. They are canonical, but not ESM modules or injected dependencies.
- Provider, definitions and runtime load order remains significant even though the dependency direction is now explicit and contract-tested.
- No clean-checkout CI run, physical-device validation, Desktop wrapper packaging or manual visual/UX sign-off was performed.
- No Golden Matches exist yet, so Advanced AI, Expert AI and central-rule extraction remain blocked by the roadmap's stronger characterization requirement.
- The current candidate remains **not product-validated**; passing this architectural gate does not advance release status.

## Rollback

Rollback is mechanical and migration-free: restore the unchanged Snow payload and installer block to `src/ui.js`, remove the provider script and catalog spread, restore the manifest extractor and rerun the same gates. No stored data or user map needs conversion because official-map identities and custom-map persistence were not changed.

## Gate conclusion

The third AC1 boundary is green and reversible. The official map catalog now owns Snow BF directly and no longer depends on UI monkey patches. This is the required review stop: pure map-validation extraction, AI/rules work, CSS decomposition, ESM conversion and Distribution loader changes are not included.
