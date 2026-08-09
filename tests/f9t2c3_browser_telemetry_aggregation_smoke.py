from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re
ROOT=Path(__file__).resolve().parents[1]
errors=[]; console_errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1366,'height':900}); page.set_default_timeout(120000)
    page.on('pageerror',lambda exc:errors.append(str(exc)))
    page.on('console',lambda msg:console_errors.append(msg.text) if msg.type=='error' else None)
    index=(ROOT/'index.html').read_text(encoding='utf-8'); scripts=re.findall(r'<script\s+src="([^"]+)"\s*></script>',index)
    html=re.sub(r'<script\s+src="[^"]+"\s*></script>','',index); html=re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>','',html)
    page.set_content(html,wait_until='load'); page.add_style_tag(path=str(ROOT/'css/style.css'))
    for rel in scripts: page.add_script_tag(path=str(ROOT/rel))
    page.wait_for_function("typeof newGame==='function' && typeof expertCompleteTurnF9T1==='function' && typeof expertExordiumEmitCandidateAuditBatchF9T2c3==='function'")
    result=page.evaluate("""() => {
      const splash=document.getElementById('appSplash'); if(splash){splash.style.display='none';splash.style.pointerEvents='none'}
      newGame({mapId:'map1_starter',factions:{1:'Exordium',2:'Nexus'},selectedCommanders:{1:'EX0B00',2:'NXCMD01'},selectedDecks:{1:{mode:'custom',savedKey:'Exordium::EX0B00::breccia-cremisi'},2:{mode:'custom',savedKey:'Nexus::NXCMD01::bastione-mobile'}},modes:{1:'human',2:'human'},autoResignEnabled:false,aiMode:'expert',pacePreset:'standard',gameScaleMode:'large_scale',matchSeed:'AR-f9t2c3-aggregation'});
      state.currentPlayer=1; state.aiMode='expert'; state.turn=10;
      initializeMatchTelemetry();
      const ps=state.cells.find(c=>c.ps); if(!ps)throw new Error('PS assente'); ps.control=1;
      state.units=state.units.filter(u=>u.type==='QG');
      const bp=BLUEPRINTS.find(x=>x.faction==='Exordium'&&x.type!=='Struttura'&&x.type!=='QG');
      const occupier=createUnitFromBlueprint(bp,1); occupier.pos=[...ps.coord]; occupier.alive=true; occupier.acted=true; state.units.push(occupier);
      const sequence=91;
      const runtime={sequence,matchId:state.matchId,player:1,turn:10,faction:'Exordium',startedAt:performance.now(),heapStart:null,cache:new Map(),cacheHits:0,cacheMisses:0,candidateCount:0,discardedCandidates:0,candidateAuditCount:0,candidateAuditCountByScanner:{relay:0,clearOccupyFortify:0,forwardPivot:0},candidateRejectionCounts:{},candidateRejectionCountsByScanner:{relay:{},clearOccupyFortify:{},forwardPivot:{}},territorialConversionMetrics:{psClearedDuringExpertPlan:0,psClearedDirectlyByExpertStep:0,psOccupiedAfterClear:0,psFortifiedAfterClear:0},decisions:[],decisionTotal:0,decisionRecordsEmitted:0,decisionRecordsDropped:0,decisionLimitReached:false,auditRecordTotal:0,auditRecordsDropped:0,candidateScanStoppedEarly:false,fallbackUsed:false,completed:false,contextDurationMs:0,context:{},module:{moduleId:'expert-exordium-f9t2c3',durationMs:0,invokedModules:1,result:{}},plan:{id:'aggregation-clear',goal:'EXORDIUM_CLEAR_OCCUPY_FORTIFY',targetPs:[...ps.coord],targetCell:[...ps.coord],targetUnitId:'removed-by-fallback',status:'active',currentStep:0,reservedEnergy:0,orderedSteps:[{id:'a',action:'attack_ps_target'},{id:'b',action:'occupy_ps'}],exordium:{}}};
      expertRuntimeStateF9T1.activeByPlayer[1]=runtime;
      expertEmitF9T1(EventTypes.AI_EXPERT_TURN_STARTED,1,{sequence,faction:'Exordium'});
      expertEmitF9T1(EventTypes.AI_EXPERT_CONTEXT_CREATED,1,{sequence,context:{}});
      expertEmitF9T1(EventTypes.AI_EXPERT_MODULE_ROUTED,1,{sequence,moduleId:'expert-exordium-f9t2c3',invokedModules:1,durationMs:0,moduleStatus:'smoke'});
      const relay=Array.from({length:15},(_,i)=>({rejectionReason:i<10?'ps_not_owned':'valid_candidate'}));
      const clear=Array.from({length:4},()=>({rejectionReason:'no_enemy_ps_presidium'}));
      const forward=Array.from({length:3},(_,i)=>({rejectionReason:i<2?'insufficient_energy':'valid_candidate'}));
      expertExordiumEmitCandidateAuditBatchF9T2c3(1,'relay','bastion_relay_candidate_audit_batch','smoke',relay,12);
      expertExordiumEmitCandidateAuditBatchF9T2c3(1,'clearOccupyFortify','territorial_conversion_candidate_audit_batch','smoke',clear,12);
      expertExordiumEmitCandidateAuditBatchF9T2c3(1,'forwardPivot','forward_pivot_candidate_audit_batch','smoke',forward,12);
      for(let i=0;i<30;i++) expertEmitDecisionLimitedF9T2c1(1,{kind:'decision-'+i});
      const reconciled=expertExordiumReconcileActivePlanF9T2c1(1,{phase:'aggregation_browser_smoke'});
      const summary=expertCompleteTurnF9T1(1,{reason:'aggregation_browser_smoke'});
      const expert=state.matchTelemetry.expertAi;
      const turn=expert.turns.find(x=>x.side===1&&x.sequence===sequence);
      return {build:BUILD_INFO.version,reconciled,summary,turn:JSON.parse(JSON.stringify(turn)),module:JSON.parse(JSON.stringify(expert.modules.Exordium))};
    }""")
    browser.close()
assert result['build']=='C2-STABLE-1-F9T2d3-APK-M4c',result
assert result['reconciled'] is True,result
turn=result['turn']; mod=result['module']
assert turn['candidateAuditsTotal']==22 and turn['candidateAuditsStored']==12 and turn['candidateAuditsDropped']==10,result
assert mod['candidateAuditsTotal']==22 and mod['candidateAuditsStored']==12 and mod['candidateAuditsDropped']==10,result
assert mod['candidateAuditCountByScanner']=={'relay':15,'clearOccupyFortify':4,'forwardPivot':3,'varranAssault':0},result
assert mod['relayCandidateRejectionCounts']['ps_not_owned']==10,result
assert mod['clearCandidateRejectionCounts']['no_enemy_ps_presidium']==4,result
assert mod['forwardPivotCandidateRejectionCounts']['insufficient_energy']==2,result
assert mod['decisionRecordsTotal']==31 and mod['decisionRecordsStored']==24 and mod['decisionRecordsDropped']==7,result
assert mod['psClearedDuringExpertPlan']==1 and mod['psClearedDirectlyByExpertStep']==0,result
assert mod['psCleared']==1 and mod['psOccupiedAfterClear']==1,result
assert errors==[],errors
assert console_errors==[],console_errors
print(json.dumps({'status':'PASS','build':result['build'],'candidateAudits':{'total':mod['candidateAuditsTotal'],'stored':mod['candidateAuditsStored'],'dropped':mod['candidateAuditsDropped'],'byScanner':mod['candidateAuditCountByScanner']},'decisions':{'total':mod['decisionRecordsTotal'],'stored':mod['decisionRecordsStored'],'dropped':mod['decisionRecordsDropped']},'territorial':{'duringPlan':mod['psClearedDuringExpertPlan'],'directExpertStep':mod['psClearedDirectlyByExpertStep'],'occupied':mod['psOccupiedAfterClear']},'pageErrors':len(errors),'consoleErrors':len(console_errors)},ensure_ascii=False,indent=2))
