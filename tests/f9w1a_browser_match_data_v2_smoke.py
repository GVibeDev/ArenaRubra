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
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.set_default_timeout(6000)
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    calibration = ROOT / "css/renderer_calibration_lab.css"
    if calibration.exists():
        page.add_style_tag(path=str(calibration))
    for rel in scripts:
        page.add_script_tag(path=str(ROOT / rel))
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.evaluate("""() => { const splash=document.getElementById('appSplash'); if(splash){ splash.hidden=true; splash.style.display='none'; splash.setAttribute('aria-hidden','true'); } }""")
    page.wait_for_timeout(250)

    result = page.evaluate("""() => {
      const map4 = getAvailableMapDefinitions().find(def => def && Number(def.playerCount) === 4);
      if (!map4) throw new Error('Nessuna mappa 4P disponibile per F9W1a browser smoke');
      const factions = {1:'Exordium',2:'Nexus',3:'Liberti',4:'Agathoi'};
      const modes = {1:'human',2:'bot',3:'human',4:'bot'};
      const selectedCommanders = Object.fromEntries(Object.entries(factions).map(([side,faction]) => [side, defaultCommanderBlueprintIdForFaction(faction)]));
      const selectedDecks = {1:{mode:'template'},2:{mode:'template'},3:{mode:'template'},4:{mode:'template'}};
      const initiative = document.getElementById('initiativeMode');
      if (initiative) initiative.value = '1';
      newGame({mapId:map4.id, factions, modes, selectedCommanders, selectedDecks, tutorialMode:false, mapLabMode:false, aiMode:'advanced', pacePreset:'competitive', gameScaleMode:'tactical'});
      const matchId = state.matchId;
      setWinner('F9W1a browser smoke: vittoria G3 Liberti.', {winner:3, type:'concessione'});
      const historyRaw = arenaStorageReadJson('arenaRubra.matchHistory.v1', []);
      const telemetryRaw = arenaStorageReadJson('arenaRubra.matchTelemetry.v2', []);
      const history = arenaStorageReadMatchHistory();
      const record = history.find(item => item.matchId === matchId);
      const telemetry = telemetryRaw.find(item => item.matchId === matchId);
      const telemetrySource = (() => {
        const active = state;
        state = null;
        const value = controlCenterTelemetrySource();
        state = active;
        return value;
      })();
      return {
        build:BUILD_INFO.version,
        mapId:map4.id,
        matchId,
        record,
        rawRecord:historyRaw.find(item => item.matchId === matchId),
        telemetry,
        historyHtml:controlCenterHistoryHtml(),
        statsHtml:controlCenterStatisticsHtml(),
        csv:statsToCsv(),
        telemetrySource:{source:telemetrySource.source, schema:telemetrySource.telemetry && telemetrySource.telemetry.schemaVersion},
        precheck:runPrecheck({quiet:true, source:'f9w1a-browser-match-data-v2'})
      };
    }""")
    browser.close()

unexpected = [msg for msg in console_errors if not msg.startswith("Arena AppShell: inizializzazione GameScreen non bloccante fallita")]
print(json.dumps({
    "ok": True,
    "build": result["build"],
    "mapId": result["mapId"],
    "playerCount": result["record"]["playerCount"] if result["record"] else None,
    "winner": result["record"]["winnerFaction"] if result["record"] else None,
    "telemetrySchema": result["telemetry"]["schemaVersion"] if result["telemetry"] else None,
    "pageErrors": page_errors,
    "consoleErrors": unexpected
}, ensure_ascii=False, indent=2))

assert result["build"] == "C2-STABLE-1-F9W1a-APK-M4c", result
assert result["record"] and result["record"]["schemaVersion"] == "AR-MATCH-2", result
assert result["record"]["playerCount"] == 4 and len(result["record"]["participants"]) == 4, result["record"]
assert [p["mode"] for p in result["record"]["participants"]] == ["human","bot","human","bot"], result["record"]["participants"]
assert result["record"]["winnerSide"] == 3 and result["record"]["winnerFaction"] == "Liberti", result["record"]
assert result["record"]["mapId"] == result["mapId"], result["record"]
assert "matchTelemetry" not in result["rawRecord"] and "f9n3Telemetry" not in result["rawRecord"], result["rawRecord"]
assert result["telemetry"] and result["telemetry"]["schemaVersion"] == "AR-TELEMETRY-2", result["telemetry"]
assert result["telemetry"]["payload"] and result["telemetry"]["payload"]["schemaVersion"] == "F9Q3e1-2", result["telemetry"]
assert "G4 Agathoi" in result["historyHtml"] and "G3 Liberti" in result["statsHtml"], result
assert "G4:Agathoi" in result["csv"] and "G2:bot" in result["csv"], result["csv"]
assert result["telemetrySource"]["source"] == "Ultimo match registrato" and result["telemetrySource"]["schema"] == "F9Q3e1-2", result["telemetrySource"]
assert result["precheck"]["ok"], result["precheck"]
assert not page_errors, page_errors
assert not unexpected, unexpected
