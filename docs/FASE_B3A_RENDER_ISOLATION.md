# Arena Rubra – Fase B3a Render Isolation

## Obiettivo

Separare fisicamente le funzioni di rendering/UI/log DOM dal file principale, mantenendo invariato il gameplay.

## Nuovo file operativo

- `src/render.js`

## Funzioni estratte

- `renderAll`
- `renderBoard`
- `renderPanels`
- `renderTacticPanel`
- `renderMarket`
- `renderRoster`
- `renderMatchupStats`
- funzioni icona/token
- `initials`
- `clearLog`
- `appendLogLine`
- `log`
- `escapeHtml`

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI.
Nessun cambio combat/economia/stati.

## Nota

Il renderer non è ancora puro: legge ancora `state` e chiama funzioni globali del motore.
Questa fase serve a ridurre il main senza spezzare il tester.

## Prossimo step possibile

B3b:
- introdurre un piccolo `ui.js` per event listener DOM;
- oppure separare ulteriori helper UI;
- solo dopo passare a `state.js` e `rules.js`.
