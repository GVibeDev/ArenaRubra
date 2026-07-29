# F9Q3d1 — Checklist manuale

Build attesa: `C2-STABLE-1-F9Q3d1-APK-M4c`

Baseline ufficiale durante il collaudo: `C2-STABLE-1-F9S1b1-APK-M4c`

## 1. Avvio e regressione baseline

- [ ] La versione F9Q3d1 compare nel menu, HUD e log esportato.
- [ ] Il precheck termina senza problemi o warning inattesi.
- [ ] Ogni fazione conserva 40 carte: 23 unità, 14 tattiche e 3 Missioni.
- [ ] Le Pivot alternative e i relativi asset restano corretti.
- [ ] I deck custom sono ancora tutti selezionabili dalla schermata Nuova partita.
- [ ] Le nove mappe ufficiali e i relativi sfondi sono disponibili.
- [ ] Una normale partita 1v1 può essere avviata senza selettori aggiuntivi inutili.

## 2. Selettore giocatore in FFA

Avviare una partita con un umano e almeno due avversari attivi.

- [ ] Una tattica player-level apre il pannello di scelta dell'avversario.
- [ ] Il pannello mostra soltanto avversari attivi.
- [ ] Il proprio giocatore non compare.
- [ ] Un giocatore eliminato non compare.
- [ ] Ogni opzione mostra nome/fazione, ENE, PS, Pressione, mano e deck.
- [ ] Il pannello è leggibile senza coprire o tagliare i pulsanti essenziali.
- [ ] Annulla chiude il pannello senza spendere ENE o consumare la carta/abilità.
- [ ] Cliccare fuori dal pannello annulla senza effetti collaterali.
- [ ] Cambiare selezione/unità chiude correttamente un targeting pendente.

## 3. Tattiche da deck

### Campo statico — EXTAC10

- [ ] Mostra solo avversari che possiedono almeno una abilità attiva con costo ENE maggiore di 0.
- [ ] Le abilità gratuite non rendono da sole un giocatore eleggibile.
- [ ] La tassa viene applicata soltanto al giocatore scelto.
- [ ] Gli altri avversari mantengono i propri costi abilità.

### Contratto Capestro — FABTAC06

- [ ] Mostra soltanto avversari con almeno una carta nel deck.
- [ ] P1 e il giocatore scelto pescano una carta.
- [ ] L'eventuale furto riguarda la carta appena pescata dal giocatore scelto.
- [ ] Nessun altro avversario pesca o perde carte.

### Embargo — FABTAC07

- [ ] Mostra soltanto avversari con almeno una carta non già bloccata.
- [ ] Blocca carte soltanto nella mano scelta.
- [ ] Il numero di carte bloccate usa i PS controllati dal Fabeot.
- [ ] Le mani degli altri avversari restano invariate.

### Contratto di Usura — FABTAC09

- [ ] Il bersaglio scelto perde 1 ENE.
- [ ] Il bersaglio scelto riceve -1 income per 2 turni.
- [ ] Con ENE iniziale 0, lo scarto casuale avviene soltanto nella sua mano.
- [ ] Gli altri avversari non subiscono ENE, income o scarti.

## 4. Tattica Starter/legacy

### FB_TAC_CONTRACT — Contratto Capestro

- [ ] In FFA apre il selettore giocatore.
- [ ] Il sovraccosto unità viene applicato soltanto all'avversario scelto.
- [ ] Durata e cooldown restano quelli precedenti.
- [ ] In 1v1 il bersaglio viene scelto automaticamente.

## 5. Abilità Fabeot

### Logistica Compromessa — FBCMD02

- [ ] Mostra solo avversari attivi con deck non vuoto.
- [ ] La pesca avviene dal deck scelto.
- [ ] L'eventuale carta rubata arriva nella mano del Fabeot.
- [ ] Deck e mani degli altri avversari restano invariati.
- [ ] Costo 2 ENE e CD3 vengono applicati normalmente.

### Esproprio di Mano — FBC1F03

- [ ] Mostra solo avversari con almeno una carta copiabile.
- [ ] Missione, Comandante e carte protette non rendono da sole eleggibile il giocatore.
- [ ] La copia proviene esclusivamente dalla mano scelta.
- [ ] Costo 3 ENE e CD3 vengono applicati normalmente.

### Clausola di Stasi — FBC1F04

- [ ] Mostra tutti gli avversari attivi.
- [ ] Blocca la spesa ENE soltanto al giocatore scelto.
- [ ] Con ENE 0 blocca anche la mano del giocatore scelto.
- [ ] Gli altri avversari restano utilizzabili.
- [ ] Costo 5 ENE e CD4 vengono applicati normalmente.

## 6. Comportamento 1v1

- [ ] Nessun pannello viene mostrato quando esiste un solo avversario valido.
- [ ] Campo statico, Contratto Capestro, Embargo, Usura e le tre abilità risolvono sull'unico avversario.
- [ ] Nessun click aggiuntivo è richiesto rispetto al comportamento precedente.
- [ ] Costi, cooldown, scarti e log restano corretti.

## 7. Bot in partite 3–4 giocatori

- [ ] Un bot usa tattiche player-level senza freeze o richiesta UI.
- [ ] Un bot usa Logistica Compromessa, Esproprio di Mano e Clausola di Stasi senza softlock.
- [ ] Il bersaglio scelto è sempre un avversario attivo.
- [ ] Il bot non bersaglia sé stesso.
- [ ] Il bot non bersaglia giocatori eliminati.
- [ ] A stato invariato, la scelta resta deterministica.
- [ ] Il log identifica chiaramente il giocatore bersaglio.

## 8. Eliminazione durante la partita — controllo di fondazione

Questa sezione verifica soltanto l'esclusione dal targeting; la semantica completa delle eliminazioni sarà F9Q3d3.

- [ ] Eliminare un giocatore in una partita a quattro.
- [ ] Aprire una tattica player-level e verificare che il giocatore eliminato non compaia.
- [ ] Verificare lo stesso con una abilità player-level.
- [ ] Passando da 3 a 2 giocatori attivi, il targeting torna automatico.
- [ ] Nessun effetto già pendente può essere confermato su un bersaglio diventato invalido.

## 9. Salvataggio, ripresa e log

- [ ] Salvare e riprendere dopo avere risolto un effetto player-level.
- [ ] Debuff, blocchi e durata restano associati al giocatore corretto.
- [ ] Il log esportato riporta `targetSide` corretto.
- [ ] Il log non attribuisce l'effetto al primo avversario dell'ordine di turno quando è stato scelto un altro giocatore.
- [ ] Annullare il selettore prima di salvare non lascia modalità o overlay bloccati.

## 10. Android reale

- [ ] Creare e installare l'APK F9Q3d1 su dispositivo reale.
- [ ] Il pannello giocatore è leggibile in verticale e orizzontale.
- [ ] Tutte le opzioni sono raggiungibili tramite scorrimento.
- [ ] I pulsanti hanno area tattile sufficiente.
- [ ] Il pannello si chiude correttamente con Annulla e tocco esterno.
- [ ] Nessun doppio tap applica due volte carta o abilità.
- [ ] Nessun freeze durante turni bot con 3–4 giocatori.
- [ ] Menu inferiori, mano, pan e zoom restano stabili dopo la selezione.
