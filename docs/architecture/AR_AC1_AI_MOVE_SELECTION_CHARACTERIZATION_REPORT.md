# AR-AC1 — Advanced AI Move Selection Characterization

Date: 2026-09-06  
Baseline: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS**

## Scope

This oracle freezes final F9T0 movement-score aggregation, deterministic tie-breaking and coordinate selection before and after extraction. Faction-specific base scoring is deliberately outside the boundary.

## Characterized behaviour

- all additive feature scores retain their original order and numeric values;
- emergency score contributes at `0.85` only while Strategic Status is active;
- C2E3 contributes at `0.35`;
- the optional Expert F9T2 bonus falls back to zero when absent;
- cached Strategic Status bypasses recomposition and preserves object identity;
- context is built exactly once and candidates are scored once in input order;
- a higher score wins before the tie value is considered;
- equal scores use `enemyHqDistance * 0.001 + coordinate-string-length * 0.000001`;
- an exact score-and-tie collision keeps the earlier candidate;
- the selected coordinate is returned by reference, an empty list returns `null`, and inputs are not mutated;
- the historical first-candidate `NaN` lock is preserved.

## Verification

| Gate | Result |
| --- | --- |
| Pre-extraction oracle | **PASS — 30/30** |
| Post-extraction oracle | **PASS — 30/30** |
| Boundary/facade/loader contract | **PASS — 46/46** |
| Historical F9T0 compatibility smoke | **PASS — 38/38** |
| Complete Node suite | **PASS — 146/146** |
| Complete Python/browser checks | **PASS — 69/69 in 347.6 seconds** |
| JavaScript syntax | **PASS — 260/260** |
| Starter 1.0 manifest | **PASS — `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`** |
| Map characterization hashes | **PASS — all five unchanged** |
| Golden Match hashes | **PASS — all five unchanged and deterministic** |

No gameplay value, score, choice, state, persistence payload, catalog or build metadata changed.
