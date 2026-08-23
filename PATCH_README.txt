ARENA RUBRA — F9W2c GLOBAL THEME SCOPE & SKIN ARCHITECTURE
=========================================================

BASELINE RICHIESTA
F9W2b VALIDATA — C2-STABLE-1-F9W2b-APK-M4c

CANDIDATA
C2-STABLE-1-F9W2c-APK-M4c

APPLICAZIONE
Copia il contenuto di questo ZIP sopra la cartella della baseline F9W2b validata,
mantenendo la struttura delle directory e consentendo la sovrascrittura dei file.

COSA CAMBIA
- il tema globale non è più circoscritto alla Home;
- Setup, Tutorial, Deck Builder, Card Pool, Card Editor e Map Editor usano il tema scelto;
- in partita la UI usa la fazione del G1;
- se ci sono 2+ umani, segue l'umano attivo e mantiene l'ultima skin umana nei turni Bot;
- la mappa non cambia comportamento: presentation_theme resta autorità del campo;
- introdotti token di contrasto testo/tabelle;
- introdotti slot modulari per texture, overlay, corner, bordi, divisori e crest;
- nessun asset grafico definitivo è ancora incluso: gli asset forniti sono riservati a F9W2d.

TEST MANUALE CONSIGLIATO
1. Scegli un tema diverso da Rubra e verifica Home -> Nuova partita -> Deck Builder -> Pool -> editor.
2. Riavvia e controlla la persistenza.
3. Avvia Human vs Bot con G1 di una fazione diversa dal tema globale: la UI del match deve seguire G1.
4. Avvia Human vs Human: la UI deve seguire il giocatore umano attivo al cambio turno.
5. In un match con 2+ umani e almeno un Bot, il turno Bot non deve cambiare skin.
6. Torna al menu: deve riapparire il tema globale scelto.
7. Verifica che sfondo/skin della mappa non vengano alterati dal nuovo layer UI.
