# Arena Rubra – F9E HUD & Tactical Panel Flow

Build: `C2-STABLE-1-F9E-APK-M4c`
Base: `C2-STABLE-1-F9D1-APK-M4c`

## Obiettivo

Consolidare la HUD superiore e rendere più fluido il rapporto tra pannelli tattici e selezione su mappa.

La regola UI introdotta è: quando una scelta richiede la mappa, il pannello che ha avviato l'azione deve togliersi di mezzo senza cancellare il pending logico.

## Interventi

1. Aggiunto chip HUD `gameHudMode`.
2. La HUD comunica la modalità attiva:
   - pronto;
   - unità selezionata;
   - movimento;
   - sbarco;
   - costruzione;
   - abilità;
   - tattica;
   - vittoria.
3. Aggiunto helper UI `closeHandPanelAfterAcceptedCardPlay()`.
4. `beginHandCardPlay()` e `beginHandTacticCardPlay()` chiudono la Mano solo dopo azione accettata.
5. Aggiunto helper UI `closeActionsPanelAfterAcceptedTactic()`.
6. `toggleTacticMode()` chiude Azioni quando entra in targeting o usa una tattica immediata.
7. PanelManager distingue pannelli desktop:
   - `side`: Mano, Azioni;
   - `bottom`: Log, Setup, Stats, Market legacy.
8. CSS desktop aggiornato per tenere i pannelli non attivi ridotti/nascosti e richiamabili da action bar.

## Garanzie

La chiusura dei pannelli è puramente visuale. Non altera:

- `mode`;
- `pendingHandCardUid`;
- `pendingPurchaseBlueprintId`;
- `pendingBuildBlueprintId`;
- `pendingTacticId`;
- regole di sbarco, bersaglio, danno o tattiche.

## Non modificato

Nessuna modifica a gameplay, AI, deck rules, tattiche, mappa, roster, statistiche/unità o no-overflow damage rule.
