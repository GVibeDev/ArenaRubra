# Checklist manuale — F9T2b

Build candidata: `C2-STABLE-1-F9T2b-APK-M4c`

## A. Regressione Bastion Relay F9T2a

- [ ] PS controllato da guarnigione mobile, senza struttura.
- [ ] Builder distinto, pronto e adiacente.
- [ ] Almeno 2 ENE disponibili.
- [ ] Il piano selezionato è `EXORDIUM_BASTION_RELAY`.
- [ ] La guarnigione si muove prima della costruzione.
- [ ] Il Bastione viene costruito sul PS liberato.
- [ ] Il resto del turno torna all’Advanced.

## B. Clear, Occupy, Fortify — Bastione

- [ ] Un presidio nemico occupa un PS.
- [ ] Uno, due o tre attaccanti possono eliminarlo nello stesso turno.
- [ ] Esiste un builder distinto e Bastione disponibile.
- [ ] Viene selezionato `EXORDIUM_CLEAR_OCCUPY_FORTIFY`.
- [ ] Gli attacchi restano concentrati sul presidio.
- [ ] Il PS viene liberato.
- [ ] Il Bastione viene costruito nello stesso turno.
- [ ] La telemetria registra `ps_presidium_destroyed` e `ps_fortified_after_clear`.

## C. Conversione con guarnigione

- [ ] Nessun Bastione disponibile o ricostruzione non conveniente.
- [ ] Esiste un’unità economica capace di entrare sul PS dopo la rimozione.
- [ ] Il piano sceglie `GARRISON`.
- [ ] Il PS viene occupato nello stesso turno.
- [ ] La telemetria registra `ps_occupied_after_clear`.

## D. Abort e fallback

- [ ] Danno riservato insufficiente: nessun candidato.
- [ ] Bersaglio sopravvive: piano abbandonato senza softlock.
- [ ] Builder eliminato/bloccato: abort esplicito.
- [ ] ENE riservata non più disponibile: abort esplicito.
- [ ] PS non libero dopo gli attacchi: nessuna costruzione illegale.
- [ ] Il fallback Advanced continua il turno.

## E. Riserva ENE

- [ ] Tattiche di mano non consumano l’ENE riservata.
- [ ] Tattiche Starter non consumano l’ENE riservata.
- [ ] Acquisti ordinari non consumano l’ENE riservata.
- [ ] La riserva viene liberata a piano completato o abortito.

## F. Relay Survival

- [ ] Nessuna perdita recente: classificazione `SAFE` o `CONTESTED` secondo la minaccia.
- [ ] Una perdita recente con minaccia: classificazione `CRITICAL`.
- [ ] Due perdite entro cinque round, minaccia alta e poco supporto: `UNSUSTAINABLE`.
- [ ] Un PS periferico `UNSUSTAINABLE` non viene ricostruito automaticamente.
- [ ] Il centro può essere ricostruito quando `criticalValue` è vero.
- [ ] Le perdite più vecchie di cinque round non pesano più.

## G. Telemetria

- [ ] Estensione `F9T2b-1` presente.
- [ ] Un solo modulo Exordium eseguito per turno.
- [ ] Audit candidati e ragioni di esclusione leggibili.
- [ ] Contatori conversione e sopravvivenza coerenti.
- [ ] Nessun budget esaurito in condizioni normali.
- [ ] Cache/sessione Expert rimosse a fine turno.

## H. Partita lunga / APK

- [ ] Almeno una partita Exordium Expert su `Plains 2G large`.
- [ ] Confronto con F9T2a sullo stesso matchup/seed quando possibile.
- [ ] Nessuna crescita progressiva anomala di RAM.
- [ ] Nessun blocco o rallentamento crescente dei turni.
- [ ] I Bastioni non vengono ricostruiti in loop sullo stesso PS periferico.
- [ ] Le eliminazioni sui PS vengono convertite più spesso in controllo persistente.
