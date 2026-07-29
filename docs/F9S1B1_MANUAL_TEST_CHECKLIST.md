# F9S1b1 — Checklist manuale

Build attesa: `C2-STABLE-1-F9S1b1-APK-M4c`

Baseline ufficiale durante il collaudo: `C2-STABLE-1-F9S1b-APK-M4c`

## 1. Avvio e regressione F9S1b

- [ ] La versione F9S1b1 compare nel menu, HUD e log esportato.
- [ ] Il precheck termina senza problemi o warning inattesi.
- [ ] Ogni fazione conserva 40 carte: 23 unità, 14 tattiche e 3 Missioni.
- [ ] Le cinque Pivot alternative mantengono dati, abilità e associazioni grafiche validate in F9S1b.
- [ ] I deck ufficiali precedenti restano validi e invariati.
- [ ] Il limite di una sola Pivot complessiva per deck è ancora applicato.

## 2. Selezione di tutti i deck custom

Preparare, nella stessa fazione, almeno due deck validi associati a comandanti differenti.

- [ ] Aprendo Nuova partita e scegliendo la fazione, il selettore mostra tutti i deck salvati validi della fazione.
- [ ] I deck non scompaiono quando il comandante corrente del Setup è diverso dal comandante del deck.
- [ ] Ogni opzione mostra nome deck, comandante e numero di carte in modo riconoscibile.
- [ ] Selezionando un deck salvato, il comandante viene sincronizzato automaticamente.
- [ ] In modalità deck salvato il selettore del comandante è disabilitato.
- [ ] Tornando alla modalità Starter/template il selettore del comandante torna modificabile.
- [ ] Cambiando fazione, l’elenco deck viene aggiornato senza mantenere deck della fazione precedente.
- [ ] Un deck invalido non permette di iniziare la partita e mostra la causa reale.
- [ ] Un deck valido da 30 carte con Pivot alternativa avvia correttamente la partita.
- [ ] La Missione contenuta nel deck selezionato viene caricata correttamente.
- [ ] Il deck scelto per ciascun lato viene rispettato anche in partite con 3–4 giocatori.

## 3. Central hotspot

- [ ] Compare fra le mappe ufficiali come mappa da 3 giocatori.
- [ ] Mostra 439 celle, 8 PS e movimento ×3.
- [ ] I tre QG sono corretti e assegnati ai rispettivi giocatori.
- [ ] Il PS centrale è `[0,-3,3]` ed è riconoscibile come PS★.
- [ ] Il centro risulta equidistante 13 da tutti i QG.
- [ ] Lo sfondo `ruins.webp` è visibile, correttamente allineato e non deformato.
- [ ] Standard avvia la Pressione al round 26.
- [ ] Rapida avvia la Pressione al round 20 e termina al round 36.
- [ ] Servono 4 PS complessivi, compreso il centro, per incrementare la Pressione.

## 4. Plains 2G large

- [ ] Compare fra le mappe ufficiali come mappa 1v1.
- [ ] Mostra 313 celle, 7 PS e movimento ×2.
- [ ] I due QG sono corretti.
- [ ] Il PS centrale è `[0,5,-5]` ed è riconoscibile come PS★.
- [ ] Il centro risulta equidistante 12 da entrambi i QG.
- [ ] Lo sfondo `plains.webp` è visibile e coerente con griglia e offset.
- [ ] Standard avvia la Pressione al round 25.
- [ ] Rapida avvia la Pressione al round 20 e termina al round 35.
- [ ] Servono 4 PS complessivi, compreso il centro, per incrementare la Pressione.

## 5. La Trappola

- [ ] Compare fra le mappe ufficiali come mappa da 4 giocatori.
- [ ] Mostra 151 celle, 7 PS e movimento ×1.
- [ ] I quattro QG sono corretti.
- [ ] Il PS centrale è `[0,0,0]` ed è riconoscibile come PS★.
- [ ] Il centro risulta equidistante 7 da tutti i QG.
- [ ] Lo sfondo `trap.webp` è visibile con scala 0,95 e senza vuoti anomali.
- [ ] Ostacoli, celle difficili, difensive ed esposte coincidono con la mappa esportata.
- [ ] Standard avvia la Pressione al round 26.
- [ ] Rapida avvia la Pressione al round 20 e termina al round 36.
- [ ] Servono 4 PS complessivi, compreso il centro, per incrementare la Pressione.

## 6. Sfondo e caricamento statico

- [ ] Le tre mappe funzionano senza dipendere dal dataUrl originale.
- [ ] Ricaricando la pagina, gli sfondi restano disponibili.
- [ ] Passando rapidamente fra mappe non appaiono sfondi residui della mappa precedente.
- [ ] Fit, focus e zoom funzionano su desktop.
- [ ] Fit, focus e zoom funzionano su Android/WebView.
- [ ] Nessun asset WebP produce errore 404 o errore console.

## 7. Partite di prova con nuove Pivot

- [ ] Creare almeno un deck custom per fazione contenente la Pivot alternativa.
- [ ] Selezionare ciascun deck direttamente da Nuova partita senza dover sovrascrivere il deck memorizzato precedente.
- [ ] Verificare che la carta Pivot corretta sia effettivamente nel mazzo in partita.
- [ ] Giocare almeno una partita su una nuova mappa con una Pivot alternativa.
- [ ] I bot possono usare deck custom selezionati senza freeze.
- [ ] Nessuna mappa grande produce rallentamenti anomali rispetto a F9O7h2/F9O7h3.

## 8. Camera — controllo aperto

- [ ] Impostare manualmente zoom e posizione della camera.
- [ ] Aprire e chiudere menu inferiori, Pool carte o schermate secondarie.
- [ ] Tornare alla mappa e verificare che la camera non venga resettata inaspettatamente.
- [ ] Cambiare mappa nel Setup e verificare che il fit iniziale sia corretto.
- [ ] Riprendere un salvataggio e verificare la camera secondo il comportamento previsto.

## 9. Android reale

- [ ] Creare l’APK F9S1b1 e installarlo su un dispositivo reale.
- [ ] Il selettore deck mostra elenchi lunghi senza tagliare le opzioni.
- [ ] Il cambio automatico del comandante è immediatamente visibile.
- [ ] Le tre nuove mappe e i relativi sfondi vengono caricati correttamente.
- [ ] La Trappola resta leggibile nonostante la densità di ostacoli.
- [ ] Central hotspot e Plains non causano freeze durante i turni bot.
- [ ] Pan, zoom e menu inferiori non resettano la camera in modo anomalo.
- [ ] Salvataggio, ripresa ed esportazione log funzionano.
