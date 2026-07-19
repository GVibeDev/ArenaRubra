from __future__ import annotations
import json, pathlib, socket, subprocess, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]

def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]

port = free_port()
server = subprocess.Popen(["python", "-m", "http.server", str(port), "--bind", "127.0.0.1"], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(0.3)
    errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox","--allow-file-access-from-files"])
        page=browser.new_page(viewport={"width":1280,"height":900})
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        page.goto(ROOT.joinpath("index.html").as_uri(), wait_until="load")
        page.wait_for_timeout(500)
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
          state.hand[1].push(createCardInstance(mission,1,'hand',state.hand[1].length));
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
            precheckProblems:pre.problems,
            eventTypes:{progress:EventTypes.MISSION_PROGRESS_CHANGED,ready:EventTypes.MISSION_READY,checkpoint:EventTypes.MISSION_CHECKPOINT},
            missionEvents:state.events.filter(e=>String(e.type).startsWith('MISSION_')).length
          };
        }
        """)
        browser.close()
    ok=(not errors and result["build"]=="C2-STABLE-1-F9N6-APK-M4c" and result["active"] and result["missionId"]=="NXMSN01" and result["objectiveCount"]==3 and result["streak"]>=2 and result["completed"] and result["precheckOk"] and result["missionEvents"]>0)
    print(json.dumps({"ok":ok,"errors":errors,"result":result},ensure_ascii=False,indent=2))
    raise SystemExit(0 if ok else 1)
finally:
    server.terminate()
    server.wait(timeout=5)
