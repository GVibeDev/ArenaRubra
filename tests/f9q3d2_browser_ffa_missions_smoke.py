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
    page.wait_for_function("typeof BUILD_INFO !== 'undefined' && typeof missionPlayOrdinary === 'function' && typeof missionCreateTargetSelection === 'function'")

    setup = page.evaluate("""() => {
      renderAll=()=>{};
      maybeRunBot=()=>{};
      missionUiOpenPanel=()=>{};
      missionUiCancelSelection=()=>{};
      postActionChecks=()=>{};
      discardPlayedHandCard=(side,uid)=>{
        const i=(state.hand[side]||[]).findIndex(c=>c.cardUid===uid);
        if(i<0) return null;
        const [card]=state.hand[side].splice(i,1);
        state.discard[side].push(card);
        return card;
      };
      discardCard=(side,uid)=>{
        const i=(state.hand[side]||[]).findIndex(c=>c.cardUid===uid);
        if(i<0) return null;
        const [card]=state.hand[side].splice(i,1);
        state.discard[side].push(card);
        return card;
      };
      state={
        players:[{id:1},{id:2},{id:3},{id:4,eliminated:true}], turnOrder:[1,2,3,4], currentPlayer:1, winner:null, turn:9,
        factions:{1:'Fabeot',2:'Nexus',3:'Exordium',4:'Liberti'}, modes:{1:'human',2:'bot',3:'human',4:'bot'},
        energy:{1:10,2:8,3:9,4:20}, pressure:{1:0,2:2,3:4,4:9},
        hand:{1:[],2:[],3:[],4:[]}, deck:{1:[],2:[],3:[],4:[]}, discard:{1:[],2:[],3:[],4:[]},
        handLocked:{1:0,2:0,3:0,4:0}, energyLocked:{1:0,2:0,3:0,4:0},
        missions:{1:null,2:null,3:null,4:null}, missionPendingReward:null, missionRewards:null,
        missionTelemetry:null, turnsStarted:{1:1,2:1,3:1,4:1},
        cells:[{coord:[0,0,0],ps:true,control:2,terrainType:'free'}],
        units:[
          {uid:'own',side:1,type:'Fanteria',alive:true,currentHp:3,pos:[-1,1,0],statuses:[]},
          {uid:'e2a',side:2,type:'Veicolo',alive:true,currentHp:3,pos:[1,0,-1],statuses:[]},
          {uid:'e2b',side:2,type:'Fanteria',alive:true,currentHp:3,pos:[2,0,-2],statuses:[]},
          {uid:'e3a',side:3,type:'Comandante',role:'commander',alive:true,currentHp:3,pos:[0,1,-1],statuses:[]},
          {uid:'e3b',side:3,type:'Veicolo',alive:true,currentHp:3,pos:[0,2,-2],statuses:[]},
          {uid:'e4a',side:4,type:'Fanteria',alive:true,currentHp:3,pos:[0,-2,2],statuses:[]}
        ]
      };
      window.__controlledPs={1:0,2:2,3:0,4:4};
      countControlledPS=side=>window.__controlledPs[side]||0;
      getHq=side=>({side,pos:side===1?[-8,0,8]:side===2?[8,0,-8]:side===3?[0,4,-4]:[0,-8,8]});
      return {version:BUILD_INFO.version, enemies:missionEnemySides(1), enemyUnits:missionEnemyUnits(1).map(u=>u.uid).sort()};
    }""")

    # Real ordinary Mission flow: card from hand -> mandatory player selector -> reward on selected opponent only.
    page.evaluate("""() => {
      const def=missionDefinitionById('FBMSN01');
      const runtime=createMissionRuntime(1,def); runtime.ready=true; runtime.status='ready';
      state.missions[1]=runtime;
      state.hand[1]=[{cardUid:'mission-energy',id:'MISSION:FBMSN01',sourceId:'FBMSN01',missionId:'FBMSN01',sourceType:'mission',cardType:'mission',deckRole:'mission',name:def.name}];
      window.__playedEnergyMission=missionPlayOrdinary(1,{evaluate:false});
    }""")
    page.wait_for_selector("#playerTargetOverlay:not([hidden])")
    energy_choices = page.locator(".player-target-choice").evaluate_all("els => els.map(el => Number(el.dataset.playerSide))")
    cancel_present = page.locator("#playerTargetCancel").count() and page.locator("#playerTargetCancel").is_visible()
    page.locator('.player-target-choice[data-player-side="3"]').click()
    energy_result = page.evaluate("""() => ({
      played:window.__playedEnergyMission,
      energy2:state.energy[2], energy3:state.energy[3], energy4:state.energy[4],
      hand1:state.hand[1].length, discard1:state.discard[1].map(c=>c.cardUid),
      resolved:state.missions[1].rewardResolved, target:state.missions[1].rewardResult && state.missions[1].rewardResult.targetSide,
      overlayHidden:document.getElementById('playerTargetOverlay').hidden
    })""")

    # Real Cospirazione flow: selected bot chooses and discards half ordinary cards; protected card remains.
    page.evaluate("""() => {
      state.missionPendingReward=null;
      state.energy={1:10,2:8,3:9,4:20};
      state.hand[2]=[
        {cardUid:'2a',id:'2a',name:'A',cost:1},{cardUid:'2b',id:'2b',name:'B',cost:2},
        {cardUid:'2c',id:'2c',name:'C',cost:3},{cardUid:'2d',id:'2d',name:'D',cost:4},
        {cardUid:'2m',id:'2m',name:'Missione',deckRole:'mission',sourceType:'mission'}
      ];
      state.hand[3]=[{cardUid:'3a',id:'3a',name:'E',cost:1},{cardUid:'3b',id:'3b',name:'F',cost:2}];
      const def=missionDefinitionById('FBMSN02');
      const runtime=createMissionRuntime(1,def); runtime.ready=true; runtime.status='ready';
      state.missions[1]=runtime;
      state.hand[1]=[{cardUid:'mission-discard',id:'MISSION:FBMSN02',sourceId:'FBMSN02',missionId:'FBMSN02',sourceType:'mission',cardType:'mission',deckRole:'mission',name:def.name}];
      window.__playedDiscardMission=missionPlayOrdinary(1,{evaluate:false});
    }""")
    page.wait_for_selector("#playerTargetOverlay:not([hidden])")
    discard_choices = page.locator(".player-target-choice").evaluate_all("els => els.map(el => Number(el.dataset.playerSide))")
    page.locator('.player-target-choice[data-player-side="2"]').click()
    discard_result = page.evaluate("""() => ({
      played:window.__playedDiscardMission,
      ordinary2:state.hand[2].filter(c=>c.deckRole!=='mission').map(c=>c.cardUid).sort(),
      protected2:state.hand[2].filter(c=>c.deckRole==='mission').map(c=>c.cardUid),
      hand3:state.hand[3].map(c=>c.cardUid).sort(), discard2:state.discard[2].map(c=>c.cardUid).sort(),
      resolved:state.missions[1].rewardResolved, target:state.missions[1].rewardResult && state.missions[1].rewardResult.targetSide
    })""")

    # Per-opponent enemy-turn streak and Anatema target pool.
    ffa_state = page.evaluate("""() => {
      state.missionPendingReward=null;
      const runtime=createMissionRuntime(1,missionDefinitionById('EXMSND01'));
      state.missions[1]=runtime;
      for(let i=0;i<3;i++){
        missionEvaluateSide(1,'p2',{checkpoint:'turn_start',side:2,round:state.turn});
        missionEvaluateSide(1,'p3',{checkpoint:'turn_start',side:3,round:state.turn});
      }
      const streak={...state.missions[1].entries.c2.streakByEnemy};
      const source=state.missions[1].entries.c2.sourceEnemySide;
      const completed=state.missions[1].entries.c2.completed;
      state.missionPendingReward=null;
      const anatema=missionCreateTargetSelection(1,missionDefinitionById('FBMSND01'),3);
      return {
        streak,source,completed,anatema,
        eligible:state.missionPendingReward.groups[0].eligibleUids.slice().sort(),
        required:state.missionPendingReward.groups[0].required,
        diagnostics:Object.keys(missionDiagnosticsSummary().sides)
      };
    }""")

    browser.close()

assert setup["version"].startswith("C2-STABLE-1-F9"), setup
assert setup["enemies"] == [2,3], setup
assert setup["enemyUnits"] == ["e2a","e2b","e3a","e3b"], setup
assert energy_choices == [2,3], energy_choices
assert cancel_present is False, cancel_present
assert energy_result == {
    "played":True,"energy2":8,"energy3":5,"energy4":20,
    "hand1":0,"discard1":["mission-energy"],"resolved":True,"target":3,"overlayHidden":True
}, energy_result
assert discard_choices == [2,3], discard_choices
assert discard_result == {
    "played":True,"ordinary2":["2c","2d"],"protected2":["2m"],"hand3":["3a","3b"],
    "discard2":["2a","2b"],"resolved":True,"target":2
}, discard_result
assert ffa_state["streak"] == {"2":3,"3":0}, ffa_state
assert ffa_state["source"] == 2 and ffa_state["completed"] is True, ffa_state
assert ffa_state["eligible"] == ["e2a","e2b","e3a","e3b"], ffa_state
assert ffa_state["required"] == 3, ffa_state
assert ffa_state["diagnostics"] == ["1","2","3","4"], ffa_state
assert not errors, errors
assert not console_errors, console_errors

print(json.dumps({
    "ok":True,
    "setup":setup,
    "energyChoices":energy_choices,
    "energyResult":energy_result,
    "discardChoices":discard_choices,
    "discardResult":discard_result,
    "ffaState":ffa_state,
    "pageErrors":errors,
    "consoleErrors":console_errors
}, ensure_ascii=False, indent=2))
