# AR-AC1 — Advanced AI Faction Maturity Boundary Report

Date: 2026-09-06  
Baseline: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS**

## Extracted boundary

Nexus Network and Agathoi Green Line maturity now have one canonical owner in `src/ai/faction_maturity.js`.

The factory `createAiFactionMaturityService()` exposes exactly two operations through a frozen API:

- `botNexusNetworkMaturityF9T0(player, profile)`;
- `botAgathoiGreenLineMaturityF9T0(player, profile)`.

Both operations are deterministic read-only projections. They derive controlled-PS, structure, coverage, mobile-force and target-PS counts without selecting or executing an action.

## Preserved faction semantics

The wrong-faction guard still returns the exact historical neutral shape and short-circuits before combat queries. The target remains `ceil(requiredPs / 2)`, bounded to `[1, requiredPs - 1]`, and two structures remain required from `requiredPs >= 3`.

Nexus coverage still accepts a Nexus structure within distance 1 or two allied combat units within distance 1, and maturity still requires at least three mobile non-structure/non-QG units. Agathoi coverage still accepts an Agathoi structure within distance 2 or two nearby allies, while `forwardReady` still requires two mobile units that are not garrisoning a controlled PS.

## Legacy compatibility

`src/ai.js` retains both historical global helpers as thin facades. Their default argument remains `botPressureProfileF9T0()`, evaluated at facade call time. A lazy singleton wires the service to named read ports, so later loading of game state and gameplay helpers remains valid.

Strategic Status continues to invoke the same helper names in the same order. No caller, result field or default-profile contract changed.

## Explicit ports and exclusions

The service receives ports for faction checks, controlled PS cells, combat units, Agathoi structures, hex distance, nearby allies and PS-garrison checks.

It contains no DOM, browser storage, IndexedDB, direct `window`, global `state`, telemetry, RNG, scoring, memory update, garrison planning, doctrine choice or action execution. It does not mutate input arrays, units, cells or profiles.

## Loading

`index.html` loads the classic scripts in this order:

```text
src/ai/pressure_perception.js
  -> src/ai/faction_maturity.js
  -> src/ai/strategic_status.js
  -> src/ai.js
```

The current runtime therefore has 107 ordered classic scripts. Construction performs no game-state read; all injected callbacks resolve their legacy dependencies only when an operation is invoked.

## Verification

| Gate | Result |
| --- | --- |
| Faction-maturity pre/post characterization | **PASS — 26/26** |
| Boundary/facade/loader contract | **PASS — 25/25** |
| Historical F9T0 compatibility smoke | **PASS — 38/38** |
| Strategic Status characterization | **PASS — 26/26** |
| Strategic Status boundary contract | **PASS — 27/27** |
| Complete Node smoke suite | **PASS — 139/139** |
| Complete executable Python/browser suite | **PASS — 69/69 in 529.6 seconds** |
| JavaScript syntax | **PASS — 248/248** |
| Starter 1.0 semantic manifest | **PASS — `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`** |
| Map characterization hashes | **PASS — all five unchanged** |
| Golden Match hashes | **PASS — all five unchanged and deterministic** |
| `git diff --check` | **PASS** |

The browser gate used Python UTF-8 mode, Playwright 1.62.0 and system Chrome. The temporary dependency directory, generated Python 3.12 bytecode and regenerated test screenshots were removed or restored afterward.

## Preserved outputs

The five Golden Matches retain their frozen hashes:

- `GOLDEN-001`: `07b533c8bf5fa42687ec7b617852995a325e352428f37c10156205a5a94031d6`;
- `GOLDEN-002`: `24a4a01759db83a561ffd79a9943eac3cf8828e19531fd3ff8f522b7c755e2f5`;
- `GOLDEN-003`: `11d215c48edd022bcc9a8bd8d4fc1c120017ec70b2e9c8f339adf7695eee1f34`;
- `GOLDEN-004-3P`: `493699236a59069d20f41a185bfcdacb8ed9a32ffb9a3388a34ae7484c88fee8`;
- `GOLDEN-005-4P`: `d899ba0fa2603f44422c5aebcec8206afd46907e8c32a5050b908e8907aa8ab5`.

No AI decision, mode precedence, scoring weight, gameplay rule, state schema, persistence payload, catalog or build metadata changed.

## Rollback

Rollback is mechanical and migration-free: restore the two characterized implementations inside `src/ai.js`, remove the service script and loader entry, restore direct-source harness routing, and rerun the same characterization, Node, browser, manifest and hash gates.

## Review stop

This maturity seam is green and reversible. Finalization memory, garrison planning, scoring, movement, purchasing, tactics, action selection, faction doctrine and Expert AI remain outside this boundary and require independent characterization.
