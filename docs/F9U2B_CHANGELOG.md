# Arena Rubra — F9U2b Card Editor & Map Editor Layout Reorganization

## Identità build

- Build candidata: `C2-STABLE-1-F9U2b-APK-M4c`
- Baseline logica validata: `C2-STABLE-1-F9U2a-APK-M4c`
- Canale: `f9u2b-candidate`
- Data: 29 luglio 2026
- Schema telemetrico invariato: `F9Q3e1-2`

## Obiettivo

Riorganizzare Card Editor e Map Editor senza modificare funzioni, contenuti o regole. La patch interviene sulla gerarchia visiva, sulla disposizione dei comandi e sulla leggibilità delle informazioni operative.

## Card Editor

- Toolbar divisa in azioni principali, strumenti dati e navigazione.
- Azioni principali: Nuova, Salva, Duplica, Elimina.
- Strumenti dati richiudibili: Calibra renderer, Copia JSON carta, Copia libreria.
- Navigazione separata verso Deck Builder, Pool carte e Menu.
- Stato e validazione raccolti in una barra compatta.
- Modulo di creazione separato visivamente in identità, statistiche, abilità e illustrazione/allineamento.
- Illustrazione e allineamento raccolti in una sezione apribile.
- Anteprima mantenuta affiancata e resa sticky su desktop.
- Libreria custom e scambio JSON mantenuti, ma separati in sezioni riconoscibili.
- Tutti gli ID e i gestori esistenti sono preservati.

## Map Editor

- Toolbar superiore ordinata in progetto, esportazione, cronologia/vista e navigazione.
- Azioni principali: Nuova, Salva, Importa.
- Export richiudibile: JSON leggero e JSON portatile.
- Annulla, Ripeti e Adatta raccolti nello stesso gruppo operativo.
- Nuova barra live orizzontale sotto la toolbar con:
  - stato di validazione;
  - nome mappa;
  - giocatori;
  - celle;
  - QG;
  - PS;
  - moltiplicatore movimento;
  - zoom;
  - strumento attivo;
  - cella selezionata.
- Workspace distribuito su tre aree:
  - sinistra: progetto, proprietà generali, sfondo custom, geometria e componenti;
  - centro: canvas della mappa;
  - destra: strumenti, opzioni, simmetria, cella selezionata, validazione e Match Lab.
- La barra live si aggiorna durante rendering, cambio strumento e selezione delle celle.
- Reflow browser sotto i 900 px in flusso verticale. Gli interventi APK Android restano rinviati alla patch dedicata post-beta.

## Elementi invariati

- Carte e pool dati.
- 50 deck ufficiali.
- Schermata Pool carte.
- Mappe ufficiali e custom già salvate.
- Regole, economia e combattimento.
- IA.
- Cartelle `data/` e `assets/`.
- Telemetria `F9Q3e1-2`.
- HUD di partita, Inspector e barre PS/unità.

## Stato

Candidata pronta per il collaudo utente. Non è una baseline validata finché non viene approvata dopo il test manuale.
