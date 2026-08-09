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
    page.set_default_timeout(10000)
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

    page.wait_for_function(
        "typeof newGame === 'function' && typeof expertBeginTurnF9T1 === 'function' "
        "&& typeof telemetryEnsureExpertAiF9T1 === 'function' && typeof BUILTIN_DECKS !== 'undefined'"
    )

    setup = page.evaluate("""() => {
      const splash = document.getElementById('appSplash');
      if (splash) { splash.style.display = 'none'; splash.style.pointerEvents = 'none'; }
      const expertOption = Array.from(document.querySelectorAll('#setupBotAiMode option, #botAiMode option')).find(option => option.value === 'expert');
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
        matchSeed:'F9T1-BROWSER-SMOKE-SEED'
      });
      return {
        build:BUILD_INFO.version,
        baseline:BUILD_INFO.logicBaseline,
        expertOption:Boolean(expertOption),
        expertLabel:expertOption ? expertOption.textContent.trim() : '',
        aiMode:state.aiMode,
        telemetrySchema:state.matchTelemetry.schemaVersion,
        expertSchema:state.matchTelemetry.expertAi.schemaVersion,
        recursiveSearch:state.matchTelemetry.expertAi.architecture.recursiveSearch,
        singleFactionRouter:state.matchTelemetry.expertAi.architecture.singleFactionRouter,
        commonContracts:state.matchTelemetry.expertAi.strategyCommonContract.slice()
      };
    }""")

    result = page.evaluate("""() => {
      const side = 1;
      state.modes[side] = 'bot';
      const first = expertBeginTurnF9T1(side);
      const second = expertBeginTurnF9T1(side);
      const before = {
        unitId:'browser-smoke-unit', unitName:'Browser Smoke', type:'Fanteria',
        position:[0,0,0], acted:false, alive:true, energy:5
      };
      const after = {
        unitId:'browser-smoke-unit', unitName:'Browser Smoke', type:'Fanteria',
        position:[1,-1,0], acted:true, alive:true, energy:5
      };
      expertRecordDecisionF9T1(side, before, after, {kind:'browser_smoke', source:'advanced_f9t0'});
      const sequence = first.sequence;
      const contextSnapshot = {
        faction:first.context.faction,
        movementMultiplier:first.context.movementMultiplier,
        contracts:[
          first.context.common.adaptiveEnemyProximity.contract,
          first.context.common.hqStructureProtection.contract,
          first.context.common.psStructures.contract,
          first.context.common.hqOccupationRisk.contract
        ],
        hqRisk:first.context.common.hqOccupationRisk.risk,
        hqProtected:first.context.common.hqStructureProtection.protected,
        psTotal:first.context.common.psStructures.totalPs
      };
      const routeSnapshot = {
        moduleId:first.module.moduleId,
        invokedModules:first.module.invokedModules,
        status:first.module.result.status,
        reason:first.module.result.reason,
        fallbackUsed:first.fallbackUsed
      };
      const sameSession = first === second && first.sequence === second.sequence;
      const summary = expertCompleteTurnF9T1(side, {reason:'browser_smoke'});
      const expert = state.matchTelemetry.expertAi;
      const turn = expert.turns.find(entry => Number(entry.side) === side && Number(entry.sequence) === sequence);
      return {
        sameSession,
        context:contextSnapshot,
        route:routeSnapshot,
        summary,
        activeSessionCount:Object.keys(expertRuntimeStateF9T1.activeByPlayer).length,
        telemetry:{
          enabled:expert.enabled,
          totals:JSON.parse(JSON.stringify(expert.totals)),
          module:JSON.parse(JSON.stringify(expert.modules.Nexus)),
          turn:turn ? JSON.parse(JSON.stringify(turn)) : null
        },
        persistent:JSON.parse(JSON.stringify(state.expertAiF9T1))
      };
    }""")

    browser.close()

assert setup['build'] == 'C2-STABLE-1-F9T2d3-APK-M4c', setup
assert setup['baseline'] == 'C2-STABLE-1-F9T2c3a-APK-M4c', setup
assert setup['expertOption'] and 'Expert F9T2c' in setup['expertLabel'], setup
assert setup['aiMode'] == 'expert', setup
assert setup['telemetrySchema'] == 'F9Q3e1-2', setup
assert setup['expertSchema'] == 'F9T1-1', setup
assert setup['recursiveSearch'] is False and setup['singleFactionRouter'] is True, setup
assert setup['commonContracts'] == [
    'adaptive_enemy_proximity',
    'hq_structure_protection',
    'structures_on_strategic_points',
    'hq_cell_occupation_risk'
], setup

assert result['sameSession'], result
assert result['context']['faction'] == 'Nexus', result
assert result['context']['movementMultiplier'] >= 1, result
assert result['context']['contracts'] == setup['commonContracts'], result
assert result['context']['psTotal'] >= 1, result
assert result['route']['moduleId'] == 'expert-nexus-f9t1', result
assert result['route']['invokedModules'] == 1, result
assert result['route']['status'] == 'architecture_only', result
assert result['route']['reason'] == 'no_expert_doctrine_in_f9t1', result
assert result['route']['fallbackUsed'], result
assert result['summary']['fallbackUsed'] and result['summary']['decisionCount'] == 1, result
assert result['summary']['reason'] == 'browser_smoke', result
assert result['activeSessionCount'] == 0, result
assert result['telemetry']['enabled'], result
assert result['telemetry']['totals']['turnsStarted'] == 1, result
assert result['telemetry']['totals']['contextsCreated'] == 1, result
assert result['telemetry']['totals']['modulesRouted'] == 1, result
assert result['telemetry']['totals']['fallbacks'] == 1, result
assert result['telemetry']['totals']['turnsCompleted'] == 1, result
assert result['telemetry']['totals']['decisionsRecorded'] == 1, result
assert result['telemetry']['module']['turnsRouted'] == 1, result
assert result['telemetry']['module']['fallbacks'] == 1, result
assert result['telemetry']['turn']['invokedModules'] == 1, result
assert result['telemetry']['turn']['fallback']['target'] == 'advanced_f9t0', result
assert result['telemetry']['turn']['status'] == 'completed', result
assert len(result['telemetry']['turn']['decisions']) == 1, result
assert result['persistent']['schemaVersion'] == 'F9T1-1', result
assert result['persistent']['lastTurn']['sequence'] == result['summary']['sequence'], result
assert errors == [], errors
assert console_errors == [], console_errors

print(json.dumps({
    'status':'PASS',
    'build':setup['build'],
    'baseline':setup['baseline'],
    'module':result['route']['moduleId'],
    'invokedModules':result['route']['invokedModules'],
    'fallback':result['telemetry']['turn']['fallback']['target'],
    'contracts':setup['commonContracts'],
    'telemetryTotals':result['telemetry']['totals'],
    'pageErrors':len(errors),
    'consoleErrors':len(console_errors)
}, ensure_ascii=False, indent=2))
