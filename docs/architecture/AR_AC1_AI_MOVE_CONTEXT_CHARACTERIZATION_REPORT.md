# AR-AC1 — Advanced AI Move Context Characterization

Date: 2026-09-06  
Scope: pre/post-extraction characterization of Advanced F9T0 movement-context construction.  
Result: **PASS — 47/47 deterministic assertions before and after extraction**

## Candidate slice

The slice is limited to `botCreateAdvancedMoveContextF9T0(unit, options, status)`.

It gathers the common battlefield snapshot, faction-specific targets and one feature vector per candidate coordinate. It does not aggregate a final score, break ties, choose a coordinate or execute movement.

## Frozen behaviour

`tests/ar_ac1_ai_move_context_characterization_smoke.js` covers:

- player/enemy identity and `hasPS` derived from the supplied Strategic Status;
- preservation of unit, status, option-coordinate and PS-coordinate references;
- controlled and uncontrolled PS projections;
- guard, commander, allied-unit and enemy-unit reads;
- mutually exclusive Nexus, Agathoi, Exordium, Liberti and Fabeot routing;
- Exordium front selection only when fronts exist;
- exact candidate ordering, cells, HQ distances and nearby-unit counts;
- exact home, emergency, general-doctrine, faction-doctrine, Mission, C2E3 and stall feature values;
- one call per candidate for every feature collaborator;
- zero Mission score when its optional provider is unavailable;
- no mutation of state, unit, status or options.

## Dependency surface

The context builder has a broad but read-only query surface. All cell, unit, HQ, faction-target and feature reads now enter through named late-bound ports. The `includeFaction:false` and `includeDoctrine/includeGate:false` compatibility flags remain in the facade callbacks where their legacy scorers are invoked.

## Qualification

| Gate | Result |
| --- | --- |
| Focused characterization before extraction | **PASS — 47/47** |
| Pre-extraction complete Node suite | **PASS — 144/144** |
| Pre-extraction JavaScript syntax | **PASS — 255/255** |
| Focused characterization after extraction | **PASS — 47/47** |
| Boundary/facade/loader contract | **PASS — 58/58** |
| Historical F9T0 compatibility smoke | **PASS — 38/38** |
| Complete Node suite | **PASS — 145/145** |
| Complete executable Python/browser suite | **PASS — 69/69** |
| JavaScript syntax | **PASS — 257/257** |
| `git diff --check` | **PASS** |

Manifest, map-corpus and Golden Match hashes remained unchanged.

## Extraction constraint

Only feature-context construction moved in this boundary. Deterministic aggregation and selection were subsequently extracted into `src/ai/move_selection.js`; `botFactionMoveBaseScoreF9T0`, faction doctrines and movement execution remain in `src/ai.js`.
