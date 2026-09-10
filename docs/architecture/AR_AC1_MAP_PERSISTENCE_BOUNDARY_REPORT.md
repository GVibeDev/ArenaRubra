# AR-AC1 — Custom Map Persistence Boundary Report

Date: 2026-09-03  
Entry gate: Map Pathfinding boundary **PASS**  
Frozen catalog hash: `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`  
Comparison anchor: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS — seventh AC1 boundary complete.**

## Outcome

Custom-map store recovery, schema normalization, listing, lookup, save/overwrite conflict handling and deletion no longer belong to the mixed map runtime. They now reside in `src/map_persistence.js`, a DOM/state-free service with explicit storage and map-domain ports:

```text
storage read/write + normalization + validation + clock
                         |
                         v
               custom map persistence
                         |
                         v
          legacy runtime/editor/background facades
```

`src/map_runtime.js` constructs the service lazily and preserves the existing globals `mapRuntimeReadCustomStore`, `mapRuntimeWriteCustomStore`, `getCustomMapDefinitions`, `saveCustomMapDefinition` and `deleteCustomMapDefinition`. The storage key, schema version, sanitization, normalization, validation, built-in-ID predicate and clock are injected explicitly. Existing `arenaStorageReadJson`/`arenaStorageWriteJson` bridges continue to select ArenaDataStore or their established fallback; no stored schema was migrated.

A deterministic pre-extraction corpus covers empty and malformed stores, missing-storage fallback, write normalization, built-in duplication, save metadata, lookup, duplicate-ID rejection, overwrite, built-in protection, invalid-map rejection, failed-write reporting, deletion, storage keys, and export/import round-trip orchestration. Its SHA-256 remained exactly `6a46b58cc6fd1fa8becbae9a8ff6f70e71ac3ea5b73a1e9b533ecff83f88e400` after extraction. The independent normalization, validation and pathfinding hashes also remained unchanged.

## Files changed and reasons

- `src/map_persistence.js`: new owner of custom-map store and CRUD behavior behind explicit synchronous ports.
- `src/map_runtime.js`: removes embedded persistence decisions and retains lazy dependency wiring plus unchanged compatibility facades.
- `index.html`: loads persistence after validation and before runtime; the application now has 101 ordered classic scripts.
- `tools/generate_starter_1_0_manifest.js`: loads the persistence factory before runtime during catalog verification.
- `tests/ar_ac1_map_persistence_characterization_smoke.js`: exact pre/post storage, CRUD, failure and import/export snapshot.
- `tests/ar_ac1_map_persistence_boundary_contract_smoke.js`: enforces ownership, ports, error-code location, state/DOM/direct-browser-storage absence, facade uniqueness and loader direction.
- Map/runtime Node harnesses: load the new factory before runtime without changing their feature expectations.
- `docs/architecture/AR_AC1_DEPENDENCY_MAP.md` and `docs/architecture/AR_AC1_TEST_COVERAGE_MAP.md`: record the seventh boundary while preserving historical entry measurements.
- `docs/architecture/AR_AC1_MAP_PERSISTENCE_BOUNDARY_REPORT.md`: milestone evidence and review gate.

No map definition, validation rule, normalization rule, path behavior, storage key/schema, conflict code, Italian error text, metadata rule, built-in catalog entry, gameplay rule, balance value or public global API was intentionally changed.

## Tests executed

| Gate | Result | Notes |
| --- | --- | --- |
| Pre-extraction persistence characterization | **PASS** | Store recovery, fallback, CRUD, conflicts, metadata, failure, delete and import/export |
| Post-extraction persistence characterization | **PASS** | Exact persistence hash unchanged |
| Independent normalization/validation/pathfinding characterization | **PASS** | All three prior hashes unchanged |
| Custom Map Persistence boundary contract | **PASS** | Explicit ports, ownership, state/DOM/direct-browser-storage absence, facades and loader order |
| Targeted map/runtime regressions | **PASS** | Foundation, editor, custom backgrounds, local vault and manifest |
| Starter manifest | **PASS** | Frozen semantic hash unchanged |
| JavaScript syntax | **PASS 229/229** | Every project JavaScript file under `src/`, `data/`, `tests/` and `tools/` |
| Complete Node suite | **PASS 126/126** | No skip/expected-failure list |
| Complete Python/browser suite | **PASS 68/68** | UTF-8 runner with Playwright 1.62.0 and system Chrome |
| Diff hygiene | **PASS** | Temporary Playwright/CPython 3.12 artifacts removed; generated screenshots restored; `git diff --check` clean |

## Regressions explicitly sought

- exact storage key and schema-version normalization;
- empty, null, array and malformed-map-container recovery;
- unchanged no-storage read fallback and failed-write result;
- custom definition normalization and built-in immutability;
- exact `E_MAP_BUILTIN_READ_ONLY`, `E_MAP_ID_CONFLICT` and `E_MAP_NOT_FOUND` outcomes;
- created/updated timestamps and minimum revision behavior;
- overwrite versus conflict semantics and validation-before-write behavior;
- failed storage write reporting and custom deletion outcomes;
- normalized listing and lookup after persisted writes;
- export envelope and conflict-renamed import round trip;
- editor, background-inline-data, ArenaDataStore/local mirror and official-map compatibility;
- unchanged frozen Starter 1.0 catalog hash.

## Tests not executed / residual risks

- The service deliberately retains the synchronous storage-port contract. OPFS asynchronous flush and local mirror consistency remain responsibilities of `ArenaDataStore` and its existing bridges.
- `readStore` and `writeStore` retain the historical in-place repair of a supplied object whose `maps` member is malformed; callers relying on object identity therefore see that mutation.
- Portable export/import and duplicate-map orchestration remain in `src/map_runtime.js`; this boundary owns persistence CRUD only.
- When storage bridges are absent, reads return a fresh in-memory fallback and writes return `false`; this preserved mode is not durable storage.
- State-aware player/terrain query facades remain mixed in `src/map_runtime.js`.
- The factory and compatibility facades remain classic-script globals, so loader order still matters even though it is explicit and contract-tested.
- No clean-checkout GitHub Actions run, physical-device validation, Desktop wrapper packaging or manual visual/UX sign-off was performed.
- No Golden Matches exist yet, so broader Advanced AI, Expert AI and central-rule extraction remain blocked by the roadmap's stronger characterization requirement.
- The current candidate remains **not product-validated**; passing this architectural gate does not advance release status.

## Rollback

Rollback is mechanical and migration-free: restore the persistence functions to `src/map_runtime.js`, remove the service bridge and script tag, restore affected test/tool loaders, then rerun all four exact map hashes and the complete suites. No stored map, storage key or content manifest requires conversion.

## Gate conclusion

The seventh AC1 boundary is green and reversible. Custom-map persistence now has a named DOM/state-free owner with explicit storage ports while editor and runtime consumers continue through unchanged facades. This is the required review stop: state-aware map-query extraction, broader AI/rules work, CSS decomposition, ESM conversion and Distribution loader changes are not included.
