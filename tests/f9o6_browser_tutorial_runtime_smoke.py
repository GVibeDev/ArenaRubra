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
    page = browser.new_page(viewport={"width": 1280, "height": 820}, has_touch=True)
    page.set_default_timeout(7000)
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
    page.wait_for_timeout(200)

    initial = page.evaluate("""() => ({
      build:BUILD_INFO.version,
      audit:tutorialScenarioAuditF9O6(),
      menuButton:Boolean(document.getElementById('mainMenuTutorialBtn')),
      runtimeApi:typeof tutorialRuntimeStartScenario,
      precheck:runPrecheck({quiet:true,source:'f9o6-browser-initial'})
    })""")
    started = page.evaluate("tutorialRuntimeStartScenario('lesson-1-exordium')")
    page.wait_for_timeout(350)
    welcome = page.evaluate("""() => ({
      diag:tutorialRuntimeDiagnostics(),
      narrative:narrativeDiagnostics(),
      pace:state.pacePreset,
      scale:state.gameScaleMode,
      tutorialMode:state.tutorialMode,
      botPaused:tutorialRuntimeShouldPauseBot(),
      hand:state.hand[1].map(card=>card.id),
      starters:Object.keys(state.starterCards[1]||{}).length,
      logicalQgs:state.units.filter(unit=>unit&&unit.type==='QG').length,
      hqCells:Array.from(document.querySelectorAll('.hex.hq')).map(cell=>({tokens:cell.querySelectorAll('.unitToken').length,stats:cell.querySelectorAll('.statMini').length}))
    })""")

    page.locator("#narrativeOverlayRoot .narrativeNextBtn").click(); page.wait_for_timeout(260)
    read_card = page.evaluate("""() => ({
      diag:tutorialRuntimeDiagnostics(),
      hidden:document.getElementById('tutorialSpotlightRoot').hidden,
      visible:tutorialRuntimeElementIsVisible(tutorialRuntimeState.target),
      cardId:tutorialRuntimeState.target && tutorialRuntimeState.target.dataset.previewCardId
    })""")

    page.locator("#narrativeOverlayRoot .narrativeNextBtn").click(); page.wait_for_timeout(220)
    collapse = page.evaluate("""() => ({diag:tutorialRuntimeDiagnostics(),allowed:tutorialRuntimeState.allowedTargets.length})""")
    page.locator("#mapHandOverlay .mapHandCollapseBtn").click(); page.wait_for_timeout(220)
    show = page.evaluate("""() => ({diag:tutorialRuntimeDiagnostics(),compact:document.getElementById('mapHandOverlay').classList.contains('isMovementHidden')})""")
    page.locator("#mapActionDock .mapLeftHandBtn").click(); page.wait_for_timeout(220)

    card_step = page.evaluate("""() => ({diag:tutorialRuntimeDiagnostics(),visible:tutorialRuntimeElementIsVisible(tutorialRuntimeState.target)})""")
    card_uid = page.evaluate("state.hand[1].find(card=>card.id==='UNIT:EXC1F01').cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{card_uid}"]').first.click(); page.wait_for_timeout(300)
    deploy = page.evaluate("""() => ({
      diag:tutorialRuntimeDiagnostics(),
      spawnTargets:document.querySelectorAll('.hex.spawnTarget').length,
      allowed:tutorialRuntimeState.allowedTargets.length,
      pending:pendingHandCardUid,
      targetKey:tutorialRuntimeState.target && tutorialRuntimeState.target.dataset.coordKey
    })""")
    aborted = page.evaluate("tutorialRuntimeAbort({silent:true,keepScreen:true,reason:'f9o6-smoke'})")
    browser.close()

unexpected = [msg for msg in console_errors if not msg.startswith("Arena AppShell: inizializzazione GameScreen non bloccante fallita")]
result = {"initial":initial,"started":started,"welcome":welcome,"readCard":read_card,"collapse":collapse,"show":show,"cardStep":card_step,"deploy":deploy,"aborted":aborted,"pageErrors":page_errors,"consoleErrors":unexpected}
print(json.dumps({"ok":True,**result}, ensure_ascii=False, indent=2))
assert initial["build"] in {"C2-STABLE-1-F9O6-APK-M4c","C2-STABLE-1-F9O7e-APK-M4c","C2-STABLE-1-F9O7g-APK-M4c",'C2-STABLE-1-F9V2f-APK-M4c'}, initial
assert initial["audit"]["ok"] and initial["precheck"]["ok"], initial
assert initial["menuButton"] and initial["runtimeApi"] == "function"
assert started is True
assert welcome["diag"]["stepId"] == "lesson-welcome"
assert welcome["pace"] == "competitive" and welcome["scale"] == "tactical"
assert welcome["tutorialMode"] and welcome["botPaused"]
assert welcome["hand"] == ["UNIT:EXC1F01","UNIT:EX1B04"] and welcome["starters"] == 0
assert welcome["logicalQgs"] == 2 and len(welcome["hqCells"]) == 2
assert all(item["tokens"] == 0 and item["stats"] == 0 for item in welcome["hqCells"])
assert read_card["diag"]["stepId"] == "read-tribune-card" and not read_card["hidden"] and read_card["visible"]
assert collapse["diag"]["stepId"] == "collapse-hand" and collapse["allowed"] == 1
assert show["diag"]["stepId"] == "show-hand" and show["compact"]
assert card_step["diag"]["stepId"] == "select-tribune-card" and card_step["visible"]
assert deploy["diag"]["stepId"] == "deploy-tribune" and deploy["spawnTargets"] > 0
assert deploy["allowed"] == 1 and deploy["targetKey"] == "-5,0,5"
assert aborted is True
assert not page_errors, page_errors
assert not unexpected, unexpected
