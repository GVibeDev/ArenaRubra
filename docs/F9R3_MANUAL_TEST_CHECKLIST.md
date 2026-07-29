# F9R3 — Checklist manuale

Build: `C2-STABLE-1-F9R3-APK-M4c`

## 1. Setup e mappe

Per ciascuna mappa verificare che il setup mostri nome, numero giocatori, celle, PS, centro e movimento corretti.

- [ ] Campo Starter — 2G, 127 celle, 3 PS, centro `[0,0,0]`, MOV ×1
- [ ] Diamond 4 — 4G, 469 celle, 9 PS, centro `[0,0,0]`, MOV ×3
- [ ] Claustro Clash — 4G, 127 celle, 7 PS, centro `[0,0,0]`, MOV ×2
- [ ] Narrow Path — 2G, 229 celle, 4 PS, centro `[0,-4,4]`, MOV ×2
- [ ] Triple Battlefield — 4G, 575 celle, 7 PS, centro `[2,3,-5]`, MOV ×3
- [ ] The Valley — 3G, 383 celle, 7 PS, centro `[2,0,-2]`, MOV ×2
- [ ] Le vecchie Triumvirato Rubro e Quadrivio Spezzato non compaiono nel setup
- [ ] Narrow Path mostra il proprio sfondo senza dipendere dal Local Data Vault

## 2. Pressione Rapida/Competitive

- [ ] La Pressione non avanza prima del round 20
- [ ] Campo Starter richiede centro + 1 PS, limite R33
- [ ] Diamond 4 richiede 5/9 PS incluso il centro, limite R37
- [ ] Claustro Clash richiede 4/7 PS incluso il centro, limite R36
- [ ] Narrow Path richiede 2/4 PS incluso il centro, limite R33
- [ ] Triple Battlefield richiede 4/7 PS incluso il centro, limite R36
- [ ] The Valley richiede 4/7 PS incluso il centro, limite R35
- [ ] La vittoria arriva al quinto incremento
- [ ] Controllare la soglia senza il PS centrale non genera Pressione
- [ ] Se due giocatori soddisfano contemporaneamente il requisito, nessuno avanza

## 3. Pressione Standard

- [ ] Campo Starter inizia a R23
- [ ] Diamond 4 inizia a R27
- [ ] Claustro Clash inizia a R26
- [ ] Narrow Path inizia a R23
- [ ] Triple Battlefield inizia a R26
- [ ] The Valley inizia a R25
- [ ] La vittoria arriva al settimo incremento
- [ ] Il limite resta R50

## 4. Editor mappe

- [ ] Il tool ruoli contiene `PS centrale`
- [ ] Assegnare il centro mostra `PS★`
- [ ] Designare un nuovo centro rimuove il tag dal precedente
- [ ] Eliminare il centro rende la mappa non valida
- [ ] Un centro non equidistante produce errore bloccante
- [ ] Due PS con lo stesso ID producono errore bloccante
- [ ] Due pericoli con lo stesso ID producono errore bloccante
- [ ] Le nuove mine/trappole ricevono ID diversi
- [ ] Export/import conserva `centralStrategicPointId`

## 5. Regressioni gameplay

- [ ] Targeting unità FFA continua a vedere tutti gli avversari attivi
- [ ] Le strutture del deck non hanno cap generale
- [ ] In Tattica restano massimo 2 strutture Starter vive
- [ ] Movimento, attacco, costruzione e terreni funzionano su tutte le mappe
- [ ] Le mine di The Valley sono indipendenti e si attivano correttamente
- [ ] La trappola di Triple Battlefield funziona
- [ ] Log esportato riporta profilo Pressione e centro corretti

## 6. Prestazioni

- [ ] Diamond 4 resta fluida oltre 50 unità attive
- [ ] Triple Battlefield non introduce freeze prolungati
- [ ] The Valley a 3 giocatori mantiene turni bot regolari
- [ ] Il log visibile resta limitato senza troncare l’export completo

## 7. Tutorial e APK

- [ ] Le cinque lezioni partono e si completano
- [ ] Anteprime carta pienamente visibili sopra lo scrim
- [ ] Camera adattiva corretta su desktop
- [ ] Camera adattiva corretta su APK Android
- [ ] Touch, pan, zoom e selezione celle funzionano sulle mappe grandi
- [ ] Nessun crash tornando al menu o cambiando mappa
