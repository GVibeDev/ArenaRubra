# Arena Rubra — F9V3c · Result Flow & Tutorial UX Polish

## Base

F9V3c è costruita sulla baseline locale **C2-STABLE-1-F9V3b-APK-M4c**, validata manualmente il 23 agosto 2026 dopo test completi sulle cinque lezioni Tutorial: azioni errate, checkpoint/ripresa e completamento 5/5.

Il riferimento remoto GitHub usato come verifica tecnica resta il commit `a785b2460f440fe6ee5da9216950374667c1962a` (`F9V3a PATCH OVERWRITE`), perché F9V3b non è stata pubblicata su `main` al momento della preparazione di questa candidata.

## 1. Terminal Result Lock

Il Result Modal F9V3a diventa un risultato terminale persistente.

- La conclusione di un match arma un lock logico separato dalla semplice visibilità del modal.
- `Log`, `Telemetria` e `Statistiche` sospendono temporaneamente il modal senza risolvere il lock.
- Chiudendo il pannello di analisi, lo stesso Result Modal ricompare automaticamente sopra la mappa conclusa.
- `Escape` continua a non chiudere il risultato terminale.
- `Menu principale` e `Nuova partita`, sia nel modal sia nella barra titolo, risolvono il lock.
- Nei flussi Accademia sono terminali validi anche `Torna all’Accademia`, `Lezione successiva`, `Prova successiva` e `Riprova`.

Il campo e lo stato finale del match restano intatti finché non viene scelta una transizione valida.

## 2. Risultati Tutorial e Challenge

Le schermate finali didattiche non mostrano più strumenti di analisi tecnica.

### Lezioni

- Lezioni 1–4: `Lezione successiva`.
- Lezione 5: `Vai alla Prova sul campo I`.
- Restano disponibili `Torna all’Accademia`, `Menu principale` e `Nuova partita`.
- `Log`, `Telemetria` e `Statistiche` sono nascosti.

### Challenge

- Prove I–IV completate: `Prova successiva`.
- Prova fallita: `Riprova`.
- Prova V completata: nessuna Prova successiva; ritorno all’Accademia o uscita dal flusso.
- Anche le Challenge nascondono Log, Telemetria e Statistiche nel Result Modal.

## 3. Stato visivo Accademia

L’Accademia espone il completamento senza richiedere la lettura dello stato testuale:

- indicatore sintetico `Accademia · X/5 completate`;
- cinque indicatori di progresso;
- check grafico sulle singole lezioni completate;
- check grafico anche sulle Challenge completate;
- cornice visiva distinta per le card completate.

La logica di progressione, salvataggio e unlock non viene modificata.

## 4. Ritratti narratori

La label tecnica dell’espressione (`neutral`, `explain`, `approve`, `warning`, `stern`) viene nascosta dalla UI.

L’espressione continua a essere utilizzata internamente per selezionare ritratto/fallback; cambia soltanto la presentazione. L’immagine del narratore resta quindi pulita, senza fascia testuale inferiore.

## 5. Recupero / rimescolamento deck

L’audit ha confermato che le tre carte Starter **non fanno parte della Mano**:

- `state.hand[side]` contiene la Mano ordinaria;
- `state.starterCards[side]` contiene separatamente le Starter;
- `deckRecoveryBlockingHandCards(side)` legge soltanto la Mano ordinaria e ignora la Missione.

Il problema percepito durante una partita era compatibile con la condizione di visibilità del controllo: con deck vuoto e almeno una carta ordinaria ancora in Mano, il pulsante veniva completamente nascosto.

F9V3c non cambia le regole del recupero. Cambia la UI:

- con deck non vuoto il controllo resta assente;
- con deck vuoto il controllo è sempre visibile;
- se il recupero è bloccato, il pulsante è disabilitato e mostra chiaramente il motivo (`Mano contiene ancora carte ordinarie`, `Servono 5 ENE`, `Scarti vuoti`, ecc.);
- deck vuoto + Mano ordinaria vuota + tre Starter presenti + scarti disponibili + ENE sufficiente = recupero disponibile.

## Invarianti

F9V3c non modifica:

- condizioni di vittoria o `VICTORY`;
- carte, costi, composizione deck o Starter;
- regole del deck recovery;
- ENE / income;
- Missioni;
- AI Advanced / Expert;
- mappe;
- QG o Pressione Strategica;
- statistiche, storico o schema telemetrico;
- Action Contract F9V3b-1 e comportamento delle cinque lezioni già validato.
