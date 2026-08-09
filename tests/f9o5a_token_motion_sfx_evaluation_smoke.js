"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");
const root = path.resolve(__dirname, "..");
const settings = {};
const state = {
  units:[
    {uid:"a", id:"NX2B01", faction:"Nexus", type:"Fanteria", unitClass:"starter", pos:[0,0,0], tokenFxProfile:"energy", tokenAnimationProfile:"energy", sfxProfile:"energy"},
    {uid:"b", id:"EX2B04", faction:"Exordium", type:"Veicolo", unitClass:"elite", pos:[1,-1,0], tokenFxProfile:"ballistic_heavy", tokenAnimationProfile:"ballistic_heavy", sfxProfile:"ballistic_heavy"}
  ]
};
const EventTypes = {
  UNIT_ATTACKED:"UNIT_ATTACKED", UNIT_DAMAGED:"UNIT_DAMAGED", UNIT_DESTROYED:"UNIT_DESTROYED", ABILITY_USED:"ABILITY_USED"
};
const ctx = {
  console, Math, Date, Map, Set, Object, Array, Number, Boolean, Promise,
  setTimeout, clearTimeout, state, EventTypes,
  arenaStorageReadSettings:() => JSON.parse(JSON.stringify(settings)),
  arenaStorageWriteSettings:value => { Object.keys(settings).forEach(k => delete settings[k]); Object.assign(settings, JSON.parse(JSON.stringify(value))); return true; }
};
vm.createContext(ctx);
function load(rel, trailer="") { vm.runInContext(fs.readFileSync(path.join(root, rel), "utf8") + trailer, ctx, {filename:rel}); }
load("data/units_base.js");
load("data/unit_taxonomy.js");
load("data/token_fx_profiles.js", "\nthis.__fxAudit=tokenFxProfileAuditF9O5a; this.__profile=tokenFxProfileKeyForBlueprintF9O5a;");
load("src/token_fx.js", "\nthis.__fxDesc=tokenFxDescriptorForGameEventF9O5a; this.__fxMode=tokenFxSetModeF9O5a; this.__fxDiag=tokenFxDiagnosticsF9O5a;");
load("src/sfx_manager.js", "\nthis.__sfxDesc=arenaSfxDescriptorForGameEventF9O5a; this.__sfxVol=arenaSfxSetVolumePercentF9O5a; this.__sfxToggle=arenaSfxSetEnabledF9O5a; this.__sfxDiag=arenaSfxDiagnosticsF9O5a;");

const audit = JSON.parse(JSON.stringify(ctx.__fxAudit(vm.runInContext("BLUEPRINTS", ctx))));
assert.strictEqual(audit.ok, true, audit.errors.join("\n"));
assert.strictEqual(audit.total, 96);
assert.ok(Object.keys(audit.counts).length >= 6);
assert.strictEqual(ctx.__profile(vm.runInContext('BLUEPRINTS.find(x => x.id === "AGPIV01")', ctx)), "organic");
assert.strictEqual(ctx.__profile(vm.runInContext('BLUEPRINTS.find(x => x.id === "FBC1F04")', ctx)), "occult");

let d = ctx.__fxDesc({type:"UNIT_ATTACKED", data:{attackerId:"a", attackerPos:[0,0,0], defenderPos:[1,-1,0]}});
assert.strictEqual(d.kind, "attack");
assert.strictEqual(d.profile, "energy");
d = ctx.__fxDesc({type:"UNIT_DAMAGED", data:{targetId:"b", targetPos:[1,-1,0], damageKind:"attack"}});
assert.strictEqual(d.kind, "impact");
d = ctx.__fxDesc({type:"ABILITY_USED", data:{unitId:"a", targetId:"b", abilityKind:"damage"}});
assert.strictEqual(d.kind, "ability");
assert.deepStrictEqual(JSON.parse(JSON.stringify(d.from)), [0,0,0]);
assert.deepStrictEqual(JSON.parse(JSON.stringify(d.to)), [1,-1,0]);

assert.strictEqual(ctx.__fxMode("reduced", {persist:true}), "reduced");
assert.strictEqual(settings.tokenFx.mode, "reduced");
assert.strictEqual(ctx.__fxDiag().mode, "reduced");
assert.strictEqual(ctx.__fxMode("off", {persist:true}), "off");
assert.strictEqual(settings.tokenFx.mode, "off");

let sd = ctx.__sfxDesc({type:"UNIT_ATTACKED", data:{attackerId:"a", amount:3}});
assert.strictEqual(sd.kind, "attack");
assert.strictEqual(sd.profile, "energy");
sd = ctx.__sfxDesc({type:"UNIT_DESTROYED", data:{unitId:"b"}});
assert.strictEqual(sd.kind, "destruction");
assert.strictEqual(sd.profile, "ballistic_heavy");
assert.strictEqual(ctx.__sfxVol(27, {persist:true}), 27);
assert.strictEqual(settings.sfx.volumePercent, 27);
assert.strictEqual(ctx.__sfxToggle(false, {persist:true}), false);
assert.strictEqual(settings.sfx.enabled, false);
assert.strictEqual(ctx.__sfxDiag().volumePercent, 27);

load("data/cards_base.js", "\nthis.__catalogConfig=CARD_CATALOG_CONFIG;");
assert.ok(["C2-STABLE-1-F9O5a-APK-M4c","C2-STABLE-1-F9O5b-APK-M4c","C2-STABLE-1-F9O6-APK-M4c","C2-STABLE-1-F9O7e-APK-M4c","C2-STABLE-1-F9O7g-APK-M4c"].includes(ctx.__catalogConfig.version));
assert.ok(["token_motion_sfx_evaluation","hq_empty_objective_visual_hotfix","tutorial_runtime_foundation","lesson_1_exordium","lesson_2_nexus","collapsed_hand_controls_reflow","lesson_3_agathoi","lesson_4_liberti","lesson_5_fabeot"].includes(ctx.__catalogConfig.mode));
for (const flag of ["tokenFxProfilesF9O5a", "dynamicTokenFxLayerF9O5a", "tokenFxReducedOffModesF9O5a", "synthesizedSfxRuntimeF9O5a", "persistentSfxControlsF9O5a", "noWebGlMigrationF9O5a"]) {
  assert.strictEqual(ctx.__catalogConfig[flag], true, `Missing F9O5a flag ${flag}`);
}

const eventsCode = fs.readFileSync(path.join(root,"src/events.js"),"utf8");
assert.ok(eventsCode.includes("tokenFxEnqueueGameEvent(normalized)"));
assert.ok(eventsCode.includes("arenaSfxEnqueueGameEvent(normalized)"));
const index = fs.readFileSync(path.join(root,"index.html"),"utf8");
assert.ok(index.includes('src/token_fx.js'));
assert.ok(index.includes('src/sfx_manager.js'));
assert.ok(index.includes('data/token_fx_profiles.js'));
assert.ok(index.includes('data-arena-token-fx-toggle'));
assert.ok(index.includes('data-arena-sfx-toggle'));
const css = fs.readFileSync(path.join(root,"css/style.css"),"utf8");
assert.ok(css.includes("@keyframes tokenFxProjectileTravel"));
assert.ok(css.includes("@keyframes tokenFxDeathGhost"));
assert.ok(css.includes('html[data-token-fx-mode="reduced"]'));

console.log("F9O5a token motion & SFX evaluation smoke: OK");
console.log(JSON.stringify({audit, fx:ctx.__fxDiag(), sfx:ctx.__sfxDiag()}, null, 2));
