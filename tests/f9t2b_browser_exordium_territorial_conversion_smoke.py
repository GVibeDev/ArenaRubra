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
    page.wait_for_function("typeof newGame==='function' && typeof expertExordiumModuleF9T2b==='function' && typeof expertFactionTryPlannedUnitActionF9T2==='function'")
    result=page.evaluate("""() => {
      const splash=document.getElementById('appSplash'); if(splash){splash.style.display='none';splash.style.pointerEvents='none'}
      const initiative=document.getElementById('initiativeMode'); if(initiative)initiative.value='p1';
      newGame({mapId:'map1_starter',factions:{1:'Exordium',2:'Nexus'},selectedCommanders:{1:'EX0B00',2:'NXCMD01'},selectedDecks:{1:{mode:'custom',savedKey:'Exordium::EX0B00::breccia-cremisi'},2:{mode:'custom',savedKey:'Nexus::NXCMD01::bastione-mobile'}},modes:{1:'human',2:'human'},autoResignEnabled:false,aiMode:'expert',pacePreset:'standard',gameScaleMode:'large_scale',matchSeed:'AR-f9t2b-browser-conversion'});
      state.currentPlayer=1;state.modes[1]='bot';state.modes[2]='human';state.aiMode='expert';state.turn=12;state.energy[1]=5;state.units=state.units.filter(u=>u.type==='QG');
      state.hand[1]=[{cardUid:'f9t2b-bastion',sourceType:'unit',blueprintId:'EX4B02',faction:'Exordium',name:'Bastione Armato',cost:2,deckRole:'starter_structure'}];state.discard[1]=[];
      const targetPs=state.cells.find(c=>c.ps&&c.coord[0]===0&&c.coord[1]===0&&c.coord[2]===0)||state.cells.find(c=>c.ps);
      if(!targetPs)throw new Error('Nessun PS disponibile');
      const free=neighbors(targetPs.coord).filter(c=>isCellEnterable(c)&&!getUnitAt(c));
      if(free.length<2)throw new Error('Celle adiacenti insufficienti');
      const targetBp=BLUEPRINTS.find(bp=>bp.id==='NX2B01')||BLUEPRINTS.find(bp=>bp.faction==='Nexus'&&bp.type==='Fanteria');
      const attackerBp=BLUEPRINTS.find(bp=>bp.id==='EX1B04')||BLUEPRINTS.find(bp=>bp.faction==='Exordium'&&bp.type==='Fanteria'&&Number(bp.att)>=2);
      const builderBp=BLUEPRINTS.find(bp=>bp.id==='EX1B01')||BLUEPRINTS.find(bp=>bp.faction==='Exordium'&&bp.type==='Fanteria');
      if(!targetBp||!attackerBp||!builderBp)throw new Error('Blueprint scenario mancanti');
      const target=createUnitFromBlueprint(targetBp,2); target.pos=[...targetPs.coord];target.acted=false;target.alive=true;target.currentHp=1;target.hp=1;target.currentDef=0;target.def=0;target.att=0;
      const attacker=createUnitFromBlueprint(attackerBp,1); attacker.pos=[...free[0]];attacker.acted=false;attacker.alive=true;attacker.att=Math.max(2,Number(attacker.att||0));
      const builder=createUnitFromBlueprint(builderBp,1); builder.pos=[...free[1]];builder.acted=false;builder.alive=true;
      state.units.push(target,attacker,builder); targetPs.control=2;
      for(const c of state.cells.filter(c=>c.ps&&!sameCoord(c.coord,targetPs.coord)))c.control=null;
      const session=expertBeginTurnF9T1(1);
      const planBefore=session.plan?JSON.parse(JSON.stringify(session.plan)):null; const moduleIdBefore=session.module&&session.module.moduleId; const invokedBefore=session.module&&session.module.invokedModules;
      const reserveBlocks=expertCanSpendEnergyF9T2(1,4)===false;
      const attackStep=session.plan&&session.plan.orderedSteps.find(step=>step.action==='attack_ps_target');
      const buildStep=session.plan&&session.plan.orderedSteps.find(step=>step.action==='build_roster_clear_ps');
      const plannedAttacker=state.units.find(u=>expertExordiumUnitIdF9T2b(u)===String(attackStep&&attackStep.unitId||''));
      const plannedBuilder=state.units.find(u=>expertExordiumUnitIdF9T2b(u)===String(buildStep&&(buildStep.builderId||buildStep.unitId)||''));
      if(!plannedAttacker||!plannedBuilder)throw new Error('Attori pianificati non risolti');
      const attacked=expertFactionTryPlannedUnitActionF9T2(plannedAttacker);
      const targetDead=!state.units.includes(target)||target.alive===false||Number(target.currentHp||0)<=0;
      const built=expertFactionTryPlannedUnitActionF9T2(plannedBuilder);
      const bastion=combatUnits(1).find(u=>u.id==='EX4B02'&&sameCoord(u.pos,targetPs.coord));
      const planStatus=session.plan&&session.plan.status;
      const sequence=session.sequence;
      const summary=expertCompleteTurnF9T1(1,{guardIterations:2,reason:'f9t2b_browser_conversion'});
      const expert=state.matchTelemetry.expertAi;
      const turn=expert.turns.find(x=>x.side===1&&x.sequence===sequence);
      const peripheral=state.cells.find(c=>c.ps&&!sameCoord(c.coord,targetPs.coord));
      const bastionBp=BLUEPRINTS.find(bp=>bp.id==='EX4B02');
      const enemyBp=BLUEPRINTS.find(bp=>bp.id==='NX2B04')||BLUEPRINTS.find(bp=>bp.faction==='Nexus'&&bp.type!=='Struttura');
      const threatCells=neighbors(peripheral.coord).filter(c=>isCellEnterable(c)&&!getUnitAt(c)).slice(0,2);
      state.turn=10; const lost1=createUnitFromBlueprint(bastionBp,1);lost1.pos=[...peripheral.coord];lost1.alive=false;state.units.push(lost1);emitGameEvent({type:EventTypes.UNIT_DESTROYED,data:{unitId:lost1.uid,side:1,faction:'Exordium',unitType:'Struttura'}});
      state.turn=12; const lost2=createUnitFromBlueprint(bastionBp,1);lost2.pos=[...peripheral.coord];lost2.alive=false;state.units.push(lost2);emitGameEvent({type:EventTypes.UNIT_DESTROYED,data:{unitId:lost2.uid,side:1,faction:'Exordium',unitType:'Struttura'}});
      for(const coord of threatCells){const e=createUnitFromBlueprint(enemyBp,2);e.pos=[...coord];e.alive=true;e.acted=false;e.att=Math.max(3,Number(e.att||0));state.units.push(e)}
      const survival=expertExordiumRelaySurvivalAssessmentF9T2b(1,peripheral.coord,{pressureProfile:{requiredPs:2,pressureWin:5,maxRound:35}});
      return {moduleId:moduleIdBefore,invoked:invokedBefore,goal:planBefore&&planBefore.goal,steps:planBefore&&planBefore.orderedSteps.map(x=>x.action),reservedEnergy:planBefore&&planBefore.reservedEnergy,reserveBlocks,attacked,targetDead,built,bastion:Boolean(bastion),planStatus,summary,turn:JSON.parse(JSON.stringify(turn)),module:JSON.parse(JSON.stringify(expert.modules.Exordium)),energy:state.energy[1],active:Object.keys(expertRuntimeStateF9T1.activeByPlayer).length,survival:JSON.parse(JSON.stringify(survival))};
    }""")
    browser.close()
assert result['moduleId']=='expert-exordium-f9t2d3',result
assert result['invoked']==1 and result['goal']=='EXORDIUM_CLEAR_OCCUPY_FORTIFY',result
assert result['steps']==['attack_ps_target','build_roster_clear_ps'],result
assert result['reservedEnergy']==2 and result['reserveBlocks'] is True,result
assert result['attacked'] is True and result['targetDead'] is True,result
assert result['built'] is True and result['bastion'] is True,result
assert result['planStatus']=='completed' and result['summary']['fallbackUsed'] is False,result
assert result['module']['clearOccupyFortifyPlans']>=1,result
assert result['module']['psCleared']>=1 and result['module']['psFortifiedAfterClear']>=1,result
assert result['turn']['budgetExhaustions']==[] and result['active']==0,result
assert result['survival']['lossesLast5']==2 and result['survival']['classification']=='UNSUSTAINABLE' and result['survival']['allowBuild'] is False,result
assert errors==[],errors
assert console_errors==[],console_errors
print(json.dumps({'status':'PASS','module':result['moduleId'],'goal':result['goal'],'sequence':result['steps'],'reservedEnergy':result['reservedEnergy'],'psCleared':result['module']['psCleared'],'psFortifiedAfterClear':result['module']['psFortifiedAfterClear'],'relaySurvival':result['survival']['classification'],'lossesLast5':result['survival']['lossesLast5'],'contextDurationMs':result['turn']['performance']['contextDurationMs'],'moduleDurationMs':result['turn']['performance']['moduleDurationMs'],'totalDurationMs':result['turn']['performance']['totalDurationMs'],'budgetExhaustions':len(result['turn']['budgetExhaustions']),'pageErrors':len(errors),'consoleErrors':len(console_errors)},ensure_ascii=False,indent=2))
