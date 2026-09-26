# S2-C7 — Release regression and artifact gate

Status: **PASS** — 2026-09-13.

Evidence scope note:

The counts in the original S2-C7 section — including **472 classified assets** and **556 payload files** — describe the immutable clean RC1 artifact produced from commit `42f055fc4088f1410ec0ef288111da8383209be8`.

They are retained as historical provenance and must not be rewritten to impersonate later source state.

Current-main post-RC evidence is recorded separately below.

The complete technical regression is green. The final Distribution artifact was regenerated from clean commit `42f055fc4088f1410ec0ef288111da8383209be8`, and its embedded inventory, checksums, runtime profile and browser behavior all pass. GitHub Actions run `34779658530` completed successfully for the same commit, including build and GitHub Pages deployment.

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
- Complete source-tree JavaScript smoke suite — PASS: 182/182 checks, including the Node/Playwright Golden Match, HUD geometry and release-matrix tests. The post-staging artifact-final smoke also passes independently.
- Complete Python/browser smoke suite — PASS: 71/71 checks in GitHub Actions, including the Agathoi image-tone smoke with its declared Pillow dependency.
- Golden Matches — PASS: five deterministic fixtures, each repeated with the expected hash; 2P/3P/4P paths cover 40/60/80 action turns.
- Browser release matrix, source tree — PASS: all 10 official maps and five player/bot configurations; startup about 16.0 s, initialization 36–64 ms, rendering 4–11 ms, bot turns about 515–531 ms, bounded heap growth and no non-fallback runtime errors.
- Browser release matrix, staged artifact — PASS: equivalent Distribution coverage; startup 15.7 s, map initialization 71–124 ms, rendering 8–24 ms, bot turns 545–584 ms, heap growth about 15.4 MB, no overflow or non-fallback runtime errors.
- Required-assets gate — PASS: 69 required assets present and integrity-checked; all 472 repository assets classified.
- Distribution staging gate — PASS: 99/99 checks.
- Final artifact smoke — PASS: 556 payload files, 151,157,695 bytes, exact checksums, licenses, Distribution boot, `1.0.0-rc.1` metadata, English flow, new game and precheck; no DEV requests or page errors.
- DOC-FREEZE and frozen content/localization gates — PASS; catalog hash remains `eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709`.
- Clean-checkout CI and deploy — PASS: workflow run `34779658530`, build job `103784209811` and deploy job `103787214013` all concluded successfully for `42f055f`.

## Clean-checkout provenance

The artifact evidence records:

- source commit `42f055fc4088f1410ec0ef288111da8383209be8`;
- `sourceState: clean-checkout`;
- `cleanCheckout: true`;
- build version `1.0.0-rc.1`.

The packaging provenance requirement is satisfied. The evidence manifest and SHA-256 file enumerate the exact artifact produced from that immutable commit.

## Not run

- Desktop-wrapper packaging is not planned by the current release matrix; Desktop/Web Distribution is the scoped deliverable.
- Human gameplay assessment is not claimed.

## Residual risks

- Optional artwork/audio candidate URLs can return fallback-domain 404 responses. Required assets are checksum-gated and the declared fallbacks work; future asset additions must be reclassified.
- Automated technical readiness and publication do not replace the outstanding human gameplay and release approval process.

## Post-RC revalidation — 2026-09-26

Current `main`:

`6c6cf3e61887fb9fc18b9a1ba543baff59cbba09`

GitHub Actions run:

`36233581578`

Observed results:

- Node behavior suite: **183/183 PASS**
- Python/browser suite: **71/71 PASS**
- S2-C6 browser visual gate: **PASS**
- S2-C6 static presentation gate: **PASS**
- required assets: **69 required / 474 classified**
- staged DEV profile: **PASS**
- staged Distribution profile: **PASS**
- staged Distribution browser boot: **PASS**
- staged release matrix: **PASS**
- final artifact smoke: **PASS**
- generated payload: **558 files**
- generated payload bytes: **150,979,214**
- version: `1.0.0-rc.1`
- deploy: **PASS**

GitHub Pages artifact:

- ID: `10903702423`
- archive bytes: **147,130,366**
- SHA-256:
  `117b15ce6bbf50206e2856f74c82c2872f676926641536a18945e52582a9e3b7`

The generated post-RC artifact records:

```text
sourceState: working-tree
cleanCheckout: false
```

This proves current-main regression and deployment health but does not supersede the canonical clean-checkout artifact provenance.

Final Starter 1.0 promotion requires clean artifact evidence generated from the final immutable source commit.
