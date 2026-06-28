# C2e-2 – Bot Advanced Effects / Tactical Integration

Base: C2e-1.

Obiettivo: rendere l’AI avanzata più capace nell’uso degli effetti già implementati, senza cambiare il gioco.

## Interventi principali

- Wrapper `scoreBotAdvancedHandTactic()` sopra lo scoring C2e-1.
- Awareness su cap mano/deck per tattiche di pesca.
- Scoring AoE netto con penalità friendly fire e kill alleati.
- Scoring celle/trappole su PS, vicinanza nemici, linee strategiche.
- Buff prossimo-attacco usati preferibilmente su unità pronte o con target immediati.
- Scoring migliorato per conversione, bounce, bounty, Campo statico, Embargo, Contratto Capestro e usura.
- Profilo tattico leggero per Nexus, Exordium, Liberti, Agathoi, Fabeot.
- Miglior valore per spawn Liberti quando il campo è scarico o la pressione è alta.

## Fuori perimetro

- Nessun cambio di costi/stat.
- Nessuna nuova meccanica.
- Nessun cambio comandante.
- Nessun refactor AI massivo.
- Nessun bot perfetto: questa resta una AI euristica, leggibile e testabile.
