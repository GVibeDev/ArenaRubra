"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname,"..");
const read = relative => fs.readFileSync(path.join(root,relative),"utf8");
const serviceFiles = ["pressure_perception","finalization_memory","faction_maturity","garrison_planning","strategic_status","move_context","faction_move_scoring","move_selection","move_execution","combat_execution"];
const serviceSources = serviceFiles.map(name => path.join(root,"src","ai",`${name}.js`)).filter(fs.existsSync).map(file => fs.readFileSync(file,"utf8"));
const combatSource = serviceFiles.includes("combat_execution") && fs.existsSync(path.join(root,"src/ai/combat_execution.js")) ? read("src/ai/combat_execution.js") : "";
const aiSource = read("src/ai.js");
let checks = 0;
const eq = (actual,expected,message) => { assert.strictEqual(JSON.stringify(actual),JSON.stringify(expected),message); checks += 1; };
const ok = (value,message) => { assert.ok(value,message); checks += 1; };

function createHarness(options={}) {
  const calls = [];
  const unit = {side:1,pos:[0,0,0],alive:true,attacksMade:0};
  const low = {id:"low",pos:[1,-1,0],alive:true};
  const high = {id:"high",pos:[0,-1,1],alive:true};
  let rosterCalls = 0;
  const sandbox = {
    console,
    __enemy(side){ calls.push(`enemy:${side}`); return 2; },
    __combat(side){ calls.push(`combat:${side}`); rosterCalls += 1; return options.rosters ? (options.rosters[Math.min(rosterCalls-1,options.rosters.length-1)] || []) : [low,high]; },
    __adjacent(pos,targetPos){ calls.push(`adjacent:${targetPos===low.pos?"low":"high"}`); return options.adjacent !== false; },
    __advanced(){ calls.push("advanced"); return options.advanced !== false; },
    __should(moving,target){ calls.push(`should:${target.id}`); return options.reject === target.id ? false : true; },
    __canAttack(moving){ calls.push("canAttack"); return options.canAttack !== false && moving.alive; },
    __score(moving,target){ calls.push(`score:${target.id}`); return target===high ? 9 : 2; },
    __attack(moving,target){ calls.push(`attack:${target.id}`); if(options.attackError) throw new Error("attack-failed"); if(options.increment !== false) moving.attacksMade += 1; if(options.removeAttacker) moving.alive=false; },
    __field(moving){ calls.push("field"); return moving.alive; }
  };
  vm.createContext(sandbox);
  vm.runInContext(`${serviceSources.join("\n")}\n${aiSource}\n;
    enemyOf=__enemy; combatUnits=__combat; areAdjacent=__adjacent; advancedAiEnabled=__advanced;
    botShouldAttackTarget=__should; canAttack=__canAttack; scoreAttackTarget=__score;
    attackUnit=__attack; isFieldUnit=__field; globalThis.__api={botTryAttackOnly};`,sandbox);
  return {api:sandbox.__api,unit,low,high,calls};
}

{
  const h=createHarness({rosters:[[]]});
  eq(h.api.botTryAttackOnly(h.unit),false,"no adjacent target returns false");
  ok(!h.calls.includes("canAttack"),"empty target list short-circuits capability checks");
}
{
  const h=createHarness({advanced:true,reject:"high",rosters:null,increment:false});
  eq(h.api.botTryAttackOnly(h.unit),true,"one attempted attack reports work even when attack count does not advance");
  ok(h.calls.includes("should:low")&&h.calls.includes("should:high"),"Advanced mode applies target policy to every adjacent enemy");
  ok(h.calls.includes("attack:low"),"filtered target is attacked");
  eq(h.calls.filter(call => call==="combat:2").length,1,"unchanged attack count breaks before roster refresh");
}
{
  const h=createHarness({advanced:false,increment:false});
  h.api.botTryAttackOnly(h.unit);
  ok(!h.calls.some(call => call.startsWith("should:")),"non-Advanced mode never invokes target policy");
  ok(h.calls.includes("attack:high"),"highest-scored adjacent target is selected");
}
{
  const h=createHarness({removeAttacker:true});
  eq(h.api.botTryAttackOnly(h.unit),true,"attacker removal after attack returns true immediately");
  eq(h.calls.filter(call => call==="combat:2").length,1,"removed attacker prevents roster refresh");
}
{
  const h=createHarness({canAttack:false});
  eq(h.api.botTryAttackOnly(h.unit),false,"incapable attacker returns false");
  ok(!h.calls.some(call => call.startsWith("score:")),"capability failure precedes scoring");
}
{
  const h=createHarness({attackError:true});
  assert.throws(() => h.api.botTryAttackOnly(h.unit),/attack-failed/); checks += 1;
  ok(!h.calls.includes("field"),"attack error propagates before field validation");
}

const legacyStart=aiSource.indexOf("function botTryAttackOnly");
const legacyEnd=aiSource.indexOf("function finishBotMove",legacyStart);
const extractedStart=combatSource.indexOf("function botTryAttackOnly");
const extractedEnd=combatSource.indexOf("function botTryStationaryAction",extractedStart);
const source=extractedStart>=0?combatSource.slice(extractedStart,extractedEnd):aiSource.slice(legacyStart,legacyEnd);
ok(source.includes("attacksMade")&&source.includes("didSomething"),"attack-only loop and progress guard are present");
ok(!/document|localStorage|sessionStorage|indexedDB|window\.|state\.|aiTelemetry|Math\.random|render\(|moveUnit\(|useAbility\(/.test(source),"attack-only logic excludes UI, storage, state, telemetry, RNG, movement and abilities");

console.log(`AR-AC1 AI attack-only characterization smoke: ${checks}/${checks} OK`);
