# S2-C5b2 — Browser runtime, language persistence, Main Menu and Setup

Date: 2026-09-07  
Result: **PASS**

## Delivered scope

- `src/i18n/runtime.js` loads the canonical `it` and `en` JSON dictionaries, binds translated text and accessibility attributes, updates `<html lang>` and exposes the runtime translation API.
- The language selector is visible in the Main Menu and persists its choice inside the existing settings document at `settings.localization.language`; unrelated settings are preserved.
- Italian remains the authored HTML fallback. If locale loading is unavailable, the application still boots with usable Italian copy.
- Splash, Main Menu, system status summaries and the static/dynamic Setup shell are localized in English.
- Profile-sensitive DEV/Distribution descriptions and summaries remain profile-sensitive after a language switch.
- Dynamic Main Menu and Setup copy is translated at its owner rather than being overwritten by static DOM bindings.
- The Distribution staging path includes `locales/`, the browser adapter and the language-picker stylesheet.

## Runtime contract

The DOM adapter supports:

- `data-i18n` for text;
- `data-i18n-aria-label`, `data-i18n-title` and `data-i18n-placeholder` for attributes;
- JSON parameters in `data-i18n-params`;
- `ArenaI18n.t(key, params, fallback)` for generated copy;
- `ArenaI18n.setLanguage(language)` and the `arena:languagechange` event for owner refreshes.

The locale gate now checks both dictionary parity and every key referenced by the localized DOM and current runtime owners.

## Verification

| Gate | Result |
| --- | --- |
| Locale parity/placeholders/runtime references | **PASS — 188 keys × 2 languages; 164 runtime bindings** |
| S2-C5b1 locale core/parity tests | **PASS — 12/12 and 7/7** |
| S2-C5b2 source/runtime contract | **PASS — 15/15** |
| S2-C5b2 full-browser language/persistence/layout smoke | **PASS — 25/25** |
| JavaScript syntax | **PASS — 304/304** |
| Python syntax | **PASS — 74/74** |
| Starter 1.0 frozen manifest | **PASS — hash unchanged** |
| Required assets | **PASS — 7/7** |
| Node suite | **PASS — 171/171** |
| DEV and Distribution staging composition | **PASS** |

The browser smoke validates default Italian, switching to English, generated Main Menu and Setup copy, accessibility bindings, absence of raw key IDs/placeholders in the critical shell, persistence after reload, switching back to Italian and horizontal wrapping at desktop and narrow viewport widths.

## Scope boundary

This step does not claim complete product localization. Tutorial lessons/challenges, Control Center panel bodies, gameplay HUD/dialogs, Deck Builder/Card Pool, history/statistics, help/about and frozen card/unit/tactic/mission/map/terrain content remain subsequent S2-C5b increments.

No gameplay, rules, AI, balance, frozen content, storage schema or telemetry schema was changed.
