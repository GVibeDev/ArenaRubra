# CSS ownership during AR-AC1

| Surface | Canonical owner | Compatibility status |
| --- | --- | --- |
| Desktop selected-unit Inspector geometry | `layout/game_inspector.css` | Extracted from the end of `style.css`; loaded afterward |
| Theme colors, material, borders and ornaments | `src/ui.js` theme layer | Must not assign Inspector position or geometry |
| Mobile M4 Inspector geometry | `style.css` | Frozen legacy bundle until its own characterized extraction |
| Remaining shell, game, cards, editors, tutorial and responsive rules | `style.css` | Historical compatibility bundle; extract one characterized surface at a time |

The release may continue to ship the legacy bundle. New structural overrides must declare one owner and must not be added to theme code.
