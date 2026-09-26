# Arena Rubra — S2 current-main revalidation

Date: 2026-09-26

Status: **PASS WITH PROVENANCE FOLLOW-UP**

## Source

- repository: `GVibeDev/ArenaRubra`
- branch: `main`
- commit:
  `6c6cf3e61887fb9fc18b9a1ba543baff59cbba09`
- product version: `1.0.0-rc.1`
- logic baseline:
  `C2-STABLE-1-F9T2c4-APK-M4c`
- target: Desktop / Web
- public AI ceiling: Advanced
- Expert AI: DEV / experimental

## Post-RC stabilization covered

- header / HUD / inspector vertical ownership;
- geometry-stable board-camera selection;
- faction-skin modular geometry refresh;
- Fabeot and Nexus crest restoration/classification;
- regenerated faction-skin bytes and SHA-256;
- visual inventory synchronized to 474 classified assets.

No gameplay, frozen content catalog, rules or public AI ceiling change is asserted by these presentation fixes.

## CI evidence

Workflow:

`Deploy Arena Rubra to GitHub Pages`

Run:

`36233581578`

Jobs:

- build `108381177704`: PASS
- deploy `108384237039`: PASS

## Validation

- Node smoke: **183/183 PASS**
- Python/browser smoke: **71/71 PASS**
- required assets:
  **69 required / 474 classified**
- frozen Starter content: PASS
- locale parity: PASS
- presentation locales: PASS
- staged DEV: PASS
- staged Distribution: PASS
- Distribution browser boot: PASS
- release matrix: PASS
- final artifact smoke: PASS

## Generated Distribution artifact

- source commit:
  `6c6cf3e61887fb9fc18b9a1ba543baff59cbba09`
- version: `1.0.0-rc.1`
- payload files: **558**
- payload bytes: **150,979,214**
- checksum rows: **559**
- GitHub Pages artifact ID:
  `10903702423`
- uploaded archive bytes:
  **147,130,366**
- artifact SHA-256:
  `117b15ce6bbf50206e2856f74c82c2872f676926641536a18945e52582a9e3b7`

## Provenance limitation

The generated artifact reports:

```json
{
  "sourceCommit":
    "6c6cf3e61887fb9fc18b9a1ba543baff59cbba09",
  "sourceState": "working-tree",
  "cleanCheckout": false
}
```

Consequently this run is accepted as current-main technical regression and deployment evidence.

It does **not** replace the original checked-in clean RC1 provenance:

- `docs/release/S2_C7_ARTIFACT_MANIFEST.json`
- `docs/release/S2_C7_SHA256SUMS.txt`
- `docs/release/S2_CI_EVIDENCE.json`

Those remain tied to clean immutable source:

`42f055fc4088f1410ec0ef288111da8383209be8`

## Release closure

Before final Starter 1.0 promotion:

1. remove repository debris;
2. rerun complete CI;
3. produce clean-checkout artifact evidence from the final source;
4. complete human gameplay / visual acceptance;
5. explicitly approve the final release.

This report does not declare final human validation.
