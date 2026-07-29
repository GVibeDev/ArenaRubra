from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import re

ROOT = Path(__file__).resolve().parents[1]
page_errors = []
console_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox", "--allow-file-access-from-files"])
    context = browser.new_context(viewport={"width": 1365, "height": 900})
    page = context.new_page()
    page.set_default_timeout(8000)
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

    index = (ROOT / "index.html").read_text(encoding="utf-8")
    scripts = re.findall(r'<script\s+src="([^"]+)"\s*></script>', index)
    html = re.sub(r'<script\s+src="[^"]+"\s*></script>', '', index)
    html = re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>', '', html)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    for rel in scripts:
        page.add_script_tag(path=str(ROOT / rel))

    page.wait_for_function("typeof newGame === 'function' && typeof emitGameEvent === 'function'")
    result = page.evaluate("""() => {
      const splash = document.getElementById('appSplash');
      if (splash) { splash.style.display='none'; splash.style.pointerEvents='none'; }
      newGame({
        mapId:'map1_starter',
        factions:{1:'Nexus',2:'Exordium'},
        selectedCommanders:{1:'NXCMD01',2:'EX0B00'},
        selectedDecks:{
          1:{mode:'custom',savedKey:'Nexus::NXCMD01::bastione-mobile'},
          2:{mode:'custom',savedKey:'Exordium::EX0B00::doppio-assalto-imperiale'}
        },
        modes:{1:'human',2:'human'}, autoResignEnabled:false, aiMode:'advanced', pacePreset:'standard',
        gameScaleMode:'large_scale', matchSeed:'F9Q3E1A-HOTFIX-SMOKE'
      });
      const pivotId = state.matchTelemetry.players[1].deck.pivotId;
      const pivotName = state.matchTelemetry.players[1].deck.pivotName;

      emitGameEvent({type:EventTypes.PS_CONTROL_CHANGED,data:{coord:[0,0,0],previousControl:null,nextControl:1,round:2}});
      emitGameEvent({type:EventTypes.PS_CONTROL_CHANGED,data:{coord:[1,-1,0],previousControl:null,nextControl:2,round:2}});
      emitGameEvent({type:EventTypes.PS_CONTROL_CHANGED,data:{coord:[1,-1,0],previousControl:2,nextControl:1,round:3}});

      state.turn = 21;
      const first = {uid:pivotId+'_1_99',id:pivotId,instanceNo:99,name:pivotName,side:1,alive:true};
      state.units.push(first);
      emitGameEvent({type:EventTypes.UNIT_SPAWNED,data:{player:1,unitId:first.uid,unitName:first.name,blueprintId:pivotId,instanceNo:first.instanceNo,cost:5,spawnSource:'smoke'}});
      emitGameEvent({type:EventTypes.UNIT_ATTACKED,data:{attackerSide:1,attackerId:first.uid,defenderSide:2,defenderId:'dummy'}});
      emitGameEvent({type:EventTypes.ABILITY_USED,data:{player:1,unitId:first.uid,cost:2}});
      emitGameEvent({type:EventTypes.UNIT_DAMAGED,data:{sourceSide:1,sourceUnitId:first.uid,sourceBlueprintId:pivotId,targetSide:2,defLoss:1,hpLoss:2}});
      emitGameEvent({type:EventTypes.UNIT_DESTROYED,data:{side:1,unitId:first.uid,unitName:first.name,killerSide:2,source:'smoke destroy'}});
      first.alive = false;

      state.turn = 23;
      const second = {uid:pivotId+'_1_100',id:pivotId,instanceNo:100,name:pivotName,side:1,alive:true};
      state.units.push(second);
      emitGameEvent({type:EventTypes.UNIT_SPAWNED,data:{player:1,unitId:second.uid,unitName:second.name,blueprintId:pivotId,instanceNo:second.instanceNo,cost:5,spawnSource:'smoke regeneration'}});
      emitGameEvent({type:EventTypes.UNIT_ATTACKED,data:{attackerSide:1,attackerId:second.uid,defenderSide:2,defenderId:'dummy2'}});
      emitGameEvent({type:EventTypes.UNIT_DAMAGED,data:{sourceSide:1,sourceUnitId:second.uid,sourceBlueprintId:pivotId,targetSide:2,defLoss:0,hpLoss:4}});

      emitGameEvent({type:EventTypes.CARD_DRAWN,data:{player:2,count:1,cards:[{id:'EXTST01',cardUid:'testudo-browser',overdrawDiscarded:true}]}});
      emitGameEvent({type:EventTypes.CARD_DISCARDED,data:{player:2,cardId:'EXTST01',cardUid:'testudo-browser',cardName:'Testudo',reason:'overdraw'}});

      state.turn = 26;
      finalizeMatchTelemetry({winner:1,round:26,winType:'smoke'});
      const t = currentMatchTelemetrySnapshot();
      return {
        build:BUILD_INFO.version,
        schema:t.schemaVersion,
        playerKeys:Object.keys(t.players),
        ps1:t.players[1].field,
        ps2:t.players[2].field,
        psTimeline:t.timelines.psControl,
        pivot:t.players[1].field,
        overdraw:t.players[2].cards.overdrawn,
        testudo:t.players[2].cards.byCard.EXTST01,
        panel:document.getElementById('matchTelemetryPanel').textContent,
        precheck:runPrecheck({quiet:true,source:'f9q3e1a-browser-hotfix-smoke'})
      };
    }""")
    browser.close()

assert result["build"] == "C2-STABLE-1-F9U2b-APK-M4c", result
assert result["schema"] == "F9Q3e1-2", result
assert "0" not in result["playerKeys"], result
assert result["ps1"]["psControlChanges"] == 2 and result["ps1"]["psGained"] == 2, result
assert result["ps2"]["psControlChanges"] == 2 and result["ps2"]["psGained"] == 1 and result["ps2"]["psLost"] == 1, result
assert len(result["psTimeline"]) == 3, result
assert result["pivot"]["pivotInstanceCount"] == 2, result
assert result["pivot"]["pivotDestroyedCount"] == 1 and result["pivot"]["pivotActiveCount"] == 1, result
assert result["pivot"]["pivotDestroyedRound"] == 21, result
assert result["pivot"]["pivotAttacks"] == 2 and result["pivot"]["pivotAbilitiesUsed"] == 1, result
assert result["pivot"]["pivotDamageDealt"] == 7, result
assert result["pivot"]["pivotSurvivalRounds"] == 5, result
assert result["pivot"]["pivotInstances"][0]["destroyedRound"] == 21, result
assert result["pivot"]["pivotInstances"][1]["destroyedRound"] is None, result
assert result["overdraw"] == 1 and result["testudo"]["overdrawn"] == 1, result
assert "F9Q3e1-2" in result["panel"], result
assert result["precheck"]["ok"] and not result["precheck"]["problems"] and not result["precheck"]["warnings"], result
assert not page_errors, page_errors
assert not console_errors, console_errors

print(json.dumps({"ok":True,"result":result,"pageErrors":page_errors,"consoleErrors":console_errors},ensure_ascii=False,indent=2))
