from __future__ import annotations
import json, pathlib, re
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
scripts=re.findall(r'<script\s+src="([^"]+)"\s*></script>',index)
html=re.sub(r'<script\s+src="[^"]+"\s*></script>','',index)
html=re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>','',html)
errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox","--allow-file-access-from-files"])
    page=browser.new_page(viewport={"width":1280,"height":900})
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.set_content(html,wait_until='load')
    page.add_style_tag(path=str(ROOT/'css/style.css'))
    page.add_style_tag(path=str(ROOT/'css/renderer_calibration_lab.css'))
    for rel in scripts:
        page.add_script_tag(path=str(ROOT/rel))
    page.wait_for_timeout(100)
    result=page.evaluate("""
    () => {
      const setup={
        factions:{1:'Nexus',2:'Exordium'},
        selectedCommanders:{1:'NXCMD01',2:'EX0B00'},
        selectedDecks:{1:{mode:'template'},2:{mode:'template'}},
        modes:{1:'human',2:'human'}, autoResignEnabled:false, aiMode:'advanced', pacePreset:'standard', gameScaleMode:'large_scale'
      };
      newGame(setup);
      const mission=buildCardCatalog().find(c=>c.id==='MISSION:NXMSN01');
      const zones=[...(state.hand[1]||[]),...(state.deck[1]||[]),...(state.discard[1]||[])];
      if (!zones.some(card=>card && (card.sourceType==='mission' || card.id==='MISSION:NXMSN01' || card.definitionId==='NXMSN01'))) {
        state.hand[1].push(createCardInstance(mission,1,'hand',state.hand[1].length));
      }
      initializeMissionTrackerForGame();
      const center=state.cells.find(c=>c.ps&&sameCoord(c.coord,CENTER_PS_COORD));
      const other=state.cells.find(c=>c.ps&&!sameCoord(c.coord,CENTER_PS_COORD));
      center.control=1; other.control=1;
      missionCheckpointTurnStart(1);
      missionCheckpointTurnStart(1);
      const diag=missionDiagnosticsForSide(1);
      const pre=runPrecheck({quiet:true,source:'f9n6_browser'});
      return {
        build:buildInfoLabel(),
        active:diag.active,
        missionId:diag.missionId,
        objectiveCount:diag.objectives.length,
        streak:diag.objectives[0].progress.streak,
        completed:diag.objectives[0].progress.completed,
        ready:diag.ready,
        precheckOk:pre.ok,
        precheckRendererOk:!pre.problems.some(problem=>String(problem).startsWith('F9O4b:')),
        precheckProblems:pre.problems,
        eventTypes:{progress:EventTypes.MISSION_PROGRESS_CHANGED,ready:EventTypes.MISSION_READY,checkpoint:EventTypes.MISSION_CHECKPOINT},
        missionEvents:state.events.filter(e=>String(e.type).startsWith('MISSION_')).length
      };
    }
    """)
    browser.close()
ok=(not errors and result["build"] in {"C2-STABLE-1-F9N6-APK-M4c","C2-STABLE-1-F9O4a-APK-M4c","C2-STABLE-1-F9O4b-APK-M4c","C2-STABLE-1-F9O4c-APK-M4c","C2-STABLE-1-F9O4d-APK-M4c","C2-STABLE-1-F9O4f-APK-M4c","C2-STABLE-1-F9O4e-APK-M4c","C2-STABLE-1-F9O5-APK-M4c","C2-STABLE-1-F9O5a-APK-M4c", "C2-STABLE-1-F9O5b-APK-M4c", "C2-STABLE-1-F9O6-APK-M4c","C2-STABLE-1-F9O7e-APK-M4c",'C2-STABLE-1-F9S1b1-APK-M4c'} and result["active"] and result["missionId"]=="NXMSN01" and result["objectiveCount"]==3 and result["streak"]>=2 and result["completed"] and result["precheckRendererOk"] and result["missionEvents"]>0)
print(json.dumps({"ok":ok,"errors":errors,"result":result},ensure_ascii=False,indent=2))
raise SystemExit(0 if ok else 1)
