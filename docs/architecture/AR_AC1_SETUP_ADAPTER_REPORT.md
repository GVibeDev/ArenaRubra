# AR-AC1 — SetupAdapter Boundary Report

Date: 2026-09-01  
Entry gate: S2-C5a **PASS**  
Frozen catalog hash: `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`  
Comparison anchor: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS — first AC1 boundary complete.**

## Outcome

Setup-control interpretation no longer belongs to `src/state.js`. The runtime now loads one narrow classic-script namespace, `ArenaSetupAdapter`, immediately before state construction:

```text
DOM controls -> ArenaSetupAdapter -> existing setup DTO -> newGame -> createInitialGameState
```

`ArenaSetupAdapter.normalize(rawSetup, dependencies)` and `chooseFirstPlayer(playerIds, rngController, initiativeMode)` run without `document`. `createInitialGameState(setup)` was not modified and its DOM-free 2P/3P/4P snapshots remain unchanged. The browser bridge `readGameSetupFromDom()` retains its name and exact enumerable result shape.

The pre-extraction characterization exposed and preserved one compatibility asymmetry that the audit proposal had summarized incorrectly:

- faction, commander and mode values prefer `setupP*` controls over legacy `p*` controls;
- deck mode and saved-key values prefer legacy `p*` controls over `setupP*` controls.

This was corrected in the proposal document instead of being silently normalized. Initiative remains a separate required control read, as before; the chooser now receives its value explicitly and consumes exactly zero RNG calls for a valid explicit player or one RNG call for random/invalid input.

## Files changed and reasons

- `src/setup_adapter.js`: pure normalization plus the only ownership of setup/initiative control IDs; publishes one frozen namespace and no replacement globals.
- `src/state.js`: removed `readDeckSetupForSide` and `readPlayerSetupValue`; the existing `readGameSetupFromDom()` name is retained as a documented compatibility bridge.
- `src/game.js`: parameterized `chooseFirstPlayer`; the browser lifecycle obtains the existing required initiative control through the adapter.
- `index.html`: one script tag directly before `src/state.js`; all other relative script order remains unchanged.
- `tests/ar_ac1_setup_adapter_characterization_smoke.js`: exact pre/post setup, precedence, initiative/RNG and DOM-free initial-state snapshots.
- `tests/ar_ac1_setup_adapter_contract_smoke.js`: pure API, single-namespace, dependency and loader-order contract.
- `tests/ar_ac1_browser_setup_adapter_smoke.py`: full runtime Setup → match checks for representative 2P, 3P and 4P maps.
- `docs/architecture/AR_AC1_PROPOSED_FIRST_BOUNDARY.md`: records completion and corrects the precedence detail with measured evidence.
- `docs/architecture/AR_AC1_SETUP_ADAPTER_REPORT.md`: milestone evidence.

The boundary itself changes no file under `data/`, `assets/` or `css/`; the existing P0 CSS defect correction and S2-C5a manifest remain separate documented milestones. No gameplay, balance, catalog, map, AI, tutorial, storage, MatchRecord or telemetry schema was changed.

## Tests executed

| Gate | Result | Notes |
| --- | --- | --- |
| Pre-extraction characterization | **PASS** | Run against the original `state.js`/`game.js` ownership before production movement |
| Post-extraction characterization | **PASS** | Exact default, precedence, 3P/4P and state snapshots preserved |
| Adapter pure contract | **PASS** | `normalize` and initiative chooser execute with a throwing `document` proxy |
| Browser Setup integration | **PASS 3/3** | 2P Campo Starter, 3P The Valley, 4P Claustro Clash; DTO = authoritative state, no page/console errors |
| Starter manifest | **PASS** | Frozen catalog hash unchanged |
| JavaScript syntax | **PASS 213/213** | `src/`, `data/`, `tests/`, `tools/` |
| Complete Node suite | **PASS 116/116** | No skip/expected-failure list |
| Complete Python/browser suite | **PASS 68/68** | 359.6 seconds, includes Player/DEV profile and all prior browser paths |
| Diff hygiene | **PASS** | Generated screenshots restored; generated Python bytecode removed; `git diff --check` |

## Regressions explicitly sought

- default map, faction, commander, deck, mode, auto-resign, AI, pace and scale fallbacks;
- modern/legacy control-ID precedence, including the historical deck asymmetry;
- map-derived contiguous player IDs and fallback dictionaries for 2P/3P/4P;
- custom/invalid deck-mode normalization and saved-key identity;
- explicit versus seeded-random initiative and RNG call count;
- shallow `newGame(setupOverrides)` merge source contract;
- DOM access during pure setup normalization, initiative selection and state construction;
- script-order breakage across the 95 classic runtime scripts;
- actual HQ/card-zone creation and authoritative faction/mode state in 2P/3P/4P browser matches;
- all existing gameplay, tutorial, Challenge, persistence, theme, layout and profile smokes.

## Tests not executed / residual risks

- No clean-checkout CI run, physical-device validation, Desktop wrapper packaging or manual visual/UX sign-off was performed.
- `newGame()` remains a browser orchestrator and passes `document` to the adapter; only normalization, initiative choice and initial-state construction are pure in this boundary.
- `state.js` still publishes the global `$` helper because many UI/runtime files depend on it.
- `createInitialGameState()` still obtains map/hex/constants/seed helpers from the shared classic-script namespace.
- The compatibility bridge and deck-ID precedence asymmetry remain until all callers migrate to an explicit setup API.
- The overall runtime now has 95 ordered classic scripts. The audit inventory remains a labeled 94-script baseline snapshot; future dependency-map regeneration must include `setup_adapter.js` and should show its one-way edge into `state.js`/`game.js`.
- No Golden Matches exist yet, so AI and central rule extraction remain blocked by the roadmap's stronger characterization requirement.

## Rollback

Rollback is mechanical and migration-free: remove the adapter script tag/file, restore the two setup readers in `state.js`, restore the two-argument chooser DOM read in `game.js`, and rerun the same characterization/full gates. No storage key, serialized match, content ID or asset is involved.

## Gate conclusion

The first AC1 extraction is green and reversible. It removes the setup-control dependency from state ownership without changing the setup DTO or observed match initialization. Per the approved boundary sequence, this report is the review stop before selecting the next extraction; AI, central rules, Match Data/persistence, CSS decomposition and Distribution loading were not bundled into it.
