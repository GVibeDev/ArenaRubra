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
  const ability={kind:"test",passive:Boolean(options.passive)};
  const unit={name:"Unità",side:1,pos:[0,0,0],alive:true,type:options.type||"Fanteria",ability,attacksMade:0,f9s1aKeepActionAfterAbility:Boolean(options.keep),c2finalc2ReadyAfterAbility:Boolean(options.ready),postAttackMove:Boolean(options.postMove),f9s1aPostAttackMoveUsed:false};
  const enemy={id:"enemy",pos:[1,-1,0],alive:true};
  let canUseCalls=0;
  let canAttackCalls=0;
  const sandbox={console,
    __canAct(){calls.push("canAct");return options.canAct!==false;},
    __canUse(){calls.push("canUse");canUseCalls+=1;return options.canUseValues?Boolean(options.canUseValues[Math.min(canUseCalls-1,options.canUseValues.length-1)]):Boolean(options.canUse);},
    __targets(){calls.push("targets");return options.targets===false?[]:["target"];},
    __abilityScore(){calls.push("abilityScore");return options.abilityScore===undefined?5:options.abilityScore;},
    __useAbility(){calls.push("useAbility");if(options.abilityError)throw new Error("ability-failed");},
    __enemy(){calls.push("enemyOf");return 2;},
    __combat(){calls.push("combat");return options.enemies?[enemy]:[];},
    __adjacent(){calls.push("adjacent");return true;},
    __advanced(){calls.push("advanced");return false;},
    __should(){calls.push("should");return true;},
    __canAttack(){calls.push("canAttack");canAttackCalls+=1;return Boolean(options.enemies)&&canAttackCalls<=2;},
    __attackScore(){calls.push("attackScore");return 4;},
    __attack(){calls.push("attack");unit.attacksMade+=1;},
    __field(){calls.push("field");return unit.alive;},
    __movable(){calls.push("movable");return options.steps||[];},
    __chooseMove(){calls.push("chooseMove");return options.step||null;},
    __move(){calls.push("move");},
    __log(){calls.push("log");}
  };
  vm.createContext(sandbox);
  vm.runInContext(`${sources.join("\n")}\n${aiSource}\n;
    canAct=__canAct; canUseAbility=__canUse; abilityTargets=__targets; scoreAbilityWithMission=__abilityScore; useAbility=__useAbility;
    enemyOf=__enemy; combatUnits=__combat; areAdjacent=__adjacent; advancedAiEnabled=__advanced; botShouldAttackTarget=__should;
    canAttack=__canAttack; scoreAttackTarget=__attackScore; attackUnit=__attack; isFieldUnit=__field;
    movableCells=__movable; chooseBotMove=__chooseMove; botMoveUnitF9T0=__move; log=__log;
    globalThis.__api={botTryStationaryAction};`,sandbox);
  return{api:sandbox.__api,unit,calls};
}

{
  const h=createHarness({canAct:false});
  eq(h.api.botTryStationaryAction(h.unit),false,"unit that cannot act returns false");
  eq(h.calls,["canAct"],"capability guard precedes all actions");
}
{
  const h=createHarness({canUse:true});
  eq(h.api.botTryStationaryAction(h.unit),true,"positive infantry ability ends the stationary action successfully");
  eq(h.calls,["canAct","canUse","targets","abilityScore","useAbility"],"infantry ability uses the best positive target then returns");
}
{
  const h=createHarness({canUse:true,keep:true});
  eq(h.api.botTryStationaryAction(h.unit),false,"prepared follow-up action returns false after ability and no attack");
  eq(h.unit.f9s1aKeepActionAfterAbility,false,"prepared-action marker is consumed");
  ok(h.calls.includes("combat"),"prepared action continues into attack evaluation");
}
{
  const h=createHarness({canUse:true,ready:true});
  eq(h.api.botTryStationaryAction(h.unit),true,"C2 ready ability reports work after continuing");
  eq(h.unit.c2finalc2ReadyAfterAbility,false,"C2 ready marker is consumed");
}
{
  const h=createHarness({canUse:false,enemies:true,postMove:true,steps:[[1,-1,0]],step:[1,-1,0]});
  const result=h.api.botTryStationaryAction(h.unit);
  eq(result,true,"post-attack disengagement reports success");
  eq(h.unit.f9s1aPostAttackMoveUsed,true,"post-attack movement marker is set before movement");
  ok(h.calls.indexOf("attack")<h.calls.indexOf("move")&&h.calls.indexOf("move")<h.calls.indexOf("log"),"attack, post-attack move and log retain order");
}
{
  const h=createHarness({type:"Veicolo",canUseValues:[false,true],targets:true});
  eq(h.api.botTryStationaryAction(h.unit),true,"vehicle may use its ability in the second ability window");
  eq(h.calls.filter(call=>call==="canUse").length,2,"vehicle capability is queried in both historical windows");
}
{
  const h=createHarness({canUse:true,abilityError:true});
  assert.throws(()=>h.api.botTryStationaryAction(h.unit),/ability-failed/);checks+=1;
  ok(!h.calls.includes("combat"),"ability failure propagates before attack evaluation");
}

const legacyStart=aiSource.indexOf("function botTryStationaryAction");
const legacyEnd=aiSource.indexOf("function botTryAttackOnly",legacyStart);
const extractedStart=combatSource.indexOf("function botTryStationaryAction");
const extractedEnd=combatSource.indexOf("function emergencyBotAction",extractedStart);
const source=extractedStart>=0?combatSource.slice(extractedStart,extractedEnd):aiSource.slice(legacyStart,legacyEnd);
ok(source.includes("f9s1aKeepActionAfterAbility")&&source.includes("f9s1aPostAttackMoveUsed"),"stationary action retains its two stateful continuation markers");
ok(!/document|localStorage|sessionStorage|indexedDB|window\.|state\.|aiTelemetry|Math\.random|render\(/.test(source),"stationary action excludes UI, storage, direct state, telemetry, RNG and rendering");

console.log(`AR-AC1 AI stationary-action characterization smoke: ${checks}/${checks} OK`);
