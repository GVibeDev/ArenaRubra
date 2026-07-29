# F9U3 — Checklist manuale Control Center

## Desktop

- [ ] Il menu mostra esattamente cinque aree: Gioca, Carte e deck, Mappe, Analisi, Sistema.
- [ ] Tutti i pulsanti aprono la schermata o il pannello corretto.
- [ ] Riprendi è disabilitato senza partita e mantiene icona/titolo/sottotitolo.
- [ ] Versione completa, baseline e schema telemetrico sono corretti.
- [ ] Deck ufficiali = 50 e mappe ufficiali = 9.
- [ ] Lo spazio archivio viene calcolato senza bloccare il menu.
- [ ] L’ultimo match coincide con il primo record della cronologia persistente.
- [ ] Lo stato diagnostico distingue errori bloccanti e avvisi di fallback.

## Pannelli

- [ ] Archivio mappe mostra tutte le mappe e la validazione.
- [ ] `Gioca` apre il Setup con la mappa scelta.
- [ ] `Copia in Editor` apre una copia modificabile delle mappe ufficiali.
- [ ] Statistiche, Cronologia, Telemetria e Log non alterano i dati.
- [ ] Copia/Esporta producono payload completi.
- [ ] Impostazioni audio/SFX/movimento aggiornano i controlli già esistenti.
- [ ] Debug esegue il precheck completo e mostra backend, migrazione ed errori runtime.
- [ ] Import/Export crea e ripristina un backup del vault; le chiavi sconosciute sono ignorate.

## Modalità sviluppatore

- [ ] Nella candidata F9U3 Debug è visibile al primo avvio.
- [ ] Disattivando Modalità sviluppatore Debug scompare.
- [ ] Riattivandola Debug torna visibile.
- [ ] La preferenza persiste dopo ricarica.

## Android / touch

- [ ] Nessun overflow orizzontale nel menu a 390 px.
- [ ] Le cinque aree diventano una colonna leggibile.
- [ ] La plancia di stato diventa una colonna.
- [ ] I pannelli occupano il viewport senza uscire dallo schermo.
- [ ] Tabelle e JSON scorrono internamente senza allargare la pagina.
- [ ] Scrim, pulsante Chiudi ed Escape/Back chiudono il pannello senza cambiare schermata.

## Regressioni bloccanti

- [ ] Nuova partita e Setup funzionano.
- [ ] Tutorial si apre.
- [ ] Deck Builder, Pool carte, Card Editor e Map Editor si aprono.
- [ ] Nessuna modifica a regole, deck, mappe, IA o schema telemetrico.
- [ ] Precheck completo senza problemi bloccanti.
