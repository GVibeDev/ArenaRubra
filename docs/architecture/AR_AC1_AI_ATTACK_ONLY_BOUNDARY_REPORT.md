# AR-AC1 — AI Attack-Only Boundary Report

Date: 2026-09-07  
Result: **PASS**

`src/ai/combat_execution.js` now canonically owns `botTryAttackOnly`; `src/ai.js` retains a one-line lazy facade. Target enumeration, enemy lookup, adjacency, Advanced policy, attack capability, scoring, authoritative attack application and field-presence validation cross explicit late-bound ports.

The operation has no DOM, storage, direct global state, telemetry, RNG, renderer, movement or ability dependency. It sequences existing attack rules but does not implement them. Rollback is migration-free: restore the characterized body in the facade, remove the operation from the service and rerun its **16/16** characterization and **28/28** contract. Complete gates: Node **158/158**, browser **69/69**, syntax **275/275**.
