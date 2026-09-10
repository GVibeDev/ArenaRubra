# AR-AC1 — Map Validation Boundary Report

Date: 2026-09-03  
Entry gate: Map Catalog boundary **PASS**  
Frozen catalog hash: `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`  
Comparison anchor: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS — fourth AC1 boundary complete.**

## Outcome

Map-validation rules no longer belong to the mixed runtime/persistence file. They now reside in `src/map_validation.js`, exposed as a DOM/storage-free service factory with an explicit dependency contract:

```text
map data -> map validation service <- explicit geometry/terrain/path dependencies
                                      |
                                      v
                         legacy validateMapDefinition facade
```

`src/map_runtime.js` constructs the service lazily and preserves the public `validateMapDefinition(rawDefinition, options)` entrypoint. Normalization, pathfinding, terrain queries, performance counters and custom-map persistence remain where they were and are passed as named dependencies. This keeps output ordering, warning/error messages and diagnostic side effects unchanged while making the validation-rule owner independently inspectable and headlessly testable.

The extraction was preceded by a deterministic corpus covering all twelve built-in definitions and twelve deliberately corrupted variants. Its projected results, warnings, summaries, imported flags, storage accesses and runtime performance counters retained the exact SHA-256 `49fe142d7b414997eda0cff008297ab391fdd0f397bfb3cbcd46943b4b8d9222` after extraction.

## Files changed and reasons

- `src/map_validation.js`: new DOM/storage-free validation service; receives schema, normalization, geometry, terrain and path dependencies explicitly.
- `src/map_runtime.js`: replaces the embedded validation rules with lazy service construction and the unchanged legacy facade.
- `index.html`: loads validation after canonical map definitions and before map runtime; the runtime now contains 98 ordered classic scripts.
- `tools/generate_starter_1_0_manifest.js`: loads the validation service before validating the frozen map catalog.
- `tests/ar_ac1_map_validation_characterization_smoke.js`: deterministic pre/post valid-and-invalid corpus with exact output hash.
- `tests/ar_ac1_map_validation_boundary_contract_smoke.js`: checks ownership, dependency declaration, DOM/storage absence, unique facade and loader direction.
- Map/runtime Node harnesses: load the new service wherever they execute `map_runtime.js`, without changing assertions.
- `tests/f9r3_proportional_pressure_official_maps_smoke.js`: locates the equidistance rule at its new canonical owner.
- `docs/architecture/AR_AC1_DEPENDENCY_MAP.md` and `docs/architecture/AR_AC1_TEST_COVERAGE_MAP.md`: distinguish the historical entry measurements from the current fourth-boundary state.
- `docs/architecture/AR_AC1_MAP_VALIDATION_BOUNDARY_REPORT.md`: milestone evidence and review gate.

No map data, validation rule, issue code/message/order, normalization result, storage schema, path cost, gameplay rule, balance value or UI behavior was intentionally changed.

## Tests executed

| Gate | Result | Notes |
| --- | --- | --- |
| Pre-extraction validation characterization | **PASS** | Twelve built-ins plus valid/imported and twelve corrupt-map cases |
| Post-extraction validation characterization | **PASS** | Exact characterization hash unchanged |
| Map Validation boundary contract | **PASS** | Explicit dependencies, DOM/storage-free owner, facade and loader order |
| Targeted map/runtime Node regressions | **PASS** | Foundation, editor, custom backgrounds, multiplayer terrain/lifecycle, pressure, SetupAdapter and manifest |
| Targeted browser regressions | **PASS 5/5** | Snow BF, all official maps, custom backgrounds, all official decks and DEV/Distribution profiles |
| Starter manifest | **PASS** | Frozen semantic hash unchanged |
| JavaScript syntax | **PASS 220/220** | Every JavaScript file under `src/`, `data/`, `tests/` and `tools/` |
| Complete Node suite | **PASS 120/120** | No skip/expected-failure list |
| Complete Python/browser suite | **PASS 68/68** | Executable smoke scripts under the UTF-8 runner; shared helper also loaded cleanly; includes Tutorial 5×5 and all prior browser paths |
| Diff hygiene | **PASS** | Temporary Playwright and generated CPython 3.12 cache removed; tracked CPython 3.13 fixture and generated Control Center screenshots restored |

## Regressions explicitly sought

- identical validation projection for all ten active official maps and both disabled legacy definitions;
- preservation of the historical fact that ten active maps validate while the two disabled legacy definitions remain compatibility-only;
- exact error/warning order for unsupported schema, invalid id/multiplier, empty or duplicate geometry, unknown terrain, invalid hazard, HQ errors and central-PS errors;
- unchanged normalized definition and summary fields;
- unchanged imported-map `official:false` and `editable:true` flags;
- no storage read/write during direct validation;
- unchanged path-query/performance-counter effects caused by existing runtime path helpers;
- editor save/import/export and custom background round trips;
- multiplayer terrain and player lifecycle behavior;
- all official-map validation, pressure, Setup selection and Distribution behavior;
- unchanged frozen Starter 1.0 catalog hash.

## Tests not executed / residual risks

- Normalization, cell indexing, terrain/path queries and custom-map persistence still share `src/map_runtime.js`; this boundary extracts validation-rule ownership only.
- The service deliberately calls injected runtime path helpers, preserving their performance-counter side effects. Removing those effects would be a separate behavioral decision.
- `createMapValidationService` and its legacy facade remain classic-script globals, so loader order still matters even though it is explicit and contract-tested.
- No ESM packaging, dependency-injection container or standalone schema library was introduced.
- No clean-checkout GitHub Actions run, physical-device validation, Desktop wrapper packaging or manual visual/UX sign-off was performed.
- No Golden Matches exist yet, so Advanced AI, Expert AI and central-rule extraction remain blocked by the roadmap's stronger characterization requirement.
- The current candidate remains **not product-validated**; passing this architectural gate does not advance release status.

## Rollback

Rollback is mechanical and migration-free: move the validation body back into `src/map_runtime.js`, remove service construction and its script tag, restore the affected test loaders and manifest tool, then rerun the same characterization hash and suites. No stored map or content manifest requires conversion.

## Gate conclusion

The fourth AC1 boundary is green and reversible. Map-validation rules now have a DOM/storage-free owner with named dependencies while the public runtime facade and observable behavior remain unchanged. This is the required review stop: normalization/path extraction, custom-map persistence work, AI/rules work, CSS decomposition, ESM conversion and Distribution loader changes are not included.
