# C2e-4h – Superior Doctrine Calibration

Baseline: `C2e-4g1-APK-M4c_mobile_baseline_stable_microfix`.

Questa patch integra le prime lezioni dei game umano-vs-bot come layer AI superiore, senza modificare il bilanciamento numerico.

## Perimetro

Modificato solo il comportamento AI in `src/ai.js`, più label/versioning/documentazione.

Non sono stati modificati:

- stat unità;
- costi;
- HP / DEF / ATT;
- roster;
- deck rules;
- mappa;
- tattiche come dati;
- UI mobile M4c;
- regola danno normale no-overflow DEF → HP.

## Nuovo layer AI

Aggiunto blocco `C2e-4h – Superior Doctrine Calibration` con funzioni:

- `botSuperiorDoctrineMoveBonus`
- `botSuperiorDoctrineCoordBonus`
- `botSuperiorDoctrineTargetBonus`
- `botSuperiorDoctrinePurchaseBonus`
- `botSuperiorDoctrineTacticBonus`
- `botSuperiorDoctrineAbilityBonus`

Il layer agisce come modificatore di dottrina sopra gli scoring esistenti, ma non scavalca l'arbitraggio strategico C2e-4g. Le emergenze come vittoria immediata, difesa QG, pressure emergency, 0 PS recovery e close pressure lock restano prioritarie.

## Dottrine integrate

### Exordium vs Nexus

- apertura aggressiva su centro;
- Bastione/strutture Exordium su o vicino ai PS prima della rete Nexus;
- Guardia, Cursor, Veicolo Ricognitore e Carro Leggero trattati come massa operativa di tempo;
- target priority su Drone Geniere, Droni/Droidi/Fante Robot e strutture decisive Nexus;
- se Nexus resta a 0 PS, Exordium continua a strangolare invece di arretrare;
- `Spinta di Guerra` riceve valore alto quando apre una chiusura QG reale.

### Exordium vs Liberti

- apertura con massa starter controllata;
- centro come ancora;
- Bastione/Caserma/Avamposto come piattaforme di pressione;
- target priority su corpi su PS, unità che abilitano superiorità numerica, Avanguardie, Miliziani, Predoni/Buggy e strutture frontali;
- se Liberti è a 0 PS, Exordium tiene il blocco territoriale e cerca QG invece di inseguire trade periferici;
- unità veloci/accelerate valutate come pezzi di chiusura.

### Fabeot vs Exordium

- apertura con Adepto/Inseguitore/Lancia e massa economica verso centro/PS;
- se Fabeot è a 0 PS, declassa valore generico, contratti/tassazione/furto non territoriale;
- Avamposto Fabeot valorizzato come piattaforma territoriale;
- Strozzatura Logistica preferita su pezzi Exordium obbligati ad attaccare/liberare PS;
- Corruzione, conversione, Posizionamento Ingannevole, Sentenza Porpora e Sabotatore premiati quando cambiano PS/QG/controllo reale;
- Embargo/lock mano diventano forti quando Fabeot controlla 2+ PS, meno a 0 PS.

### Agathoi vs Nexus

- radicamento offensivo: strutture verso centro/PS, non turtle vicino al QG;
- PS centrale come radice;
- Bastione di Pietra Viva, Tholos, Cisterna, Radura e strutture affini ad alta priorità su/adiacenti a PS;
- target priority su Drone Geniere, seed unit Nexus e Bunker/Fabbrica/Nodo/Torre;
- Spine/Contrattacco come deterrenza davanti ai PS;
- a 6+ ENE, economia strutturale convertita in avanzamento;
- Seme della Ricchezza favorito su strutture sicure/durevoli.

## Cosa osservare nei test

- Exordium riesce a contestare/costruire prima contro Nexus?
- Exordium contro Liberti mantiene PS invece di inseguire corpi periferici?
- Fabeot a 0 PS mette corpo/struttura/controllo invece di solo valore mano?
- Agathoi spinge strutture verso centro e ricostruisce asse invece di turtle sterile?
- Le emergenze C2e-4g restano dominanti, senza bot troppo rigido o suicida?

