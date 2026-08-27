ARENA RUBRA — F9W2d4a INSPECTOR POSITION OWNERSHIP HOTFIX
==========================================================

BASE
C2-STABLE-1-F9W2d4-APK-M4c
main: 311a05ca988c4c5343f7b00356c247d3a6fea328

CANDIDATA
C2-STABLE-1-F9W2d4a-APK-M4c

APPLICAZIONE
Sovrascrivi i file sulla F9W2d4 corrente.

FIX
- il theme layer non forza più position:relative su selectedUnitFloat;
- il layout statico F9W2d4 torna proprietario della posizione del popup;
- il popup mantiene colori/materiali/bordi/ornamenti del tema;
- preview 370 px e posizionamento destro F9W2d4 restano invariati.

TEST MANUALE
1. Avvia una partita Desktop/Web.
2. Seleziona una unità già sulla mappa.
3. Verifica che il popup appaia sul lato destro del viewport.
4. Verifica che la preview resti grande (~370 px).
5. Cambia/usa un tema di fazione e verifica che il popup conservi la skin.
