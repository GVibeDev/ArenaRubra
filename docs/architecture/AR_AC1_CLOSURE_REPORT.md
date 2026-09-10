# AR-AC1 — Closure report

Date: 2026-09-07  
Release target: Arena Rubra Starter 1.0 — Desktop / Web  
Comparison anchor: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Frozen catalog hash: `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`  
Result: **PASS — all 15 AR-AC1 acceptance criteria are locally satisfied.**

## Acceptance matrix

| # | Criterion | Result | Primary evidence |
| ---: | --- | --- | --- |
| 1 | GameCore initializes without DOM | **PASS** | `src/core/game_core.js`; headless 2P/3P/4P initialization with a throwing `document` proxy |
| 2 | Main rules are testable in Node | **PASS** | DOM-free action service, explicit legacy ports, rule-boundary audit and behavior tests |
| 3 | `ui.js` no longer owns Match Data/persistence core | **PASS** | MatchRecord build/migration/export lives in `src/data/match_data.js`; boundary and browser persistence tests |
| 4 | Advanced AI is divided by major domains | **PASS** | Ten `src/ai/*.js` owners covering thirteen bounded/characterized slices, including movement and combat execution |
| 5 | New modules declare dependencies | **PASS** | Factory/service arguments and explicit port objects in Core, map, rule, Match Data and AI boundaries |
| 6 | Runtime is not exclusively global-order driven | **PASS** | GameCore/action service and state projections compose explicit dependencies; legacy globals remain only behind compatibility ports |
| 7 | Principal CSS has ownership boundaries | **PASS** | Desktop inspector geometry moved to `css/layout/game_inspector.css`; ownership documented and contract-tested |
| 8 | DEV and Distribution loading differ | **PASS** | Boot-time profile loader plus deterministic staging; Distribution excludes twelve DEV/Expert modules from requests and package files |
| 9 | Core systems have behavior tests | **PASS** | Mandatory domain inventory plus complete 168-test Node gate |
| 10 | Golden Matches exist | **PASS** | Five fixed-seed 2P/3P/4P Advanced AI matches, each repeated twice against frozen v2 hashes |
| 11 | GitHub Actions blocks deploy on gate failure | **PASS** | Syntax, frozen content, assets, Node, browser, both staging profiles and staged Distribution boot precede artifact upload |
| 12 | No intentional gameplay/rules/balance/content change | **PASS** | Catalog hash unchanged; Golden authoritative projections deterministic; changes are seams, adapters, loaders, tests and UI ownership |
| 13 | Storage/MatchRecord compatibility is preserved | **PASS** | Existing schema and serialized state retained; legacy migration and 4P browser persistence green |
| 14 | Starter content/assets are retained | **PASS** | Deterministic content manifest and seven hashed required assets; missing-required negative test fails as designed |
| 15 | Player/DEV browser integration passes | **PASS** | Complete 69-test browser suite plus source and staged Distribution module-exclusion boots |

The machine-readable mapping is `data/ar_ac1_acceptance_manifest.json`, enforced by `tests/ar_ac1_acceptance_contract_smoke.js`.

## Structural outcome

- `src/ui.js` decreased from 195,164 to 104,734 bytes; Match Data/persistence ownership moved out of the UI bundle.
- `src/ai.js` is backed by ten domain modules: perception, status, maturity, garrison planning, movement context/scoring/selection/execution, finalization memory and combat/action execution.
- `src/core/` now contains four DOM-free or port-based modules: state domains, action service, headless game creation and legacy runtime composition.
- Map catalog, validation, normalization, pathfinding, persistence and state queries have named boundaries with characterization tests.
- Pressure/victory and victory/lifecycle have named rule owners behind compatibility facades.
- Desktop inspector geometry has a single CSS owner; Mobile M4 and the remaining compatibility bundle stay explicitly assigned to `css/style.css`.
- DEV retains editors, calibration labs and Expert AI. Distribution neither requests nor packages those twelve modules.

This is a compatibility extraction, not a full ESM rewrite. The legacy classic-script runtime and authoritative global `state` remain supported; new services reduce exclusive reliance on that order without forcing a risky all-at-once migration.

## Final gates

| Gate | Result |
| --- | --- |
| JavaScript syntax | **PASS 297/297** |
| Python syntax | **PASS 73/73** |
| Starter 1.0 deterministic manifest | **PASS**, frozen hash unchanged |
| Required asset integrity | **PASS 7/7** |
| Node smoke/behavior suite | **PASS 168/168** |
| Python/browser suite | **PASS 69/69** |
| Golden repeat/frozen snapshot gate | **PASS 5/5**, two identical runs each |
| DEV staged composition | **PASS** |
| Distribution staged composition | **PASS**, twelve DEV files excluded |
| Staged Distribution browser boot | **PASS**, zero DEV module requests and zero page errors |
| Diff whitespace check | **PASS**; line-ending notices only |

## Golden projection correction

The final oracle is `AR-AC1-GOLDEN-2`. It excludes the `LOG_MESSAGE` event count because that diagnostic copy can differ by one during one-time browser initialization while all authoritative state, RNG, economy, combat, cards and lifecycle fields remain identical. No gameplay value was removed from the projection. All five v2 projections were run twice identically before their hashes were frozen.

## Residual risks and scope boundary

- GitHub Actions has been validated structurally and every command has passed locally; the remote hosted workflow has not been run from this uncommitted working tree.
- The large legacy `ai.js`, `style.css` and global-state compatibility surface still exists. AR-AC1 establishes tested seams; further decomposition belongs to later roadmap items.
- This closure does not claim release-candidate sign-off, device-matrix certification, deployment or publication. No commit, push or deploy was performed.
