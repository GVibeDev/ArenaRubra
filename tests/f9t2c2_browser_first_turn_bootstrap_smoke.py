from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re
ROOT=Path(__file__).resolve().parents[1]
errors=[]; console_errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path="/usr/bin/chromium",args=["--no-sandbox","--allow-file-access-from-files"])
    page=browser.new_page(viewport={"width":1366,"height":900}); page.set_default_timeout(120000)
    page.on("pageerror",lambda exc:errors.append(str(exc)))
    page.on("console",lambda msg:console_errors.append(msg.text) if msg.type=="error" else None)
    index=(ROOT/"index.html").read_text(encoding="utf-8"); scripts=re.findall(r'<script\s+src="([^"]+)"\s*></script>',index)
    html=re.sub(r'<script\s+src="[^"]+"\s*></script>','',index); html=re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>','',html)
    page.set_content(html,wait_until="load"); page.add_style_tag(path=str(ROOT/"css/style.css"))
    for rel in scripts: page.add_script_tag(path=str(ROOT/rel))
    page.wait_for_function("typeof newGame==='function' && typeof runBotTurn==='function' && typeof expertPrepareMatchF9T2c2==='function'")
    result=page.evaluate("""async () => {
      const splash=document.getElementById('appSplash'); if(splash){splash.style.display='none';splash.style.pointerEvents='none'}
      const initiative=document.getElementById('initiativeMode');
      const common={mapId:'map1_starter',factions:{1:'Nexus',2:'Exordium'},selectedCommanders:{1:'NXCMD01',2:'EX0B00'},selectedDecks:{1:{mode:'custom',savedKey:'Nexus::NXCMD01::bastione-mobile'},2:{mode:'custom',savedKey:'Exordium::EX0B00::breccia-cremisi'}},autoResignEnabled:false,aiMode:'expert',pacePreset:'standard',gameScaleMode:'large_scale'};
      // Avvia un primo turno G1 e sostituisce subito il match: il vecchio finally non deve chiudere il nuovo turno G2.
      if(initiative) initiative.value='1';
      newGame({...common,modes:{1:'bot',2:'human'},matchSeed:'F9T2C2-STALE-OLD'});
      const oldMatchId=state.matchId;
      await new Promise(resolve=>setTimeout(resolve,40));
      if(initiative) initiative.value='2';
      newGame({...common,modes:{1:'human',2:'bot'},matchSeed:'F9T2C2-G2-BOOTSTRAP'});
      const newMatchId=state.matchId;
      const deadline=Date.now()+30000;
      while(Date.now()<deadline){
        const expert=state.matchTelemetry&&state.matchTelemetry.expertAi;
        if(expert&&expert.totals&&expert.totals.turnsCompleted>=1&&!botRunning) break;
        await new Promise(resolve=>setTimeout(resolve,50));
      }
      const expert=state.matchTelemetry.expertAi;
      const turns=expert.turns.map(x=>JSON.parse(JSON.stringify(x)));
      return {build:BUILD_INFO.version,oldMatchId,newMatchId,currentPlayer:state.currentPlayer,botRunning:Boolean(botRunning),active:Object.keys(expertRuntimeStateF9T1.activeByPlayer).length,totals:JSON.parse(JSON.stringify(expert.totals)),turns,modules:JSON.parse(JSON.stringify(expert.modules)),persistent:JSON.parse(JSON.stringify(state.expertAiF9T1||{}))};
    }""")
    browser.close()
assert result['build']=='C2-STABLE-1-F9T2d3-APK-M4c',result
assert result['oldMatchId']!=result['newMatchId'],result
assert result['botRunning'] is False and result['active']==0,result
assert result['totals']['turnsStarted']==1,result
assert result['totals']['contextsCreated']==1,result
assert result['totals']['modulesRouted']==1,result
assert result['totals']['turnsCompleted']==1,result
assert len(result['turns'])==1,result
turn=result['turns'][0]
assert turn['side']==2 and turn['status']=='completed',turn
assert turn['moduleId']=='expert-exordium-f9t2d3' and turn['context'] is not None,turn
assert turn.get('decisionRecordsStored',0)==len(turn.get('decisions',[])),turn
assert result['persistent']['lastTurn']['moduleId']=='expert-exordium-f9t2d3',result
assert errors==[],errors
assert console_errors==[],console_errors
print(json.dumps({'status':'PASS','build':result['build'],'oldMatchId':result['oldMatchId'],'newMatchId':result['newMatchId'],'turnSide':turn['side'],'moduleId':turn['moduleId'],'started':result['totals']['turnsStarted'],'contexts':result['totals']['contextsCreated'],'routed':result['totals']['modulesRouted'],'completed':result['totals']['turnsCompleted'],'pageErrors':len(errors),'consoleErrors':len(console_errors)},ensure_ascii=False,indent=2))
