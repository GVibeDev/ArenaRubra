# AR-AC1 — Advanced AI Pressure Perception Characterization

Date: 2026-09-05  
Scope: pre-extraction characterization retained as the post-extraction regression oracle.  
Result: **PASS — 14/14 deterministic assertions before and after extraction**

## Candidate slice

The first Advanced AI extraction candidate was deliberately limited to three read-only functions originally located together in `src/ai.js`:

- `botTotalPsCount`;
- `botPressureProfileF9T0`;
- `botControlsCentralF9T0`.

The characterized logic now resides in `src/ai/pressure_perception.js`; the same three names remain thin facades in `src/ai.js`. This slice translates the canonical Pressure rules facade into the smaller profile consumed by Advanced/Expert AI. It is not `strategicStatus`, scoring, movement selection, action execution or AI memory.

## Characterized inputs and outputs

`tests/ar_ac1_ai_pressure_perception_characterization_smoke.js` freezes:

- PS counting from live map cells and the historical three-PS missing-state fallback;
- exact projection of `totalPs`, `requiredPs`, `centralCoord`, `startRound`, `pressureWin` and `maxRound` from `pressureRuleProfile`;
- omission of unrelated canonical fields such as `scale`;
- defensive cloning of the central coordinate;
- fallback calculation when canonical fields are zero or unavailable;
- complete operation when the Rules facade itself is absent;
- delegation to `playerControlsCentralStrategicPoint` when available;
- center-cell ownership fallback when it is unavailable;
- safe false result for maps without a central PS cell;
- state-read-only behaviour and absence of DOM/storage dependencies in the candidate source span.

## Dependency boundary

The candidate can be represented with explicit read ports for:

- current state/cells;
- canonical Pressure profile;
- semantic central-cell lookup;
- canonical central-ownership query;
- pace fallbacks for start, win and maximum round.

No telemetry, RNG, action execution, unit mutation, renderer, DOM or persistence port is required.

## Qualification

| Gate | Result |
| --- | --- |
| Focused AI pressure-perception characterization | **PASS — 14/14** |
| Boundary/loader/facade/late-binding contract | **PASS — 26/26** |
| Complete Node smoke suite | **PASS — 135/135** |
| Complete executable Python/browser suite | **PASS — 69/69** |
| JavaScript syntax | **PASS — 242/242** |
| `git diff --check` | **PASS** |

The production extraction is qualified by the complete browser suite and five deterministic Golden Matches. The oracle still passes against the service plus compatibility facade, and the contract separately proves that Rules queries remain late-bound even when the service singleton is constructed first.

## Extraction result and continuing constraint

Only these three helpers moved behind a frozen read-only service, while retaining their existing global names as facades. `ensureAiFinalizationMemoryF9T0`, `strategicStatus`, faction maturity, garrison planning, scoring and action code remain in `src/ai.js` and require independent characterization before any later extraction.

No gameplay, AI choice, balance value, state schema, content catalog or build metadata changed.
