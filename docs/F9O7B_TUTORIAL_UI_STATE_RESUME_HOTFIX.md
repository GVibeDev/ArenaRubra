# F9O7b — Tutorial UI State & Resume Synchronization Hotfix

## Identità

- Build candidata: `C2-STABLE-1-F9O7b-APK-M4c`
- Sorgente immediata: `C2-STABLE-1-F9O7a-APK-M4c`
- Baseline validata precedente: `C2-STABLE-1-F9O6-APK-M4c`
- Gameplay, carte, statistiche e sequenza didattica: invariati.

## Problemi corretti

1. Il passo «Riduci la Mano» poteva iniziare con la Mano già ridotta, rendendo inesistente il pulsante richiesto.
2. La Mano poteva coprire il pannello abilità o ostacolare le azioni sulla mappa.
3. Uscita e ripresa potevano conservare selezioni, targeting, hover o pannelli incompatibili con il checkpoint.
4. Callback ritardate di una sessione precedente potevano riaprire vignette o completare un passo nella sessione successiva.
5. Un bersaglio non risolto in un passo vincolato poteva produrre un softlock.
6. Un path ritratto presente nel manifest ma assente sul disco mostrava un’immagine rotta.

## Contratto UI della Mano

Ogni passo della Lezione 1 dichiara `uiState.hand`:

- `open`: lettura, selezione e gioco delle carte;
- `collapsed`: selezione delle unità, abilità, bersagli e azioni sulla mappa;
- `preserve`: disponibile per futuri passi che non richiedono una disposizione specifica.

Il runtime applica il contratto prima di risolvere spotlight e bersagli consentiti.

## Ripresa sincronizzata

All’avvio o alla ripresa il runtime:

- chiude pannelli desktop e mobile;
- cancella selezioni, targeting e contesti pendenti;
- ripulisce lo stato transitorio della Mano;
- ripristina lo snapshot di gioco;
- applica lo stato UI del passo ripreso;
- crea una nuova coppia di token sessione/passo.

## Protezione asincrona

Tutti i timer del tutorial vengono registrati e verificano i token di sessione e passo. Uscita, riavvio e cambio passo invalidano le callback precedenti.

## Protezione anti-softlock

Il runtime tenta due ripristini dello stato UI durante la risoluzione del bersaglio. Se un bersaglio obbligatorio resta assente, chiude il tutorial e libera l’interfaccia, mantenendo disponibile l’ultimo checkpoint invece di bloccare ogni click.

## Ritratti narrativi

Percorso standard:

`assets/narrative/portraits/<fazione>/<espressione>.webp`

Espressioni:

- `neutral.webp`
- `explain.webp`
- `approve.webp`
- `warning.webp`
- `stern.webp`

Se il frame richiesto manca, il runtime prova `neutral.webp`; se manca anche quello usa il placeholder procedurale.
