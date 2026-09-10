# S2-C5b4 — Frozen-content presentation seam, tranche 1

Date: 2026-09-08  
Result: **PASS**

## Delivered scope

- A presentation-only content adapter resolves localized fields without writing to frozen maps, terrain definitions or card catalogs.
- All 10 official `KEEP` maps have Italian and English presentation names/descriptions.
- All 5 terrain types have Italian and English presentation names/descriptions.
- Unit type, weight and mission-class taxonomy labels have Italian and English projections.
- Setup map selectors/headings and battlefield terrain labels use the adapter.
- Unknown or not-yet-translated content falls back to its authoritative authored value without producing false missing-key diagnostics.

## Frozen-data guarantee

`src/i18n/content.js` creates localized views at render time. IDs, data objects, rules and catalog files are not mutated. The Starter 1.0 canonical hash remains:

`eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`

## Files changed and why

- `src/i18n/content.js`: content-key projection and safe fallback adapter.
- `src/i18n/runtime.js`: read-only `has(key)` capability used to distinguish optional content coverage.
- `index.html`: loads the adapter before game data owners consume it.
- `locales/it.json`, `locales/en.json`: map, terrain and taxonomy presentation entries.
- `src/app.js`: localized official-map options and Setup heading.
- `src/render.js`: localized terrain marker names.
- `tools/check_content_locales.js`: frozen-presentation completeness gate for this tranche.
- `.github/workflows/pages.yml`: CI executes the new content-locale gate.
- `tests/s2_c5b4_content_i18n_smoke.js`: adapter, fallback, projection and frozen-hash contract.

## Verification

| Gate | Result |
| --- | --- |
| Frozen presentation locale gate | **PASS — 10 KEEP maps, 5 terrains, 41 fields × 2** |
| Content adapter smoke | **PASS — 11/11** |
| Starter 1.0 manifest | **PASS — canonical hash unchanged** |
| Required assets | **PASS — 7/7** |
| DEV and Distribution staged composition | **PASS** |
| Distribution contains `locales/en.json` and `src/i18n/content.js` | **PASS** |
| Full Node behavior suite | **PASS — 174/174** |

## Regressions and residual risk

No frozen catalog entry changed and no functional regression is known.

This is explicitly the first frozen-content tranche, not the completion of every content string. S2-C5b4b subsequently localized all 115 unit names. Unit descriptions/ability text, 80 tactic/card texts and 15 mission texts still fall back to their authored Italian values until later localization tranches populate their external presentation keys.

