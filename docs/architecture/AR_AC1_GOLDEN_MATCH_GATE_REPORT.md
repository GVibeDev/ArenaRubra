# AR-AC1 — Golden Match Gate Report

Date: 2026-09-03  
Entry gate: Map State Queries boundary **PASS**  
Frozen catalog hash: `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`  
Comparison anchor: `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`  
Result: **PASS — minimum Golden Match gate complete.**

## Outcome

The repository now owns the five deterministic Advanced AI regression scenarios required by the roadmap:

| Fixture | Configuration | Action budget | Frozen SHA-256 |
| --- | --- | ---: | --- |
| `GOLDEN-001` | Nexus vs Exordium · Campo Starter | 40 turns | `053c6d50481fe7edbba1fd6a22e234bcfb1f8edb3eb163261ac58153f17cdf62` |
| `GOLDEN-002` | Liberti vs Agathoi · Narrow Path | 40 turns | `1fa783d592e5538e5b94857c4c9a72bbc7653d9722d0091697134fd4afb2765a` |
| `GOLDEN-003` | Fabeot vs Nexus · Plains 2G large | 40 turns | `66b6b8587198aa4ccfb65a63304e945a7aa0227d725491b5ea990c2c108d80f9` |
| `GOLDEN-004-3P` | Nexus vs Liberti vs Fabeot · Triumvirato Rubro | 60 turns | `dad4b0aa49195f9dc21fb05fb0e7c95c4a6cac188cf511ac76e3967d21a2a879` |
| `GOLDEN-005-4P` | Exordium vs Agathoi vs Nexus vs Fabeot · Quadrivio Spezzato | 80 turns | `463fb00ce8a2e29b4d3d75da5f8c9be902ef84a973c279730ab2d91525980370` |

Each scenario executes twice and must match both its repeat and its frozen stable-field hash. Three 2P matches and the 3P match reach round 21; the 4P trace reaches round 25 because active-player rotation changes after an elimination. No application/runtime code or frozen content was modified for this gate.

## Stable projection contract

The snapshot includes:

- seed, map, players, factions, commanders, decks, AI mode, pace and scale;
- winner, round, current player, ENE, pressure and controlled PS;
- unit IDs, blueprint IDs, side, position, HP/DEF, alive/acted state;
- strategic-point control;
- ordered hand, deck size/top, discard and starter slots;
- lifecycle and elimination attribution;
- RNG algorithm/seed/call count;
- per-player turn, economy, card, field, combat and mission aggregates;
- deterministic event-type counts.

It deliberately excludes timestamps, random match IDs, durations, human-readable logs, DOM layout and other UI-only diagnostics.

The final `AR-AC1-GOLDEN-2` projection also excludes the `LOG_MESSAGE` event count. That event is diagnostic text emitted by one-time browser/UI initialization and varied by one between the first and repeated match while every authoritative state, RNG, combat, economy and lifecycle field remained identical. The v2 hashes above were accepted only after two identical runs of every scenario; this oracle correction does not change gameplay or content.

## Files changed and reasons

- `tests/fixtures/ar_ac1_golden_matches.json`: canonical seeds, maps, commanders, built-in decks, action budgets and frozen hashes.
- `tests/ar_ac1_browser_golden_matches_smoke.py`: full-runtime Advanced AI driver, stable projection, repeat comparison and frozen-hash gate.
- `tests/ar_ac1_golden_matches_contract_smoke.js`: validates the required named/player-count matrix, complete fixed setup, non-placeholder hashes, stable-field whitelist and double-run contract.
- `docs/architecture/AR_AC1_TEST_COVERAGE_MAP.md`: replaces the recorded Golden gap with current evidence and residual limits.
- `docs/architecture/AR_AC1_DEPENDENCY_MAP.md`: records that Advanced AI extraction now has an integration gate but still requires slice-local characterization.
- `docs/architecture/AR_AC1_GOLDEN_MATCH_GATE_REPORT.md`: gate evidence and review stop.

## Tests executed

| Gate | Result | Notes |
| --- | --- | --- |
| Golden fixture contract | **PASS** | Required 2P/3P/4P matrix, fixed setup, action budgets and hashes |
| Golden deterministic repeats | **PASS 5/5** | Every scenario executed twice with identical projection |
| Golden frozen snapshots | **PASS 5/5** | All five SHA-256 values match |
| Golden browser runtime | **PASS** | Zero page errors and zero console errors |
| JavaScript syntax | **PASS 233/233** | Every project JavaScript file under `src/`, `data/`, `tests/` and `tools/` |
| Complete Node suite | **PASS 129/129** | No skip/expected-failure list |
| Complete Python/browser suite | **PASS 69/69** | Includes the new Golden driver; UTF-8, Playwright 1.62.0 and system Chrome |
| Starter manifest and map characterizations | **PASS** | Frozen content hash and all five map hashes unchanged |
| Diff hygiene | **PASS** | Temporary Playwright/CPython 3.12 artifacts removed; generated screenshots restored; `git diff --check` clean |

## Regressions explicitly sought

- deterministic initiative, deck order and RNG-call evolution from fixed seeds;
- faction/commander/deck selection across all five factions;
- Advanced AI deployment, purchases, movement, construction, abilities, tactics and targeting;
- ENE gain/spend, hand/deck/discard transitions and deck exhaustion;
- PS control and multiplayer target selection;
- attacks, damage, defense loss, destruction and HQ threat;
- 3P/4P active-player rotation and 4P elimination lifecycle;
- stable telemetry aggregation and event-type emission;
- cross-run leakage when scenarios repeat in one browser session;
- unchanged frozen Starter 1.0 catalog.

## Tests not executed / residual risks

- These are bounded deterministic action traces, not product playtest validation. No Golden scenario currently reaches a terminal winner or non-zero pressure; a separate focused 2P/3P/4P pressure/victory oracle now covers those paths and remains green after the bounded Pressure/round-limit extraction.
- The driver accelerates timer delays to zero while preserving asynchronous task boundaries. It validates decisions and state transitions, not real animation timing.
- The Golden gate runs through the full browser runtime rather than a DOM-free GameCore driver. It protects risky work but does not itself satisfy the roadmap's final headless-core objective.
- Full projection hashes are intentionally sensitive. An authorized gameplay/content/schema change will require a reviewed projection-version or hash update, never an automatic refresh.
- Advanced AI remains a large global-script module. Golden coverage permits small extraction candidates to be evaluated; it does not authorize a mass split.
- No clean-checkout GitHub Actions integration, physical-device validation, Desktop wrapper packaging or manual visual/UX sign-off was performed.
- The current candidate remains **not product-validated**; passing this test gate does not advance release status.

## Rollback

Rollback removes the fixture, Golden browser test, static contract and these documentation updates. No runtime, storage, content or migration rollback is required.

## Gate conclusion

The minimum Golden Match set is green, deterministic and reviewable. It now provides the integration backstop required before small Advanced AI or central-rule extractions, but each candidate still needs its own local characterization. This is the required review stop; no AI/rules extraction, CSS decomposition, ESM conversion or Distribution loader change is included.
