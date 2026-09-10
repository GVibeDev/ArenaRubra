# AR-AC1 — Map Normalization Boundary Report

Date: 2026-09-03  
Entry gate: Map Validation boundary **PASS**  
Frozen catalog hash: `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`  
Comparison anchor: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS — fifth AC1 boundary complete.**

## Outcome

Map-definition normalization no longer belongs to the mixed runtime/persistence file. `src/map_normalization.js` now owns definition, cell and initial-hazard normalization through a DOM/storage/terrain-free service factory:

```text
map data -> normalization -> validation -> runtime/editor/state consumers
                ^
                |
       explicit schema/sanitizer helpers
```

`src/map_runtime.js` constructs the service lazily and preserves the global `mapRuntimeNormalizeDefinition(rawDefinition, options)` facade used by state construction, Map Editor, background import/export and custom-map persistence. Low-level cloning and sanitization helpers remain in the runtime and are passed by name, avoiding a mass API move.

A deterministic corpus was captured before extraction. It covers default input, hostile/sanitized input, imported-map flags, component/player limits, cells, hazards, central PS inference, presentation/background bounds, metadata, helper behavior, input immutability and storage isolation. Its SHA-256 remained exactly `a530bbb485703d6385b830d5bd3b6ae6f2b5ec563eb1d12ac1c0fcaaedd5766d` after extraction. The independent validation corpus also retained `49fe142d7b414997eda0cff008297ab391fdd0f397bfb3cbcd46943b4b8d9222`.

## Files changed and reasons

- `src/map_normalization.js`: new normalization owner for definitions, cells and initial hazards, with explicit schema and sanitizer dependencies.
- `src/map_runtime.js`: removes the embedded normalization implementation and retains a lazy service bridge plus the unchanged public facade.
- `index.html`: loads normalization between canonical map definitions and validation; the runtime now contains 99 ordered classic scripts.
- `tools/generate_starter_1_0_manifest.js`: loads normalization before validation/runtime when generating the frozen manifest.
- `tests/ar_ac1_map_normalization_characterization_smoke.js`: exact pre/post behavior snapshot for normal and adversarial inputs.
- `tests/ar_ac1_map_normalization_boundary_contract_smoke.js`: enforces ownership, dependency declaration, DOM/storage/terrain absence, facade uniqueness and loader direction.
- Map/runtime Node harnesses: load normalization before validation and runtime without changing their functional assertions.
- `docs/architecture/AR_AC1_DEPENDENCY_MAP.md` and `docs/architecture/AR_AC1_TEST_COVERAGE_MAP.md`: record the fifth boundary while preserving historical entry measurements.
- `docs/architecture/AR_AC1_MAP_NORMALIZATION_BOUNDARY_REPORT.md`: milestone evidence and review gate.

No map data, normalization output, validation result, issue ordering, storage schema, path cost, gameplay rule, balance value or UI behavior was intentionally changed.

## Tests executed

| Gate | Result | Notes |
| --- | --- | --- |
| Pre-extraction normalization characterization | **PASS** | Defaults, hostile input, import mode, sanitizers, hazards, presentation and immutability |
| Post-extraction normalization characterization | **PASS** | Exact normalization hash unchanged |
| Independent validation characterization | **PASS** | Exact validation hash unchanged |
| Map Normalization boundary contract | **PASS** | Explicit dependencies, DOM/storage/terrain-free owner, facade and loader order |
| Targeted map/runtime Node regressions | **PASS** | Performance, foundation, editor, backgrounds, multiplayer, pressure, SetupAdapter and manifest |
| Targeted browser regressions | **PASS 5/5** | Snow BF, all official maps, custom backgrounds, all official decks and DEV/Distribution profiles |
| Starter manifest | **PASS** | Frozen semantic hash unchanged |
| JavaScript syntax | **PASS 223/223** | Every project JavaScript file under `src/`, `data/`, `tests/` and `tools/` |
| Complete Node suite | **PASS 122/122** | No skip/expected-failure list |
| Complete Python/browser suite | **PASS 68/68** | UTF-8 runner; includes Tutorial 5×5 and all prior browser paths |
| Diff hygiene | **PASS** | Temporary Playwright/CPython 3.12 artifacts removed; tracked fixture and generated screenshots restored |

## Regressions explicitly sought

- exact normalized representation of all built-in map identities;
- default schema, id, text, player count, movement, turn order, geometry and metadata behavior;
- component, cell, player-slot, strategic-point, hazard and tag limits;
- control-character removal, whitespace collapse and id normalization;
- explicit/cell hazard merge order and payload cloning;
- central strategic-point inference and imported-map `official:false` / `editable:true` behavior;
- background MIME, dimensions, fit, opacity, scale, offsets and inline-data limits;
- no mutation of input objects and no storage access during direct normalization;
- unchanged validation errors, warnings, summaries and performance-counter effects;
- editor, custom-background import/export, Setup, official maps and Distribution behavior;
- unchanged frozen Starter 1.0 catalog hash.

## Tests not executed / residual risks

- A `null` member inside `playerSlots` still raises the historically observed `TypeError`; the characterization deliberately preserves it rather than introducing an AC1 behavior fix.
- Clone/text/id/number/image sanitizers remain public runtime helpers passed into the service; consolidating those utilities would be a separate boundary.
- Cell indexing, pathfinding/query behavior and custom-map persistence remain together in `src/map_runtime.js`.
- `createMapNormalizationService` and the legacy facade remain classic-script globals, so loader order still matters even though it is explicit and contract-tested.
- No ESM packaging, clean-checkout GitHub Actions run, physical-device validation, Desktop wrapper packaging or manual visual/UX sign-off was performed.
- No Golden Matches exist yet, so Advanced AI, Expert AI and central-rule extraction remain blocked by the roadmap's stronger characterization requirement.
- The current candidate remains **not product-validated**; passing this architectural gate does not advance release status.

## Rollback

Rollback is mechanical and migration-free: restore definition/cell/hazard normalization to `src/map_runtime.js`, remove the service bridge and script tag, restore affected test/tool loaders, then rerun both exact characterization hashes and the complete suites. No stored map or content manifest requires conversion.

## Gate conclusion

The fifth AC1 boundary is green and reversible. Map normalization now has a DOM/storage/terrain-free owner with named dependencies while all existing consumers continue through the legacy facade. This is the required review stop: pathfinding extraction, custom-map persistence work, AI/rules work, CSS decomposition, ESM conversion and Distribution loader changes are not included.
