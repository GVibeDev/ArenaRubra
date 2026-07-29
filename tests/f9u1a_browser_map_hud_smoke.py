from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import re

ROOT = Path(__file__).resolve().parents[1]


def load_app(page):
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    scripts = re.findall(r'<script\s+src="([^"]+)"\s*></script>', index)
    html = re.sub(r'<script\s+src="[^"]+"\s*></script>', '', index)
    html = re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>', '', html)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    renderer_css = ROOT / "css/renderer_calibration_lab.css"
    if renderer_css.exists():
        page.add_style_tag(path=str(renderer_css))
    for rel in scripts:
        page.add_script_tag(path=str(ROOT / rel))
    page.wait_for_function("typeof newGame === 'function' && typeof BUILD_INFO !== 'undefined' && typeof initializeF9U1aUi === 'function'")
    page.evaluate("""() => {
      const splash = document.getElementById('appSplash');
      if (splash) { splash.style.display='none'; splash.style.pointerEvents='none'; }
      if (typeof initializeArenaAppShell === 'function') initializeArenaAppShell();
      newGame({
        mapId:'map1_starter',
        factions:{1:'Nexus',2:'Exordium'},
        selectedCommanders:{1:'NXCMD01',2:'EX0B00'},
        selectedDecks:{
          1:{mode:'custom',savedKey:'Nexus::NXCMD01::nexus-avatex-civilta-algoritmica'},
          2:{mode:'custom',savedKey:'Exordium::EX0B00::doppio-assalto-imperiale'}
        },
        modes:{1:'human',2:'human'}, autoResignEnabled:false,
        aiMode:'advanced', pacePreset:'standard', gameScaleMode:'large_scale',
        matchSeed:'F9U1A-MAP-HUD-SMOKE'
      });
      if (typeof setAppScreen === 'function') setAppScreen(ARENA_APP_SCREENS.GAME);
      initializeF9U1aUi();
    }""")
    page.wait_for_timeout(250)


page_errors = []
console_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        executable_path="/usr/bin/chromium",
        args=["--no-sandbox", "--allow-file-access-from-files"],
    )

    desktop_context = browser.new_context(viewport={"width": 1440, "height": 960})
    desktop = desktop_context.new_page()
    desktop.set_default_timeout(7000)
    desktop.on("pageerror", lambda exc: page_errors.append(f"desktop: {exc}"))
    desktop.on("console", lambda msg: console_errors.append(f"desktop: {msg.text}") if msg.type == "error" else None)
    load_app(desktop)

    desktop_before = desktop.evaluate("""() => {
      const dock = document.getElementById('mapActionDock');
      const board = document.getElementById('boardWrap');
      const hand = document.getElementById('mapHandOverlay');
      const dockRect = dock.getBoundingClientRect();
      const boardRect = board.getBoundingClientRect();
      const hiddenPanel = selector => {
        const node = document.querySelector(selector);
        return !node || getComputedStyle(node).display === 'none';
      };
      return {
        build:BUILD_INFO.version,
        baseline:BUILD_INFO.logicBaseline,
        schema:MATCH_TELEMETRY_SCHEMA_VERSION,
        gameActionBar:document.getElementById('gameActionBar'),
        mobileBarDisplay:getComputedStyle(document.getElementById('mobileGameBar')).display,
        dockText:dock.textContent,
        dockControls:dock.querySelectorAll('[data-map-left-dock-controls] button').length,
        dockTop:dockRect.top,
        boardTop:boardRect.top,
        dockLeft:dockRect.left,
        boardLeft:boardRect.left,
        handClass:hand.className,
        handButton:dock.querySelector('.mapLeftHandBtn')?.textContent.trim() || '',
        debugVisible:getComputedStyle(document.getElementById('gameDebugBtn')).display !== 'none',
        setupHidden:hiddenPanel('#setupPanel'),
        handLegacyHidden:hiddenPanel('[data-game-panel="hand"]'),
        actionsLegacyHidden:hiddenPanel('[data-game-panel="actions"]'),
        marketLegacyHidden:hiddenPanel('[data-game-panel="market"]'),
        precheck:runPrecheck({quiet:true,source:'f9u1a-browser-map-hud-smoke'})
      };
    }""")

    desktop.locator("#gameDebugBtn").click()
    desktop.wait_for_timeout(50)
    debug_open = desktop.evaluate("""() => ({
      hidden:document.getElementById('gameDebugMenu').hidden,
      expanded:document.getElementById('gameDebugBtn').getAttribute('aria-expanded'),
      actions:[...document.querySelectorAll('#gameDebugMenu [data-game-debug-action]')].map(node=>node.dataset.gameDebugAction),
      metadata:document.getElementById('gameDebugMenu').textContent
    })""")

    desktop.locator('#gameDebugMenu [data-game-debug-action="log"]').click()
    desktop.wait_for_timeout(80)
    log_open = desktop.evaluate("""() => ({
      active:document.getElementById('logDock').classList.contains('panelOverlayActive'),
      scrim:!document.getElementById('gamePanelScrim').hidden
    })""")
    desktop.evaluate("typeof closeGamePanel === 'function' && closeGamePanel()")

    desktop.locator("#gameDebugBtn").click()
    desktop.locator('#gameDebugMenu [data-game-debug-action="telemetry"]').click()
    desktop.wait_for_timeout(100)
    telemetry_open = desktop.evaluate("""() => ({
      statsActive:document.querySelector('[data-game-panel="stats"]').classList.contains('panelOverlayActive'),
      panelPresent:Boolean(document.getElementById('matchTelemetryPanel')),
      panelText:document.getElementById('matchTelemetryPanel').textContent,
      statsOpen:document.getElementById('statsDetails').open
    })""")
    desktop.evaluate("typeof closeGamePanel === 'function' && closeGamePanel()")

    desktop.locator("#mapActionDock .mapLeftHandBtn").click()
    desktop.wait_for_timeout(80)
    hand_hidden = desktop.evaluate("""() => ({
      classes:document.getElementById('mapHandOverlay').className,
      label:document.querySelector('#mapActionDock .mapLeftHandBtn').textContent.trim()
    })""")
    desktop.locator("#mapActionDock .mapLeftHandBtn").click()
    desktop.wait_for_timeout(80)
    hand_shown = desktop.evaluate("""() => ({
      classes:document.getElementById('mapHandOverlay').className,
      label:document.querySelector('#mapActionDock .mapLeftHandBtn').textContent.trim()
    })""")

    mobile_context = browser.new_context(viewport={"width": 820, "height": 480}, is_mobile=True)
    mobile = mobile_context.new_page()
    mobile.set_default_timeout(7000)
    mobile.on("pageerror", lambda exc: page_errors.append(f"mobile: {exc}"))
    mobile.on("console", lambda msg: console_errors.append(f"mobile: {msg.text}") if msg.type == "error" else None)
    load_app(mobile)
    mobile_result = mobile.evaluate("""() => {
      const dock = document.getElementById('mapActionDock');
      const board = document.getElementById('boardWrap');
      const dockRect = dock.getBoundingClientRect();
      const boardRect = board.getBoundingClientRect();
      return {
        bodyClass:document.body.className,
        headerDebugDisplay:getComputedStyle(document.getElementById('gameDebugHeaderBtn')).display,
        desktopDebugDisplay:getComputedStyle(document.getElementById('gameDebugBtn')).display,
        mobileBarDisplay:getComputedStyle(document.getElementById('mobileGameBar')).display,
        mobileMapHudDisplay:getComputedStyle(document.getElementById('mobileMapHud')).display,
        cameraDisplay:getComputedStyle(document.getElementById('mapCameraControls')).display,
        dockTop:dockRect.top,
        dockLeft:dockRect.left,
        dockWidth:dockRect.width,
        dockHeight:dockRect.height,
        boardTop:boardRect.top,
        boardWidth:boardRect.width,
        viewportWidth:innerWidth,
        controls:dock.querySelectorAll('[data-map-left-dock-controls] button').length
      };
    }""")
    mobile.locator("#gameDebugHeaderBtn").click()
    mobile.wait_for_timeout(60)
    mobile_debug = mobile.evaluate("""() => ({
      hidden:document.getElementById('gameDebugMenu').hidden,
      expanded:document.getElementById('gameDebugHeaderBtn').getAttribute('aria-expanded')
    })""")

    browser.close()

assert desktop_before["build"] == "C2-STABLE-1-F9U2b-APK-M4c", desktop_before
assert desktop_before["baseline"] == "C2-STABLE-1-F9U2a-APK-M4c", desktop_before
assert desktop_before["schema"] == "F9Q3e1-2", desktop_before
assert desktop_before["gameActionBar"] is None, desktop_before
assert desktop_before["mobileBarDisplay"] == "none", desktop_before
assert desktop_before["dockControls"] == 2, desktop_before
assert "Missione" in desktop_before["dockText"], desktop_before
assert "Abilità di fazione" in desktop_before["dockText"], desktop_before
assert "Fine turno" in desktop_before["dockText"], desktop_before
assert desktop_before["handButton"] in ("Mostra mano", "Nascondi mano"), desktop_before
assert desktop_before["debugVisible"], desktop_before
assert desktop_before["dockTop"] <= desktop_before["boardTop"] + 30, desktop_before
assert desktop_before["dockLeft"] >= desktop_before["boardLeft"], desktop_before
assert desktop_before["setupHidden"], desktop_before
assert desktop_before["handLegacyHidden"], desktop_before
assert desktop_before["actionsLegacyHidden"], desktop_before
assert desktop_before["marketLegacyHidden"], desktop_before
assert desktop_before["precheck"]["ok"] and not desktop_before["precheck"]["problems"] and not desktop_before["precheck"]["warnings"], desktop_before

assert not debug_open["hidden"] and debug_open["expanded"] == "true", debug_open
assert debug_open["actions"] == ["hand", "log", "stats", "telemetry"], debug_open
assert "F9U2b" in debug_open["metadata"] and "F9Q3e1-2" in debug_open["metadata"], debug_open
assert log_open["active"] and log_open["scrim"], log_open
assert telemetry_open["statsActive"] and telemetry_open["panelPresent"] and telemetry_open["statsOpen"], telemetry_open
assert "F9Q3e1-2" in telemetry_open["panelText"], telemetry_open
assert "isMovementHidden" in hand_hidden["classes"] or "Mostra mano" == hand_hidden["label"], hand_hidden
assert hand_hidden["label"] == "Mostra mano", hand_hidden
assert hand_shown["label"] == "Nascondi mano", hand_shown

assert "mobile-apk-m4" in mobile_result["bodyClass"], mobile_result
assert mobile_result["headerDebugDisplay"] != "none", mobile_result
assert mobile_result["mobileBarDisplay"] == "none", mobile_result
assert mobile_result["mobileMapHudDisplay"] == "none", mobile_result
assert mobile_result["cameraDisplay"] != "none", mobile_result
assert mobile_result["controls"] == 2, mobile_result
assert mobile_result["dockLeft"] >= 0 and mobile_result["dockTop"] >= mobile_result["boardTop"], mobile_result
assert mobile_result["boardWidth"] <= mobile_result["viewportWidth"] + 1, mobile_result
assert not mobile_debug["hidden"] and mobile_debug["expanded"] == "true", mobile_debug
assert not page_errors, page_errors
assert not console_errors, console_errors

print(json.dumps({
  "ok": True,
  "desktopBefore": desktop_before,
  "debugOpen": debug_open,
  "logOpen": log_open,
  "telemetryOpen": telemetry_open,
  "handHidden": hand_hidden,
  "handShown": hand_shown,
  "mobile": mobile_result,
  "mobileDebug": mobile_debug,
  "pageErrors": page_errors,
  "consoleErrors": console_errors
}, ensure_ascii=False, indent=2))
