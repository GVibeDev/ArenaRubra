from browser_runtime import chromium_launch_options
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text()
scripts=re.findall(r'<script\s+src="([^"]+)"\s*></script>',index)
html=re.sub(r'<script\s+src="[^"]+"\s*></script>','',index)
html=re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>','',html)
with sync_playwright() as p:
    b=p.chromium.launch(**chromium_launch_options())
    ctx=b.new_context(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=1)
    page=ctx.new_page(); page.set_default_timeout(12000)
    errors=[]; console=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
    page.set_content(html,wait_until='load'); page.add_style_tag(path=str(ROOT/'css/style.css'))
    cal=ROOT/'css/renderer_calibration_lab.css'
    if cal.exists(): page.add_style_tag(path=str(cal))
    for rel in scripts: page.add_script_tag(path=str(ROOT/rel))
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.evaluate("""() => { const s=document.getElementById('appSplash'); if(s){s.hidden=true;s.style.display='none';} setApkM4BodyClasses(); fitApkM4Board({preserveCamera:false}); }""")
    page.wait_for_timeout(400)
    assert page.evaluate("tutorialRuntimeStartScenario('lesson-1-exordium')") is True
    page.wait_for_timeout(650)
    page.locator('.narrativeNextBtn').click(); page.wait_for_timeout(400)
    page.locator('.narrativeNextBtn').click(); page.wait_for_timeout(400)
    page.locator('#mapHandOverlay .mapHandCollapseBtn').click(); page.wait_for_timeout(400)
    page.locator('#mapActionDock .mapLeftHandBtn').first.click(); page.wait_for_timeout(400)
    uid=page.evaluate("state.hand[1].find(c=>c.id==='UNIT:EXC1F01').cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{uid}"]').first.click(); page.wait_for_timeout(1000)
    result=page.evaluate("""() => { const target=tutorialRuntimeResolveTarget(tutorialRuntimeState.step.spotlight.target); const tr=target.getBoundingClientRect(); const nr=document.querySelector('.narrativeDialog').getBoundingClientRect(); const safe=tutorialRuntimeSafeViewport(); return {mobile:document.body.classList.contains('mobile-apk-m4'),step:tutorialRuntimeDiagnostics().stepId,target:{left:tr.left,top:tr.top,right:tr.right,bottom:tr.bottom},overlap:!(tr.right<=nr.left||tr.left>=nr.right||tr.bottom<=nr.top||tr.top>=nr.bottom),safe,attention:target.classList.contains('tutorialAttentionTarget')}; }""")
    assert result['mobile'] and result['step']=='deploy-tribune',result
    assert result['target']['right']>0 and result['target']['bottom']>0 and result['target']['left']<844 and result['target']['top']<390,result
    assert not result['overlap'] and result['safe'] and result['attention'],result
    assert not errors,errors
    assert not console,console
    b.close()
print('F9O7h mobile adaptive framing smoke: OK')
