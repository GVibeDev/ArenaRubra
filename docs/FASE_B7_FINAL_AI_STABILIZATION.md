# Arena Rubra – B7-final AI Stabilization

## Esito previsto

La fase B7 concentra in `src/ai.js` i blocchi principali del bot:

- lettura campo;
- status strategico;
- movimento;
- orchestratore turno;
- tattiche;
- acquisti;
- spawn/build decisionale;
- azioni;
- attacchi;
- abilità;
- emergency behavior.

## Cosa non fa questa fase

Non introduce nuove meccaniche.
Non cambia balance.
Non ripulisce ancora il controller umano.
Non sposta il turn flow generale.
Non tocca click, selezione, `newGame`, `startTurn`, `endTurn`.

Quelli appartengono alla fase successiva, B8.

## Base dati Nexus

La hotfix Nexus resta inclusa:

- `Avatex` è il comandante Nexus provvisorio;
- `Nodo Comando Nexus` resta struttura di supporto;
- `Nodo Comando Nexus` ha `att:0`;
- `Protocollo Ripristino` resta invariato.

## Test browser consigliati

- nuova partita bot vs bot;
- bot compra a inizio turno;
- bot usa tattiche;
- bot usa Sportello Fabeot;
- bot costruisce strutture;
- bot muove correttamente;
- bot attacca;
- bot usa abilità curative/offensive;
- veicoli rispettano follow-up;
- Spinta di Guerra non rompe il turno;
- moveAttack funziona;
- emergenza QG/pressione funziona;
- fine turno automatica;
- nessun freeze `botRunning`;
- precheck senza problemi bloccanti.
