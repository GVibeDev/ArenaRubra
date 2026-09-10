# AR-AC1 — AI Stationary-Action Boundary Report

Date: 2026-09-07  
Result: **PASS**

`src/ai/combat_execution.js` now owns `botTryStationaryAction`; the legacy global remains a thin facade. Ability targeting/scoring/application, attack application, movement selection/application and logging are explicit ports. The boundary owns only the three historical continuation-marker mutations and action sequencing.

It contains no DOM, storage, direct global state, telemetry, RNG, renderer or action-ending policy. The **36/36** contract verifies the frozen three-operation API, explicit ports, mutation ownership, facade wiring and loader direction. Rollback requires no data migration. Residual risk remains in the authoritative ability, attack and movement ports, which were not modified. Complete gates: Node **158/158**, browser **69/69**, syntax **275/275**.
