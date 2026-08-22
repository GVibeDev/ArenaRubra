from browser_runtime import chromium_launch_options
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, re

ROOT = Path(__file__).resolve().parents[1]
index = (ROOT / "index.html").read_text(encoding="utf-8")
scripts = re.findall(r'<script\s+src="([^"]+)"\s*></script>', index)
html = re.sub(r'<script\s+src="[^"]+"\s*></script>', '', index)
html = re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>', '', html)
page_errors = []
console_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(**chromium_launch_options())
    page = browser.new_page(viewport={"width": 1365, "height": 900})
    page.set_default_timeout(7000)
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    calibration = ROOT / "css/renderer_calibration_lab.css"
    if calibration.exists(): page.add_style_tag(path=str(calibration))
    for rel in scripts: page.add_script_tag(path=str(ROOT / rel))
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.evaluate("""() => {
      const splash=document.getElementById('appSplash');
      if(splash){ splash.hidden=true; splash.style.display='none'; splash.setAttribute('aria-hidden','true'); }
      const lessons={};
      for (const item of TUTORIAL_LESSON_PLAN_F9O6) lessons[item.id]={completed:true,scenarioId:item.scenarioId};
      tutorialRuntimeStorageWrite({schemaVersion:1,scenarios:{},lessons,challenges:{},updatedAt:new Date().toISOString()});
      tutorialRuntimeRenderMenu();
    }""")

    assert page.evaluate("BUILD_INFO.version") == "C2-STABLE-1-F9V2e-APK-M4c"
    assert page.evaluate("tutorialRuntimeStartChallenge('challenge-1-elimination')") is True
    page.wait_for_timeout(400)

    initial = page.evaluate("""() => ({
      screen:document.body.dataset.appScreen,
      diag:tutorialRuntimeChallengeDiagnostics(),
      playerUnits:state.units.filter(u=>u&&u.alive&&u.type!=='QG'&&u.side===1).map(u=>({id:u.id,uid:u.uid,acted:u.acted})),
      enemyUnits:state.units.filter(u=>u&&u.alive&&u.type!=='QG'&&u.side===2).map(u=>({id:u.id,uid:u.uid,acted:u.acted,wave:u.tutorialChallengeWave})),
      hand:{1:state.hand[1].length,2:state.hand[2].length},
      deck:{1:state.deck[1].length,2:state.deck[2].length},
      starters:{1:Object.keys(state.starterCards[1]||{}).length,2:Object.keys(state.starterCards[2]||{}).length},
      energy:{1:state.energy[1],2:state.energy[2]},
      tutorialMode:state.tutorialMode,
      challengeMode:state.tutorialChallengeMode,
      matchRecorded:state.matchRecorded,
      hud:document.getElementById('tutorialChallengeHud')?.textContent || ''
    })""")

    assert initial["screen"] == "game", initial
    assert initial["diag"]["active"] and initial["diag"]["wave"] == 1, initial
    assert initial["diag"]["enemyDestroyed"] == 0 and initial["diag"]["enemiesSpawned"] == 2, initial
    assert len(initial["playerUnits"]) == 4, initial
    assert sorted(u["id"] for u in initial["enemyUnits"]) == ["NX2B01", "NX3B01"], initial
    assert initial["hand"] == {"1":0,"2":0} or initial["hand"] == {1:0,2:0}, initial
    assert initial["deck"] == {"1":0,"2":0} or initial["deck"] == {1:0,2:0}, initial
    assert initial["starters"] == {"1":0,"2":0} or initial["starters"] == {1:0,2:0}, initial
    assert initial["energy"] == {"1":0,"2":0} or initial["energy"] == {1:0,2:0}, initial
    assert initial["tutorialMode"] and initial["challengeMode"] and initial["matchRecorded"] is False, initial
    assert "0/4" in initial["hud"] and "1/2" in initial["hud"], initial

    # F9V2b: l'ENE viene azzerata ad ogni turno, così né giocatore né bot possono comprare/giocare tattiche.
    energy_lock = page.evaluate("""() => {
      state.energy[2]=9;
      emitGameEvent({type:EventTypes.TURN_STARTED,data:{player:2,faction:state.factions[2],round:state.turn}});
      return state.energy[2];
    }""")
    assert energy_lock == 0, energy_lock

    # Un turno reale del Bot deve usare soltanto le due unità dell'ondata: nessun acquisto/card play.
    page.evaluate("endTurn()")
    page.wait_for_function("state && state.currentPlayer === 1 && !botRunning", timeout=12000)
    page.wait_for_timeout(200)
    bot_turn = page.evaluate("""() => ({
      side2Alive:state.units.filter(u=>u&&u.alive&&u.type!=='QG'&&u.side===2).map(u=>({id:u.id,uid:u.uid})),
      side2All:state.units.filter(u=>u&&u.type!=='QG'&&u.side===2).map(u=>u.id),
      hand:state.hand[2].length,
      deck:state.deck[2].length,
      energy:state.energy[2],
      diag:tutorialRuntimeChallengeDiagnostics()
    })""")
    assert len(bot_turn["side2Alive"]) == 2, bot_turn
    assert sorted(bot_turn["side2All"]) == ["NX2B01", "NX3B01"], bot_turn
    assert bot_turn["hand"] == 0 and bot_turn["deck"] == 0 and bot_turn["energy"] == 0, bot_turn
    assert bot_turn["diag"]["active"] is True and bot_turn["diag"]["enemyDestroyed"] == 0, bot_turn

    # Distrugge la prima ondata attraverso il vero damage/event pipeline.
    page.evaluate("""() => {
      const enemies=state.units.filter(u=>u&&u.alive&&u.type!=='QG'&&u.side===2&&u.tutorialChallengeWave===1);
      for (const unit of enemies) applyDamage(unit,99,'F9V2b smoke',{directHp:true,sourceSide:1});
    }""")
    page.wait_for_timeout(350)

    wave2 = page.evaluate("""() => ({
      diag:tutorialRuntimeChallengeDiagnostics(),
      enemyUnits:state.units.filter(u=>u&&u.alive&&u.type!=='QG'&&u.side===2).map(u=>({id:u.id,wave:u.tutorialChallengeWave})),
      hud:document.getElementById('tutorialChallengeHud')?.textContent || ''
    })""")
    assert wave2["diag"]["active"] and wave2["diag"]["wave"] == 2, wave2
    assert wave2["diag"]["enemyDestroyed"] == 2 and wave2["diag"]["enemiesSpawned"] == 4, wave2
    assert len(wave2["enemyUnits"]) == 2 and all(u["wave"] == 2 for u in wave2["enemyUnits"]), wave2
    assert "2/4" in wave2["hud"] and "2/2" in wave2["hud"], wave2

    page.evaluate("""() => {
      const enemies=state.units.filter(u=>u&&u.alive&&u.type!=='QG'&&u.side===2&&u.tutorialChallengeWave===2);
      for (const unit of enemies) applyDamage(unit,99,'F9V2b smoke',{directHp:true,sourceSide:1});
    }""")
    page.wait_for_timeout(500)

    final = page.evaluate("""() => ({
      screen:document.body.dataset.appScreen,
      diag:tutorialRuntimeChallengeDiagnostics(),
      progress:tutorialRuntimeProgressForChallenge('challenge-1-elimination'),
      matchRecorded:state.matchRecorded,
      hudExists:Boolean(document.getElementById('tutorialChallengeHud')),
      cardText:document.querySelector('[data-tutorial-challenge="challenge-1-elimination"]')?.innerText || '',
      buttonText:document.querySelector('[data-tutorial-challenge="challenge-1-elimination"] [data-tutorial-challenge-start]')?.textContent.trim() || ''
    })""")

    browser.close()

unexpected = [msg for msg in console_errors if not msg.startswith("Arena AppShell: inizializzazione GameScreen non bloccante fallita")]
assert final["screen"] == "tutorial", final
assert final["diag"]["active"] is False, final
assert final["progress"]["completed"] is True and final["progress"]["attempts"] == 1, final
assert final["progress"]["lastOutcome"] == "success" and final["progress"]["lastReason"] == "all_enemy_units_destroyed", final
assert final["matchRecorded"] is False, final
assert final["hudExists"] is False, final
assert "Completata" in final["cardText"] and final["buttonText"] == "Ripeti", final
assert not page_errors, page_errors
assert not unexpected, unexpected

print(json.dumps({
    "ok":True,
    "build":"C2-STABLE-1-F9V2e-APK-M4c",
    "initialPlayerUnits":len(initial["playerUnits"]),
    "wave1Enemies":2,
    "botAutonomyNoPurchases":True,
    "wave2Enemies":len(wave2["enemyUnits"]),
    "enemyDestroyed":4,
    "challengeCompleted":final["progress"]["completed"],
    "competitiveRecordWritten":final["matchRecorded"],
    "pageErrors":page_errors,
    "consoleErrors":unexpected
}, ensure_ascii=False, indent=2))
