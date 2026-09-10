# S2-C5b — Internationalization & Full English Localization

Status: **PASS**  
Date: 2026-09-09  
Scope: Player/Distribution runtime, Italian and English in one persistent runtime.

## Outcome

Arena Rubra now exposes a persistent `it` / `en` language choice through the shared runtime. The Player-facing shell, Setup, HUD, match actions, cards, missions, Tutorial and Field tests, Result Modal, Deck Builder, Card Pool, Player history/statistics, settings, errors, About/version, card-motion feedback, maps, terrain, and frozen Starter content are covered by locale dictionaries.

DEV-only editor, raw telemetry, calibration, debug, and legacy diagnostic copy is not part of the Player localization contract and is excluded from the Distribution profile.

## Frozen content coverage

The presentation locale gate derives its required records from the frozen Starter manifest and current source catalogs:

- 115 KEEP units;
- 80 tactics (70 deck + 10 Starter);
- 15 missions;
- 50 built-in decks;
- 10 KEEP official maps;
- 5 terrain types;
- 701 required frozen-content fields in each language.

Frozen catalog hash after localization:

`eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`

Localization is presentation-only. The frozen catalog hash is unchanged.

## Runtime and fallback rules

- Italian remains the fallback language.
- The selected language is stored through the existing settings storage layer.
- URL `lang` can explicitly override the stored language for that load.
- Missing presentation content falls back to the frozen Italian source without changing source objects.
- Technical tactic metadata is not surfaced untranslated in English card presentation; actionable effect text remains complete.
- Symbolic ability targets use bilingual taxonomy labels.
- Language changes refresh the active screen and dynamic HUD/card/audio/presentation controls.

## Verification

Complete S2-C5b suite:

- `s2_c5b_browser_localization_smoke.js`: 15/15;
- `s2_c5b1_i18n_core_smoke.js`: 12/12;
- `s2_c5b1_locale_parity_smoke.js`: 7/7;
- `s2_c5b2_shell_setup_i18n_contract_smoke.js`: 15/15;
- `s2_c5b3_match_i18n_contract_smoke.js`: 18/18;
- `s2_c5b4_content_i18n_smoke.js`: 11/11;
- `s2_c5b4b_unit_names_i18n_smoke.js`: 246/246;
- `s2_c5b5_guidance_i18n_contract_smoke.js`: 42/42;
- `s2_c5b5b_tutorial_narrative_i18n_smoke.js`: 24/24;
- locale parity/missing-key gate: PASS, 2,381 keys × 2 languages and 1,097 runtime bindings;
- frozen presentation locale gate: PASS, 701 fields × 2;
- Starter manifest reproduction: PASS, hash unchanged.

The browser smoke ran against the Distribution profile with installed Chrome at 1440×900. It verified English startup, translated Setup, localized commander archetypes, DEV-control exclusion, no document-level horizontal overflow, live IT/EN switching, and persistence across reload.

## Files and rationale

Primary runtime seams:

- `src/i18n/core.js`, `src/i18n/runtime.js`, `src/i18n/content.js`, `src/i18n/tutorial.js`: locale service and non-mutating content projection;
- `locales/it.json`, `locales/en.json`, `locales/content/*`, `locales/ui/*`: paired dictionaries and frozen-content fragments;
- Player UI modules under `src/`: dynamic localization at render time;
- `tools/check_locales.js`, `tools/check_content_locales.js`: parity, binding, and frozen-content gates;
- `tests/s2_c5b*.js`: static, behavior, and real-browser acceptance coverage.

## Regressions and residual risk

No gameplay, AI, balance, catalog, map, deck, mission, victory, or storage schema change was introduced by C5b. Existing targeted match, mission, Tutorial/Challenge, HUD, and audio tests remained green during implementation.

Residual risk is limited to DEV-only Italian diagnostic copy, which is intentionally outside the Player/Distribution localization scope. Responsive geometry beyond the browser acceptance viewport is covered again by the following S2-C6 Visual Asset & Presentation Gate.
