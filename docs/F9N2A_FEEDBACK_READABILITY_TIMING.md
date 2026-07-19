# F9N2a – Feedback Readability Timing

Micro-patch sulla F9N2 validata.

## Modifica

- `COMBAT_FEEDBACK_CONFIG.floatMs`: 720 → 1000 ms
- `COMBAT_FEEDBACK_CONFIG.statusMs`: 760 → 1000 ms
- fallback CSS `--feedback-duration`: 720 → 1000 ms
- in modalità movimento ridotto il testo resta visibile 1000 ms; restano ridotte soltanto le animazioni fisiche.

## Invarianti

Nessuna modifica a danni, DEF, HP, status, targeting, IA, deck, carte o bilanciamento.
