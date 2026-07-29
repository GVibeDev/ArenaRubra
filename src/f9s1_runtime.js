"use strict";

// Arena Rubra – F9S1a
// Runtime mirato per le nuove unità e tattiche di fazione.
// I deck ufficiali restano invariati e saranno aggiornati in una milestone successiva.

function f9s1aCoordTarget(coord, label="cella") {
  const cell = typeof getCellAt === "function" ? getCellAt(coord) : null;
  return {
    uid:`F9S1A:CELL:${coordKey(coord)}`,
    pos:[...coord], coord:[...coord], cell,
    type:"Cella", side:null, alive:true, isCellTarget:true,
    name:`${label} [${coord.join(",")}]`
  };
}

function f9s1aCellExists(coord) {
  return Boolean(Array.isArray(coord) && (typeof getCellAt !== "function" || getCellAt(coord)));
}

function f9s1aAbilityCellGroupTargets(unit, ab) {
  if (!unit || !ab || !Array.isArray(unit.pos)) return [];
  const range = Number.isFinite(ab.range) ? ab.range : 0;
  const selected = Array.isArray(pendingAbilityCoords) ? pendingAbilityCoords : [];
  let coords = (state.cells || []).map(cell => cell.coord).filter(coord => f9s1aCellExists(coord) && hexDistance(unit.pos, coord) <= range);
  if (selected.length) {
    const center = selected[0];
    coords = coords.filter(coord => areAdjacent(center, coord));
    coords = coords.filter(coord => !selected.some(picked => sameCoord(picked, coord)));
  }
  return coords.map(coord => f9s1aCoordTarget(coord, selected.length ? "cella collegata" : "cella bersaglio"));
}

function f9s1aCompleteAbilityCoords(user, target, ab) {
  const required = Math.max(1, Number(ab.selectionCount) || 1);
  const supplied = target && Array.isArray(target.selectedCoords) ? target.selectedCoords : [];
  const first = supplied.length ? supplied[0] : (target && (target.coord || target.pos));
  if (!Array.isArray(first) || hexDistance(user.pos, first) > (ab.range || 0) || !f9s1aCellExists(first)) return [];
  const suppliedRest = supplied.slice(1).filter(Boolean).map(c => [...c]);
  if (suppliedRest.some(coord => !f9s1aCellExists(coord) || hexDistance(user.pos, coord) > (ab.range || 0) || !areAdjacent(first, coord))) return [];
  const coords = [[...first], ...suppliedRest];
  if (new Set(coords.map(coordKey)).size !== coords.length || coords.length > required) return [];
  const candidates = neighbors(first)
    .filter(c => f9s1aCellExists(c) && hexDistance(user.pos, c) <= (ab.range || 0))
    .filter(c => !coords.some(x => sameCoord(x,c)))
    .map(c => {
      const occupant = getUnitAt(c);
      let score = 0;
      if (occupant) score += occupant.side === user.side ? -4 : 6;
      if (occupant && occupant.type === "Comandante") score += occupant.side === user.side ? -2 : 2;
      return { coord:c, score };
    })
    .sort((a,b) => b.score-a.score || coordKey(a.coord).localeCompare(coordKey(b.coord)));
  for (const candidate of candidates) {
    if (coords.length >= required) break;
    coords.push([...candidate.coord]);
  }
  return coords.length === required ? coords : [];
}

function f9s1aDamageUnitsOnCells(user, coords, damage, source, options={}) {
  const seen = new Set();
  const targets = [];
  for (const coord of coords || []) {
    const unit = getUnitAt(coord);
    if (!unit || !unit.alive || unit.type === "QG" || seen.has(unit.uid)) continue;
    seen.add(unit.uid);
    targets.push(unit);
  }
  for (const target of targets) {
    applyDamage(target, damage, source, { amplifiable:true, attacker:user, ability:true, aoe:true, ...options });
  }
  log(`${source}: ${coords.length} celle risolte, ${targets.length} unità colpite.`);
  return targets;
}

function f9s1aRepairHpDef(user, target, ab) {
  if (!target || target.side !== user.side || target.uid === user.uid) return false;
  const hpBefore = target.currentHp;
  const defBefore = target.currentDef;
  target.currentHp = Math.min(target.maxHp, target.currentHp + (ab.value || 1));
  target.currentDef = Math.min(target.maxDef, target.currentDef + (ab.value || 1));
  log(`${target.name} recupera ${target.currentHp-hpBefore} HP e ${target.currentDef-defBefore} DEF da ${ab.name}.`);
  return true;
}

function f9s1aHealUnit(user, target, ab, infantryOnly=false) {
  if (!target || target.side !== user.side || (ab.excludeSelf && target.uid === user.uid)) return false;
  if (infantryOnly && target.type !== "Fanteria") return false;
  const before = target.currentHp;
  target.currentHp = Math.min(target.maxHp, target.currentHp + (ab.value || 1));
  log(`${target.name} recupera ${target.currentHp-before} HP da ${ab.name}.`);
  return true;
}

function f9s1aDestroyUnit(target, source, sourceSide, attacker=null) {
  if (!target || !target.alive) return false;
  applyDamage(target, Math.max(1, target.currentHp || 1), source, { directHp:true, ability:true, attacker, sourceSide });
  return !target.alive;
}

function f9s1aAssassinate(user, target, ab) {
  const validType = target && (target.type === "Fanteria" || target.type === "Veicolo");
  const unique = target && (target.type === "Comandante" || target.role === "commander" || target.weight === "Pivot" || target.deckRole === "pivot");
  if (!target || target.side === user.side || !validType || unique || (target.currentDef || 0) > 2) {
    log(`${ab.name} fallisce: bersaglio non valido.`);
    return false;
  }
  f9s1aDestroyUnit(target, ab.name, user.side, user);
  if (user.alive) f9s1aDestroyUnit(user, `${ab.name} · sacrificio`, user.side, user);
  return true;
}

function f9s1aSetDoubleMove(user, ab) {
  if (!user || user.movedThisTurn) return false;
  user.c2c5bDoubleMove = true;
  user.f9s1aKeepActionAfterAbility = true;
  log(`${user.name} attiva ${ab.name}: MOV raddoppiato per il prossimo movimento di questo turno.`);
  return true;
}

function f9s1aSetIgnoreDefense(user, ab) {
  applyStatus(user, { kind:"next_attack_ignore_defense", turns:1, source:ab.name, owner:user.side });
  user.f9s1aKeepActionAfterAbility = true;
  log(`${user.name} prepara ${ab.name}: il prossimo attacco base ignora la DEF.`);
  return true;
}

function f9s1aAbilityHandler(kind, user, target, ab) {
  if (kind === "f9s1DoubleMove") return f9s1aSetDoubleMove(user, ab);
  if (kind === "f9s1RepairHpDef") return f9s1aRepairHpDef(user, target, ab);
  if (kind === "f9s1HealInfantry") return f9s1aHealUnit(user, target, ab, true);
  if (kind === "f9s1Heal") return f9s1aHealUnit(user, target, ab, false);
  if (kind === "f9s1Assassinate") return f9s1aAssassinate(user, target, ab);
  if (kind === "f9s1NextAttackIgnoreDefense") return f9s1aSetIgnoreDefense(user, ab);
  if (kind === "f9s1CellBarrage" || kind === "f9s1CellMortar") {
    const coords = f9s1aCompleteAbilityCoords(user, target, ab);
    if (coords.length !== (ab.selectionCount || 1)) {
      log(`${ab.name} fallisce: non è disponibile un gruppo di celle valido.`);
      return false;
    }
    return f9s1aDamageUnitsOnCells(user, coords, ab.value || 1, ab.name);
  }
  return false;
}

function f9s1aRuleAllowsBlueprint(rule, bp) {
  if (!rule || !bp || bp.type === "Struttura" || bp.type === "Comandante") return false;
  if (rule.excludePivot && bp.weight === "Pivot") return false;
  if (Array.isArray(rule.unitTypes) && rule.unitTypes.length && !rule.unitTypes.includes(bp.type)) return false;
  if (Array.isArray(rule.weightClasses) && rule.weightClasses.length && !rule.weightClasses.includes(bp.weight)) return false;
  return true;
}

function f9s1aDeploymentRuleUsed(structure) {
  return Boolean(structure && structure.f9s1aDeploymentUsedRound === state.turn);
}

function f9s1aDeploymentRuleStructures(player, bp, coord=null) {
  return combatUnits(player)
    .filter(s => s && s.type === "Struttura" && s.deploymentRule && !f9s1aDeploymentRuleUsed(s))
    .filter(s => f9s1aRuleAllowsBlueprint(s.deploymentRule, bp))
    .filter(s => !coord || (Array.isArray(s.pos) && hexDistance(s.pos, coord) > 0 && hexDistance(s.pos, coord) <= (s.deploymentRule.range || 1)))
    .sort((a,b) => ((a.deploymentRule.discount || 0) - (b.deploymentRule.discount || 0)) || String(a.uid).localeCompare(String(b.uid)));
}

function f9s1aOrdinarySpawnCovers(player, coord) {
  const hq = getHq(player);
  if (hq && (sameCoord(hq.pos,coord) || areAdjacent(hq.pos,coord))) return true;
  return combatUnits(player).some(s => s.type === "Struttura" && !s.deploymentRule && areAdjacent(s.pos,coord));
}

function f9s1aDeploymentSourceFor(player, bp, coord) {
  const candidates = f9s1aDeploymentRuleStructures(player,bp,coord);
  const discounted = candidates.find(s => (s.deploymentRule.discount || 0) < 0);
  if (discounted) return discounted;
  if (f9s1aOrdinarySpawnCovers(player,coord)) return null;
  return candidates[0] || null;
}

function f9s1aDeploymentCostModifier(player, bp, coord=null) {
  const candidates = f9s1aDeploymentRuleStructures(player,bp,coord).filter(s => (s.deploymentRule.discount || 0) < 0);
  if (!candidates.length) return { value:0, minCost:0, source:null };
  const structure = candidates[0];
  return { value:structure.deploymentRule.discount || 0, minCost:structure.deploymentRule.minCost || 1, source:structure };
}

function f9s1aConsumeDeploymentSource(player, bp, coord) {
  const source = f9s1aDeploymentSourceFor(player,bp,coord);
  if (!source) return null;
  source.f9s1aDeploymentUsedRound = state.turn;
  const rule = source.deploymentRule || {};
  log(`${rule.label || source.name}: sbarco di ${bp.name} consumato per questo turno tramite ${source.name}.`);
  return source;
}

function f9s1aTacticIds() {
  const config = typeof CARD_CATALOG_CONFIG !== "undefined" ? CARD_CATALOG_CONFIG : {};
  return new Set(config.playableTacticIdsF9S1a || []);
}
function f9s1aTacticKinds() {
  const config = typeof CARD_CATALOG_CONFIG !== "undefined" ? CARD_CATALOG_CONFIG : {};
  return new Set(config.playableTacticEffectKindsF9S1a || []);
}
function f9s1aIsTactic(card) {
  const c = typeof normalizeHandTacticCard === "function" ? normalizeHandTacticCard(card) : card;
  return Boolean(c && f9s1aTacticIds().has(c.tacticId || c.sourceId) && f9s1aTacticKinds().has(c.effectKind));
}

function f9s1aTacticTargetUnitFilter(player, card, target) {
  const c = normalizeHandTacticCard(card);
  if (!c || !target || target.type === "QG") return false;
  const allied = target.side === player;
  if (c.effectKind === "f9s1_repair_choice") return allied && target.faction === "Nexus" && (target.currentHp < target.maxHp || target.currentDef < target.maxDef);
  if (c.effectKind === "f9s1_permanent_vision_att") return allied && target.faction === "Exordium" && ["Fanteria","Veicolo"].includes(target.type) && !target.f9s1aImperialPointer;
  if (c.effectKind === "f9s1_heal_vehicle") return allied && target.faction === "Exordium" && target.type === "Veicolo" && target.currentHp < target.maxHp;
  if (c.effectKind === "f9s1_green_fury") return allied && target.faction === "Agathoi" && ["Fanteria","Veicolo"].includes(target.type) && !target.f9s1aGreenFury;
  if (c.effectKind === "f9s1_permanent_vision_def") return allied && target.faction === "Agathoi" && target.type === "Fanteria" && !target.f9s1aAgathoiWatch;
  if (c.effectKind === "f9s1_damage_unit" || c.effectKind === "f9s1_double_hit") return !allied;
  return true;
}

function f9s1aMineCellValid(coord) {
  if (!f9s1aCellExists(coord) || !isCellEnterable(coord) || getUnitAt(coord)) return false;
  if ((state.mines || []).some(m => sameCoord(m.coord,coord))) return false;
  if ((state.cellEffects || []).some(effect => effect && Array.isArray(effect.coord) && sameCoord(effect.coord,coord))) return false;
  const terrain = typeof getMapTerrainAt === "function" ? getMapTerrainAt(coord) : null;
  return !terrain || !terrain.blocksDeployment;
}

function f9s1aGuardianBlueprint() {
  return BLUEPRINTS.find(bp => bp && bp.id === "AG1B01") || null;
}

function f9s1aGuardianCapacity(player) {
  const bp = f9s1aGuardianBlueprint();
  if (!bp) return 0;
  if (typeof c2c5cAvailableCapacity === "function") return c2c5cAvailableCapacity(player,bp);
  return purchaseLimitReached(player,bp) ? 0 : 2;
}

function f9s1aTacticCellTargets(player, card) {
  const c = normalizeHandTacticCard(card);
  if (!c || !f9s1aIsTactic(c)) return null;
  const selected = Array.isArray(pendingTacticCoords) ? pendingTacticCoords : [];
  if (c.effectKind === "f9s1_place_two_mines") {
    let coords = (state.cells || []).map(cell=>cell.coord).filter(f9s1aMineCellValid).filter(coord => handTacticSourceCells(player,c).some(source => hexDistance(source,coord) <= c.range));
    if (selected.length) coords = coords.filter(coord => areAdjacent(selected[0],coord) && !selected.some(x=>sameCoord(x,coord)));
    else coords = coords.filter(coord => neighbors(coord).some(other => f9s1aMineCellValid(other) && handTacticSourceCells(player,c).some(source => hexDistance(source,other) <= c.range)));
    return coords.map(coord=>f9s1aCoordTarget(coord,"cella mina"));
  }
  if (c.effectKind === "f9s1_spawn_two_guardians") {
    const bp=f9s1aGuardianBlueprint();
    if (!bp || f9s1aGuardianCapacity(player) < 2) return [];
    let coords=spawnCellsFor(player,bp);
    if (selected.length) coords=coords.filter(coord=>areAdjacent(selected[0],coord)&&!selected.some(x=>sameCoord(x,coord)));
    else coords=coords.filter(coord=>spawnCellsFor(player,bp).some(other=>areAdjacent(coord,other)));
    return coords.map(coord=>f9s1aCoordTarget(coord,"sbarco Custode"));
  }
  return null;
}

function f9s1aChooseRepairMode(player,target) {
  const hpMissing=Math.max(0,target.maxHp-target.currentHp);
  const defMissing=Math.max(0,target.maxDef-target.currentDef);
  if (hpMissing<=0) return "def";
  if (defMissing<=0) return "hp";
  if (state && state.modes && state.modes[player] === "human" && typeof confirm === "function") {
    return confirm("Kit di Riparazione: OK = recupera 2 HP · Annulla = recupera 2 DEF") ? "hp" : "def";
  }
  return hpMissing >= defMissing ? "hp" : "def";
}

function f9s1aAddVisionTag(target) {
  target.tags = Array.isArray(target.tags) ? target.tags : [];
  if (!target.tags.includes("vision")) target.tags.push("vision");
  target.visionRange = Math.max(2, Number(target.visionRange) || 0);
}

function f9s1aResolveTactic(player, card, target) {
  const c=normalizeHandTacticCard(card);
  if (!c || !f9s1aIsTactic(c)) return null;
  const result={damage:0,extra:""};
  if (c.effectKind === "f9s1_repair_choice") {
    const mode=f9s1aChooseRepairMode(player,target);
    if (mode === "hp") { const before=target.currentHp; target.currentHp=Math.min(target.maxHp,target.currentHp+2); result.extra=`+${target.currentHp-before} HP`; }
    else { const before=target.currentDef; target.currentDef=Math.min(target.maxDef,target.currentDef+2); result.extra=`+${target.currentDef-before} DEF`; }
    log(`${c.name}: ${target.name} ${result.extra}.`); return result;
  }
  if (c.effectKind === "f9s1_reveal_stealth_area") {
    const center=target.pos; let revealed=0;
    const enemies=typeof enemyCombatUnits === "function" ? enemyCombatUnits(player) : combatUnits(null).filter(u=>u.side!==player);
    for (const unit of enemies) {
      if (!unit.pos || hexDistance(center,unit.pos)>2) continue;
      const before=(unit.statuses||[]).length;
      unit.statuses=(unit.statuses||[]).filter(st=>st.kind!=="stealth");
      if (unit.statuses.length<before) { revealed+=1; log(`${unit.name} perde Furtivo per ${c.name}.`); }
    }
    result.extra=`${revealed} unità rivelate`; return result;
  }
  if (c.effectKind === "f9s1_permanent_vision_att") {
    target.baseAtt=(target.baseAtt||0)+1; target.currentAtt=(target.currentAtt||0)+1; target.att=(target.att||0)+1;
    target.f9s1aImperialPointer=true; f9s1aAddVisionTag(target); result.extra="Visione R2 e +1 ATT permanente"; log(`${c.name}: ${target.name} ottiene ${result.extra}.`); return result;
  }
  if (c.effectKind === "f9s1_heal_vehicle") {
    const before=target.currentHp; target.currentHp=Math.min(target.maxHp,target.currentHp+3); result.extra=`+${target.currentHp-before} HP`; log(`${c.name}: ${target.name} recupera ${target.currentHp-before} HP.`); return result;
  }
  if (c.effectKind === "f9s1_green_fury") {
    target.f9s1aGreenFury={ round:state.turn, originalAtt:target.currentAtt, originalDef:target.currentDef, swappedAtt:target.currentDef, swappedDef:target.currentAtt };
    const att=target.currentAtt; target.currentAtt=target.currentDef; target.currentDef=att; result.extra="ATT e DEF scambiati fino a fine round"; log(`${c.name}: ${target.name} scambia ATT e DEF fino a fine round.`); return result;
  }
  if (c.effectKind === "f9s1_damage_unit") {
    const amount=Number(c.damageValue)||2; applyDamage(target,amount,c.name,{tactic:true,sourceCardUid:c.cardUid}); result.damage=amount; return result;
  }
  if (c.effectKind === "f9s1_place_two_mines") {
    const coords=target && Array.isArray(target.selectedCoords) ? target.selectedCoords : [];
    if (coords.length!==2 || !areAdjacent(coords[0],coords[1]) || !coords.every(f9s1aMineCellValid)) { log(`${c.name} fallisce: coppia di celle non valida.`); return result; }
    state.mines=state.mines||[];
    coords.forEach((coord,index)=>state.mines.push({owner:player,coord:[...coord],name:`${c.name} ${index+1}`,infantryDamage:1,vehicleDamage:1,f9s1a:true}));
    result.extra="2 mine piazzate"; log(`${c.name}: mine piazzate in [${coords[0].join(",")}] e [${coords[1].join(",")}].`); return result;
  }
  if (c.effectKind === "f9s1_spawn_two_guardians") {
    const coords=target && Array.isArray(target.selectedCoords) ? target.selectedCoords : [];
    const bp=f9s1aGuardianBlueprint();
    if (!bp || coords.length!==2 || !areAdjacent(coords[0],coords[1]) || f9s1aGuardianCapacity(player)<2) { log(`${c.name} fallisce: sbarco doppio non valido.`); return result; }
    let spawned=0;
    for (const coord of coords) if (typeof c2c5cSpawnUnitFromTactic === "function" && c2c5cSpawnUnitFromTactic(player,bp,coord,c.name,{ready:false})) spawned+=1;
    result.extra=`${spawned} Custodi schierati`; return result;
  }
  if (c.effectKind === "f9s1_permanent_vision_def") {
    target.def=(target.def||0)+1; target.maxDef=(target.maxDef||0)+1; target.currentDef=(target.currentDef||0)+1; target.f9s1aAgathoiWatch=true; f9s1aAddVisionTag(target);
    result.extra="Visione R2 e +1 DEF permanente"; log(`${c.name}: ${target.name} ottiene ${result.extra}.`); return result;
  }
  if (c.effectKind === "f9s1_double_hit") {
    const hit=Math.max(1,Number(c.hitDamage)||1); const count=Math.max(1,Number(c.hitCount)||2); let resolved=0;
    for (let i=0;i<count && target.alive;i+=1) { applyDamage(target,hit,c.name,{tactic:true,sourceCardUid:c.cardUid,hitIndex:i+1}); resolved+=1; }
    result.damage=hit; result.extra=`${resolved} colpi separati da ${hit}`; return result;
  }
  return result;
}

function f9s1aRestoreGreenFury(round) {
  if (!state || !Array.isArray(state.units)) return;
  for (const unit of state.units) {
    const effect=unit && unit.f9s1aGreenFury;
    if (!effect || effect.round!==round) continue;
    const attDelta=(unit.currentAtt||0)-effect.swappedAtt;
    const defDelta=(unit.currentDef||0)-effect.swappedDef;
    unit.currentAtt=Math.max(0,effect.originalAtt+attDelta);
    unit.currentDef=Math.max(0,Math.min(unit.maxDef,effect.originalDef+defDelta));
    delete unit.f9s1aGreenFury;
    log(`Furia Verde termina su ${unit.name}: ATT ${unit.currentAtt}, DEF ${unit.currentDef}.`);
  }
}
