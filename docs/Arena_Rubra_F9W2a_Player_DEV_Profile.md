# Arena Rubra — F9W2a Player / DEV Runtime Profile Foundation

Build candidate: `C2-STABLE-1-F9W2a-APK-M4c`  
Required base: `C2-STABLE-1-F9W1a-APK-M4c` VALIDATA  
Logical baseline: `C2-STABLE-1-F9T2c4-APK-M4c`

## Objective

F9W2a starts S2-C4 and turns the previous ad-hoc `developerMode` visibility toggle into an explicit product-profile contract. Arena Rubra keeps one runtime and one codebase. The profile changes what the product exposes; it does not create a second gameplay implementation.

The candidate deliberately defaults to `dev` and remains switchable so the development build can test both product surfaces. A later Distribution build can set `productProfileDefault: "distribution"` and `productProfileSwitchable: false` in `BUILD_INFO`.

## Capability contract

| Capability | DEV | Demo / Distribution |
|---|---:|---:|
| Match / Setup / Resume | yes | yes |
| Tutorial / Challenge | yes | yes |
| Deck Builder | yes | yes |
| Card Pool | yes | yes |
| Player Statistics | yes | yes |
| Player History | yes | yes |
| Settings / Version | yes | yes |
| Card Editor | yes | no |
| Map Editor / Match Lab | yes | no |
| Custom maps in public Setup | yes | no |
| Raw Telemetry | yes | no |
| Technical Log | yes | no |
| Debug / Precheck | yes | no |
| Expert experimental AI selector | yes | no |
| Full-vault Import / Export | yes | no |
| Layout Calibration Lab | yes | no |
| Renderer Calibration Lab | yes | no |

The Distribution profile also guards direct UI entrypoints; it is not only a CSS hide. The profile is nevertheless an exposure contract, not a security boundary: DEV modules intentionally remain loaded in the single runtime.

## Calibration preservation

Two calibration tools are preserved as permanent DEV workshop tools:

1. **Layout Calibration Lab** — menu geometry, spacing, map presentation, skin and token preview.
2. **Renderer Calibration Lab** — card text/stat geometry and renderer preview overrides.

Both are reachable from the Control Center Debug panel in DEV. Their storage helper functions are rebound to the Arena Storage facade when available, so calibration changes use the same Data Vault path as the rest of the application instead of bypassing OPFS/IndexedDB through direct `localStorage` only.

## Distribution surface

When Distribution is active, Card Editor, Map Editor, raw Telemetry, technical Log, Debug, calibration buttons/panels, Expert options and full-vault transfer are hidden and their primary entry functions are guarded. Custom map options are filtered from Setup and map-archive DEV edit actions disappear.

The Result Modal keeps Player-facing `Statistiche` but hides `Log` and `Telemetria`. Switching back to DEV restores controls without forcibly opening UI components that were naturally closed before the profile transition.

## Compatibility

F9W2a is layered inside `src/ui.js`, which is already the F9W1a overwrite point. Existing Control Center, AppShell, result-modal and calibration functions are wrapped late in load order rather than duplicated or forked. F9W1a Match Data 2.0 remains unchanged and its regression smoke still passes.

No gameplay rule, card, cost, deck rule, official map, Mission, AI decision rule, Pressure/QG rule, Tutorial action contract or balance value is changed by F9W2a.

## Manual validation gate

On the full project, validate at minimum:

1. DEV default boots with Card Editor, Map Editor, Telemetry, Log and Debug visible.
2. Debug opens both Layout Calibration and Renderer Calibration.
3. Disable `Profilo DEV` in Settings: the UI switches to Demo / Distribution without reload.
4. In Distribution, New Game, Tutorial, Deck Builder, Card Pool, Statistics, History, Settings and Version remain accessible.
5. Card Editor, Map Editor, raw Telemetry, Log, Debug, calibration, Expert and full-vault transfer are absent/inaccessible.
6. Result Modal exposes Statistics but not Log/Telemetry.
7. Official maps remain selectable; custom maps are not offered in Distribution.
8. Switch back to DEV: hidden tools return and closed popovers remain closed.
9. Restart after persisting each profile and verify preference restoration in this candidate.
10. Run a normal match in both profiles to confirm identical gameplay behavior.
