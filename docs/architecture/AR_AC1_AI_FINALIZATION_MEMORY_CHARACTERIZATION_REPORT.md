# AR-AC1 — Advanced AI Finalization Memory Characterization

Date: 2026-09-06  
Scope: pre/post-extraction characterization of F9T0 progress and movement-history memory.  
Result: **PASS — 40/40 deterministic assertions before and after extraction**

## Candidate slice

The stateful slice is limited to:

- `ensureAiFinalizationMemoryF9T0`;
- `botProgressSnapshotF9T0`;
- `botUpdateFinalizationMemoryF9T0`;
- `botRecordMoveChoiceF9T0`.

It owns the `F9T0-1` memory schema, per-player progress records and per-unit movement history. It does not move units, choose actions or render UI.

## Frozen behaviour

`tests/ar_ac1_ai_finalization_memory_characterization_smoke.js` covers:

- no-state fallback behaviour;
- exact schema initialization and preservation of an existing memory root;
- addition of missing `players` and `unitHistory` branches without replacing unrelated fields;
- exact progress snapshots for round, controlled PS, Pressure, enemy count, closest enemy-HQ distance and forward units;
- missing-enemy-HQ fallbacks;
- first observation and same-round identity/idempotency;
- stall increments, early-round reset and cap at nine;
- independent progress signals for PS, Pressure, enemy attrition, distance and forward-unit count;
- monotonic maximum-stall telemetry;
- historical memory initialization even when movement input is invalid;
- cloned movement coordinates, return detection and side-specific oscillation telemetry;
- absence of telemetry creation when the optional branch is missing.

## Dependency and mutation surface

The service needs explicit ports for memory presence/storage, round and Pressure reads, battlefield queries, coordinate operations, controlled-PS count and two optional telemetry effects.

Intentional mutations are confined to the F9T0 memory object returned by the storage port. Telemetry mutation is not performed directly by the service: maximum-stall and oscillation signals leave through effect ports implemented by the legacy facade.

## Qualification

| Gate | Result |
| --- | --- |
| Focused characterization before extraction | **PASS — 40/40** |
| Pre-extraction complete Node suite | **PASS — 142/142** |
| Pre-extraction JavaScript syntax | **PASS — 252/252** |
| Focused characterization after extraction | **PASS — 40/40** |
| Boundary/facade/loader contract | **PASS — 49/49** |
| Historical F9T0 compatibility smoke | **PASS — 38/38** |
| Complete Node suite | **PASS — 143/143** |
| Complete executable Python/browser suite | **PASS — 69/69** |
| JavaScript syntax | **PASS — 254/254** |
| `git diff --check` | **PASS** |

Manifest, map-corpus and Golden Match hashes remained unchanged.

## Extraction constraint

Only F9T0 memory storage, progress observation and movement-history recording moved. `botMoveUnitF9T0`, stall scoring, Strategic Status orchestration, garrison policy, faction doctrine, purchases, tactics and action selection remain outside the service.
