# F9K1a – Renderer Text Alignment / No Ability Microfix

Base: `C2-STABLE-1-F9K1-APK-M4c`

## Obiettivo
Rifinire la resa del renderer dopo la validazione del Card Editor data-only.

## Modifiche
- Aggiunti piccoli offset verticali per aree testo `name`, `type`, `description` sui frame non-Nexus.
- Correzione più marcata per Agathoi, dove le caselle grafiche risultano più basse rispetto al layout Nexus.
- Il fallback descrizione per unità senza abilità diventa `Nessuna abilità.`.
- Nessuna modifica a stat, budget custom, editor, gameplay, AI, deck rules o storage.

## Offset F9K1a
Unità:
- Nexus: 0
- Exordium / Liberti / Fabeot: nome +8, tipo +7, descrizione +9
- Agathoi: nome +20, tipo +15, descrizione +22

Tattiche:
- Nexus: 0
- Exordium / Liberti / Fabeot: nome +7, tipo +6, descrizione +9
- Agathoi: nome +15, tipo +12, descrizione +18
