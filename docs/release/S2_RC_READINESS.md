# S2-RC — Readiness gate

Status: **PASS** — 2026-09-13.

Current-main revalidation: **PASS — 2026-09-26**.

The original RC1 evidence below remains the immutable clean-checkout provenance for commit `42f055fc4088f1410ec0ef288111da8383209be8`.

Later post-RC stabilization has also passed the complete GitHub Actions pipeline on current `main`, but that later run is recorded separately because its generated artifact reports `sourceState: working-tree` / `cleanCheckout: false` and therefore must not silently replace the original clean provenance.

S2 automated release-candidate readiness is complete. Implementation, freeze, localization, presentation, technical regression, clean-checkout artifact, CI and authorized GitHub Pages deployment gates are green for commit `42f055fc4088f1410ec0ef288111da8383209be8`. Human gameplay and final release approval are not claimed by this gate.

## Milestone state

| Milestone | State | Evidence |
|---|---|---|
| AR-P0 | PASS | Repository baseline and roadmap constraints established. |
| S2-C5a | PASS | `docs/architecture/S2_C5A_CONTENT_FREEZE_REPORT.md` |
| AR-AC1 | PASS | `docs/architecture/AR_AC1_CLOSURE_REPORT.md` |
| S2-C5b | PASS | `docs/localization/S2_C5B_FULL_ENGLISH_LOCALIZATION.md` |
| S2-C6 | PASS | `docs/presentation/S2_C6_VISUAL_ASSET_PRESENTATION_GATE.md` |
| DOC-FREEZE | PASS | `docs/release/S2_DOC_FREEZE.md` |
| S2-C7 technical regression | PASS | `docs/release/S2_C7_RELEASE_REGRESSION.md` |
| S2-C7 clean-checkout provenance | PASS | Artifact manifest records `42f055fc…`, `cleanCheckout: true`, and `1.0.0-rc.1`. |
| S2-RC CI alignment | PASS | `docs/release/S2_CI_EVIDENCE.json` records successful build and deploy jobs for `42f055fc…`. |

## Automated readiness blockers

None.

The RC identity is assigned as `1.0.0-rc.1` / `Starter 1.0 Release Candidate 1`.

GitHub Actions run `34779658530` completed successfully on 2026-09-13. Its build and deploy jobs passed, and the published Desktop/Web Distribution responds from `https://gvibedev.cc/ArenaRubra/`.

## Verification command

`node tools/check_s2_rc_readiness.js`

The command is expected to pass. The authorized GitHub Pages publication has completed; no tag, final-release declaration or human validation is asserted.

## Release discipline

- Bugfix-only stabilization begins after the S2-RC gate passes.
- Any change to frozen content, rules, localization catalogs, required assets or official maps reopens the corresponding upstream gate.
- Any future publication candidate requires a clean artifact and CI result tied to the same immutable source commit.

## Post-RC current-main revalidation — 2026-09-26

Commit:

`6c6cf3e61887fb9fc18b9a1ba543baff59cbba09`

GitHub Actions:

- workflow run: `36233581578`
- build job: **PASS**
- deploy job: **PASS**
- Node smoke gate: **183/183 PASS**
- Python/browser smoke gate: **71/71 PASS**
- required assets: **69 required / 474 classified**
- staged DEV profile: **PASS**
- staged Distribution profile: **PASS**
- Distribution browser boot: **PASS**
- Distribution release matrix: **PASS**
- final artifact smoke: **PASS**
- generated Distribution payload: **558 files / 150,979,214 bytes**
- GitHub Pages artifact ID: `10903702423`
- uploaded artifact SHA-256:
  `117b15ce6bbf50206e2856f74c82c2872f676926641536a18945e52582a9e3b7`

The generated artifact for this run reports:

```text
sourceCommit: 6c6cf3e61887fb9fc18b9a1ba543baff59cbba09
sourceState: working-tree
cleanCheckout: false
```

Therefore this run is accepted as current-main regression and deployment evidence, but **not** as replacement clean-checkout release provenance.

Final promotion still requires:

1. repository cleanup;
2. full CI after the cleanup commit;
3. clean artifact evidence tied to the final immutable source;
4. human gameplay / visual approval;
5. explicit Starter 1.0 final-release decision.
