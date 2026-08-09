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
    index=(ROOT/'index.html').read_text(encoding='utf-8')
    scripts=re.findall(r'<script\s+src="([^"]+)"\s*></script>',index)
    html=re.sub(r'<script\s+src="[^"]+"\s*></script>','',index)
    html=re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>','',html)
    page.set_content(html,wait_until='load'); page.add_style_tag(path=str(ROOT/'css/style.css'))
    for rel in scripts: page.add_script_tag(path=str(ROOT/rel))
    page.wait_for_function("typeof newGame==='function' && typeof expertExordiumRefreshCommanderCommitmentF9T2d3==='function' && typeof chooseBestBotRosterPlay==='function'")
    result=page.evaluate("""() => {
      const splash=document.getElementById('appSplash'); if(splash){splash.style.display='none';splash.style.pointerEvents='none'}
      const setup=(seed,energy)=>{
        newGame({mapId:'map1_starter',factions:{1:'Exordium',2:'Nexus'},selectedCommanders:{1:'EX0B00',2:'NXCMD01'},selectedDecks:{1:{mode:'custom',savedKey:'Exordium::EX0B00::breccia-cremisi'},2:{mode:'custom',savedKey:'Nexus::NXCMD01::bastione-mobile'}},modes:{1:'human',2:'human'},autoResignEnabled:false,aiMode:'expert',pacePreset:'standard',gameScaleMode:'large_scale',matchSeed:seed});
        state.currentPlayer=1; state.modes[1]='bot'; state.modes[2]='human'; state.aiMode='expert'; state.turn=4; state.energy[1]=energy;
        state.units=state.units.filter(u=>u.type==='QG');
        expertPrepareMatchF9T2c2(state.matchId,{reason:'f9t2d3-browser-smoke'});
      };
      setup('AR-f9t2d3-commander-immediate',4);
      const session=expertBeginTurnF9T1(1);
      const c0=JSON.parse(JSON.stringify(expertExordiumCommanderCommitmentF9T2d3(1)));
      const tacticSpendAllowed=expertCanSpendEnergyF9T2(1,1,{kind:'hand_tactic'});
      const choice=chooseBestBotRosterPlay(1);
      const choiceView=choice?{bp:choice.bp&&choice.bp.id,source:choice.source,cost:choice.cost,doctrine:choice.expertDoctrine,coord:choice.coord}:null;
      const executed=executeBotRosterPlay(1,choice);
      const commander=commanderOf(1);
      const c1=JSON.parse(JSON.stringify(expertExordiumCommanderCommitmentF9T2d3(1)));
      const summary=expertCompleteTurnF9T1(1,{reason:'f9t2d3-browser-immediate'});
      const module=JSON.parse(JSON.stringify(state.matchTelemetry.expertAi.modules.Exordium));
      const turn=JSON.parse(JSON.stringify(state.matchTelemetry.expertAi.turns.find(t=>t.side===1&&t.sequence===session.sequence)));

      setup('AR-f9t2d3-commander-save',2);
      const saveSession=expertBeginTurnF9T1(1);
      const saveC=JSON.parse(JSON.stringify(expertExordiumCommanderCommitmentF9T2d3(1)));
      const genericAt2=chooseBestBotRosterPlay(1);
      const canSpendAt2=expertCanSpendEnergyF9T2(1,1,{kind:'roster_purchase'});
      const saveSummary=expertCompleteTurnF9T1(1,{reason:'f9t2d3-save-r4'});
      state.turn=5; state.currentPlayer=1; state.energy[1]=5;
      const saveSession2=expertBeginTurnF9T1(1);
      const choiceAt5=chooseBestBotRosterPlay(1);
      const view5=choiceAt5?{bp:choiceAt5.bp&&choiceAt5.bp.id,cost:choiceAt5.cost,doctrine:choiceAt5.expertDoctrine}:null;
      const saveSummary2=expertCompleteTurnF9T1(1,{reason:'f9t2d3-save-r5'});
      return {build:BUILD_INFO.version,buildName:BUILD_INFO.buildName,sessionModule:summary&&summary.moduleId,c0,tacticSpendAllowed,choiceView,executed,commander:commander&&{id:commander.id||commander.blueprintId,name:commander.name},c1,summary,module,turn,save:{c:saveC,genericAt2:genericAt2&&{bp:genericAt2.bp&&genericAt2.bp.id,cost:genericAt2.cost,doctrine:genericAt2.expertDoctrine},canSpendAt2,view5,sessionModule:saveSummary&&saveSummary.moduleId,session2Module:saveSummary2&&saveSummary2.moduleId}};
    }""")
    browser.close()

assert result['build']=='C2-STABLE-1-F9T2d3-APK-M4c',result
assert result['buildName']=='Commander Deployment Commitment',result
assert result['sessionModule']=='expert-exordium-f9t2d3',result
assert result['c0']['active'] is True and result['c0']['reservedEnergy']==4,result
assert result['c0']['commitmentCreatedRound']==4 and result['c0']['deploymentDeadlineRound']==6,result
assert result['tacticSpendAllowed'] is False,result
assert result['choiceView'] and result['choiceView']['bp']=='EX0B00' and result['choiceView']['doctrine']=='commander_deployment_commitment_f9t2d3',result
assert result['executed'] is True and result['commander'] and result['commander']['id']=='EX0B00',result
assert result['c1']['executed'] is True and result['c1']['active'] is False and result['c1']['reservedEnergy']==0,result
assert result['module']['commanderDeploymentCommitments']>=1,result
assert result['module']['commanderDeploymentCommitmentsExecuted']>=1,result
assert result['module']['commanderDeploymentAttempts']>=1,result
assert result['module']['commanderEnergyReserved']>=4,result
assert result['turn']['budgetExhaustions']==[],result
assert result['save']['c']['active'] is True and result['save']['c']['reservedEnergy']==4,result
assert result['save']['genericAt2'] is None,result
assert result['save']['canSpendAt2'] is False,result
assert result['save']['view5'] and result['save']['view5']['bp']=='EX0B00' and result['save']['view5']['doctrine']=='commander_deployment_commitment_f9t2d3',result
assert result['save']['sessionModule']=='expert-exordium-f9t2d3' and result['save']['session2Module']=='expert-exordium-f9t2d3',result
assert errors==[],errors
assert console_errors==[],console_errors
print(json.dumps({'status':'PASS','build':result['build'],'module':result['sessionModule'],'commitmentCreatedRound':result['c0']['commitmentCreatedRound'],'deadlineRound':result['c0']['deploymentDeadlineRound'],'reservedEnergy':4,'commanderChoice':result['choiceView'],'executed':result['executed'],'telemetry':{k:result['module'][k] for k in ['commanderDeploymentCommitments','commanderDeploymentCommitmentsExecuted','commanderDeploymentAttempts','commanderEnergyReserved']},'savingAtEnergy2':result['save'],'moduleDurationMs':result['turn']['performance']['moduleDurationMs'],'contextDurationMs':result['turn']['performance']['contextDurationMs'],'budgetExhaustions':len(result['turn']['budgetExhaustions']),'pageErrors':len(errors),'consoleErrors':len(console_errors)},ensure_ascii=False,indent=2))
