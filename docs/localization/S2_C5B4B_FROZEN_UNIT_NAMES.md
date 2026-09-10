# S2-C5b4b — Frozen unit-name localization

Date: 2026-09-08  
Result: **PASS**

## Delivered scope

- All 115 `KEEP` unit blueprints now have canonical Italian and English presentation names.
- Italian names are checked byte-for-byte against the frozen manifest, preventing the localization layer from silently renaming authoritative content.
- Unit-card IDs such as `UNIT:NX2B01` resolve through `blueprintId`/`sourceId`, while runtime units continue to resolve through their blueprint ID.
- The selected-unit HUD/Inspector, Hand thumbnails, map Hand fallback cards and canvas card renderer consume localized unit names.
- Card objects are cloned for presentation. Their ID, source name, statistics and runtime identity remain unchanged.
- Renderer signatures and thumbnail cache keys include the active language/localized name, preventing an Italian bitmap from being restored after switching to English.
- Unit translations live in locale fragments (`locales/content/units.*.json`) loaded and deep-merged by the browser runtime. This keeps the base UI dictionary reviewable and provides the structure for later tactics and mission fragments.

## Files changed and why

- `locales/content/units.it.json`: 115 authoritative Italian unit names.
- `locales/content/units.en.json`: 115 English presentation names.
- `src/i18n/runtime.js`: deterministic loading and deep merge of locale fragments.
- `src/i18n/content.js`: source-ID resolution and immutable card projection.
- `src/game_screen.js`: correct blueprint-first name lookup for cards and units.
- `src/render.js`: localized Hand/fallback names plus language-sensitive render signatures.
- `src/card_renderer.js`: localized canvas projection and language-safe thumbnail caching.
- `tools/check_content_locales.js`: requires every `KEEP` unit name in both languages.
- `tests/s2_c5b4b_unit_names_i18n_smoke.js`: manifest parity, immutability, resolver, rendering and gate contract.
- `tests/s2_c5b3_b5_browser_match_guidance_i18n_smoke.py`: browser projection and real canvas text validation.

## Verification

| Gate | Result |
| --- | --- |
| Frozen presentation locale gate | **PASS — 115 KEEP units, 10 KEEP maps, 5 terrains; 156 fields × 2** |
| Unit-name localization contract | **PASS — 246/246** |
| Browser localization/canvas smoke | **PASS — 34/34** |
| Full Node behavior suite | **PASS — 175/175** |
| JavaScript syntax | **PASS — 310/310** |
| Starter 1.0 manifest | **PASS — canonical hash unchanged** |
| Required assets | **PASS — 7/7** |
| Distribution staging and nested locale fragment | **PASS** |

## Regressions and residual risk

No frozen unit object, gameplay rule, save field, MatchRecord field, telemetry value or AI decision input changed. No functional regression is known.

This tranche covers unit names only. Unit descriptions, passive/active ability names and rules text remain authored in Italian; translating those safely is the next frozen-unit content tranche. Proper nouns and setting-specific transliterations intentionally remain unchanged where an English replacement would alter established identity.

