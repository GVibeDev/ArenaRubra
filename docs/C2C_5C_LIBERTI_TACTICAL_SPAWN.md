# C2c-5c – Spawn tattici Liberti / Structure Spawn Compatibility

## Obiettivo

Chiudere il blocco mappa/sbarco prima di C2c-6, rendendo giocabili dalla mano le 4 tattiche spawn Liberti e consolidando le abilità struttura che generano unità.

## Tattiche abilitate

- LBTAC01 – Chiamata dei Miliziani
- LBTAC02 – Chiamata alle Armi
- LBTAC03 – Chiamata dei Clan
- LBTAC04 – Il Clan Risponde

## Regole implementate

- Gli spawn tattici non pagano il costo unità: si paga solo la carta tattica.
- Tutti gli spawn rispettano cap, cella libera, cella enterable e trigger cella/mina.
- Miliziani da LBTAC01/LBTAC03/LBTAC04 entrano esausti.
- Predone da LBTAC02 entra con Avanguardia temporanea.
- Chiamata dei Clan usa bordo mappa nella metà campo alleata e spawn tollerante: Predone prima, poi Miliziani se ci sono celle valide.
- Il Clan Risponde bersaglia comandante alleato e riempie adiacenze libere fino a 6 Miliziani, fermandosi al cap.

## Compatibility pass abilità struttura

Le abilità spawnBlueprint già presenti sono mantenute e verificate nel perimetro C2c-5c:

- Fabbrica Automatizzata – Produzione Quad
- Caserma Fanteria – Addestra Guardia
- Matrice Multigenica – Genera Spia

Non sono stati introdotti sistemi di pesca/economia, furto mano, conversione o reazioni.
