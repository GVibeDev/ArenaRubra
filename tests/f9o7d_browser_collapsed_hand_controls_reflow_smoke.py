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
    page.evaluate("setAppScreen(ARENA_APP_SCREENS.GAME); newGame({ p1Faction:'Nexus', p2Faction:'Exordium', p1Mode:'human', p2Mode:'human', initiativeMode:'1' })")
    page.wait_for_timeout(350)

    open_state = page.evaluate("""() => ({
      overlayOpen: document.querySelector('#mapHandOverlay .mapHandOverlayInner') !== null,
      collapseVisible: !!document.querySelector('#mapHandOverlay .mapHandCollapseBtn'),
      dockCompact: document.querySelector('#mapActionDock .mapCollapsedHandControls') !== null,
      openEndTurnInOverlay: document.querySelector('#mapHandOverlay .mapHandEndTurnBtn') !== null
    })""")

    page.evaluate("mapHandOverlayCollapse()")
    page.wait_for_timeout(250)
    collapsed = page.evaluate("""() => {
      const overlay=document.getElementById('mapHandOverlay');
      const dock=document.getElementById('mapActionDock');
      const controls=dock.querySelector('.mapCollapsedHandControls');
      const dockRect=dock.getBoundingClientRect();
      const controlsRect=controls && controls.getBoundingClientRect();
      return {
        overlayClass:overlay.classList.contains('isMovementHidden'),
        overlayChildren:overlay.children.length,
        overlayDisplay:getComputedStyle(overlay).display,
        ariaHidden:overlay.getAttribute('aria-hidden'),
        controlsVisible:!!controls && controlsRect.width>0 && controlsRect.height>0,
        showButtons:dock.querySelectorAll('.mapHandShowBtn').length,
        endButtons:dock.querySelectorAll('.mapHandEndTurnBtn').length,
        controlsInsideDock:!!controls && controls.parentElement===dock,
        controlsBelowAbilities:!!controlsRect && controlsRect.top >= dockRect.top,
        oldRightCompact:document.querySelector('#mapHandOverlay .mapHandOverlayCompact') !== null,
        globalShowButtons:document.querySelectorAll('.mapHandShowBtn').length,
        globalEndTurnButtons:document.querySelectorAll('.mapHandEndTurnBtn').length
      };
    }""")

    page.locator("#mapActionDock .mapHandShowBtn").click()
    page.wait_for_timeout(250)
    reopened = page.evaluate("""() => ({
      overlayOpen:document.querySelector('#mapHandOverlay .mapHandOverlayInner') !== null,
      overlayDisplay:getComputedStyle(document.getElementById('mapHandOverlay')).display,
      ariaHidden:document.getElementById('mapHandOverlay').getAttribute('aria-hidden'),
      dockCompact:document.querySelector('#mapActionDock .mapCollapsedHandControls') !== null,
      openEndTurnInOverlay:document.querySelector('#mapHandOverlay .mapHandEndTurnBtn') !== null,
      moveUnitsInOverlay:document.querySelector('#mapHandOverlay .mapHandMoveUnitsBtn') !== null,
      collapseInOverlay:document.querySelector('#mapHandOverlay .mapHandCollapseBtn') !== null
    })""")
    browser.close()

unexpected = [msg for msg in console_errors if not msg.startswith("Arena AppShell: inizializzazione GameScreen non bloccante fallita")]
assert open_state == {
    "overlayOpen": True,
    "collapseVisible": True,
    "dockCompact": False,
    "openEndTurnInOverlay": True
}, open_state
assert collapsed["overlayClass"] is True, collapsed
assert collapsed["overlayChildren"] == 0, collapsed
assert collapsed["overlayDisplay"] == "none", collapsed
assert collapsed["ariaHidden"] == "true", collapsed
assert collapsed["controlsVisible"] is True, collapsed
assert collapsed["showButtons"] == 1 and collapsed["endButtons"] == 1, collapsed
assert collapsed["controlsInsideDock"] is True and collapsed["controlsBelowAbilities"] is True, collapsed
assert collapsed["oldRightCompact"] is False, collapsed
assert collapsed["globalShowButtons"] == 1 and collapsed["globalEndTurnButtons"] == 1, collapsed
assert reopened == {
    "overlayOpen": True,
    "overlayDisplay": "block",
    "ariaHidden": None,
    "dockCompact": False,
    "openEndTurnInOverlay": True,
    "moveUnitsInOverlay": True,
    "collapseInOverlay": True
}, reopened
assert not page_errors, page_errors
assert not unexpected, unexpected
print(json.dumps({"ok":True,"open":open_state,"collapsed":collapsed,"reopened":reopened,"pageErrors":page_errors,"consoleErrors":unexpected}, ensure_ascii=False, indent=2))
