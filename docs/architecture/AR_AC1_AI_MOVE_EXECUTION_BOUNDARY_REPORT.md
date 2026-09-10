# AR-AC1 — AI Move Execution Boundary Report

Date: 2026-09-07  
Baseline: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS**

## Extracted boundary

`src/ai/move_execution.js` is the canonical owner of `botMoveUnitF9T0`. The operation crosses three explicit, late-bound ports: AI-mode query, movement-history recording and authoritative movement application. `src/ai.js` retains the historical name as a lazy thin facade.

The same service now also hosts the separately characterized post-move finalizer. Its frozen API therefore exposes two adjacent movement-domain operations while keeping movement application isolated from finalization effects.

## Ownership and exclusions

The execution operation sequences existing collaborators only. It contains no DOM, browser storage, direct global state, telemetry, RNG, renderer, attack policy or unit-finalization policy. The authoritative `moveUnit` port remains the only owner of movement rules and state mutation.

Runtime loading is now:

```text
src/ai/move_selection.js
  -> src/ai/move_execution.js
  -> src/ai.js
```

The runtime contains 113 ordered scripts, and the service performs no construction-time game read.

## Verification and rollback

Characterization is **11/11**, the boundary contract is **26/26**, the complete Node suite is **152/152**, browser checks are **69/69**, JavaScript syntax is **268/268**, all five Golden Match hashes are unchanged, and `git diff --check` passes.

Rollback is mechanical and migration-free: restore the characterized three-call sequence in `src/ai.js`, remove its method and three ports from the service, then rerun the same gates. Residual risk is confined to the existing authoritative movement implementation behind the injected port; it was not modified by this step.
