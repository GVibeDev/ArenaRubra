# S2-C7 — Release regression and artifact gate

Status: **BLOCKED** — 2026-09-10.

The complete technical regression is green. Milestone closure remains blocked because the final Distribution artifact was generated from the current working tree rather than from a clean checkout. This is a provenance failure, not a gameplay or packaging failure.

## Coverage and changes

- `data/s2_c7_regression_matrix.json` and `tools/check_s2_c7_regression_matrix.js`: executable 30-row matrix covering all required game configurations, frozen maps, victory paths, economy, combat, decks, missions, tactics, commanders, tutorials, challenges, localization, themes, persistence, assets, performance and packaging.
- `tests/s2_c7_browser_release_matrix_smoke.js`: Distribution browser coverage for all 10 official manifest-driven maps; 2P human/human, human/bot and bot/bot; 3P and 4P mixed games; IT/EN and theme persistence; repeated screen/new-game churn; runtime errors and DEV-request guards.
- `tests/ar_ac1_browser_golden_matches_smoke.js`: Node/Playwright execution of all five Golden Matches, twice each, with exact historical hashes.
- `src/precheck.js`: Distribution no longer reports the intentionally excluded Expert components as missing; Advanced remains the public ceiling.
- `tools/stage_runtime.js`, `tools/build_distribution_artifact.js`, `tools/check_required_assets.js` and `tools/check_staged_profile.js`: profile-aware Distribution staging, exclusion of DEV/legacy/QA-only material, embedded manifest and SHA-256 inventory.
- `tests/ar_ac1_staging_gate_smoke.js` and `tests/s2_c7_artifact_final_smoke.js`: staged-profile contract and final-artifact boot/integrity smoke.
- `docs/release/S2_C7_ARTIFACT_MANIFEST.json` and `docs/release/S2_C7_SHA256SUMS.txt`: evidence copied from the latest generated artifact.

## Verification executed

- Regression matrix — PASS: 30 coverage rows, 10 manifest-driven maps.
- Complete source-tree JavaScript smoke suite — PASS: 181/181 checks, including the Node/Playwright Golden Match and release-matrix tests. The post-staging artifact-final smoke also passes independently.
- Golden Matches — PASS: five deterministic fixtures, each repeated with the expected hash; 2P/3P/4P paths cover 40/60/80 action turns.
- Browser release matrix, source tree — PASS: all 10 official maps and five player/bot configurations; startup about 16.0 s, initialization 36–64 ms, rendering 4–11 ms, bot turns about 515–531 ms, bounded heap growth and no non-fallback runtime errors.
- Browser release matrix, staged artifact — PASS: equivalent Distribution coverage; startup about 16.2 s and heap growth about 2.0 MB.
- Required-assets gate — PASS: 69 required assets present and integrity-checked; all 472 repository assets classified.
- Distribution staging gate — PASS: 99/99 checks.
- Final artifact smoke — PASS: 555 payload files, 151,146,440 bytes, exact checksums, licenses, Distribution boot, English flow, new game and precheck; no DEV requests or page errors.
- DOC-FREEZE and frozen content/localization gates — PASS; catalog hash remains `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`.

## Required closure condition not met

The artifact evidence records:

- source commit `fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5`;
- `sourceState: working-tree`;
- `cleanCheckout: false`.

The current tree contains a large set of modified and untracked roadmap files. Creating a commit, choosing which changes belong to it, or rewriting user-owned changes requires explicit authorization. Until the intended state is committed and the artifact is regenerated from that exact clean checkout, S2-C7 cannot be marked PASS.

## Not run

- The Python browser suite could not start because `playwright.sync_api` is unavailable in the bundled Python runtime. The corresponding required browser paths were exercised by the green Node/Playwright suite; this is an environment limitation, not an observed application regression.
- Desktop-wrapper packaging is not planned by the current release matrix; Desktop/Web Distribution is the scoped deliverable.
- Human gameplay assessment is not claimed.

## Residual risks

- Optional artwork/audio candidate URLs can return fallback-domain 404 responses. Required assets are checksum-gated and the declared fallbacks work; future asset additions must be reclassified.
- The canonical build metadata still identifies `C2-STABLE-1-F9W2d4a-APK-M4c` / `Inspector Position Ownership Hotfix`. The final S2-RC version label must be selected before publication.
- CI success on the artifact’s exact source commit is an S2-RC prerequisite and has not been evidenced locally.
