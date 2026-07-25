from pathlib import Path
from playwright.sync_api import sync_playwright
import json, re

ROOT = Path(__file__).resolve().parents[1]
index = (ROOT / 'index.html').read_text(encoding='utf-8')
scripts = re.findall(r'<script\s+src="([^"]+)"\s*></script>', index)
html = re.sub(r'<script\s+src="[^"]+"\s*></script>', '', index)
html = re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>', '', html)
page_errors = []
console_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        executable_path='/usr/bin/chromium',
        args=['--no-sandbox', '--allow-file-access-from-files'],
    )
    page = browser.new_page(viewport={'width': 1280, 'height': 820}, has_touch=True)
    page.on('pageerror', lambda exc: page_errors.append(str(exc)))
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
    page.set_content(html, wait_until='load')
    page.add_style_tag(path=str(ROOT / 'css/style.css'))
    page.add_style_tag(path=str(ROOT / 'css/renderer_calibration_lab.css'))
    for rel in scripts:
        page.add_script_tag(path=str(ROOT / rel))
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.wait_for_timeout(120)
    page.evaluate("() => newGame({modes:{1:'human',2:'human'},factions:{1:'Nexus',2:'Exordium'},aiMode:'advanced',pacePreset:'standard'})")
    page.wait_for_timeout(80)

    initial = page.evaluate("""() => {
      const def = MISSION_DEFINITIONS.find(item => item.id === 'NXMSN01');
      const card = buildMissionCardFromDefinition(def);
      card.cardUid = 'mission-f9o4d-full';
      card.ownerSide = 1;
      state.currentPlayer = 1;
      state.turn = 1;
      state.hand[1] = [card, ...(state.hand[1] || []).filter(item => item && item.sourceType !== 'mission')];
      state.missions = state.missions || {1:null,2:null};
      state.missions[1] = createMissionRuntime(1, def);
      MISSION_UI_STATE.playPendingSide = 0;
      missionUiInvalidate('full_app_setup');
      renderAll();
      return {
        build: BUILD_INFO.version,
        handSig: document.getElementById('mapHandOverlay').dataset.renderSignature || '',
        panelSig: document.getElementById('cardZonePanel').dataset.renderSignature || '',
        dockSig: document.getElementById('mapActionDock').dataset.renderSignature || '',
        panelText: document.getElementById('cardZonePanel').innerText,
        dockText: document.getElementById('mapActionDock').innerText,
        ready: state.missions[1].ready,
      };
    }""")

    ready = page.evaluate("""() => {
      const runtime = state.missions[1];
      state.energy[1] = 8;
      state.cells.filter(cell => cell.ps).slice(0, 2).forEach(cell => { cell.control = 1; });
      runtime.counters.structuresBuiltNearObjective = 3;
      missionEvaluateSide(1, 'f9o4d_full_app_test', {checkpoint:'turn_start', side:1, round:state.turn});
      missionUiHandleGameEvent({type:'MISSION_READY', data:{player:1, missionId:runtime.missionId}});
      renderAll();
      return {
        handSig: document.getElementById('mapHandOverlay').dataset.renderSignature || '',
        panelSig: document.getElementById('cardZonePanel').dataset.renderSignature || '',
        dockSig: document.getElementById('mapActionDock').dataset.renderSignature || '',
        panelText: document.getElementById('cardZonePanel').innerText,
        dockText: document.getElementById('mapActionDock').innerText,
        ready: runtime.ready,
        values: Array.from(document.querySelectorAll('#mapActionDock .mapMissionCompactValue')).map(node => node.textContent.trim()),
      };
    }""")

    pending = page.evaluate("""() => {
      const requested = missionUiRequestPlay(1);
      return {
        requested,
        handSig: document.getElementById('mapHandOverlay').dataset.renderSignature || '',
        panelSig: document.getElementById('cardZonePanel').dataset.renderSignature || '',
        dockSig: document.getElementById('mapActionDock').dataset.renderSignature || '',
        panelConfirm: document.querySelector('#cardZonePanel .missionRevealConfirm') !== null,
        dockConfirm: document.querySelector('#mapActionDock .mapMissionCompactConfirm') !== null,
        panelText: document.getElementById('cardZonePanel').innerText,
        dockText: document.getElementById('mapActionDock').innerText,
      };
    }""")

    browser.close()

ignored_prefix = 'Arena AppShell: inizializzazione GameScreen non bloccante fallita'
unexpected_console_errors = [msg for msg in console_errors if not msg.startswith(ignored_prefix)]
result = {
    'ok': True,
    'initial': initial,
    'ready': ready,
    'pending': pending,
    'pageErrors': page_errors,
    'consoleErrors': unexpected_console_errors,
    'ignoredBaselineConsoleErrors': len(console_errors) - len(unexpected_console_errors),
}
print(json.dumps(result, ensure_ascii=False, indent=2))

assert initial['build'] in {'C2-STABLE-1-F9O4d-APK-M4c','C2-STABLE-1-F9O4f-APK-M4c','C2-STABLE-1-F9O4e-APK-M4c','C2-STABLE-1-F9O5-APK-M4c','C2-STABLE-1-F9O5a-APK-M4c','C2-STABLE-1-F9O5b-APK-M4c','C2-STABLE-1-F9O6-APK-M4c','C2-STABLE-1-F9O7e-APK-M4c'}, initial
assert not initial['ready'] and 'IN CORSO' in initial['dockText'], initial
assert ready['ready'] and 'PRONTA' in ready['dockText'] and 'PRONTA' in ready['panelText'], ready
assert len(ready['values']) == 3 and ready['values'][0].startswith('2') and ready['values'][1] == '3 / 3' and '8 ENE' in ready['values'][2], ready
assert initial['handSig'] != ready['handSig'], (initial, ready)
assert initial['panelSig'] != ready['panelSig'], (initial, ready)
assert initial['dockSig'] != ready['dockSig'], (initial, ready)
assert pending['requested'] and pending['panelConfirm'] and pending['dockConfirm'], pending
assert ready['handSig'] != pending['handSig'], (ready, pending)
assert ready['panelSig'] != pending['panelSig'], (ready, pending)
assert ready['dockSig'] != pending['dockSig'], (ready, pending)
assert not page_errors, page_errors
assert not unexpected_console_errors, unexpected_console_errors
