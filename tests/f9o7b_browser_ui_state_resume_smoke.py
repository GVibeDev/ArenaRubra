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
    page.wait_for_timeout(250)

    assert page.evaluate("BUILD_INFO.version") == "C2-STABLE-1-F9O7g-APK-M4c"
    assert page.evaluate("tutorialRuntimeResetProgress()") is True
    assert page.evaluate("tutorialRuntimeStartScenario('lesson-1-exordium')") is True
    page.wait_for_timeout(300)

    def next_step():
        page.locator("#narrativeOverlayRoot .narrativeNextBtn").click()
        page.wait_for_timeout(240)

    next_step()  # read card
    # Riproduce l'inciampo: Mano chiusa prima di entrare nel passo che chiede di chiuderla.
    assert page.evaluate("mapHandOverlayCollapse()") is True
    assert page.locator(".mapHandShowBtn").is_visible()
    next_step()  # collapse-hand: il contratto deve riaprirla
    collapse_state = page.evaluate("tutorialRuntimeDiagnostics()")
    assert collapse_state["stepId"] == "collapse-hand", collapse_state
    assert collapse_state["desiredHandState"] == "open" and collapse_state["actualHandState"] == "open", collapse_state
    assert page.locator("#mapHandOverlay .mapHandCollapseBtn").is_visible()
    page.locator("#mapHandOverlay .mapHandCollapseBtn").click(); page.wait_for_timeout(240)
    show_state = page.evaluate("tutorialRuntimeDiagnostics()")
    assert show_state["stepId"] == "show-hand", show_state
    assert show_state["actualHandState"] == "collapsed", show_state
    page.locator(".mapHandShowBtn").click(); page.wait_for_timeout(240)

    trib_card = page.evaluate("state.hand[1].find(c=>c.id==='UNIT:EXC1F01').cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{trib_card}"]').first.click(); page.wait_for_timeout(220)
    assert page.evaluate("tutorialRuntimeDiagnostics().actualHandState") == "collapsed"
    page.locator('.hex[data-coord-key="-5,0,5"]').click(); page.wait_for_timeout(350)
    next_step(); next_step()
    page.locator(".mapHandEndTurnBtn").first.click(); page.wait_for_timeout(420)
    next_step()  # checkpoint -> select-legionary-card

    before = page.evaluate("""() => ({
      step:tutorialRuntimeDiagnostics().stepId,
      progress:tutorialRuntimeProgressForScenario('lesson-1-exordium'),
      handState:tutorialRuntimeDiagnostics().actualHandState,
      session:tutorialRuntimeDiagnostics().sessionToken
    })""")
    assert before["step"] == "select-legionary-card" and before["handState"] == "open", before

    # Crea volutamente stato UI sporco e una callback della vecchia sessione.
    page.evaluate("""() => {
      document.body.dataset.staleTutorialCallback = 'pending';
      tutorialRuntimeSchedule(() => { document.body.dataset.staleTutorialCallback = 'FIRED'; }, 180, { stepToken:false });
      mode = 'ability';
      pendingAbility = { id:'stale-ability' };
      selectedId = (state.units.find(u=>u.alive&&u.type!=='QG'&&u.side===1)||{}).uid || 'stale';
      if (typeof openGamePanel === 'function') openGamePanel('log');
      mapHandOverlayCollapse();
    }""")
    assert page.evaluate("tutorialRuntimeAbort({silent:true,keepScreen:true,reason:'resume-dirty-state'})") is True
    assert page.evaluate("tutorialRuntimeStartScenario('lesson-1-exordium',{resume:true})") is True
    page.wait_for_timeout(500)

    after = page.evaluate("""() => ({
      diag:tutorialRuntimeDiagnostics(),
      mode,
      pendingAbility,
      selectedId,
      panel:typeof currentGamePanel==='function' ? currentGamePanel() : null,
      mobilePanel:document.body.className,
      stale:document.body.dataset.staleTutorialCallback,
      narrativeVisible:[...document.querySelectorAll('#narrativeOverlayRoot .narrativeDialog')].filter(el=>el.offsetWidth>0&&el.offsetHeight>0).length,
      spotlightStep:document.getElementById('tutorialSpotlightRoot')?.dataset.stepId || ''
    })""")
    browser.close()

unexpected = [msg for msg in console_errors if not msg.startswith("Arena AppShell: inizializzazione GameScreen non bloccante fallita")]
assert after["diag"]["stepId"] == "select-legionary-card", after
assert after["diag"]["active"] is True and after["diag"]["targetResolved"] is True, after
assert after["diag"]["actualHandState"] == "open", after
assert after["mode"] == "idle" and after["pendingAbility"] is None and after["selectedId"] is None, after
assert after["panel"] is None, after
assert after["stale"] == "pending", after
assert after["narrativeVisible"] == 1, after
assert after["spotlightStep"] == "select-legionary-card", after
assert not page_errors, page_errors
assert not unexpected, unexpected
print(json.dumps({"ok":True,"before":before,"after":after,"pageErrors":page_errors,"consoleErrors":unexpected}, ensure_ascii=False, indent=2))
