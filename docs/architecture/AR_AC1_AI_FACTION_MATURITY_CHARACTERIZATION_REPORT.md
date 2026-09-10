# AR-AC1 — Advanced AI Faction Maturity Characterization

Date: 2026-09-06  
Scope: pre/post-extraction characterization of Nexus Network and Agathoi Green Line maturity.  
Result: **PASS — 26/26 deterministic assertions before and after extraction**

## Candidate slice

The candidate is deliberately limited to two read-only helpers in `src/ai.js`:

- `botNexusNetworkMaturityF9T0`;
- `botAgathoiGreenLineMaturityF9T0`.

They translate controlled PS, structures, coverage and mobile-force disposition into the maturity summaries consumed by Strategic Status. They do not select actions, assign scores, mutate AI memory or construct a garrison plan.

## Characterized contracts

`tests/ar_ac1_ai_faction_maturity_characterization_smoke.js` freezes:

- the exact neutral result for a player of the wrong faction, including the historical omission of `targetPs`;
- no unit query after the wrong-faction guard;
- proportional `targetPs` values for `requiredPs` 1, 2, 3, 4, 5 and 7;
- the transition from one required structure to two when `requiredPs >= 3`;
- Nexus structure coverage within distance 1;
- Agathoi structure coverage within distance 2;
- coverage supplied by at least two allied combat units within distance 1;
- Nexus maturity requiring at least three mobile non-structure/non-QG units;
- Agathoi maturity requiring at least two mobile units that are not garrisoning a controlled PS;
- exact controlled, structure, covered, mobile and target counts;
- default use of the extracted canonical AI Pressure profile;
- state and Pressure-profile read-only behaviour.

## Dependency surface

The slice requires read ports for:

- faction eligibility;
- controlled PS cells;
- combat units and faction structures;
- coordinate distance and nearby allies;
- PS-garrison status for Agathoi mobile units.

The source span has no DOM, browser storage, IndexedDB, direct `window`, telemetry, RNG or mutation operation.

## Qualification

| Gate | Result |
| --- | --- |
| Focused faction-maturity characterization before extraction | **PASS — 26/26** |
| Focused faction-maturity characterization after extraction | **PASS — 26/26** |
| Faction-maturity boundary contract | **PASS — 25/25** |
| Historical F9T0 compatibility smoke | **PASS — 38/38** |
| Complete Node smoke suite | **PASS — 139/139** |
| Complete executable Python/browser suite | **PASS — 69/69** |
| JavaScript syntax | **PASS — 248/248** |
| `git diff --check` | **PASS** |

The complete browser suite was repeated after step 2 changed the runtime loader. Manifest, map-corpus and Golden Match hashes remained unchanged.

## Extraction constraint

Only these two helpers moved in step 2. Their global names and default Pressure-profile argument remain available. Strategic Status, Pressure perception, finalization memory, garrison planning, doctrine scoring and action code remain outside the new service.
