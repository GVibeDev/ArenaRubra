# Arena Rubra – C2c-3 – Controllo semplice / stati base

Base di partenza: C2c-2a – No Overflow Damage Hotfix.

Obiettivo: abilitare dalla mano 5 tattiche C2 basate su controllo semplice e stati base, senza introdurre AoE, movimento/celle, pesca/economia, conversioni o reazioni avanzate.

## Tattiche rese giocabili

Totale tattiche giocabili da mano C2c dopo questa patch: 15.

Già presenti:
- C2c-1: 5 tattiche danno singolo.
- C2c-2: 5 tattiche danno/debuff/cleanse.

Nuove C2c-3:

1. NXTAC09 – Difesa impenetrabile
   - effectKind: phase_shield
   - Bersaglio: unità alleata non QG
   - Effetto: applica Scudo Fasico per 1 ciclo; l'unità non può essere bersagliata da nemici.

2. NXTAC10 – Disabilita sistemi
   - effectKind: stun_disable
   - Bersaglio: unità nemica non QG
   - Effetto: applica Inibizione Azione / stordimento funzionale; il bersaglio non può muovere, attaccare o usare abilità.

3. EXTAC09 – Inibitore d'attacco
   - effectKind: inhibit_attack
   - Bersaglio: unità nemica non QG
   - Effetto: il bersaglio non può attaccare per 1 ciclo, ma può ancora muovere/usare abilità se consentito.

4. FABTAC01 – Ipnosi
   - effectKind: stun_unit
   - Bersaglio: fanteria o veicolo nemico; no strutture, no QG.
   - Effetto: applica Inibizione Azione / stordimento funzionale.

5. FABTAC10 – Dispositivo Stealth
   - effectKind: grant_stealth_vehicle
   - Bersaglio: veicolo alleato
   - Effetto: applica Furtivo finché il veicolo non attacca, usa abilità o viene rilevato da Visione.

## Modifiche tecniche principali

### data/cards_base.js
- Versione aggiornata a C2c-3.
- Aggiunti `playableTacticIdsC2c3` e `playableTacticEffectKindsC2c3`.

### data/tactics_cards_c2.js
- Le 5 tattiche sopra sono marcate `implementationStatus: "playable_c2c3"`.

### src/tactics.js
- Aggiunti helper C2c-3:
  - `c2c3PlayableTacticIds()`
  - `c2c3PlayableEffectKinds()`
  - `isC2c3ControlStatusTacticCard(card)`
- La whitelist giocabile C2c ora include C2c-1 + C2c-2 + C2c-3.
- Aggiunti filtri bersaglio per:
  - phase_shield
  - stun_disable
  - inhibit_attack
  - stun_unit
  - grant_stealth_vehicle
- Aggiunta risoluzione effetti per gli stati C2c-3.

### src/statuses.js
- Aggiunto stato `phase_shield` con label “Scudo Fasico”.
- Aggiornata descrizione `stealth` da placeholder a stato funzionale.
- Aggiunti helper:
  - `removeStatusKind(unit, kind, source)`
  - `revealStealth(unit, source)`

### src/abilities.js
- `isUntargetableTo()` ora considera:
  - `untargetable`
  - `phase_shield`
  - `stealth`, salvo rilevazione da Visione.
- Aggiunto helper `sideHasVisionOnTarget(observerSide, target)`.
- L'uso di abilità rivela Furtivo.

### src/combat.js
- L'attacco base rivela Furtivo sull'attaccante.

### src/precheck.js
- Label diagnostiche aggiornate a C2c-3.
- Conteggio tattiche giocabili atteso aggiornato a 15.

## Visione / Furtivo

Una unità Furtiva non può essere bersagliata da nemici finché:
- non attacca;
- non usa abilità;
- oppure una unità nemica con tag/abilità Visione si trova entro il raggio di Visione.

Prima implementazione Visione:
- tag unità: `tags.includes("vision")`
- oppure `unit.ability.tag === "vision"`
- raggio letto da `unit.ability.range`, fallback 2.

Il movimento non rompe Furtivo.

## Limiti intenzionali

Questa patch NON implementa:
- AoE;
- celle/trappole/barriere;
- pesca/economia;
- conversione Fabeot;
- furto carte;
- contrattacco/agguato/attacchi opportunità;
- AI consapevole delle nuove tattiche.

Questi aspetti restano per C2c-4 e successivi.
