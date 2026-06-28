# Arena Rubra – C2e-4g AI Integration / Regression Pass

Base: `arena_rubra_C2e_4f_fabeot_deception_surrender_pressure_profile.zip`.

Perimetro: regression/integration AI. Nessun bilanciamento numerico intenzionale: non sono stati modificati costi, HP, DEF, ATT, cap, roster, tattiche dati o regola base del danno normale.

## Obiettivo

Ridurre collisioni tra layer AI: emergenza PS, difesa QG, profili fazione, hazard awareness, target priority, acquisti e tattiche.

## Interventi principali

- Aggiunto/rafforzato arbitraggio strategico C2e-4g dentro `strategicStatus()`.
- Aggiunto `closePressureLock`: se il bot è a Pressione 4/5 e controlla più PS dell'avversario, protegge PS e vantaggio territoriale salvo QG immediato/quasi certo.
- Reso `vittoria_qg` più selettivo: supera `vittoria_pressione` solo con occupazione/movimento immediato sul QG o sequenza forte; se è attivo Close Pressure Lock, la breccia QG non immediata viene penalizzata.
- Rafforzata difesa QG come blocco accessi/corridoi, non solo target sul pezzo più grosso.
- Valutazione speciale delle minacce QG da unità leggere/accelerate, inclusi veicoli Exordium come Carro Leggero, Cursor e Veicolo Ricognitore.
- Hazard awareness rifinita: in emergenza il malus viene ridotto ma non annullato; resta alto se l'hazard annulla lo scopo della unità.
- Spawn/build AI preferiscono celle sicure se esistono alternative ragionevoli.
- Target priority rafforzata su presidi PS, contestatori next-turn, minacce QG e strutture decisive vicino a PS.
- Tattiche Fabeot/hand tactics: in emergenza PS vengono declassati valore generico, furto/tassazione/contratti se non cambiano controllo mappa; aumentato peso di rimozione, stun, bounce, conversione, spawn/corpi su PS.
- Aggiunta telemetry per campagna 100 game: pressione massima, turni a 0 PS, nemico a 3 PS, switch goal, overdraw, key overdraw, recuperi deck, hazard/self-mine, QG threat, QG blocked opportunity, pressure emergency, recuperi da 0 PS.
- Bugfix Muro Verde: il log non può più mostrare recupero DEF negativo e l'effetto non riduce DEF se la DEF corrente è già oltre il massimo.
- Mine/cell hazard trigger registrati in telemetry.

## Cosa NON è stato toccato

- Statistiche unità.
- Costi.
- HP / DEF / ATT.
- Cap.
- Regola danno normale non perforante.
- Dati tattiche/roster.
- Nerf Nexus o buff/nerf fazioni.

## File modificati

- `src/ai.js`
- `src/state.js`
- `src/turns.js`
- `src/deck.js`
- `src/stats.js`
- `src/combat.js`
- `src/board.js`
- `src/tactics.js`
- `src/constants.js`
- `src/game.js`
- `README.md`

## Da osservare nei test

- Bot a pressione 4/5: conserva PS invece di inseguire QG non immediato?
- Nemico a 3 PS o pressione 3/5+: il bot contesta/rimuove presidio entro 1 turno?
- Fabeot in emergenza PS: usa controllo posizione invece di valore generico?
- Difesa QG: blocca accessi contro pezzi veloci, non solo attacca il bersaglio più forte?
- Posamine/mine: diminuiscono self-mine e hazard inutili?
- Exordium: migliora breakpoint e target su PS/strutture decisive?
- CSV: controllare nuovi campi telemetry prima della campagna 100 match.
