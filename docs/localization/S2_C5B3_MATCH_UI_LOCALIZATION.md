# S2-C5b3 — Match HUD, Inspector and Result Modal localization

Date: 2026-09-08  
Result: **PASS**

## Delivered scope

- The compact match HUD, contextual action state, camera controls, quick Hand/action docks and selected-unit shell now read the active locale.
- Generated HUD copy is localized for deployment, construction, tactic targeting, ability targeting, movement, selected units, human/bot control, Pressure and card counts.
- The selected-unit Inspector localizes its empty state, statistics/ability labels, availability reasons and action buttons.
- The presentation seam is used for unit/tactic/ability names where a localized content entry exists, while the authoritative runtime object remains unchanged.
- Match victory, defeat and draw results localize their title, winner identity, reason, round, navigation and analysis actions.
- A language change rerenders the live match owner instead of leaving generated copy in the previous language.

## Files changed and why

- `index.html`: declarative bindings for match HUD, map controls, board accessibility and Inspector shell.
- `locales/it.json`, `locales/en.json`: canonical `game` and `result` dictionaries.
- `src/game_screen.js`: localized generated HUD/status copy.
- `src/render.js`: localized selected-unit rendering and content-name projection.
- `src/tutorial_runtime.js`: localized unified Result Modal, which owns terminal match results.
- `src/app.js`: live match refresh on `arena:languagechange`.
- `tools/check_locales.js`: runtime-owner reference scanning includes the match renderers.
- `tests/s2_c5b3_match_i18n_contract_smoke.js`: match localization contract.
- `tests/s2_c5b3_b5_browser_match_guidance_i18n_smoke.py`: real-browser match/result validation shared with S2-C5b5.
- `tests/f9u1b_unit_inspector_ps_unit_bars_smoke.js`: historical source contract updated to require the presentation projection.

## Verification

| Gate | Result |
| --- | --- |
| Locale parity/placeholders/runtime references | **PASS — 431 keys × 2 languages; 309 runtime bindings** |
| Match localization contract | **PASS — 18/18** |
| Match/guidance browser localization | **PASS — 29/29** |
| Historical Inspector browser smoke | **PASS — desktop and mobile** |
| Unified Result Modal browser smoke | **PASS** |
| Full Node behavior suite | **PASS — 174/174** |
| JavaScript syntax | **PASS — 309/309** |
| Python syntax | **PASS — 75/75** |

## Regressions and residual risk

No gameplay, rules, balance, AI, telemetry or storage schema changed. No functional regression is known.

The DEV/debug docks below the primary battlefield retain authored Italian copy and are not claimed by this player-facing HUD/Inspector/Result increment. Full browser-suite execution was not repeated; the new browser smoke and the directly affected historical browser smokes were run.

