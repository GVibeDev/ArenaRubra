from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT = Path(__file__).resolve().parents[1]
errors = []
console_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        executable_path="/usr/bin/chromium",
        args=["--no-sandbox", "--allow-file-access-from-files"],
    )
    page = browser.new_page(viewport={"width": 900, "height": 600})
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.set_content(
        '<!doctype html><html><body>'
        '<div id="mapHandOverlay" data-render-signature="old"></div>'
        '<div id="cardZonePanel" data-render-signature="old"></div>'
        '<div id="mapActionDock" data-render-signature="old"></div>'
        '<div id="dock"></div>'
        '</body></html>'
    )
    page.evaluate("""() => {
      window.runtime = {
        active:true, missionId:'NXMSN01', missionName:'Civiltà Algoritmica', missionClass:'ordinary',
        cycle:1, status:'tracking', played:false, revealed:false, rewardPending:false,
        ready:false, readyCount:0, recoveryLocked:false,
        entries:{
          o1:{current:0,target:2,streak:0,satisfied:false,completed:false,detail:'0 / 2'},
          o2:{current:0,target:3,streak:0,satisfied:false,completed:false,detail:'0 / 3'},
          o3:{current:0,target:8,streak:0,satisfied:false,completed:false,detail:'0 / 8'}
        }
      };
      window.def = {objectives:[
        {id:'o1',text:'Controlla 2 PS'},
        {id:'o2',text:'Costruisci 3 strutture'},
        {id:'o3',text:'Accumula 8 ENE'}
      ]};
      window.state = {
        currentPlayer:1, turn:1, modes:{1:'human'}, winner:null, handLocked:{1:0}, energy:{1:8},
        missions:{1:runtime}, hand:{1:[{cardUid:'m1',sourceType:'mission'}]}, missionPendingReward:null
      };
      window.missionRuntime = () => runtime;
      window.missionDefinitionById = () => def;
      window.missionObjectivesFor = d => d.objectives;
      window.missionCardForSide = () => state.hand[1][0];
      window.missionCanPlayOrdinary = () => ({ok:runtime.ready, reason:runtime.ready ? 'Missione ordinaria pronta' : 'Obiettivi incompleti'});
      window.playerHandLocked = () => false;
      window.handCardBlocked = () => false;
      window.escapeHtml = s => String(s);
      window.renderAll = () => { document.getElementById('dock').innerHTML = missionUiCompactPanelHtml(1); };
    }""")
    page.add_script_tag(path=str(ROOT / "src/mission_ui.js"))
    before = page.evaluate("""() => {
      document.getElementById('dock').innerHTML = missionUiCompactPanelHtml(1);
      return {sig:missionUiRenderSignature(1), text:document.getElementById('dock').innerText};
    }""")
    page.evaluate("""() => {
      runtime.entries.o1={current:2,target:2,streak:0,satisfied:true,completed:true,detail:'2 / 2'};
      runtime.entries.o2={current:3,target:3,streak:0,satisfied:true,completed:true,detail:'3 / 3'};
      runtime.entries.o3={current:8,target:8,streak:0,satisfied:true,completed:true,detail:'8 / 8'};
      runtime.ready=true; runtime.readyCount=3; runtime.status='ready';
      missionUiHandleGameEvent({type:'MISSION_READY'});
      renderAll();
    }""")
    ready = page.evaluate("""() => ({
      sig:missionUiRenderSignature(1),
      text:document.getElementById('dock').innerText,
      cleared:[
        document.getElementById('mapHandOverlay').dataset.renderSignature || '',
        document.getElementById('cardZonePanel').dataset.renderSignature || '',
        document.getElementById('mapActionDock').dataset.renderSignature || ''
      ]
    })""")
    assert before["sig"] != ready["sig"] and "PRONTA" in ready["text"] and "2 / 2" in ready["text"], ready
    assert ready["cleared"] == ["", "", ""], ready
    page.evaluate("missionUiRequestPlay(1)")
    pending = page.evaluate("""() => ({
      sig:missionUiRenderSignature(1),
      confirm:document.querySelector('.mapMissionCompactConfirm') !== null,
      text:document.getElementById('dock').innerText
    })""")
    assert pending["sig"] != ready["sig"] and pending["confirm"] and "Conferma" in pending["text"], pending
    browser.close()

print(json.dumps({
    "ok": True,
    "before": before,
    "ready": ready,
    "pending": pending,
    "pageErrors": errors,
    "consoleErrors": console_errors,
}, ensure_ascii=False, indent=2))
assert not errors, errors
assert not console_errors, console_errors
