# AR-AC1 — AI Stationary-Action Characterization

Date: 2026-09-07  
Baseline: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS**

The pre/post oracle freezes `botTryStationaryAction`: initial capability guard, positive ability selection, infantry early return, vehicle second ability window, attack loop, post-attack Disimpegno and the `f9s1aKeepActionAfterAbility`, `c2finalc2ReadyAfterAbility` and `f9s1aPostAttackMoveUsed` mutations.

Verification: characterization **18/18**, boundary **36/36**, F9T0 **38/38**, Varran assault-chain **79/79**, complete Node **158/158**, Python/browser **69/69**, syntax **275/275**, Golden Matches unchanged. Tests not run: none. No ability, attack, movement, mission-score, balance or content rule changed.
