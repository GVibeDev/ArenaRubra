from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT = Path(__file__).resolve().parents[1]
page_errors = []
console_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox", "--allow-file-access-from-files"])
    page = browser.new_page(viewport={"width": 1100, "height": 720})
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.set_content("""<!doctype html><html><body>
      <button data-arena-token-fx-toggle>FX token ON</button>
      <button data-arena-sfx-toggle>SFX ON</button>
      <input data-arena-sfx-volume type=range value=38><output data-arena-sfx-volume-output>38%</output>
      <div id=board></div><div id=mapOverlayLayer class=mapOverlayLayer></div>
    </body></html>""")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    page.add_script_tag(content="""
      var state={events:[],eventSeq:0,units:[]};
      var __settings={};
      function arenaStorageReadSettings(){return JSON.parse(JSON.stringify(__settings));}
      function arenaStorageWriteSettings(v){__settings=JSON.parse(JSON.stringify(v));return true;}
      var CENTER_X=0,CENTER_Y=0,HEX_SIZE=48;
    """)
    for rel in [
        "data/units_base.js", "data/unit_taxonomy.js", "data/token_fx_profiles.js",
        "src/events.js", "src/token_fx.js", "src/sfx_manager.js"
    ]:
        page.add_script_tag(path=str(ROOT / rel))
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.wait_for_timeout(60)

    result = page.evaluate("""async () => {
      arenaSfxSetEnabledF9O5a(false, {persist:false});
      tokenFxSetModeF9O5a('on', {persist:false});
      state.units = [
        {uid:'fx-a',id:'NX2B01',name:'Droide',side:1,faction:'Nexus',type:'Fanteria',unitClass:'starter',alive:true,pos:[0,0,0],tokenFxProfile:'energy',tokenAnimationProfile:'energy',sfxProfile:'energy'},
        {uid:'fx-b',id:'EX2B04',name:'Artiglieria',side:2,faction:'Exordium',type:'Veicolo',unitClass:'elite',alive:true,pos:[1,-1,0],tokenFxProfile:'ballistic_heavy',tokenAnimationProfile:'ballistic_heavy',sfxProfile:'ballistic_heavy'}
      ];
      const board = document.getElementById('board');
      const overlay = document.getElementById('mapOverlayLayer');
      const makeHex = (key,left,top,uid) => {
        const hex = document.createElement('div');
        hex.className='hex'; hex.dataset.coordKey=key; hex.style.position='absolute'; hex.style.left=left+'px'; hex.style.top=top+'px';
        if(uid){ const token=document.createElement('div'); token.className='unitToken has-token-art token-art-loaded faction-nexus'; token.dataset.unitUid=uid; token.innerHTML='<span class="tokenArt" style="background-image:linear-gradient(#fff,#333)"></span><span class="symbol">◆</span><span class="mini">1</span>'; hex.appendChild(token); }
        board.appendChild(hex); return hex;
      };
      makeHex('0,0,0',200,180,'fx-a');
      makeHex('1,-1,0',330,180,'fx-b');

      emitGameEvent({type:EventTypes.UNIT_ATTACKED,data:{attackerId:'fx-a',attackerPos:[0,0,0],defenderId:'fx-b',defenderPos:[1,-1,0],amount:2}});
      await new Promise(r=>setTimeout(r,70));
      const attack = {projectiles:overlay.querySelectorAll('.tokenFxProjectile').length,recoil:document.querySelector('[data-unit-uid="fx-a"]').classList.contains('token-fx-recoil')};

      emitGameEvent({type:EventTypes.UNIT_DAMAGED,data:{targetId:'fx-b',targetPos:[1,-1,0],defLoss:1,hpLoss:0,damageKind:'attack'}});
      await new Promise(r=>setTimeout(r,55));
      const impact = overlay.querySelectorAll('.tokenFxBurst').length;

      emitGameEvent({type:EventTypes.ABILITY_USED,data:{unitId:'fx-a',targetId:'fx-b',abilityKind:'damage'}});
      await new Promise(r=>setTimeout(r,55));
      const ability = overlay.querySelectorAll('.tokenFxAbilityPulse').length;

      emitGameEvent({type:EventTypes.UNIT_DESTROYED,data:{unitId:'fx-b',unitName:'Artiglieria',side:2,faction:'Exordium',unitType:'Veicolo'}});
      await new Promise(r=>setTimeout(r,55));
      const destruction = {ghosts:overlay.querySelectorAll('.tokenFxDeathGhost').length,bursts:overlay.querySelectorAll('.tokenFx-destruction').length};

      const beforeMode = tokenFxDiagnosticsF9O5a().mode;
      document.querySelector('[data-arena-token-fx-toggle]').click();
      const afterMode = tokenFxDiagnosticsF9O5a().mode;
      document.querySelector('[data-arena-sfx-toggle]').click();
      const sfxEnabled = arenaSfxDiagnosticsF9O5a().enabled;
      emitGameEvent({type:EventTypes.ABILITY_USED,data:{unitId:'fx-a',targetId:'fx-b',abilityKind:'damage'}});
      await new Promise(r=>setTimeout(r,90));
      return {attack,impact,ability,destruction,beforeMode,afterMode,sfxEnabled,fxDiag:tokenFxDiagnosticsF9O5a(),sfxDiag:arenaSfxDiagnosticsF9O5a()};
    }""")
    page.wait_for_timeout(800)
    result["remainingFx"] = page.locator(".tokenFxProjectile,.tokenFxBurst,.tokenFxAbilityPulse,.tokenFxDeathGhost").count()
    browser.close()

assert result["attack"]["projectiles"] >= 1, result
assert result["attack"]["recoil"] is True, result
assert result["impact"] >= 1, result
assert result["ability"] >= 2, result
assert result["destruction"]["ghosts"] >= 1, result
assert result["destruction"]["bursts"] >= 1, result
assert result["beforeMode"] == "on", result
assert result["afterMode"] == "reduced", result
assert result["sfxEnabled"] is True, result
assert result["sfxDiag"]["played"] >= 1, result
assert result["remainingFx"] == 0, result
assert not page_errors, page_errors
assert not console_errors, console_errors
print(json.dumps({"ok": True, "result": result, "pageErrors": page_errors, "consoleErrors": console_errors}, indent=2))
