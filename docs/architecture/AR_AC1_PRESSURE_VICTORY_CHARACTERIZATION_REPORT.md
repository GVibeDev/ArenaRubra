# AR-AC1 — Pressure and Victory Characterization Report

Date: 2026-09-04  
Scope: pre-extraction characterization only; no gameplay implementation changed.

## Result

**PASS — 31/31 deterministic assertions.**

`tests/ar_ac1_pressure_victory_characterization_smoke.js` executes the current canonical `src/rules.js` implementation in a DOM-free harness and freezes the following observable behaviour:

- Standard pressure does not evaluate before round 23 on a 2-player, 3-PS map;
- central control plus `ceil(total PS / 2)` advances exactly one pressure point;
- central control below the threshold is recorded as `unqualified` and does not advance;
- the seventh Standard increment wins with `winnerSide` set and `winType = "pressione"`;
- representative 2P, 3P and 4P profiles preserve terminal pressure attribution at their scaled start rounds;
- terminal result persistence remains idempotent when end-of-round resolution is invoked again;
- round-limit ranking uses PS, then surviving field units, then unspent ENE;
- an exact equality across all three values produces `winType = "pareggio"` and no winning side;
- occupying an enemy QG requires at least one controlled PS before the defender is eliminated;
- the last active player wins after QG capture.

## Characterized compatibility detail

The current multiplayer QG path calls `eliminatePlayer(..., "qg")`, but the last-survivor winner is stored with `winType = "eliminazione"`. This differs from the earlier two-player implementation in the same source file, which used `winType = "qg"` directly. The test intentionally freezes the effective, later multiplayer declaration. Changing this semantic label requires an explicit product decision and fixture migration; it must not happen accidentally during extraction.

## Boundary implication

Pressure and terminal victory can now be moved behind a pure rules boundary with the test retained as a pre/post oracle. Extraction still needs to preserve the existing integration ports for event emission, match-result persistence, lifecycle winner marking, statistics rendering and audio notification.

No production source, catalog data, build metadata or Starter 1.0 content changed in this milestone.

## Post-extraction result

On 2026-09-05 the same 31 assertions passed unchanged after Pressure and round-limit ownership moved to `src/rules/pressure_victory.js`. The extraction details and complete qualification are recorded in `AR_AC1_PRESSURE_VICTORY_BOUNDARY_REPORT.md`.
