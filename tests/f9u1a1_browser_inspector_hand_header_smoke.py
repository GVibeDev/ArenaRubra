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
    page.wait_for_function("typeof newGame === 'function' && typeof createUnitFromBlueprint === 'function' && typeof BUILD_INFO !== 'undefined'")
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
        matchSeed:'F9U1A1-INSPECTOR-HAND-HEADER'
      });
      if (typeof setAppScreen === 'function') setAppScreen(ARENA_APP_SCREENS.GAME);
      const bp = BLUEPRINTS.find(item => item.faction === 'Nexus' && item.type !== 'QG' && item.ability && !item.ability.passive)
        || BLUEPRINTS.find(item => item.faction === 'Nexus' && item.type !== 'QG');
      const coord = state.cells.map(cell => cell.coord).find(cell => !getUnitAt(cell) && hexDistance(cell, getHq(1).pos) <= 2);
      const unit = createUnitFromBlueprint(bp, 1);
      unit.pos = [...coord];
      unit.acted = false;
      state.units.push(unit);
      state.currentPlayer = 1;
      if (typeof gameScreenInspectUnit === 'function') gameScreenInspectUnit(unit);
      else selectedId = unit.uid;
      if (typeof renderAll === 'function') renderAll();
      if (typeof expandSelectedUnitFloat === 'function') expandSelectedUnitFloat();
    }""")
    page.wait_for_timeout(350)


def layout_snapshot(page):
    return page.evaluate("""() => {
      const rect = selector => document.querySelector(selector)?.getBoundingClientRect().toJSON() || null;
      const audio = rect('.arenaGameAudioRow');
      const toggles = rect('.arenaGamePresentationToggles');
      const toggleButtons = [...document.querySelectorAll('.arenaGamePresentationToggles button')].map(button => ({
        text:button.textContent.trim(),
        rect:button.getBoundingClientRect().toJSON()
      }));
      const inspectorBody = document.querySelector('.selectedUnitFloatBody');
      return {
        build:BUILD_INFO.version,
        schema:MATCH_TELEMETRY_SCHEMA_VERSION,
        viewport:{width:innerWidth,height:innerHeight},
        inspector:rect('#selectedUnitFloat'),
        inspectorBody:{rect:rect('.selectedUnitFloatBody'),clientHeight:inspectorBody?.clientHeight || 0,scrollHeight:inspectorBody?.scrollHeight || 0},
        canvas:rect('#selectedUnitCardPreviewCanvas'),
        ability:rect('#selectedUnitPrimaryAbilitySlot'),
        stats:rect('.selectedUnitStatsTable'),
        actionPanel:rect('#actionPanel'),
        actions:[...document.querySelectorAll('#actionPanel button')].map(button => button.textContent.trim()),
        hand:rect('#mapHandOverlay'),
        dock:rect('#mapActionDock'),
        audio,
        toggles,
        toggleButtons,
        toggleTexts:toggleButtons.map(item => item.text),
        audioToggleOverlap:audio && toggles ? !(audio.bottom <= toggles.top || toggles.bottom <= audio.top || audio.right <= toggles.left || toggles.right <= audio.left) : true,
        pageText:document.getElementById('selectedUnitFloat')?.innerText || '',
        precheck:runPrecheck({quiet:true,source:'f9u1a1-browser-inspector-hand-header-smoke'})
      };
    }""")


page_errors = []
console_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox", "--allow-file-access-from-files"])

    desktop_context = browser.new_context(viewport={"width":1440,"height":960})
    desktop = desktop_context.new_page()
    desktop.set_default_timeout(8000)
    desktop.on("pageerror", lambda exc: page_errors.append(f"desktop: {exc}"))
    desktop.on("console", lambda msg: console_errors.append(f"desktop: {msg.text}") if msg.type == "error" else None)
    load_app(desktop)
    desktop_result = layout_snapshot(desktop)

    mobile_context = browser.new_context(viewport={"width":820,"height":480}, is_mobile=True)
    mobile = mobile_context.new_page()
    mobile.set_default_timeout(8000)
    mobile.on("pageerror", lambda exc: page_errors.append(f"mobile: {exc}"))
    mobile.on("console", lambda msg: console_errors.append(f"mobile: {msg.text}") if msg.type == "error" else None)
    load_app(mobile)
    mobile_result = layout_snapshot(mobile)

    browser.close()

assert desktop_result["build"] == "C2-STABLE-1-F9U2b-APK-M4c", desktop_result
assert desktop_result["schema"] == "F9Q3e1-2", desktop_result
assert desktop_result["inspector"] and desktop_result["inspector"]["width"] >= 380, desktop_result
assert desktop_result["inspector"]["bottom"] <= desktop_result["viewport"]["height"] + 1, desktop_result
assert desktop_result["canvas"] and 225 <= desktop_result["canvas"]["width"] <= 235, desktop_result
assert desktop_result["ability"]["top"] >= desktop_result["canvas"]["bottom"], desktop_result
assert desktop_result["stats"]["top"] >= desktop_result["ability"]["bottom"], desktop_result
assert desktop_result["actionPanel"]["top"] >= desktop_result["stats"]["bottom"], desktop_result
assert desktop_result["actions"] == ["Muovi unità · 1", "Costruisci · Bunker", "Fine turno"], desktop_result
assert "Passa azione unità" not in desktop_result["pageText"], desktop_result
assert desktop_result["hand"]["left"] < 300, desktop_result
assert desktop_result["hand"]["right"] <= desktop_result["inspector"]["left"] + 1, desktop_result
assert not desktop_result["audioToggleOverlap"], desktop_result
assert desktop_result["toggleTexts"] == ["Carte animate ON", "Miniature FX ON", "Effetti ON"], desktop_result
assert all(item["rect"]["top"] == desktop_result["toggleButtons"][0]["rect"]["top"] for item in desktop_result["toggleButtons"]), desktop_result
assert desktop_result["precheck"]["ok"] and not desktop_result["precheck"]["problems"] and not desktop_result["precheck"]["warnings"], desktop_result

assert mobile_result["inspector"] and mobile_result["inspector"]["right"] <= mobile_result["viewport"]["width"] + 1, mobile_result
assert mobile_result["canvas"] and mobile_result["canvas"]["width"] >= 185, mobile_result
assert mobile_result["ability"]["top"] >= mobile_result["canvas"]["bottom"], mobile_result
assert mobile_result["actions"] == ["Muovi unità · 1", "Costruisci · Bunker", "Fine turno"], mobile_result
assert not mobile_result["audioToggleOverlap"], mobile_result
assert mobile_result["toggles"]["bottom"] <= mobile_result["dock"]["top"] + 1, mobile_result
assert not page_errors, page_errors
assert not console_errors, console_errors

print(json.dumps({"ok":True,"desktop":desktop_result,"mobile":mobile_result,"pageErrors":page_errors,"consoleErrors":console_errors}, ensure_ascii=False, indent=2))
