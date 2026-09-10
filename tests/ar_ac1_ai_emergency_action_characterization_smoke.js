"use strict";

const assert=require("assert");
const fs=require("fs");
const path=require("path");
const vm=require("vm");
const root=path.resolve(__dirname,"..");
const read=relative=>fs.readFileSync(path.join(root,relative),"utf8");
const names=["pressure_perception","finalization_memory","faction_maturity","garrison_planning","strategic_status","move_context","faction_move_scoring","move_selection","move_execution","combat_execution"];
const sources=names.map(name=>path.join(root,"src","ai",`${name}.js`)).filter(fs.existsSync).map(file=>fs.readFileSync(file,"utf8"));
const combatSource=fs.existsSync(path.join(root,"src/ai/combat_execution.js"))?read("src/ai/combat_execution.js"):"";
const aiSource=read("src/ai.js");
let checks=0;
const eq=(a,e,m)=>{assert.strictEqual(JSON.stringify(a),JSON.stringify(e),m);checks+=1;};
const ok=(v,m)=>{assert.ok(v,m);checks+=1;};

function createHarness(options={}){
  const calls=[];
  const unit={side:1,pos:[0,0,0],alive:true,type:options.type||"Fanteria",ability:{kind:"test"},attacksMade:0};
  const target={id:"target",pos:[1,-1,0],alive:true};
  const status=options.status||{active:options.active!==false,enemy:2};
  let canAttackCalls=0;
  const sandbox={console,
    __status(){calls.push("status");return status;},
    __combat(){calls.push("combat");return options.enemies===false?[]:[target];},
    __adjacent(){calls.push("adjacent");return true;},
    __strategic(){calls.push("strategic");return options.strategic!==false;},
    __canAttack(){calls.push("canAttack");canAttackCalls+=1;return canAttackCalls<=2&&unit.alive;},
    __score(){calls.push("score");return 3;},
    __attack(){calls.push("attack");if(options.increment!==false)unit.attacksMade+=1;if(options.removeAttacker)unit.alive=false;if(options.killTarget)target.alive=false;},
    __field(){calls.push("field");return unit.alive;},
    __canUse(){calls.push("canUse");return Boolean(options.canUse);},
    __targets(){calls.push("targets");return options.abilityTargets===false?[]:["ability-target"];},
    __stationary(){calls.push("stationary");},
    __end(){calls.push("end");}
  };
  vm.createContext(sandbox);
  vm.runInContext(`${sources.join("\n")}\n${aiSource}\n;
    strategicStatus=__status; combatUnits=__combat; areAdjacent=__adjacent; isStrategicEnemyTarget=__strategic;
    canAttack=__canAttack; scoreAttackTarget=__score; attackUnit=__attack; isFieldUnit=__field;
    canUseAbility=__canUse; abilityTargets=__targets; botTryStationaryAction=__stationary; endUnitAction=__end;
    movableCells=()=>[]; globalThis.__api={emergencyBotAction};`,sandbox);
  return{api:sandbox.__api,unit,status,calls};
}

{
  const h=createHarness({active:false});
  eq(h.api.emergencyBotAction(h.unit,()=>{throw new Error("unused");},h.status),false,"inactive strategy returns false");
  eq(h.calls,[],"supplied inactive status avoids all collaborators");
}
{
  const h=createHarness({enemies:false});
  eq(h.api.emergencyBotAction(h.unit,()=>{throw new Error("unused");},h.status),false,"no strategic adjacent target returns false");
  ok(!h.calls.includes("canAttack"),"empty strategic set short-circuits attack capability");
}
{
  const h=createHarness({});
  eq(h.api.emergencyBotAction(h.unit,()=>{throw new Error("unused");},null),true,"derived active status with target performs emergency action");
  ok(h.calls[0]==="status","missing status is resolved first");
  ok(h.calls.indexOf("attack")<h.calls.indexOf("field")&&h.calls.indexOf("field")<h.calls.indexOf("end"),"attack, survival check and end retain order");
}
{
  const h=createHarness({removeAttacker:true});
  const result=h.api.emergencyBotAction(h.unit,()=>{},h.status);
  eq(result,true,"attacker removal still reports emergency action");
  ok(!h.calls.includes("end"),"removed attacker is not ended");
}
{
  const h=createHarness({type:"Veicolo",canUse:true});
  h.api.emergencyBotAction(h.unit,()=>{},h.status);
  ok(h.calls.indexOf("stationary")<h.calls.indexOf("end"),"vehicle follow-up ability precedes end action");
}
{
  const h=createHarness({type:"Veicolo",canUse:true,abilityTargets:false});
  h.api.emergencyBotAction(h.unit,()=>{},h.status);
  ok(!h.calls.includes("stationary")&&h.calls.includes("end"),"vehicle without ability targets skips stationary follow-up and still ends");
}

const legacyStart=aiSource.indexOf("function emergencyBotAction");
const legacyEnd=aiSource.indexOf("function scoreAttackTarget",legacyStart);
const extractedStart=combatSource.indexOf("function emergencyBotAction");
const extractedEnd=combatSource.indexOf("return Object.freeze",extractedStart);
const source=extractedStart>=0?combatSource.slice(extractedStart,extractedEnd):aiSource.slice(legacyStart,legacyEnd);
ok(source.includes("scoreAttackTarget")&&source.includes("strategicAdjacent"),"emergency strategic attack loop is present");
ok(!/document|localStorage|sessionStorage|indexedDB|window\.|state\.|aiTelemetry|Math\.random|render\(|moveUnit\(/.test(source),"emergency action excludes UI, storage, direct state, telemetry, RNG, rendering and movement");

console.log(`AR-AC1 AI emergency-action characterization smoke: ${checks}/${checks} OK`);
