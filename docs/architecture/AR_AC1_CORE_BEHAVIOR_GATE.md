# AR-AC1 — Core behavior gate

The unified Node gate discovers and executes every `tests/*_smoke.js` file. The acceptance inventory below identifies the mandatory behavioral oracle for each core domain; static boundary checks supplement these tests but do not replace them.

| Domain | Mandatory behavior evidence |
| --- | --- |
| Setup / initial state | `ar_ac1_game_core_headless_smoke.js`, `ar_ac1_setup_adapter_characterization_smoke.js` |
| Action validation / application | `ar_ac1_game_action_service_smoke.js`, `ar_ac1_core_boundary_contract_smoke.js` |
| Combat | `f9t2d2_clear_effective_damage_preview_smoke.js`, `f9t2d_varran_assault_chain_smoke.js` |
| Movement / terrain / paths | `ar_ac1_map_pathfinding_characterization_smoke.js`, `ar_ac1_ai_move_execution_characterization_smoke.js` |
| Deployment | `f9t2c_exordium_forward_pivot_deployment_smoke.js`, `f9t2d3_commander_deployment_commitment_smoke.js` |
| Economy / recovery | `f9n10_recovery_cycle_smoke.js`, `f9n3_game_scale_hq_smoke.js` |
| Pressure / victory / lifecycle | `ar_ac1_pressure_victory_characterization_smoke.js`, `ar_ac1_victory_lifecycle_characterization_smoke.js` |
| Missions | `f9n8_runtime_integration_smoke.js`, `f9n9_runtime_integration_smoke.js` |
| Deck / tactics / abilities | `f9n10_builtin_decks_smoke.js`, `f9n1_custom_tactics_smoke.js`, `ar_ac1_ai_stationary_action_characterization_smoke.js` |
| Maps / persistence | Map normalization, validation, pathfinding, persistence and state-query characterization tests |
| Advanced AI | Thirteen paired boundary/characterization slices and the five browser Golden Matches |
| Match Data / storage | `ar_ac1_match_data_boundary_contract_smoke.js`, `f9w1a_match_data_v2_smoke.js` |

CI executes the complete Node set through `tools/run_node_smokes.js`, then the complete Python/browser set through `tools/run_python_smokes.py`. A missing mandatory file fails `ar_ac1_acceptance_contract_smoke.js`; a behavioral failure stops the workflow before staging or upload.
