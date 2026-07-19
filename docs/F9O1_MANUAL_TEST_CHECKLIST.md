# F9O1a — Checklist manuale

## Avvio e menu

1. Avviare l’app e verificare `432 Hz Rift` nello splash/menu.
2. Entrare e uscire da Setup, Deck Builder e menu: la musica menu non deve ricominciare da zero a ogni cambio schermata.

## Tema determinato dal Giocatore 1

Avviare una partita per ciascuna fazione G1 e controllare:

- Nexus → palette Basalto notturno, `basalt_night.webp`, `Machina Concordia`;
- Exordium → rosso scuro/giallo, `battlegrounds.webp`, `Aureum Imperium`;
- Liberti → ocra/ferro, `red_dust.webp`, `Sine Vinculis`;
- Agathoi → verde scuro, `overgrowth_ruins.webp`, `Kleos Aionion`;
- Fabeot → viola scuro/giallo pallido, `velvet_hoods.webp`, `Vesper Tenebrarum`.

La fazione G2 non deve modificare il tema.

## Fine partita

1. Umano G1 contro bot G2, vittoria umana: prima traccia `Rubra Triumphans`.
2. Umano G1 contro bot G2, sconfitta umana: prima traccia `Rubra Losers`.
3. Ripetere con umano sul lato G2.
4. Attendere la fine della prima traccia: il sistema deve scegliere fra `432 Hz Rift`, `Rubra Triumphans` e `Rubra Losers` senza ripetere subito la stessa.
5. Tornare al menu: la playlist finale deve terminare e ripartire il loop di `432 Hz Rift`.

## Diagnostica

Console:

```js
arenaPresentationDiagnostics()
arenaAudioDiagnostics()
runPrecheck({ quiet:false, source:"F9O1-manual" })
```


## Calibratore durante la partita

1. Aprire Layout Calibration mentre una partita è in corso: la mappa deve restare visibile dietro al pannello e la musica non deve tornare al tema menu.
2. Cambiare skin/mappa: il cambiamento deve apparire immediatamente nella partita.
3. Tornare alla partita: la scelta manuale deve restare attiva.
4. Tornare al menu e riprendere la stessa partita: l’override di sessione deve essere conservato.
5. Premere `Ripristina preset fazione`: deve tornare la skin associata alla fazione del Giocatore 1.
6. Avviare una nuova partita: il vecchio override non deve essere riutilizzato.
