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
    page=browser.new_page(viewport={'width':920,'height':500},has_touch=True,is_mobile=True)
    page.on('pageerror',lambda exc: errors.append(str(exc)))
    page.on('console',lambda msg: console_errors.append(msg.text) if msg.type=='error' else None)
    page.set_content(html,wait_until='load')
    # Emula una WebView precedente a Element.replaceChildren.
    page.evaluate("() => { try { Element.prototype.replaceChildren = undefined; } catch (_) {} }")
    page.add_style_tag(path=str(ROOT/'css/style.css'))
    page.add_style_tag(path=str(ROOT/'css/renderer_calibration_lab.css'))
    for rel in scripts:
        page.add_script_tag(path=str(ROOT/rel))
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.wait_for_timeout(180)
    base=page.evaluate("""() => ({
      build:BUILD_INFO.version,
      pre:runPrecheck({quiet:true,source:'f9o4c-browser-base'}),
      replaceChildren:typeof document.getElementById('board').replaceChildren,
      mobile:document.body.classList.contains('mobile-apk-m4'),
      gameBar:!!document.getElementById('mobileGameBar')
    })""")
    page.evaluate("() => newGame({modes:{1:'human',2:'human'},factions:{1:'Nexus',2:'Exordium'},aiMode:'advanced',pacePreset:'standard'})")
    page.wait_for_timeout(180)
    started=page.evaluate("""() => ({
      cells:document.querySelectorAll('#board .hex').length,
      marker:document.getElementById('board').dataset.renderer,
      diag:boardRenderDiagnostics(),
      menuButtons:document.querySelectorAll('#mobileGameBar button').length,
      overlay:!!document.getElementById('mapHandOverlay'),
      handCanvases:document.querySelectorAll('[data-hand-thumb-card-uid]').length
    })""")
    # Rimozione artificiale di una cella: il renderer deve autoriparare lo skeleton.
    repaired=page.evaluate("""() => {
      const cell=document.querySelector('#board .hex'); if(cell) cell.remove();
      const before=document.querySelectorAll('#board .hex').length;
      renderBoard();
      return {before,after:document.querySelectorAll('#board .hex').length,diag:boardRenderDiagnostics()};
    }""")
    # Aperture/chiusure rapide dei bottom menu: solo l'ultima richiesta deve vincere.
    page.evaluate("""() => {
      const sequence=['hand','actions','log','setup','hand','actions','log','hand'];
      for(let i=0;i<24;i++){
        setApkM4Panel(sequence[i%sequence.length],{force:true});
        renderAll();
      }
      setApkM4Panel('hand',{force:true});
    }""")
    page.wait_for_timeout(650)
    panels=page.evaluate("""() => ({
      cells:document.querySelectorAll('#board .hex').length,
      gameBar:!!document.getElementById('mobileGameBar'),
      buttons:document.querySelectorAll('#mobileGameBar button').length,
      handOpen:document.body.classList.contains('mobile-panel-hand'),
      pending:document.body.classList.contains('mobile-panel-layout-pending'),
      handPanel:!!document.querySelector('.handPrimaryDock'),
      actionsPanel:!!document.querySelector('.tacticDock'),
      logPanel:!!document.querySelector('.logPanel'),
      setupPanel:!!document.querySelector('.setupPanel'),
      overlay:!!document.getElementById('mapHandOverlay')
    })""")
    # Verifica CSS: un canvas ancora pending non deve nascondere il fallback.
    fallback=page.evaluate("""() => {
      const host=document.createElement('div');
      host.className='mapHandVisualCard';
      host.innerHTML='<div class="mapHandThumbFrame"><canvas class="mapHandThumbCanvas"></canvas><div class="handCardThumbFallback">CARICAMENTO</div></div>';
      document.body.appendChild(host);
      const node=host.querySelector('.handCardThumbFallback');
      const pendingDisplay=getComputedStyle(node).display;
      host.classList.add('thumbRendered');
      const readyDisplay=getComputedStyle(node).display;
      host.remove();
      return {pendingDisplay,readyDisplay};
    }""")
    page.evaluate("""() => {
      window.__f9o4cImageEvents=[];
      const good='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%222%22 height=%222%22%3E%3Crect width=%222%22 height=%222%22/%3E%3C/svg%3E';
      cardRendererLoadFirstAvailableImage(['data:image/png;base64,broken-first',good],(status,src)=>window.__f9o4cImageEvents.push({group:'fallback',status,src}));
      cardRendererLoadFirstAvailableImage(['data:image/png;base64,broken-a','data:image/png;base64,broken-b'],(status,src)=>window.__f9o4cImageEvents.push({group:'exhausted',status,src}));
    }""")
    page.wait_for_timeout(260)
    image_fallback=page.evaluate("() => window.__f9o4cImageEvents")
    post=page.evaluate("runPrecheck({quiet:true,source:'f9o4c-browser-post'})")
    browser.close()

unexpected=[msg for msg in console_errors if not msg.startswith('Arena AppShell: inizializzazione GameScreen non bloccante fallita') and msg != 'Failed to load resource: net::ERR_INVALID_URL']
result={
  'ok':True,'base':base,'started':started,'repaired':repaired,'panels':panels,
  'fallback':fallback,'imageFallback':image_fallback,'post':{'ok':post['ok'],'problems':post['problems']},
  'pageErrors':errors,'consoleErrors':unexpected,
  'ignoredBaselineConsoleErrors':len(console_errors)-len(unexpected)
}
print(json.dumps(result,ensure_ascii=False,indent=2))
assert base['build'] in {'C2-STABLE-1-F9O4c-APK-M4c','C2-STABLE-1-F9O4d-APK-M4c'},base
assert base['pre']['ok'],base['pre']['problems']
assert base['replaceChildren']=='undefined',base
assert base['mobile'] and base['gameBar'],base
assert started['cells']==127 and started['marker']=='incremental-f9o4c',started
assert repaired['before']==126 and repaired['after']==127,repaired
assert panels['cells']==127 and panels['gameBar'] and panels['buttons']>=6,panels
assert panels['handOpen'] and not panels['pending'],panels
assert all(panels[k] for k in ['handPanel','actionsPanel','logPanel','setupPanel','overlay']),panels
assert fallback['pendingDisplay']!='none' and fallback['readyDisplay']=='none',fallback
assert any(e['group']=='fallback' and e['status']=='loaded' for e in image_fallback),image_fallback
assert any(e['group']=='exhausted' and e['status']=='settled-error' for e in image_fallback),image_fallback
assert post['ok'],post['problems']
assert not errors,errors
assert not unexpected,unexpected
