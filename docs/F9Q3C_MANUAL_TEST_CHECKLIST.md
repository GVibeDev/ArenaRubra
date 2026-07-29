# F9Q3c — Checklist manuale

## Desktop/browser

- [ ] Aprire Editor mappe e caricare una mappa custom.
- [ ] Importare un PNG.
- [ ] Sostituirlo con JPEG o WebP.
- [ ] Verificare preview immediata.
- [ ] Provare `cover`, `contain` e `native`.
- [ ] Modificare opacità, scala e offset X/Y.
- [ ] Salvare la mappa, tornare al menu e riaprirla.
- [ ] Verificare che immagine e regolazioni persistano.
- [ ] Avviare Match Lab e verificare lo stesso sfondo.
- [ ] Avviare una partita normale con la mappa custom.
- [ ] Verificare terreno, QG, PS, token e badge sopra lo sfondo.
- [ ] Rimuovere lo sfondo e verificare il ritorno alla skin standard.
- [ ] Esportare JSON leggero e verificare che non contenga il Data URL.
- [ ] Esportare JSON portatile e reimportarlo dopo aver eliminato la mappa locale.
- [ ] Verificare che il portatile ricrei anche l’immagine.
- [ ] Provare file non immagine e file oltre 12 MiB: devono essere rifiutati.
- [ ] Provare una mappa con riferimento asset mancante: deve restare giocabile.

## Android/APK

- [ ] Aprire il selettore file dalla WebView.
- [ ] Importare PNG/JPEG/WebP dalla memoria del telefono.
- [ ] Verificare preview e controlli touch.
- [ ] Chiudere completamente l’app e riaprirla.
- [ ] Verificare persistenza di mappa e immagine.
- [ ] Avviare Match Lab e partita normale.
- [ ] Controllare pan/zoom con immagine attiva.
- [ ] Controllare orientamento landscape e resize.
- [ ] Provare un’immagine vicina al limite di 12 MiB e osservare memoria/prestazioni.
- [ ] Esportare JSON portatile e verificare download/condivisione.
- [ ] Importare il JSON portatile dopo una reinstallazione o pulizia dati di test.

## Regressioni

- [ ] MAP1 senza background custom resta invariata.
- [ ] MAP2 e MAP3 built-in mantengono skin e background esistenti.
- [ ] Badge terreni, tintura celle e bandiere PS restano leggibili.
- [ ] Camera F9Q3a raggiunge tutti i bordi.
- [ ] Local Data Vault continua a salvare carte, deck, mappe e statistiche.
- [ ] Tutorial 1–5 si avviano e non usano sfondi custom involontariamente.
