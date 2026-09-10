# AR-AC1 — AI Attack-Only Characterization

Date: 2026-09-07  
Baseline: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS**

`botTryAttackOnly` was observed before extraction and replayed unchanged afterward. The 16-assertion oracle covers empty and filtered target sets, Advanced/non-Advanced policy, highest-score selection, inability to attack, attacker removal, the unchanged-attack-count loop guard and error propagation.

Verification: pre/post characterization **16/16**, boundary **28/28**, F9T0 **38/38**, complete Node **158/158**, Python/browser **69/69**, JavaScript syntax **275/275**, five Golden Match hashes unchanged, `git diff --check` clean. Tests not run: none in the current inventories. No attack rule, score, damage, balance or content was changed.
