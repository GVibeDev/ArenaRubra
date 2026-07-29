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
        "typeof BUILD_INFO !== 'undefined' && typeof eliminatePlayer === 'function' "
        "&& typeof playerLifecycleCleanupElimination === 'function' && typeof requestPlayerTargetSelection === 'function'"
    )

    initial = page.evaluate("""() => {
      const precheck=runPrecheck({quiet:true,source:'f9q3d3-browser'});
      window.__events=[];
      window.__selectorReopened=false;
      renderAll=()=>{}; maybeRunBot=()=>{}; recordMatchResult=()=>{state.matchRecorded=true;};
      renderMatchupStats=()=>{}; arenaAudioHandleMatchEnd=()=>{};
      log=(message,type,data)=>window.__events.push({message:String(message),type,data});
      missionOpenPendingPlayerRewardSelector=()=>{window.__selectorReopened=true; return true;};
      missionFinalizeReward=(side,result)=>{window.__missionFinalized={side,result};};
      state={
        turn:7, orderIndex:0, turnOrder:[1,2,3,4], currentPlayer:1, winner:null, winnerSide:null, winType:null,
        players:[1,2,3,4].map(id=>({id,eliminated:false,lifecycleStatus:'active'})),
        factions:{1:'Nexus',2:'Exordium',3:'Liberti',4:'Agathoi'}, modes:{1:'human',2:'bot',3:'human',4:'bot'},
        units:[
          {uid:'hq1',side:1,type:'QG',alive:true,pos:[-3,0,3],statuses:[]},
          {uid:'hq2',side:2,type:'QG',alive:true,pos:[3,0,-3],statuses:[]},
          {uid:'hq3',side:3,type:'QG',alive:true,pos:[0,3,-3],statuses:[]},
          {uid:'hq4',side:4,type:'QG',alive:true,pos:[0,-3,3],statuses:[]},
          {uid:'u1',side:1,type:'Fanteria',alive:true,currentHp:2,pos:[0,0,0],statuses:[]},
          {uid:'converted',side:1,originalSide:2,type:'Veicolo',alive:true,currentHp:3,pos:[1,-1,0],statuses:[]},
          {uid:'u2',side:2,type:'Struttura',alive:true,currentHp:3,pos:[2,-1,-1],statuses:[]},
          {uid:'u3',side:3,type:'Fanteria',alive:true,currentHp:2,pos:[-1,1,0],statuses:[{kind:'inhibit_move',owner:2},{kind:'taxed',casterSide:2},{kind:'stealth',owner:4}]},
          {uid:'u4',side:4,type:'Fanteria',alive:true,currentHp:2,pos:[0,-1,1],statuses:[]}
        ],
        cells:[{coord:[2,-1,-1],ps:true,control:2,terrainType:'free'},{coord:[0,0,0],ps:true,control:1,terrainType:'free'}],
        psLocks:[{owner:2,coord:[2,-1,-1]},{owner:3,coord:[0,0,0]}],
        mines:[{owner:2,coord:[2,0,-2],name:'user'},{owner:2,coord:[3,-1,-2],name:'map',initialMapHazard:true},{owner:0,coord:[0,2,-2],name:'neutral',initialMapHazard:true}],
        cellEffects:[{owner:2,coord:[2,1,-3],kind:'trap'},{owner:2,coord:[3,1,-4],kind:'maptrap',initialMapHazard:true},{owner:3,coord:[-1,2,-1],kind:'other'}],
        playerEffects:{1:[{kind:'tax',casterSide:2},{kind:'other',casterSide:3}],2:[{kind:'income',casterSide:1}],3:[],4:[]},
        energy:{1:5,2:8,3:4,4:3}, pressure:{1:0,2:3,3:1,4:0}, desperation:{1:0,2:0,3:0,4:0},
        energyLocked:{1:0,2:2,3:0,4:0}, handLocked:{1:0,2:1,3:0,4:0},
        tacticUsedThisTurn:{1:false,2:true,3:false,4:false}, tacticCooldowns:{1:{},2:{x:2},3:{},4:{}},
        c2eBotHandTacticsUsedThisTurn:{1:0,2:2,3:0,4:0}, fabeotEconomyAbilityUsed:{1:false,2:true,3:false,4:false}, fabeotConversionUsed:{1:false,2:true,3:false,4:false},
        missions:{1:{status:'reward_pending',rewardPending:true},2:{status:'active',ready:true,rewardPending:true},3:null,4:null},
        missionPendingReward:{kind:'mission_player_target_selection',missionOwnerSide:1,targetSides:[2,3],missionName:'Test'},
        hand:{1:[{cardUid:'stolen',originSide:2}],2:[{cardUid:'frozen'}],3:[],4:[]},
        deck:{1:[],2:[{cardUid:'deck2'}],3:[],4:[]}, discard:{1:[],2:[],3:[],4:[]}, matchRecorded:false
      };
      selectedId='u2';
      const targets=[createPlayerTargetToken(2),createPlayerTargetToken(3)];
      requestPlayerTargetSelection({casterSide:1,targets,sourceName:'Test FFA',onSelect:()=>{}});
      return {
        version:BUILD_INFO.version,active:getActivePlayers(),overlayVisible:!document.getElementById('playerTargetOverlay').hidden,
        precheck:{ok:precheck.ok,problems:precheck.problems||[],warnings:precheck.warnings||[]}
      };
    }""")

    eliminated = page.evaluate("""() => {
      const ok=eliminatePlayer(2,1,'qg');
      const hq=state.units.find(u=>u.uid==='hq2');
      const unit=state.units.find(u=>u.uid==='u2');
      const converted=state.units.find(u=>u.uid==='converted');
      const survivor=state.units.find(u=>u.uid==='u3');
      return {
        ok,
        active:getActivePlayers(), lifecycle:playerLifecycleStatus(2),
        record:{by:state.players[1].eliminatedBy,reason:state.players[1].eliminationReason,turn:state.players[1].eliminatedAtTurn},
        unit:{alive:unit.alive,pos:unit.pos}, hq:{alive:hq.alive,activeObjective:hq.activeObjective,eliminatedOwner:hq.eliminatedOwner},
        converted:{alive:converted.alive,side:converted.side}, statuses:survivor.statuses.map(s=>s.owner),
        mines:state.mines.map(m=>({name:m.name,owner:m.owner})), effects:state.cellEffects.map(e=>({kind:e.kind,owner:e.owner})),
        psLocks:state.psLocks.map(l=>l.owner), control:state.cells[0].control,
        playerEffects1:state.playerEffects[1].map(e=>e.casterSide), playerEffects2:state.playerEffects[2],
        locks:{energy:state.energyLocked[2],hand:state.handLocked[2],cooldowns:Object.keys(state.tacticCooldowns[2]).length},
        pendingTargets:state.missionPendingReward.targetSides.slice(), selectorReopened:window.__selectorReopened,
        overlayHidden:document.getElementById('playerTargetOverlay').hidden,
        stolen:state.hand[1].map(c=>c.cardUid), frozen:state.hand[2].map(c=>c.cardUid),
        eligible:eligiblePlayerTargets(1,{}).map(t=>t.side),
        typedEvent:window.__events.some(e=>e.type===EventTypes.PLAYER_ELIMINATED)
      };
    }""")

    turn_skip = page.evaluate("""() => {
      state.currentPlayer=1; state.orderIndex=0; state.turn=10; state.winner=null; state.winnerSide=null;
      let boundaries=0;
      const oldResolve=resolveEndOfRound;
      resolveEndOfRound=()=>{boundaries+=1;};
      const first=advanceToNextActivePlayer();
      state.players.find(p=>p.id===4).eliminated=true;
      state.players.find(p=>p.id===4).lifecycleStatus='eliminated';
      state.currentPlayer=3; state.orderIndex=2;
      const second=advanceToNextActivePlayer();
      resolveEndOfRound=oldResolve;
      const result={first,afterFirst:{player:3,turn:10},second,current:state.currentPlayer,turn:state.turn,boundaries};
      const p4=state.players.find(p=>p.id===4); p4.eliminated=false; p4.lifecycleStatus='active';
      state.currentPlayer=1; state.orderIndex=0;
      return result;
    }""")

    final_state = page.evaluate("""() => {
      state.missionPendingReward={kind:'enemy_discard_selection',missionOwnerSide:1,chooserSide:3,required:1};
      eliminatePlayer(3,1,'qg');
      const pendingAfter3=state.missionPendingReward;
      eliminatePlayer(4,1,'qg');
      return {
        pendingAfter3,
        winner:state.winnerSide,
        winnerStatus:playerLifecycleStatus(1),
        recorded:state.matchRecorded,
        snapshot:playerLifecycleSnapshot()
      };
    }""")

    browser.close()

assert initial == {
    "version":"C2-STABLE-1-F9Q3d3-APK-M4c",
    "active":[1,2,3,4],
    "overlayVisible":True,
    "precheck":{"ok":True,"problems":[],"warnings":[]}
}, initial
assert eliminated["ok"] is True, eliminated
assert eliminated["active"] == [1,3,4], eliminated
assert eliminated["lifecycle"] == "eliminated", eliminated
assert eliminated["record"] == {"by":1,"reason":"qg","turn":7}, eliminated
assert eliminated["unit"] == {"alive":False,"pos":None}, eliminated
assert eliminated["hq"] == {"alive":True,"activeObjective":False,"eliminatedOwner":True}, eliminated
assert eliminated["converted"] == {"alive":True,"side":1}, eliminated
assert eliminated["statuses"] == [4], eliminated
assert eliminated["mines"] == [{"name":"map","owner":0},{"name":"neutral","owner":0}], eliminated
assert eliminated["effects"] == [{"kind":"maptrap","owner":0},{"kind":"other","owner":3}], eliminated
assert eliminated["psLocks"] == [3] and eliminated["control"] is None, eliminated
assert eliminated["playerEffects1"] == [3] and eliminated["playerEffects2"] == [], eliminated
assert eliminated["locks"] == {"energy":0,"hand":0,"cooldowns":0}, eliminated
assert eliminated["pendingTargets"] == [3] and eliminated["selectorReopened"] is True, eliminated
assert eliminated["overlayHidden"] is True, eliminated
assert eliminated["stolen"] == ["stolen"] and eliminated["frozen"] == ["frozen"], eliminated
assert eliminated["eligible"] == [3,4], eliminated
assert eliminated["typedEvent"] is True, eliminated
assert turn_skip == {"first":3,"afterFirst":{"player":3,"turn":10},"second":1,"current":1,"turn":11,"boundaries":1}, turn_skip
assert final_state["pendingAfter3"] is None, final_state
assert final_state["winner"] == 1 and final_state["winnerStatus"] == "winner" and final_state["recorded"] is True, final_state
assert final_state["snapshot"]["1"]["status"] == "winner", final_state
assert final_state["snapshot"]["2"]["status"] == "eliminated", final_state
assert final_state["snapshot"]["3"]["status"] == "eliminated", final_state
assert final_state["snapshot"]["4"]["status"] == "eliminated", final_state
assert not errors, errors
assert not console_errors, console_errors

print(json.dumps({
    "ok":True,
    "initial":initial,
    "eliminated":eliminated,
    "turnSkip":turn_skip,
    "finalState":final_state,
    "pageErrors":errors,
    "consoleErrors":console_errors
}, ensure_ascii=False, indent=2))
