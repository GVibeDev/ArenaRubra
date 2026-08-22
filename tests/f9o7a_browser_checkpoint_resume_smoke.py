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
    page = browser.new_page(viewport={"width": 1280, "height": 840}, has_touch=True)
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

    assert page.evaluate("tutorialRuntimeResetProgress()") is True
    assert page.evaluate("tutorialRuntimeStartScenario('lesson-1-exordium')") is True
    page.wait_for_timeout(300)

    def next_step():
        page.locator("#narrativeOverlayRoot .narrativeNextBtn").click()
        page.wait_for_timeout(220)

    next_step()  # read card
    next_step()  # collapse
    page.locator("#mapHandOverlay .mapHandCollapseBtn").click(); page.wait_for_timeout(180)
    page.locator("#mapActionDock .mapLeftHandBtn").click(); page.wait_for_timeout(180)
    trib_card = page.evaluate("state.hand[1].find(c=>c.id==='UNIT:EXC1F01').cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{trib_card}"]').first.click(); page.wait_for_timeout(220)
    page.locator('.hex[data-coord-key="-5,0,5"]').click(); page.wait_for_timeout(350)
    next_step()  # explain defense
    next_step()  # end turn prompt
    page.locator(".mapLeftEndTurnBtn").first.click(); page.wait_for_timeout(420)
    next_step()  # checkpoint completion -> select-legionary-card

    before = page.evaluate("""() => ({
      step:tutorialRuntimeDiagnostics().stepId,
      progress:tutorialRuntimeProgressForScenario('lesson-1-exordium'),
      currentPlayer:state.currentPlayer,
      turn:state.turn,
      energy:{...state.energy},
      hand:state.hand[1].map(c => c.id),
      units:state.units.filter(u=>u.alive&&u.type!=='QG').map(u=>({id:u.id,side:u.side,pos:u.pos,acted:u.acted,hp:u.currentHp,def:u.currentDef})),
      qgTokens:document.querySelectorAll('.hex.isHQ .unitToken').length,
      qgStats:document.querySelectorAll('.hex.isHQ .statMini').length
    })""")
    assert before["step"] == "select-legionary-card", before
    assert before["progress"]["snapshot"], before

    assert page.evaluate("tutorialRuntimeAbort({silent:true,keepScreen:true,reason:'checkpoint-test'})") is True
    assert page.evaluate("tutorialRuntimeStartScenario('lesson-1-exordium',{resume:true})") is True
    page.wait_for_timeout(450)

    after = page.evaluate("""() => ({
      step:tutorialRuntimeDiagnostics().stepId,
      currentPlayer:state.currentPlayer,
      turn:state.turn,
      energy:{...state.energy},
      hand:state.hand[1].map(c => c.id),
      units:state.units.filter(u=>u.alive&&u.type!=='QG').map(u=>({id:u.id,side:u.side,pos:u.pos,acted:u.acted,hp:u.currentHp,def:u.currentDef})),
      qgTokens:document.querySelectorAll('.hex.isHQ .unitToken').length,
      qgStats:document.querySelectorAll('.hex.isHQ .statMini').length,
      active:tutorialRuntimeDiagnostics().active,
      botPaused:tutorialRuntimeDiagnostics().botPaused
    })""")
    browser.close()

unexpected = [msg for msg in console_errors if not msg.startswith("Arena AppShell: inizializzazione GameScreen non bloccante fallita")]
assert after["step"] == "select-legionary-card", after
assert after["active"] is True and after["botPaused"] is True, after
assert after["currentPlayer"] == before["currentPlayer"]
assert after["turn"] == before["turn"]
assert after["energy"] == before["energy"]
assert after["hand"] == before["hand"] == ["UNIT:EX1B04"]
assert after["units"] == before["units"]
assert after["qgTokens"] == 0 and after["qgStats"] == 0
assert not page_errors, page_errors
assert not unexpected, unexpected
print(json.dumps({"ok":True,"before":before,"after":after,"pageErrors":page_errors,"consoleErrors":unexpected}, ensure_ascii=False, indent=2))
