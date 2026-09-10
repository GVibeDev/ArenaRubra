# S2-C6 — Visual Asset & Presentation Gate

Status: **PASS**  
Date: 2026-09-09  
Target: Arena Rubra Starter 1.0 — Desktop / Web, Distribution profile.

## Asset inventory

`data/required_assets.json` is the deterministic S2-C6 inventory for every file under `assets/`:

| Classification | Files | Bytes | Release treatment |
| --- | ---: | ---: | --- |
| required | 69 | 40,694,403 | Hash/size checked; missing or changed blocks release |
| optional | 340 | 106,075,083 | Runtime enhancement with lower-fidelity fallback |
| dev-only | 17 | 9,278 | Excluded from Distribution staging |
| legacy | 45 | 2,283,110 | Excluded from Distribution staging |
| unused | 1 | 195,915 | Excluded from Distribution staging |
| **Total** | **472** | **149,257,789** | Every asset has exactly one classification |

Required assets include release identity, five frozen map backgrounds, the nine modular slots for each of the five faction skins, fifteen official card frame/back assets, and two missing-art placeholders. Crest and divider remain optional by design.

## Fallback policy

- Card art: official frame plus missing-art placeholder.
- Tokens: dedicated → faction/type/class → faction/class → legacy faction/type → procedural token.
- Optional music aliases: the first canonical candidate exists for every music role.
- SFX samples: synthetic Web Audio fallback is present.
- Optional portrait and visual embellishments: text/CSS fallback remains usable.
- Missing required asset, size drift, hash drift, unclassified asset, duplicate classification, or unknown broken literal reference fails the gate.

Sixteen absent audio paths are explicitly declared secondary candidates. They are not broken terminal references: music resolves to an earlier present candidate, while SFX resolves synthetically.

## Presentation invariants

- Five material skins use one geometry.
- Each faction skin has four corners, four sides, and one material texture.
- Theme code owns color/material only; layout modules retain geometry ownership.
- Crest/divider are not required.
- Ornament pseudo-elements clip themselves and do not set container `overflow:hidden`.
- Main Menu, Setup, Tutorial, Deck Builder, and Card Pool remain within the document width at 1440×900 and 390×844.
- All 69 required assets were fetched in a real Distribution browser and matched manifest byte size.
- Distribution hides debug/telemetry entry points.

## Performance acceptance

A real Chromium run executed the deterministic GOLDEN-005 4-player fixture for 80 bot action turns with normal rendering and the large 4P map:

- total measured action/render workload: 33,126 ms;
- threshold: 60,000 ms;
- maximum individual bot-turn threshold: 5,000 ms;
- final render threshold: 1,500 ms;
- visible log row cap: 300;
- horizontal overflow tolerance: 2 px.

All thresholds passed. Exact time is environment-dependent; the thresholds, fixture, and measurement points are encoded in `tests/s2_c6_browser_visual_gate_smoke.js`.

## Verification

- `tools/generate_visual_asset_inventory.js --check`: PASS;
- `tools/check_required_assets.js`: PASS, 69 required / 472 classified;
- `tools/check_asset_references.js`: PASS, 424 unique literal references;
- `tests/s2_c6_visual_asset_presentation_gate_smoke.js`: 133/133;
- `tests/s2_c6_browser_visual_gate_smoke.js`: PASS;
- theme/material/scroll/ownership regression set: PASS;
- token taxonomy and fallback regression: PASS;
- camera/reachability performance regressions: PASS;
- Distribution/runtime profile contracts: PASS.

## Regressions and residual risk

No gameplay, catalog, balance, map geometry, theme geometry, or storage schema was changed. C6 adds inventory and acceptance gates around existing visual systems.

Optional assets may deliberately fall back to a lower-fidelity representation; this is accepted by policy and does not affect usability. Distribution-stage exclusion of dev-only, legacy, and unused files is enforced again during S2-C7 packaging rather than by the source-tree inventory itself.
