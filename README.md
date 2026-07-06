# Arena Rubra – C2-STABLE-1-F9K7-APK-M4c

Menu / Lab Navigation Cleanup su F9K6b validata.

## F9K7 – Menu / Lab Navigation Cleanup
- F9K6b validata come baseline: deck custom, unità custom, abilità runtime e `apply_status` restano invariati.
- Riorganizza il menu principale in tre blocchi: Gioca, Laboratorio, Debug/Export.
- Rende il Setup Nuova partita più leggibile separando Identità giocatore e Deck runtime.
- Aggiunge badge stato deck nel Setup: Starter, OFFICIAL, CUSTOM o Deck non valido.
- Migliora le opzioni dei deck salvati: nome deck, numero carte, OFFICIAL/CUSTOM, comandante e data breve.
- Aggiunge navigazione rapida tra Card Editor, Deck Builder e Pool Carte.
- Prepara classi e contenitori UI più ordinati per F9L1 Temporary Menu Layout Calibration Tool.
- Nessuna modifica a gameplay, AI, carte ufficiali, mappa, economia, regole Starter o bilanciamento.

## F9K6b – Custom Apply Status Binding
- F9K6 validata come baseline.
- Aggiunge nel Card Editor una whitelist sicura per `apply_status`: Inibizione Azione, Inibizione Attacco, Inibizione Movimento, Sanguinamento e Spine.
- Aggiunge salvataggio/import/export di `statusKind`, durata status e valore status dentro `customAbilitySchema.active`.
- Il runtime delle unità custom normalizza `apply_status` in `kind: "status"` solo se lo status è whitelistato e presente in `STATUS_DEFINITIONS`.
- Gli status negativi vengono forzati su target nemico; Spine viene forzato su target alleato.
- `custom_text_only` e tattiche custom restano data-only. Nessuna modifica a carte ufficiali, AI, mappa, economia o bilanciamento.


Baseline: `C2-STABLE-1-F9P1a-APK-M4c Storage Import/Export UX Hotfix`.

Questa build mantiene congelata la logica Starter e rifinisce il Deck Builder persistente:

- mantiene `src/storage.js` come layer unico per storage persistente;
- mantiene compatibilità con i deck custom salvati da F9H3/F9P1/F9P1a;
- mantiene export/import JSON chiaro con download file, copia clipboard, import da file e import da testo incollato;
- aggiunge nel Deck Builder una gallery dei deck salvati/importati;
- la gallery mostra tutti i deck persistenti locali, anche di altre fazioni/comandanti;
- ogni deck in gallery mostra fazione, comandante, chiave storage, data, validità e numero carte;
- da gallery è possibile caricare un deck nel draft, copiarne il JSON importabile o eliminarlo;
- caricando un deck dalla gallery, il Deck Builder passa automaticamente alla sua fazione/comandante;
- il SetupScreen continua a usare solo deck custom validi per la fazione/comandante selezionati;
- lo storico partite persistente e il manifest asset carte introdotti in F9P1 restano invariati.

Le illustrazioni carta non vengono incluse in questa patch: il codice continua a definire nomi file e albero directory attesi per il futuro renderer.

Nessuna modifica a gameplay, AI, tattiche, mappa, roster, costi/statistiche unità o regola danno no-overflow.


## Novità F9I2
- Preview renderer integrata nella schermata di gioco per l'unità selezionata.
- Preview renderer integrata nel pannello Mano / deck C2 per starter card e carte in mano.
- Click sulle carte del pannello mano/starter per aggiornare l'anteprima senza alterare il gameplay.
- Nessuna modifica a regole, AI, deck building o bilanciamento.


## Novità F9I2a
- Box unità selezionata più alto su desktop, circa +20/25%.
- Box unità selezionata molto più alto su mobile/APK, circa +100%.
- Miniatura card renderer dell'unità più leggibile su mobile.
- Nessuna modifica a gameplay, AI, deck rules, storage o bilanciamento.


## F9J1 – Card Pool Screen Foundation
Aggiunge una schermata `Pool carte` read-only con filtri per fazione, tipo e ruolo, ricerca testuale, preview renderer e riferimenti ai path asset. Nessuna modifica a gameplay, AI, deck rules, setup o storage.


## F9J2 – Card Pool Gallery & Fullscreen Preview
Rifinisce la schermata `Pool carte` con preview più ampia, modalità `Galleria / Tabella`, navigazione precedente/successiva, miniature renderizzate leggere e fullscreen comodo soprattutto su mobile. Nessuna modifica a gameplay, AI, deck rules o storage.


## F9J2a – Card Pool Unified Preview Microfix
Unifica la preview del Pool carte: il fullscreen/focus usa lo stesso canvas principale, quindi non compare più una seconda carta duplicata. Imposta apertura default su Nexus + Unità per non renderizzare tutto il catalogo al primo ingresso.


## F9K1 – Card Editor Data-only Foundation
Aggiunge un editor per creare carte custom separate dalle ufficiali. Le carte base restano read-only. Le custom vengono validate con budget ENE/stat, possono avere effetti attivi/passivi data-only, hanno preview renderer live, salvataggio localStorage, export JSON e visibilità nel Pool carte. Non entrano ancora automaticamente nel gameplay standard o nel Deck Builder.


## F9K1a – Renderer Text Alignment / No Ability Microfix
Mantiene F9K1 validato e corregge solo la resa del renderer: piccoli offset verticali per nome/tipo/descrizione sui frame non-Nexus, con correzione più marcata per Agathoi; il fallback descrizione delle unità senza abilità diventa `Nessuna abilità.`. Nessuna modifica a gameplay, AI, deck rules, editor, storage o bilanciamento.


## F9K1b – Passive Text / Tooltip / Agathoi Tactic Alignment Microfix
Solleva ulteriormente i testi delle tattiche Agathoi, centra il fallback `Nessuna abilità.` nella casella descrizione e rende visibili nel renderer i tratti/passive principali come Sanguinamento, Avanguardia, Prima Linea, Spine e Superiorità Numerica. Le preview DOM mostrano anche badge hoverabili con descrizione del tratto. Nessuna modifica a gameplay, AI, deck rules, Card Editor o storage partita.


## F9K2 – Custom Card Library Foundation
Rafforza il Card Editor con libreria custom filtrabile, duplicazione custom, import/export JSON, reset delle sole custom, duplicazione sicura dal Pool come nuova carta custom e badge `CUSTOM` nel Pool carte. Le carte ufficiali restano read-only. Nessuna modifica a gameplay, AI o deck rules.


## F9K2b – Permanent Card Art Alignment Tool
Integra nel Card Editor import immagine custom, downscale/compressione guidata e allineamento permanente dell’artwork con zoom e offset X/Y. I valori vengono salvati nella carta custom come `customArtTransform` e possono essere copiati in JSON. Nessuna modifica a gameplay, AI, deck rules o carte ufficiali.


## F9K2c – Temporary Renderer Text Calibration Lab
Aggiunge un tool dev temporaneo per il fine alignment del renderer carte. Il tool consente di calibrare, per tipo carta e fazione, le caselle `name`, `type`, `description` e i parametri stat/ENE (`cx`, `labelY`, `valueY`, `labelSize`, `valueSize`). Gli override vengono applicati localmente alla preview, salvati in `localStorage` come calibrazione provvisoria ed esportati in JSON per fissare poi le coordinate nel codice definitivo.

Non modifica gameplay, AI, deck rules, bilanciamento, carte ufficiali, dati custom o logica Starter.


## F9K2d – Renderer Calibration Commit / Coordinate Freeze
Integra nel renderer le coordinate validate raccolte con F9K2c per Exordium, Agathoi, Liberti e Fabeot, mantenendo Nexus come baseline. Le coordinate sono separate tra unità e tattiche e includono caselle testo (`name`, `type`, `description`) e stat/ENE (`ene`, `hp`, `def`, `att`). Il Calibration Lab resta disponibile come strumento opzionale, ma usa una nuova chiave locale `arenaRubra.rendererTextCalibration.v2` per evitare che vecchi override F9K2c possano sovrascrivere il layout fissato.

Non modifica gameplay, AI, deck rules, bilanciamento, carte ufficiali, dati custom o logica Starter.


## F9K3 – In-game Hand Rendered Thumbnails
La mano e le starter card nel pannello `Mano / deck C2` vengono ora visualizzate come miniature renderizzate con lo stesso card renderer usato da Pool, Deck Builder e Card Editor. La preview grande resta presente e si aggiorna selezionando una miniatura. I pulsanti `Gioca` / acquisto starter e le ragioni di disponibilità restano invariati.

Non modifica gameplay, AI, deck rules, bilanciamento, dati custom, custom art o coordinate renderer F9K2d.


## F9K3a – Map Hand Overlay Foundation
Aggiunge sulla mappa una mano rapida renderizzata in overlay trasparente. Le carte restano verticali e vengono affiancate orizzontalmente in basso sopra la mappa. Il pulsante `Fine turno` viene reso disponibile sullo stesso overlay, mentre il pannello `Mano / deck C2` resta disponibile come consultazione e modalità alternativa.

Questa è una foundation UI: non introduce ancora la preview grande laterale né l’highlight automatico dei bersagli/celle per carta selezionata, previsti per F9K3b. Non modifica gameplay, AI, deck rules, bilanciamento, Card Editor, Card Pool, custom art o coordinate renderer F9K2d.


## F9K3a2 – Map Hand Overlay Move Units Microfix
Rifinisce l’overlay mano sulla mappa: le miniature sono verticali, affiancate orizzontalmente, più grandi e prive di testi extra salvo etichetta `Unità`, `Tattica` o `Comandante`. L’overlay ora include anche le starter card, giocabili direttamente da lì. Quando una carta viene accettata per sbarco/costruzione/tattica, l’overlay si nasconde sotto lo schermo, compare una preview laterale solo render carta e il bottone `Annulla sbarco`; completata o annullata l’azione, l’overlay torna visibile.

Non modifica gameplay, AI, deck rules, bilanciamento, Card Editor, Card Pool, custom art o coordinate renderer F9K2d.


## F9K3a2 – Map Hand Overlay Move Units Microfix
Aggiunge sotto `Fine turno` il pulsante `Muovi unità`. Il pulsante riduce temporaneamente l’overlay mano, lasciando sul lato destro un comando compatto `Mostra mano` + `Fine turno`, così il giocatore 1 può interagire con QG e area di sbarco bassa anche senza giocare carte. Il cambio turno e la selezione/annullamento carta riaprono o ripuliscono lo stato dell’overlay.

Non modifica gameplay, AI, deck rules, bilanciamento, Card Editor, Card Pool, custom art o coordinate renderer.


## F9K3c – Deck Builder Custom Integration
Aggiunge sulla mappa un box `Azioni` in basso a sinistra con le tattiche di fazione del giocatore corrente. Il dock mostra stato pronto/bloccato/attivo, costo ENE, cooldown, numero bersagli o motivo del blocco, e usa i comandi rapidi `Usa`, `Mira`, `Annulla`.

Il dock riusa le funzioni esistenti `toggleTacticMode`, `tacticTargets`, `canUseTactic` e `tacticCooldown`: non crea una seconda logica tattica. Il pannello `Tattiche` legacy resta disponibile come consultazione/modalità alternativa.

Non modifica gameplay, AI, deck rules, bilanciamento, Card Editor, Card Pool, custom art, coordinate renderer F9K2d o Starter Logic Freeze.


## F9K4 – Deck Builder Custom Integration (baseline validata)
Integra le carte custom salvate dal Card Editor nel Deck Builder tramite toggle esplicito `Includi carte CUSTOM nel pool`.

Regole:
- il pool ufficiale resta il default;
- il template automatico resta sempre ufficiale;
- le carte custom vanno aggiunte manualmente dal pool quando il toggle è attivo;
- le righe custom mostrano badge `CUSTOM`;
- un deck con custom viene marcato `NON UFFICIALE`;
- i deck non ufficiali vengono salvati su chiave separata `::CUSTOM`;
- in F9K4 il Setup/runtime standard continuava a usare solo deck ufficiali;
- l’uso runtime dei deck custom è rimandato a F9K5 Custom Match Test Lab.

Non modifica gameplay, AI, deck rules, bilanciamento, Card Editor, Card Pool, custom art, coordinate renderer F9K2d o Starter Logic Freeze.


## F9K5 – Custom Match Test Lab

Patch di laboratorio NON UFFICIALE per portare i deck custom salvati dentro il runtime partita.

Cosa cambia:
- il Setup ora riconosce anche i deck salvati su chiave Custom Lab (`::CUSTOM`);
- selezionando “Deck personalizzato / Custom Match Lab”, la partita può avviarsi con carte CUSTOM nel deck/hand runtime;
- le unità custom vengono trasformate al volo in blueprint temporanei, con HP/DEF/ATT/costo/tipo/peso/fazione e passivi semplici;
- i passivi custom supportati nel runtime F9K5 includono Avanguardia, immunità sanguinamento, anti-struttura, Spine, bonus PS e aura ATT/DEF;
- le abilità custom attive restano volutamente `data-only` e non sono usabili finché non verrà implementata F9K6 – Ability Runtime Binding;
- i deck automatici/template restano ufficiali e non pescano carte custom.

Nota secca: F9K5 serve per testare presenza, pesca, mano, sbarco/costruzione e comportamento base delle custom. Non è ancora bilanciamento ufficiale.


## F9K5c – Card Editor Art Path + Side Hover Preview
- Nel Card Editor, la riga `Art attesa` non mostra più data URL/raw lunghissimi quando una carta custom usa un'immagine incorporata.
- Per le immagini custom incorporate viene mostrato il nome file leggibile; i dettagli tecnici restano nel pannello metadati immagine, senza sporcare la preview dati.
- L'hover desktop sulle carte della mano rapida non segue più il puntatore: renderizza la carta nella preview laterale destra.
- Al click, la preview laterale resta visibile solo se serve scegliere un bersaglio/cella; se la carta viene giocata direttamente, scompare.
- Nessuna modifica a gameplay, AI, deck rules, bilanciamento o runtime delle abilità custom.

## F9K5b – Card Art Zoom + Custom Badge Alignment
- F9K5a validata come baseline operativa.
- Mantiene lo zoom illustrazioni tattica F9K5a: `0.94`, invariato per tutte le fazioni.
- Ripristina lo zoom illustrazioni unità alla calibrazione precedente: `1.25`, offsetX `25`, offsetY `145`, valido per tutte le fazioni.
- Corregge il layout dei tile custom nel Pool carte: il badge `CUSTOM` diventa un badge angolare separato dal nome e non influenza più centratura/allineamento del tile.
- Corregge anche le celle nome del Deck Builder pool/draft: i badge `CUSTOM`/`OFF` sono posizionati in area dedicata e non allargano il nome.
- Nessuna modifica a gameplay, AI, costi, statistiche, mappa o bilanciamento.


## F9K5a – Deck Library + Hover Preview
- F9K5 validata come baseline operativa: i deck custom entrano nel runtime tramite Custom Match Test Lab.
- Aggiunto campo Nome deck nel Deck Builder.
- Il salvataggio deck ora usa chiavi autonome basate su fazione, comandante, modalità ufficiale/custom e nome deck: più deck possono convivere con stesso comandante/fazione.
- Il Setup/Nuova partita mostra un selettore dei deck salvati disponibili per il comandante/fazione selezionati; il runtime usa la `savedKey` scelta.
- Aggiunta hover preview desktop per le carte dell’overlay mano/starter in basso; disattivata automaticamente su layout mobile/APK e dispositivi senza hover fine.
- Calibrazione illustrazioni: zoom unità ridotto da 1.25 a 1.12 con offsetY 115; zoom tattiche ridotto da 1.04 a 0.94.
- Nessuna modifica a regole, AI, costi, statistiche, mappa o bilanciamento.



## F9K6 – Ability Runtime Binding

Valida F9K5c come baseline e collega al runtime le abilità attive semplici delle unità custom nel Custom Match Test Lab.

Effetti custom attivi supportati nel runtime:

- `damage` → danno a bersaglio valido;
- `heal` → cura HP;
- `restore_def` → ripristino DEF fino al massimo;
- `shred_def` → rimozione DEF;
- `buff_att` → +ATT temporaneo;
- `buff_def` → +DEF temporaneo;
- `draw_card` → pesca carta/e, forzato su sé;
- `gain_energy` → guadagno ENE, forzato su sé.

Restano data-only in questa build:

- `apply_status`, perché il Card Editor non espone ancora tipo stato/durata in modo sicuro;
- `custom_text_only`;
- tattiche custom, che saranno una fase separata se necessario.

Il binding normalizza anche bersagli `ally/enemy/self/any` e filtri `any/infantry/vehicle/structure/commander_or_pivot`, così le abilità custom non vengono bloccate dai valori inglesi generati dal Card Editor.

Nessuna modifica a carte ufficiali, AI, regole Starter, mappa, roster, costi/statistiche unità o bilanciamento.
