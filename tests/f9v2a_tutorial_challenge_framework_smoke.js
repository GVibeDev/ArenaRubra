"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const storeMap = new Map();
const context = vm.createContext({
  console,
  Date,
  setTimeout,
  clearTimeout,
  localStorage:{
    getItem:key => storeMap.has(key) ? storeMap.get(key) : null,
    setItem:(key,value) => storeMap.set(key, String(value)),
    removeItem:key => storeMap.delete(key)
  },
  renderAll:()=>{},
  syncCardDebugState:()=>{},
  resetInteractionContext:()=>{},
  mapRuntimePlayerIds:()=>[1,2],
  ARENA_APP_SCREENS:{ GAME:"game", TUTORIAL:"tutorial" },
  setAppScreen:()=>{},
  state:null
});

function load(rel) {
  const code = fs.readFileSync(path.join(ROOT, rel), "utf8");
  vm.runInContext(code, context, { filename:rel });
}

load("data/tutorial_scenarios.js");
load("src/tutorial_runtime.js");
load("src/build_info.js");

const evaluate = expression => vm.runInContext(expression, context);
const plan = evaluate("tutorialRuntimeChallengePlan().map(item => ({...item}))");
if (plan.length !== 5) throw new Error(`Expected 5 challenge definitions, got ${plan.length}`);
if (new Set(plan.map(item => item.id)).size !== 5) throw new Error("Challenge IDs are not unique");
if (!plan.every(item => item.unlockRule === "all_tutorial_lessons_completed")) throw new Error("Unexpected unlock rule");
if (plan[0].scenarioId !== "challenge-1-elimination") throw new Error("F9V2b/F9V2c must preserve Challenge 1 scenario");
if (plan[1].scenarioId !== "challenge-2-hold-ps") throw new Error("F9V2c must publish Challenge 2 scenario");
if (!plan.slice(2).every(item => item.scenarioId === null)) throw new Error("Challenges 3–5 must remain pending in F9V2c");

let unlock = evaluate("tutorialRuntimeChallengeUnlockStatus()");
if (unlock.unlocked || unlock.completedLessons !== 0 || unlock.requiredLessons !== 5) throw new Error(`Unexpected initial gate ${JSON.stringify(unlock)}`);

// Backward compatibility: F9V1a/F9O7 stores did not contain the challenges field.
storeMap.set("arenaRubra.tutorial.v1", JSON.stringify({
  schemaVersion:1,
  scenarios:{},
  lessons:{
    "lesson-1-exordium":{completed:true},
    "lesson-2-nexus":{completed:true},
    "lesson-3-agathoi":{completed:true},
    "lesson-4-liberti":{completed:true}
  },
  updatedAt:"2026-08-22T00:00:00.000Z"
}));
let normalized = evaluate("tutorialRuntimeStorageRead()");
if (!normalized.challenges || Object.keys(normalized.challenges).length !== 0) throw new Error("Legacy tutorial store was not migrated safely");
unlock = evaluate("tutorialRuntimeChallengeUnlockStatus()");
if (unlock.unlocked || unlock.completedLessons !== 4 || unlock.remainingLessons !== 1) throw new Error(`4/5 must remain locked: ${JSON.stringify(unlock)}`);

// Completing lesson 5 unlocks all five at once.
normalized.lessons["lesson-5-fabeot"] = {completed:true};
context.__store = normalized;
evaluate("tutorialRuntimeStorageWrite(__store)");
unlock = evaluate("tutorialRuntimeChallengeUnlockStatus()");
if (!unlock.unlocked || unlock.completedLessons !== 5 || unlock.remainingLessons !== 0) throw new Error(`5/5 must unlock challenges: ${JSON.stringify(unlock)}`);
if (!evaluate("tutorialRuntimeChallengesUnlocked()")) throw new Error("Global challenge unlock helper returned false at 5/5");

// F9V2c preserves Challenge 1 and publishes Challenge 2 while keeping Challenges 3–5 as placeholders.
if (!evaluate("tutorialRuntimeChallengeScenarioById('challenge-1-elimination')")) throw new Error("Challenge 1 scenario missing");
if (!evaluate("tutorialRuntimeChallengeScenarioById('challenge-2-hold-ps')")) throw new Error("Challenge 2 scenario missing");
if (evaluate("tutorialRuntimeChallengeScenarioById('challenge-3-hq-breach')") !== null) throw new Error("Challenge 3 must remain pending in F9V2c");

// Challenge progress is separate from lesson/scenario progress.
evaluate("tutorialRuntimeSaveChallengeProgress('challenge-1-elimination', {incrementAttempt:true, outcome:'started'})");
evaluate("tutorialRuntimeSaveChallengeProgress('challenge-1-elimination', {completed:true, outcome:'success', reason:'smoke'})");
const challengeProgress = evaluate("tutorialRuntimeProgressForChallenge('challenge-1-elimination')");
if (!challengeProgress.completed || challengeProgress.attempts !== 1 || challengeProgress.lastOutcome !== "success") throw new Error(`Challenge progress invalid: ${JSON.stringify(challengeProgress)}`);

// Generic freeplay scaffold keeps Challenge matches out of normal competitive recording.
context.document = { getElementById:()=>null };
context.newGame = options => {
  context.state = {
    modes:{1:"human",2:"bot"}, factions:{1:"Exordium",2:"Nexus"},
    energy:{1:0,2:0}, hand:{1:[],2:[]}, deck:{1:[],2:[]}, discard:{1:[],2:[]}, starterCards:{1:{},2:{}},
    ...options
  };
};
context.__challenge = plan[0];
context.__scenario = {
  id:"smoke-challenge",
  title:"Smoke Challenge",
  setup:{
    mapId:"map1_starter",
    factions:{1:"Exordium",2:"Nexus"},
    modes:{1:"human",2:"bot"},
    selectedCommanders:{1:"EX0B00",2:"NXCMD01"},
    selectedDecks:{1:{mode:"template"},2:{mode:"template"}},
    energy:{1:5,2:5},
    hand:{1:[],2:[]}, deck:{1:[],2:[]}, discard:{1:[],2:[]}
  }
};
if (!evaluate("tutorialRuntimeApplyChallengeSetup(__challenge, __scenario)")) throw new Error("Freeplay challenge setup scaffold failed");
const stateCheck = evaluate("({tutorialMode:state.tutorialMode, tutorialChallengeMode:state.tutorialChallengeMode, tutorialChallengeId:state.tutorialChallengeId, matchRecorded:state.matchRecorded, botPaused:state.tutorialBotPaused})");
if (!stateCheck.tutorialMode || !stateCheck.tutorialChallengeMode || stateCheck.tutorialChallengeId !== "challenge-1-elimination" || stateCheck.matchRecorded !== false || stateCheck.botPaused !== false) {
  throw new Error(`Challenge state contract invalid: ${JSON.stringify(stateCheck)}`);
}

if (evaluate("BUILD_INFO.version") !== "C2-STABLE-1-F9V2c-APK-M4c") throw new Error("BUILD_INFO version not updated");

console.log(JSON.stringify({
  ok:true,
  challenges:plan.length,
  unlockAt:"5/5",
  legacyStoreMigration:true,
  separateChallengeProgress:true,
  freeplayScaffold:true,
  build:evaluate("BUILD_INFO.version")
}, null, 2));
