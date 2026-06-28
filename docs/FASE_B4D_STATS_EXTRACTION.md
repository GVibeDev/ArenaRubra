# Arena Rubra – Fase B4d Stats Extraction

## Obiettivo

Spostare in `src/stats.js` il sistema di statistiche matchup, senza toccare gameplay o regole.

## File reso operativo

- `src/stats.js`

## Funzioni estratte

- `loadMatchStats`
- `saveMatchStats`
- `recordMatchResult`
- `matchupKey`
- `matchupLabel`
- `factionWinClass`
- `aggregateMatchStats`
- `formatWins`
- `formatTypes`
- `statsToCsv`
- `resetMatchStats`
- `copyMatchStatsCsv`

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI.
Nessun cambio combat/economia/stati/abilità/render.
Solo spostamento fisico delle funzioni statistiche.

## Dipendenze accettate

`stats.js` usa ancora funzioni globali:

- `updateControlFromOccupants`
- `countControlledPS`
- `combatUnits`
- `enemyOf`
- `log`
- `renderMatchupStats`
- `escapeHtml`

Sono accettabili in questa fase perché il progetto usa ancora script browser non-module.

## Prossimo step consigliato

B5a – Combat extraction prudente:

- danno;
- attacco;
- distruzione unità;
- Spine/Sanguinamento lato combattimento.
