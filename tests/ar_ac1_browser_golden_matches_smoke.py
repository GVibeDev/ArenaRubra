from browser_runtime import chromium_launch_options
from hashlib import sha256
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import re


ROOT = Path(__file__).resolve().parents[1]
FIXTURE_PATH = ROOT / "tests" / "fixtures" / "ar_ac1_golden_matches.json"


def projection_hash(value):
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return sha256(payload.encode("utf-8")).hexdigest()


fixture_document = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
assert fixture_document["schemaVersion"] == 1, fixture_document
assert fixture_document["projectionVersion"] == "AR-AC1-GOLDEN-2", fixture_document
assert [item["id"] for item in fixture_document["matches"]] == [
    "GOLDEN-001", "GOLDEN-002", "GOLDEN-003", "GOLDEN-004-3P", "GOLDEN-005-4P"
], fixture_document

page_errors = []
console_errors = []
results = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(**chromium_launch_options())
    page = browser.new_page(viewport={"width": 1366, "height": 900})
    page.set_default_timeout(120000)
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

    index = (ROOT / "index.html").read_text(encoding="utf-8")
    scripts = re.findall(r'<script\s+src="([^"]+)"\s*></script>', index)
    html = re.sub(r'<script\s+src="[^"]+"\s*></script>', "", index)
    html = re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>', "", html)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css" / "style.css"))
    for relative_path in scripts:
        page.add_script_tag(path=str(ROOT / relative_path))

    page.wait_for_function(
        "typeof newGame === 'function' && typeof runBotTurn === 'function' "
        "&& typeof countControlledPS === 'function' && typeof initializeMatchTelemetry === 'function'"
    )
    page.evaluate("""() => {
      const splash = document.getElementById('appSplash');
      if (splash) { splash.style.display = 'none'; splash.style.pointerEvents = 'none'; }
      window.__arGoldenNativeSetTimeout = window.setTimeout.bind(window);
      window.setTimeout = (callback, _delay, ...args) => window.__arGoldenNativeSetTimeout(callback, 0, ...args);
    }""")

    for fixture in fixture_document["matches"]:
        runs = []
        for _repeat in range(2):
            projection = page.evaluate("""async fixture => {
              const initiative = document.getElementById('initiativeMode');
              if (initiative) initiative.value = '1';
              const playerIds = Object.keys(fixture.factions).map(Number).sort((a,b) => a-b);
              const modes = Object.fromEntries(playerIds.map(side => [side, 'human']));
              const selectedDecks = Object.fromEntries(playerIds.map(side => [side, {
                mode:'custom', savedKey:fixture.decks[String(side)]
              }]));
              newGame({
                mapId:fixture.mapId,
                factions:fixture.factions,
                selectedCommanders:fixture.commanders,
                selectedDecks,
                modes,
                autoResignEnabled:false,
                tutorialMode:false,
                mapLabMode:false,
                aiMode:'advanced',
                pacePreset:'standard',
                gameScaleMode:'large_scale',
                matchSeed:fixture.seed
              });

              for (let step = 0; step < fixture.actionTurns && !state.winner; step += 1) {
                const side = Number(state.currentPlayer);
                state.playerIds.forEach(id => { state.modes[id] = 'human'; });
                state.modes[side] = 'bot';
                await runBotTurn({ skipInitialRender:true });
                state.playerIds.forEach(id => { state.modes[id] = 'human'; });
              }

              const cardIds = cards => (cards || []).map(card => String(card.id || card.cardId || ''));
              const eventCounts = {};
              for (const event of state.events || []) {
                const type = String(event && event.type || 'unknown');
                // Diagnostic copy varies with one-time browser/UI initialization and
                // is not authoritative gameplay state.
                if (type === 'LOG_MESSAGE') continue;
                eventCounts[type] = (eventCounts[type] || 0) + 1;
              }
              const bySide = mapper => Object.fromEntries(state.playerIds.map(side => [side, mapper(side)]));
              const telemetryPlayers = state.matchTelemetry && state.matchTelemetry.players || {};

              return {
                projectionVersion:'AR-AC1-GOLDEN-2',
                id:fixture.id,
                setup:{
                  seed:state.matchSeed,
                  mapId:state.mapId,
                  playerIds:[...state.playerIds],
                  factions:{...state.factions},
                  commanders:{...state.selectedCommanders},
                  decks:Object.fromEntries(state.playerIds.map(side => [side, fixture.decks[String(side)]])),
                  aiMode:state.aiMode,
                  pacePreset:state.pacePreset,
                  gameScaleMode:state.gameScaleMode,
                  actionTurns:fixture.actionTurns
                },
                outcome:{
                  winner:state.winner,
                  round:state.turn,
                  currentPlayer:state.currentPlayer,
                  energy:bySide(side => state.energy[side]),
                  pressure:bySide(side => state.pressure[side]),
                  controlledPs:bySide(side => countControlledPS(side))
                },
                units:(state.units || []).map(unit => ({
                  uid:String(unit.uid || ''),
                  blueprintId:String(unit.blueprintId || unit.id || ''),
                  side:Number(unit.side),
                  type:String(unit.type || ''),
                  pos:Array.isArray(unit.pos) ? [...unit.pos] : null,
                  hp:Number(unit.currentHp || 0),
                  def:Number(unit.currentDef || 0),
                  alive:unit.alive !== false,
                  acted:unit.acted === true
                })).sort((a,b) => a.uid.localeCompare(b.uid)),
                strategicControl:(state.cells || []).filter(cell => cell.ps).map(cell => ({
                  coord:[...cell.coord], control:cell.control == null ? null : Number(cell.control)
                })).sort((a,b) => a.coord.join(',').localeCompare(b.coord.join(','))),
                cards:bySide(side => ({
                  hand:cardIds(state.hand[side]),
                  deckCount:(state.deck[side] || []).length,
                  deckTop:cardIds((state.deck[side] || []).slice(0, 8)),
                  discard:cardIds(state.discard[side]),
                  starters:Object.keys(state.starterCards[side] || {}).sort()
                })),
                lifecycle:(state.players || []).map(player => ({
                  id:Number(player.id),
                  eliminated:player.eliminated === true,
                  status:String(player.lifecycleStatus || ''),
                  eliminatedBy:player.eliminatedBy == null ? null : Number(player.eliminatedBy),
                  reason:player.eliminationReason || null
                })).sort((a,b) => a.id-b.id),
                telemetry:{
                  rng:{
                    algorithm:state.matchTelemetry.rng.algorithm,
                    seed:state.matchTelemetry.rng.seed,
                    calls:state.matchTelemetry.rng.calls
                  },
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
                  eventCounts:Object.fromEntries(Object.entries(eventCounts).sort(([a],[b]) => a.localeCompare(b)))
                }
              };
            }""", fixture)
            runs.append({"hash": projection_hash(projection), "projection": projection})

        assert runs[0]["hash"] == runs[1]["hash"], {
            "id": fixture["id"], "first": runs[0], "repeat": runs[1]
        }
        stable_projection = runs[0]["projection"]
        telemetry_players = stable_projection["telemetry"]["players"].values()
        coverage = {
            "round": stable_projection["outcome"]["round"],
            "winner": stable_projection["outcome"]["winner"],
            "unitCount": len(stable_projection["units"]),
            "controlledPs": sum(1 for value in stable_projection["outcome"]["controlledPs"].values() if value),
            "pressure": sum(stable_projection["outcome"]["pressure"].values()),
            "attacks": sum(player["combat"]["attacks"] for player in telemetry_players),
            "damage": sum(player["combat"]["damage"] for player in stable_projection["telemetry"]["players"].values()),
            "eliminated": sum(1 for player in stable_projection["lifecycle"] if player["eliminated"]),
            "eventTypes": list(stable_projection["telemetry"]["eventCounts"].keys())
        }
        results.append({
            "id": fixture["id"],
            "expected": fixture["expectedProjectionHash"],
            "actual": runs[0]["hash"],
            "projection": stable_projection,
            "coverage": coverage
        })

    browser.close()

assert page_errors == [], page_errors
assert console_errors == [], console_errors

mismatches = [item for item in results if item["expected"] != item["actual"]]
if mismatches:
    mismatch_summary = [
        {"id": item["id"], "expected": item["expected"], "actual": item["actual"], "coverage": item["coverage"]}
        for item in mismatches
    ]
    print(json.dumps({"status": "SNAPSHOT_REQUIRED", "mismatches": mismatch_summary}, ensure_ascii=False, indent=2))
    raise AssertionError(mismatch_summary)

print(json.dumps({
    "status": "PASS",
    "projectionVersion": fixture_document["projectionVersion"],
    "matches": [{"id": item["id"], "hash": item["actual"], "coverage": item["coverage"]} for item in results],
    "repeatRunsIdentical": True,
    "pageErrors": len(page_errors),
    "consoleErrors": len(console_errors)
}, ensure_ascii=False, indent=2))
