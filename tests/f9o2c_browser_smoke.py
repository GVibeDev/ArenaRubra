from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT = Path(__file__).resolve().parents[1]
errors=[]
console_errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--allow-file-access-from-files'])
    page=browser.new_page(viewport={"width":900,"height":520}, is_mobile=True, has_touch=True)
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type=='error' else None)
    page.set_content('''<!doctype html><html><body>
      <div id="boardWrap" style="position:relative;width:860px;height:430px;overflow:hidden">
        <div id="boardVisualStack" style="position:absolute;width:920px;height:780px;left:0;top:0"><div id="board"></div></div>
      </div>
      <div id="mapCameraControls"><button></button></div><span id="mapCameraZoomLabel"></span><span id="gameHudCamera"></span>
    </body></html>''')
    page.add_script_tag(content='''
      const CENTER_X=460,CENTER_Y=390,HEX_SIZE=45,CENTER_PS_COORD=[0,0,0];
      let selectedId=null, state={units:[],currentPlayer:1,modes:{1:'bot',2:'bot'}};
      function getSelectedUnit(){return null}
      function updateBoardCameraHud(){}
      function updateApkM4StatusStrip(){}
      function renderAll(){ if(typeof syncBoardCameraAfterRender==='function') syncBoardCameraAfterRender(); }
    ''')
    page.add_script_tag(path=str(ROOT/'src/camera.js'))
    page.add_script_tag(path=str(ROOT/'src/mobile.js'))
    page.add_script_tag(path=str(ROOT/'src/camera_interaction.js'))
    page.wait_for_timeout(120)
    page.evaluate('''() => {
      apkM4Camera.mobile=true;
      document.body.classList.add('mobile-apk-m4');
      apkM4Camera.fitScale=.4973;
      apkM4Camera.zoom=1.684;
      apkM4Camera.x=71;
      apkM4Camera.y=-52;
      apkM4Camera.mode='manual';
      applyApkM4Camera();
    }''')
    before=page.evaluate('''() => ({fitScale:apkM4Camera.fitScale,zoom:apkM4Camera.zoom,x:apkM4Camera.x,y:apkM4Camera.y,mode:apkM4Camera.mode})''')
    page.evaluate('''() => { for(let i=0;i<120;i++) renderAll(); }''')
    page.wait_for_timeout(150)
    after=page.evaluate('''() => ({fitScale:apkM4Camera.fitScale,zoom:apkM4Camera.zoom,x:apkM4Camera.x,y:apkM4Camera.y,mode:apkM4Camera.mode})''')
    assert after==before, (before,after)
    # L'input manuale resta operativo e non viene annullato dal render bot successivo.
    page.evaluate('''() => { cameraSetZoom(1.25,{animate:false}); cameraInteractionPanBy(14,-9); }''')
    manual=page.evaluate('''() => ({fitScale:apkM4Camera.fitScale,zoom:apkM4Camera.zoom,x:apkM4Camera.x,y:apkM4Camera.y,mode:apkM4Camera.mode})''')
    page.evaluate('''() => { for(let i=0;i<80;i++) renderAll(); }''')
    page.wait_for_timeout(120)
    final=page.evaluate('''() => ({fitScale:apkM4Camera.fitScale,zoom:apkM4Camera.zoom,x:apkM4Camera.x,y:apkM4Camera.y,mode:apkM4Camera.mode})''')
    assert final==manual, (manual,final)
    browser.close()
print(json.dumps({'ok':True,'initialStable':after,'manualStable':final,'pageErrors':errors,'consoleErrors':console_errors},ensure_ascii=False,indent=2))
assert not errors, errors
assert not console_errors, console_errors
