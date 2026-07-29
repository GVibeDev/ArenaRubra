from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import re

ROOT = Path(__file__).resolve().parents[1]
errors = []
console_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        executable_path="/usr/bin/chromium",
        args=["--no-sandbox", "--allow-file-access-from-files"],
    )
    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    page = context.new_page()
    page.set_default_timeout(8000)
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

    index = (ROOT / "index.html").read_text(encoding="utf-8")
    scripts = re.findall(r'<script\s+src="([^"]+)"\s*></script>', index)
    html = re.sub(r'<script\s+src="[^"]+"\s*></script>', '', index)
    html = re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>', '', html)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    for rel in scripts:
        page.add_script_tag(path=str(ROOT / rel))

    page.wait_for_function("typeof newGame === 'function' && typeof initializeMatchTelemetry === 'function' && typeof BUILTIN_DECKS !== 'undefined'")
    page.evaluate("""() => {
      const splash = document.getElementById('appSplash');
      if (splash) { splash.style.display = 'none'; splash.style.pointerEvents = 'none'; }
      document.getElementById('initiativeMode').value = 'random';
      newGame({
        mapId:'map1_starter',
        factions:{1:'Nexus',2:'Exordium'},
        selectedCommanders:{1:'NXCMD01',2:'EX0B00'},
        selectedDecks:{
          1:{mode:'custom',savedKey:'Nexus::NXCMD01::bastione-mobile'},
          2:{mode:'custom',savedKey:'Exordium::EX0B00::doppio-assalto-imperiale'}
        },
        modes:{1:'human',2:'human'},
        autoResignEnabled:false,
        aiMode:'advanced',
        pacePreset:'standard',
        gameScaleMode:'large_scale',
        matchSeed:'F9Q3E1-SMOKE-SEED'
      });
    }""")
    page.wait_for_timeout(250)

    initial = page.evaluate("""() => ({
      build:BUILD_INFO.version,
      schema:state.matchTelemetry.schemaVersion,
      status:state.matchTelemetry.status,
      seed:state.matchTelemetry.rng.seed,
      rngAlgorithm:state.matchTelemetry.rng.algorithm,
      firstPlayer:state.currentPlayer,
      deck1:state.matchTelemetry.players[1].deck,
      deck2:state.matchTelemetry.players[2].deck,
      turnReadyHooks:state.matchTelemetry.diagnostics.turnReadyHooks,
      activeTurn:state.matchTelemetryRuntime.activeTurns[state.currentPlayer],
      telemetryPanel:Boolean(document.getElementById('matchTelemetryPanel')),
      copyButton:Boolean(document.getElementById('copyMatchTelemetryJsonBtn')),
      hand1:state.hand[1].map(card => card.id),
      deckTop1:state.deck[1].slice(0,6).map(card => card.id),
      precheck:runPrecheck({quiet:true,source:'f9q3e1-browser-smoke'})
    })""")

    page.evaluate("""() => {
      const side = state.currentPlayer;
      emitGameEvent({type:EventTypes.ECONOMY_CHANGED,data:{player:side,gain:5,source:'F9Q3e1 smoke card'}});
      emitGameEvent({type:EventTypes.CARD_PLAYED,data:{player:side,cardId:'TACTIC:SMOKE',cardName:'Carta Smoke',sourceType:'tactic'}});
      emitGameEvent({type:EventTypes.UNIT_SPAWNED,data:{player:side,blueprintId:state.matchTelemetry.players[side].deck.pivotId,unitId:'pivot_smoke',unitName:state.matchTelemetry.players[side].deck.pivotName,cost:5}});
      emitGameEvent({type:EventTypes.UNIT_DAMAGED,data:{sourceSide:side,targetSide:side===1?2:1,sourceBlueprintId:state.matchTelemetry.players[side].deck.pivotId,defLoss:1,hpLoss:2}});
      emitGameEvent({type:EventTypes.MISSION_PROGRESS_CHANGED,data:{player:side,missionId:'SMOKE_MISSION',objectiveId:'o1',metric:'smoke',current:1,target:1,satisfied:true,completed:true}});
      emitGameEvent({type:EventTypes.MISSION_READY,data:{player:side,missionId:'SMOKE_MISSION',missionName:'Smoke Mission',cycle:1}});
      endTurn();
    }""")
    page.wait_for_timeout(150)

    mid = page.evaluate("""() => {
      const playedSide = state.turnOrder[0];
      const p = state.matchTelemetry.players[playedSide];
      return {
        playedSide,
        turns:p.turns,
        economy:p.economy,
        cards:p.cards,
        field:p.field,
        combat:p.combat,
        mission:p.mission,
        currentPlayer:state.currentPlayer,
        activeTurn:Boolean(state.matchTelemetryRuntime.activeTurns[state.currentPlayer]),
        panelText:document.getElementById('matchTelemetryPanel').textContent
      };
    }""")

    page.evaluate("""() => setWinner('Vittoria smoke telemetria.', {winner:1,type:'test_telemetry'})""")
    page.wait_for_timeout(150)

    final = page.evaluate("""() => {
      const history = arenaStorageReadMatchHistory();
      return {
        status:state.matchTelemetry.status,
        final:state.matchTelemetry.final,
        durationMs:state.matchTelemetry.durationMs,
        jsonSchema:JSON.parse(currentMatchTelemetryJson()).schemaVersion,
        historyCount:history.length,
        historyHasTelemetry:Boolean(history[0] && history[0].matchTelemetry),
        historySchema:history[0] && history[0].matchTelemetry ? history[0].matchTelemetry.schemaVersion : null,
        rngCalls:state.matchTelemetry.rng.calls
      };
    }""")

    # Recreate the same match seed and verify deterministic initiative/deck order.
    page.evaluate("""() => {
      document.getElementById('initiativeMode').value = 'random';
      newGame({
        mapId:'map1_starter',
        factions:{1:'Nexus',2:'Exordium'},
        selectedCommanders:{1:'NXCMD01',2:'EX0B00'},
        selectedDecks:{
          1:{mode:'custom',savedKey:'Nexus::NXCMD01::bastione-mobile'},
          2:{mode:'custom',savedKey:'Exordium::EX0B00::doppio-assalto-imperiale'}
        },
        modes:{1:'human',2:'human'},
        autoResignEnabled:false,
        aiMode:'advanced',
        pacePreset:'standard',
        gameScaleMode:'large_scale',
        matchSeed:'F9Q3E1-SMOKE-SEED'
      });
    }""")
    page.wait_for_timeout(120)
    repeat = page.evaluate("""() => ({
      firstPlayer:state.currentPlayer,
      hand1:state.hand[1].map(card => card.id),
      deckTop1:state.deck[1].slice(0,6).map(card => card.id),
      seed:state.matchTelemetry.rng.seed
    })""")

    browser.close()

assert initial["build"] == "C2-STABLE-1-F9U2b-APK-M4c", initial
assert initial["schema"] == "F9Q3e1-2", initial
assert initial["status"] == "active", initial
assert initial["seed"] == "F9Q3E1-SMOKE-SEED", initial
assert initial["rngAlgorithm"] == "mulberry32", initial
assert initial["deck1"]["name"] == "Bastione Mobile" and initial["deck1"]["cardCount"] == 30, initial
assert initial["deck2"]["name"] == "Doppio Assalto Imperiale" and initial["deck2"]["cardCount"] == 30, initial
assert initial["turnReadyHooks"] >= 1 and initial["activeTurn"], initial
assert initial["telemetryPanel"] and initial["copyButton"], initial
assert initial["precheck"]["ok"] and not initial["precheck"]["problems"] and not initial["precheck"]["warnings"], initial

assert len(mid["turns"]) == 1, mid
assert mid["turns"][0]["cardsPlayed"] == 1 and not mid["turns"][0]["noCardPlayed"], mid
assert mid["economy"]["gainedTotal"] >= 5, mid
assert mid["cards"]["played"] >= 1, mid
assert mid["field"]["pivotDeployedRound"] is not None, mid
assert mid["combat"]["damageDealt"] >= 3, mid
assert mid["mission"]["readyRound"] is not None, mid
assert mid["activeTurn"], mid
assert "F9Q3e1-2" in mid["panelText"], mid

assert final["status"] == "complete", final
assert final["final"]["winnerSide"] == 1 and final["final"]["winType"] == "test_telemetry", final
assert final["durationMs"] >= 0, final
assert final["jsonSchema"] == "F9Q3e1-2", final
assert final["historyCount"] >= 1 and final["historyHasTelemetry"], final
assert final["historySchema"] == "F9Q3e1-2", final
assert final["rngCalls"] > 0, final

assert repeat["firstPlayer"] == initial["firstPlayer"], (initial, repeat)
assert repeat["hand1"] == initial["hand1"], (initial, repeat)
assert repeat["deckTop1"] == initial["deckTop1"], (initial, repeat)
assert repeat["seed"] == initial["seed"], (initial, repeat)
assert not errors, errors
assert not console_errors, console_errors

print(json.dumps({
    "ok": True,
    "initial": initial,
    "mid": mid,
    "final": final,
    "repeat": repeat,
    "pageErrors": errors,
    "consoleErrors": console_errors,
}, ensure_ascii=False, indent=2))
