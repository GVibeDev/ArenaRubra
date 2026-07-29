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
    page.wait_for_function("typeof renderF9U1bComparisonBars === 'function' && typeof BUILD_INFO !== 'undefined'")
    page.evaluate("""() => {
      const splash=document.getElementById('appSplash');
      if (splash) { splash.style.display='none'; splash.style.pointerEvents='none'; }
      if (typeof initializeArenaAppShell === 'function') initializeArenaAppShell();
      if (typeof setAppScreen === 'function') setAppScreen(ARENA_APP_SCREENS.GAME);
    }""")


def set_ffa_snapshot(page):
    return page.evaluate("""() => {
      state={
        factions:{1:'Nexus',2:'Exordium',3:'Liberti',4:'Nexus'},
        players:{1:{id:1},2:{id:2},3:{id:3,eliminated:true},4:{id:4}},
        cells:[
          {coord:[0,0,0],ps:true,control:1},{coord:[1,0,-1],ps:true,control:1},
          {coord:[0,1,-1],ps:true,control:2},{coord:[-1,1,0],ps:true,control:4},
          {coord:[0,-1,1],ps:true,control:null}
        ],
        units:[
          {uid:'hq1',side:1,type:'QG',alive:true,currentHp:20,pos:[3,0,-3]},
          {uid:'u1',side:1,type:'Fanteria',alive:true,currentHp:3,pos:[0,0,0]},
          {uid:'s1',side:1,type:'Struttura',alive:true,currentHp:5,pos:[1,-1,0]},
          {uid:'u2',side:2,type:'Veicolo',alive:true,currentHp:4,pos:[0,1,-1]},
          {uid:'dead3',side:3,type:'Fanteria',alive:false,currentHp:0,pos:null},
          {uid:'s4',side:4,type:'Struttura',alive:true,currentHp:2,pos:[-1,1,0]}
        ]
      };
      renderF9U1bComparisonBars(true);
      const rect=id=>document.getElementById(id)?.getBoundingClientRect().toJSON() || null;
      const segmentData=id=>[...document.getElementById(id).children].map(el=>({
        side:el.dataset.side || 'neutral', value:Number(el.dataset.value || 0), hidden:el.hidden,
        width:el.getBoundingClientRect().width, title:el.title, className:el.className
      }));
      return {
        build:BUILD_INFO.version,
        snapshot:f9u1bComparisonSnapshot(),
        psSegments:segmentData('gameComparisonPsSegments'),
        unitSegments:segmentData('gameComparisonUnitSegments'),
        psCounters:document.getElementById('gameComparisonPsCounters').innerText.trim(),
        unitCounters:document.getElementById('gameComparisonUnitCounters').innerText.trim(),
        bars:rect('gameComparisonBars'),
        audio:document.querySelector('.arenaMusicControlGame')?.getBoundingClientRect().toJSON() || null,
        dock:rect('mapActionDock')
      };
    }""")


page_errors=[]
console_errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--allow-file-access-from-files'])

    desktop_context=browser.new_context(viewport={'width':1440,'height':960})
    desktop=desktop_context.new_page()
    desktop.set_default_timeout(8000)
    desktop.on('pageerror',lambda exc:page_errors.append(f'desktop: {exc}'))
    desktop.on('console',lambda msg:console_errors.append(f'desktop: {msg.text}') if msg.type=='error' else None)
    load_app(desktop)
    desktop_result=set_ffa_snapshot(desktop)
    updated=desktop.evaluate("""() => {
      state.cells[4].control=2;
      state.units.push({uid:'u2b',side:2,type:'Struttura',alive:true,currentHp:3,pos:[2,-1,-1]});
      renderF9U1bComparisonBars();
      return {
        ps:document.getElementById('gameComparisonPsCounters').innerText.trim(),
        units:document.getElementById('gameComparisonUnitCounters').innerText.trim(),
        snapshot:f9u1bComparisonSnapshot()
      };
    }""")

    # Inspector con sola abilità passiva: nessun pulsante fittizio deve apparire.
    inspector=desktop.evaluate("""() => {
      newGame({
        mapId:'map1_starter', factions:{1:'Nexus',2:'Exordium'},
        selectedCommanders:{1:'NXCMD01',2:'EX0B00'},
        selectedDecks:{
          1:{mode:'custom',savedKey:'Nexus::NXCMD01::nexus-avatex-civilta-algoritmica'},
          2:{mode:'custom',savedKey:'Exordium::EX0B00::doppio-assalto-imperiale'}
        },
        modes:{1:'human',2:'human'},autoResignEnabled:false,aiMode:'advanced',pacePreset:'standard',gameScaleMode:'large_scale',matchSeed:'F9U1B-INSPECTOR'
      });
      const bp=BLUEPRINTS.find(item=>item.faction==='Nexus' && item.type!=='QG' && item.ability && item.ability.passive)
        || BLUEPRINTS.find(item=>item.faction==='Nexus' && item.type!=='QG');
      const coord=state.cells.map(cell=>cell.coord).find(cell=>!getUnitAt(cell) && hexDistance(cell,getHq(1).pos)<=2);
      const unit=createUnitFromBlueprint(bp,1); unit.pos=[...coord]; unit.acted=false; state.units.push(unit); state.currentPlayer=1;
      gameScreenInspectUnit(unit); renderAll(); expandSelectedUnitFloat();
      const slot=document.getElementById('selectedUnitPrimaryAbilitySlot');
      return {
        name:unit.name,
        passive:Boolean(unit.ability && unit.ability.passive),
        title:document.getElementById('selectedUnitFloatTitle').textContent.trim(),
        slotHidden:slot.hidden,
        abilityButtons:slot.querySelectorAll('button').length,
        stats:[...document.querySelectorAll('.selectedUnitStatsTable td')].map(td=>td.textContent.trim()),
        actions:[...document.querySelectorAll('#actionPanel button')].map(btn=>btn.textContent.trim()),
        precheck:runPrecheck({quiet:true,source:'f9u1b-browser'})
      };
    }""")

    mobile_context=browser.new_context(viewport={'width':820,'height':480},is_mobile=True)
    mobile=mobile_context.new_page()
    mobile.set_default_timeout(8000)
    mobile.on('pageerror',lambda exc:page_errors.append(f'mobile: {exc}'))
    mobile.on('console',lambda msg:console_errors.append(f'mobile: {msg.text}') if msg.type=='error' else None)
    load_app(mobile)
    mobile_result=set_ffa_snapshot(mobile)
    browser.close()

assert desktop_result['build']=='C2-STABLE-1-F9U2b-APK-M4c',desktop_result
assert desktop_result['snapshot']['psTotal']==5,desktop_result
assert desktop_result['snapshot']['psNeutral']==1,desktop_result
assert desktop_result['snapshot']['unitTotal']==4,desktop_result
assert desktop_result['psCounters']=='G1 2\nG2 1\nG3 0\nG4 1\nN 1',desktop_result
assert desktop_result['unitCounters']=='G1 2\nG2 1\nG3 0\nG4 1',desktop_result
assert desktop_result['psSegments'][0]['width']>desktop_result['psSegments'][1]['width']*1.8,desktop_result
assert any('isDuplicateFaction' in item['className'] for item in desktop_result['psSegments'] if item['side'] in {'1','4'}),desktop_result
assert updated['snapshot']['psNeutral']==0,updated
assert updated['snapshot']['players'][1]['ps']==2,updated
assert updated['snapshot']['players'][1]['units']==2,updated
assert 'G2 2' in updated['ps'] and 'G2 2' in updated['units'],updated
assert inspector['passive'],inspector
assert inspector['title']==inspector['name'],inspector
assert inspector['slotHidden'] and inspector['abilityButtons']==0,inspector
assert len(inspector['stats'])==3,inspector
assert inspector['actions']==['Muovi unità · 1','Costruisci · Bunker','Fine turno'],inspector
assert inspector['precheck']['ok'] and not inspector['precheck']['problems'] and not inspector['precheck']['warnings'],inspector
assert mobile_result['bars'] and mobile_result['bars']['width']>700,mobile_result
assert mobile_result['audio'] and mobile_result['bars']['top']>=mobile_result['audio']['bottom']-1,mobile_result
assert mobile_result['dock'] and mobile_result['bars']['bottom']<=mobile_result['dock']['top']+1,mobile_result
assert not page_errors,page_errors
assert not console_errors,console_errors
print(json.dumps({'ok':True,'desktop':desktop_result,'updated':updated,'inspector':inspector,'mobile':mobile_result},ensure_ascii=False,indent=2))
