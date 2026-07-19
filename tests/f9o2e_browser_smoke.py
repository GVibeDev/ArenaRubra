from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT = Path(__file__).resolve().parents[1]
errors=[]
console_errors=[]

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--allow-file-access-from-files'])
    page=browser.new_page(viewport={"width":760,"height":520}, has_touch=True)
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type=='error' else None)
    page.set_content('<!doctype html><html><body><div id="dock"></div></body></html>')
    page.add_style_tag(path=str(ROOT/'css/style.css'))
    page.evaluate('''() => {
      const runtime={active:true,missionId:'NXMSN01',missionName:'Civiltà Algoritmica',missionClass:'ordinary',played:false,ready:true,readyCount:3,cycle:1,
        entries:{o1:{completed:true,satisfied:true,current:2,target:2,streak:1},o2:{completed:true,satisfied:true,current:3,target:3},o3:{completed:true,satisfied:true,current:'8 ENE · 6 carte',target:'8 ENE · 6 carte'}}};
      const def={missionClass:'ordinary',objectives:[{id:'o1',text:'Controlla 2 PS',consecutive:1},{id:'o2',text:'Costruisci 3 strutture'},{id:'o3',text:'8 ENE e 6 carte'}],reward:{text:'Bonus'}};
      window.state={currentPlayer:1,modes:{1:'human'},winner:null,handLocked:{1:0},missions:{1:runtime},factions:{1:'Nexus'}};
      window.botRunning=false;
      window.missionRuntime=()=>runtime;
      window.missionDefinitionById=()=>def;
      window.missionObjectivesFor=d=>d.objectives;
      window.missionCardForSide=()=>({sourceType:'mission',missionId:'NXMSN01'});
      window.missionCanPlayOrdinary=()=>({ok:true,reason:'Missione ordinaria pronta'});
      window.playerHandLocked=()=>false;
      window.handCardBlocked=()=>false;
      window.escapeHtml=s=>String(s);
      window.renderAll=()=>{document.getElementById('dock').innerHTML=missionUiCompactPanelHtml(1)};
      window.missionPlayMission=()=>{window.__played=true; return true};
    }''')
    page.add_script_tag(path=str(ROOT/'src/mission_ui.js'))
    page.evaluate('''() => { document.getElementById('dock').innerHTML=missionUiCompactPanelHtml(1); }''')
    before=page.evaluate('''() => ({
      rows:document.querySelectorAll('.mapMissionCompactRow').length,
      ready:document.querySelector('.mapMissionCompact-ready')!==null,
      playDisabled:document.querySelector('.mapMissionCompactActions button').disabled,
      display:getComputedStyle(document.querySelector('.mapMissionCompact')).display
    })''')
    assert before['rows']==3 and before['ready'] and not before['playDisabled'], before
    page.evaluate('''() => missionUiActivateCard(1,{source:'browser_smoke'})''')
    after=page.evaluate('''() => ({
      confirm:document.querySelector('.mapMissionCompactConfirm')!==null,
      buttons:[...document.querySelectorAll('.mapMissionCompactConfirm button')].map(b=>b.textContent.trim())
    })''')
    assert after['confirm'] and 'Conferma' in after['buttons'], after
    page.click('.mapMissionCompactConfirm button:last-child')
    assert page.evaluate('window.__played===true')
    browser.close()

print(json.dumps({'ok':True,'before':before,'after':after,'pageErrors':errors,'consoleErrors':console_errors},ensure_ascii=False,indent=2))
assert not errors, errors
assert not console_errors, console_errors
