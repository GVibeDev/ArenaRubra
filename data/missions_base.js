"use strict";

// F9N4 - Mission Data & Optional Deck Contract.
// Fonte: "NUOVE MISSIONI BASE - (Gioco Starter).docx".
// F9N9 rende giocabili tutte le Missioni: 10 ordinarie e 5 disperate con moltiplicatore x1-x3.

const MISSION_BALANCE_PROFILE = "F9O2e-starter-accessibility-v1";
const MISSION_FFA_PROFILE = "F9Q3d2-ffa-mission-semantics-v1";

const MISSION_DEFINITIONS = Object.freeze([
  {
    id:"NXMSN01", faction:"Nexus", name:"Civiltà Algoritmica", missionClass:"ordinary", cost:0,
    objectives:[
      { id:"o1", metric:"controlled_ps", operator:"gte", value:2, consecutive:1, durationMode:"owner_turns", text:"Controlla almeno 2 PS a un checkpoint di inizio turno personale." },
      { id:"o2", metric:"structures_built_near_objective", operator:"gte", value:3, cumulative:true, objectiveCells:["ps","own_hq","enemy_hq"], text:"Costruisci 3 strutture totali adiacenti o sovrapposte a un PS o QG." },
      { id:"o3", metric:"energy_and_hand", operator:"all", energy:{operator:"gte",value:8}, hand:{operator:"gte",value:6}, text:"Possiedi contemporaneamente almeno 8 ENE e 6 carte in mano." }
    ],
    reward:{ kind:"card_cost_sequence", freeCards:1, discountedCards:2, discount:1, minCost:0, text:"Gioca 1 carta a costo 0, poi gioca 2 carte con costo ridotto di 1 ENE." }
  },
  {
    id:"NXMSN02", faction:"Nexus", name:"Mainframe", missionClass:"ordinary", cost:0,
    objectives:[
      { id:"o1", metric:"controls_central_ps", operator:"eq", value:true, consecutive:1, durationMode:"owner_turns", text:"Controlla il PS centrale a un checkpoint di inizio turno personale." },
      { id:"o2", metric:"tagged_effects_used", tag:"ps_related", operator:"gte", value:3, cumulative:true, text:"Usa 3 effetti di tattiche o abilità con tag PS." },
      { id:"o3", metric:"pivot_in_play", operator:"eq", value:true, text:"Mantieni una tua unità Pivot in gioco." }
    ],
    reward:{ kind:"gain_energy_per_controlled_ps", value:2, text:"Guadagna immediatamente 2 ENE per ogni PS che controlli." }
  },
  {
    id:"NXMSND01", faction:"Nexus", name:"Punto di Ripristino", missionClass:"desperate", cost:0,
    conditions:[
      { id:"c1", metric:"enemy_controls_central_ps", enemyScope:"any_active", operator:"eq", value:true, consecutive:5, durationMode:"rounds", text:"Almeno un avversario attivo controlla il PS centrale per 5 round consecutivi." },
      { id:"c2", metric:"enemy_pressure", enemyScope:"max_active", operator:"gte", value:3, text:"Almeno un avversario attivo ha 3 o più Pressione." },
      { id:"c3", metric:"enemy_pivot_and_commander_in_play", enemyScope:"same_active_enemy", operator:"all", pivot:true, commander:true, text:"Uno stesso avversario attivo mantiene contemporaneamente Pivot e Comandante in gioco." }
    ],
    reward:{ kind:"energy_and_draw_per_condition", energyPerCondition:3, drawPerCondition:1, multiplierMax:3, text:"Per ogni condizione rispettata: guadagna 3 ENE e pesca 1 carta (massimo ×3)." }
  },
  {
    id:"EXMSN01", faction:"Exordium", name:"Triumphale Iter", missionClass:"ordinary", cost:0,
    objectives:[
      { id:"o1", metric:"vehicles_in_play", operator:"gte", value:4, text:"Mantieni almeno 4 veicoli in gioco." },
      { id:"o2", metric:"enemy_units_destroyed", operator:"gte", value:3, cumulative:true, text:"Distruggi 3 unità nemiche." },
      { id:"o3", metric:"pivot_in_play", operator:"eq", value:true, text:"Mantieni una tua unità Pivot in gioco." }
    ],
    reward:{ kind:"draw_with_discount", draw:3, discount:1, minCost:0, text:"Pesca 3 carte; quelle carte costano 1 ENE in meno." }
  },
  {
    id:"EXMSN02", faction:"Exordium", name:"Ordo Legio", missionClass:"ordinary", cost:0,
    objectives:[
      { id:"o1", metric:"infantry_vehicle_ratio", operator:"eq", infantryShare:0.5, consecutive:2, durationMode:"owner_turns", requireNonZero:true, text:"Mantieni un rapporto esatto 50/50 tra fanterie e veicoli per 2 turni personali consecutivi." },
      { id:"o2", metric:"enemy_structures_destroyed", operator:"gte", value:2, cumulative:true, text:"Distruggi 2 strutture nemiche." },
      { id:"o3", metric:"enemy_units_destroyed_in_owner_turn", operator:"gte", value:2, text:"Distruggi almeno 2 unità nemiche nello stesso turno personale." }
    ],
    reward:{ kind:"draw_with_discount", draw:3, discount:1, minCost:0, text:"Pesca 3 carte; quelle carte costano 1 ENE in meno." }
  },
  {
    id:"EXMSND01", faction:"Exordium", name:"Ultimo Assalto", missionClass:"desperate", cost:0,
    conditions:[
      { id:"c1", metric:"own_heavy_vehicles_destroyed_by_enemy", enemyScope:"aggregate_all", operator:"gte", value:2, cumulative:true, text:"Gli avversari hanno distrutto complessivamente 2 tuoi veicoli pesanti." },
      { id:"c2", metric:"enemy_controlled_ps", enemyScope:"same_enemy_turns", operator:"gte", value:2, consecutive:3, durationMode:"enemy_turns", text:"Uno stesso avversario controlla almeno 2 PS per 3 suoi turni personali consecutivi." },
      { id:"c3", metric:"own_commander_destroyed", enemyScope:"any_enemy_event", operator:"eq", value:true, text:"Un avversario ha distrutto il tuo Comandante." }
    ],
    reward:{ kind:"distinct_units_per_condition", multiplierMax:3, distinctTargets:true, vehicleEffect:"ignore_defense_next_attack", infantryEffect:"double_action_current_round", durationMode:"current_round", text:"Per ogni condizione: 1 veicolo distinto ignora la DEF nel prossimo attacco e 1 fanteria distinta può agire due volte nel round corrente." }
  },
  {
    id:"LBMSN01", faction:"Liberti", name:"Arena Selvaggia", missionClass:"ordinary", cost:0,
    objectives:[
      { id:"o1", metric:"units_deployed", operator:"gte", value:7, cumulative:true, text:"Metti in gioco 7 unità nel corso del ciclo Missione." },
      { id:"o2", metric:"numerical_superiority_unique_targets", operator:"gte", value:3, cumulative:true, distinctTargets:true, text:"Attiva Superiorità Numerica su 3 nemici distinti." },
      { id:"o3", metric:"ordinary_cards_in_hand", operator:"eq", value:0, text:"Rimani senza carte ordinarie in mano." }
    ],
    reward:{ kind:"draw_cards", draw:5, text:"Pesca 5 carte." }
  },
  {
    id:"LBMSN02", faction:"Liberti", name:"Sangue e Sabbia", missionClass:"ordinary", cost:0,
    objectives:[
      { id:"o1", metric:"bleed_damage_dealt", operator:"gte", value:10, cumulative:true, text:"Infliggi 10 danni totali da Sanguinamento." },
      { id:"o2", metric:"units_deployed_by_tactics", operator:"gte", value:2, cumulative:true, text:"Metti in gioco almeno 2 unità tramite tattiche." },
      { id:"o3", metric:"unit_distance_from_enemy_hq", enemyScope:"any_active", operator:"lte", value:6, text:"Porta una tua unità entro R6 da almeno un QG avversario attivo." }
    ],
    reward:{ kind:"gain_energy", value:5, text:"Guadagna immediatamente 5 ENE." }
  },
  {
    id:"LBMSND01", faction:"Liberti", name:"Ultima Possibilità", missionClass:"desperate", cost:0,
    conditions:[
      { id:"c1", metric:"own_units_destroyed_by_enemy", enemyScope:"aggregate_all", operator:"gte", value:8, cumulative:true, text:"Gli avversari hanno distrutto complessivamente 8 tue unità." },
      { id:"c2", metric:"enemy_has_more_units", enemyScope:"same_enemy_turns", operator:"eq", value:true, consecutive:3, durationMode:"enemy_turns", text:"Uno stesso avversario ha più unità di te per 3 suoi turni personali consecutivi." },
      { id:"c3", metric:"own_commander_or_pivot_destroyed", enemyScope:"any_enemy_event", operator:"any", commander:true, pivot:true, text:"Un avversario ha distrutto il tuo Comandante o una tua Pivot." }
    ],
    reward:{ kind:"repeat_attacks_current_round", attacksPerCondition:1, multiplierMax:3, durationMode:"current_round", text:"Nel round corrente puoi ripetere 1 attacco per ogni condizione rispettata (massimo 3)." }
  },
  {
    id:"AGMSN01", faction:"Agathoi", name:"Tafos Lithos", missionClass:"ordinary", cost:0,
    objectives:[
      { id:"o1", metric:"units_deployed_min_cost", operator:"gte", value:2, minCost:3, cumulative:true, text:"Metti in gioco almeno 2 unità dal costo di 3 o più ENE." },
      { id:"o2", metric:"tagged_effects_used", tag:"defensive_ability", operator:"gte", value:3, cumulative:true, allowedTags:["def_buff","untargetable"], text:"Usa 3 abilità difensive: buff DEF o non bersagliabilità." },
      { id:"o3", metric:"deck_cards_remaining", operator:"lte", value:15, text:"Porta il deck a 15 carte o meno." }
    ],
    reward:{ kind:"draw_cards", draw:5, text:"Pesca 5 carte." }
  },
  {
    id:"AGMSN02", faction:"Agathoi", name:"Erkos", missionClass:"ordinary", cost:0,
    objectives:[
      { id:"o1", metric:"adjacent_structure_cluster", operator:"gte", value:3, text:"Costruisci un gruppo con almeno 3 strutture alleate collegate per adiacenza." },
      { id:"o2", metric:"thorns_damage_dealt", operator:"gte", value:6, cumulative:true, text:"Infliggi 6 danni totali con Spine." },
      { id:"o3", metric:"round_and_energy", operator:"all", round:{operator:"gte",value:12}, energy:{operator:"gte",value:12}, text:"Dal round 12 in poi, possiedi almeno 12 ENE." }
    ],
    reward:{ kind:"gain_energy", value:10, text:"Guadagna immediatamente 10 ENE." }
  },
  {
    id:"AGMSND01", faction:"Agathoi", name:"Primo Verae", missionClass:"desperate", cost:0,
    conditions:[
      { id:"c1", metric:"own_structures_destroyed_by_enemy", enemyScope:"aggregate_all", operator:"gte", value:2, cumulative:true, text:"Gli avversari hanno distrutto complessivamente 2 tue strutture." },
      { id:"c2", metric:"enemy_controls_central_ps", enemyScope:"same_enemy_turns", operator:"eq", value:true, consecutive:5, durationMode:"enemy_turns", text:"Uno stesso avversario controlla il PS centrale per 5 suoi turni personali consecutivi." },
      { id:"c3", metric:"own_commander_or_pivot_destroyed", enemyScope:"any_enemy_event", operator:"any", commander:true, pivot:true, text:"Un avversario ha distrutto il tuo Comandante o una tua Pivot." }
    ],
    reward:{ kind:"phase_shield_per_condition", statusKind:"untargetable", unitsPerCondition:1, multiplierMax:3, distinctTargets:true, durationMode:"current_round", text:"Per ogni condizione, 1 unità distinta ottiene Scudo Fasico e non è bersagliabile nel round corrente." }
  },
  {
    id:"FBMSN01", faction:"Fabeot", name:"Ex Lucis Tenebrae", missionClass:"ordinary", cost:0,
    objectives:[
      { id:"o1", metric:"vehicles_in_play_near_ps", operator:"gte", value:2, range:3, text:"Mantieni 2 tuoi veicoli entro R3 da almeno un PS." },
      { id:"o2", metric:"marks_applied", operator:"gte", value:3, cumulative:true, text:"Applica un Marchio 3 volte." },
      { id:"o3", metric:"controls_central_ps", operator:"eq", value:true, consecutive:2, durationMode:"owner_turns", text:"Controlla il PS centrale per 2 turni personali consecutivi." }
    ],
    reward:{ kind:"enemy_loses_energy_fraction", targetScope:"chosen_active_enemy", numerator:1, denominator:2, rounding:"floor", text:"Scegli un avversario attivo: perde metà del proprio deposito ENE, arrotondata per difetto." }
  },
  {
    id:"FBMSN02", faction:"Fabeot", name:"Cospirazione", missionClass:"ordinary", cost:0,
    objectives:[
      { id:"o1", metric:"energy_gained_from_doctrine", doctrine:"fabeot", operator:"gte", value:3, cumulative:true, text:"Guadagna 3 ENE tramite la dottrina Fabeot." },
      { id:"o2", metric:"enemy_faction_units_controlled", operator:"gte", value:2, cumulative:true, text:"Metti sotto il tuo controllo 2 unità appartenenti a una qualsiasi fazione avversaria." },
      { id:"o3", metric:"enemy_energy_manipulations", operator:"gte", value:5, cumulative:true, text:"Manipola il deposito ENE di uno o più avversari 5 volte complessive." }
    ],
    reward:{ kind:"enemy_discards_hand_fraction", targetScope:"chosen_active_enemy", numerator:1, denominator:2, rounding:"floor", excludesProtectedCards:true, chooser:"enemy", text:"Scegli un avversario attivo: quel giocatore sceglie e scarta metà delle proprie carte ordinarie in mano, arrotondata per difetto." }
  },
  {
    id:"FBMSND01", faction:"Fabeot", name:"Anatema", missionClass:"desperate", cost:0,
    conditions:[
      { id:"c1", metric:"enemy_energy_greater_than_owner", enemyScope:"same_enemy_turns", operator:"eq", value:true, consecutive:3, durationMode:"enemy_turns", text:"Uno stesso avversario possiede più ENE di te per 3 suoi turni personali consecutivi." },
      { id:"c2", metric:"own_units_destroyed_by_enemy", enemyScope:"aggregate_all", operator:"gte", value:6, cumulative:true, text:"Gli avversari hanno distrutto complessivamente 6 tue unità." },
      { id:"c3", metric:"enemy_pressure", enemyScope:"max_active", operator:"gte", value:3, text:"Almeno un avversario attivo ha 3 o più Pressione." }
    ],
    reward:{ kind:"stun_enemy_per_condition", targetScope:"all_active_enemy_units", statusKind:"inhibit_action", turns:1, durationMode:"enemy_turns", unitsPerCondition:1, multiplierMax:3, distinctTargets:true, text:"Per ogni condizione, scegli 1 unità distinta appartenente a qualsiasi avversario attivo: è stordita per 1 turno del suo proprietario." }
  }
]);

function missionObjectivesFor(definition) {
  return definition && definition.missionClass === "desperate" ? (definition.conditions || []) : (definition.objectives || []);
}

function missionCardRulesText(definition) {
  const prefix = definition.missionClass === "desperate" ? "Condizioni" : "Obiettivi";
  const items = missionObjectivesFor(definition).map((item, index) => `${index + 1}) ${item.text}`).join(" ");
  return `${prefix}: ${items} Ricompensa: ${definition.reward.text}`;
}
