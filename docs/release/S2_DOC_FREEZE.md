# S2 DOC-FREEZE — Milestone report

Status: **PASS** — 2026-09-09.

## Files and rationale

- `STARTER_1_0_RULEBOOK_IT.md`, `STARTER_1_0_RULEBOOK_EN.md`: canonical bilingual rules aligned with runtime victory, pressure, economy, deck and 2–4 player contracts.
- `STARTER_1_0_PLAYER_GUIDE_IT_EN.md`: player-facing setup, onboarding and strategic flow.
- `STARTER_1_0_GLOSSARY_IT_EN.md`: shared Italian/English terminology.
- `STARTER_1_0_STATISTICS_REGISTER.md`: generated catalog, map and asset figures; no manual counts.
- `STARTER_1_0_DEV_GUIDE.md`: source-of-truth, profile, freeze and validation boundaries.
- `STARTER_1_0_CHANGELOG.md`: consolidated Starter 2 candidate history without declaring validation.
- `STARTER_1_0_WEBSITE_CANONICAL_COPY.md`: verified bilingual public copy.
- `STARTER_1_0_CREDITS_LICENSES.md`: MPL 2.0 source notice and reserved creative-asset notice.
- `tools/generate_starter_statistics_register.js`: deterministic statistics generator with stale-file check.
- `tools/check_documentation_freeze.js`: executable consistency gate against manifest and runtime source contracts.

## Verification executed

- `node tools/generate_starter_statistics_register.js --check` — PASS.
- `node tools/check_documentation_freeze.js` — PASS: 9 canonical documents, 10 official maps, frozen catalog hash unchanged.
- `node tools/check_js_syntax.js` — PASS (exit 0).

The gate verifies dynamic catalog figures, every official and legacy map, map/content hash, rulebook contract markers, source constants, pressure majority/scaling, HQ prerequisite, round-limit tiebreak, Player/DEV positioning and license notices.

## Not run in this milestone

- Browser gameplay regression and long-match testing: assigned to S2-C7.
- Clean-checkout staging, artifact checksum and final artifact smoke: assigned to S2-C7/S2-RC.
- Desktop wrapper packaging: not currently evidenced as a planned repository deliverable.

## Regression assessment

Documentation and tooling only; no gameplay, UI, localization, content manifest or asset bytes changed. Catalog hash remains `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`.

## Residual risks

- The repository root README is historical candidate documentation, not the canonical Starter 1.0 public page; release packaging must point to this folder's canonical copy.
- Human gameplay validation is intentionally not claimed.
- Third-party material added later requires its own attribution before distribution.

