"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const pressurePerceptionSource = fs.readFileSync(path.join(root, "src/ai/pressure_perception.js"), "utf8");
const aiSource = fs.readFileSync(path.join(root, "src/ai.js"), "utf8");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const eq = (actual, expected, message) => { assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected, message); checks += 1; };

function createRuntime({ withProfile=true, withCentralDelegate=true } = {}) {
  const profileFunction = withProfile ? "function pressureRuleProfile(){return __profileValue;}" : "";
  const centralFunction = withCentralDelegate
    ? "function playerControlsCentralStrategicPoint(player,profile){__centralCalls.push({player,profile:JSON.parse(JSON.stringify(profile))});return __centralAnswers[player]===true;}"
    : "";
  return new Function(`
let state=null;
let __profileValue=null;
let __centerCoord=[0,0,0];
let __centralAnswers={};
let __centralCalls=[];
const CENTER_PS_COORD=[0,0,0];
const PRESSURE_WIN=5;
const MAX_ROUND=40;
function sameCoord(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((value,index)=>value===b[index]);}
function getCentralStrategicPointCoord(){return __centerCoord;}
function pressureStartRound(){return 31;}
function pressureWinLimit(){return 6;}
function maxRoundLimit(){return 44;}
${profileFunction}
${centralFunction}
${pressurePerceptionSource}
${aiSource}
return {
  setState:value=>state=value,
  getState:()=>state,
  setProfile:value=>__profileValue=value,
  setCenter:value=>__centerCoord=value,
  setCentralAnswers:value=>__centralAnswers=value,
  getCentralCalls:()=>__centralCalls,
  botTotalPsCount,
  botPressureProfileF9T0,
  botControlsCentralF9T0
};
`)();
}

const makeState = controls => ({
  mapDefinition:{id:"ai-pressure"},
  cells:controls.map((control,index)=>({coord:index===0?[0,0,0]:[index,-index,0],ps:true,control}))
});

let runtime = createRuntime();
runtime.setState(null);
eq(runtime.botTotalPsCount(),3,"missing state retains the historical three-PS fallback");
runtime.setState({cells:[{ps:true},{ps:false},{ps:true},{ps:true}]});
eq(runtime.botTotalPsCount(),3,"total PS perception counts only strategic cells");

const canonicalProfile={
  totalPs:7,requiredPs:4,centralCoord:[2,0,-2],startRound:26,pressureWin:7,maxRound:50,scale:6
};
runtime.setState(makeState([1,1,2,2,3,3,null]));
runtime.setProfile(canonicalProfile);
let result=runtime.botPressureProfileF9T0();
eq(result,{
  totalPs:7,requiredPs:4,centralCoord:[2,0,-2],startRound:26,pressureWin:7,maxRound:50
},"AI pressure perception projects the canonical rule profile without extra fields");
result.centralCoord[0]=99;
eq(canonicalProfile.centralCoord,[2,0,-2],"AI profile clones the central coordinate instead of mutating rules data");

runtime.setState(makeState([1,1,2,2,null]));
runtime.setProfile({totalPs:0,requiredPs:0,centralCoord:null,startRound:0,pressureWin:0,maxRound:0});
result=runtime.botPressureProfileF9T0();
eq(result,{
  totalPs:5,requiredPs:3,centralCoord:[0,0,0],startRound:31,pressureWin:6,maxRound:44
},"invalid or zero rule fields use the exact legacy AI fallbacks");

runtime=createRuntime({withProfile:false,withCentralDelegate:false});
const fallbackState=makeState([2,1,2,1]);
runtime.setState(fallbackState);
const before=JSON.stringify(fallbackState);
eq(runtime.botPressureProfileF9T0(),{
  totalPs:4,requiredPs:2,centralCoord:[0,0,0],startRound:31,pressureWin:6,maxRound:44
},"AI builds a complete pressure profile when the rules facade is unavailable");
eq(runtime.botControlsCentralF9T0(2),true,"central-control fallback reads the semantic center cell owner");
eq(runtime.botControlsCentralF9T0(1),false,"central-control fallback rejects a non-owner");
eq(JSON.stringify(fallbackState),before,"pressure perception and central fallback are state-read-only");

runtime.setState({mapDefinition:{id:"empty"},cells:[]});
eq(runtime.botControlsCentralF9T0(1),false,"central-control fallback handles maps without a central PS cell");

runtime=createRuntime({withProfile:true,withCentralDelegate:true});
runtime.setState(makeState([1,2,2]));
runtime.setProfile(canonicalProfile);
runtime.setCentralAnswers({3:true});
eq(runtime.botControlsCentralF9T0(3,canonicalProfile),true,"AI delegates central ownership to the canonical rules facade when available");
eq(runtime.botControlsCentralF9T0(1,canonicalProfile),false,"delegated canonical ownership result is authoritative");
eq(runtime.getCentralCalls(),[
  {player:3,profile:canonicalProfile},
  {player:1,profile:canonicalProfile}
],"AI passes player and unchanged profile to the canonical ownership query");

ok(!/document|localStorage|sessionStorage/.test(pressurePerceptionSource),"characterized pressure-perception boundary has no DOM or storage dependency");

console.log(`AR-AC1 AI pressure perception characterization smoke: ${checks}/${checks} OK`);
