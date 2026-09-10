# AR-AC1 — Proposed First Boundary

Baseline: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Proposal status: **implemented and verified — PASS; see `AR_AC1_SETUP_ADAPTER_REPORT.md`.**

## Decision

The single proposed first extraction is a **SetupAdapter boundary**: move setup-control interpretation out of `src/state.js`, make initiative selection accept an explicit setup value, and preserve the current browser entrypoints through a small legacy bridge.

This is one extraction, not the beginning of a broad GameCore rewrite. It targets the specific current chain:

```text
DOM -> state.js setup readers -> game.js -> createInitialGameState(setup)
```

and changes its ownership toward:

```text
DOM -> SetupAdapter -> normalized Setup DTO -> existing game lifecycle/state factory
```

The patch must not change rules, balance, content, map/deck selection semantics, RNG, visible UI or persistence.

## Why this is the first boundary

- The setup reader is small and has a finite, observable output object.
- `createInitialGameState(setup)` already accepts a setup object and has no direct `document` call; the missing seam is immediately upstream.
- `game.js::chooseFirstPlayer()` is the second setup-related DOM leak and can be made parameter-driven without touching combat, turns or AI policy.
- A fake element root is sufficient for Node characterization; no DOM framework is required.
- The existing global entrypoint can be retained, so browser callers do not need a simultaneous rewrite.
- Failure is easy to roll back: one new file, two small production edits, one script tag and targeted tests.

AI, Expert, Match Data, CSS and action validation are explicitly not selected. Each crosses many more writers, compatibility aliases or browser surfaces and lacks the deterministic coverage needed for a first move.

## Current contract to preserve

`readGameSetupFromDom()` currently returns:

```js
{
  mapId,
  mapDefinition,
  playerCount,
  playerIds,
  factions,
  selectedCommanders,
  selectedDecks,
  modes,
  autoResignEnabled,
  aiMode,
  pacePreset,
  gameScaleMode
}
```

Important compatibility details:

- map defaults to `map1_starter`;
- player count is derived from the chosen map and clamped to 2–4;
- player IDs are contiguous from 1;
- faction fallbacks are Nexus, Exordium, Liberti, Agathoi;
- side 1 defaults to human and later sides to bot;
- player faction/commander/mode controls prefer `setupP*` over legacy `p*` IDs;
- deck mode/saved-key controls retain the opposite historical precedence (`p*` before `setupP*`), as captured before extraction;
- deck mode normalizes to `template` or `custom`, with an optional saved key;
- auto-resign defaults to true, AI to `advanced`, pace to `standard`, game scale to `large_scale`;
- `newGame(setupOverrides)` currently reads DOM first and shallow-merges overrides;
- tutorial mode then forces the starter map and two players;
- initiative is read separately from `initiativeMode`; otherwise the supplied seeded RNG controller or `Math.random()` selects an active player.

The first patch must characterize these details before moving code. It must not opportunistically redesign the Setup DTO.

## Files involved

### Production files

| File | Proposed change | Constraint |
| --- | --- | --- |
| `src/setup_adapter.js` | New narrow adapter with setup-control reads, initiative read and pure normalization helpers | One explicit namespace/API; no rule, render, storage or telemetry dependency |
| `src/state.js` | Remove ownership of the three setup-reader implementations; retain the global `$` helper because many legacy/UI files still use it; retain the state factory unchanged except imports/bridge references if necessary | Do not move or reshape GameState in this patch |
| `src/game.js` | Pass explicit initiative mode to a pure initiative selector; continue existing browser lifecycle through the bridge | No change to RNG call count, tutorial overrides or new-game side effects |
| `index.html` | Load `src/setup_adapter.js` after map/data helpers and before `src/state.js` | Preserve all other script order exactly |

### Tests to add before production movement

| File | Purpose |
| --- | --- |
| `tests/ar_ac1_setup_adapter_characterization_smoke.js` | Node characterization of current setup output, fallbacks, precedence, map player counts and initiative/RNG behaviour |
| `tests/ar_ac1_setup_adapter_contract_smoke.js` | Pure adapter/initiative API, dependency and loader-boundary contract |
| `tests/ar_ac1_browser_setup_adapter_smoke.py` | Browser integration for Setup → new match in representative 2P, 3P and 4P configurations |

The test-only change should land and be reviewed before the extraction change. That preserves the roadmap rule “characterization before extraction” even if both belong to the same approved boundary.

## Dependencies

The adapter may depend only on explicit inputs:

```text
root.getElementById(id) or injected getValue/getChecked
getMapDefinitionById(mapId)
plain setup defaults
```

It must not depend on:

- global `state` or pending interaction variables;
- render, panels, camera, CSS selectors beyond the existing control IDs;
- storage or profile state;
- telemetry/events;
- faction/unit/deck mutation;
- AI policy;
- tutorial runtime internals.

`game.js` will continue to own orchestration. `createInitialGameState` will continue to use global map/hex/constants in this first patch; making those dependencies explicit is later work and must not be smuggled into this extraction.

## Target API

Indicative API, with exact naming subject to review:

```js
const ArenaSetupAdapter = Object.freeze({
  readFromDom(root, dependencies),
  normalize(rawSetup, dependencies),
  readInitiativeMode(root)
});

function readGameSetupFromDom() {
  return ArenaSetupAdapter.readFromDom(document, {
    getMapDefinitionById
  });
}

function chooseFirstPlayer(playerIds, rngController, initiativeMode) {
  // No document or $ access.
}
```

`readFromDom` must be the only function in this boundary that knows element IDs. `normalize` must accept plain data and be Node-safe. The returned object should remain a plain serializable DTO except for the existing `mapDefinition` object; removing that duplicate reference can be considered only after map-loading characterization.

The adapter namespace is an intentional temporary classic-script bridge, not permission to create a new collection of globals. When an ESM entrypoint exists, the same API can become an import without changing callers semantically.

## Legacy bridge

Required temporary compatibility:

1. Keep the global name `readGameSetupFromDom()` with its current zero-argument signature.
2. Keep the characterized precedence: `setupP*` first for player identity/mode, legacy `p*` first for deck controls.
3. Keep `newGame()` with no arguments as the browser path.
4. Keep partial `setupOverrides` shallow-merge behaviour until every caller is inventoried and characterized.
5. Keep global `$` in its current position; removing it would affect many files and is outside this boundary.
6. Do not rename F9 APIs or alter product-profile guards.

The bridge should be marked with its reason, caller inventory and removal condition. It is removable only when all setup callers use the explicit adapter/API and browser tests cover them.

## Characterization matrix

### Test A — default two-player setup

Fake the current control root with only required/default elements. Assert an exact normalized snapshot for map, player IDs, faction/mode fallbacks, deck mode, auto-resign, AI, pace and game scale.

### Test B — modern IDs beat legacy IDs

Provide conflicting `setupP*` and `p*` values for factions, commanders, modes and deck controls. Assert current precedence exactly.

### Test C — 3P and 4P derivation

Use injected map definitions for three and four players. Assert player IDs, all side dictionaries and fallback values. Include the Snow map ID as a stubbed four-player definition so the test does not load `ui.js`.

### Test D — custom deck identity

Assert `custom` plus `savedKey`, invalid modes normalizing to `template`, and missing-key behaviour.

### Test E — partial overrides

Capture the exact result of current DOM setup shallow-merged with tutorial and test-lab style overrides. This prevents accidental deep-merge or missing-side changes.

### Test F — initiative

Assert explicit active-player choice, invalid choice fallback, seeded controller call count and result, default player-ID fallback and no access to `document` in the pure selector.

### Test G — DOM-free state factory

Load the state factory in a VM where any `document` access throws. Inject only its current map/hex/constants/seed dependencies and construct representative 2P, 3P and 4P initial states. Compare stable fields only:

- map ID/revision/cell count;
- player IDs, factions, modes and turn order;
- initial ENE/pressure/lifecycle;
- empty units before HQ creation;
- card/mission/telemetry branch schemas;
- RNG state/calls.

Exclude `matchId` because it intentionally uses time/random today.

### Test H — browser integration

With Playwright installed, exercise Main Menu → Setup → match for one 2P, one 3P and one 4P map. Assert selected map/factions/decks/modes in authoritative state, HUD player count, first turn and no console/page error.

## Patch sequence

1. Close and approve AR-P0.
2. Add characterization tests only; demonstrate they pass against REFRACTOR_BASELINE or document any test harness-only adjustment.
3. Add `setup_adapter.js` and the one script tag.
4. Move the existing setup-read logic with no semantic cleanup.
5. Add the legacy bridge and parameterize initiative.
6. Run targeted tests, complete existing suite, browser smoke and diff review.
7. Stop for review; do not continue into state, action, AI or UI extraction automatically.

## PASS criteria

All conditions must hold:

1. AR-P0 has been explicitly moved to PASS before implementation starts.
2. Characterization tests are committed before or separately from production movement and are green on the baseline contract.
3. `ArenaSetupAdapter.normalize()` and `chooseFirstPlayer(..., initiativeMode)` execute when `document` is absent.
4. The stable snapshots of current `readGameSetupFromDom()` output are identical before and after extraction.
5. 2P, 3P and 4P initial-state characterization is green.
6. Explicit initiative and seeded-random initiative preserve result and RNG call count.
7. Existing Node suite has no new failure; any reviewed baseline expected failures remain byte-for-byte the same until separately repaired.
8. Relevant Playwright/browser startup tests pass in DEV and Distribution, with no console/page error.
9. No file under `data/`, `assets/` or `css/` changes.
10. No gameplay, catalog, rule, AI scoring, tutorial content, persistence schema or telemetry schema changes.
11. Global published-name count increases by at most the single adapter namespace/bridge agreed in review, and the change is documented.
12. Rollback restores the exact baseline behaviour and script order.

## Rollback

Rollback is mechanical and does not require data migration:

1. remove the `src/setup_adapter.js` script tag;
2. restore the three setup-reader implementations in `src/state.js`;
3. restore the current `chooseFirstPlayer()` DOM read and `newGame()` call shape in `src/game.js`;
4. remove the new adapter-specific tests if reverting the entire boundary, or retain them as baseline characterization if still valid;
5. run syntax, Node and browser gates and compare against REFRACTOR_BASELINE.

No storage key, serialized state, content ID or asset is touched, so rollback has no migration burden.

## Residual risks after a successful extraction

- `state.js` still owns the global `$` helper used by many UI files; the codebase is not globally DOM-free.
- `createInitialGameState` still reads map, hex, constants and telemetry helpers from the shared namespace.
- `newGame()` still performs rendering, logging, telemetry, cards, missions, camera and bot side effects; it is not yet a GameCore facade.
- Partial overrides and tutorial setup remain compatibility-sensitive.
- Snow remains installed by `ui.js`, so runtime map catalog ownership is still split.
- Authoritative actions still bypass a central validate/apply API.
- GameState still mixes authoritative data, AI diagnostics, telemetry and card debug.
- DEV/Distribution still share one loader.
- The classic-script namespace and 67-file dependency component remain, though one DOM edge should be removed.

Those risks are intentionally left visible. Closing them in the first patch would turn a low-risk seam into the mass refactor the roadmap forbids.
