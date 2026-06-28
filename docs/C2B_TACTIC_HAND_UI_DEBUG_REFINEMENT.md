# C2b – Tactic Hand UI / Debug Refinement

## Base

`arena_rubra_C2a_a_pivot_sanity_hotfix.zip`

## Obiettivo

Rendere leggibili in mano le tattiche C2 già presenti nel deck/hand, senza renderle ancora giocabili.

## Modifiche

- `data/cards_base.js`
  - versione aggiornata a C2b;
  - mode aggiornato a `tactic_hand_ui_debug_refinement`.

- `src/render.js`
  - aggiunta visualizzazione dettagliata per carte tattica:
    - qualità;
    - categoria;
    - bersaglio;
    - target side;
    - raggio;
    - durata;
    - condition;
    - effectKind;
    - effectText;
    - note;
    - stato data-only.

- `src/deployment.js`
  - pulsante tattica ancora disabilitato;
  - testo aggiornato a `Tattica C2b data-only`.

- `css/style.css`
  - aggiunti stili leggeri per distinguere le tattiche dalle unità nella mano debug.

## Non modificato

- Nessun effetto tattica è stato implementato.
- Nessun targeting tattica da mano è stato attivato.
- Nessuna modifica ad AI, economia, unità, deck generation o vecchio pannello tattiche.

## Controlli

- JS check: OK
- missing scripts: none
- duplicate function definitions: none
- duplicate blueprint IDs: none
- duplicate deck tactic IDs: none
- deck tactic total: 59/59
- deck tactic counts: Nexus 12/12, Exordium 12/12, Liberti 14/14, Agathoi 9/9, Fabeot 12/12
- pivot counts: Nexus 1, Exordium 1, Liberti 1, Agathoi 1, Fabeot 1
- distinct pool counts: Nexus 30, Exordium 30, Liberti 30, Agathoi 30, Fabeot 30
- C2b config version: True
- C2b mode: True
- deployment keeps tactics disabled: True
- render tactic helper present: True
- CSS tactic debug present: True
