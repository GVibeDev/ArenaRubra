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
    page = browser.new_page(viewport={"width": 1365, "height": 900})
    page.set_default_timeout(6000)
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    calibration = ROOT / "css/renderer_calibration_lab.css"
    if calibration.exists(): page.add_style_tag(path=str(calibration))
    for rel in scripts: page.add_script_tag(path=str(ROOT / rel))
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.evaluate("""() => {
      const splash=document.getElementById('appSplash');
      if(splash){ splash.hidden=true; splash.style.display='none'; splash.setAttribute('aria-hidden','true'); }
      setAppScreen(ARENA_APP_SCREENS.GAME);
      state = {
        turn:24,
        modes:{1:'human',2:'bot'},
        factions:{1:'Exordium',2:'Nexus'},
        playerIds:[1,2],
        events:[],eventSeq:0,
        units:[],cells:[],pressure:{1:5,2:0},energy:{1:3,2:2},
        matchRecorded:false
      };
    }""")

    assert page.evaluate("BUILD_INFO.version") == "C2-STABLE-1-F9V3b-APK-M4c"

    page.evaluate("""() => emitGameEvent({
      type:EventTypes.VICTORY,
      data:{winner:1,winnerFaction:'Exordium',winType:'pressione',message:'Vittoria Giocatore 1 per Pressione Strategica.'}
    })""")
    page.wait_for_timeout(80)
    victory = page.evaluate("""() => ({
      visible:!document.getElementById('arenaResultModalRootF9V3a')?.hidden,
      text:document.getElementById('arenaResultModalRootF9V3a')?.innerText || '',
      actions:[...document.querySelectorAll('#arenaResultModalRootF9V3a [data-result-action]')].map(el=>el.dataset.resultAction),
      screen:document.body.dataset.appScreen
    })""")
    assert victory["visible"] is True, victory
    assert "VITTORIA" in victory["text"] and "Giocatore 1" in victory["text"] and "Exordium" in victory["text"], victory
    assert "Round 24" in victory["text"] and "Pressione Strategica" in victory["text"], victory
    assert all(action in victory["actions"] for action in ["log","telemetry","statistics","main-menu","new-game"]), victory
    assert "academy" not in victory["actions"], victory

    # Nuova partita riusa il Setup esistente invece di avviare direttamente un match.
    page.locator('#arenaResultModalRootF9V3a [data-result-action="new-game"]').click()
    page.wait_for_timeout(80)
    assert page.evaluate("document.body.dataset.appScreen") == "setup"

    # In un single-human match, la vittoria del Bot diventa SCONFITTA ma espone comunque vincitore e fazione.
    page.evaluate("""() => {
      setAppScreen(ARENA_APP_SCREENS.GAME);
      state.turn=12;
      emitGameEvent({type:EventTypes.VICTORY,data:{winner:2,winnerFaction:'Nexus',winType:'qg',message:'Vittoria Giocatore 2 per QG.'}});
    }""")
    page.wait_for_timeout(80)
    defeat = page.evaluate("document.getElementById('arenaResultModalRootF9V3a')?.innerText || ''")
    assert "SCONFITTA" in defeat and "Giocatore 2" in defeat and "Nexus" in defeat, defeat

    # Pareggio terminale.
    page.evaluate("""() => {
      arenaResultModalHideF9V3a({restoreFocus:false});
      emitGameEvent({type:EventTypes.VICTORY,data:{winner:null,winType:'pareggio',message:'Pareggio tecnico.'}});
    }""")
    page.wait_for_timeout(80)
    draw = page.evaluate("document.getElementById('arenaResultModalRootF9V3a')?.innerText || ''")
    assert "PAREGGIO" in draw, draw
    browser.close()

unexpected = [msg for msg in console_errors if not msg.startswith("Arena AppShell: inizializzazione GameScreen non bloccante fallita")]
assert not page_errors, page_errors
assert not unexpected, unexpected
print(json.dumps({
    "ok": True,
    "build": "C2-STABLE-1-F9V3b-APK-M4c",
    "normalVictory": True,
    "singleHumanDefeat": True,
    "draw": True,
    "winnerIdentity": True,
    "newGameRoutesToSetup": True
}, ensure_ascii=False, indent=2))
