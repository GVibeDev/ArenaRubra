# S2-C5b1 — I18n foundation and scope inventory

Status: **PASS — foundation complete; no player surface translated yet.**

## Boundary

This first localization step establishes the contract before modifying visible copy:

- canonical JSON dictionaries at `locales/it.json` and `locales/en.json`;
- a DOM-free `ArenaI18nCore` with explicit persistence/rendering ports;
- normalized `it`/`en` language selection, interpolation and Italian fallback;
- strict key parity, non-empty value and placeholder parity gates;
- a deterministic heuristic inventory command for prioritizing source surfaces.

It deliberately does not modify `index.html`, runtime language, frozen unit/tactic/mission/map content or layout. The next step will integrate the service and persisted selector into Main Menu and Setup as the first visible vertical slice.

## Inventory snapshot

`node tools/inventory_i18n.js` currently reports the following heuristic candidate-line counts. They are prioritization signals, not final translation-key totals; scopes overlap where a source serves more than one surface.

| Scope | Candidate lines |
| --- | ---: |
| Shell (`index.html`, app, Control Center, UI) | 357 |
| Setup | 233 |
| Gameplay feedback/rules | 123 |
| Frozen content | 351 |
| Tutorial/Challenge | 294 |
| Player tools/data views | 167 |

The largest single hotspots are `index.html` (226), `data/tutorial_scenarios.js` (208), `data/tactics_cards_c2.js` (188), `src/deck_builder.js` (110) and `data/units_base.js` (106). This supports a surface-by-surface migration rather than a repository-wide string replacement.

## Planned slices

1. **Foundation** — dictionaries, service, parity and inventory gates (this step).
2. **Shell** — splash, Main Menu, language selector and Setup; persistent choice.
3. **Match UI** — HUD, inspector, action panels and Result Modal.
4. **Frozen content** — units, tactics, missions, maps and terrain labels without changing IDs or rules.
5. **Guidance** — Tutorial, Challenges, narrative dialogs and player-facing errors.
6. **Player tools and closure** — Deck Builder, Card Pool, history/statistics, settings/about plus English wrapping/browser gate.

## Invariants

- IDs, save schemas, MatchRecord fields, telemetry event types and rule tokens are never translated.
- Italian remains the fallback and existing default until the persisted runtime integration lands.
- Localization data is presentation-only; frozen catalog hashes and Golden Matches must remain unchanged.
- DEV-only diagnostic copy is lower priority than every Player-facing surface.

## Commands

- `node tools/check_locales.js`
- `node tools/inventory_i18n.js`
- `node tests/s2_c5b1_i18n_core_smoke.js`
- `node tests/s2_c5b1_locale_parity_smoke.js`
