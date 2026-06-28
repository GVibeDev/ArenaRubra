# Arena Rubra – C2-STABLE-1-F9F-APK-M4c
## Stats & Export Foundation

Base: `C2-STABLE-1-F9E1-APK-M4c HUD & Panel Usability Hotfix`.

Questa patch apre la fase **F9F – Stats & Export Foundation**.

## Obiettivo

Trasformare il pannello Stats in uno strumento utile per test e bilanciamento, senza toccare la logica Starter congelata.

La patch introduce un primo `matchStats` in memoria, alimentato dagli eventi tipizzati del motore. Non viene fatto parsing del testo del log.

## Modifiche principali

- Aggiunto `state.matchStats` come contenitore runtime della partita.
- Aggiunta inizializzazione `initializeMatchStats()` a ogni nuova partita.
- `emitGameEvent()` ora inoltra ogni evento tipizzato a `updateMatchStatsFromEvent()`.
- Il pannello Stats mostra ora una sezione “partita corrente” con:
  - eventi tipizzati;
  - round corrente;
  - movimenti;
  - attacchi;
  - danno su DEF / HP;
  - tattiche usate;
  - riepilogo G1/G2 con PS, pressione, ENE, unità, movimenti, attacchi, abilità, tattiche e perdite;
  - conteggio eventi per tipo.
- Aggiunti pulsanti nel pannello Stats:
  - `Copia statistiche JSON`;
  - `Copia report sintetico`;
  - `Copia eventi JSON`;
  - `Copia log completo`.
- Lo storico matchup browser resta separato e continua a offrire reset e CSV matchup.

## Cosa viene tracciato nella fondazione F9F

Metriche base:

- setup partita e build info;
- fazioni, comandanti, modalità player/bot, preset, mappa;
- round, vincitore, tipo vittoria quando presenti;
- conteggio eventi e seq max;
- movimenti e celle percorse;
- attacchi e ATT medio potenziale;
- danno a DEF e danno a HP;
- unità spawnate;
- strutture costruite;
- abilità usate;
- tattiche usate;
- unità distrutte e perdite;
- cambi controllo PS;
- conteggio eventi per tipo;
- top tattiche e abilità nel report sintetico.

## Non modificato

- gameplay;
- AI;
- deck rules;
- effetti tattiche;
- mappa;
- roster;
- costi;
- HP / DEF / ATT;
- splash/audio;
- regola danno no-overflow.

## Nota tecnica

F9F è una fondazione. Alcuni eventi storici sono già tipizzati molto bene; altri sono ancora `LOG_MESSAGE`. Le metriche avanzate future dovranno estendere gradualmente i payload evento, non leggere il testo del log.
