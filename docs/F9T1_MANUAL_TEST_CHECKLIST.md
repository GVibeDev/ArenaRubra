# Arena Rubra — F9T1 Checklist manuale

## Setup e modalità

- [ ] Apri il Setup e verifica la voce `Expert F9T1 · Fondazione sviluppo`.
- [ ] Avvia un match bot–bot in modalità Expert.
- [ ] Verifica che il match proceda come con Advanced F9T0, senza nuove capacità apparenti.
- [ ] Passa tra Base, Advanced ed Expert e verifica l’etichetta corretta nell’HUD.

## Isolamento fazione

Per ciascuna fazione:

- [ ] avvia almeno un turno Expert;
- [ ] esporta la telemetria;
- [ ] verifica `invokedModules: 1`;
- [ ] verifica che `moduleId` corrisponda alla fazione;
- [ ] verifica che gli altri moduli non registrino un turno instradato.

## Contratto comune

- [ ] su mappa movimento ×1 verifica il riepilogo della prossimità;
- [ ] ripeti su movimento ×2 o ×3 e verifica la variazione dei turni stimati;
- [ ] verifica protezione QG con e senza struttura adiacente;
- [ ] verifica il conteggio delle strutture sui PS;
- [ ] avvicina un nemico al QG e verifica `hqOccupationRisk`.

## Telemetria

- [ ] schema base `F9Q3e1-2` presente;
- [ ] estensione `expertAi.schemaVersion = F9T1-1` presente;
- [ ] un record turno contiene contesto, modulo, fallback e performance;
- [ ] `fallback.target = advanced_f9t0`;
- [ ] decisioni dettagliate non superano 24 record per turno;
- [ ] heap è `null` nei browser che non lo espongono, senza errori;
- [ ] nessuna crescita persistente di cache fra due turni.

## Regressioni

- [ ] partita Advanced invariata;
- [ ] partita Base invariata;
- [ ] nessun errore console;
- [ ] fine turno e cambio giocatore corretti;
- [ ] telemetria esportabile;
- [ ] test APK reale su una mappa grande, controllando RAM e durata turni.
