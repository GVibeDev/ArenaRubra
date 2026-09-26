# Arena Rubra — Starter 1.0 RC

Arena Rubra is currently in **Starter 1.0 Release Candidate** hardening for the **Desktop / Web** target.

## Current product identity

- version: `1.0.0-rc.1`
- build: `Starter 1.0 Release Candidate 1`
- logic baseline: `C2-STABLE-1-F9T2c4-APK-M4c`
- public Distribution AI ceiling: **Advanced**
- Expert AI: **DEV / experimental**
- official maps: **10**
- units: **115**
- deck tactics: **70**
- Starter tactics: **10**
- Missions: **15**
- built-in decks: **50**

The technical source of truth is the current `main` branch.

Historical F9 milestone documents remain implementation evidence, but they do not by themselves describe the current public release state.

## Release status

The original Starter 1.0 RC1 clean-checkout evidence is preserved under:

`docs/release/`

Later post-RC work includes:

- header / HUD / inspector geometry stabilization;
- board-camera selection stability;
- faction-skin modular geometry refresh;
- visual asset inventory synchronization.

Current-main revalidation is documented in:

`docs/release/S2_MAIN_REVALIDATION_2026-09-26.md`

Automated technical gates are green.

**Final human gameplay and release approval are not declared yet.**

## Canonical release documents

- `docs/release/STARTER_1_0_RULEBOOK_IT.md`
- `docs/release/STARTER_1_0_RULEBOOK_EN.md`
- `docs/release/STARTER_1_0_PLAYER_GUIDE_IT_EN.md`
- `docs/release/STARTER_1_0_GLOSSARY_IT_EN.md`
- `docs/release/STARTER_1_0_STATISTICS_REGISTER.md`
- `docs/release/STARTER_1_0_DEV_GUIDE.md`
- `docs/release/STARTER_1_0_CHANGELOG.md`
- `docs/release/STARTER_1_0_WEBSITE_CANONICAL_COPY.md`

## Source-of-truth manifests

- frozen content: `data/starter_1_0_manifest.json`
- visual assets: `data/required_assets.json`
- release regression matrix: `data/s2_c7_regression_matrix.json`

## Focused verification

```bash
node tools/generate_starter_1_0_manifest.js --check
node tools/generate_visual_asset_inventory.js --check
node tools/check_required_assets.js
node tests/s2_c6_visual_asset_presentation_gate_smoke.js
node tools/check_s2_rc_readiness.js
```

The full GitHub Actions workflow additionally runs the complete Node and browser suites, stages DEV and Distribution profiles, validates the Distribution release matrix and final artifact, and deploys GitHub Pages only after the build gate succeeds.
