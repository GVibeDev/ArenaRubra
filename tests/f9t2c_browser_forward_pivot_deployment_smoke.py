from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re
ROOT=Path(__file__).resolve().parents[1]; errors=[]; console_errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path="/usr/bin/chromium",args=["--no-sandbox","--allow-file-access-from-files"])
    page=browser.new_page(viewport={"width":1366,"height":900}); page.set_default_timeout(120000)
    page.on("pageerror",lambda exc:errors.append(str(exc))); page.on("console",lambda msg:console_errors.append(msg.text) if msg.type=="error" else None)
    index=(ROOT/"index.html").read_text(encoding="utf-8"); scripts=re.findall(r'<script\s+src="([^"]+)"\s*></script>',index)
    html=re.sub(r'<script\s+src="[^"]+"\s*></script>','',index); html=re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>','',html)
    page.set_content(html,wait_until="load"); page.add_style_tag(path=str(ROOT/"css/style.css"))
    for rel in scripts: page.add_script_tag(path=str(ROOT/rel))
    page.wait_for_function("typeof newGame==='function' && typeof expertExordiumModuleF9T2c==='function' && typeof expertExordiumRosterChoiceF9T2c==='function'")
    result=page.evaluate("""() => {
      const splash=document.getElementById('appSplash'); if(splash){splash.style.display='none';splash.style.pointerEvents='none'}
      const initiative=document.getElementById('initiativeMode'); if(initiative)initiative.value='p1';
      newGame({mapId:'map1_starter',factions:{1:'Exordium',2:'Nexus'},selectedCommanders:{1:'EX0B00',2:'NXCMD01'},selectedDecks:{1:{mode:'custom',savedKey:'Exordium::EX0B00::breccia-cremisi'},2:{mode:'custom',savedKey:'Nexus::NXCMD01::bastione-mobile'}},modes:{1:'human',2:'human'},autoResignEnabled:false,aiMode:'expert',pacePreset:'standard',gameScaleMode:'large_scale',matchSeed:'AR-f9t2c-browser-forward-pivot'});
      state.currentPlayer=1;state.modes[1]='bot';state.modes[2]='human';state.aiMode='expert';state.turn=8;state.energy[1]=10;state.units=state.units.filter(u=>u.type==='QG');
      const pivotBp=BLUEPRINTS.find(bp=>bp.id==='EXPIV02')||BLUEPRINTS.find(bp=>bp.faction==='Exordium'&&bp.weight==='Pivot');
      const bastionBp=BLUEPRINTS.find(bp=>bp.id==='EX4B02');
      const supportBp=BLUEPRINTS.find(bp=>bp.id==='EX1B04')||BLUEPRINTS.find(bp=>bp.faction==='Exordium'&&bp.type==='Fanteria');
      if(!pivotBp||!bastionBp||!supportBp)throw new Error('Blueprint F9T2c mancanti');
      state.hand[1]=[{cardUid:'f9t2c-pivot',sourceType:'unit',cardType:'pivot',deckRole:'pivot',blueprintId:pivotBp.id,faction:'Exordium',name:pivotBp.name,cost:pivotBp.cost,zone:'hand'}];state.discard[1]=[];
      const ownHq=getHq(1); const enemyHq=getHq(2); const psCells=state.cells.filter(c=>c.ps);
      let setup=null;
      for(const target of psCells){
        for(const candidate of state.cells.map(c=>c.coord)){
          if(hexDistance(candidate,target.coord)>Math.max(1,getMapMovementMultiplier()))continue;
          if(sameCoord(candidate,ownHq.pos)||getUnitAt(candidate)||hexDistance(candidate,enemyHq.pos)<=1)continue;
          const around=neighbors(candidate).filter(c=>isCellEnterable(c)&&!getUnitAt(c)&&!sameCoord(c,target.coord));
          if(around.length<2)continue;
          setup={target,candidate:[...candidate],source:[...around[0]],support:[...around[1]]};break;
        }
        if(setup)break;
      }
      if(!setup)throw new Error('Nessuna configurazione nodo avanzato valida');
      const source=createUnitFromBlueprint(bastionBp,1);source.pos=[...setup.source];source.alive=true;source.acted=true;
      const support=createUnitFromBlueprint(supportBp,1);support.pos=[...setup.support];support.alive=true;support.acted=false;
      state.units.push(source,support); setup.target.control=null;
      const session=expertBeginTurnF9T1(1); const sequence=session.sequence; const moduleIdBefore=session.module&&session.module.moduleId; const invokedBefore=session.module&&session.module.invokedModules;
      const before=session.plan?JSON.parse(JSON.stringify(session.plan)):null;
      const choice=expertFactionRosterChoiceF9T2(1);
      const executed=executeBotRosterPlay(1,choice);
      const pivot=choice&&choice.coord?getUnitAt(choice.coord):null;
      const tracked=state.expertAiF9T2c&&state.expertAiF9T2c.forwardPivotByPlayer['1'];
      state.turn=9;
      if(pivot)emitGameEvent({type:EventTypes.UNIT_ATTACKED,data:{attackerId:pivot.uid,attackerSide:1,defenderId:'synthetic-target',amount:Math.max(1,Number(pivot.att||1))}});
      const impact=state.expertAiF9T2c&&state.expertAiF9T2c.lastForwardPivotResultByPlayer['1'];
      const summary=expertCompleteTurnF9T1(1,{guardIterations:2,reason:'f9t2c_browser_forward_pivot'});
      const expert=state.matchTelemetry.expertAi; const turn=expert.turns.find(x=>x.side===1&&x.sequence===sequence); const module=expert.modules.Exordium;
      return {build:BUILD_INFO.version,moduleId:moduleIdBefore,invoked:invokedBefore,goal:before&&before.goal,steps:before&&before.orderedSteps.map(x=>x.action),reservedEnergy:before&&before.reservedEnergy,sourceStructureId:before&&before.exordium&&before.exordium.sourceStructureId,objectiveType:before&&before.exordium&&before.exordium.objectiveType,choice:choice?{source:choice.source,blueprintId:choice.bp.id,coord:choice.coord,cost:choice.cost}:null,executed,pivotId:pivot&&pivot.uid,tracked:tracked?JSON.parse(JSON.stringify(tracked)):null,impact:impact?JSON.parse(JSON.stringify(impact)):null,summary,turn:JSON.parse(JSON.stringify(turn)),module:JSON.parse(JSON.stringify(module)),active:Object.keys(expertRuntimeStateF9T1.activeByPlayer).length};
    }""")
    browser.close()
assert result['build']=='C2-STABLE-1-F9T2d3-APK-M4c',result
assert result['moduleId']=='expert-exordium-f9t2d3' and result['invoked']==1,result
assert result['goal']=='EXORDIUM_FORWARD_PIVOT_DEPLOYMENT' and result['steps']==['deploy_pivot_forward'],result
assert result['reservedEnergy']>0 and result['sourceStructureId'],result
assert result['objectiveType'] in ('ENEMY_PS_CAPTURE','CENTER_CAPTURE','IMMEDIATE_ATTACK','IMMEDIATE_ABILITY','HQ_BREAKTHROUGH','HQ_CORRIDOR'),result
assert result['choice']['source']=='hand' and result['executed'] is True and result['pivotId'],result
assert result['tracked'] and result['tracked']['impactDeadlineRound']==10,result
assert result['impact']['status']=='impacted' and result['impact']['impact']['kind']=='ATTACK' and result['impact']['roundsToFirstActualImpact']==1 and result['impact']['impactWithinDeadline'] is True,result
assert result['summary']['planStatus']=='completed' and result['active']==0,result
assert result['module']['forwardPivotPlans']>=1 and result['module']['forwardPivotsDeployed']>=1 and result['module']['forwardPivotImpacts']>=1,result
assert result['module']['expertForwardPivotsDeployed']>=1 and result['module']['allExordiumPivotsTracked']>=1,result
assert result['turn']['budgetExhaustions']==[],result
assert errors==[],errors
assert console_errors==[],console_errors
print(json.dumps({'status':'PASS','build':result['build'],'module':result['moduleId'],'goal':result['goal'],'sequence':result['steps'],'objectiveType':result['objectiveType'],'pivotId':result['pivotId'],'impact':result['impact']['impact'],'forwardPivotPlans':result['module']['forwardPivotPlans'],'forwardPivotsDeployed':result['module']['forwardPivotsDeployed'],'forwardPivotImpacts':result['module']['forwardPivotImpacts'],'expertForwardPivotsDeployed':result['module']['expertForwardPivotsDeployed'],'allExordiumPivotsTracked':result['module']['allExordiumPivotsTracked'],'contextDurationMs':result['turn']['performance']['contextDurationMs'],'moduleDurationMs':result['turn']['performance']['moduleDurationMs'],'totalDurationMs':result['turn']['performance']['totalDurationMs'],'budgetExhaustions':len(result['turn']['budgetExhaustions']),'pageErrors':len(errors),'consoleErrors':len(console_errors)},ensure_ascii=False,indent=2))
