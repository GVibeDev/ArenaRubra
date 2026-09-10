# AR-AC1 — Faction Move Scoring Characterization

Date: 2026-09-07  
Baseline: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS**

## Scope

The oracle freezes `botFactionMoveBaseScoreF9T0` before and after extraction. Its 20 deterministic scenarios cover every faction branch, recovery/pressure/guard/maturity routes, PS ownership, HQ approach, structure placement, formation support, Fabeot collapse/feint policy, garrison retention and the common commander/danger tail.

The serialized score-and-collaborator-call corpus has SHA-256:

`9c7dbc8949ab0bb1a0e33a3ae8159d7ef0d35475319580b0d8ec910a33d87868`

## Preserved behaviour

- Nexus network maturity, guard, structure and Pivot weights;
- Agathoi Green Line, build adjacency and formation weights;
- Exordium front, shock, Elite/Pivot and crowding weights;
- Liberti flank, sacrificial-unit and supported adjacency weights;
- Fabeot recovery, collapse, exposed-target, bait, value and split-pressure weights;
- the `-999` unreleased-garrison penalty;
- commander-threat distance, commander protection and adjacent-enemy penalties;
- exact helper-call routing, finite numeric outputs and input immutability.

## Verification

| Gate | Result |
| --- | --- |
| Pre-extraction characterization | **PASS — 14/14; 20-scenario hash frozen** |
| Post-extraction characterization | **PASS — 14/14; hash unchanged** |
| Boundary/facade/loader contract | **PASS — 66/66** |
| Historical F9T0 compatibility smoke | **PASS — 38/38** |
| Complete Node suite | **PASS — 148/148** |
| Complete Python/browser checks | **PASS — 69/69 in 349.1 seconds** |
| JavaScript syntax | **PASS — 263/263** |
| Starter 1.0 manifest | **PASS — `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`** |
| Map characterization hashes | **PASS — all five unchanged** |
| Golden Match hashes | **PASS — all five unchanged and deterministic** |

No faction weight, score, selected coordinate, gameplay rule, state, persistence payload, catalog or build metadata changed.
