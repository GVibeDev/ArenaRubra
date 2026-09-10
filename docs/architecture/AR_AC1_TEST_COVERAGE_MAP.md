# AR-AC1 — Test Coverage Map

Baseline: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Audit date: 2026-09-01  
Gate result: **AR-P0 test gate PASS; 113/113 Node and 67/67 Python/browser scripts green.** High-risk AC1 domains still require the additional characterization listed below.

> Final boundary status (2026-09-07): AR-AC1 is **PASS**. SetupAdapter, Match Data, map-domain owners, two rule owners, GameCore/action/state boundaries, ten Advanced AI domain modules, CSS ownership, DEV/Distribution packaging, required assets and CI gates are green. The final suite is **168/168 Node and 69/69 Python/browser checks**, with five twice-repeated Advanced AI Golden Matches, full 4P browser persistence coverage and deterministic map corpora. See `AR_AC1_CLOSURE_REPORT.md`; historical audit counts below remain labeled entry measurements.

## Reproducible execution summary

All final commands were run from the repository root. Historical tests were reconciled with current contracts; no test was skipped by name or converted to expected-failure status.

| Check | Result | Environment / command contract |
| --- | --- | --- |
| JavaScript syntax | **PASS 208/208** | Every `*.js` under `src/`, `data/`, `tests/` with `node --check`, including the build contract helper |
| Python syntax | **PASS 68/68** | Python 3.12.13 `compile(..., "exec")`, no imports and no bytecode write |
| Node smoke suite | **PASS 113/113** | Central build-shape contract; historical feature assertions preserved |
| Python/browser scripts | **PASS 67/67** | Complete final run in 357.3 seconds; Playwright 1.62.0 with system Chrome 151 |
| 5×5 Python aggregate entrypoint | **PASS** | All lesson/checkpoint/guidance/result paths completed |
| Browser portability | **PASS** | Shared launcher resolves Windows and Linux system browsers or Playwright-managed Chromium |
| HTML browser fixtures | **2 present; not standalone** | Supporting harnesses, not independently launched CLI tests |
| Supplemental ZIP-only JS candidates | **2 present; excluded from baseline counts** | Both are ignored by the ZIP’s own `.gitignore` and require an Android F9T2a integration absent from the archive |
| Exploratory in-app browser smoke | **PASS with caveats** | Local static server; startup/setup/new 2P match only, not the scripted browser suite |
| Golden Matches | **PASS — minimum set** | Named Nexus/Exordium, Liberti/Agathoi, Fabeot/Nexus, 3P and 4P Advanced AI fixtures; frozen stable-field hashes; each scenario repeated twice |

The original 25 metadata-coupled Node failures were repaired without weakening their feature assertions. The current suite is green; the remaining gaps below concern characterization depth, not an unavailable harness.

## Test architecture

Signals found across the 113 Node files:

| Signal | Files | Meaning |
| --- | ---: | --- |
| Reads source plus `.includes()` string checks | 99 | Strong static-contract/source-shape dependence |
| VM/runtime execution signal | 82 | Some functions/data are evaluated, usually in handcrafted contexts |
| Exact build metadata/version coupling | 45 | Milestone tests can become red solely because the visible version advances |
| State/deep/strict assertion signal | 86 | Behavioural assertions exist, but coverage depth varies |

These signals overlap. A test can both execute code in a VM and assert source substrings. The suite has substantial value, but “file contains token X” is often the only protection for UI/profile/milestone features. It is not sufficient for high-risk extraction.

There is no package manifest, lockfile or unified runner. Test discovery, ordering, prerequisites and exit aggregation are not encoded in repository automation. GitHub Pages does not copy or run `tests/`.

## Supplemental ZIP test candidates

`ArenaRubra.zip` supplies two additional `.js` files not present in Git HEAD. They are deliberately excluded from the 113-file baseline inventory because the same archive’s `.gitignore` lists them and their target implementation is incomplete.

| File | Finding | Status |
| --- | --- | --- |
| `tests/f9t2a_android_touch_render_baseline_smoke.js` | Expects build `C2-STABLE-1-F9T2a-APK-M4c`, `src/android_runtime_diagnostics.js` in `index.html`, Map Editor `incremental-view-f9t2a` markers and Android CSS. The archive actually declares F9W2d4a, has the same 94-script index as HEAD and lacks those implementation markers. | Not a runnable baseline contract; it would fail on its own archive |
| `tests/f9t2a_browser_android_touch_render_smoke.js` | Uses `require("playwright")`, expects the same absent diagnostics integration and performs Android/touch/editor qualification outside Starter 1.0 scope. | Environment-blocked and internally incompatible |

The accompanying `src/android_runtime_diagnostics.js` is not loaded by `index.html`; it is therefore absent from `AR_AC1_GLOBALS_INVENTORY.json` by design. The `F9T2a` name also collides with the tracked Expert Exordium milestone. These files should remain quarantined as historical/local material unless separately authorized and renamed.

## Resolved entry failure cluster

Every original Node failure reached an assertion requiring an older exact `BUILD_INFO.version`, build channel or compatibility token. The repair centralizes the current build shape and immutable F9T2c4 logic baseline in `tests/helpers/build_info_contract.js`; milestone behaviour assertions remain local to each test.

What can now be concluded:

- syntax, all 113 Node contracts and all 67 browser/Python scripts are green;
- the current build metadata shape and F9T2c4 logic baseline are checked centrally;
- no automated regression was observed in the existing suite.

What cannot be concluded:

- that gameplay is regression-free;
- that the exact candidate is product-validated;
- that changing build metadata assertions alone would make coverage adequate.

The safe repair pattern is to move historical metadata into fixture-specific assertions and keep feature behaviour assertions version-independent. AR-P0 applied that repair and recorded the result in `AR_P0_CLOSURE_REPORT.md`.

## Subsystem coverage and gaps

| Priority subsystem | Existing evidence | Coverage quality | Missing characterization before extraction |
| --- | --- | --- | --- |
| Setup / initial state | map/deck setup smokes, runtime integration, browser startup | **partial** | A complete 2P/3P/4P match created from a setup object while `document` is unavailable; defaults and initiative contract |
| Combat ATT → DEF → HP | F9T2d2 damage preview, lifecycle/attribution, runtime integration | **partial behaviour** | Table-driven exact damage, destruction, retaliation/status and telemetry side-effect tests independent of DOM |
| Movement | map/terrain, AI move and camera-related smokes | **partial** | Pure legal-target and application cases across terrain/multipliers; no render/camera dependency |
| Deployment | starter/HQ caps, Exordium forward pivot, commander commitment | **partial behaviour** | Setup → legal/illegal placement → authoritative state, including 2P/3P/4P and rollback on rejection |
| ENE / economy / deck recovery | mission cycles, recovery, game scale and bot smokes | **partial behaviour** | Explicit income/spend/lock/recovery transition table with stable expected state |
| PS / pressure | F9R3 proportional pressure, map/FFA and tutorial challenge tests; focused 2P/3P/4P start/threshold/increment/terminal fixtures | **good deterministic runtime** | Preserve the focused oracle while extracting the pure rules boundary |
| Missions | F9N4–N10, mission AI, FFA missions | **best-covered core area** | DOM-free full mission cycle fixtures with reward and lock state; telemetry separated from rule result |
| Deck / cards | built-in deck, recovery, official roster, Deck Builder | **partial behaviour** | Deterministic draw/discard/recovery with seed and all official-deck validation from one manifest |
| Tactics / abilities | custom tactic whitelist, faction expansion, AI tactics | **partial** | Input/action/output fixtures for official and custom effects, invalid target and exact cost/discard |
| Victory / player lifecycle | FFA elimination/assist tests plus deterministic winner effects, concession, auto-resign, round-cap, draw and 2P–4P QG/terminal transitions; explicit service/facade contract | **good deterministic runtime; bounded ownership extracted** | Keep broader action rules and lifecycle cleanup internals outside this service |
| Map loading | map foundation, official map pressure/selection, Snow exact-hash tests, canonical provider plus normalization/validation/pathfinding/persistence/state-query contracts, deterministic sanitization, valid/invalid, path/cost/performance, storage CRUD/fallback, 2P–4P lifecycle/query corpora and Golden Matches on five maps/configurations | **good map-domain characterization; legacy facade remains** | Keep portable duplicate/import/export orchestration explicit |
| Advanced AI | F9T0 finalization, faction/doctrine smokes, five seeded 2P/3P/4P Golden Matches and thirteen extracted slices through movement, attack-only, stationary-action and emergency-action execution | **good deterministic integration; thirteen bounded slices extracted (seven read-only, six stateful)** | Characterize attack scoring, ability scoring, purchase and later tactic/turn slices independently |
| Expert Exordium | F9T1/T2 series, telemetry and commitment smokes | **broad but brittle** | Deterministic plan/action trace with declaration-override behaviour characterized |
| Persistence / Match Data | local vault, W1a Match Data, DOM-free boundary contract, legacy migration characterization and 4P browser smoke | **good core characterization; fallback parity partial** | OPFS/IDB/local fallback parity and explicit dependency injection beyond legacy global bridges |
| Tutorial / Challenge | Node milestone tests plus full browser suite and 5×5 aggregate | **good browser, coupled runtime** | DOM-free scenario-state characterization before extraction |
| UI / renderer / camera / themes | source smokes plus complete browser suite | **good smoke coverage** | Visual-diff/reference captures and broader target-resolution matrix |
| Player / DEV profile | static, full browser, source Distribution and staged Distribution tests | **good** | Twelve DEV/Expert modules absent from Distribution requests and package |
| Asset references | seven hashed required assets plus negative missing-asset test | **good release gate** | Expand optional/dev-only classification only when future assets require it |
| CI/deploy | syntax, content, assets, Node, browser, DEV/Distribution staging and staged boot | **blocking gate** | Remote hosted run follows commit/push, outside AR-AC1 local closure |

## Golden Match gate

The minimum named set is now executable in `tests/ar_ac1_browser_golden_matches_smoke.py`, configured by `tests/fixtures/ar_ac1_golden_matches.json`:

- `GOLDEN-001`: Nexus vs Exordium;
- `GOLDEN-002`: Liberti vs Agathoi;
- `GOLDEN-003`: Fabeot vs Nexus;
- `GOLDEN-004-3P`: Nexus vs Liberti vs Fabeot;
- `GOLDEN-005-4P`: Exordium vs Agathoi vs Nexus vs Fabeot.

Every fixture fixes seed, official map, factions, commanders, built-in decks, Advanced AI mode, pace, scale, initiative and action-turn budget. Each runs twice in the same browser session and must produce the same SHA-256 projection before it is compared with its frozen hash. The stable projection includes winner, round, current player, ENE, PS, pressure, unit identity/position/life, hand/deck/discard, lifecycle, RNG calls, selected telemetry aggregates and event-type counts; timestamps, match IDs, durations, logs and UI-only diagnostics are excluded.

The three 2P fixtures and the 3P fixture reach round 21; the 4P fixture reaches round 25 after one player is eliminated. Collectively they exercise deployment, movement, building, deck exhaustion, card play/discard/steal/block, abilities, tactics, PS control, combat, damage, destruction, HQ threat and multiplayer elimination. Their bounded traces do not currently produce a winner or non-zero pressure; the separate 31-assertion Pressure/Victory oracle now supplies that focused terminal coverage for 2P, 3P and 4P and remains green after extraction.

## Browser evidence

A complete Playwright run now supplements the exploratory startup smoke:

- 67/67 Python scripts passed, including the tutorial 5×5 aggregate;
- application booted to Main Menu with the selected data-store backend;
- Setup rendered ten official map options and fifty built-in deck options;
- the default DEV profile was visible;
- a 2P Nexus human vs Exordium bot match started with round/HUD, five-card hands, 25-card remaining decks and three starter cards;
- the selected-unit floating inspector computed as fixed-position;
- camera, renderer, lifecycle, telemetry, Control Center, profile, theme and target layout assertions passed.

HTTP requests did include expected candidate/fallback 404s for generic commander/QG/custom placeholder token paths, `.webp` before `.jpg` fallback attempts, optional SFX candidates and favicon. This is not proof that all required assets exist; required/optional classification remains a later gate.

## CI coverage

Pages automation now blocks artifact upload on JavaScript/Python syntax, frozen Starter content, required-asset integrity, the complete Node suite, the complete Player/DEV browser suite, DEV/Distribution staging validation and a staged Distribution browser boot. The uploaded artifact is `_site_distribution`, not the DEV tree. `ar_ac1_ci_gate_contract_smoke.js` enforces gate presence and ordering.

## Complete Node inventory at audit entry (historical; superseded by 113/113 PASS)

- **PASS** `f9n10_builtin_decks_smoke.js`
- **PASS** `f9n10_mission_ai_smoke.js`
- **PASS** `f9n10_recovery_cycle_smoke.js`
- **PASS** `f9n10_runtime_integration_smoke.js`
- **PASS** `f9n1_card_editor_schema_smoke.js`
- **PASS** `f9n1_custom_tactics_smoke.js`
- **PASS** `f9n3_game_scale_hq_smoke.js`
- **PASS** `f9n3a_mode_cap_reliability_smoke.js`
- **PASS** `f9n4_mission_contract_smoke.js`
- **PASS** `f9n5_opening_protection_smoke.js`
- **PASS** `f9n6_mission_progress_tracker_smoke.js`
- **PASS** `f9n7_mission_ui_smoke.js`
- **PASS** `f9n7a_visibility_hud_smoke.js`
- **PASS** `f9n8_ordinary_missions_smoke.js`
- **PASS** `f9n8_runtime_integration_smoke.js`
- **PASS** `f9n9_desperate_missions_smoke.js`
- **PASS** `f9n9_runtime_integration_smoke.js`
- **PASS** `f9o1_presentation_runtime_smoke.js`
- **PASS** `f9o1_theme_audio_integration_smoke.js`
- **PASS** `f9o1a_live_layout_calibration_smoke.js`
- **PASS** `f9o1b_music_controls_smoke.js`
- **PASS** `f9o2_camera_interaction_smoke.js`
- **PASS** `f9o2b_camera_autonomy_inspection_smoke.js`
- **PASS** `f9o2c_bot_camera_freeze_smoke.js`
- **PASS** `f9o2d_token_layering_active_cues_smoke.js`
- **PASS** `f9o2e_mission_build_cap_smoke.js`
- **PASS** `f9o3_event_narrative_overlay_smoke.js`
- **PASS** `f9o4_hidden_hand_card_backs_motion_smoke.js`
- **PASS** `f9o4a_android_camera_performance_smoke.js`
- **PASS** `f9o4b_incremental_dom_renderer_smoke.js`
- **PASS** `f9o4c_android_render_stability_smoke.js`
- **PASS** `f9o4d_mission_render_signature_smoke.js`
- **PASS** `f9o4e_public_bot_card_thumbnail_stability_smoke.js`
- **PASS** `f9o4f_real_art_thumbnail_cache_finalization_smoke.js`
- **PASS** `f9o5_miniature_taxonomy_asset_completion_smoke.js`
- **PASS** `f9o5a_token_motion_sfx_evaluation_smoke.js`
- **PASS** `f9o5b_hq_empty_objective_visual_hotfix_smoke.js`
- **PASS** `f9o6_tutorial_runtime_foundation_smoke.js`
- **PASS** `f9o7a_lesson1_exordium_smoke.js`
- **PASS** `f9o7b_tutorial_ui_state_resume_smoke.js`
- **PASS** `f9o7c_lesson2_nexus_smoke.js`
- **PASS** `f9o7d_collapsed_hand_controls_reflow_smoke.js`
- **PASS** `f9o7e_lesson3_agathoi_smoke.js`
- **PASS** `f9o7f_lesson4_liberti_smoke.js`
- **PASS** `f9o7g_lesson5_fabeot_smoke.js`
- **PASS** `f9o7h1_tutorial_visibility_hotfix_smoke.js`
- **PASS** `f9o7h2_performance_hotfix_smoke.js`
- **PASS** `f9o7h3_ffa_targeting_structure_cap_smoke.js`
- **PASS** `f9o7h_tutorial_guidance_adaptive_framing_smoke.js`
- **PASS** `f9q1_map_data_foundation_smoke.js`
- **PASS** `f9q2_multiplayer_elimination_smoke.js`
- **PASS** `f9q2_multiplayer_telemetry_smoke.js`
- **PASS** `f9q2_multiplayer_terrain_smoke.js`
- **PASS** `f9q3_map_editor_smoke.js`
- **PASS** `f9q3a_dynamic_board_geometry_smoke.js`
- **PASS** `f9q3a_local_data_vault_smoke.js`
- **PASS** `f9q3a_main_menu_smoke.js`
- **PASS** `f9q3b_pressure_battlefield_readability_smoke.js`
- **PASS** `f9q3c1_obstacle_readability_smoke.js`
- **PASS** `f9q3c_custom_map_backgrounds_smoke.js`
- **PASS** `f9q3d1_target_player_foundation_smoke.js`
- **PASS** `f9q3d2_ffa_effects_missions_smoke.js`
- **PASS** `f9q3d3_player_elimination_state_smoke.js`
- **PASS** `f9q3d4_elimination_assist_pressure_attribution_smoke.js`
- **PASS** `f9q3e1_match_telemetry_foundation_smoke.js`
- **PASS** `f9q3e1a_telemetry_attribution_pivot_instances_smoke.js`
- **PASS** `f9r3_proportional_pressure_official_maps_smoke.js`
- **PASS** `f9s1a_faction_units_tactics_expansion_smoke.js`
- **PASS** `f9s1b1_deck_selection_official_maps_smoke.js`
- **PASS** `f9s1b_alternative_pivots_complete_pools_smoke.js`
- **PASS** `f9s1c1_official_roster_deck_builder_ux_smoke.js`
- **PASS** `f9t0_advanced_ai_finalization_smoke.js`
- **PASS** `f9t1_expert_ai_architecture_telemetry_smoke.js`
- **PASS** `f9t2_exordium_bastion_relay_smoke.js`
- **PASS** `f9t2b_exordium_territorial_conversion_smoke.js`
- **PASS** `f9t2c1_execution_integrity_smoke.js`
- **FAIL — metadata-coupled** `f9t2c2_bootstrap_forward_pivot_impact_smoke.js`
- **PASS** `f9t2c3_telemetry_aggregation_reconciliation_smoke.js`
- **PASS** `f9t2c3a_turn_ownership_audit_units_smoke.js`
- **PASS** `f9t2c4_clear_occupation_commitment_smoke.js`
- **PASS** `f9t2c_exordium_forward_pivot_deployment_smoke.js`
- **PASS** `f9t2d2_clear_effective_damage_preview_smoke.js`
- **FAIL — metadata-coupled** `f9t2d3_commander_deployment_commitment_smoke.js`
- **FAIL — metadata-coupled** `f9t2d_varran_assault_chain_smoke.js`
- **FAIL — metadata-coupled** `f9u1a1_inspector_hand_header_controls_smoke.js`
- **FAIL — metadata-coupled** `f9u1a_map_hud_layout_foundation_smoke.js`
- **FAIL — metadata-coupled** `f9u1b_unit_inspector_ps_unit_bars_smoke.js`
- **FAIL — metadata-coupled** `f9u2a_card_pool_reorganization_smoke.js`
- **PASS** `f9u2b_editor_layout_reorganization_smoke.js`
- **FAIL — metadata-coupled** `f9u3_control_center_smoke.js`
- **FAIL — metadata-coupled** `f9v2a_tutorial_challenge_framework_smoke.js`
- **FAIL — metadata-coupled** `f9v2c_tutorial_challenge2_hold_ps_smoke.js`
- **FAIL — metadata-coupled** `f9v2d_tutorial_challenge3_hq_breach_smoke.js`
- **FAIL — metadata-coupled** `f9v2e_tutorial_challenge4_pressure_smoke.js`
- **FAIL — metadata-coupled** `f9v2f_tutorial_challenge5_final_exam_smoke.js`
- **FAIL — metadata-coupled** `f9v3a_unified_result_modal_smoke.js`
- **PASS** `f9v3b_tutorial_action_contract_smoke.js`
- **PASS** `f9v3b_tutorial_contract_coverage_smoke.js`
- **FAIL — metadata-coupled** `f9v3c_result_flow_tutorial_ux_deck_recovery_smoke.js`
- **FAIL — metadata-coupled** `f9v4a_strategic_tutorial_content_voice_smoke.js`
- **PASS** `f9w1a_match_data_v2_smoke.js`
- **FAIL — metadata-coupled** `f9w2a1_snow_bf_official_map_smoke.js`
- **FAIL — metadata-coupled** `f9w2a1_snow_bf_regression_f9w2b.js`
- **PASS** `f9w2a_product_profile_smoke.js`
- **FAIL — metadata-coupled** `f9w2a_profile_static_smoke.js`
- **FAIL — metadata-coupled** `f9w2b_menu_theme_smoke.js`
- **FAIL — metadata-coupled** `f9w2c_global_theme_scope_smoke.js`
- **FAIL — metadata-coupled** `f9w2d1_scroll_agathoi_hotfix_smoke.js`
- **FAIL — metadata-coupled** `f9w2d2_thin_border_modules_smoke.js`
- **PASS** `f9w2d3_agathoi_palette_readability_smoke.js`
- **FAIL — metadata-coupled** `f9w2d4_repo_repair_right_inspector_smoke.js`
- **PASS** `f9w2d4a_inspector_position_ownership_smoke.js`
- **FAIL — metadata-coupled** `f9w2d_material_skin_smoke.js`

## Complete Python inventory at audit entry (historical; superseded by 67/67 PASS)

All 68 files pass parse/compile. Runtime statuses below reflect this environment and the attempted entrypoints, not source validity.

- **BLOCKED helper — imports Playwright** `browser_runtime.py`
- **BLOCKED — Playwright unavailable** `f9n2_browser_feedback_smoke.py`
- **BLOCKED — Playwright unavailable** `f9n6_browser_tracker_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o2b_browser_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o2c_browser_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o2d_browser_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o2e_browser_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o3_browser_overlay_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o4_browser_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o4b_browser_incremental_dom_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o4b_full_app_renderer_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o4c_browser_android_stability_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o4d_browser_mission_visibility_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o4d_full_app_mission_render_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o4e_browser_public_bot_hand_stability_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o4f_browser_real_art_cache_race_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o5a_browser_token_fx_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o6_browser_tutorial_runtime_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o7a_browser_checkpoint_resume_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o7a_browser_lesson1_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o7b_browser_ui_state_resume_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o7c_browser_lesson2_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o7d_browser_collapsed_hand_controls_reflow_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o7e_browser_lesson3_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o7f_browser_lesson4_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o7g_browser_lesson5_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o7h1_browser_tutorial_visibility_hotfix_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o7h_browser_mobile_adaptive_framing_smoke.py`
- **BLOCKED — Playwright unavailable** `f9o7h_browser_tutorial_guidance_smoke.py`
- **BLOCKED — Playwright unavailable** `f9q3c_browser_custom_background_smoke.py`
- **BLOCKED — Playwright unavailable** `f9q3d1_browser_target_player_smoke.py`
- **BLOCKED — Playwright unavailable** `f9q3d2_browser_ffa_missions_smoke.py`
- **BLOCKED — Playwright unavailable** `f9q3d3_browser_player_elimination_smoke.py`
- **BLOCKED — Playwright unavailable** `f9q3d4_browser_elimination_assist_pressure_smoke.py`
- **BLOCKED — Playwright unavailable** `f9q3e1_browser_match_telemetry_smoke.py`
- **BLOCKED — Playwright unavailable** `f9q3e1a_browser_telemetry_hotfix_smoke.py`
- **BLOCKED — Playwright unavailable** `f9r3_browser_official_maps_pressure_smoke.py`
- **BLOCKED — Playwright unavailable** `f9s1a_browser_faction_expansion_smoke.py`
- **BLOCKED — Playwright unavailable** `f9s1b1_browser_deck_selection_smoke.py`
- **BLOCKED — Playwright unavailable** `f9s1b_browser_alternative_pivots_smoke.py`
- **BLOCKED — Playwright unavailable** `f9s1c1_browser_all_official_decks_setup_smoke.py`
- **BLOCKED — Playwright unavailable** `f9s1c1_browser_deck_builder_ux_smoke.py`
- **BLOCKED — Playwright unavailable** `f9t1_browser_expert_architecture_smoke.py`
- **BLOCKED — Playwright unavailable** `f9t1_browser_expert_turn_integration_smoke.py`
- **BLOCKED — Playwright unavailable** `f9t2_browser_exordium_bastion_relay_smoke.py`
- **BLOCKED — Playwright unavailable** `f9t2b_browser_exordium_territorial_conversion_smoke.py`
- **BLOCKED — Playwright unavailable** `f9t2c2_browser_first_turn_bootstrap_smoke.py`
- **BLOCKED — Playwright unavailable** `f9t2c3_browser_telemetry_aggregation_smoke.py`
- **BLOCKED — Playwright unavailable** `f9t2c_browser_forward_pivot_deployment_smoke.py`
- **BLOCKED — Playwright unavailable** `f9t2d3_browser_commander_deployment_commitment_smoke.py`
- **BLOCKED — Playwright unavailable** `f9t2d_browser_varran_assault_chain_smoke.py`
- **BLOCKED — Playwright unavailable** `f9u1a1_browser_inspector_hand_header_smoke.py`
- **BLOCKED — Playwright unavailable** `f9u1a_browser_map_hud_smoke.py`
- **BLOCKED — Playwright unavailable** `f9u1b_browser_unit_inspector_ps_unit_bars_smoke.py`
- **BLOCKED — Playwright unavailable** `f9u2a_browser_card_pool_reorganization_smoke.py`
- **BLOCKED — Playwright unavailable** `f9u2b_browser_editor_layout_reorganization_smoke.py`
- **BLOCKED — Playwright unavailable** `f9u3_browser_control_center_smoke.py`
- **BLOCKED — Playwright unavailable** `f9v1a_browser_authoritative_tutorial_smoke.py`
- **BLOCKED — Playwright unavailable** `f9v2a_browser_challenge_unlock_smoke.py`
- **BLOCKED — Playwright unavailable** `f9v2b_browser_challenge1_elimination_smoke.py`
- **BLOCKED — Playwright unavailable** `f9v3a_browser_unified_result_modal_smoke.py`
- **FAIL/ENVIRONMENT — first child cannot import Playwright** `f9v3b_browser_tutorial_5x5_suite.py`
- **BLOCKED — Playwright unavailable** `f9w1a_browser_match_data_v2_smoke.py`
- **BLOCKED — Playwright unavailable** `f9w2a1_browser_snow_bf_smoke.py`
- **BLOCKED — Playwright unavailable** `f9w2a_browser_product_profile_smoke.py`
- **BLOCKED — Playwright unavailable** `f9w2b_browser_menu_theme_smoke.py`
- **BLOCKED — Playwright unavailable** `f9w2c_browser_global_theme_smoke.py`
- **PASS** `f9w2d1_agathoi_tone_smoke.py`

## HTML support inventory

- **NOT STANDALONE** `f9n4_browser_smoke.html` — browser support fixture/harness; not a CLI entrypoint.
- **NOT STANDALONE** `f9n5_browser_smoke.html` — browser support fixture/harness; not a CLI entrypoint.

## Characterization order before AC1 domains

1. Setup DTO and DOM-free initialization.
2. Combat, movement and deployment transition tables.
3. ENE, PS/pressure and victory/lifecycle matrices.
4. Deck recovery, tactics and missions cycles.
5. Deterministic map-catalog validation.
6. Seeded Advanced/Expert action traces and Golden Matches.
7. Persistence migration fixtures.
8. Browser DEV/Distribution startup and target layout assertions.

A domain is not ready for extraction merely because a source-smoke names its functions. At least one test must fail on a plausible behavioural error in the extracted boundary.
