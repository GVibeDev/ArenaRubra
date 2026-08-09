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
    page.wait_for_function("typeof newGame==='function' && typeof expertExordiumModuleF9T2a==='function' && typeof expertFactionTryPrePurchasePlanStepF9T2a==='function'")
    result=page.evaluate("""() => {
      const splash=document.getElementById('appSplash'); if(splash){splash.style.display='none';splash.style.pointerEvents='none'}
      const initiative=document.getElementById('initiativeMode'); if(initiative)initiative.value='p1';
      newGame({mapId:'map1_starter',factions:{1:'Exordium',2:'Nexus'},selectedCommanders:{1:'EX0B00',2:'NXCMD01'},selectedDecks:{1:{mode:'custom',savedKey:'Exordium::EX0B00::breccia-cremisi'},2:{mode:'custom',savedKey:'Nexus::NXCMD01::bastione-mobile'}},modes:{1:'human',2:'human'},autoResignEnabled:false,aiMode:'expert',pacePreset:'standard',gameScaleMode:'large_scale',matchSeed:'AR-ms73t56g-yyyzl3'});
      state.currentPlayer=1;state.modes[1]='bot';state.modes[2]='human';state.aiMode='expert';state.turn=5;state.energy[1]=5;state.units=state.units.filter(u=>u.type==='QG');
      state.hand[1]=[{cardUid:'f9t2a-bastion',sourceType:'unit',blueprintId:'EX4B02',faction:'Exordium',name:'Bastione Armato',cost:2,deckRole:'starter_structure'}];state.discard[1]=[];
      const psCells=state.cells.filter(c=>c.ps);let setup=null;
      for(const target of psCells){const objective=psCells.filter(c=>!sameCoord(c.coord,target.coord)).sort((a,b)=>hexDistance(target.coord,a.coord)-hexDistance(target.coord,b.coord))[0];if(!objective)continue;
        const neighborsFree=neighbors(target.coord).filter(c=>isCellEnterable(c)&&!getUnitAt(c));
        for(const builderCoord of neighborsFree){
          const builder=createUnitFromBlueprint(BLUEPRINTS.find(bp=>bp.id==='EX1B01'),1);builder.pos=[...builderCoord];builder.acted=false;builder.alive=true;
          const guard=createUnitFromBlueprint(BLUEPRINTS.find(bp=>bp.id==='EX2B01'),1);guard.pos=[...target.coord];guard.acted=false;guard.alive=true;
          state.units.push(builder,guard);target.control=1;
          const moves=movableCells(guard).filter(c=>hexDistance(c,objective.coord)<hexDistance(guard.pos,objective.coord));
          if(moves.length){setup={target,objective,builder,guard};break}
          state.units=state.units.filter(u=>u.uid!==builder.uid&&u.uid!==guard.uid);
        }
        if(setup)break;
      }
      if(!setup)throw new Error('Scenario F9T2a non predisponibile');
      for(const cell of psCells)if(!sameCoord(cell.coord,setup.target.coord))cell.control=2;
      const session=expertBeginTurnF9T1(1); const targetBefore=getUnitAt(setup.target.coord); const moved=expertFactionTryPrePurchasePlanStepF9T2a(1); const targetAfterMove=getUnitAt(setup.target.coord);
      const choice=expertFactionRosterChoiceF9T2(1); const built=executeBotRosterPlay(1,choice); const bastion=combatUnits(1).find(u=>u.id==='EX4B02'&&sameCoord(u.pos,setup.target.coord));
      const sequence=session.sequence; const moduleId=session.module&&session.module.moduleId; const invoked=session.module&&session.module.invokedModules; const goal=session.plan&&session.plan.goal; const firstAction=session.plan&&session.plan.orderedSteps[0].action; const planStatus=session.plan&&session.plan.status;
      const summary=expertCompleteTurnF9T1(1,{guardIterations:1,reason:'browser_smoke'}); const expert=state.matchTelemetry.expertAi; const turn=expert.turns.find(x=>x.side===1&&x.sequence===sequence);
      return {moduleId,invoked,goal,firstAction,moved,built,guardId:setup.guard.uid,targetBefore:targetBefore&&targetBefore.uid,targetAfterMove:targetAfterMove&&targetAfterMove.uid,bastion:Boolean(bastion),planStatus,summary,turn:JSON.parse(JSON.stringify(turn)),module:JSON.parse(JSON.stringify(expert.modules.Exordium)),active:Object.keys(expertRuntimeStateF9T1.activeByPlayer).length};
    }""")
    browser.close()
assert result['moduleId']=='expert-exordium-f9t2d3',result
assert result['invoked']==1 and result['goal']=='EXORDIUM_BASTION_RELAY',result
assert result['firstAction']=='advance_unit_pre_purchase',result
assert result['targetBefore']==result['guardId'] and result['moved'] is True and result['targetAfterMove'] is None,result
assert result['built'] is True and result['bastion'] is True,result
assert result['planStatus']=='completed' and result['summary']['fallbackUsed'] is False,result
assert result['turn']['candidateAuditCount']>=1 and any(x.get('candidateValid') for x in result['turn']['candidateAudits']),result
assert result['module']['bastionRelayPlans']==1 and result['module']['bastionsBuiltOnPs']==1 and result['module']['mobileGuardsReleased']==1,result
assert result['turn']['budgetExhaustions']==[] and result['active']==0,result
assert errors==[],errors
assert console_errors==[],console_errors
print(json.dumps({'status':'PASS','module':result['moduleId'],'sequence':['move_guard','build_bastion'],'candidateAudits':result['turn']['candidateAuditCount'],'candidateRejections':result['turn']['candidateRejectionCounts'],'contextDurationMs':result['turn']['performance']['contextDurationMs'],'moduleDurationMs':result['turn']['performance']['moduleDurationMs'],'totalDurationMs':result['turn']['performance']['totalDurationMs'],'budgetExhaustions':len(result['turn']['budgetExhaustions']),'pageErrors':len(errors),'consoleErrors':len(console_errors)},ensure_ascii=False,indent=2))
