# AR-AC1 — Victory and Lifecycle Boundary Report

Date: 2026-09-05  
Baseline: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS**

## Extracted boundary

Winner resolution, player elimination orchestration, concession, auto-resign and QG victory now have one canonical owner in `src/rules/victory_lifecycle.js`.

The factory `createVictoryLifecycleService(dependencies)` owns:

- winner-side and win-type inference;
- idempotent terminal-result application;
- player-elimination attribution and last-survivor resolution;
- concession orchestration;
- auto-resign guards, hopeless-state streak and technical surrender;
- QG occupation checks and multiplayer active-player transitions.

The service does not own player-lifecycle cleanup internals, FFA attribution, turn advancement, match persistence, statistics, audio or rendering. Those capabilities enter through explicit ports.

## Compatibility facade

`src/rules.js` retains the seven historical globals:

- `setWinner`;
- `inferWinnerSide`;
- `inferWinType`;
- `eliminatePlayer`;
- `maybeAutoResign`;
- `concedeMatch`;
- `checkVictory`.

Every global now delegates to a lazily constructed service. The obsolete two-player duplicates of resignation, concession, winner inference and QG victory were removed only after the focused oracle was green.

`index.html` loads `src/rules/victory_lifecycle.js`, then `src/rules/pressure_victory.js`, then the legacy `src/rules.js` facade. Pressure consumes `setWinner` through that facade and does not construct or own lifecycle services.

## Explicit ports

The service receives state and rule inputs through providers for player identities, lifecycle status, units, QGs, PS control, enemy selection, distance and auto-resign constants. Observable effects are routed through named ports for:

- lifecycle cleanup and lifecycle winner marking;
- FFA elimination attribution and attribution snapshot;
- typed logging;
- match-result persistence;
- statistics refresh;
- match-end audio;
- turn advancement;
- rendering.

The boundary contains no DOM, browser storage, IndexedDB, direct `window` access or hard-coded Pressure/round-limit constants. The returned API is frozen.

## Verification

| Gate | Result |
| --- | --- |
| Victory/lifecycle pre/post characterization | **PASS — 42/42** |
| Victory/lifecycle boundary contract | **PASS — 37/37** |
| Pressure/victory characterization | **PASS — 31/31** |
| Complete Node smoke suite | **PASS — 133/133** |
| Complete executable Python/browser suite | **PASS — 69/69** |
| JavaScript syntax | **PASS — 238/238** |
| Starter 1.0 semantic manifest | **PASS — `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`** |
| Map characterization hashes | **PASS — all five unchanged** |
| `git diff --check` | **PASS** |

The complete browser gate ran in Python UTF-8 mode with Playwright 1.62.0 and the configured system Chrome. Temporary Python dependencies and generated cache/screenshot artifacts were removed or restored afterward. The five Golden Matches retained their frozen deterministic results.

## Preserved compatibility details

- Message inference still requires the complete `playerName(...)` label, including faction.
- Terminal technical surrender retains `eliminationReason = "resa_tecnica"` and `winType = "eliminazione"`.
- Terminal multiplayer QG capture retains `winType = "eliminazione"`.
- Current-player concession in an ongoing multiplayer match still advances through `endTurn({ eliminatedCurrent:true })`; non-current concession renders without moving the cursor.
- Concession and technical surrender assign no arbitrary killer or assist.

## Rollback

Rollback is mechanical and migration-free: restore the characterized implementations and compatibility declarations in `src/rules.js`, remove the new service/loader entry, revert source-based test routing and rerun the same Node, browser, manifest and hash gates. No persistence schema or stored match payload changed.

## Review stop

This bounded rule extraction is green. Combat, movement, deployment, economy, missions, tactics, Advanced AI, Expert AI, CSS/HTML decomposition, ESM conversion and Distribution loading remain outside this patch.
