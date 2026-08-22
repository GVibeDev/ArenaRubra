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
    page = browser.new_page(viewport={"width": 1365, "height": 900}, has_touch=True)
    page.set_default_timeout(8000)
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
    page.wait_for_timeout(300)

    assert page.evaluate("BUILD_INFO.version") == "C2-STABLE-1-F9V2c-APK-M4c"
    assert page.evaluate("tutorialRuntimeStartScenario('lesson-1-exordium')") is True
    page.wait_for_timeout(450)

    informative_guard = page.evaluate("""() => {
      const before={player:state.currentPlayer,turn:state.turn,energy:state.energy[1],units:state.units.length};
      const uiTurn=endTurn({source:'ui'});
      const empty=state.cells.find(c=>c && c.coord && !getUnitAt(c.coord) && c.coord.join(',')!=='-5,0,5');
      if (empty) handleCellClick([...empty.coord]);
      const after={player:state.currentPlayer,turn:state.turn,energy:state.energy[1],units:state.units.length};
      return {before,after,uiTurn,diag:tutorialRuntimeDiagnostics()};
    }""")
    assert informative_guard["before"] == informative_guard["after"], informative_guard
    assert informative_guard["uiTurn"] is False, informative_guard
    assert informative_guard["diag"]["stepId"] == "lesson-welcome", informative_guard

    # Reach the card-selection step through the only permitted controls.
    page.locator("#narrativeOverlayRoot .narrativeNextBtn").click(); page.wait_for_timeout(220)
    page.locator("#narrativeOverlayRoot .narrativeNextBtn").click(); page.wait_for_timeout(220)
    page.locator("#mapHandOverlay .mapHandCollapseBtn").click(); page.wait_for_timeout(220)
    page.locator("#mapActionDock .mapLeftHandBtn").click(); page.wait_for_timeout(220)

    wrong_card = page.evaluate("""() => {
      const card=state.hand[1].find(c=>c.id==='UNIT:EX1B04');
      const before={energy:state.energy[1],pending:pendingHandCardUid,mode};
      const accepted=beginHandCardPlay(card.cardUid);
      return {accepted,before,after:{energy:state.energy[1],pending:pendingHandCardUid,mode},diag:tutorialRuntimeDiagnostics()};
    }""")
    assert wrong_card["accepted"] is False, wrong_card
    assert wrong_card["before"] == wrong_card["after"], wrong_card
    assert wrong_card["diag"]["stepId"] == "select-tribune-card", wrong_card
    assert wrong_card["diag"]["expectedInteraction"]["action"] == "card_selected", wrong_card
    assert wrong_card["diag"]["expectedInteraction"]["match"]["cardId"] == "UNIT:EXC1F01", wrong_card

    trib_uid = page.evaluate("state.hand[1].find(c=>c.id==='UNIT:EXC1F01').cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{trib_uid}"]').first.click(); page.wait_for_timeout(300)

    wrong_hex = page.evaluate("""() => {
      const bp=BLUEPRINTS.find(x=>x.id==='EXC1F01');
      const cells=spawnCellsFor(1,bp).filter(c=>c.join(',')!=='-5,0,5');
      const target=cells[0];
      const before={energy:state.energy[1],units:state.units.filter(u=>u.alive&&u.type!=='QG').length,pending:pendingPurchaseBlueprintId};
      if (target) handleCellClick([...target]);
      const after={energy:state.energy[1],units:state.units.filter(u=>u.alive&&u.type!=='QG').length,pending:pendingPurchaseBlueprintId};
      return {target,before,after,diag:tutorialRuntimeDiagnostics()};
    }""")
    assert wrong_hex["target"], wrong_hex
    assert wrong_hex["before"] == wrong_hex["after"], wrong_hex
    assert wrong_hex["diag"]["stepId"] == "deploy-tribune", wrong_hex
    assert wrong_hex["diag"]["expectedInteraction"] == {"action":"cell_click","match":{"coord":[-5,0,5]},"source":"spotlight"}, wrong_hex

    page.locator('.hex[data-coord-key="-5,0,5"]').click(); page.wait_for_timeout(550)
    accepted = page.evaluate("""() => ({
      step:tutorialRuntimeDiagnostics().stepId,
      tribune:state.units.some(u=>u.alive&&u.id==='EXC1F01'&&u.pos.join(',')==='-5,0,5'),
      player:state.currentPlayer,
      pageErrors:0
    })""")
    assert accepted["step"] == "fante-robot-arrives" and accepted["tribune"], accepted

    browser.close()

unexpected = [msg for msg in console_errors if not msg.startswith("Arena AppShell: inizializzazione GameScreen non bloccante fallita")]
assert not page_errors, page_errors
assert not unexpected, unexpected
print(json.dumps({
    "ok": True,
    "build": "C2-STABLE-1-F9V2c-APK-M4c",
    "informativeGuard": informative_guard,
    "wrongCardGuard": wrong_card,
    "wrongHexGuard": wrong_hex,
    "accepted": accepted,
    "pageErrors": page_errors,
    "consoleErrors": unexpected
}, ensure_ascii=False, indent=2))
