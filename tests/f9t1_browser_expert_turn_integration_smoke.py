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
    page = browser.new_page(viewport={"width": 1366, "height": 900})
    page.set_default_timeout(120000)
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

    page.wait_for_function("typeof newGame === 'function' && typeof runBotTurn === 'function' && typeof expertBeginTurnF9T1 === 'function'")
    result = page.evaluate("""async () => {
      const splash = document.getElementById('appSplash');
      if (splash) { splash.style.display = 'none'; splash.style.pointerEvents = 'none'; }
      const initiative = document.getElementById('initiativeMode');
      if (initiative) initiative.value = 'p1';
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
        aiMode:'expert',
        pacePreset:'standard',
        gameScaleMode:'large_scale',
        matchSeed:'F9T1-TURN-INTEGRATION-SEED'
      });
      state.currentPlayer = 1;
      state.modes[1] = 'bot';
      state.modes[2] = 'human';
      await runBotTurn({skipInitialRender:true});
      const expert = state.matchTelemetry.expertAi;
      const turn = expert.turns.find(entry => entry.side === 1) || null;
      return {
        currentPlayer:state.currentPlayer,
        aiMode:state.aiMode,
        activeSessions:Object.keys(expertRuntimeStateF9T1.activeByPlayer).length,
        botRunning:Boolean(botRunning),
        totals:JSON.parse(JSON.stringify(expert.totals)),
        module:JSON.parse(JSON.stringify(expert.modules.Nexus)),
        turn:turn ? JSON.parse(JSON.stringify(turn)) : null,
        persistent:JSON.parse(JSON.stringify(state.expertAiF9T1)),
        logTail:(state.log || []).slice(-8).map(entry => typeof entry === 'string' ? entry : entry.message)
      };
    }""")
    browser.close()

assert result['aiMode'] == 'expert', result
assert result['activeSessions'] == 0 and result['botRunning'] is False, result
assert result['totals']['turnsStarted'] == 1, result
assert result['totals']['contextsCreated'] == 1, result
assert result['totals']['modulesRouted'] == 1, result
assert result['totals']['fallbacks'] == 1, result
assert result['totals']['turnsCompleted'] == 1, result
assert result['module']['turnsRouted'] == 1 and result['module']['fallbacks'] == 1, result
assert result['turn'] is not None and result['turn']['status'] == 'completed', result
assert result['turn']['moduleId'] == 'expert-nexus-f9t1', result
assert result['turn']['invokedModules'] == 1, result
assert result['turn']['fallback']['target'] == 'advanced_f9t0', result
assert result['persistent']['lastTurn']['moduleId'] == 'expert-nexus-f9t1', result
assert errors == [], errors
assert console_errors == [], console_errors

print(json.dumps({
    'status':'PASS',
    'currentPlayerAfterTurn':result['currentPlayer'],
    'module':result['turn']['moduleId'],
    'invokedModules':result['turn']['invokedModules'],
    'fallback':result['turn']['fallback']['target'],
    'decisionCount':result['turn'].get('decisionCount', 0),
    'guardIterations':result['turn'].get('guardIterations', 0),
    'activeSessions':result['activeSessions'],
    'pageErrors':len(errors),
    'consoleErrors':len(console_errors)
}, ensure_ascii=False, indent=2))
