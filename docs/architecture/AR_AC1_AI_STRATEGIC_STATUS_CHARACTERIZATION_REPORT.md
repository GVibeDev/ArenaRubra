# AR-AC1 — Advanced AI Strategic Status Characterization

Date: 2026-09-06  
Scope: pre-extraction characterization retained as the post-extraction regression oracle.  
Result: **PASS — 26/26 deterministic assertions before and after extraction**

## Candidate examined

The examined Advanced AI candidate was `strategicStatus(player, options)` in `src/ai.js`. It combines the already extracted Pressure-perception profile with battlefield, headquarters, endgame, doctrine and finalization signals, then selects the mode consumed by later AI scoring and actions.

The deterministic composition now resides in `src/ai/strategic_status.js`. The historical facade remains in `src/ai.js`, where it calls `botUpdateFinalizationMemoryF9T0(player)`, delegates composition and then calls `botBuildGarrisonPlanF9T0(player, result)`. AI memory mutation and garrison policy did not move with the composer.

## Characterized scenarios

`tests/ar_ac1_ai_strategic_status_characterization_smoke.js` freezes:

- the complete legacy result shape, including the attached `garrisonPlan`;
- balanced midgame output and `normal` mode;
- neutral central-PS opening and early enemy central control;
- qualified enemy Pressure during the pre-window warning interval;
- recovery from zero controlled PS;
- HQ defence combined with territorial recovery;
- direct HQ occupation and its all-in priority;
- round-limit disadvantage without a false Pressure-danger signal;
- an enemy Pressure plan inferred from losing posture before the formal Pressure window;
- a qualified four-of-five Pressure close and `vittoria_pressione` mode;
- immediate legal QG occupation taking priority over that otherwise closed Pressure plan;
- a two-raider strong QG-closing sequence;
- Nexus finalization-stall escape after two stalled rounds;
- rejection of the same faction-limited stall mode for Liberti;
- authoritative use of `options.movesFor` without falling through to global `movableCells`.

The assertions use proportional profiles with different `requiredPs` values rather than assuming a fixed three-point battlefield.

## Collaboration and mutation contract

The focused harness executes the real `strategicStatus` facade, the extracted Strategic Status composer and the extracted Pressure-perception service, while replacing only the collaborators that belong to later candidate boundaries.

It proves that each status evaluation:

- requests the finalization-memory snapshot once;
- requests Nexus and Agathoi maturity once with the canonical Pressure threshold;
- requests the garrison plan once;
- supplies the fully composed status to garrison planning before attaching `garrisonPlan`;
- does not mutate the supplied match state when the memory collaborator is isolated.

The last point is deliberately conditional. The current production memory collaborator does mutate AI finalization state; the characterization does not mislabel the existing orchestration as pure.

## Dependency surface

The candidate currently depends on:

- state turn, factions, Pressure counters, cells and units;
- enemy selection, controlled-PS counts, HQ and combat-unit queries;
- coordinate equality, distance, central-PS lookup and QG threat range;
- the extracted AI Pressure profile and central-control query;
- the broader strategic-state assessment;
- mutable finalization-memory update;
- Nexus and Agathoi maturity evaluation;
- movement reachability, optionally injected through `options.movesFor`;
- garrison-plan construction.

The source span has no DOM, local/session storage, IndexedDB or direct `window` dependency.

## Extraction result

The boundary keeps memory advancement and garrison planning in the legacy facade, passing their already computed snapshots into a read-only status composer. The preserved order is:

```text
Pressure/battlefield snapshot
  -> finalization-memory observation/update
  -> maturity inputs
  -> deterministic status and mode composition
  -> garrison-plan construction from that status
  -> attach garrisonPlan
```

This preserves the existing single-call counts and keeps scoring, actions and mutable memory outside the service.

## Qualification

| Gate | Result |
| --- | --- |
| Focused Strategic Status characterization | **PASS — 26/26** |
| Strategic Status boundary/facade/loader contract | **PASS — 27/27** |
| Existing AI Pressure characterization | **PASS — 14/14** |
| Existing AI Pressure boundary contract | **PASS — 26/26** |
| Historical F9T0 compatibility smoke | **PASS — 38/38** |
| Complete Node smoke suite | **PASS — 137/137** |
| Complete executable Python/browser suite | **PASS — 69/69** |
| JavaScript syntax | **PASS — 245/245** |
| `git diff --check` | **PASS** |

The complete browser suite was repeated because the production runtime and `index.html` changed. All 69 scripts passed and the five deterministic Golden Matches retained their frozen hashes.

No gameplay, AI choice, scoring weight, balance value, state schema, content, persistence payload or build metadata changed. The loader gained only the new classic service script immediately before `src/ai.js`.

## Review stop

The read-only status-composition seam is now extracted. This result does not authorize moving finalization memory, garrison planning, movement scoring, faction doctrine, action selection or the Expert runtime in the same patch.
