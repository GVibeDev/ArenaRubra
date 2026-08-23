# Arena Rubra — F9W2b · Menu Theme System

Baseline richiesta: **F9W2a1 VALIDATA** (`C2-STABLE-1-F9W2a1-APK-M4c`).

## Obiettivo

Introdurre un sistema persistente di temi del menu senza modificare il tema di fazione della partita, la mappa, l'HUD, le carte o il gameplay.

## Contratto F9W2b

Schema: `F9W2b-1`.

Preset disponibili:

- `rubra_classic` — Rubra · Classico
- `nexus_basalt` — Nexus · Basalto notturno
- `exordium_imperium` — Exordium · Imperium
- `liberti_sine_vinculis` — Liberti · Sine Vinculis
- `agathoi_kleos` — Agathoi · Kleos
- `fabeot_vesper` — Fabeot · Vesper

Il preset selezionato viene memorizzato dentro il vault impostazioni esistente (`arenaStorageReadSettings` / `arenaStorageWriteSettings`) sotto la chiave logica `menuTheme`.

Il selettore è inserito in **Control Center → Impostazioni** ed è disponibile in entrambi i profili F9W2a: DEV e Demo / Distribution. Il cambio è live e persistente.

## Scope grafico

F9W2b introduce token CSS centralizzati per background, superfici, bordi, accent, testo, muted e glow. Le regole F9W2b sono volutamente limitate a:

- Main Menu;
- Control Center e relativi pannelli.

Non vengono tematizzati GameScreen, board, HUD, carte o renderer.

## Relazione con il futuro Visual/UI Gate

F9W2b è una fondazione. Non introduce ancora texture, decorazioni agli angoli, pannelli mobili/ridimensionabili o il redesign delle preview. Queste decisioni restano nel successivo UI Art Direction Gate, dove potranno riutilizzare i token senza un nuovo refactor della selezione/persistenza dei temi.

## Regressioni preservate

- F9W2a Player / DEV Runtime Profile.
- F9W2a1 Snow Battlefield ufficiale Standard / Classic.
- F9W1a Match Data 2.0 (nessun file del subsystem modificato).
- Baseline logica F9T2c4 invariata.
