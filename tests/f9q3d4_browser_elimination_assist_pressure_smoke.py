from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import re

ROOT = Path(__file__).resolve().parents[1]
errors = []
console_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        executable_path="/usr/bin/chromium",
        args=["--no-sandbox", "--allow-file-access-from-files"],
    )
    context = browser.new_context(viewport={"width": 1365, "height": 900})
    page = context.new_page()
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

    index = (ROOT / "index.html").read_text(encoding="utf-8")
    scripts = re.findall(r'<script\s+src="([^"]+)"\s*></script>', index)
    html = re.sub(r'<script\s+src="[^"]+"\s*></script>', '', index)
    html = re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>', '', html)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    for rel in scripts:
        page.add_script_tag(path=str(ROOT / rel))
    page.wait_for_function(
        "typeof BUILD_INFO !== 'undefined' && typeof ffaAttributionRecordDamage === 'function' "
        "&& typeof eliminatePlayer === 'function' && typeof resolveEndOfRound === 'function'"
    )

    result = page.evaluate("""() => {
      const precheck = runPrecheck({quiet:true,source:'f9q3d4-browser'});
      window.__events=[];
      renderAll=()=>{}; renderMatchupStats=()=>{}; maybeRunBot=()=>{}; arenaAudioHandleMatchEnd=()=>{};
      recordMatchResult=()=>{state.matchRecorded=true;};
      log=(message,type=EventTypes.LOG_MESSAGE,data={})=>{
        const event={type,message:String(message),data};
        window.__events.push(event);
        emitGameEvent(event);
      };

      state={
        turn:12,orderIndex:1,turnOrder:[1,2,3,4],currentPlayer:2,winner:null,winnerSide:null,winType:null,eventSeq:0,events:[],logSeq:0,
        players:[1,2,3,4].map(id=>({id,eliminated:false,lifecycleStatus:'active'})),
        factions:{1:'Nexus',2:'Exordium',3:'Liberti',4:'Agathoi'},modes:{1:'human',2:'bot',3:'bot',4:'bot'},
        units:[
          {uid:'hq1',side:1,type:'QG',alive:true,pos:[-3,0,3],statuses:[]},
          {uid:'hq2',side:2,type:'QG',alive:true,pos:[3,0,-3],statuses:[]},
          {uid:'hq3',side:3,type:'QG',alive:true,pos:[0,3,-3],statuses:[]},
          {uid:'hq4',side:4,type:'QG',alive:true,pos:[0,-3,3],statuses:[]},
          {uid:'victim',id:'victim',name:'Guardia Agathoi',side:4,faction:'Agathoi',type:'Fanteria',weight:'Pesante',role:'line',alive:true,acted:false,currentHp:2,maxHp:2,currentDef:0,maxDef:2,currentAtt:1,statuses:[],buffs:[],pos:[0,0,0]}
        ],
        cells:[{coord:[0,0,0],ps:false,control:null,terrainType:'free'}],psLocks:[],mines:[],cellEffects:[],playerEffects:{1:[],2:[],3:[],4:[]},
        energy:{1:5,2:5,3:5,4:5},pressure:{1:0,2:0,3:0,4:0},desperation:{1:0,2:0,3:0,4:0},
        energyLocked:{1:0,2:0,3:0,4:0},handLocked:{1:0,2:0,3:0,4:0},tacticUsedThisTurn:{1:false,2:false,3:false,4:false},
        tacticCooldowns:{1:{},2:{},3:{},4:{}},c2eBotHandTacticsUsedThisTurn:{1:0,2:0,3:0,4:0},
        fabeotEconomyAbilityUsed:{1:false,2:false,3:false,4:false},fabeotConversionUsed:{1:false,2:false,3:false,4:false},
        missions:{1:null,2:null,3:null,4:null},missionPendingReward:null,
        hand:{1:[],2:[],3:[],4:[]},deck:{1:[],2:[],3:[],4:[]},discard:{1:[],2:[],3:[],4:[]},
        mapId:'test',mapDefinition:{name:'Test',schemaVersion:1,metadata:{revision:1},movementMultiplier:1,strategicPoints:[],playerCount:4},matchId:'f9q3d4-browser',matchRecorded:false
      };
      initializeMatchStats();
      const victim=state.units.find(u=>u.uid==='victim');
      ffaAttributionRecordDamage(victim,{sourceSide:3,source:'Fuoco di supporto',damageKind:'attack',defLoss:1,hpLoss:0,options:{baseAttack:true}});
      applyDamage(victim,2,'Colpo finale',{directHp:true,sourceSide:2,damageKind:'tactic',tactic:true});
      const unitEvent=window.__events.find(e=>e.type===EventTypes.UNIT_DESTROYED && e.data.unitId==='victim');
      const unitStats={
        killer:state.matchStats.players[2].kills,
        assist:state.matchStats.players[3].assists,
        damage:state.matchStats.players[2].damageDealt
      };

      eliminatePlayer(4,2,'qg');
      const playerEvent=window.__events.find(e=>e.type===EventTypes.PLAYER_ELIMINATED && e.data.player===4);
      const eliminationStats={
        killer:state.matchStats.players[2].playerEliminations,
        assist:state.matchStats.players[3].playerEliminationAssists,
        victim:state.matchStats.players[4].timesEliminated
      };
      const eliminatedRecord=playerLifecycleRecord(4);
      const lifecycleAttribution={
        killer:eliminatedRecord?eliminatedRecord.eliminatedBy:null,
        assists:eliminatedRecord?[...(eliminatedRecord.eliminationAssistSides||[])]:[],
        type:eliminatedRecord?eliminatedRecord.eliminationAttributionType:null
      };
      eliminatePlayer(3,null,'concessione');
      const concessionEvent=window.__events.find(e=>e.type===EventTypes.PLAYER_ELIMINATED && e.data.player===3);

      // Separate Pressure state: G4 eliminated, G1 qualifies alone, G2/G3 remain active.
      state={
        turn:30,orderIndex:2,turnOrder:[1,2,3,4],currentPlayer:3,winner:null,winnerSide:null,winType:null,eventSeq:0,events:[],logSeq:0,
        players:[{id:1,eliminated:false,lifecycleStatus:'active'},{id:2,eliminated:false,lifecycleStatus:'active'},{id:3,eliminated:false,lifecycleStatus:'active'},{id:4,eliminated:true,lifecycleStatus:'eliminated'}],
        factions:{1:'Nexus',2:'Exordium',3:'Liberti',4:'Agathoi'},modes:{1:'human',2:'bot',3:'bot',4:'bot'},
        units:[
          {uid:'hq1',side:1,type:'QG',alive:true,pos:[-6,0,6],statuses:[]},{uid:'hq2',side:2,type:'QG',alive:true,pos:[6,0,-6],statuses:[]},
          {uid:'hq3',side:3,type:'QG',alive:true,pos:[0,6,-6],statuses:[]},{uid:'hq4',side:4,type:'QG',alive:true,pos:[0,-6,6],statuses:[],activeObjective:false,eliminatedOwner:true},
          {uid:'p1a',side:1,type:'Fanteria',alive:true,pos:[0,0,0],statuses:[]},{uid:'p1b',side:1,type:'Fanteria',alive:true,pos:[1,-1,0],statuses:[]},
          {uid:'p1c',side:1,type:'Fanteria',alive:true,pos:[2,-2,0],statuses:[]},{uid:'p1d',side:1,type:'Fanteria',alive:true,pos:[3,-3,0],statuses:[]},
          {uid:'p2a',side:2,type:'Fanteria',alive:true,pos:[-1,1,0],statuses:[]},{uid:'p3a',side:3,type:'Fanteria',alive:true,pos:[-2,2,0],statuses:[]}
        ],
        cells:[
          {coord:[0,0,0],ps:true,control:null,terrainType:'free'},
          {coord:[1,-1,0],ps:true,control:null,terrainType:'free'},
          {coord:[2,-2,0],ps:true,control:null,terrainType:'free'},
          {coord:[3,-3,0],ps:true,control:null,terrainType:'free'},
          {coord:[-1,1,0],ps:true,control:null,terrainType:'free'},
          {coord:[-2,2,0],ps:true,control:null,terrainType:'free'},
          {coord:[0,1,-1],ps:true,control:null,terrainType:'free'}
        ],psLocks:[],mines:[],cellEffects:[],playerEffects:{1:[],2:[],3:[],4:[]},
        energy:{1:5,2:5,3:5,4:0},pressure:{1:1,2:0,3:0,4:4},desperation:{1:0,2:0,3:0,4:0},
        hand:{1:[],2:[],3:[],4:[]},deck:{1:[],2:[],3:[],4:[]},discard:{1:[],2:[],3:[],4:[]},
        pacePreset:'standard',gameScaleMode:'large_scale',mapId:'pressure-test',matchId:'pressure-test',
        mapDefinition:{name:'Pressure Test',schemaVersion:1,metadata:{revision:1},movementMultiplier:1,playerCount:4,centralStrategicPointId:'ps-center',strategicPoints:[
          {id:'ps-center',coord:[0,0,0]},{id:'ps-2',coord:[1,-1,0]},{id:'ps-3',coord:[2,-2,0]},{id:'ps-4',coord:[3,-3,0]},
          {id:'ps-5',coord:[-1,1,0]},{id:'ps-6',coord:[-2,2,0]},{id:'ps-7',coord:[0,1,-1]}
        ]}
      };
      window.__events=[];
      initializeMatchStats();
      const oldUpdateControlFromOccupants=updateControlFromOccupants;
      updateControlFromOccupants=()=>{};
      state.cells[0].control=1;
      state.cells[1].control=1;
      state.cells[2].control=1;
      state.cells[3].control=1;
      state.cells[4].control=2;
      state.cells[5].control=3;
      state.cells[6].control=null;
      resolveEndOfRound();
      updateControlFromOccupants=oldUpdateControlFromOccupants;
      const evaluation=state.events.find(e=>e.type===EventTypes.PRESSURE_EVALUATED);
      const pressureChanged=state.events.find(e=>e.type===EventTypes.PRESSURE_CHANGED);

      return {
        version:BUILD_INFO.version,
        precheck:{ok:precheck.ok,problems:precheck.problems||[],warnings:precheck.warnings||[]},
        unitEvent:unitEvent?{killer:unitEvent.data.killerSide,assists:unitEvent.data.assistSides,type:unitEvent.data.attributionType}:null,
        unitStats,
        playerEvent:playerEvent?{killer:playerEvent.data.killerSide,assists:playerEvent.data.assistSides,type:playerEvent.data.attributionType}:null,
        eliminationStats,
        lifecycleAttribution,
        concession:concessionEvent?{killer:concessionEvent.data.killerSide,assists:concessionEvent.data.assistSides,type:concessionEvent.data.attributionType}:null,
        pressure:{
          value:state.pressure[1],
          outcome:evaluation?evaluation.data.outcome:null,
          active:evaluation?evaluation.data.activePlayers:null,
          eliminated:evaluation?evaluation.data.eliminatedPlayers:null,
          advancing:evaluation?evaluation.data.advancingPlayer:null,
          changedPlayer:pressureChanged?pressureChanged.data.player:null,
          statsGain:state.matchStats.players[1].pressureGained,
          timeline:state.matchStats.pressureTimeline.length,
          eventTypes:state.events.map(e=>e.type)
        }
      };
    }""")

    browser.close()

assert result["version"] == "C2-STABLE-1-F9U2b-APK-M4c", result
assert result["precheck"]["ok"] is True, result
assert result["precheck"]["problems"] == [], result
assert result["precheck"]["warnings"] == [], result
assert result["unitEvent"] == {"killer": 2, "assists": [3], "type": "direct"}, result
assert result["unitStats"] == {"killer": 1, "assist": 1, "damage": 2}, result
assert result["playerEvent"] == {"killer": 2, "assists": [3], "type": "qg_capture"}, result
assert result["eliminationStats"] == {"killer": 1, "assist": 1, "victim": 1}, result
assert result["lifecycleAttribution"] == {"killer": 2, "assists": [3], "type": "qg_capture"}, result
assert result["concession"] == {"killer": None, "assists": [], "type": "concession"}, result
assert result["pressure"]["value"] == 2, result
assert result["pressure"]["outcome"] == "advanced", result
assert result["pressure"]["active"] == [1, 2, 3], result
assert result["pressure"]["eliminated"] == [4], result
assert result["pressure"]["advancing"] == 1, result
assert result["pressure"]["changedPlayer"] == 1, result
assert result["pressure"]["statsGain"] == 1, result
assert result["pressure"]["timeline"] == 1, result
assert not errors, errors
assert not console_errors, console_errors
print(json.dumps({"ok": True, "result": result, "pageErrors": errors, "consoleErrors": console_errors}, ensure_ascii=False, indent=2))
