# Arena Rubra Starter 1.0 — Changelog

## Starter 2 consolidation candidate

- Froze the Starter 1.0 content catalog with deterministic hashes and explicit KEEP/REMOVE decisions.
- Completed the AR-AC1 architecture acceptance contract and preserved runtime behaviour through characterization and boundary tests.
- Added complete Italian/English localization for Player-facing shell, setup, match UI, content, tutorial and challenge flows.
- Classified the complete asset tree and enforced required-asset integrity plus optional fallback policy.
- Formalized Player/DEV profiles: Distribution excludes development editors, calibration tools and Expert AI; Advanced remains the official Starter AI ceiling.
- Consolidated 2–4 player official maps, free-for-all elimination, Strategic Pressure, match history/telemetry, deck lifecycle, Missions, Tutorial and Field Trials.
- Added canonical bilingual rules, Player Guide, glossary, licensing notes, website copy and a generated statistics register.

The automated S2-C7 regression, performance, packaging, clean-checkout CI and authorized GitHub Pages publication gates are complete for `1.0.0-rc.1`. This remains a release candidate pending human release approval; no document in this folder declares human validation.

## Post-RC stabilization

- Corrected shared vertical ownership of the desktop header, HUD and right inspector.
- Prevented geometry-stable unit/terrain selection from reapplying the board camera transform.
- Revalidated the UI/camera microfix across the supported desktop viewport matrix.
- Aligned faction-skin modular geometry to the Exordium geometry baseline while preserving faction-specific material assets.
- Added/classified Fabeot and Nexus crest assets as optional presentation assets.
- Regenerated faction-skin byte sizes and SHA-256 values from actual repository bytes.
- Synchronized the visual asset inventory to **474 classified assets** while preserving **69 required assets**.
- Revalidated current `main` through the complete CI/deployment pipeline on 2026-09-26: **183/183 Node**, **71/71 Python/browser**, staged Distribution and final artifact smoke PASS, GitHub Pages deployment PASS.

Final release remains pending human gameplay/visual approval and clean-checkout artifact evidence tied to the final immutable release source.
