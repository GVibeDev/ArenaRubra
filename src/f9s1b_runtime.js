"use strict";

// Arena Rubra – F9S1b
// Runtime delle Pivot alternative e dei pool completi da 40 carte.

const F9S1B_HEX_DIRECTIONS = Object.freeze([
  [1,-1,0],[1,0,-1],[0,1,-1],[-1,1,0],[-1,0,1],[0,-1,1]
]);

function f9s1bAddCoord(a,b) { return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]; }
function f9s1bSubCoord(a,b) { return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }
function f9s1bNegCoord(a) { return [-a[0],-a[1],-a[2]]; }

function f9s1bLineTriplet(user, center, orientation, ab) {
  if (!user || !Array.isArray(user.pos) || !Array.isArray(center) || !Array.isArray(orientation)) return [];
  const dir=f9s1bSubCoord(orientation,center);
  if (!F9S1B_HEX_DIRECTIONS.some(d=>sameCoord(d,dir))) return [];
  const opposite=f9s1bAddCoord(center,f9s1bNegCoord(dir));
  const coords=[center,orientation,opposite].map(c=>[...c]);
  const range=Number.isFinite(ab && ab.range)?ab.range:0;
  if (new Set(coords.map(coordKey)).size!==3) return [];
  if (coords.some(c=>sameCoord(c,user.pos))) return [];
  if (!coords.every(c=>f9s1aCellExists(c)&&hexDistance(user.pos,c)<=range)) return [];
  return coords;
}

function f9s1bValidLineOptions(user, center, ab) {
  if (!user || !Array.isArray(center) || !f9s1aCellExists(center) || hexDistance(user.pos,center)>(ab.range||0)) return [];
  return F9S1B_HEX_DIRECTIONS.map(dir=>f9s1bAddCoord(center,dir))
    .map(orientation=>({orientation,coords:f9s1bLineTriplet(user,center,orientation,ab)}))
    .filter(x=>x.coords.length===3);
}

function f9s1bLineScore(user, coords) {
  let score=0;
  for (const coord of coords||[]) {
    const unit=getUnitAt(coord);
    if (!unit || !unit.alive || unit.type==="QG") continue;
    score += unit.side===user.side ? -(5+(unit.cost||0)) : (7+(unit.cost||0));
  }
  return score;
}

function f9s1bAbilityLineTargets(unit, ab) {
  if (!unit || !ab || !Array.isArray(unit.pos)) return [];
  const selected=Array.isArray(pendingAbilityCoords)?pendingAbilityCoords:[];
  if (!selected.length) {
    return (state.cells||[]).map(c=>c.coord)
      .filter(center=>f9s1bValidLineOptions(unit,center,ab).length>0)
      .map(center=>f9s1aCoordTarget(center,"cella centrale"));
  }
  const center=selected[0];
  return f9s1bValidLineOptions(unit,center,ab)
    .map(x=>f9s1aCoordTarget(x.orientation,"orientamento linea"));
}

function f9s1bCompleteLineCoords(user,target,ab) {
  const supplied=target&&Array.isArray(target.selectedCoords)?target.selectedCoords:[];
  const center=supplied.length?supplied[0]:(target&&(target.coord||target.pos));
  if (!Array.isArray(center)) return [];
  if (supplied.length>=2) return f9s1bLineTriplet(user,center,supplied[1],ab);
  const options=f9s1bValidLineOptions(user,center,ab)
    .sort((a,b)=>f9s1bLineScore(user,b.coords)-f9s1bLineScore(user,a.coords)||coordKey(a.orientation).localeCompare(coordKey(b.orientation)));
  return options.length?options[0].coords:[];
}

function f9s1bAdjacentMoveLock(user,ab) {
  const targets=(typeof enemyCombatUnits==="function"?enemyCombatUnits(user.side):[])
    .filter(t=>t&&t.alive&&t.type!=="QG"&&Array.isArray(t.pos)&&areAdjacent(user.pos,t.pos));
  for (const target of targets) applyStatus(target,{kind:"inhibit_move",turns:1,source:ab.name,owner:user.side});
  log(`${ab.name}: ${targets.length} unità nemiche adiacenti bloccate nel movimento.`);
  return true;
}

function f9s1bCrash(user,target,ab) {
  if (!target||!target.alive||target.side===user.side||target.type==="QG"||!areAdjacent(user.pos,target.pos)) return false;
  const heavy=String(target.weight||"").toLowerCase().startsWith("pesant");
  if (heavy&&target.currentDef>0) {
    target.currentDef=Math.max(0,target.currentDef-1);
    log(`${ab.name}: ${target.name} perde 1 DEF perché è Pesante.`);
  }
  const amount=Math.max(0,Number(user.currentHp)||0);
  if (amount<=0) return false;
  applyDamage(target,amount,ab.name,{amplifiable:true,attacker:user,ability:true,dynamicFromCurrentHp:true});
  return true;
}

function f9s1bErkos(user,target,ab) {
  if (!target||!target.alive||target.side===user.side||target.type==="QG") return false;
  applyDamage(target,Number(ab.value)||2,ab.name,{amplifiable:true,attacker:user,ability:true});
  if (target.alive) applyStatus(target,{kind:"inhibit_move",turns:1,source:ab.name,owner:user.side});
  return true;
}

function f9s1bLineSuppression(user,target,ab) {
  const coords=f9s1bCompleteLineCoords(user,target,ab);
  if (coords.length!==3) { log(`${ab.name} fallisce: linea di 3 celle non valida.`); return false; }
  f9s1aDamageUnitsOnCells(user,coords,Number(ab.value)||2,ab.name,{f9s1bLine:true});
  return true;
}

function f9s1bAbilityHandler(kind,user,target,ab) {
  if (kind==="f9s1bAdjacentMoveLock") return f9s1bAdjacentMoveLock(user,ab);
  if (kind==="f9s1bCrash") return f9s1bCrash(user,target,ab);
  if (kind==="f9s1bErkos") return f9s1bErkos(user,target,ab);
  if (kind==="f9s1bLineSuppression") return f9s1bLineSuppression(user,target,ab);
  return false;
}

function f9s1bApplyEndTurnPassives(player) {
  const units=typeof combatUnits==="function"?combatUnits(player):[];
  for (const source of units) {
    const shred=Math.max(0,Number(source.twilightDefShred)||0);
    if (!shred||!source.alive||!Array.isArray(source.pos)) continue;
    const enemies=(typeof enemyCombatUnits==="function"?enemyCombatUnits(player):[])
      .filter(t=>t&&t.alive&&t.type!=="QG"&&Array.isArray(t.pos)&&areAdjacent(source.pos,t.pos));
    for (const target of enemies) {
      const before=Math.max(0,Number(target.currentDef)||0);
      target.currentDef=Math.max(0,before-shred);
      const lost=before-target.currentDef;
      if (lost>0) log(`Tramonto: ${target.name} perde ${lost} DEF accanto a ${source.name}.`);
    }
  }
}

function f9s1bAdjacentEnemyTower(target) {
  if (!target||!target.alive||target.type==="QG"||!Array.isArray(target.pos)) return null;
  return (state.units||[]).find(u=>u&&u.alive&&u.adjacentDamageAmp>0&&u.side!==target.side&&Array.isArray(u.pos)&&areAdjacent(u.pos,target.pos))||null;
}

function f9s1bAdjustIncomingDamage(target,amount,source,options={},damageKind="effect",sourceSide=null) {
  let adjusted=Math.max(0,Number(amount)||0);
  const tower=f9s1bAdjacentEnemyTower(target);
  if (tower&&adjusted>0) {
    const amp=Math.max(0,Number(tower.adjacentDamageAmp)||0);
    adjusted+=amp;
    log(`${target.name} subisce +${amp} danno per la Geometria della Sofferenza di ${tower.name}.`);
  }
  const reduction=Math.max(0,Number(target&&target.effectDamageReduction)||0);
  const enemySource=sourceSide&&sourceSide!==target.side;
  const reducible=enemySource&&(damageKind==="ability"||damageKind==="tactic");
  if (reduction&&reducible&&adjusted>0) {
    const blocked=Math.min(reduction,adjusted);
    adjusted-=blocked;
    log(`${target.name} riduce di ${blocked} il danno da ${source} con Corazza Reattiva.`);
  }
  return adjusted;
}
