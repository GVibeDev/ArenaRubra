from pathlib import Path
from playwright.sync_api import sync_playwright
import os, re, shutil

ROOT = Path(__file__).resolve().parents[1]
index = (ROOT / "index.html").read_text(encoding="utf-8")
scripts = re.findall(r'<script\s+src="([^"]+)"\s*></script>', index)
html = re.sub(r'<script\s+src="[^"]+"\s*></script>', "", index)
html = re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>', "", html)
page_errors=[]
console_errors=[]

def executable():
    for candidate in [os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE"), shutil.which("chromium"), shutil.which("google-chrome"), "/usr/bin/chromium"]:
        if candidate and Path(candidate).exists(): return str(candidate)
    return None

with sync_playwright() as p:
    opts={"headless":True,"args":["--no-sandbox","--allow-file-access-from-files"]}
    exe=executable()
    if exe: opts["executable_path"]=exe
    browser=p.chromium.launch(**opts)
    page=browser.new_page(viewport={"width":1365,"height":900})
    page.set_default_timeout(10000)
    page.on("pageerror",lambda e:page_errors.append(str(e)))
    page.on("console",lambda m:console_errors.append(m.text) if m.type=="error" else None)
    page.set_content(html,wait_until="load")
    page.add_style_tag(path=str(ROOT/"css/style.css"))
    cal=ROOT/"css/renderer_calibration_lab.css"
    if cal.exists(): page.add_style_tag(path=str(cal))
    for rel in scripts: page.add_script_tag(path=str(ROOT/rel))
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.evaluate("""() => { const s=document.getElementById('appSplash'); if(s){s.hidden=true;s.style.display='none';} }""")
    page.wait_for_timeout(350)
    assert page.evaluate("BUILD_INFO.version") == "C2-STABLE-1-F9V2c-APK-M4c"
    assert page.evaluate("tutorialRuntimeStartScenario('lesson-1-exordium')") is True
    page.wait_for_timeout(700)

    start=page.evaluate("""() => ({
      step:tutorialRuntimeDiagnostics().stepId,
      nextPulse:document.querySelector('.narrativeNextBtn').classList.contains('tutorialAttentionTarget'),
      errors:[]
    })""")
    assert start["step"]=="lesson-welcome" and start["nextPulse"], start

    page.locator(".narrativeNextBtn").click(); page.wait_for_timeout(500)
    card_uid=page.evaluate("state.hand[1].find(c=>c.id==='UNIT:EXC1F01').cardUid")
    slot=page.locator(f'#mapHandOverlay [data-preview-card-uid="{card_uid}"]').first
    assert slot.evaluate("e=>e.classList.contains('tutorialAttentionContext')")
    assert page.locator(".narrativeNextBtn").evaluate("e=>e.classList.contains('tutorialAttentionTarget')")
    slot.hover(); page.wait_for_timeout(350)
    preview=page.evaluate("""() => { const p=document.getElementById('mapHandSelectionPreview'); const s=document.getElementById('tutorialSpotlightRoot'); return {visible:p.classList.contains('isVisible'), pz:Number(getComputedStyle(p).zIndex), sz:Number(getComputedStyle(s).zIndex), opacity:getComputedStyle(p).opacity, filter:getComputedStyle(p).filter}; }""")
    assert preview["visible"] and preview["pz"]>preview["sz"] and preview["opacity"]=="1" and preview["filter"]=="none", preview

    page.locator(".narrativeNextBtn").click(); page.wait_for_timeout(450)
    collapse=page.locator("#mapHandOverlay .mapHandCollapseBtn")
    assert collapse.evaluate("e=>e.classList.contains('tutorialAttentionTarget')")
    collapse.click(); page.wait_for_timeout(450)
    show=page.locator("#mapActionDock .mapLeftHandBtn").first
    assert show.evaluate("e=>e.classList.contains('tutorialAttentionTarget')")
    show.click(); page.wait_for_timeout(450)

    slot=page.locator(f'#mapHandOverlay [data-preview-card-uid="{card_uid}"]').first
    assert slot.evaluate("e=>e.classList.contains('tutorialAttentionTarget')")
    slot.click(); page.wait_for_timeout(850)
    adaptive=page.evaluate("""() => {
      const d=tutorialRuntimeDiagnostics();
      const target=tutorialRuntimeResolveTarget(tutorialRuntimeState.step.spotlight.target);
      const tr=target&&target.getBoundingClientRect();
      const nr=document.querySelector('#narrativeOverlayRoot:not([hidden]) .narrativeDialog')?.getBoundingClientRect();
      const overlap=tr&&nr ? !(tr.right<=nr.left||tr.left>=nr.right||tr.bottom<=nr.top||tr.top>=nr.bottom) : false;
      return {step:d.stepId, targetVisible:Boolean(tr&&tr.width>0&&tr.height>0&&tr.right>0&&tr.bottom>0&&tr.left<innerWidth&&tr.top<innerHeight), overlap, attention:target&&target.classList.contains('tutorialAttentionTarget'), safe:tutorialRuntimeSafeViewport()};
    }""")
    assert adaptive["step"]=="deploy-tribune", adaptive
    assert adaptive["targetVisible"] and not adaptive["overlap"] and adaptive["attention"] and adaptive["safe"], adaptive
    assert not page_errors, page_errors
    assert not console_errors, console_errors
    browser.close()

print("F9O7h browser tutorial guidance smoke: OK")
