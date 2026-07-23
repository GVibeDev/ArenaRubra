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
    browser = p.chromium.launch(
        headless=True,
        executable_path="/usr/bin/chromium",
        args=["--no-sandbox", "--allow-file-access-from-files"],
    )
    page = browser.new_page(viewport={"width": 920, "height": 500}, has_touch=True, is_mobile=True)
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    page.add_style_tag(path=str(ROOT / "css/renderer_calibration_lab.css"))
    for rel in scripts:
        page.add_script_tag(path=str(ROOT / rel))
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.wait_for_timeout(140)
    page.evaluate("() => newGame({modes:{1:'bot',2:'bot'},factions:{1:'Nexus',2:'Exordium'},aiMode:'advanced',pacePreset:'standard'})")
    page.wait_for_timeout(120)

    setup = page.evaluate("""() => {
      for (const side of [1, 2]) {
        const faction = state.factions[side];
        const definition = MISSION_DEFINITIONS.find(item => item && item.faction === faction);
        const mission = buildMissionCardFromDefinition(definition);
        mission.cardUid = `f9o4e-mission-${side}`;
        mission.ownerSide = side;
        const existing = state.hand[side] || [];
        const commander = existing.find(card => card && (card.cardType === 'commander' || card.deckRole === 'commander'));
        const ordinary = existing.filter(card => card && card !== commander && card.sourceType !== 'mission').slice(0, 3);
        state.hand[side] = [mission, commander, ...ordinary].filter(Boolean);
        state.missions = state.missions || {1:null,2:null};
        state.missions[side] = createMissionRuntime(side, definition);
      }
      state.currentPlayer = 1;
      missionUiInvalidate('f9o4e-browser-setup');
      renderAll();
      return {build:BUILD_INFO.version, hand1:state.hand[1].length, hand2:state.hand[2].length};
    }""")
    page.wait_for_timeout(900)
    page.wait_for_function("() => cardRendererHandThumbCacheDiagnostics().cached >= 10", timeout=5000)
    page.evaluate("""() => {
      state.winner = 1;
      botRunning = false;
      state.currentPlayer = 1;
      const overlay = document.getElementById('mapHandOverlay');
      if (overlay) overlay.dataset.renderSignature = 'f9o4e-force-initial';
      renderAll();
    }""")

    initial = page.evaluate("""() => {
      const canvases = [...document.querySelectorAll('#mapHandOverlay [data-hand-thumb-card-uid]')];
      const hidden = [...document.querySelectorAll('#mapHandOverlay .hiddenOpponentCard')];
      return {
        side: document.querySelector('#mapHandOverlay [data-hand-zone-side]')?.dataset.handZoneSide || '',
        canvases: canvases.length,
        ready: canvases.filter(canvas => canvas.dataset.cardRenderState === 'ready' && canvas.dataset.thumbRendered === '1').length,
        hidden: hidden.length,
        hiddenCanvases: hidden.reduce((sum, node) => sum + node.querySelectorAll('canvas').length, 0),
        cache: cardRendererHandThumbCacheDiagnostics(),
      };
    }""")

    repeated = page.evaluate("""() => {
      const results = [];
      for (let index = 0; index < 10; index += 1) {
        const previous = document.querySelector('#mapHandOverlay [data-hand-thumb-card-uid]');
        state.energy[1] = Number(state.energy[1] || 0) + 1;
        const overlay = document.getElementById('mapHandOverlay');
        if (overlay) overlay.dataset.renderSignature = `f9o4e-force-${index}`;
        renderAll();
        const canvases = [...document.querySelectorAll('#mapHandOverlay [data-hand-thumb-card-uid]')];
        results.push({
          replaced: Boolean(previous && canvases[0] && previous !== canvases[0]),
          count: canvases.length,
          ready: canvases.filter(canvas => canvas.dataset.cardRenderState === 'ready' && canvas.dataset.thumbRendered === '1').length,
        });
      }
      return results;
    }""")

    switched = page.evaluate("""() => {
      state.currentPlayer = 2;
      const overlay = document.getElementById('mapHandOverlay');
      if (overlay) overlay.dataset.renderSignature = 'f9o4e-force-switch';
      renderAll();
      const canvases = [...document.querySelectorAll('#mapHandOverlay [data-hand-thumb-card-uid]')];
      return {
        side: document.querySelector('#mapHandOverlay [data-hand-zone-side]')?.dataset.handZoneSide || '',
        canvases: canvases.length,
        ready: canvases.filter(canvas => canvas.dataset.cardRenderState === 'ready' && canvas.dataset.thumbRendered === '1').length,
        cache: cardRendererHandThumbCacheDiagnostics(),
      };
    }""")
    browser.close()

ignored_prefix = "Arena AppShell: inizializzazione GameScreen non bloccante fallita"
unexpected_console_errors = [msg for msg in console_errors if not msg.startswith(ignored_prefix)]
result = {
    "ok": True,
    "setup": setup,
    "initial": initial,
    "repeated": repeated,
    "switched": switched,
    "pageErrors": page_errors,
    "consoleErrors": unexpected_console_errors,
    "ignoredBaselineConsoleErrors": len(console_errors) - len(unexpected_console_errors),
}
print(json.dumps(result, ensure_ascii=False, indent=2))

assert setup["build"] in {"C2-STABLE-1-F9O4f-APK-M4c","C2-STABLE-1-F9O4e-APK-M4c"}, setup
assert initial["side"] == "1" and initial["canvases"] == 5 and initial["ready"] == 5, initial
assert initial["hidden"] >= 1 and initial["hiddenCanvases"] == 0, initial
assert initial["cache"]["cached"] >= 10, initial
assert all(item["replaced"] and item["count"] == 5 and item["ready"] == 5 for item in repeated), repeated
assert switched["side"] == "2" and switched["canvases"] == 5 and switched["ready"] == 5, switched
assert switched["cache"]["cached"] >= 10, switched
assert not page_errors, page_errors
assert not unexpected_console_errors, unexpected_console_errors
