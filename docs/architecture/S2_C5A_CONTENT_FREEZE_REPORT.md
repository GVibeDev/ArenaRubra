# S2-C5a — Content Freeze Report

Date: 2026-09-01  
Release target: Arena Rubra Starter 1.0 — Desktop / Web  
Comparison anchor: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS — AR-AC1 may begin from the frozen catalog.**

## Outcome

The current runtime catalog is now represented by the deterministic `data/starter_1_0_manifest.json` snapshot. Its SHA-256 catalog hash is:

```text
eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709
```

The generator excludes generation time, sorts object keys before hashing and derives every count from the loaded source catalogs. Built-in deck hashes intentionally exclude only their historical `savedAt` and `build` provenance blocks; deck identity, metadata, category and complete card list remain frozen. Every other content item is hashed from its complete source object. Running the checker after an unreviewed catalog change fails on an exact manifest mismatch.

## Frozen counts and decisions

| Catalog | Count | Decision |
| --- | ---: | --- |
| Units | 115 | 115 `KEEP` |
| Starter tactics | 10 | 10 `KEEP` |
| Deck tactics | 70 | 70 `KEEP` |
| Missions | 15 | 15 `KEEP` |
| Built-in decks | 50 | 50 `KEEP` |
| Active official maps | 10 | 10 `KEEP` |
| Legacy disabled maps | 2 | 2 `REMOVE` |
| **Total** | **272** | **270 `KEEP`, 0 `REDESIGN`, 2 `REMOVE`** |

No current item needs `REDESIGN`: all active content passes its available schema/runtime validation and no contradictory product decision was supplied. Any later `REDESIGN` entry is required by the generator/test contract to carry a reason.

The two `REMOVE` decisions are:

- `map2_triumvirate` / Triumvirato Rubro;
- `map3_quadrivium` / Quadrivio Spezzato.

Both were already disabled by F9R3 because their central strategic point is not equidistant from all headquarters. `REMOVE` is a Starter product/support decision, not an instruction to delete them during AC1: their resolver and serialized-storage compatibility path remains in place. Their manifest policy is `compatibility-only-no-new-assets-or-localization`, and neither currently owns an explicit asset reference.

## Derived distribution

The manifest records the full per-item inventory. Its aggregate code-derived distribution is:

- units per faction: 23 each; role mixes are recorded under `summary.unitsByFactionAndRole`;
- Starter tactics: 2 per faction;
- deck tactics: 14 per faction;
- Missions: 3 per faction, comprising 2 ordinary and 1 desperate;
- built-in decks: 10 per faction, comprising 8 tactical and 2 Mission decks;
- official maps: 3 for 2P, 2 for 3P and 5 for 4P.

## Integrity findings

| Check | Result |
| --- | --- |
| Duplicate IDs, including cross-catalog IDs | **0** |
| Missing unit/tactic/mission/deck references | **0** |
| Missing spawn-blueprint references | **0** |
| Illegal built-in decks | **0** — 50/50 valid |
| Invalid `KEEP` maps | **0** — 10/10 active maps valid |
| Undecided content | **0** |
| `REDESIGN` without reason | **0** |
| Explicit assets referenced by `REMOVE` content | **0** |
| Missing explicit content assets | **0** |

Five explicit map-background references exist. All resolve, and the manifest records their byte length and SHA-256. Convention/fallback-derived card and token assets are intentionally not misrepresented as explicit catalog references; complete required/optional/dev-only/legacy asset classification remains S2-C6.

## Files changed and reasons

- `data/starter_1_0_manifest.json`: deterministic frozen inventory, decisions, findings, asset hashes and catalog hash.
- `tools/generate_starter_1_0_manifest.js`: loads the same classic-script data/runtime layers used by the application, validates decks/maps/references, generates the snapshot and supports `--write`, `--check` and `--print`.
- `tests/starter_1_0_manifest_smoke.js`: exact drift gate, decision coverage, legality/validity checks, reproducible hash assertion and simulated-change proof.
- `docs/architecture/S2_C5A_CONTENT_FREEZE_REPORT.md`: milestone evidence and residual-risk record.
- `docs/architecture/AR_AC1_TEST_COVERAGE_MAP.md`: removed two statements superseded by the completed AR-P0 repair; no coverage claim was expanded.

No gameplay, rule, balance, catalog source, map source, deck source, mission source, asset or runtime behaviour was changed by S2-C5a.

## Tests executed

| Gate | Result | Notes |
| --- | --- | --- |
| Manifest generation | **PASS** | Rebuilt from current source; stable hash shown above |
| Manifest exact check | **PASS** | `node tools/generate_starter_1_0_manifest.js --check` |
| Manifest regression smoke | **PASS** | Includes simulated catalog mutation changing the hash |
| JavaScript syntax | **PASS 210/210** | `src/`, `data/`, `tests/` and `tools/` |
| Complete Node smoke suite | **PASS 114/114** | Includes the new manifest test |
| Targeted browser integration | **PASS 3/3** | Official map/pressure, all 50 official deck setups and Snow BF |
| Diff hygiene | **PASS** | New freeze artifacts have no whitespace errors |

## Regressions explicitly sought

- catalog additions, removals and item payload changes without a reviewed manifest update;
- duplicate IDs within and across the frozen catalogs;
- bad deck card, commander, pivot, Mission and spawn-blueprint references;
- illegal card counts, commander/pivot limits and supplemental Mission setup;
- invalid or disabled maps entering the Starter list;
- missing or changed explicitly referenced map backgrounds;
- accidental new asset support for content classified `REMOVE`.

## Tests not executed / residual risks

- The complete 67-script Playwright suite was not repeated for this data-only freeze; it passed at AR-P0, and the three content-sensitive browser paths were rerun here.
- No physical-device, APK/AAB or Android wrapper validation was performed; those are outside Starter 1.0 Desktop/Web.
- The Snow map remains sourced from a literal in `src/ui.js` and is deliberately extracted by the generator using the same published constant contract. Catalog ownership remains split and is an AC1 risk, not a reason to change map data in this gate.
- Full asset role classification and all convention/fallback-derived token/card references remain S2-C6.
- The no-new-assets/localization rule for `REMOVE` content is enforced for current explicit references and by future snapshot drift review; a later localization system must consume the same decision policy.

## Gate conclusion

S2-C5a is green and reproducible. AR-AC1 may now start, but only as a non-feature refactor against the frozen hash and with characterization before each extraction. The first approved low-risk boundary remains SetupAdapter; no AI, central rules, persistence, CSS decomposition or profile-loader extraction should be bundled into that patch.
