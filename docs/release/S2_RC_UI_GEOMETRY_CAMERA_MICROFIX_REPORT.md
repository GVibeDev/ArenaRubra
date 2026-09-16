# S2-RC UI geometry and camera microfix report

Status: **PASS (working tree)** — 2026-09-16.

The two reported RC regressions are corrected without HUD redesign, gameplay changes, resolution-specific offsets or inspector width changes. Validation was performed from baseline commit `7f75ca6e742f99fec769c3496069a9da8f5087ce` on branch `release/starter-1.0-rc1`.

## Root cause and correction

### FIX A — Header, HUD and inspector vertical ownership

Before the change, desktop CSS independently positioned the HUD with `position: sticky; top: 58px`. The title header was in normal flow and its real rendered height varied by locale, while the inspector used a separate fixed `top: 72px` reference.

Pre-fix measurements:

| Viewport | Locale | Header top/bottom/height | HUD top/bottom/height | Inspector top/bottom | Board top/height | Gap | HUD/board overlap |
|---|---|---:|---:|---:|---:|---:|---:|
| 1050×848 | IT | 0 / 91 / 91 px | 149 / 265 / 116 px | 72 / 834 px | 217 / 684 px | 58 px | 48 px |
| 1050×848 | EN | 0 / 97.594 / 97.594 px | 155.594 / 271.594 / 116 px | 72 / 834 px | 223.594 / 684 px | 58 px | 48 px |
| 1920×1080 | IT | 0 / 91 / 91 px | 149 / 265 / 116 px | 72 / 1066 px | 217 / 916 px | 58 px | 48 px |
| 1920×1080 | EN | 0 / 97.594 / 97.594 px | 155.594 / 271.594 / 116 px | 72 / 1066 px | 223.594 / 916 px | 58 px | 48 px |

This also placed 48 px of the HUD over the board. The defect was therefore caused by two different vertical coordinate systems, not by locale-specific content or a missing spacer.

The header and HUD now belong to one sticky `.gameTopStack`. The HUD follows the header in document flow with no offset. The inspector receives the measured header bottom through `--game-header-bottom`, updated after render and on real window, orientation or language layout changes. Its existing right position and 420 px width are unchanged; only its available vertical maximum follows the actual header boundary so it remains inside the viewport.

Post-fix measurements:

| Viewport | Locale | Header top/bottom/height | HUD top/bottom/height | Inspector top/bottom | Board top/height | Gap | HUD/board overlap |
|---|---|---:|---:|---:|---:|---:|---:|
| 1050×848 | IT | 0 / 91 / 91 px | 91 / 207 / 116 px | 91 / 834 px | 217 / 684 px | 0 px | 0 px |
| 1050×848 | EN | 0 / 97.594 / 97.594 px | 97.594 / 213.594 / 116 px | 97.594 / 834 px | 223.594 / 684 px | 0 px | 0 px |
| 1920×1080 | IT | 0 / 91 / 91 px | 91 / 207 / 116 px | 91 / 1066 px | 217 / 916 px | 0 px | 0 px |
| 1920×1080 | EN | 0 / 97.594 / 97.594 px | 97.594 / 213.594 / 116 px | 97.594 / 1066 px | 223.594 / 916 px | 0 px | 0 px |

The correction is not viewport- or locale-specific: it removes the independent HUD offset and gives the header, HUD and inspector a shared measured boundary. There are no negative margins, transforms, resolution breakpoints or IT/EN overrides.

### FIX B — Selection must not own camera updates

No board `ResizeObserver` exists in the runtime. The demonstrated pre-fix chain was:

`unit click → handleCellClick → renderAll → inspector/HUD render → syncBoardCameraAfterRender → applyBoardCamera`

`syncBoardCameraAfterRender` invoked `applyBoardCamera` after every render even when the board geometry signature and map id were unchanged. A unit or terrain selection therefore re-applied the camera transform as an indirect side effect of inspector refresh.

The render synchronization now writes the camera transform only when the board geometry or map actually changes. Geometry-stable renders update camera controls/HUD only. Initialization, map change, explicit fit, genuine resize and direct camera interaction retain their existing paths.

## Files changed

- `index.html`: structural owner for the desktop header/HUD stack.
- `css/style.css`: sticky stack ownership; removed the HUD's independent 58 px offset.
- `css/layout/game_inspector.css`: inspector vertical reference follows the measured header boundary.
- `src/game_screen.js`: maintains the shared header-bottom layout variable without invoking board or camera code.
- `src/camera.js`: prevents camera application on geometry-stable render synchronization.
- `tests/s2_rc_browser_ui_microfix_smoke.js`: dedicated browser regression contract for both fixes.

## Acceptance evidence

The dedicated browser smoke ran in IT and EN at 1050×848, 1366×768, 1600×900 and 1920×1080.

- Header → HUD gap: 0 px in all eight combinations.
- Header → inspector gap: 0 px in all eight combinations.
- HUD and inspector top alignment: exact in all eight combinations.
- Board starts 10 px below the HUD; no overlap.
- No horizontal page overflow.
- HUD chips and both PS/UNITÀ comparison counters remain inside their owning rows with `scrollWidth <= clientWidth`.
- Manual camera used for the test: `zoom=1.55`, `panX=73`, `panY=-51`, mode `manual`.
- Ten units from five factions were selected at alternating map extremes in each locale.
- Unit → terrain → unit and IT → EN transitions were exercised.
- Inspector selections produced three distinct content heights.
- Viewport dimensions, zoom, pan, fit scale, total scale, camera mode and computed board transform remained identical around every geometry-stable selection.
- Camera style mutations caused by selection: 0.
- Every new game initializes the camera in Fit mode with centered pan and `zoom=1`.
- The explicit Fit control changes the distinguishable manual camera back to Fit, centered pan and `zoom=1`; its 180 ms visual transition is allowed to complete before transform verification.
- A real browser viewport resize changes the measured board viewport while retaining manual mode and zoom. Pan is retained when geometrically valid and otherwise equals the minimum boundary clamp; no automatic full fit occurs.
- Browser page errors: 0.

The same dedicated smoke and the existing S2-C7 HUD geometry smoke also passed against the staged Distribution profile.

## Verification executed

- Complete JavaScript/Node smoke gate — **PASS: 183/183**.
- Complete Python/browser smoke gate — **PASS: 71/71**.
- S2-C7 regression matrix — **PASS: 30 coverage rows, 10 manifest-driven maps**.
- Locale parity — **PASS: 2381 keys × 2 languages; 1097 runtime bindings**.
- Frozen content localization — **PASS: 701 fields × 2 languages**.
- Required assets — **PASS: 69 required; 472 classified**.
- Documentation freeze — **PASS**.
- S2-RC readiness consistency check — **PASS** for the previously recorded immutable RC evidence.
- Distribution staging profile — **PASS**; 12 DEV modules excluded.
- Dedicated microfix smoke on staged Distribution — **PASS**.
- Existing S2-C7 HUD geometry smoke on staged Distribution — **PASS**.
- `git diff --check` — **PASS**.

## Not run and release provenance

- No commit, push, deployment, tag or release declaration was performed for this working-tree microfix.
- No canonical artifact manifest, checksum list or CI evidence was overwritten. The existing S2-RC provenance still refers to its previous immutable commit and must not be presented as evidence for this uncommitted patch.
- A clean-checkout artifact and matching CI/deployment evidence require an authorized commit followed by the normal RC publication pipeline.
- Human visual/gameplay approval is not claimed by automated acceptance tests.

## Residual risk

Automated desktop and existing mobile browser coverage is green. The remaining release risk is operational provenance: until the patch is committed and rebuilt from that immutable SHA, it is validated locally but is not yet the published RC artifact.
