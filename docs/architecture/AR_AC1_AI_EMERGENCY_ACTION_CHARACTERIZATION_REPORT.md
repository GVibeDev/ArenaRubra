# AR-AC1 — AI Emergency-Action Characterization

Date: 2026-09-07  
Baseline: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS**

The pre/post oracle freezes `emergencyBotAction`: supplied or derived status, inactive/empty exits, strategic-target filtering, the exact `+12` score bonus, progress guard, attacker removal, vehicle ability follow-up, action ending and the intentionally unused movement-provider argument.

Verification: characterization **13/13**, boundary **31/31**, F9T0 **38/38**, Varran assault-chain **79/79**, complete Node **158/158**, Python/browser **69/69**, syntax **275/275**, Golden Matches unchanged and `git diff --check` clean. Tests not run: none. No emergency, combat, ability, movement or victory rule changed.
