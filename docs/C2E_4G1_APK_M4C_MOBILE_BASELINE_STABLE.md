# Arena Rubra – C2e-4g1 APK-M4c Mobile Baseline Stable Microfix

Base: `arena_rubra_C2e_4g1_APK_M4b_mobile_ui_microfix.zip`.

Obiettivo: consolidare la M4b come nuova baseline principale desktop/browser/APK senza modificare gameplay, AI, deck, bilanciamento o regole base.

## Modifiche

- Corretto refuso build label `C2e-4g1-APK-M4bb` in `src/game.js`.
- Uniformate le label/versioni visibili a `C2e-4g1-APK-M4c`.
- Aggiunta nota documentale di baseline stabile mobile.
- Conservate tutte le feature C2e-4g1: AI Integration / Regression Pass, Log Export, regole deck aggiornate, Adepto Fabeot costo 1, Strozzatura Logistica +2 ENE.
- Conservate tutte le feature APK-M4b: layout mobile fisso, pannelli Mano/Unità-Log/Opzioni, scroll opzioni, mano in primo piano, chiusura mano su Gioca carta, splash/intro/audio.

## Non modificato

- Nessuna modifica a costi, HP, DEF, ATT, roster, tattiche, comandante, cap o mappa.
- Nessuna modifica al motore AI C2e-4g1.
- Nessuna modifica alla regola ufficiale danno normale no-overflow: la DEF assorbe e l’eccesso non passa agli HP.

## Nota roadmap

Questa build può essere usata come baseline principale se i test desktop/browser/APK restano positivi. Prima della Starter Map Expansion andrà rivalutato il fitting camera mobile, perché l’attuale layer mobile eredita preset/bounding adatti alla mappa corrente.
