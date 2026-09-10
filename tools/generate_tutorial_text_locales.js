"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "data", "tutorial_scenarios.js"), "utf8");
const context = {};
vm.createContext(context);
vm.runInContext(`${source}\n;globalThis.__tutorialScenarios = TUTORIAL_SCENARIOS_F9O6;`, context);

const ENGLISH = Object.freeze({
  "1 DEF · Sanguinamento 2":"1 DEF · Bleeding 2",
  "1 PS controllato":"1 SP controlled",
  "2 HP · 0 DEF · Marchiato":"2 HP · 0 DEF · Marked",
  "Acquisizione completata":"Acquisition complete",
  "Adepto Fabeot":"Fabeot Adept",
  "Anthropos di Pietra":"Stone Anthropos",
  "Applica il Marchio al Fante Robot.":"Apply the Mark to the Robot Trooper.",
  "Applica Manto di Rovi all’Oplita.":"Apply Thorn Cloak to the Hoplite.",
  "Applica Marchio dei Sanguis al Miliziano evidenziato.":"Apply Mark of the Sanguis to the highlighted Militiaman.",
  "Artiglieria Exordium":"Exordium Artillery",
  "Attacca il Fante Robot con l’Adepto selezionato.":"Attack the Robot Trooper with the selected Adept.",
  "Attacca il Fante Robot evidenziato.":"Attack the highlighted Robot Trooper.",
  "Attacca il Fante Robot. I 2 ATT del Tribuno consumeranno la sua unica DEF; il danno eccedente non raggiungerà ancora gli HP.":"Attack the Robot Trooper. The Tribune’s 2 ATK will remove its only DEF; excess damage will not reach HP yet.",
  "Attacca il Fante Robot. L’Adepto ha 1 ATT, ma la Vulnerabilità aggiunge 1 danno e rimuove l’unica DEF senza ferire gli HP.":"Attack the Robot Trooper. The Adept has 1 ATK, but Vulnerability adds 1 damage and removes its only DEF without damaging HP.",
  "Attacca il Mech Pesante con il Legionario.":"Attack the Heavy Mech with the Legionary.",
  "Attacca il Mech Pesante.":"Attack the Heavy Mech.",
  "Attacca il Mech Pesante. Il Tribuno consumerà l’ultima DEF, preparando il colpo decisivo.":"Attack the Heavy Mech. The Tribune will remove its last DEF, setting up the decisive blow.",
  "Attacca l’Anthropos di Pietra con il Miliziano selezionato.":"Attack the Stone Anthropos with the selected Militiaman.",
  "Attacca l’Anthropos. Il Miliziano passa da 2 a 3 ATT grazie alla Superiorità Numerica: consumerà 3 dei 4 punti DEF e applicherà Sanguinamento 2.":"Attack the Anthropos. Numerical Superiority raises the Militiaman from 2 to 3 ATK: it will remove 3 of 4 DEF and apply Bleeding 2.",
  "Attacca l’Artiglieria Exordium con l’Oplita.":"Attack the Exordium Artillery with the Hoplite.",
  "Attacca l’Artiglieria. Senza DEF e con 2 HP rimasti, verrà distrutta dai 2 ATT dell’Oplita.":"Attack the Artillery. With no DEF and 2 HP remaining, the Hoplite’s 2 ATK will destroy it.",
  "Attacca. Con DEF zero, i 4 ATT del Legionario colpiranno i 4 HP del Mech e lo distruggeranno.":"Attack. With DEF at zero, the Legionary’s 4 ATK will hit the Mech’s 4 HP and destroy it.",
  "Attiva Clausola di Acquisizione.":"Activate Acquisition Clause.",
  "Attiva Clausola di Acquisizione. Costa 4 ENE e converte un bersaglio valido già marchiato.":"Activate Acquisition Clause. It costs 4 ENE and converts an eligible target that is already Marked.",
  "Attiva Colpo Pesante.":"Activate Heavy Blow.",
  "Attiva Sentenza Porpora dal pannello dell’unità.":"Activate Purple Sentence from the unit panel.",
  "Attiva Sentenza Porpora.":"Activate Purple Sentence.",
  "Avanzata Fanteria":"Infantry advance",
  "Barriera Armata":"Armed Barrier",
  "Bastione Ligneo":"Wooden Bastion",
  "Benvenuto nella rete Nexus. Questa lezione mostra la riserva Starter, le differenze tra Fanteria, Veicolo e Struttura, e il vantaggio di Avanguardia.":"Welcome to the Nexus network. This lesson covers the Starter reserve, the differences between Infantry, Vehicles, and Structures, and the advantage of Vanguard.",
  "Benvenuto nelle schiere di Aurex. Imparerai a leggere le carte, schierare le unità, affrontare la DEF, usare un’abilità attiva e giocare una tattica.":"Welcome to Aurex’s ranks. You will learn to read cards, deploy units, overcome DEF, use an active ability, and play a tactic.",
  "Bersaglia il Fante Robot con Sentenza Porpora.":"Target the Robot Trooper with Purple Sentence.",
  "Bersaglia il Mech Pesante con Missile EMP.":"Target the Heavy Mech with EMP Missile.",
  "Bersaglia il Miliziano evidenziato con Marchio dei Sanguis.":"Target the highlighted Militiaman with Mark of the Sanguis.",
  "Bersaglia l’Anthropos di Pietra con Esca d’Attacco.":"Target the Stone Anthropos with Attack Lure.",
  "Bersaglia l’Oplita di Confine con Manto di Rovi.":"Target the Border Hoplite with Thorn Cloak.",
  "Bersaglia l’Oplita di Confine con Natura Vigile.":"Target the Border Hoplite with Vigilant Nature.",
  "Bersaglia la Radura Curativa con Bastione Ligneo.":"Target the Healing Grove with Wooden Bastion.",
  "Bersaglio":"Target",
  "Bersaglio accerchiato":"Surrounded target",
  "Cella di sbarco":"Deployment cell",
  "Cittadella Fabeot":"Fabeot Citadel",
  "Clausola di Acquisizione":"Acquisition Clause",
  "Colpisci il Fante Robot. Senza DEF, i 2 danni ridurranno direttamente i suoi 2 HP.":"Strike the Robot Trooper. With no DEF, 2 damage will directly remove its 2 HP.",
  "Colpo Pesante":"Heavy Blow",
  "Concedi Contrattacco all’Oplita.":"Grant Counterattack to the Hoplite.",
  "Confronta gli effetti: serve Marchio dei Sanguis.":"Compare the effects: you need Mark of the Sanguis.",
  "Confronta le carte":"Compare the cards",
  "Contrattacco pronto":"Counterattack ready",
  "Contratti Fabeot":"Fabeot contracts",
  "Contratto di Usura":"Usury Contract",
  "Converti il Fante Robot marchiato.":"Convert the Marked Robot Trooper.",
  "Costruisci la Barriera sulla cella evidenziata.":"Build the Barrier on the highlighted cell.",
  "Costruisci la Barriera sulla cella indicata. La Fanteria ha mosso e ora usa la propria azione per estendere la rete di sbarco.":"Build the Barrier on the indicated cell. The Infantry moved and now uses its action to extend the deployment network.",
  "DEF pari agli HP":"DEF equal to HP",
  "Droide di Sicurezza":"Security Droid",
  "Embargo":"Embargo",
  "Embargo ha bloccato l’unica carta Nexus per un turno. Il numero di carte colpite deriva dai Punti Strategici controllati, non da una scelta nascosta.":"Embargo blocked the Nexus’s only card for one turn. The number of affected cards comes from controlled Strategic Points, not a hidden choice.",
  "ENE Nexus disturbata":"Nexus ENE disrupted",
  "Esca d’Attacco ha attivato le fanterie in sequenza. La prima ha eliminato l’ultima DEF; le successive hanno abbattuto gli HP. Il Punto centrale è ora libero.":"Attack Lure activated the Infantry in sequence. The first removed the last DEF; the others depleted the HP. The central Point is now clear.",
  "Fante Robot":"Robot Trooper",
  "Fante Robot acquisibile":"Robot Trooper eligible for acquisition",
  "Fante Robot convertito":"Converted Robot Trooper",
  "Fante Robot Nexus":"Nexus Robot Trooper",
  "Fante Robot vulnerabile":"Vulnerable Robot Trooper",
  "Fanteria pronta":"Infantry ready",
  "Fine turno":"End turn",
  "Fortifica la Radura Curativa.":"Fortify the Healing Grove.",
  "Gerarca Fabeot":"Fabeot Hierarch",
  "Gioca Contratto di Usura per disturbare il deposito e le prossime entrate ENE del Nexus.":"Play Usury Contract to disrupt the Nexus reservoir and its next ENE income.",
  "Gioca Contratto di Usura.":"Play Usury Contract.",
  "Gioca Embargo.":"Play Embargo.",
  "Gioca Embargo. L’Avamposto presidia un Punto Strategico e la Mano Nexus contiene una sola carta: il risultato è deterministico.":"Play Embargo. The Outpost controls a Strategic Point and the Nexus Hand contains one card, so the outcome is deterministic.",
  "Gioca Esca d’Attacco sull’Anthropos accerchiato.":"Play Attack Lure on the surrounded Anthropos.",
  "Gli Agathoi tengono il Punto centrale con un Anthropos di Pietra. Non lo abbatterai con un singolo colpo: dovrai leggere la Mano, scegliere le carte giuste e trasformare il numero in pressione.":"The Agathoi hold the central Point with a Stone Anthropos. One blow will not defeat it: read your Hand, choose the right cards, and turn numbers into pressure.",
  "HP e DEF":"HP and DEF",
  "Il bersaglio è ancora vivo, ha costo 2, 2 HP e conserva il Marchio. Tutte le condizioni della Clausola di Acquisizione sono ora leggibili sulla mappa.":"The target is still alive, costs 2, has 2 HP, and retains the Mark. Every condition of Acquisition Clause is now visible on the map.",
  "Il deposito Nexus è sceso da 5 a 4 ENE e subirà -1 ENE alle prossime due entrate. Mano, territorio e risorse sono tre leve distinte dello stesso controllo Fabeot.":"The Nexus reservoir fell from 5 to 4 ENE and will suffer -1 ENE on its next two income steps. Hand, territory, and resources are three distinct levers of Fabeot control.",
  "Il Droide di Sicurezza è la Fanteria Starter. La Fanteria muove di una cella e, dopo il movimento, può ancora attaccare, usare un’abilità o costruire una Struttura.":"The Security Droid is the Starter Infantry. Infantry moves one cell and can still attack, use an ability, or build a Structure after moving.",
  "Il Fante Robot è Marchiato e Vulnerabile: il prossimo attacco riceverà +1 danno. La sua DEF verrà rimossa, mentre i 2 HP resteranno entro il limite della Clausola di Acquisizione.":"The Robot Trooper is Marked and Vulnerable: the next attack gains +1 damage. Its DEF will be removed while its 2 HP remain within Acquisition Clause’s limit.",
  "Il Fante Robot è passato sotto controllo Fabeot. Entra esausto e con Inibizione Azione: la conversione è permanente, ma non concede un’azione immediata.":"The Robot Trooper is now under Fabeot control. It enters exhausted and Action-Inhibited: conversion is permanent but grants no immediate action.",
  "Il Legionario ha spezzato l’ultima DEF dell’Oplita. Le Spine lo hanno ferito e il Contrattacco lo ha abbattuto. L’Oplita conserva tutti gli HP.":"The Legionary broke the Hoplite’s last DEF. Thorns wounded it and Counterattack destroyed it. The Hoplite retains all its HP.",
  "Il Mech non è esausto. Selezionalo: le celle raggiungibili verranno evidenziate e potrà muovere immediatamente.":"The Mech is not exhausted. Select it: reachable cells will be highlighted and it can move immediately.",
  "Il Mech reagisce contro il Legionario. Grazie all’EMP attacca con 2: consuma la sua DEF, ma non raggiunge gli HP. Ora il Mech è privo di protezione.":"The Mech retaliates against the Legionary. EMP reduces its attack to 2: it removes DEF but does not reach HP. The Mech now has no protection.",
  "Il Missile ha consumato 2 DEF: al Mech ne resta 1. Inoltre il suo ATT è sceso da 3 a 2. Ora il Tribuno può spezzare l’ultima protezione.":"The Missile removed 2 DEF, leaving the Mech with 1. Its ATK also fell from 3 to 2. The Tribune can now break the last protection.",
  "Il Nexus ha lasciato un Fante Robot isolato. Non serve distruggerlo: prima rendilo vulnerabile, poi sfrutta il Marchio per trasferirne il controllo alla Cittadella.":"The Nexus left a Robot Trooper isolated. Do not destroy it: first make it vulnerable, then use the Mark to transfer control to the Citadel.",
  "Il Nexus mantiene la posizione. È di nuovo il tuo turno: schiera il Legionario Pesante prima di impegnare il Tribuno.":"The Nexus holds position. It is your turn again: deploy the Heavy Legionary before committing the Tribune.",
  "Il Nexus risponde con un Mech Pesante: 4 HP, 3 DEF e 3 ATT. Una sola azione non basterà; dovrai coordinare tattica e unità.":"The Nexus responds with a Heavy Mech: 4 HP, 3 DEF, and 3 ATK. One action will not be enough; coordinate tactic and units.",
  "Il nodo avanzato è operativo. Da questa Struttura puoi schierare nuove unità più vicino al Punto Strategico centrale.":"The forward node is operational. This Structure lets you deploy new units closer to the central Strategic Point.",
  "Il Quad è arrivato vicino al centro, ma entra esausto. Un Veicolo ordinario deve attendere il turno successivo prima di muovere.":"The Quad reached the center but enters exhausted. An ordinary Vehicle must wait until the next turn before moving.",
  "Il Quad è pronto. Ora completerà il percorso ordinario verso il Punto Strategico.":"The Quad is ready. It will now complete the ordinary route to the Strategic Point.",
  "Il Quad libera il centro per il confronto. Il Mech Leggero è una carta della Mano e possiede Avanguardia: può agire nello stesso turno in cui entra in gioco.":"The Quad clears the center for comparison. The Light Mech is a Hand card with Vanguard, so it can act on the turn it enters play.",
  "Il Sanguinamento ha sottratto 2 HP direttamente: l’Anthropos è sceso a 4 HP pur conservando 1 DEF. Ora serve una carta che trasformi l’accerchiamento in attacchi immediati.":"Bleeding directly removed 2 HP: the Anthropos fell to 4 HP while retaining 1 DEF. Now use a card that turns the encirclement into immediate attacks.",
  "Il Tribuno":"The Tribune",
  "Il Tribuno è esausto. Termina il turno per renderlo pronto nel prossimo.":"The Tribune is exhausted. End the turn so it will be ready on the next one.",
  "Il turno torna al Nexus. Il Quad Ricognitore è il Veicolo Starter: nel ritmo Rapida può muovere fino a due celle, ma normalmente deve scegliere tra movimento e azione.":"The turn returns to the Nexus. The Scout Quad is the Starter Vehicle: at Fast pace it can move up to two cells, but normally must choose between movement and an action.",
  "Il turno torna al Nexus. Ora il Droide può muovere e poi costruire nello stesso turno.":"The turn returns to the Nexus. The Droid can now move and then build during the same turn.",
  "L’Anthropos possiede 6 HP e 4 DEF. Tre fanterie Liberti lo circondano: quando almeno un alleato è adiacente allo stesso bersaglio, Superiorità Numerica aggiunge +1 ATT all’attacco.":"The Anthropos has 6 HP and 4 DEF. Three Liberti Infantry surround it: when at least one ally is adjacent to the same target, Numerical Superiority adds +1 ATK to the attack.",
  "L’Artiglieria ha annullato tutta la DEF, ma non ha sottratto HP alla Radura. La fortificazione ha assorbito il colpo e la linea può rispondere.":"The Artillery removed all DEF but dealt no HP damage to the Grove. The fortification absorbed the blow and the line can respond.",
  "L’Oplita di Confine presidia il Punto centrale con 3 HP, 3 DEF e Spine 1 permanenti. La Radura Curativa adiacente mantiene aperta la rete alleata per le tattiche difensive.":"The Border Hoplite guards the central Point with 3 HP, 3 DEF, and permanent Thorns 1. The adjacent Healing Grove keeps the allied network open for defensive tactics.",
  "L’Oplita ora infligge 2 danni diretti a chi lo attacca. Le Spine non impediscono il colpo nemico: trasformano però ogni assalto in un costo.":"The Hoplite now deals 2 direct damage to attackers. Thorns do not prevent an enemy strike, but make every assault costly.",
  "La Barriera Armata è la Struttura Starter. Le Strutture non si muovono, ma diventano nuovi nodi della rete: le unità possono sbarcare sul QG o nelle celle libere adiacenti a un edificio alleato.":"The Armed Barrier is the Starter Structure. Structures cannot move but become new network nodes: units may deploy on the HQ or open cells adjacent to an allied building.",
  "La carta Starter è ancora nella riserva. Potrai schierare altre copie finché ENE, spazio e limiti della modalità lo consentono.":"The Starter card remains in reserve. You may deploy more copies while ENE, space, and mode limits allow it.",
  "La DEF del Fante Robot è ora a zero. Dopo il turno del Nexus, il Legionario è pronto a usare Colpo Pesante.":"The Robot Trooper’s DEF is now zero. After the Nexus turn, the Legionary is ready to use Heavy Blow.",
  "La DEF è scesa da 4 a 1. Il bersaglio è ancora a 6 HP, ma Sanguinamento 2 lo colpirà direttamente all’inizio del suo turno, ignorando la DEF residua.":"DEF fell from 4 to 1. The target still has 6 HP, but Bleeding 2 will strike directly at the start of its turn, ignoring remaining DEF.",
  "La Guardia ha consumato parte della DEF dell’Oplita, ma le Spine 2 l’hanno distrutta. Prima ondata respinta senza spendere un attacco.":"The Guard removed part of the Hoplite’s DEF, but Thorns 2 destroyed it. The first wave was repelled without spending an attack.",
  "La linea Agathoi non vince inseguendo ogni bersaglio. Imparerai a scegliere la difesa adatta, presidiare un Punto Strategico e resistere a tre ondate Exordium.":"The Agathoi line does not win by chasing every target. You will learn to choose the right defense, hold a Strategic Point, and withstand three Exordium waves.",
  "La Mano offre più risposte, ma la prima ondata è fragile. Manto di Rovi porta le Spine a 2 fino al prossimo turno: è la scelta più efficiente per punire un assalto leggero.":"Your Hand offers several answers, but the first wave is fragile. Thorn Cloak raises Thorns to 2 until the next turn, the most efficient choice against a light assault.",
  "La Radura possiede ora 4 DEF, pari ai suoi 4 HP. Finché il colpo incontra almeno un punto di DEF, l’eccesso non oltrepassa la protezione.":"The Grove now has 4 DEF, equal to its 4 HP. As long as a strike meets at least one DEF, excess damage does not pass through the protection.",
  "La seconda ondata è più resistente. Natura Vigile concede Contrattacco: se l’Oplita sopravvive a un attacco base, risponde immediatamente una sola volta.":"The second wave is tougher. Vigilant Nature grants Counterattack: if the Hoplite survives a base attack, it immediately retaliates once.",
  "La terza ondata mira alla Radura. Bastione Ligneo imposta la DEF attuale della Struttura pari ai suoi HP: la scelta corretta contro un singolo colpo molto potente.":"The third wave targets the Grove. Wooden Bastion sets the Structure’s current DEF equal to its HP, the right choice against one powerful strike.",
  "Lancia Missile EMP contro il Mech Pesante.":"Launch EMP Missile at the Heavy Mech.",
  "Le tre carte Starter restano sempre nella riserva: una Fanteria, un Veicolo e una Struttura. Non vengono pescate e non vengono consumate quando le usi; paghi comunque il loro costo in ENE e rispetti i limiti di campo.":"The three Starter cards always remain in reserve: one Infantry, one Vehicle, and one Structure. They are neither drawn nor consumed when used; you still pay their ENE cost and obey battlefield limits.",
  "Legionario Pesante":"Heavy Legionary",
  "Lezione 1 · Disciplina di Aurex":"Lesson 1 · Aurex’s Discipline",
  "Lezione 2 · Rete operativa Nexus":"Lesson 2 · Nexus Operational Network",
  "Lezione 3 · Il Punto non arretra":"Lesson 3 · The Point Holds",
  "Lezione 4 · La pressione apre il varco":"Lesson 4 · Pressure Opens the Breach",
  "Lezione 5 · Il contratto cambia padrone":"Lesson 5 · The Contract Changes Hands",
  "Lezione completata. Hai applicato un Marchio di Vulnerabilità, preparato e convertito il bersaglio, bloccato la Mano nemica e disturbato il flusso ENE senza affidarti al caso.":"Lesson complete. You applied a Vulnerability Mark, prepared and converted the target, blocked the enemy Hand, and disrupted ENE flow without relying on chance.",
  "Lezione completata. Hai confrontato le carte tramite anteprima, scelto la risposta corretta, applicato Sanguinamento, sfruttato Superiorità Numerica e convertito l’accerchiamento in conquista.":"Lesson complete. You compared cards through previews, chose the right answer, applied Bleeding, used Numerical Superiority, and turned encirclement into conquest.",
  "Lezione completata. Hai letto e giocato carte unità, consumato la DEF prima degli HP, usato un’abilità attiva e coordinato Missile EMP con due attacchi.":"Lesson complete. You read and played unit cards, removed DEF before HP, used an active ability, and coordinated EMP Missile with two attacks.",
  "Lezione completata. Hai scelto tre difese diverse, trasformato gli attacchi nemici in danno con Spine e Contrattacco, fortificato una Struttura e mantenuto il controllo del Punto.":"Lesson complete. You chose three different defenses, turned enemy attacks into damage with Thorns and Counterattack, fortified a Structure, and held the Point.",
  "Lezione completata. Hai usato la riserva Starter, mosso e costruito con la Fanteria, esteso la rete con una Struttura, raggiunto il centro con un Veicolo e confrontato lo sbarco ordinario con Avanguardia.":"Lesson complete. You used the Starter reserve, moved and built with Infantry, extended the network with a Structure, reached the center with a Vehicle, and compared ordinary deployment with Vanguard.",
  "Manto di Rovi":"Thorn Cloak",
  "Marchiato · Vulnerabile +1":"Marked · Vulnerable +1",
  "Mech indebolito":"Weakened Mech",
  "Mech Leggero":"Light Mech",
  "Mech Leggero pronto":"Light Mech ready",
  "Mech Pesante":"Heavy Mech",
  "Miliziano da marchiare":"Militiaman to mark",
  "Miliziano marchiato":"Marked Militiaman",
  "Missile EMP":"EMP Missile",
  "Missile EMP è una tattica. Costa 3 ENE, infligge 2 danni e riduce permanentemente di 1 l’ATT del bersaglio. Le tattiche non diventano miniature: si risolvono dalla Mano.":"EMP Missile is a tactic. It costs 3 ENE, deals 2 damage, and permanently reduces the target’s ATK by 1. Tactics do not become miniatures: they resolve from the Hand.",
  "Mostra mano":"Show Hand",
  "Muovi il Droide sulla cella evidenziata.":"Move the Droid to the highlighted cell.",
  "Muovi il Droide sulla cella indicata. Dopo lo spostamento resterà pronto per costruire.":"Move the Droid to the indicated cell. It will remain ready to build after moving.",
  "Muovi il Mech sul Punto Strategico centrale.":"Move the Mech onto the central Strategic Point.",
  "Muovi il Mech sul Punto Strategico. Avanguardia ha eliminato il turno di attesa.":"Move the Mech onto the Strategic Point. Vanguard removed the waiting turn.",
  "Muovi il Predone sul Punto Strategico centrale.":"Move the Raider onto the central Strategic Point.",
  "Muovi il Predone sul Punto Strategico e completa l’assalto.":"Move the Raider onto the Strategic Point and complete the assault.",
  "Muovi il Quad sul Punto Strategico centrale.":"Move the Quad onto the central Strategic Point.",
  "Narratore Agathoi":"Agathoi Narrator",
  "Narratore Exordium":"Exordium Narrator",
  "Narratore Fabeot":"Fabeot Narrator",
  "Narratore Liberti":"Liberti Narrator",
  "Narratore Nexus":"Nexus Narrator",
  "Natura Vigile":"Vigilant Nature",
  "Nodo avanzato":"Forward node",
  "Ogni carta mostra il costo in ENE, il nome, il tipo e le statistiche. HP indica quanto danno può sopportare l’unità; DEF è la protezione da consumare; ATT è la forza dell’attacco base. Il Tribuno costa 2 ENE e possiede anche un’abilità.":"Each card shows its ENE cost, name, type, and statistics. HP is the damage a unit can endure; DEF is protection that must be removed; ATK is base-attack strength. The Tribune costs 2 ENE and also has an ability.",
  "Oplita di Confine":"Border Hoplite",
  "Ora controlla le risorse dell’avversario. Embargo blocca una carta per ogni Punto Strategico Fabeot; Contratto di Usura sottrae 1 ENE e riduce l’entrata di 1 per due turni.":"Now control the opponent’s resources. Embargo blocks one card per Fabeot Strategic Point; Usury Contract removes 1 ENE and reduces income by 1 for two turns.",
  "Passa il puntatore sulle carte e leggi le anteprime. Nel tutorial l’anteprima resta pienamente visibile anche quando il resto della schermata è oscurato. Cerca una carta che faccia applicare Sanguinamento 2 al prossimo attacco di una fanteria.":"Hover over the cards and read their previews. During the tutorial, previews remain fully visible even while the rest of the screen is dimmed. Find a card that applies Bleeding 2 to an Infantry unit’s next attack.",
  "Predone Liberto":"Liberti Raider",
  "Premi il pulsante dell’abilità. Colpo Pesante costa 1 ENE, infligge 2 danni entro raggio 2 e poi entra in ricarica.":"Press the ability button. Heavy Blow costs 1 ENE, deals 2 damage within range 2, and then enters cooldown.",
  "Premi Mostra mano.":"Press Show Hand.",
  "Premi Riduci mano.":"Press Collapse Hand.",
  "Prima ondata respinta":"First wave repelled",
  "Primo procedimento completato: rete avanzata, sbarco del Veicolo, attesa di un turno e movimento sul Punto Strategico.":"First procedure complete: forward network, Vehicle deployment, one waiting turn, and movement onto the Strategic Point.",
  "PS controllato":"SP controlled",
  "Punto conquistato":"Point captured",
  "Punto difeso":"Point defended",
  "Punto Strategico centrale":"Central Strategic Point",
  "Quad pronto":"Quad ready",
  "Quad Ricognitore":"Scout Quad",
  "Radura ancora integra":"Grove still intact",
  "Radura Curativa":"Healing Grove",
  "Rete di sbarco":"Deployment network",
  "Riapri la Mano. Potrai ridurla e mostrarla ogni volta che serve.":"Reopen the Hand. You can collapse and show it whenever needed.",
  "Riduci la Mano per osservare meglio la mappa.":"Collapse the Hand for a clearer view of the map.",
  "Riduci mano":"Collapse Hand",
  "Sanguinamento risolto":"Bleeding resolved",
  "Sbarco Avanguardia":"Vanguard deployment",
  "Sbarco dalla rete":"Network deployment",
  "Sbarco iniziale":"Initial deployment",
  "Scegli dalla Mano la carta che prepara Sanguinamento 2 sul prossimo attacco base di una fanteria.":"Choose the Hand card that prepares Bleeding 2 on an Infantry unit’s next base attack.",
  "Scegli la carta che ordina alle fanterie adiacenti al nemico di attaccare immediatamente, anche se hanno già agito.":"Choose the card that orders Infantry adjacent to the enemy to attack immediately, even if they have already acted.",
  "Scegli la carta corretta":"Choose the correct card",
  "Schiera il Droide sulla cella evidenziata.":"Deploy the Droid on the highlighted cell.",
  "Schiera il Droide sulla cella indicata, vicino al QG. Come quasi tutte le unità appena schierate, entra esausto.":"Deploy the Droid on the indicated cell near the HQ. Like almost every newly deployed unit, it enters exhausted.",
  "Schiera il Legionario sulla cella evidenziata.":"Deploy the Legionary on the highlighted cell.",
  "Schiera il Legionario sulla cella indicata. Entrerà esausto, ma sarà pronto dopo il turno del Nexus.":"Deploy the Legionary on the indicated cell. It enters exhausted but will be ready after the Nexus turn.",
  "Schiera il Mech sulla cella evidenziata.":"Deploy the Mech on the highlighted cell.",
  "Schiera il Mech sulla stessa cella della rete avanzata. Avanguardia lo manterrà pronto.":"Deploy the Mech on the same cell of the forward network. Vanguard will keep it ready.",
  "Schiera il Quad sulla cella evidenziata.":"Deploy the Quad on the highlighted cell.",
  "Schiera il Quad sulla cella indicata, resa disponibile dalla Barriera avanzata.":"Deploy the Quad on the indicated cell made available by the forward Barrier.",
  "Schiera Il Tribuno sulla cella evidenziata.":"Deploy The Tribune on the highlighted cell.",
  "Schiera Il Tribuno sulla cella indicata. Le unità senza Avanguardia entrano esauste e agiranno da un turno successivo.":"Deploy The Tribune on the indicated cell. Units without Vanguard enter exhausted and can act on a later turn.",
  "Seconda ondata respinta":"Second wave repelled",
  "Seconda scelta":"Second choice",
  "Seleziona Bastione Ligneo.":"Select Wooden Bastion.",
  "Seleziona il Droide di Sicurezza dalla riserva Starter.":"Select the Security Droid from the Starter reserve.",
  "Seleziona il Droide di Sicurezza Starter.":"Select the Starter Security Droid.",
  "Seleziona il Droide di Sicurezza.":"Select the Security Droid.",
  "Seleziona il Droide di Sicurezza. Le celle raggiungibili verranno evidenziate subito.":"Select the Security Droid. Reachable cells will be highlighted immediately.",
  "Seleziona il Gerarca Fabeot.":"Select the Fabeot Hierarch.",
  "Seleziona il Legionario Pesante per il colpo finale.":"Select the Heavy Legionary for the final blow.",
  "Seleziona il Legionario Pesante.":"Select the Heavy Legionary.",
  "Seleziona il Legionario Pesante. Costa 3 ENE, ha 3 HP, 2 DEF e 4 ATT.":"Select the Heavy Legionary. It costs 3 ENE and has 3 HP, 2 DEF, and 4 ATK.",
  "Seleziona il Mech Leggero dalla Mano.":"Select the Light Mech from the Hand.",
  "Seleziona il Mech Leggero.":"Select the Light Mech.",
  "Seleziona il Miliziano marchiato.":"Select the Marked Militiaman.",
  "Seleziona il Predone Liberto.":"Select the Liberti Raider.",
  "Seleziona il Predone Liberto. Le reazioni coordinate non gli hanno consumato l’azione normale.":"Select the Liberti Raider. The coordinated reactions did not consume its normal action.",
  "Seleziona il Quad Ricognitore dalla riserva Starter.":"Select the Scout Quad from the Starter reserve.",
  "Seleziona il Quad Ricognitore Starter.":"Select the Starter Scout Quad.",
  "Seleziona il Quad Ricognitore.":"Select the Scout Quad.",
  "Seleziona il Quad Ricognitore. Le celle raggiungibili verranno evidenziate subito.":"Select the Scout Quad. Reachable cells will be highlighted immediately.",
  "Seleziona Il Tribuno.":"Select The Tribune.",
  "Seleziona Il Tribuno. Dopo aver scelto una carta unità, la mappa evidenzia le celle legali di sbarco.":"Select The Tribune. After choosing a unit card, the map highlights legal deployment cells.",
  "Seleziona Il Tribuno. È pronto e si trova adiacente al Fante Robot.":"Select The Tribune. It is ready and adjacent to the Robot Trooper.",
  "Seleziona l’Adepto Fabeot.":"Select the Fabeot Adept.",
  "Seleziona l’Oplita di Confine.":"Select the Border Hoplite.",
  "Seleziona l’Oplita. Ha resistito alle ondate ed è ancora pronto ad agire.":"Select the Hoplite. It survived the waves and is still ready to act.",
  "Seleziona la Barriera Armata dalla riserva Starter. Il Droide appena mosso agirà da costruttore.":"Select the Armed Barrier from the Starter reserve. The Droid that just moved will act as builder.",
  "Seleziona la Barriera Armata Starter.":"Select the Starter Armed Barrier.",
  "Seleziona la carta Il Tribuno.":"Select The Tribune card.",
  "Seleziona la Cittadella Fabeot.":"Select the Fabeot Citadel.",
  "Seleziona Manto di Rovi.":"Select Thorn Cloak.",
  "Seleziona Missile EMP.":"Select EMP Missile.",
  "Seleziona Natura Vigile.":"Select Vigilant Nature.",
  "Sentenza Porpora":"Purple Sentence",
  "Sentenza Porpora costa 2 ENE. Il bersaglio marchiato subisce +1 danno da attacchi e abilità offensive fino a fine turno; quel Marchio soddisfa anche una clausola di acquisizione Fabeot.":"Purple Sentence costs 2 ENE. The Marked target takes +1 damage from attacks and offensive abilities until end of turn; that Mark also satisfies a Fabeot acquisition clause.",
  "Serve una carta di attacco coordinato: Esca d’Attacco.":"You need a coordinated-attack card: Attack Lure.",
  "Spine 2":"Thorns 2",
  "Spine e Contrattacco sono reazioni diverse. Le Spine infliggono danno diretto; il Contrattacco usa l’ATT dell’Oplita e colpisce prima la DEF nemica.":"Thorns and Counterattack are different reactions. Thorns deal direct damage; Counterattack uses the Hoplite’s ATK and hits enemy DEF first.",
  "Starter ancora disponibile":"Starter still available",
  "Starter Nexus":"Nexus Starters",
  "Termina il turno con il pulsante evidenziato.":"End the turn with the highlighted button.",
  "Termina il turno e lascia che l’Exordium urti contro la linea.":"End the turn and let the Exordium strike the line.",
  "Termina il turno e prepara la risposta dell’Oplita.":"End the turn and prepare the Hoplite’s response.",
  "Termina il turno per far scattare il Sanguinamento.":"End the turn to trigger Bleeding.",
  "Termina il turno per rendere pronto il Quad.":"End the turn to ready the Quad.",
  "Termina il turno. Il Droide sarà pronto quando la rete tornerà sotto il tuo controllo.":"End the turn. The Droid will be ready when the network returns to your control.",
  "Termina il turno. L’ultima ondata tenterà di demolire la Struttura.":"End the turn. The last wave will try to demolish the Structure.",
  "Un attacco normale colpisce prima la DEF. Finché il bersaglio possiede DEF, l’eventuale forza in eccesso non passa agli HP. Dopo che la DEF è scesa a zero, un attacco successivo può ferire gli HP.":"A normal attack hits DEF first. While the target has DEF, excess strength does not pass to HP. After DEF reaches zero, a later attack can damage HP.",
  "Un Fante Robot Nexus entra nell’area di addestramento. Possiede 2 HP, 1 DEF e 2 ATT.":"A Nexus Robot Trooper enters the training area. It has 2 HP, 1 DEF, and 2 ATK.",
  "Usa Colpo Pesante sul Fante Robot.":"Use Heavy Blow on the Robot Trooper.",
  "Usa la Clausola sul Fante Robot marchiato.":"Use the Clause on the Marked Robot Trooper.",
  "Varco aperto":"Breach opened",
  "Veicolo esausto":"Exhausted Vehicle"
});

const VOICE = Object.freeze({
  "lesson-1-exordium":Object.freeze({
    "lesson-welcome":Object.freeze(["Benvenuto nelle schiere di Aurex. Il Nexus preferisce misurare il campo finché il momento è già passato; noi impariamo a leggerlo e a colpire quando conta. Carte, schieramento, DEF, abilità e tattiche sono parti dello stesso assalto.", "Welcome to Aurex’s ranks. The Nexus prefers to measure the field until the moment has passed; we learn to read it and strike when it matters. Cards, deployment, DEF, abilities, and tactics are parts of the same assault."]),
    "explain-defense":Object.freeze(["Un attacco normale consuma prima la DEF. L’ATT eccedente non passa agli HP: usare 4 ATT per togliere l’ultimo punto DEF spreca forza che potevi riservare al colpo successivo. Apri la protezione con il colpo giusto, poi colpisci gli HP.", "A normal attack removes DEF first. Excess ATK does not pass to HP: spending 4 ATK on the last DEF wastes strength you could save for the next strike. Open the protection with the right blow, then hit HP."]),
    "mech-arrival":Object.freeze(["Il Nexus risponde con un Mech Pesante: 4 HP, 3 DEF e 3 ATT. Non disperdere il fuoco: un nemico lasciato vivo continua ad agire. Concentra tattica e più unità sullo stesso bersaglio finché è eliminato.", "The Nexus responds with a Heavy Mech: 4 HP, 3 DEF, and 3 ATK. Do not spread your fire: an enemy left alive keeps acting. Focus your tactic and several units on one target until it is destroyed."]),
    "tribune-breaks-mech-defense":Object.freeze(["Usa Il Tribuno per consumare l’ultima DEF. È il colpo meno costoso che apre gli HP: conserva l’ATT del Legionario per il bersaglio ormai scoperto.", "Use The Tribune to remove the last DEF. It is the least expensive blow that opens the HP: save the Legionary’s ATK for the exposed target."]),
    "destroy-mech":Object.freeze(["Adesso il Legionario chiude l’assalto. Con DEF zero, i 4 ATT vanno sui 4 HP: è qui che la potenza pesante rende, non un colpo prima.", "Now the Legionary ends the assault. With DEF at zero, its 4 ATK hits 4 HP: this is where heavy power pays off, not one strike earlier."]),
    "lesson-complete":Object.freeze(["Lezione completata. Un assalto serio parte quando Depot ENE, tattica disponibile e ricarica delle abilità sono allineati. Contro i calcoli Nexus o i contratti Fabeot, attaccare a metà significa offrire loro il turno che aspettavano.", "Lesson complete. A serious assault begins when the ENE reservoir, available tactics, and ability cooldowns align. Against Nexus calculations or Fabeot contracts, a half-attack gives them the turn they were waiting for."])
  }),
  "lesson-2-nexus":Object.freeze({
    "nexus-welcome":Object.freeze(["Protocollo di addestramento attivo. Obiettivo: trasformare QG, Fanteria, Strutture e Avanguardia in una rete di presenza e schieramento. Valuta ogni posizione per costo, copertura e continuità operativa.", "Training protocol active. Objective: turn HQ, Infantry, Structures, and Vanguard into a network of presence and deployment. Evaluate every position by cost, coverage, and operational continuity."]),
    "read-starter-structure":Object.freeze(["La Barriera Armata è la Struttura Starter. Una Struttura può occupare un PS come ogni altra unità da campo; se costruita su un PS legalmente accessibile, ne mantiene il controllo e contemporaneamente crea un nodo di sbarco.", "The Armed Barrier is the Starter Structure. A Structure can occupy an SP like any other field unit; if built on a legally accessible SP, it maintains control while creating a deployment node."]),
    "build-forward-structure":Object.freeze(["Costruisci la Barriera sulla cella indicata. La Fanteria converte il proprio movimento in infrastruttura: la nuova posizione non serve solo a difendere, ma riduce la distanza dei futuri schieramenti.", "Build the Barrier on the indicated cell. Infantry converts movement into infrastructure: the new position does more than defend—it shortens future deployments."]),
    "deployment-network-online":Object.freeze(["Il nodo avanzato è operativo immediatamente. Se possiedi ancora ENE, una carta unità e spazio legale, puoi usare la Struttura appena costruita per schierare nello stesso turno un reparto avanzato più vicino al fronte.", "The forward node is operational immediately. If you still have ENE, a unit card, and legal space, use the newly built Structure to deploy an advanced unit closer to the front during the same turn."]),
    "vanguard-captures-center":Object.freeze(["Muovi il Mech sul Punto Strategico. Il controllo vale solo se la rete può sostenerlo: occupare un PS che non puoi rinforzare trasforma un vantaggio temporaneo in perdita di ENE e tempo.", "Move the Mech onto the Strategic Point. Control matters only if the network can sustain it: occupying an SP you cannot reinforce turns a temporary advantage into lost ENE and time."]),
    "nexus-lesson-complete":Object.freeze(["Lezione completata. Regola operativa: costruisci dove la rete accorcia i rinforzi e prendi un PS quando il costo previsto per mantenerlo è inferiore al valore che produce.", "Lesson complete. Operating rule: build where the network shortens reinforcement routes, and take an SP when its expected holding cost is lower than the value it produces."])
  }),
  "lesson-3-agathoi":Object.freeze({
    "agathoi-welcome":Object.freeze(["La linea Agathoi non vince inseguendo ogni bersaglio. I Liberti chiamano slancio ciò che spesso lascia scoperto il terreno importante. Qui imparerai a scegliere cosa deve restare in piedi e a far pagare ogni tentativo di sottrarlo.", "The Agathoi line does not win by chasing every target. The Liberti call it momentum when it often leaves important ground exposed. Here you will choose what must stand and make every attempt to take it costly."]),
    "defensive-line-overview":Object.freeze(["L’Oplita di Confine presidia il Punto centrale con 3 HP, 3 DEF e Spine 1 permanenti. Un PS difeso bene non è necessariamente quello con più unità: è quello la cui caduta spezzerebbe davvero la tua posizione.", "The Border Hoplite guards the central Point with 3 HP, 3 DEF, and permanent Thorns 1. A well-defended SP is not necessarily the one with the most units; it is the one whose fall would truly break your position."]),
    "wave-two-resolved":Object.freeze(["Il Legionario ha spezzato l’ultima DEF dell’Oplita, ma Spine e Contrattacco lo hanno abbattuto. Conservare il vantaggio significa arrivare al turno successivo con il PS, gli HP e una risposta ancora disponibili.", "The Legionary broke the Hoplite’s last DEF, but Thorns and Counterattack destroyed it. Preserving advantage means reaching the next turn with the SP, HP, and another response still available."]),
    "choose-fortification":Object.freeze(["La terza ondata mira alla Radura. Bastione Ligneo porta la DEF attuale della Struttura ai suoi HP. Non fortificare tutto: investi dove la perdita aprirebbe il PS o la rete che sostiene il resto della linea.", "The third wave targets the Grove. Wooden Bastion raises the Structure’s current DEF to its HP. Do not fortify everything: invest where a loss would open the SP or the network supporting the rest of the line."]),
    "agathoi-lesson-complete":Object.freeze(["Lezione completata. Non puoi difendere ogni PS con la stessa forza. Scegli quelli che puoi sostenere, proteggi quelli che tengono insieme la posizione e lascia all’avversario il costo di attaccare dove sei pronto.", "Lesson complete. You cannot defend every SP equally. Choose those you can sustain, protect those holding the position together, and make the opponent pay to attack where you are ready."])
  }),
  "lesson-4-liberti":Object.freeze({
    "liberti-welcome":Object.freeze(["Gli Agathoi hanno murato il centro con un Anthropos di Pietra. I Nexus costruiscono gabbie e i Fabeot contratti; nessuno dei due ama quando il fronte cambia direzione. Imparerai a trasformare numero e movimento in un varco, non a battere la testa sul punto più duro.", "The Agathoi walled off the center with a Stone Anthropos. The Nexus build cages and the Fabeot contracts; neither likes it when the front changes direction. Turn numbers and movement into a breach instead of charging the hardest point."]),
    "liberti-formation-overview":Object.freeze(["L’Anthropos possiede 6 HP e 4 DEF. Tre fanterie Liberti lo circondano: Superiorità Numerica aggiunge +1 ATT quando un alleato condivide il bersaglio. La forza Liberti è far arrivare più attacchi sullo stesso nemico prima che possa recuperare.", "The Anthropos has 6 HP and 4 DEF. Three Liberti Infantry surround it: Numerical Superiority adds +1 ATK when an ally shares the target. Liberti strength is landing several attacks on one enemy before it can recover."]),
    "coordinated-pressure-resolved":Object.freeze(["Esca d’Attacco ha attivato le fanterie in sequenza: la prima ha eliminato l’ultima DEF, le successive hanno abbattuto gli HP. Questo è il valore dell’attacco concentrato: una sequenza completa il lavoro invece di lasciare più nemici mezzi danneggiati.", "Attack Lure activated the Infantry in sequence: the first removed the last DEF and the others depleted HP. That is the value of focused attacks: one sequence finishes the job instead of leaving several enemies half damaged."]),
    "capture-center-ps":Object.freeze(["Muovi il Predone sul Punto Strategico. Eliminare il presidio non basta: l’assalto produce vantaggio solo quando rioccupi il Punto e costringi l’altro a reagire alla tua posizione.", "Move the Raider onto the Strategic Point. Removing the guard is not enough: the assault creates advantage only when you reoccupy the Point and force the opponent to react to your position."]),
    "liberti-lesson-complete":Object.freeze(["Lezione completata. Se sei in svantaggio, non inseguire il PS più difeso: colpisci quello sguarnito, costringi il nemico a spostarsi e riapri il fronte. I PS sono leve; usa quella che cede.", "Lesson complete. When behind, do not chase the best-defended SP: strike an exposed one, force the enemy to move, and reopen the front. SPs are levers; use the one that yields."])
  }),
  "lesson-5-fabeot":Object.freeze({
    "fabeot-welcome":Object.freeze(["Il Nexus ha lasciato un Fante Robot isolato. Prevedibile. Gli altri chiamano proprietà ciò che non hanno ancora perso: prima rendi il bersaglio vulnerabile, poi trasferiscine il controllo alla Cittadella.", "The Nexus left a Robot Trooper isolated. Predictable. Others call property what they have not yet lost: first make the target vulnerable, then transfer control to the Citadel."]),
    "fabeot-contract-overview":Object.freeze(["Sentenza Porpora costa 2 ENE. Il Marchio aumenta di 1 i danni offensivi e soddisfa una clausola di acquisizione. Un effetto è interessante solo quando apre il successivo: Marchio, danno e acquisizione valgono più della somma se sono ordinati correttamente.", "Purple Sentence costs 2 ENE. The Mark adds 1 offensive damage and satisfies an acquisition clause. An effect matters only when it opens the next: Mark, damage, and acquisition are worth more than their sum in the correct order."]),
    "fabeot-embargo-resolved":Object.freeze(["Embargo ha bloccato l’unica carta Nexus per un turno. Ogni PS controllato aumenta il numero di carte che puoi bloccare. Il territorio non è sfondo: è capitale convertibile in pressione sulla Mano avversaria.", "Embargo blocked the Nexus’s only card for one turn. Each controlled SP increases how many cards you can block. Territory is not scenery; it is capital converted into pressure on the enemy Hand."]),
    "fabeot-usury-resolved":Object.freeze(["Il Depot Nexus è sceso da 5 a 4 ENE e subirà -1 alle prossime due entrate. Chi attacca senza considerare Depot ENE, ricariche e tattiche disponibili tratta le proprie risorse con la stessa leggerezza degli altri. Noi preferiamo farlo fare all’avversario.", "The Nexus reservoir fell from 5 to 4 ENE and will suffer -1 on its next two income steps. Anyone who attacks without considering ENE, cooldowns, and available tactics treats resources as carelessly as everyone else. We prefer the opponent to do that."]),
    "fabeot-lesson-complete":Object.freeze(["Lezione completata. Il motore della partita ruota sui PS: ENE, Pressione e posizioni di schieramento obbligano tutti a scegliere. Se un PS è troppo protetto, minacciane un altro; quando la difesa si sposta, il valore cambia proprietario.", "Lesson complete. The game engine turns on SPs: ENE, Pressure, and deployment positions force everyone to choose. If one SP is too protected, threaten another; when the defense moves, value changes hands."])
  })
});

const TRANSLATABLE_FIELDS = new Set(["title", "speaker", "text", "label", "wrongActionText"]);
function assign(target, segments, value) {
  let cursor = target;
  segments.forEach((segment, index) => {
    if (index === segments.length - 1) cursor[segment] = value;
    else cursor = cursor[segment] || (cursor[segment] = {});
  });
}

function build(language) {
  const output = { tutorialNarrative:{}, tutorialVoice:{} };
  const missing = [];
  Object.values(context.__tutorialScenarios).forEach(scenario => {
    assign(output.tutorialNarrative, [scenario.id, "title"], language === "it" ? scenario.title : ENGLISH[scenario.title]);
    (scenario.steps || []).forEach(step => {
      const fields = [
        ["message", "speaker", step.message && step.message.speaker],
        ["message", "text", step.message && step.message.text],
        ["spotlight", "label", step.spotlight && step.spotlight.label],
        ["wrongActionText", step.wrongActionText]
      ];
      fields.forEach(parts => {
        const sourceValue = parts.pop();
        if (!sourceValue) return;
        const translated = language === "it" ? sourceValue : ENGLISH[sourceValue];
        if (!translated) missing.push(`${scenario.id}/${step.id}: ${sourceValue}`);
        assign(output.tutorialNarrative, [scenario.id, "steps", step.id, ...parts], translated || sourceValue);
      });
    });
  });
  Object.entries(VOICE).forEach(([scenarioId, steps]) => {
    Object.entries(steps).forEach(([stepId, pair]) => {
      assign(output.tutorialVoice, [scenarioId, stepId, "text"], language === "it" ? pair[0] : pair[1]);
    });
  });
  return { output, missing };
}

const italian = build("it");
const english = build("en");
if (english.missing.length) {
  console.error(`Missing ${english.missing.length} English tutorial translations:`);
  english.missing.forEach(item => console.error(`- ${item}`));
  process.exitCode = 1;
}
fs.writeFileSync(path.join(root, "locales", "content", "tutorial_text.it.json"), `${JSON.stringify(italian.output, null, 2)}\n`);
fs.writeFileSync(path.join(root, "locales", "content", "tutorial_text.en.json"), `${JSON.stringify(english.output, null, 2)}\n`);
if (!english.missing.length) console.log("Tutorial scenario locales generated: PASS");
