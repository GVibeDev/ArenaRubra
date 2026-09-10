"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname,"..");
const read = relative => fs.readFileSync(path.join(root,relative),"utf8");
const sources = [
  "src/ai/pressure_perception.js",
  "src/ai/finalization_memory.js",
  "src/ai/faction_maturity.js",
  "src/ai/garrison_planning.js",
  "src/ai/strategic_status.js",
  "src/ai/move_context.js",
  "src/ai/move_selection.js"
].map(read);
const aiSource = read("src/ai.js");
let checks = 0;
const ok = (value,message) => { assert.ok(value,message); checks += 1; };
const eq = (actual,expected,message) => { assert.strictEqual(JSON.stringify(actual),JSON.stringify(expected),message); checks += 1; };

function createHarness(options={}) {
  const calls = {};
  const hit = name => { calls[name] = (calls[name] || 0) + 1; };
  const unit = {uid:"moving",side:1,faction:"Nexus"};
  const automaticStatus = {active:true,source:"automatic"};
  const context = {
    console,
    __baseScore(entry,resolved){ hit("base"); assert.strictEqual(resolved.unit,unit); return entry.base; },
    __expertScore(moving,coord,resolved){ hit("expert"); assert.strictEqual(moving,unit); assert.strictEqual(resolved.unit,unit); return resolved.expertByCoord ? resolved.expertByCoord[coord.join(",")] || 0 : 0; },
    __strategicStatus(player){ hit("status"); assert.strictEqual(player,1); return automaticStatus; },
    __createContext(moving,moveOptions,status){
      hit("context");
      assert.strictEqual(moving,unit);
      assert.strictEqual(moveOptions,context.__moveOptions);
      context.__receivedStatus = status;
      return {unit:moving,status,candidates:context.__candidates,expertByCoord:context.__expertByCoord};
    }
  };
  vm.createContext(context);
  const expertBinding = options.expertAvailable === false
    ? "globalThis.expertFactionMoveBonusF9T2=undefined"
    : "expertFactionMoveBonusF9T2=__expertScore";
  vm.runInContext(`${sources.join("\n")}\n${aiSource}\n;
    botFactionMoveBaseScoreF9T0=__baseScore;
    strategicStatus=__strategicStatus;
    botCreateAdvancedMoveContextF9T0=__createContext;
    ${expertBinding};
    globalThis.__moveSelection={botAdvancedMoveScoreF9T0,chooseAdvancedMove};`,context,{filename:"ai-move-selection-characterization.js"});
  return {context,api:context.__moveSelection,unit,automaticStatus,calls};
}

function candidate(overrides={}) {
  return {
    coord:[1,-1,0],
    enemyHqDistance:3,
    base:10,
    generalScore:1,
    factionDoctrineScore:2,
    homeScore:3,
    emergencyScore:4,
    c2e3Score:5,
    missionScore:6,
    stallScore:7,
    ...overrides
  };
}

{
  const harness = createHarness();
  const entry = candidate();
  const context = {unit:harness.unit,status:{active:true},expertByCoord:{"1,-1,0":8}};
  const score = harness.api.botAdvancedMoveScoreF9T0(entry,context);
  assert.strictEqual(score,42.15,"active emergency weight and every additive term remain exact"); checks += 1;
  eq({base:harness.calls.base,expert:harness.calls.expert},{base:1,expert:1},"base and Expert scoring run exactly once");

  context.status.active = false;
  const inactiveScore = harness.api.botAdvancedMoveScoreF9T0(entry,context);
  assert.strictEqual(inactiveScore,38.75,"inactive status removes the emergency contribution"); checks += 1;
}

{
  const harness = createHarness({expertAvailable:false});
  const entry = candidate();
  const score = harness.api.botAdvancedMoveScoreF9T0(entry,{unit:harness.unit,status:{active:true}});
  assert.strictEqual(score,34.15,"missing Expert scorer preserves the zero fallback"); checks += 1;
  ok(!harness.calls.expert,"missing Expert scorer is never invoked");
}

{
  const harness = createHarness();
  const cachedStatus = {active:false,source:"cached"};
  const first = candidate({coord:[1,-1,0],enemyHqDistance:3,base:20});
  const second = candidate({coord:[22,-22,0],enemyHqDistance:1,base:20});
  const third = candidate({coord:[3,-3,0],enemyHqDistance:0,base:19});
  const moveOptions = [first.coord,second.coord,third.coord];
  harness.context.__moveOptions = moveOptions;
  harness.context.__candidates = [first,second,third];
  harness.context.__expertByCoord = {};
  const before = JSON.stringify({unit:harness.unit,moveOptions,candidates:harness.context.__candidates,status:cachedStatus});
  const selected = harness.api.chooseAdvancedMove(harness.unit,moveOptions,cachedStatus);
  ok(selected === second.coord,"equal scores use the lower enemy-distance/string-length tie value and preserve coordinate identity");
  ok(harness.context.__receivedStatus === cachedStatus,"cached status identity reaches context construction");
  eq({context:harness.calls.context,base:harness.calls.base,expert:harness.calls.expert},{context:1,base:3,expert:3},"context builds once and every candidate scores once in input order");
  ok(!harness.calls.status,"cached status skips strategic status composition");
  eq(JSON.stringify({unit:harness.unit,moveOptions,candidates:harness.context.__candidates,status:cachedStatus}),before,"selection does not mutate caller data");
}

{
  const harness = createHarness();
  const earlier = candidate({coord:[1,-1,0],enemyHqDistance:2,base:5});
  const later = candidate({coord:[2,-2,0],enemyHqDistance:2,base:5});
  const moveOptions = [earlier.coord,later.coord];
  harness.context.__moveOptions = moveOptions;
  harness.context.__candidates = [earlier,later];
  harness.context.__expertByCoord = {};
  const selected = harness.api.chooseAdvancedMove(harness.unit,moveOptions);
  ok(selected === earlier.coord,"an exact score-and-tie collision keeps the earlier candidate");
  eq(harness.calls.status,1,"missing cached status composes strategic status exactly once");
  ok(harness.context.__receivedStatus === harness.automaticStatus,"automatically composed status reaches context construction by identity");
}

{
  const harness = createHarness();
  harness.context.__moveOptions = [];
  harness.context.__candidates = [];
  harness.context.__expertByCoord = {};
  const selected = harness.api.chooseAdvancedMove(harness.unit,harness.context.__moveOptions,null);
  eq(selected,null,"empty candidates return null");
  eq({status:harness.calls.status,context:harness.calls.context},{status:1,context:1},"empty selection still resolves status and context once");
  ok(!harness.calls.base&&!harness.calls.expert,"empty selection performs no scoring");
}

{
  const harness = createHarness();
  const nanFirst = candidate({coord:[9,-9,0],enemyHqDistance:9,base:Number.NaN});
  const validLater = candidate({coord:[0,0,0],enemyHqDistance:0,base:999});
  harness.context.__moveOptions = [nanFirst.coord,validLater.coord];
  harness.context.__candidates = [nanFirst,validLater];
  harness.context.__expertByCoord = {};
  const selected = harness.api.chooseAdvancedMove(harness.unit,harness.context.__moveOptions,{active:false});
  ok(selected === nanFirst.coord,"a first NaN score retains the historical first-candidate lock");
}

const scoreStart = aiSource.indexOf("function botAdvancedMoveScoreF9T0");
const chooseStart = aiSource.indexOf("function chooseAdvancedMove",scoreStart);
const chooseEnd = aiSource.indexOf("function chooseAdvancedAgathoiMove",chooseStart);
const source = `${sources[sources.length-1]}\n${aiSource.slice(scoreStart,chooseEnd)}`;
ok(scoreStart>=0&&chooseStart>scoreStart&&chooseEnd>chooseStart,"scoring and selection source span is present");
for(const forbidden of ["document","localStorage","sessionStorage","indexedDB","window.","state.","Math.random","moveUnit(","render(",".sort("]){
  ok(!source.includes(forbidden),`scoring/selection excludes ${forbidden}`);
}
ok(source.includes("entry.emergencyScore * emergencyWeight")&&source.includes("entry.c2e3Score * 0.35"),"weighted aggregation remains explicit");
ok(source.includes("score === best.score && tie < best.tie"),"exact-score lower-tie replacement remains explicit");

console.log(`AR-AC1 AI move selection characterization smoke: ${checks}/${checks} OK`);
