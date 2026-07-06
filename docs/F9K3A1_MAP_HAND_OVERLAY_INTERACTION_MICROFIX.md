# F9K3a1 – Map Hand Overlay Interaction Microfix

Base: `C2-STABLE-1-F9K3a-APK-M4c`.

## Scopo
Rifinire l'overlay mano sulla mappa dopo il primo test F9K3a.

## Modifiche
- Le carte nell'overlay restano verticali e affiancate orizzontalmente.
- Le miniature sono leggermente più grandi rispetto a F9K3a.
- Le miniature dell'overlay non mostrano più testo extra: resta solo l'etichetta `Unità`, `Tattica` o `Comandante`.
- L'overlay mostra anche le starter card.
- Le starter card sono giocabili direttamente dall'overlay.
- Quando una carta viene accettata per sbarco/costruzione/tattica:
  - l'overlay si sposta sotto lo schermo;
  - resta libera l'area bassa della mappa;
  - compare una preview laterale destra con solo render carta e bottone `Annulla sbarco`;
  - le celle valide vengono evidenziate dalla logica già esistente del motore.
- Quando l'azione viene completata o annullata, l'overlay torna visibile.

## File modificati
- `index.html`
- `src/render.js`
- `css/style.css`
- `src/build_info.js`
- `src/game.js`
- `README.md`

## Non modificato
- gameplay
- AI
- deck rules
- bilanciamento
- Card Editor
- Card Pool
- custom art
- coordinate renderer F9K2d
- Starter Logic Freeze
