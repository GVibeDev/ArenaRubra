from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re

ROOT=Path(__file__).resolve().parents[1]
errors=[]
console_errors=[]

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path="/usr/bin/chromium",args=["--no-sandbox","--allow-file-access-from-files"])
    page=browser.new_page(viewport={"width":1366,"height":900})
    page.set_default_timeout(120000)
    page.on("pageerror",lambda exc:errors.append(str(exc)))
    page.on("console",lambda msg:console_errors.append(msg.text) if msg.type=="error" else None)
    index=(ROOT/"index.html").read_text(encoding="utf-8")
    scripts=re.findall(r'<script\s+src="([^"]+)"\s*></script>',index)
    html=re.sub(r'<script\s+src="[^"]+"\s*></script>','',index)
    html=re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>','',html)
    page.set_content(html,wait_until="load")
    page.add_style_tag(path=str(ROOT/"css/style.css"))
    for rel in scripts:
        page.add_script_tag(path=str(ROOT/rel))
    page.wait_for_function("typeof newGame==='function' && typeof expertExordiumModuleF9T2c==='function' && typeof expertExordiumTryVarranAssaultActionF9T2d==='function' && typeof previewBasicAttackOutcome==='function'")
    result=page.evaluate("""() => {
      const splash=document.getElementById('appSplash');
      if(splash){splash.style.display='none';splash.style.pointerEvents='none'}
      const initiative=document.getElementById('initiativeMode');
      if(initiative) initiative.value='p1';
      newGame({
        mapId:'map1_starter',
        factions:{1:'Exordium',2:'Nexus'},
        selectedCommanders:{1:'EX0B00',2:'NXCMD01'},
        selectedDecks:{
          1:{mode:'custom',savedKey:'Exordium::EX0B00::breccia-cremisi'},
          2:{mode:'custom',savedKey:'Nexus::NXCMD01::bastione-mobile'}
        },
        modes:{1:'human',2:'human'},autoResignEnabled:false,aiMode:'expert',pacePreset:'standard',gameScaleMode:'large_scale',matchSeed:'AR-f9t2d1-browser-effective-assault'
      });
      state.currentPlayer=1;
      state.modes[1]='bot';
      state.modes[2]='human';
      state.aiMode='expert';
      state.turn=10;
      state.energy[1]=5;
      state.units=state.units.filter(u=>u.type==='QG');
      state.hand[1]=[];
      state.starterCards[1]={};
      expertExordiumHasImmediateTerritorialCandidateF9T2c1=()=>false;
      expertExordiumForwardPivotCandidatesF9T2c=()=>[];

      const varranBp=BLUEPRINTS.find(bp=>bp.id==='EX0B00');
      const actorBp=BLUEPRINTS.find(bp=>bp.id==='EX1B01') || BLUEPRINTS.find(bp=>bp.faction==='Exordium'&&bp.type==='Fanteria'&&bp.id!=='EX0B00');
      const enemyBp=BLUEPRINTS.find(bp=>bp.faction==='Nexus'&&bp.type!=='QG'&&bp.type!=='Struttura');
      if(!varranBp||!actorBp||!enemyBp) throw new Error('Blueprint F9T2d1 mancanti');

      let setup=null;
      const free=state.cells.filter(c=>!c.ps && isCellEnterable(c.coord) && !getUnitAt(c.coord));
      for(const actorCell of free){
        const enemyCell=neighbors(actorCell.coord).find(c=>isCellEnterable(c)&&!getUnitAt(c));
        if(!enemyCell) continue;
        const varranCell=neighbors(actorCell.coord).find(c=>isCellEnterable(c)&&!sameCoord(c,enemyCell)&&!getUnitAt(c));
        if(!varranCell) continue;
        setup={actor:[...actorCell.coord],enemy:[...enemyCell],varran:[...varranCell]};
        break;
      }
      if(!setup) throw new Error('Nessuna configurazione adiacente valida');

      const varran=createUnitFromBlueprint(varranBp,1);
      varran.pos=setup.varran;varran.alive=true;varran.acted=false;varran.movedThisTurn=false;varran.abilityUsedThisTurn=false;varran.cooldownLeft=0;
      // Prevent Varran himself from winning the scanner tie.
      varran.currentAtt=0;varran.att=0;
      const actor=createUnitFromBlueprint(actorBp,1);
      actor.pos=setup.actor;actor.alive=true;actor.acted=false;actor.movedThisTurn=false;actor.attacksMade=0;actor.attacksPerTurn=Math.max(1,Number(actor.attacksPerTurn||1));actor.currentAtt=3;actor.att=3;actor.buffs=[];
      const enemy=createUnitFromBlueprint(enemyBp,2);
      enemy.pos=setup.enemy;enemy.alive=true;enemy.acted=false;enemy.currentHp=4;enemy.maxHp=4;enemy.currentDef=0;enemy.maxDef=0;
      state.units.push(varran,actor,enemy);

      // Real ATT->DEF->HP preview rejects nominal overflow against DEF.
      actor.currentAtt=6;actor.att=6;enemy.currentDef=3;enemy.currentHp=4;
      const zeroMarginal=expertExordiumEvaluateVarranAssaultOptionF9T2d1(1,varran,actor,enemy,{player:1,faction:'Exordium',turn:10,common:{hqOccupationRisk:{risk:'none'}}},[],[enemy],null);
      actor.currentAtt=3;actor.att=3;enemy.currentDef=0;enemy.currentHp=4;

      // In a real match the Exordium module has already run for many rounds before
      // Varran becomes actionable. Warm the pure selector once without telemetry.
      const savedDefer=expertExordiumDeferModuleTelemetryF9T2d1;
      expertExordiumDeferModuleTelemetryF9T2d1=()=>null;
      expertExordiumModuleF9T2c({player:1,faction:'Exordium',turn:9,common:{hqOccupationRisk:{risk:'none'}}});
      expertExordiumDeferModuleTelemetryF9T2d1=savedDefer;

      const session=expertBeginTurnF9T1(1);
      const sequence=session.sequence;
      const plan=session.plan?JSON.parse(JSON.stringify(session.plan)):null;
      const varranPriority=expertFactionUnitPriorityBonusF9T2(varran);
      const orderExecuted=expertFactionTryPlannedUnitActionF9T2(varran);
      const actorAfterBuff=actor.currentAtt;
      const actorPriority=expertFactionUnitPriorityBonusF9T2(actor);
      let emergencyCalls=0;
      const savedEmergency=emergencyBotAction;
      emergencyBotAction=()=>{emergencyCalls+=1;return false};
      const attacksBeforeBotAct=Number(actor.attacksMade||0);
      botAct(actor);
      const assaultExecuted=Number(actor.attacksMade||0)>attacksBeforeBotAct;
      emergencyBotAction=savedEmergency;
      const enemyAlive=enemy.alive!==false;
      const livePlan=expertRuntimeStateF9T1.activeByPlayer[1]&&expertRuntimeStateF9T1.activeByPlayer[1].plan;
      const summary=expertCompleteTurnF9T1(1,{guardIterations:2,reason:'f9t2d1_browser_effective_assault'});
      const expert=state.matchTelemetry.expertAi;
      const turn=expert.turns.find(x=>x.side===1&&x.sequence===sequence);
      const module=expert.modules.Exordium;
      const decisions=(turn&&turn.decisions||[]);
      const execution=decisions.find(d=>d.kind==='varran_assault_executed')||null;
      return {
        build:BUILD_INFO.version,
        moduleId:session.moduleId||(session.module&&session.module.moduleId)||null,
        invoked:session.invokedModules||(session.module&&session.module.invokedModules)||null,
        goal:plan&&plan.goal,
        steps:plan&&plan.orderedSteps.map(x=>x.action),
        reservedEnergy:plan&&plan.reservedEnergy,
        predictedBonusEffectiveDamage:plan&&plan.expectedResult&&plan.expectedResult.predictedBonusEffectiveDamage,
        baseWouldKill:plan&&plan.expectedResult&&plan.expectedResult.baseWouldKill,
        immediateKillPredicted:plan&&plan.expectedResult&&plan.expectedResult.immediateKillPredicted,
        bonusEnabledKill:plan&&plan.expectedResult&&plan.expectedResult.bonusEnabledKill,
        legacyKillEnabled:plan&&plan.expectedResult&&plan.expectedResult.killEnabled,
        stationaryAttackBranch:plan&&plan.expectedResult&&plan.expectedResult.stationaryAttackBranch,
        movementRequired:plan&&plan.expectedResult&&plan.expectedResult.movementRequired,
        movementSkippedReason:plan&&plan.expectedResult&&plan.expectedResult.movementSkippedReason,
        zeroMarginal:{option:Boolean(zeroMarginal.option),reason:zeroMarginal.audit&&zeroMarginal.audit.rejectionReason,base:zeroMarginal.audit&&zeroMarginal.audit.baseEffectiveDamage,ordered:zeroMarginal.audit&&zeroMarginal.audit.orderedEffectiveDamage},
        varranPriority,orderExecuted,actorAfterBuff,actorPriority,assaultExecuted,emergencyCalls,enemyAlive,
        planStatus:livePlan&&livePlan.status,
        summary,execution,
        decisionKinds:decisions.map(d=>d.kind),
        auditKinds:(turn&&turn.auditRecords||[]).map(d=>d.kind),
        auditSources:(turn&&turn.auditRecords||[]).map(d=>({source:d.source,scanner:d.scanner})),
        decisionSources:decisions.filter(d=>String(d.kind||'').startsWith('varran_assault')).map(d=>({source:d.source,featureRevision:d.featureRevision})),
        module:JSON.parse(JSON.stringify(module)),
        turn:JSON.parse(JSON.stringify(turn)),
        active:Object.keys(expertRuntimeStateF9T1.activeByPlayer).length
      };
    }""")
    browser.close()

assert result['build']=='C2-STABLE-1-F9T2d3-APK-M4c',result
assert result['summary']['moduleId']=='expert-exordium-f9t2d3' and result['turn']['invokedModules']==1,result
assert result['goal']=='EXORDIUM_VARRAN_ASSAULT_CHAIN',result
assert result['steps']==['use_varran_order','execute_varran_assault'],result
assert result['reservedEnergy']==1,result
assert result['predictedBonusEffectiveDamage']==1 and result['baseWouldKill'] is False,result
assert result['immediateKillPredicted'] is True and result['bonusEnabledKill'] is True,result
assert result['legacyKillEnabled'] is None,result
assert result['stationaryAttackBranch'] is True and result['movementRequired'] is False,result
assert result['movementSkippedReason']=='already_in_attack_range',result
assert result['zeroMarginal']=={'option':False,'reason':'no_marginal_bonus_value','base':3,'ordered':3},result
assert result['varranPriority']>=1900 and result['orderExecuted'] is True,result
assert result['actorAfterBuff']==4 and result['actorPriority']>=1800,result
assert result['assaultExecuted'] is True and result['enemyAlive'] is False,result
assert result['emergencyCalls']==0,result
assert result['planStatus']=='completed' and result['summary']['planStatus']=='completed' and result['active']==0,result
assert 'varran_assault_candidate_audit_batch' in result['auditKinds'],result
assert any(d.get('source')=='expert_exordium_f9t2d2a' and d.get('scanner')=='varranAssault' for d in result['auditSources']),result
assert 'varran_assault_order_committed' in result['decisionKinds'],result
assert 'varran_assault_executed' in result['decisionKinds'],result
assert all(d.get('source')=='expert_exordium_f9t2d2a' and d.get('featureRevision')=='F9T2d2a' for d in result['decisionSources'] if d.get('featureRevision') is not None),result
execution=result['execution']
assert execution['predictedBonusEffectiveDamage']==1 and execution['actualBonusEffectiveDamage']==1,result
assert execution['immediateKillPredicted'] is True and execution['immediateKillAchieved'] is True,result
assert execution['bonusEnabledKill'] is True and execution['predictionMatched'] is True,result
assert execution['stationaryAttackBranch'] is True and execution['movementRequired'] is False,result
assert execution['movementSkippedReason']=='already_in_attack_range',result
assert execution['attackOwnership']=='expert_executor' and execution['attackExecutionRecognized'] is True,result
assert execution['requestedActorId']==execution['actualActorId'],result
assert execution['requestedTargetUnitId']==execution['actualTargetUnitId'],result
assert result['module']['varranAssaultPlans']>=1,result
assert result['module']['varranAssaultScans']>=1 and result['module']['varranAssaultOrdersCommitted']>=1 and result['module']['varranAssaultsExecuted']>=1,result
assert result['module']['varranStationaryAssaultsExecuted']>=1,result
assert result['module']['varranAttackOwnershipRecognized']>=1,result
assert result['module']['varranActualBonusEffectiveDamage']>=1,result
assert result['module']['candidateAuditCountByScanner']['varranAssault']>=1,result
assert sum(result['module']['varranCandidateRejectionCounts'].values())>=1,result
assert result['turn']['candidateAuditCountByScanner']['varranAssault']>=1,result
assert result['turn']['budgetExhaustions']==[],result
assert result['turn']['performance']['moduleDurationMs']<=8,result
assert errors==[],errors
assert console_errors==[],console_errors
print(json.dumps({
  'status':'PASS','build':result['build'],'module':result['summary']['moduleId'],'goal':result['goal'],
  'sequence':result['steps'],'predictedBonusEffectiveDamage':result['predictedBonusEffectiveDamage'],
  'actualBonusEffectiveDamage':execution['actualBonusEffectiveDamage'],'bonusEnabledKill':execution['bonusEnabledKill'],
  'targetDestroyed':not result['enemyAlive'],'stationaryAttackBranch':execution['stationaryAttackBranch'],
  'attackOwnership':execution['attackOwnership'],'emergencyCallsBeforeOwnership':result['emergencyCalls'],
  'zeroMarginalRejected':result['zeroMarginal'],
  'varranAuditCount':result['module']['candidateAuditCountByScanner']['varranAssault'],
  'varranRejections':result['module']['varranCandidateRejectionCounts'],
  'moduleDurationMs':result['turn']['performance']['moduleDurationMs'],
  'budgetExhaustions':len(result['turn']['budgetExhaustions']),
  'pageErrors':len(errors),'consoleErrors':len(console_errors)
},ensure_ascii=False,indent=2))
