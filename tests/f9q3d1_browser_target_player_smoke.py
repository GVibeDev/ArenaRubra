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
    page.wait_for_function("typeof BUILD_INFO !== 'undefined' && typeof requestPlayerTargetSelection === 'function' && typeof handTacticTargets === 'function' && typeof abilityTargets === 'function'")

    initial = page.evaluate("""() => {
      state = {
        players:[{id:1},{id:2},{id:3},{id:4,eliminated:true}],
        turnOrder:[1,2,3,4], currentPlayer:1, winner:null, turn:6,
        factions:{1:'Fabeot',2:'Nexus',3:'Exordium',4:'Liberti'},
        modes:{1:'human',2:'bot',3:'bot',4:'bot'},
        energy:{1:20,2:4,3:8,4:9}, pressure:{1:0,2:1,3:2,4:3},
        hand:{1:[],2:[{cardUid:'p2',sourceType:'unit',name:'P2'}],3:[{cardUid:'p3',sourceType:'unit',name:'P3'}],4:[{cardUid:'p4',sourceType:'unit',name:'P4'}]},
        deck:{1:[{cardUid:'d1'}],2:[{cardUid:'d2'}],3:[{cardUid:'d3'}],4:[{cardUid:'d4'}]},
        discard:{1:[],2:[],3:[],4:[]},
        energyLocked:{1:0,2:0,3:0,4:0}, handLocked:{1:0,2:0,3:0,4:0},
        playerEffects:{1:[],2:[],3:[],4:[]}, tacticCooldowns:{1:{},2:{},3:{},4:{}}, tacticUsedThisTurn:{1:false,2:false,3:false,4:false},
        missionRewards:{
          1:{cardCostSequence:null,repeatAttacksRemaining:0,repeatAttacksGranted:0,repeatAttacksUsed:0,repeatAttacksRound:null},
          2:{cardCostSequence:null,repeatAttacksRemaining:0,repeatAttacksGranted:0,repeatAttacksUsed:0,repeatAttacksRound:null},
          3:{cardCostSequence:null,repeatAttacksRemaining:0,repeatAttacksGranted:0,repeatAttacksUsed:0,repeatAttacksRound:null},
          4:{cardCostSequence:null,repeatAttacksRemaining:0,repeatAttacksGranted:0,repeatAttacksUsed:0,repeatAttacksRound:null}
        }, missionPendingReward:null,
        cells:[
          {coord:[0,0,0],ps:true,control:3,terrainType:'free'},
          {coord:[1,0,-1],ps:false,control:null,terrainType:'free'}
        ],
        units:[
          {uid:'caster',id:'FBC1F04',side:1,faction:'Fabeot',name:'Architetto Nero',type:'Fanteria',weight:'Pivot',alive:true,currentHp:8,maxHp:8,currentDef:4,maxDef:4,currentAtt:4,pos:[0,0,0],acted:false,movedThisTurn:false,abilityUsedThisTurn:false,cooldownLeft:0,statuses:[],buffs:[],attacksMade:0,attacksPerTurn:1,ability:{name:'Clausola di Stasi',kind:'lockEnemyEnergy',range:0,cooldown:4,cost:5,target:'enemy_player',filter:'Any'}},
          {uid:'paid2',side:2,faction:'Nexus',name:'Paid 2',type:'Fanteria',alive:true,currentHp:2,maxHp:2,currentDef:1,maxDef:1,currentAtt:1,pos:[1,0,-1],acted:false,statuses:[],buffs:[],ability:{name:'A2',kind:'damage',cost:2,target:'enemy',range:1}},
          {uid:'free3',side:3,faction:'Exordium',name:'Free 3',type:'Fanteria',alive:true,currentHp:2,maxHp:2,currentDef:1,maxDef:1,currentAtt:1,pos:[0,1,-1],acted:false,statuses:[],buffs:[],ability:{name:'A3',kind:'damage',cost:0,target:'enemy',range:1}},
          {uid:'dead4',side:4,faction:'Liberti',name:'Dead 4',type:'Fanteria',alive:true,currentHp:2,maxHp:2,currentDef:1,maxDef:1,currentAtt:1,pos:[-1,1,0],acted:false,statuses:[],buffs:[],ability:{name:'A4',kind:'damage',cost:2,target:'enemy',range:1}}
        ],
        cardCatalog:[], cardDebug:null, mines:[], cellEffects:[], psLocks:[],
        fabeotEconomyAbilityUsed:{1:false,2:false,3:false,4:false}, fabeotConversionUsed:{1:false,2:false,3:false,4:false}
      };
      const usury = {...DECK_TACTICS.find(t=>t.id==='FABTAC09'), sourceType:'tactic', tacticId:'FABTAC09', sourceId:'FABTAC09', cardUid:'usury', zone:'hand'};
      const embargo = {...DECK_TACTICS.find(t=>t.id==='FABTAC07'), sourceType:'tactic', tacticId:'FABTAC07', sourceId:'FABTAC07', cardUid:'embargo', zone:'hand'};
      const tax = {...DECK_TACTICS.find(t=>t.id==='EXTAC10'), sourceType:'tactic', tacticId:'EXTAC10', sourceId:'EXTAC10', cardUid:'tax', zone:'hand'};
      return {
        version:BUILD_INFO.version,
        active:eligiblePlayerTargets(1,{kind:'usury_energy_income_debuff'}).map(t=>t.side),
        usury:handTacticTargets(1,usury).map(t=>t.side),
        embargo:handTacticTargets(1,embargo).map(t=>t.side),
        tax:handTacticTargets(1,tax).map(t=>t.side),
        ability:abilityTargets(state.units[0],state.units[0].ability).map(t=>t.side)
      };
    }""")

    page.evaluate("""() => {
      window.__chosenPlayerSide = null;
      const targets = eligiblePlayerTargets(1,{kind:'usury_energy_income_debuff'});
      requestPlayerTargetSelection({casterSide:1,targets,sourceName:'Usura',context:{kind:'usury_energy_income_debuff'},onSelect:t=>{window.__chosenPlayerSide=t.side;}});
    }""")
    page.wait_for_selector("#playerTargetOverlay:not([hidden])")
    choice_sides = page.locator(".player-target-choice").evaluate_all("els => els.map(el => Number(el.dataset.playerSide))")
    page.locator('.player-target-choice[data-player-side="3"]').click()
    chosen = page.evaluate("window.__chosenPlayerSide")
    overlay_hidden_after = page.locator("#playerTargetOverlay").evaluate("el => el.hidden")

    effects = page.evaluate("""() => {
      const target3=createPlayerTargetToken(3);
      resolveHandTacticEnergyEconomyEffect(1,{sourceType:'tactic',effectKind:'usury_energy_income_debuff',name:'Contratto di Usura'},target3);
      ABILITY_HANDLERS.lockEnemyEnergy(state.units[0],target3,state.units[0].ability);
      return {
        energy2:state.energy[2], energy3:state.energy[3],
        income2:(state.playerEffects[2]||[]).filter(e=>e.kind==='income_delta').length,
        income3:(state.playerEffects[3]||[]).filter(e=>e.kind==='income_delta').length,
        lock2:state.energyLocked[2], lock3:state.energyLocked[3]
      };
    }""")

    # Flusso pubblico reale: carta dalla mano -> selettore -> consumo carta/ENE -> effetto sul solo bersaglio scelto.
    page.evaluate("""() => {
      renderAll=()=>{};
      postActionChecks=()=>{};
      maybeRunBot=()=>{};
      closeHandPanelAfterAcceptedCardPlay=()=>{};
      apkM4CloseHandAfterCardPlay=()=>{};
      state.players=[{id:1},{id:2},{id:3}];
      state.turnOrder=[1,2,3];
      state.currentPlayer=1; state.winner=null; state.modes[1]='human';
      state.energy={1:20,2:4,3:8};
      state.playerEffects={1:[],2:[],3:[]};
      state.hand={1:[],2:[{cardUid:'p2-live',sourceType:'unit',name:'P2'}],3:[{cardUid:'p3-live',sourceType:'unit',name:'P3'}]};
      state.deck={1:[{cardUid:'d1-live'}],2:[{cardUid:'d2-live'}],3:[{cardUid:'d3-live'}]};
      state.discard={1:[],2:[],3:[]};
      const live={...DECK_TACTICS.find(t=>t.id==='FABTAC09'),sourceType:'tactic',tacticId:'FABTAC09',sourceId:'FABTAC09',cardUid:'usury-live',zone:'hand'};
      state.hand[1]=[live];
      beginHandTacticCardPlay('usury-live');
    }""")
    page.wait_for_selector("#playerTargetOverlay:not([hidden])")
    live_card_choice_sides = page.locator(".player-target-choice").evaluate_all("els => els.map(el => Number(el.dataset.playerSide))")
    page.locator('.player-target-choice[data-player-side="3"]').click()
    live_card = page.evaluate("""() => ({
      energy1:state.energy[1], energy2:state.energy[2], energy3:state.energy[3],
      income2:(state.playerEffects[2]||[]).filter(e=>e.kind==='income_delta').length,
      income3:(state.playerEffects[3]||[]).filter(e=>e.kind==='income_delta').length,
      hand1:state.hand[1].map(c=>c.cardUid), discard1:state.discard[1].map(c=>c.cardUid),
      overlayHidden:document.getElementById('playerTargetOverlay').hidden
    })""")

    # Flusso pubblico reale: abilità -> selettore -> costo/cooldown -> effetto sul solo bersaglio scelto.
    page.evaluate("""() => {
      state.players=[{id:1},{id:2},{id:3}]; state.turnOrder=[1,2,3]; state.currentPlayer=1;
      state.energy={1:20,2:4,3:8}; state.energyLocked={1:0,2:0,3:0}; state.handLocked={1:0,2:0,3:0};
      const caster=state.units.find(u=>u.uid==='caster');
      caster.alive=true; caster.acted=false; caster.abilityUsedThisTurn=false; caster.cooldownLeft=0; caster.movedThisTurn=false;
      selectedId='caster'; mode='idle';
      toggleAbilityMode(caster);
    }""")
    page.wait_for_selector("#playerTargetOverlay:not([hidden])")
    live_ability_choice_sides = page.locator(".player-target-choice").evaluate_all("els => els.map(el => Number(el.dataset.playerSide))")
    page.locator('.player-target-choice[data-player-side="3"]').click()
    live_ability = page.evaluate("""() => {
      const caster=state.units.find(u=>u.uid==='caster');
      return {
        energy1:state.energy[1], lock2:state.energyLocked[2], lock3:state.energyLocked[3],
        cooldown:caster.cooldownLeft, abilityUsed:caster.abilityUsedThisTurn, acted:caster.acted,
        overlayHidden:document.getElementById('playerTargetOverlay').hidden
      };
    }""")

    auto = page.evaluate("""() => {
      state.players=[{id:1},{id:2}];
      state.modes[1]='human';
      window.__autoChosen=null;
      const targets=eligiblePlayerTargets(1,{kind:'usury_energy_income_debuff'});
      const result=requestPlayerTargetSelection({casterSide:1,targets,sourceName:'Usura',context:{kind:'usury_energy_income_debuff'},onSelect:t=>{window.__autoChosen=t.side;}});
      const overlay=document.getElementById('playerTargetOverlay');
      return {result,chosen:window.__autoChosen,hidden:!overlay || overlay.hidden};
    }""")

    browser.close()

assert initial["version"].startswith("C2-STABLE-1-F9"), initial
assert initial["active"] == [2,3], initial
assert initial["usury"] == [2,3], initial
assert initial["embargo"] == [2,3], initial
assert initial["tax"] == [2], initial
assert initial["ability"] == [2,3], initial
assert choice_sides == [2,3], choice_sides
assert chosen == 3, chosen
assert overlay_hidden_after, overlay_hidden_after
assert effects == {"energy2":4,"energy3":7,"income2":0,"income3":1,"lock2":0,"lock3":1}, effects
assert live_card_choice_sides == [2,3], live_card_choice_sides
assert live_card == {"energy1":16,"energy2":4,"energy3":7,"income2":0,"income3":1,"hand1":[],"discard1":["usury-live"],"overlayHidden":True}, live_card
assert live_ability_choice_sides == [2,3], live_ability_choice_sides
assert live_ability == {"energy1":15,"lock2":0,"lock3":1,"cooldown":4,"abilityUsed":True,"acted":True,"overlayHidden":True}, live_ability
assert auto == {"result":True,"chosen":2,"hidden":True}, auto
assert not errors, errors
assert not console_errors, console_errors

print(json.dumps({
    "ok": True,
    "initial": initial,
    "choiceSides": choice_sides,
    "chosen": chosen,
    "effects": effects,
    "liveCardChoiceSides": live_card_choice_sides,
    "liveCard": live_card,
    "liveAbilityChoiceSides": live_ability_choice_sides,
    "liveAbility": live_ability,
    "auto1v1": auto,
    "pageErrors": errors,
    "consoleErrors": console_errors
}, ensure_ascii=False, indent=2))
