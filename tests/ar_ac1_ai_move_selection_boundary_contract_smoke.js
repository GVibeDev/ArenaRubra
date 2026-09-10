"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname,"..");
const read = relative => fs.readFileSync(path.join(root,relative),"utf8");
const boundary = read("src/ai/move_selection.js");
const facade = read("src/ai.js");
const index = read("index.html");
let checks = 0;
const ok = (value,message) => { assert.ok(value,message); checks += 1; };
const eq = (actual,expected,message) => { assert.strictEqual(JSON.stringify(actual),JSON.stringify(expected),message); checks += 1; };

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(boundary,sandbox,{filename:"src/ai/move_selection.js"});
ok(typeof sandbox.createAiMoveSelectionService === "function","boundary exposes one factory without construction-time globals");

const calls = {};
const hit = name => { calls[name] = (calls[name] || 0) + 1; };
const unit = {uid:"u",side:1};
const cachedStatus = {active:true};
const firstCoord = [1,-1,0];
const secondCoord = [20,-20,0];
const first = {coord:firstCoord,enemyHqDistance:4,rank:8,base:10,generalScore:1,factionDoctrineScore:2,homeScore:3,emergencyScore:4,c2e3Score:5,missionScore:6,stallScore:7};
const second = {...first,coord:secondCoord,enemyHqDistance:1,rank:8};
const dependencies = {
  getFactionMoveBaseScore(entry,context){ hit("base"); assert.strictEqual(context.unit,unit); return entry.base; },
  getExpertFactionMoveBonus(moving,coord,context){ hit("expert"); assert.strictEqual(moving,unit); assert.strictEqual(context.unit,unit); return coord === firstCoord ? 8 : 0; },
  getStrategicStatus(player){ hit("status"); return {active:false,player}; },
  createMoveContext(moving,options,status){ hit("context"); return {unit:moving,status,candidates:[first,second],options}; },
  scoreCandidate(entry,context){ hit("score"); assert.strictEqual(context.unit,unit); return entry.rank; }
};
const service = sandbox.createAiMoveSelectionService(dependencies);
ok(Object.isFrozen(service),"service API is immutable");
eq(Array.from(Object.keys(service)),["botAdvancedMoveScoreF9T0","chooseAdvancedMove"],"service exposes only aggregation and selection");

const activeScore = service.botAdvancedMoveScoreF9T0(first,{unit,status:cachedStatus});
assert.strictEqual(activeScore,42.15,"service preserves every additive term and active emergency weighting"); checks += 1;
eq({base:calls.base,expert:calls.expert},{base:1,expert:1},"aggregation invokes both scoring ports once");

const selected = service.chooseAdvancedMove(unit,[firstCoord,secondCoord],cachedStatus);
ok(selected === secondCoord,"lower deterministic tie value wins and coordinate identity is preserved");
eq({context:calls.context,score:calls.score},{context:1,score:2},"selection builds once and scores each candidate once");
ok(!calls.status,"cached status bypasses strategic-status lookup");

const automaticCalls = {};
const automatic = sandbox.createAiMoveSelectionService({
  ...dependencies,
  getStrategicStatus(player){ automaticCalls.status = (automaticCalls.status || 0) + 1; return {active:false,player}; },
  createMoveContext(moving,options,status){ automaticCalls.context = (automaticCalls.context || 0) + 1; automaticCalls.received = status; return {unit:moving,status,candidates:[]}; },
  scoreCandidate(){ automaticCalls.score = (automaticCalls.score || 0) + 1; return 0; }
});
eq(automatic.chooseAdvancedMove(unit,[],null),null,"empty candidate list returns null");
eq({status:automaticCalls.status,context:automaticCalls.context},{status:1,context:1},"empty selection still resolves automatic status and context exactly once");
ok(automaticCalls.received.player===1&&!automaticCalls.score,"automatic status is forwarded and empty selection skips scoring");

for(const forbidden of ["document","localStorage","sessionStorage","indexedDB","window.","state.","aiTelemetry","Math.random","moveUnit(","render(",".sort("]){
  ok(!boundary.includes(forbidden),`boundary excludes ${forbidden}`);
}
for(const port of Object.keys(dependencies)) ok(boundary.includes(port),`boundary declares the ${port} port`);
for(const leaked of ["unitIsGarrisoningPs","psProtectionMoveBonus","botAgathoiStructureNetworkScore","botFabeotLessDefendedPsTargets"]){
  ok(!boundary.includes(leaked),`boundary excludes faction scorer dependency ${leaked}`);
}
ok(boundary.includes("entry.emergencyScore * emergencyWeight")&&boundary.includes("entry.c2e3Score * 0.35"),"boundary owns the exact weighted aggregation");
ok(boundary.includes("score === best.score && tie < best.tie"),"boundary owns exact-score deterministic tie replacement");
ok(boundary.includes('String(entry.coord.join(",")).length * 0.000001'),"boundary preserves the historical coordinate-string tie component");

eq((facade.match(/function\s+botAdvancedMoveScoreF9T0\s*\(/g)||[]).length,1,"legacy advanced scorer has one facade declaration");
eq((facade.match(/function\s+chooseAdvancedMove\s*\(/g)||[]).length,1,"legacy selector has one facade declaration");
ok(facade.includes("createAiMoveSelectionService({"),"legacy facade creates the service lazily");
ok(facade.includes("getFactionMoveBaseScore:(entry,context) => botFactionMoveBaseScoreF9T0(entry,context)"),"faction base scoring remains late-bound");
ok(facade.includes('typeof expertFactionMoveBonusF9T2 === "function" ? expertFactionMoveBonusF9T2(unit,coord,context) : 0'),"optional Expert scorer retains its zero fallback");
ok(facade.includes("getStrategicStatus:player => strategicStatus(player)"),"strategic-status lookup remains late-bound");
ok(facade.includes("createMoveContext:(unit,options,status) => botCreateAdvancedMoveContextF9T0(unit,options,status)"),"context construction remains late-bound");
ok(facade.includes("scoreCandidate:(entry,context) => botAdvancedMoveScoreF9T0(entry,context)"),"candidate scoring remains late-bound for compatibility");
ok(facade.includes("aiMoveSelectionService().botAdvancedMoveScoreF9T0(entry,context)"),"legacy scorer delegates to the service");
ok(facade.includes("aiMoveSelectionService().chooseAdvancedMove(unit,options,cachedStatus)"),"legacy selector delegates to the service");

const scoreStart = facade.indexOf("function botAdvancedMoveScoreF9T0");
const chooseStart = facade.indexOf("function chooseAdvancedMove",scoreStart);
const wrapperStart = facade.indexOf("function chooseAdvancedAgathoiMove",chooseStart);
const facadeBodies = facade.slice(scoreStart,wrapperStart);
ok(!facadeBodies.includes("emergencyWeight")&&!facadeBodies.includes("for (const entry")&&!facadeBodies.includes("best.score"),"aggregation and selection have one implementation owner");

const statusIndex = index.indexOf('<script src="src/ai/strategic_status.js"></script>');
const contextIndex = index.indexOf('<script src="src/ai/move_context.js"></script>');
const factionIndex = index.indexOf('<script src="src/ai/faction_move_scoring.js"></script>');
const selectionIndex = index.indexOf('<script src="src/ai/move_selection.js"></script>');
const facadeIndex = index.indexOf('<script src="src/ai.js"></script>');
ok(statusIndex>=0&&statusIndex<contextIndex&&contextIndex<factionIndex&&factionIndex<selectionIndex&&selectionIndex<facadeIndex,"browser loads selection after context and faction scoring and before the facade");

console.log(`AR-AC1 AI move selection boundary contract smoke: ${checks}/${checks} OK`);
