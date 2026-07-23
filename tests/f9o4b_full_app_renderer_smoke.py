from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re

ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
scripts=re.findall(r'<script\s+src="([^"]+)"\s*></script>',index)
html=re.sub(r'<script\s+src="[^"]+"\s*></script>','',index)
html=re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>','',html)
errors=[]; console_errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1280,'height':820},has_touch=True)
    page.on('pageerror',lambda exc: errors.append(str(exc)))
    page.on('console',lambda msg: console_errors.append(msg.text) if msg.type=='error' else None)
    page.set_content(html,wait_until='load')
    page.add_style_tag(path=str(ROOT/'css/style.css'))
    page.add_style_tag(path=str(ROOT/'css/renderer_calibration_lab.css'))
    for rel in scripts:
        page.add_script_tag(path=str(ROOT/rel))
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.wait_for_timeout(150)
    base=page.evaluate("() => ({build:BUILD_INFO.version,pre:runPrecheck({quiet:true,source:'f9o4b-full'}),scripts:document.scripts.length})")
    page.evaluate("() => newGame({modes:{1:'human',2:'human'},factions:{1:'Nexus',2:'Exordium'},aiMode:'advanced',pacePreset:'standard'})")
    page.wait_for_timeout(100)
    started=page.evaluate("() => ({cells:document.querySelectorAll('#board .hex').length,marker:document.getElementById('board').dataset.renderer,diag:boardRenderDiagnostics(),units:state.units.length})")
    injected=page.evaluate("""() => {
      const bp=BLUEPRINTS.find(x=>x.id==='NXC1F01') || BLUEPRINTS.find(x=>x.faction==='Nexus' && x.type==='Fanteria');
      const unit=createUnitFromBlueprint(bp,1); unit.pos=[0,0,0]; unit.acted=false; state.units.push(unit); selectedId=unit.uid; mode='idle'; renderAll();
      window.__testUid=unit.uid; window.__testToken=document.querySelector(`[data-unit-uid="${unit.uid}"]`);
      return {uid:unit.uid,token:!!window.__testToken,parent:window.__testToken&&window.__testToken.parentElement.dataset.coordKey,diag:boardRenderDiagnostics()};
    }""")
    updated=page.evaluate("""() => {
      const unit=state.units.find(u=>u.uid===window.__testUid); unit.currentHp=Math.max(1,unit.currentHp-1); renderAll();
      const token=document.querySelector(`[data-unit-uid="${unit.uid}"]`);
      return {same:token===window.__testToken,hp:token.querySelector('.statHp').textContent,diag:boardRenderDiagnostics()};
    }""")
    moved=page.evaluate("""() => {
      const unit=state.units.find(u=>u.uid===window.__testUid); unit.pos=[1,-1,0]; renderAll();
      const token=document.querySelector(`[data-unit-uid="${unit.uid}"]`);
      return {same:token===window.__testToken,parent:token.parentElement.dataset.coordKey,diag:boardRenderDiagnostics()};
    }""")
    delegated_move=page.evaluate("""() => {
      const unit=state.units.find(u=>u.uid===window.__testUid); unit.acted=false; selectedId=unit.uid; mode='move';
      const target=movableCells(unit)[0]; renderAll();
      const key=target.join(','); const cell=document.querySelector(`[data-coord-key="${key}"]`); cell.click();
      return {target:key,pos:unit.pos.join(','),sameToken:document.querySelector(`[data-unit-uid="${unit.uid}"]`)===window.__testToken,diag:boardRenderDiagnostics()};
    }""")
    post=page.evaluate("runPrecheck({quiet:true,source:'f9o4b-full-post'})")
    browser.close()
unexpected_console_errors=[msg for msg in console_errors if not msg.startswith('Arena AppShell: inizializzazione GameScreen non bloccante fallita')]
result={'ok':True,'base':{'build':base['build'],'preOk':base['pre']['ok'],'problems':base['pre']['problems']},'started':started,'injected':injected,'updated':updated,'moved':moved,'delegatedMove':delegated_move,'post':{'ok':post['ok'],'problems':post['problems']},'pageErrors':errors,'consoleErrors':unexpected_console_errors,'ignoredBaselineConsoleErrors':len(console_errors)-len(unexpected_console_errors)}
print(json.dumps(result,ensure_ascii=False,indent=2))
assert base['build'] in {'C2-STABLE-1-F9O4b-APK-M4c','C2-STABLE-1-F9O4c-APK-M4c','C2-STABLE-1-F9O4d-APK-M4c','C2-STABLE-1-F9O4f-APK-M4c','C2-STABLE-1-F9O4e-APK-M4c'},base
assert base['pre']['ok'],base['pre']['problems']
assert started['cells']==127 and started['marker'] in {'incremental-f9o4b','incremental-f9o4c'},started
assert injected['token'] and updated['same'] and moved['same'] and moved['parent']=='1,-1,0',(injected,updated,moved)
assert delegated_move['target']==delegated_move['pos'] and delegated_move['sameToken'],delegated_move
assert post['ok'],post['problems']
assert not errors,errors
assert not unexpected_console_errors,unexpected_console_errors
