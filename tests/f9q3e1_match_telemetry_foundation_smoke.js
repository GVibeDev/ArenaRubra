"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
let passed = 0;
let failed = 0;

function read(rel) { return fs.readFileSync(path.join(ROOT, rel), "utf8"); }
function sha256(rel) { return crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, rel))).digest("hex"); }
function ok(condition, label) {
  if (condition) { passed += 1; console.log(`PASS ${label}`); }
  else { failed += 1; console.error(`FAIL ${label}`); }
}

const telemetrySource = read("src/match_telemetry.js");
const sandbox = {
  console,
  Date,
  Math,
  JSON,
  Number,
  String,
  Object,
  Array,
  Set,
  Map,
  performance: { now: () => 1 },
};
vm.createContext(sandbox);
vm.runInContext(`${telemetrySource}\n;globalThis.__exports={MATCH_TELEMETRY_SCHEMA_VERSION,MATCH_TELEMETRY_RNG_ALGORITHM,telemetryHashSeed,createMatchRngController};`, sandbox, { filename:"match_telemetry.js" });
const api = sandbox.__exports;

ok(api.MATCH_TELEMETRY_SCHEMA_VERSION === "F9Q3e1-2", "schema version is explicit");
ok(api.MATCH_TELEMETRY_RNG_ALGORITHM === "mulberry32", "RNG algorithm is explicit");
const a = api.createMatchRngController("seed-alpha");
const b = api.createMatchRngController("seed-alpha");
const c = api.createMatchRngController("seed-beta");
const seqA = Array.from({length:12}, () => a.next());
const seqB = Array.from({length:12}, () => b.next());
const seqC = Array.from({length:12}, () => c.next());
ok(JSON.stringify(seqA) === JSON.stringify(seqB), "same seed reproduces the same sequence");
ok(JSON.stringify(seqA) !== JSON.stringify(seqC), "different seed produces a different sequence");
ok(a.calls === 12 && b.calls === 12 && c.calls === 12, "RNG call counters advance deterministically");
ok(seqA.every(value => value >= 0 && value < 1), "RNG values stay in [0,1)");

const state = read("src/state.js");
const game = read("src/game.js");
const deck = read("src/deck.js");
const tactics = read("src/tactics.js");
const events = read("src/events.js");
const turns = read("src/turns.js");
const stats = read("src/stats.js");
const render = read("src/render.js");
const ui = read("src/ui.js");
const index = read("index.html");
const build = read("src/build_info.js");

ok(state.includes("matchTelemetry") && state.includes("matchTelemetryRuntime"), "state owns telemetry and runtime buffers");
ok(state.includes("matchSeed") && state.includes("matchRngState") && state.includes("matchRngCalls"), "state owns reproducibility fields");
ok(game.includes("initializeMatchTelemetry()"), "new game initializes telemetry");
ok(game.includes("createMatchRngController(matchSeed)"), "new game creates seeded RNG");
ok(game.includes("telemetrySchemaVersion") && game.includes("rngAlgorithm"), "GAME_STARTED exposes telemetry schema and RNG metadata");
ok(deck.includes("matchRandom") && tactics.includes("matchRandom"), "deck and tactic randomness use match RNG");
ok(events.includes("updateMatchTelemetryFromEvent"), "typed event pipeline feeds telemetry");
ok(turns.includes("telemetryTurnReady"), "turn start records hand playability");
ok(stats.includes("matchTelemetry: typeof currentMatchTelemetrySnapshot"), "match history persists telemetry snapshot");
ok(stats.includes("MatchSeed:") && stats.includes("MatchTelemetrySchema:"), "text log exposes seed and schema");
ok(render.includes("renderMatchTelemetryPanel"), "main render refreshes telemetry panel");
ok(ui.includes("copyMatchTelemetryJsonBtn"), "UI binds telemetry JSON copy action");
ok(index.includes('src/match_telemetry.js'), "telemetry module is loaded by index");
ok(index.includes('id="matchTelemetryPanel"') && index.includes('id="copyMatchTelemetryJsonBtn"'), "diagnostic panel and copy control are present");
ok(build.includes('version: "C2-STABLE-1-F9U2b-APK-M4c"'), "candidate build metadata is current");
ok(build.includes('logicBaseline: "C2-STABLE-1-F9U2a-APK-M4c"'), "validated logic baseline is preserved");

ok(telemetrySource.includes("deadHandTurns") && telemetrySource.includes("playableButUnusedTurns") && telemetrySource.includes("noCardPlayedTurns"), "turn diagnostics distinguish dead and unused hands");
ok(telemetrySource.includes("pivotDrawRound") && telemetrySource.includes("pivotDeployedRound") && telemetrySource.includes("pivotDestroyedRound"), "Pivot lifecycle is measured");
ok(telemetrySource.includes("completionRound") && telemetrySource.includes("rewardResolvedRound"), "Mission completion and reward are measured");
ok(telemetrySource.includes("gainedFromCards") && telemetrySource.includes("spentTactics") && telemetrySource.includes("spentAbilities"), "ENE gains and spending are categorized");
ok(telemetrySource.includes("currentMatchTelemetryJson") && telemetrySource.includes("copyCurrentMatchTelemetryJson"), "versioned JSON snapshot is available");

ok(sha256("data/builtin_decks.js") === "87de2aeeaee1db794fa6ca45209c6afa121511bdf129b7a18722955d0bf39f2c", "official 50-deck roster file is unchanged from F9S1c1");

console.log(JSON.stringify({passed, failed, total:passed+failed}, null, 2));
if (failed) process.exit(1);
