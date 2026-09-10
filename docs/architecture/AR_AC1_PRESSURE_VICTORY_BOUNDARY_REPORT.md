# AR-AC1 — Pressure and Round-Limit Boundary Report

Date: 2026-09-05  
Baseline: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS**

## Extracted boundary

Pressure progression and round-limit resolution now have one canonical owner in `src/rules/pressure_victory.js`.

The classic-script factory `createPressureVictoryService(dependencies)` receives mutable state and every observable effect through named ports. It owns:

- strategic-point totals and proportional control thresholds;
- the scaled Pressure profile and user-facing requirement summary;
- central-PS qualification;
- end-of-round Pressure evaluation, attribution and increment;
- terminal Pressure victory;
- round-limit ranking by PS, surviving field units and unspent ENE;
- technical-draw resolution.

`src/rules.js` retains the seven historical global entrypoints as thin compatibility facades. The earlier dead two-player declarations of `resolveEndOfRound` and `resolveRoundLimit` were removed after characterization; the later multiplayer behaviour remains authoritative.

Conquest of QG, player elimination, concession, auto-resign, winner persistence, lifecycle marking, statistics rendering and match-end audio remain owned by `src/rules.js`. They are not silently folded into this boundary.

## Explicit dependency and effect ports

The service receives providers for state, active map, central PS, active/all player identities, controlled-PS counts, unit counts and scaled pace constants. Mutations and effects use the supplied `updateControlFromOccupants`, Pressure attribution, event, log and `setWinner` ports.

The boundary contains no DOM, browser storage, IndexedDB, direct `window` access or hard-coded `PRESSURE_WIN`/`MAX_ROUND` dependency. Its returned API is frozen.

## Compatibility bridge and loading

`index.html` loads `src/rules/pressure_victory.js` immediately before `src/rules.js`. Existing callers in turns, game setup, renderer, Advanced AI and Expert Exordium continue to call the same globals:

- `totalStrategicPoints`;
- `pressureControlThreshold`;
- `pressureRuleProfile`;
- `playerControlsCentralStrategicPoint`;
- `pressureRequirementSummary`;
- `resolveEndOfRound`;
- `resolveRoundLimit`.

No caller migration, ESM conversion or new replacement global was introduced.

## Verification

| Gate | Result |
| --- | --- |
| Focused pre/post characterization | **PASS — 31/31** |
| Boundary/loader/facade contract | **PASS — 27/27** |
| Complete Node smoke suite | **PASS — 131/131** |
| Complete executable Python/browser set | **PASS — 69/69** |
| JavaScript syntax | **PASS — 235/235** |
| Starter 1.0 semantic manifest | **PASS — `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`** |
| Map characterization hashes | **PASS — all five unchanged** |
| `git diff --check` | **PASS** |

The browser set was executed with Python UTF-8 mode on Windows. Fifty-three scripts passed in the initial complete traversal; sixteen scripts whose application assertions had completed but whose output hit the CP1252 console limitation were repeated with UTF-8 and passed. Test-only Playwright dependencies and generated screenshots/cache artifacts were removed or restored afterward.

The five Golden Matches remained deterministic and retained their frozen hashes as part of the browser gate.

## Frozen compatibility observation

The focused oracle continues to preserve the current multiplayer QG behaviour: a final QG capture resolves through player elimination and stores `winType = "eliminazione"`. This extraction does not alter or normalize that label.

## Rollback

Rollback is mechanical and migration-free: restore the Pressure and round-limit implementations in `src/rules.js`, remove the service script and loader entry, and rerun the same characterization, Node, browser and manifest gates. No stored schema, catalog identity or save payload changed.

## Review stop

This boundary is green and reversible. It does not authorize broad Rules/GameCore extraction, action-API replacement, AI decomposition, Expert framework work, CSS splitting, ESM conversion or Distribution loader changes.
