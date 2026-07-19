from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1]
errors=[]; console_errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--allow-file-access-from-files'])
    page=browser.new_page(viewport={"width":1280,"height":820})
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type=='error' else None)
    page.set_content('''<!doctype html><html><body>
      <div id="boardWrap" style="position:relative;width:1000px;height:650px;overflow:hidden">
        <div id="boardVisualStack" style="position:absolute;width:920px;height:780px;left:40px;top:-65px">
          <div id="board"></div>
        </div>
      </div>
      <div id="mapCameraControls"><button></button></div><span id="mapCameraZoomLabel"></span><span id="gameHudCamera"></span>
      <div id="selectedUnitFloat"></div><button id="toggleSelectedUnitFloatBtn"></button>
    </body></html>''')
    page.add_script_tag(content='''
      const CENTER_X=460, CENTER_Y=390, HEX_SIZE=45, CENTER_PS_COORD=[0,0,0];
      let state={units:[{uid:'u1',alive:true,pos:[1,-1,0],side:1}], currentPlayer:2, modes:{1:'human',2:'bot'}};
      let selectedId='ai-selection', mode='ability', pendingAbility={id:'ai'}, pendingHandCardUid='ai-card';
      let pendingBuildBlueprintId=null,pendingPurchaseBlueprintId=null,pendingTacticId=null,botRunning=true;
      function getSelectedUnit(){return state.units.find(u=>u.uid===selectedId)||null}
      function getUnitAt(){return state.units[0]}
      function missionInteractionBlocked(){return false}
      function renderAll(){}
      function setApkM4Panel(){}
      function spawnCellsFor(){return [[-4,0,4],[0,0,0],[4,0,-4]]}
      function getHq(side){return {uid:'hq'+side,pos:side===1?[-6,0,6]:[6,0,-6]}}
      function updateBoardCameraHud(){}
      function applyBuildInfoToDom(){}
    ''')
    for rel in ['src/camera.js','src/mobile.js','src/camera_interaction.js','src/game_screen.js','src/controller.js']:
        page.add_script_tag(path=str(ROOT/rel))
    page.evaluate('''() => {
      boardCamera.initialized=true; boardCamera.mode='focus'; boardCamera.fitScale=0.8; boardCamera.zoom=1.3; boardCamera.x=137; boardCamera.y=-91;
      syncBoardCameraAfterRender();
    }''')
    before_after=page.evaluate('''() => ({x:boardCamera.x,y:boardCamera.y,zoom:boardCamera.zoom,mode:boardCamera.mode})''')
    assert before_after=={'x':137,'y':-91,'zoom':1.3,'mode':'focus'}, before_after
    page.evaluate('handleCellClick([1,-1,0])')
    inspect=page.evaluate('''() => ({inspected:gameScreenUiState.inspectedUnitId, selectedId, mode, pendingHandCardUid})''')
    assert inspect['inspected']=='u1', inspect
    assert inspect['selectedId']=='ai-selection' and inspect['mode']=='ability' and inspect['pendingHandCardUid']=='ai-card', inspect
    page.evaluate('''() => { botRunning=false; state.modes[2]='human'; boardCamera.mode='manual'; boardCamera.x=55; boardCamera.y=66; boardCamera.zoom=1.25; syncBoardCameraAfterRender(); }''')
    stable=page.evaluate('''() => ({x:boardCamera.x,y:boardCamera.y,zoom:boardCamera.zoom,mode:boardCamera.mode})''')
    assert stable=={'x':55,'y':66,'zoom':1.25,'mode':'manual'}, stable
    fit=page.evaluate('''() => { const bp={id:'bp'}; const ok=cameraFitDeploymentTargets(2,bp,{animate:false}); return {ok,x:boardCamera.x,y:boardCamera.y,zoom:boardCamera.zoom,mode:boardCamera.mode}; }''')
    assert fit['ok'] and fit['mode']=='deployment-fit', fit
    assert 0.72 <= fit['zoom'] <= 1.72, fit
    browser.close()
print(json.dumps({'ok':True,'cameraStable':before_after,'inspection':inspect,'manualStable':stable,'deploymentFit':fit,'pageErrors':errors,'consoleErrors':console_errors},ensure_ascii=False,indent=2))
assert not errors, errors
assert not console_errors, console_errors
