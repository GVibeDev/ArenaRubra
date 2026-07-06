# F9K1b – Passive Text / Tooltip / Agathoi Tactic Alignment Microfix

Base: `C2-STABLE-1-F9K1a-APK-M4c`

## Obiettivo
Rifinire il renderer carte senza modificare gameplay, AI, deck rules, Card Editor o storage partita.

## Modifiche
- Tattiche Agathoi: testi nome/tipo/descrizione sollevati rispetto a F9K1a.
- Fallback `Nessuna abilità.` centrato nella casella descrizione del canvas.
- Descrizione renderer unità arricchita con descrizioni e tratti passivi del blueprint.
- Badge DOM hoverabili/focusabili nelle preview per tratti passivi principali.
- Badge visibili in Pool carte, Deck Builder, preview mano/unità selezionata e Card Editor custom.

## Tratti/passive inizialmente riconosciuti
- Avanguardia
- Prima Linea
- Spine
- Superiorità Numerica
- Sanguinamento
- Immunità Sanguinamento
- Anti-Struttura
- Attacchi Multipli
- Bonus PS
- Coordinamento
- Predazione
- Passive custom data-only

## Nota tecnica
Il testo disegnato dentro il canvas carta non è DOM e quindi non può avere tooltip parola-per-parola. I tooltip sono applicati ai badge DOM della preview esterna.
