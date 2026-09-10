# S2-C5b5 — Tutorial and Challenge shell/result guidance localization

Date: 2026-09-08  
Result: **PASS**

## Delivered scope

- The Academy screen title, introduction, accessibility label and persistent actions are localized.
- All five lesson cards localize title and summary.
- All five Field-test cards localize title, subtitle, summary, progression and objective.
- Progress dots, availability/completion state, unlock gate, action buttons and Academy status copy are generated in the active language.
- IT→EN and EN→IT switches rebuild the runtime-owned cards without reloading the page.
- Lesson completion and Field-test success/failure modals localize their heading, subject, explanation and next/retry action.
- Italian continues to return the original frozen lesson/challenge plan objects; English receives a presentation-only projected copy.

## Files changed and why

- `index.html`: declarative Academy shell bindings.
- `locales/it.json`, `locales/en.json`: Tutorial/Challenge shell, result guidance and the 5+5 plan-card dictionaries.
- `src/tutorial_runtime.js`: localized plan projection, progress/gate/cards/actions/status and terminal result copy.
- `src/app.js`: Tutorial owner rerender on `arena:languagechange`.
- `tests/s2_c5b5_guidance_i18n_contract_smoke.js`: plan coverage and frozen-source contract.
- `tests/s2_c5b3_b5_browser_match_guidance_i18n_smoke.py`: live language-switch and modal browser contract.
- `tests/f9o7a_lesson1_exordium_smoke.js`: historical result assertion updated to require the localized fallback contract.

## Verification

| Gate | Result |
| --- | --- |
| Tutorial/Challenge localization contract | **PASS — 42/42** |
| Match/guidance browser localization | **PASS — 29/29** |
| Existing localized shell/setup browser smoke | **PASS — 25/25** |
| Existing Challenge unlock browser smoke | **PASS** |
| Existing Lesson 1 browser smoke | **PASS — 30 steps completed** |
| Existing Result Modal browser smoke | **PASS** |
| Full Node behavior suite | **PASS — 174/174** |
| Locale parity/placeholders/runtime references | **PASS — 431 keys × 2 languages; 309 runtime bindings** |

## Regressions and residual risk

No tutorial objective, unlock rule, scenario command, checkpoint or authoritative scenario data changed. No functional regression is known.

This increment localizes the Academy/Challenge selection and result-guidance layer. The detailed narrative dialogs and step-by-step instructional sentences inside the five playable lessons remain authored in Italian and require a later scenario-narrative tranche. The full 75-test Python/browser suite was not rerun; six directly affected browser smokes were run, and all behavioral assertions passed (one Windows console-encoding-only print failure was rerun successfully with UTF-8 output).

