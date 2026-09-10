# AR-AC1 — Victory and Lifecycle Characterization Report

Date: 2026-09-05  
Scope: characterization only; no production runtime changed in this milestone.  
Result: **PASS — 42/42 deterministic assertions**

## Covered behaviour

`tests/ar_ac1_victory_lifecycle_characterization_smoke.js` executes the current player-lifecycle, Pressure boundary and legacy Rules facade together in a DOM-free harness. It freezes:

- winner inference across all four runtime players;
- win-type inference for Pressure, QG, round-limit tiebreak, technical surrender, concession, draw and fallback outcomes;
- winner lifecycle marking;
- exactly-once match-result persistence, statistics refresh and match-end audio notification;
- idempotent `setWinner` behaviour;
- 3P/4P concession without premature match termination;
- distinct current-player and non-current-player concession orchestration;
- no arbitrary killer credit for concession or technical surrender;
- terminal 2P concession attribution and result persistence;
- auto-resign disabled, pre-round and human-player guards;
- hopeless-state streak accumulation, reset and third-evaluation elimination;
- sequential 3P QG capture, active-player transitions and last-survivor victory.

## Frozen compatibility observations

Two effective behaviours must remain stable unless changed by an explicit product decision:

1. Message-based winner inference matches the full `playerName(...)` rendering, including the faction label, rather than a bare `G1`–`G4` token.
2. A terminal technical surrender stores `eliminationReason = "resa_tecnica"`, but last-survivor resolution stores `winType = "eliminazione"`. Multiplayer QG victory has the same terminal win-type normalization.

The characterization also confirms that a current-player concession in a non-terminal multiplayer match delegates to `endTurn({ eliminatedCurrent:true })`, while a non-current concession renders without moving the cursor.

## Qualification

| Gate | Result |
| --- | --- |
| Focused victory/lifecycle characterization | **PASS — 42/42** |
| Complete Node smoke suite | **PASS — 132/132** |
| JavaScript syntax | **PASS — 236/236** |
| `git diff --check` | **PASS** |

The 69/69 browser gate from the immediately preceding Pressure/round-limit production extraction remains valid; it was not repeated because this milestone adds only a Node oracle and documentation.

## Extraction implication

The remaining winner/elimination/concession/auto-resign slice now has focused characterization in addition to the existing FFA attribution and player-lifecycle tests. A later extraction must retain explicit ports for lifecycle cleanup, attribution, logs/events, turn advancement, rendering, match persistence, statistics and audio. It must not absorb combat, Pressure evaluation or UI state.

No production source, content catalog, balance constant, storage schema or build metadata changed.

## Post-extraction result

The same 42 assertions passed unchanged after winner/elimination/concession/auto-resign ownership moved to `src/rules/victory_lifecycle.js`. The extraction and complete 133/133 Node plus 69/69 browser qualification are recorded in `AR_AC1_VICTORY_LIFECYCLE_BOUNDARY_REPORT.md`.
