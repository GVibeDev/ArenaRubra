# C1h-b – Deck Runtime Validation

## Obiettivo

Consolidare il deck system dopo C1h-a.

## Regole validate

- Deck target: 30 carte.
- Max 2 copie per carta normale.
- Max 1 copia per comandante.
- Max 1 copia per pivot.
- Overflow debug disattivato.
- Runtime invariant: deck + mano + scarti = 30.

## Nuove funzioni

- `playerDeckRuntimeCards(side)`
- `deckRuntimeValidationForSide(side)`
- `deckRuntimeValidationSummary()`

## Non modificato

- Roster.
- Statistiche unità.
- Abilità.
- AI strategica.
- Economia.
- Condizioni vittoria.
- Tattiche in mano.

## Controlli

- JS check: OK
- duplicate function definitions: none
- duplicate blueprint IDs: none
- C1h-b version: True
- C1h-b mode: True
- overflow debug disabled: True
- strictDeckRuntimeValidation flag: True
- game label C1h-b: True
- playerDeckRuntimeCards present: True
- deckRuntimeValidationForSide present: True
- deckRuntimeValidationSummary present: True
- precheck runtime deck validation: True
- faction counts: Nexus 18, Exordium 18, Liberti 16, Agathoi 21, Fabeot 18
- type counts: Fanteria 31, Veicolo 30, Struttura 25, Comandante 5, QG 0
- Nexus: pool 18, legal capacity 34, overflow needed 0
- Exordium: pool 18, legal capacity 34, overflow needed 0
- Liberti: pool 16, legal capacity 30, overflow needed 0
- Agathoi: pool 21, legal capacity 39, overflow needed 0
- Fabeot: pool 18, legal capacity 33, overflow needed 0
