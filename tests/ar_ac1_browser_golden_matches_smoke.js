"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const fixture = JSON.parse(fs.readFileSync(path.join(root, "tests", "fixtures", "ar_ac1_golden_matches.json"), "utf8"));

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function projectionHash(value) {
  return crypto.createHash("sha256").update(Buffer.from(canonical(value), "utf8")).digest("hex");
}

(async () => {
  assert.strictEqual(fixture.schemaVersion, 1);
  assert.strictEqual(fixture.projectionVersion, "AR-AC1-GOLDEN-2");
  const browser = await chromium.launch({ headless:true, executablePath:process.env.ARENA_BROWSER_EXECUTABLE || chromium.executablePath() });
  const page = await browser.newPage({ viewport:{ width:1366, height:900 } });
  page.setDefaultTimeout(120000);
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  try {
    const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
    const scripts = [...index.matchAll(/<script\s+src="([^"]+)"\s*><\/script>/g)].map(match => match[1]);
    const html = index
      .replace(/<script\s+src="[^"]+"\s*><\/script>/g, "")
      .replace(/<link\s+rel="stylesheet"\s+href="[^"]+"\s*\/?>/g, "");
    await page.setContent(html, { waitUntil:"load" });
    await page.addStyleTag({ path:path.join(root, "css", "style.css") });
    for (const relativePath of scripts) await page.addScriptTag({ path:path.join(root, relativePath) });
    await page.waitForFunction(() => typeof newGame === "function" && typeof runBotTurn === "function" && typeof countControlledPS === "function" && typeof initializeMatchTelemetry === "function");
    await page.evaluate(() => {
      const splash = document.getElementById("appSplash");
      if (splash) { splash.style.display = "none"; splash.style.pointerEvents = "none"; }
      window.__arGoldenNativeSetTimeout = window.setTimeout.bind(window);
      window.setTimeout = (callback, _delay, ...args) => window.__arGoldenNativeSetTimeout(callback, 0, ...args);
    });

    const results = [];
    for (const match of fixture.matches) {
      const runs = [];
      for (let repeat = 0; repeat < 2; repeat += 1) {
        const projection = await page.evaluate(async item => {
          const initiative = document.getElementById("initiativeMode");
          if (initiative) initiative.value = "1";
          const playerIds = Object.keys(item.factions).map(Number).sort((a, b) => a - b);
          const modes = Object.fromEntries(playerIds.map(side => [side, "human"]));
          const selectedDecks = Object.fromEntries(playerIds.map(side => [side, { mode:"custom", savedKey:item.decks[String(side)] }]));
          newGame({
            mapId:item.mapId, factions:item.factions, selectedCommanders:item.commanders, selectedDecks, modes,
            autoResignEnabled:false, tutorialMode:false, mapLabMode:false, aiMode:"advanced", pacePreset:"standard",
            gameScaleMode:"large_scale", matchSeed:item.seed
          });
          for (let step = 0; step < item.actionTurns && !state.winner; step += 1) {
            const side = Number(state.currentPlayer);
            state.playerIds.forEach(id => { state.modes[id] = "human"; });
            state.modes[side] = "bot";
            await runBotTurn({ skipInitialRender:true });
            state.playerIds.forEach(id => { state.modes[id] = "human"; });
          }
          const cardIds = cards => (cards || []).map(card => String(card.id || card.cardId || ""));
          const eventCounts = {};
          for (const event of state.events || []) {
            const type = String(event && event.type || "unknown");
            if (type === "LOG_MESSAGE") continue;
            eventCounts[type] = (eventCounts[type] || 0) + 1;
          }
          const bySide = mapper => Object.fromEntries(state.playerIds.map(side => [side, mapper(side)]));
          const telemetryPlayers = state.matchTelemetry && state.matchTelemetry.players || {};
          return {
            projectionVersion:"AR-AC1-GOLDEN-2",
            id:item.id,
            setup:{
              seed:state.matchSeed, mapId:state.mapId, playerIds:[...state.playerIds], factions:{...state.factions},
              commanders:{...state.selectedCommanders}, decks:Object.fromEntries(state.playerIds.map(side => [side, item.decks[String(side)]])),
              aiMode:state.aiMode, pacePreset:state.pacePreset, gameScaleMode:state.gameScaleMode, actionTurns:item.actionTurns
            },
            outcome:{
              winner:state.winner, round:state.turn, currentPlayer:state.currentPlayer,
              energy:bySide(side => state.energy[side]), pressure:bySide(side => state.pressure[side]),
              controlledPs:bySide(side => countControlledPS(side))
            },
            units:(state.units || []).map(unit => ({
              uid:String(unit.uid || ""), blueprintId:String(unit.blueprintId || unit.id || ""), side:Number(unit.side),
              type:String(unit.type || ""), pos:Array.isArray(unit.pos) ? [...unit.pos] : null,
              hp:Number(unit.currentHp || 0), def:Number(unit.currentDef || 0), alive:unit.alive !== false, acted:unit.acted === true
            })).sort((a, b) => a.uid.localeCompare(b.uid)),
            strategicControl:(state.cells || []).filter(cell => cell.ps).map(cell => ({
              coord:[...cell.coord], control:cell.control == null ? null : Number(cell.control)
            })).sort((a, b) => a.coord.join(",").localeCompare(b.coord.join(","))),
            cards:bySide(side => ({
              hand:cardIds(state.hand[side]), deckCount:(state.deck[side] || []).length,
              deckTop:cardIds((state.deck[side] || []).slice(0, 8)), discard:cardIds(state.discard[side]),
              starters:Object.keys(state.starterCards[side] || {}).sort()
            })),
            lifecycle:(state.players || []).map(player => ({
              id:Number(player.id), eliminated:player.eliminated === true, status:String(player.lifecycleStatus || ""),
              eliminatedBy:player.eliminatedBy == null ? null : Number(player.eliminatedBy), reason:player.eliminationReason || null
            })).sort((a, b) => a.id - b.id),
            telemetry:{
              rng:{ algorithm:state.matchTelemetry.rng.algorithm, seed:state.matchTelemetry.rng.seed, calls:state.matchTelemetry.rng.calls },
              players:bySide(side => {
                const player = telemetryPlayers[side];
                return {
                  turns:player.turns.length,
                  economy:{ gained:player.economy.gainedTotal, spent:player.economy.spentTotal },
                  cards:{ drawn:player.cards.drawn, played:player.cards.played, discarded:player.cards.discarded },
                  field:{ deployed:player.field.unitsDeployed, structures:player.field.structuresBuilt, psGained:player.field.psGained },
                  combat:{ attacks:player.combat.attacks, abilities:player.combat.abilities, tactics:player.combat.tactics, damage:player.combat.damageDealt, kills:player.combat.kills, losses:player.combat.unitsLost },
                  mission:{ readyRound:player.mission.readyRound, playedRound:player.mission.playedRound, rewards:player.mission.rewardsResolved }
                };
              }),
              eventCounts:Object.fromEntries(Object.entries(eventCounts).sort(([a], [b]) => a.localeCompare(b)))
            }
          };
        }, match);
        runs.push({ hash:projectionHash(projection), projection });
      }
      assert.strictEqual(runs[0].hash, runs[1].hash, `${match.id}: repeated run drift`);
      assert.strictEqual(runs[0].hash, match.expectedProjectionHash, `${match.id}: frozen projection drift`);
      const telemetryPlayers = Object.values(runs[0].projection.telemetry.players);
      results.push({
        id:match.id, players:Object.keys(match.factions).length, actionTurns:match.actionTurns, hash:runs[0].hash,
        round:runs[0].projection.outcome.round,
        attacks:telemetryPlayers.reduce((sum, player) => sum + player.combat.attacks, 0),
        damage:telemetryPlayers.reduce((sum, player) => sum + player.combat.damage, 0)
      });
    }
    assert.deepStrictEqual(pageErrors, []);
    assert.deepStrictEqual(consoleErrors, []);
    console.log(JSON.stringify({ status:"PASS", projectionVersion:fixture.projectionVersion, matches:results, repeatRunsIdentical:true }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error && error.stack || error);
  process.exitCode = 1;
});
