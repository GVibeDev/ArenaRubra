# F9N1 – Custom Tactics Runtime Foundation

Baseline: `C2-STABLE-1-F9M2f-APK-M4c`, validata con asset reali.

## Obiettivo

Collegare al runtime le tattiche custom semplici del Card Editor senza consentire codice arbitrario o alterare le tattiche ufficiali.

## Contratto runtime

Una carta è candidata solo se:

- `custom === true`;
- `sourceType === "tactic"`;
- possiede un `effectKind` riconosciuto;
- tutti i parametri vengono normalizzati entro limiti whitelistati.

Target domain supportati:

- `none`;
- `board_unit`;
- `board_cell`.

Filtri supportati:

- `any`;
- `infantry`;
- `vehicle`;
- `structure`;
- `commander_or_pivot`.

## Effetti whitelistati

| Effect kind | Dominio | Limiti principali |
| --- | --- | --- |
| `damage` | unità nemica | valore 1–5, R1–R4 |
| `heal` | unità alleata | valore 1–5, R1–R4 |
| `restore_def` | unità alleata | valore 1–5, R1–R4 |
| `shred_def` | unità nemica | valore 1–5, R1–R4 |
| `buff_att` | unità alleata | valore 1–3, R1–R4, fino a fine turno corrente |
| `buff_def` | unità alleata | valore 1–3, R1–R4, fino a fine turno corrente |
| `apply_status` | unità | status whitelistato, durata esplicita in turni del proprietario bersaglio |
| `draw_card` | nessun target | 1–3 carte |
| `gain_energy` | nessun target | 1–5 ENE |
| `cell_blast` | cella | 1–3 danni, centro + adiacenti, alleati e nemici |

Status ammessi:

- `inhibit_action`;
- `inhibit_attack`;
- `inhibit_move`;
- `bleed`;
- `thorns`.

## Sicurezza

- nessun `eval`, `Function`, import dinamico o esecuzione di testo;
- valori numerici arrotondati e clampati;
- target side deciso dalla definizione whitelistata, non dal testo libero;
- QG escluso dai target unità custom;
- effetti non supportati marcati `custom_data_only`;
- fallback data-only non blocca il deck, ma impedisce il gioco della carta;
- IA esclusa dal consumo delle tattiche custom fino a scoring dedicato.

## Integrazione

Il flusso usa le funzioni standard:

1. carta nella mano;
2. `canUseHandTacticCard()`;
3. `beginHandTacticCardPlay()`;
4. targeting mappa, quando richiesto;
5. costo ENE;
6. evento `TACTIC_USED` strutturato;
7. resolver whitelistato;
8. `discardPlayedHandCard()` una sola volta.

## File principali

- `src/custom_tactics.js` – schema, normalizzazione, targeting e resolver;
- `src/tactics.js` – binding nel flusso tattiche da mano;
- `src/card_editor.js` – metadata runtime, validazione e nuovo effetto cella;
- `src/precheck.js` – diagnostica libreria custom;
- `src/ai.js` – esclusione prudente tattiche custom;
- `tests/f9n1_custom_tactics_smoke.js` – smoke test.
