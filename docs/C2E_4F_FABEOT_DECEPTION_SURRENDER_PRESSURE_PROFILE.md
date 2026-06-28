# C2e-4f – Fabeot Deception / Surrender Pressure Profile

Base: C2e-4e Agathoi Fortification / Green Line Doctrine.

## Perimetro

Solo profilo AI Fabeot. Nessuna modifica a regole, carte, costi, stat, economia, comandanti, mappa, cap o UI strutturale.

## Moduli introdotti

- `botIsFabeotPlayer`
- `botFabeotIsBaitUnit`
- `botFabeotIsValuableUnit`
- `botFabeotAllyHalf`
- `botFabeotEnemyAgencyScore`
- `botFabeotEnemyConcentratedOnDefense`
- `botFabeotLessDefendedPsTargets`
- `botFabeotKeyEnemyTarget`
- `botFabeotIsolationScore`
- `botFabeotExposedKeyTargets`
- `botFabeotCollapseReady`
- `botFabeotDeceptionTargets`
- `botFabeotBaitScore`
- `botFabeotSplitPressureScore`
- `botFabeotPatienceScore`
- `botFabeotMoveDoctrineBonus`
- `botFabeotCoordDoctrineBonus`
- `botFabeotTargetPriorityBonus`
- `botFabeotPurchaseDoctrineBonus`
- `botFabeotTacticProfileBonus`

## Integrazioni AI

- `botGeneralDoctrineMoveBonus` integra il profilo movimento Fabeot.
- `botGeneralDoctrineCoordBonus` integra lo scoring spawn/build Fabeot.
- `botTargetPriorityBonus` integra la pressione su comandanti, pivot, elite, PS e strutture chiave.
- `chooseAdvancedFabeotMove` è stato riscritto per usare QG bait, split pressure, half-field patience e collapse strike.
- `botFactionTacticProfileBonus` integra il profilo tattiche Fabeot.
- `advancedPurchaseBonus` integra il profilo acquisti Fabeot.
- `buildCellStrategicScore` aggiunge un peso specifico per strutture Fabeot.

## Comportamenti attesi

- Una singola unità economica/stealth/movibile può minacciare il QG come diversivo.
- I pezzi costosi o chiave evitano raid QG solitari se non c’è una vera chiusura.
- Se il nemico concentra difese sul QG o su un PS, Fabeot valorizza PS meno difesi.
- Se Fabeot non è in emergenza, può restare nella metà alleata e costruire vantaggio di mano/ENE/posizione.
- Se il nemico ha poche risposte o pezzi chiave isolati, Fabeot accelera.
- Le tattiche Fabeot ricevono bonus quando tolgono agency: stun, bounce, conversione, blocco mano, furto, tassazione, stealth e ignore DEF.

## Check eseguiti

- `node --check` su tutti i file JS in `src/` e `data/`.
- Scan funzioni duplicate nei file JS.
- Test integrità ZIP.
