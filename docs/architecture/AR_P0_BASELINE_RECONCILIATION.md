# AR-P0 — Baseline Reconciliation

Audit date: 2026-09-01  
Release target: Arena Rubra Starter 1.0 — Desktop / Web  
Scope: initial audit followed by the owner-authorized technical closure recorded in `AR_P0_CLOSURE_REPORT.md`.

## Gate result

**AR-P0: PASS — technical gate closed.** The entry audit below found a red metadata-coupled Node suite, no Playwright binding and three unavailable external reconciliation documents. Those entry findings are preserved as historical evidence. The test contracts and browser harness were then reconciled, the owner waived the unavailable documents for this gate, and the final result is 113/113 Node plus 67/67 Python/browser scripts green. Full closure evidence is in `AR_P0_CLOSURE_REPORT.md`.

This PASS permits S2-C5a to start. It does not call the current build `VALIDATA`; explicit product/workflow validation is still outstanding.

## Baseline identity

| Field | Observed value | Reconciliation |
| --- | --- | --- |
| Repository | `GVibeDev/ArenaRubra` | Local checkout under `work/ArenaRubra` |
| Current branch | `main` | Tracks `origin/main` |
| HEAD | `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5` | Equals `origin/main` at audit time |
| Working tree at audit entry | clean | `git status --short --branch` returned only `## main...origin/main` |
| Working tree after this execution | five untracked audit documents under `docs/architecture/` | Intentional audit output; no tracked runtime difference |
| Clone form | partial clone, `blob:none`, promisor remote | All 1,381 blobs in the current HEAD tree are locally present; some historical blobs are not |
| Supplemental archive | `ArenaRubra.zip`, 152,180,804 bytes | Supplied after the first audit pass; SHA-256 `29fd218c0b23aa9331d1c495e18066a61e7c82f83a69ac4be8bab2c3d0b3be6d` |
| Archive role | working-folder snapshot without Git metadata | Evidence for local/ignored material; not a replacement Git baseline |
| Build version | `C2-STABLE-1-F9W2d4a-APK-M4c` | Candidate metadata, explicitly “ancora da validare” |
| Build name | `Inspector Position Ownership Hotfix` | UI/layout hotfix, not a logic-baseline promotion |
| Build channel | `starter2-ui-inspector-position-w2d4a` | Candidate channel |
| Logic baseline | `C2-STABLE-1-F9T2c4-APK-M4c` | Remains the declared official logic baseline |
| Default product profile | `dev` | Diverges from the intended public Distribution release profile |

The sole technical comparison anchor for future reviewed patches is:

`REFRACTOR_BASELINE = fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`

“REFRACTOR_BASELINE” means byte-exact refactor comparison anchor. It does **not** mean “Starter 1.0 validated build”. Every future AC1 diff can be compared with `git diff REFRACTOR_BASELINE -- ...`; the current tree objects needed for that comparison are complete locally.

## Source reconciliation

| Source requested by roadmap | Availability | Finding / authority |
| --- | --- | --- |
| Current repository | available | Primary source for current runtime and catalog |
| Supplemental `ArenaRubra.zip` | available | 1,378 files; 1,372 common files compared with the checkout, six ZIP-only ignored files, nine checkout-only hidden/workflow files |
| `Arena_Rubra_Matrice_Starter_2_0_v2.md` | missing | Not found in repository, attachments or Documents/Codex workspace; cannot be silently reconstructed |
| Current Starter rules | missing as an identifiable current canonical document | Historical rules reports exist, including `FASE_B4C_PS_VICTORY_RULES.md`, but none can be promoted without owner confirmation |
| Historical F9M2f statistics register | missing as the named register | F9M2f is referenced by later docs, for example `F9N1_CUSTOM_TACTICS_RUNTIME_FOUNDATION.md`; that reference confirms historical status but is not the register itself |
| `src/build_info.js` | available | Current candidate and logic-baseline metadata source |
| Canonical `data/` files | available | Primary catalog source |
| `tests/` | available | 113 JS, 68 Python and 2 HTML support files |
| `.github/workflows/` | available | One Pages deploy workflow; no behavioural gate |
| Milestone docs | available | Large historical set; useful as evidence, not automatically current truth |

The current code agrees with the roadmap’s newer tracker snapshot: 115 unit blueprints (23 per faction, including two commanders per faction), 70 deck tactics, 10 starter tactics, 15 missions and 50 built-in decks of 30 cards. It therefore supersedes the older quoted F9M2f catalog of 96 units and 59 deck tactics. No Content Freeze decision or manifest was produced in this execution because S2-C5a follows review of P0.

The map data layer contains 11 definitions: nine enabled official maps and two disabled legacy maps (`map2_triumvirate`, `map3_quadrivium`). `src/ui.js` dynamically adds Snow BF, yielding ten enabled official maps in the running UI. That split is a reconciliation risk for the later deterministic Starter manifest.

## Divergence between Git, metadata and validation

1. `HEAD` is a merge after the F9W2d4a candidate commit. It contains a later `ui frame fix` asset state not described by `BUILD_INFO.buildDate` or the candidate notes.
2. `BUILD_INFO.notes` says F9W2d4a is based on the F9W2d4 state published at commit `311a05ca988c4c5343f7b00356c247d3a6fea328` and remains unvalidated. Git history contains the later F9W2d4a commit plus the asset-only follow-up and merge.
3. `README.md` still presents F9T2d3/Commander Deployment wording while `BUILD_INFO` presents F9W2d4a. It does consistently retain F9T2c4 as the official logic baseline and calls the visible build a candidate.
4. Twenty-five historical JS tests require older exact `BUILD_INFO.version`/channel strings. Those tests fail against the current candidate even when their feature code remains present. The tests are version-coupled and cannot be treated as a green regression gate.
5. The product profile defaults to DEV. Distribution currently hides or guards capabilities after all 94 scripts have loaded; it does not yet prove that DEV-only and Expert code is absent from the public runtime.
6. Current milestone documentation includes validated reports for earlier slices but no supplied artifact that formally validates this exact HEAD and current manual asset state.
7. The supplemental ZIP has no `.git/`, omits `.github/workflows/pages.yml` and eight `.idea/` files, and therefore cannot establish branch, commit or workflow state. Those omissions are packaging differences, not evidence that the files should be deleted.
8. Among 1,372 common files, seven text files differ only by CRLF/trailing-newline normalization: `css/style.css`, the F9W2d4a report, `PATCH_FILES.txt`, `PATCH_README.txt`, `src/build_info.js`, `src/ui.js` and the F9W2d4a test. Their normalized content is identical. The runtime loader, canonical data and loaded JavaScript are therefore unchanged by the archive.
9. The ZIP’s substantive text delta is an expanded `.gitignore` that names six ZIP-only artifacts. Five form an incomplete Android Touch & Render candidate and one is an unreferenced map-background source. They are present in the archive while simultaneously declared ignored and are not part of HEAD.

## Main-file SHA-256 snapshot

Hashes are over working-tree bytes at REFRACTOR_BASELINE before audit documents were added. The ZIP’s loaded runtime files match this snapshot semantically; its seven common text-byte differences are line-ending-only as described above.

| File | SHA-256 |
| --- | --- |
| `index.html` | `a7baafb507dc4193b17f0178ebd9b4cc7e27d5d9c8cbb14fe82efbcda05dba85` |
| `css/style.css` | `68ac706f8465dcbc3984850e52b607cf786a7d20f97b1ab1a9bc35328e06e41c` |
| `.github/workflows/pages.yml` | `b34e6e22a23114be02c4c5d2fd21871447a625ab90ef149ff6006a4af57a1dcd` |
| `src/build_info.js` | `f429faed8140ced345ef87f8fe9a752530215c3d4e02b0a8b7de4774f49092eb` |
| `src/data_store.js` | `cc511affa3979ddcd5c267bfdd9ced95b80082b14c09cc8ce352d01cfea6d9fb` |
| `src/storage.js` | `53639c8ea624a6a648f138798c0e08a946fde86120c8c962899f000c603e40d0` |
| `src/state.js` | `a254dd3892b0d5618f822dd7198f4416e41ea37d7c198c2f3907946ad4475fbf` |
| `src/game.js` | `eabb0db673dc5b78c2e6549160f851d41e69b6f5c7eb2114136c8dd2567b8a08` |
| `src/turns.js` | `c72729ca6a7eca8da6e385a6f7da4afa7d84e28d1665867394044f48370d21c1` |
| `src/rules.js` | `abc111a0280326d908f83b7e02f939c21f3c746b17f2039d79c89d906355dbbd` |
| `src/player_lifecycle.js` | `b4f9d4c16d4a18587b2310deafe6644f80b26b84c9fdaa0d5dbc09012f722e1a` |
| `src/economy.js` | `26eab027d299ba518176726cc7eeb1bd533c7f8fab0b81c94574760270c4b506` |
| `src/movement.js` | `04982a97eadcd2d2168de648ad8a9370e4216fac17486b044a2663a71e8dd915` |
| `src/combat.js` | `062c4272ec190e341c53f58200b8603cb944336c2d32cf1282c489ce303adbb4` |
| `src/abilities.js` | `0a72557bd7d912ccae3d625b87ee40c9fdb9c28a45ea7bdfcc8ee80f693a1b33` |
| `src/deployment.js` | `456ab73061ead18f26ee0a863ebdded262eb8db64ba4a479eec8303e70a294c5` |
| `src/cards.js` | `a3be17f4518a7a6dcc3ac126efdd4c7b5b6f0b6fd959b53bdcb912f12c49e52a` |
| `src/deck.js` | `73d0a1c777c54516a82b504191eb16f64598f46bd1e670687aa3501209b6b623` |
| `src/tactics.js` | `4081f798c3209b11a280aea31208bbaf75d6743458cfdf3e2e21c7d6b9a99e00` |
| `src/missions.js` | `6e95ec8a5d0bddbfc66774eba0fccf1dbe3ae68c132b49e612a58d50dbbe7a31` |
| `src/mission_ai.js` | `593d52e4dc31805128b36e86a1cdaf6392d3eb36f0b77508fed5bcd03e60791b` |
| `src/map_runtime.js` | `c11142d4a589abcb8075b2b361de242e14d696c358655e9667ba59c6c5206cd9` |
| `src/ai.js` | `cc8f1a71f76f36c984e15d26bfcfe9f4a2ecfb79a2121384456e00ac6785a0e2` |
| `src/expert_ai/expert_common_strategy.js` | `f83a0aa5cf5364d12245a1da2fa7d74da6d67303e47b51df510e73394afa20a8` |
| `src/expert_ai/expert_exordium.js` | `4110824271d05e5eaa21ec47940bf23835fe3f685eaf298049dfde7a13ab3075` |
| `src/expert_ai/expert_router.js` | `eb32366444eb9526e70249438da9d870c5847c4e0f58884578a5f8dc7a107bd3` |
| `src/expert_ai/expert_runtime.js` | `6143b17151d0a1a602de25dc6ec61145a70b8fc28b7e61260e645bc33cee82a0` |
| `src/render.js` | `1303f4a3e4af69a85fd0f7f537f5f5d89c3371ce49afa6e316781be78134b44d` |
| `src/ui.js` | `98e774faad6292dbeef58202aa81bac941b1f6f1fa3a715cd70b17d69aea9ce9` |
| `data/factions.js` | `bf895688e4a1fab6550192658067d4c7757d879ffa17af329e652aaf0655e07a` |
| `data/units_base.js` | `129f623d3e3633b4077fb9cf946ebf4ce9d8378cf5aea9c21ea8921cf9951a99` |
| `data/tactics_base.js` | `4d1c9570e0baa1e7b5dc0472f8379e09d32e33c83218875827214ed60d3cde4b` |
| `data/tactics_cards_c2.js` | `ec349bf45db6194cee509a1b0c94c0d2fd9ec35e62552e7bb9d79d430fd666f0` |
| `data/missions_base.js` | `8a0fd7bfbfa9fd5882e478bb1a160c91836c3cefd80064ab1fd781784185c95b` |
| `data/builtin_decks.js` | `87de2aeeaee1db794fa6ca45209c6afa121511bdf129b7a18722955d0bf39f2c` |
| `data/map_definitions.js` | `60cf6fd79537e7ca64acf572761ae43434acf6fdd665f984809572bd44dc57c1` |
| `data/official_maps_f9r3.js` | `5ac1a364db7c1541f6815224d06eb3d6cb160e058a719fae30a7979f49cfb309` |
| `data/official_maps_f9s1b1.js` | `32c13c96d3ea09a30187cd0219f16a93a215df431792db7182b7875d1725d032` |
| `data/tutorial_scenarios.js` | `67081730ac4d12ffed3aad044f17f44d35c91ed3d713e28d127e0f46e8f73978` |

## Runtime script order

All 94 entries are synchronous classic scripts. Their order is part of the effective runtime contract; there are no `type="module"` entrypoints.

```text
01 data/maps.js
02 src/build_info.js
03 src/constants.js
04 src/data_store.js
05 src/storage.js
06 src/map_skins.js
07 src/audio_manager.js
08 src/presentation_theme.js
09 src/visual_assets.js
10 src/enums.js
11 src/hex.js
12 src/board_geometry.js
13 data/terrain_registry.js
14 data/official_maps_f9r3.js
15 data/official_maps_f9s1b1.js
16 data/map_definitions.js
17 src/map_runtime.js
18 src/map_backgrounds.js
19 src/events.js
20 src/board.js
21 src/ai.js
22 data/factions.js
23 data/units_base.js
24 data/unit_taxonomy.js
25 data/token_fx_profiles.js
26 data/tactics_base.js
27 data/tactics_cards_c2.js
28 data/missions_base.js
29 data/builtin_decks.js
30 data/cards_base.js
31 data/tutorial_scenarios.js
32 src/state.js
33 src/missions.js
34 src/mission_ui.js
35 src/game_scale.js
36 src/cards.js
37 src/deck.js
38 src/card_assets.js
39 src/card_motion.js
40 src/card_renderer.js
41 src/renderer_calibration_lab.js
42 src/menu_layout_calibration_lab.js
43 src/deck_builder.js
44 src/card_editor.js
45 src/card_pool.js
46 src/map_editor.js
47 src/player_lifecycle.js
48 src/ffa_attribution.js
49 src/rules.js
50 src/player_targeting.js
51 src/economy.js
52 src/statuses.js
53 src/movement.js
54 src/combat.js
55 src/abilities.js
56 src/custom_tactics.js
57 src/tactics.js
58 src/deployment.js
59 src/f9s1_runtime.js
60 src/f9s1b_runtime.js
61 src/mission_rewards.js
62 src/mission_ai.js
63 src/stats.js
64 src/match_telemetry.js
65 src/expert_ai/expert_common_strategy.js
66 src/expert_ai/expert_nexus.js
67 src/expert_ai/expert_exordium.js
68 src/expert_ai/expert_liberti.js
69 src/expert_ai/expert_agathoi.js
70 src/expert_ai/expert_fabeot.js
71 src/expert_ai/expert_router.js
72 src/expert_ai/expert_runtime.js
73 src/render.js
74 src/combat_feedback.js
75 src/token_fx.js
76 src/sfx_manager.js
77 src/event_overlay.js
78 src/tutorial_runtime.js
79 src/main.js
80 src/game.js
81 src/turns.js
82 src/controller.js
83 src/precheck.js
84 src/panel_manager.js
85 src/camera.js
86 src/game_screen.js
87 src/f9u1a_ui.js
88 src/f9u1b_ui.js
89 src/control_center.js
90 src/app.js
91 src/ui.js
92 src/splash.js
93 src/mobile.js
94 src/camera_interaction.js
```

Per-file globals, reads/writes, browser APIs, profile classification and direct tests are in `AR_AC1_GLOBALS_INVENTORY.json`.

## Tests and observed state at audit entry (superseded)

The complete per-file inventory is in `AR_AC1_TEST_COVERAGE_MAP.md`.

| Check | Result | Notes |
| --- | --- | --- |
| JavaScript syntax, `src/`, `data/`, `tests/` | PASS: 207/207 | `node --check` |
| Node smoke files | FAIL: 88/113 PASS, 25/113 FAIL | Executed from repository root; all observed failures stop at historical build-metadata assertions |
| Python source files | 68 present | 66 directly import/reference Playwright; Playwright is not installed |
| Independent Python tone smoke | PASS: 1/1 | F9W2d1 Agathoi mean luminance 0.5496 |
| Python 5×5 aggregate suite | FAIL/ENVIRONMENT | Stops when its first child test cannot import Playwright |
| Browser exploratory startup | PASS with caveats | Menu, setup, ten map options, fifty deck options and a 2P match started; no JS console error; optional/fallback asset candidate 404s observed |
| Golden matches | MISSING | No deterministic GOLDEN-001/002/003 or 3P/4P golden suite |
| ZIP-only test candidates | NOT BASELINE / INCONSISTENT | Two ignored JS files; one expects an Android F9T2a build and script tag absent from the same archive, the other also requires Node Playwright |

Failing Node files:

```text
f9t2c2_bootstrap_forward_pivot_impact_smoke.js
f9t2d_varran_assault_chain_smoke.js
f9t2d3_commander_deployment_commitment_smoke.js
f9u1a_map_hud_layout_foundation_smoke.js
f9u1a1_inspector_hand_header_controls_smoke.js
f9u1b_unit_inspector_ps_unit_bars_smoke.js
f9u2a_card_pool_reorganization_smoke.js
f9u3_control_center_smoke.js
f9v2a_tutorial_challenge_framework_smoke.js
f9v2c_tutorial_challenge2_hold_ps_smoke.js
f9v2d_tutorial_challenge3_hq_breach_smoke.js
f9v2e_tutorial_challenge4_pressure_smoke.js
f9v2f_tutorial_challenge5_final_exam_smoke.js
f9v3a_unified_result_modal_smoke.js
f9v3c_result_flow_tutorial_ux_deck_recovery_smoke.js
f9v4a_strategic_tutorial_content_voice_smoke.js
f9w2a_profile_static_smoke.js
f9w2a1_snow_bf_official_map_smoke.js
f9w2a1_snow_bf_regression_f9w2b.js
f9w2b_menu_theme_smoke.js
f9w2c_global_theme_scope_smoke.js
f9w2d_material_skin_smoke.js
f9w2d1_scroll_agathoi_hotfix_smoke.js
f9w2d2_thin_border_modules_smoke.js
f9w2d4_repo_repair_right_inspector_smoke.js
```

Ninety-nine of 113 JS tests contain source-text `readFileSync` plus `.includes()` checks; 82 also show a VM/runtime execution signal. These categories overlap. Forty-five contain exact build-version metadata coupling. Static contract tests remain useful, but their prevalence and current red status mean they cannot be the sole behavioural gate.

## GitHub Actions

`.github/workflows/pages.yml` has one Pages pipeline triggered by pushes to `main` and manual dispatch:

1. checkout (`actions/checkout@v7`);
2. Pages configuration;
3. copy `index.html`, `assets/`, `css/`, `data/`, `src/` into `_site`;
4. six `test -f` existence checks;
5. artifact upload;
6. deploy.

It runs no JavaScript syntax check, schema validation, content/asset manifest validation, Node behaviour suite, Golden Match, Playwright startup, profile assertion or packaging test. A regression can therefore deploy if the six files exist.

## Manual assets/state to preserve

The post-F9W2d4a `ui frame fix` state is committed in HEAD and must be treated as baseline content, not reverted during AC1. Relative to the F9W2d4a candidate commit it contains:

- `fabeot_vesper`: modified `corner_bl.webp`, `corner_br.webp`, `corner_tl.webp`, `corner_tr.webp`, `divider.webp`, `edge_bottom.webp`, `edge_left.webp`, `edge_right.webp`, `edge_top.webp`; deleted `crest.webp`;
- `liberti_sine_vinculis`: modified `corner_bl.webp`, `corner_br.webp`, `corner_tl.webp`, `corner_tr.webp`;
- `nexus_basalt`: modified `corner_bl.webp`, `corner_br.webp`, `corner_tl.webp`, `corner_tr.webp`, `edge_bottom.webp`, `edge_left.webp`, `edge_right.webp`, `edge_top.webp`; deleted `crest.webp`;
- `.idea/caches/deviceStreaming.xml`: modified but not part of browser runtime.

The two crest deletions are intentional baseline tombstones: later work must not “repair” them merely because the roadmap mentions crest/divider as optional. The Git tree is the byte-level preservation mechanism; the principal visual file hashes are included in the commit itself.

A static literal asset scan observed 97 candidate paths: 85 present and 12 absent. The absent literals are optional fallbacks (alternate audio names and future SFX candidates), not proven required assets. Required/optional/dev-only/legacy classification remains a later Visual Asset Gate task.

### Supplemental ZIP-only material

The archive adds exactly six files not present in the Git checkout:

| ZIP-only path | Observed status | Audit disposition |
| --- | --- | --- |
| `assets/maps/backgrounds/battlefield.webp` | 626,004 bytes; SHA-256 `6cb3ea1fa2f67c7b509a6e57dca0d787fcf5deac3c7e8059796d605be779e8dd`; referenced only by `.gitignore`, while Snow uses `snow_bf_4pl_3x.webp` | Preserve in the supplied ZIP; do not import or delete until the Visual Gate classifies it as source/legacy/unused |
| `docs/F9T2A_ANDROID_TOUCH_RENDER_BASELINE.md` | Candidate design report for Android/WebView work | Out of Starter 1.0 scope; historical/orphan evidence only |
| `docs/F9T2A_MANUAL_APK_CHECKLIST.md` | Requires physical APK validation | Out of scope and not satisfied |
| `src/android_runtime_diagnostics.js` | 267-line volatile diagnostic script; self-installs wrappers | Not referenced by `index.html`; not part of the 94-script runtime; do not load implicitly |
| `tests/f9t2a_android_touch_render_baseline_smoke.js` | Static source test for a different build/candidate | Internally inconsistent with this ZIP: expects `C2-STABLE-1-F9T2a-APK-M4c`, an Android diagnostics script tag and implementation markers that are absent |
| `tests/f9t2a_browser_android_touch_render_smoke.js` | Node Playwright browser script | Not a baseline test; requires `playwright` and the absent runtime integration |

The archive’s `.gitignore` names all six paths. The Android package also reuses `F9T2a`, already used in the tracked code for the Exordium Expert Bastion Relay milestone. Importing it would create nomenclature and baseline ambiguity. Preserve the archive by hash, but do not merge these files into REFRACTOR_BASELINE without a separate owner decision.

## Gate checklist at audit entry (superseded)

| Condition | Result | Evidence / remaining action |
| --- | --- | --- |
| Exactly one REFRACTOR_BASELINE | PASS | One anchor declared above |
| Working tree clean or every difference documented | PASS for entry; audit-only delta documented | Only the five requested audit documents are produced |
| Current baseline objects locally available | PASS | 1,381/1,381 HEAD tree blobs present |
| All currently executable existing tests launched | PASS with environment qualification | All 113 Node tests and both non-direct-Playwright Python entrypoints launched; 66 Playwright-dependent files are not executable in this environment |
| Manual assets/local artifacts to preserve inventoried | PASS | Committed frame assets plus six ZIP-only ignored paths are listed; no import or deletion performed |
| Every AC1 patch exactly comparable | PASS | Compare to the sole anchor |
| Existing automated suite green | FAIL | 25 Node failures; browser suite cannot run |
| Exact candidate formally validated | FAIL | `BUILD_INFO` and README call it a candidate; no validation artifact supplied |
| Required reconciliation documents available | FAIL | Matrix, current rules and F9M2f register missing |

## Closure requirements identified by the entry audit

1. Owner review must confirm or supply the missing matrix, canonical Starter rules and historical register, or explicitly waive them for P0.
2. Historical metadata assertions must be reclassified as immutable fixture checks or replaced with version-independent contracts without weakening feature assertions.
3. The 25 Node failures must be resolved or explicitly baselined with a reviewed reason and reproducible expected-failure mechanism.
4. A supported Playwright environment must run the browser suite, or P0 must explicitly document an approved alternative browser gate.
5. The exact current HEAD/manual-asset state must receive explicit product validation before it is called VALIDATA.
6. Owner review must classify the six ignored ZIP-only artifacts as source archive, legacy or discardable; until then they remain preserved only in the hashed ZIP and outside runtime.

The owner review and technical actions addressing these items are recorded in `AR_P0_CLOSURE_REPORT.md`. The next permitted milestone is S2-C5a; AC1 remains blocked until the Content Freeze gate passes.
