# F9U1a — Checklist manuale

Build da verificare: `C2-STABLE-1-F9U1a-APK-M4c`

## Avvio e struttura generale

- [ ] La build mostrata nel menu e nella partita è F9U1a.
- [ ] Una partita ufficiale 1v1 si avvia normalmente.
- [ ] Una partita FFA a 3 o 4 giocatori si avvia normalmente.
- [ ] La mappa e la barra di stato superiore restano leggibili e funzionali.
- [ ] Non compare più la vecchia barra inferiore con Fit, Focus, Mano, Log, Setup e Statistiche.
- [ ] Non compare durante la partita un Setup limitato a due giocatori.

## Dock sinistro

- [ ] Il dock è fissato sul lato sinistro della mappa e non viene centrato verticalmente.
- [ ] La Missione è mostrata quando il deck la contiene.
- [ ] Un deck senza Missione mostra uno stato assente/facoltativo chiaro.
- [ ] Le abilità di fazione sono visibili e mantengono costo, cooldown e stato.
- [ ] Mostra/Nascondi mano funziona senza perdere carte, selezioni o preview.
- [ ] Fine turno funziona dal dock.
- [ ] Mano e Fine turno restano disponibili anche senza unità selezionata.
- [ ] Il dock non impedisce di selezionare celle o unità adiacenti sul bordo sinistro.

## Camera e mappa

- [ ] Fit mostra tutta la mappa.
- [ ] Centra/Focus porta al riferimento corretto.
- [ ] Zoom + e − funzionano.
- [ ] Pan, rotellina e pinch non vengono bloccati dal nuovo dock.
- [ ] Il layout resta stabile sulle mappe grandi.
- [ ] Tutorial e checkpoint non modificano in modo errato la posizione del dock.

## Debug

- [ ] Il pulsante Debug è visibile nell’HUD desktop.
- [ ] Il pulsante Debug è visibile nella barra superiore mobile.
- [ ] Mano apre o riporta alla mano rapida.
- [ ] Log apre il pannello eventi.
- [ ] Statistiche apre il pannello statistiche.
- [ ] Telemetria apre e focalizza il pannello F9Q3e1-2.
- [ ] Il menu Debug si chiude cliccando fuori, con × e con Esc.
- [ ] Build e schema telemetrico mostrati nel menu sono corretti.
- [ ] Chiudendo un overlay si ritorna alla mappa senza cambiare camera o selezione.

## Inspector unità e azioni

- [ ] Selezionando una miniatura, l’Inspector attuale resta sul lato destro.
- [ ] Muovi, costruisci, attacchi e abilità continuano a funzionare.
- [ ] L’apertura di Debug non cancella il targeting in modo anomalo.
- [ ] L’uso di Mano dal dock non produce azioni duplicate.
- [ ] Fine turno durante una selezione pendente segue le normali conferme/regole.

Nota: il nuovo ordinamento verticale e la carta grande dell’Inspector appartengono a F9U1b e non sono criteri di questa candidata.

## Telemetria e regressioni

- [ ] Lo schema esportato è F9Q3e1-2.
- [ ] I PS sono attribuiti ai giocatori reali e non a side 0.
- [ ] Due istanze della stessa Pivot sono tracciate separatamente.
- [ ] La sovrapesca viene conteggiata una sola volta.
- [ ] Il roster mostra ancora 50 deck ufficiali.
- [ ] Deck Builder, Pool carte e Map Editor si aprono dal menu senza regressioni.
- [ ] Nessuna modifica è rilevata nelle carte, nei deck o nelle mappe.

## Android fisico

- [ ] In orizzontale il dock non copre una porzione eccessiva della mappa.
- [ ] Il pulsante Debug è facilmente premibile.
- [ ] La vecchia barra inferiore non lascia spazio vuoto.
- [ ] I controlli camera restano raggiungibili.
- [ ] Mano aperta e dock non provocano salti o vuoti temporanei anomali.
- [ ] Log e Statistiche sono scorrevoli.
- [ ] Nessun blocco dopo ripetute aperture/chiusure di Mano e Debug.
- [ ] Prestazioni e memoria restano comparabili a F9Q3e1a.

## Esito

- [ ] Validata come nuova baseline.
- [ ] Respinta: indicare dispositivo, risoluzione, passaggi e log.
