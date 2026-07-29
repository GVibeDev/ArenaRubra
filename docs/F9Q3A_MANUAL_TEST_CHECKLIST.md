# F9Q3a — Checklist manuale

Stato build: candidata, non validata dall'autore.

## Desktop — camera

- [ ] Avvia MAP1 e verifica fit, wheel, drag, focus QG/PS e click celle.
- [ ] Avvia MAP2 e MAP3 e raggiungi tutti i bordi a zoom elevato.
- [ ] Importa `tests/fixtures/custom_double_ms0cunhu.json` nell'Editor mappe.
- [ ] Avvia la fixture nel Match Lab.
- [ ] Porta a schermo QG 1, QG 2 e QG 3.
- [ ] Porta a schermo le celle estreme sinistra, destra, alta e bassa.
- [ ] Apri e chiudi Mano, Azioni, Log e Opzioni senza perdere la zona osservata.
- [ ] Ridimensiona la finestra e verifica che il pan resti valido.
- [ ] Durante il turno bot, usa pan/zoom e verifica che la camera non venga riposizionata.

## Android / touch — camera

- [ ] Test reale landscape con MAP2, MAP3 e fixture custom.
- [ ] Verifica pan fino ai quattro estremi.
- [ ] Verifica pinch, pulsanti Fit/Play/Focus e tap sulle celle dopo il pan.
- [ ] Apri i menu inferiori e verifica il ricalcolo dei limiti.
- [ ] Ruota il dispositivo e verifica che la mappa non diventi irraggiungibile.
- [ ] Verifica assenza di flicker, vuoti temporanei o perdita dei token.

## Persistenza locale

- [ ] Crea una carta custom con artwork, chiudi e riapri l'app.
- [ ] Crea un deck custom, chiudi e riapri l'app.
- [ ] Crea o importa una mappa custom, chiudi e riapri l'app.
- [ ] Gioca almeno una partita e verifica statistiche e cronologia dopo il riavvio.
- [ ] Verifica il chip backend nel menu principale.
- [ ] Esporta carta, deck, mappa e statistiche nei formati già disponibili.
- [ ] Reimporta gli export e verifica il round-trip.
- [ ] Aggiorna da una build con dati legacy e verifica che nessun contenuto scompaia.
- [ ] Con OPFS non disponibile, verificare fallback IndexedDB/localStorage su un ambiente di test.

## Menu principale

- [ ] Verifica desktop largo, desktop stretto, tablet, mobile landscape e mobile portrait.
- [ ] Nessun pulsante sovrapposto o troncato.
- [ ] Il menu scorre quando l'altezza non basta.
- [ ] `Nuova partita` è l'azione principale.
- [ ] Le quattro funzioni Studio aprono le schermate corrette.
- [ ] Audio, SFX e animazioni conservano il comportamento precedente.
- [ ] `Statistiche / log test`, `Informazioni versione` e `Opzioni / debug` restano disattivi.
- [ ] Layout Calibration Lab non compare senza `?dev=1`.
- [ ] Navigazione tastiera e focus visibile su desktop.

## Regressioni

- [ ] Smoke delle cinque lezioni tutorial.
- [ ] MAP1 mantiene 127 celle e gameplay invariato.
- [ ] Card Editor, Deck Builder, Pool carte e Map Editor funzionano.
- [ ] Resume partita funziona.
- [ ] Nessuna modifica inattesa a Missioni, IA, carte o terreni.
