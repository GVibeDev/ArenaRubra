# F9T0 — Report test automatici

**Build candidata:** `C2-STABLE-1-F9T0-APK-M4c`  
**Data:** 29 luglio 2026

## Risultato

- Sintassi JavaScript: **86/86 file superati**.
- Suite Node: **78/78 test superati**.
- Smoke dedicato F9T0: **36/36 verifiche superate**.
- Browser Control Center desktop/mobile: **superato**.
- Browser Card Pool F9U2a: **superato**.
- Browser Card Editor/Map Editor F9U2b: **superato**.
- Browser bot-vs-bot / mano pubblica: **superato**, senza page error e senza console error inattesi.

## Copertura dello smoke F9T0

Il test dedicato verifica:

- metadata F9T0 e baseline F9U3;
- presenza della memoria `F9T0-1`;
- presenza degli helper principali;
- rimozione del `|| true` Nexus;
- eliminazione dei selettori multipli dal movimento avanzato;
- calcolo singolo di dottrina generale, dottrina di fazione e `homePsMoveScore` per candidato;
- uso del selettore unificato da parte di Agathoi;
- uso di `requiredPs` nello stato strategico;
- scenario da 7 PS: due PS non attivano la chiusura;
- scenario da 7 PS: centro + quattro PS nemici attivano l’emergenza;
- riconoscimento di una rete Nexus matura;
- rilascio di una guarnigione fuori budget;
- penalità di oscillazione rispetto all’avanzata.

## Regressioni browser verificate

- Centro di controllo con cinque aree.
- Versione `F9T0`, baseline `F9U3`, 50 deck e 9 mappe.
- Diagnostica con zero errori bloccanti.
- Layout desktop e mobile senza overflow orizzontale della pagina.
- Card Pool, Card Editor e Map Editor ancora accessibili e funzionanti.
- Avvio di una partita bot-vs-bot avanzata senza errori JavaScript osservati nel test.

## Limiti del report

I test automatici non dimostrano ancora:

- riduzione quantitativa del tempo CPU;
- riduzione quantitativa della RAM;
- minore frequenza statistica degli spareggi;
- qualità strategica su partite lunghe;
- corretto comportamento su tutti i matchup e tutte le mappe;
- stabilità su APK Android reale.

Questi punti richiedono la checklist manuale e i test telemetrici già in corso.
