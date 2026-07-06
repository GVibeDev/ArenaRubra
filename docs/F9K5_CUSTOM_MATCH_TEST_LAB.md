# F9K5 – Custom Match Test Lab

Baseline: C2-STABLE-1-F9K4-APK-M4c validata.

Obiettivo: permettere l'uso controllato dei deck con carte CUSTOM nel runtime, senza contaminarli con il flusso ufficiale/template.

## Implementato

- Setup deck selector aggiornato: il valore `custom` ora accetta anche deck Custom Lab salvati con chiave `::CUSTOM`.
- `deckBuilderSavedStatusForSetup()` può validare deck ufficiali oppure custom, con `allowCustom/preferCustom`.
- `deckBuilderValidatedSavedDeckForRuntime()` abilita il Custom Match Test Lab quando il giocatore seleziona un deck personalizzato.
- Le carte custom unità vengono trasformate in blueprint runtime temporanei tramite `customRuntimeBlueprintFromCard()`.
- `blueprintForHandCard()` risolve ora anche le custom unit card, oltre alle carte ufficiali/copiate/rubate.
- I passivi custom semplici entrano nel runtime: Avanguardia, immunità sanguinamento, anti-struttura, Spine, bonus PS, aura ATT/DEF.
- Le abilità custom attive sono marcate `customDataOnly` e bloccate da `canUseAbility()` fino a F9K6.
- I deck template/automatici restano ufficiali: non pescano custom.

## Fuori scope deliberato

- Binding runtime completo delle abilità custom attive.
- Effetti custom tattica generici.
- Bilanciamento ufficiale delle carte custom.

## Smoke test consigliato

1. Creare una unità custom semplice dal Card Editor.
2. Attivare custom nel Deck Builder e salvarla in un deck valido da 30 carte.
3. Setup: stessa fazione/comandante, selezionare `Deck personalizzato / Custom Match Lab`.
4. Avviare partita.
5. Verificare che la carta custom appaia in mano/deck, sia giocabile, paghi ENE, entri sulla mappa e combatta con HP/DEF/ATT corretti.
6. Se ha abilità attiva custom, verificare che non sia usabile in F9K5: comportamento atteso, sarà F9K6.
