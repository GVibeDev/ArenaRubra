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
    page=browser.new_page(viewport={"width":1365,"height":900}, reduced_motion="no-preference")
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
    assert page.evaluate("BUILD_INFO.version") == "C2-STABLE-1-F9U2b-APK-M4c"
    assert page.evaluate("tutorialRuntimeStartScenario('lesson-1-exordium')") is True
    page.wait_for_timeout(700)

    blink=page.evaluate("""() => {
      const b=document.querySelector('.narrativeNextBtn.tutorialAttentionTarget');
      if(!b) return null;
      const animations=b.getAnimations();
      const animation=animations.find(a => a.animationName === 'tutorialNarrativeButtonBlink') || animations[0];
      const initial={name:getComputedStyle(b).animationName, duration:getComputedStyle(b).animationDuration};
      if(!animation) return {...initial, hasAnimation:false};
      animation.pause();
      animation.currentTime=120;
      const visible=Number(getComputedStyle(b).opacity);
      animation.currentTime=560;
      const hidden=Number(getComputedStyle(b).opacity);
      animation.currentTime=820;
      const visibleAgain=Number(getComputedStyle(b).opacity);
      animation.play();
      return {...initial, hasAnimation:true, visible, hidden, visibleAgain};
    }""")
    assert blink and blink["hasAnimation"], blink
    assert "tutorialNarrativeButtonBlink" in blink["name"], blink
    assert blink["visible"] > .9 and blink["hidden"] < .2 and blink["visibleAgain"] > .9, blink

    page.locator(".narrativeNextBtn").click(); page.wait_for_timeout(450)
    card_uid=page.evaluate("state.hand[1].find(c=>c.id==='UNIT:EXC1F01').cardUid")
    slot=page.locator(f'#mapHandOverlay [data-preview-card-uid="{card_uid}"]').first
    slot.hover(); page.wait_for_timeout(350)
    preview=page.evaluate("""() => {
      const p=document.getElementById('mapHandSelectionPreview');
      const s=document.getElementById('tutorialSpotlightRoot');
      const pr=p.getBoundingClientRect();
      const centerX=pr.left+pr.width/2, centerY=pr.top+pr.height/2;
      const top=document.elementFromPoint(centerX,centerY);
      return {
        visible:p.classList.contains('isVisible'),
        parentIsBody:p.parentElement===document.body,
        portalClass:p.classList.contains('tutorialPreviewPortal'),
        position:getComputedStyle(p).position,
        pz:Number(getComputedStyle(p).zIndex),
        sz:Number(getComputedStyle(s).zIndex),
        opacity:getComputedStyle(p).opacity,
        filter:getComputedStyle(p).filter,
        topElement:top ? `${top.tagName}.${top.className || ""}` : null,
        pointerEvents:getComputedStyle(p).pointerEvents,
        portalCount:tutorialRuntimeDiagnostics().previewPortals
      };
    }""")
    assert preview["visible"] and preview["parentIsBody"] and preview["portalClass"], preview
    assert preview["position"] == "fixed" and preview["pz"] > preview["sz"], preview
    assert preview["opacity"] == "1" and preview["filter"] == "none", preview
    assert preview["portalCount"] >= 1, preview

    page.evaluate("tutorialRuntimeAbort({silent:true,keepScreen:true,reason:'test'})")
    restored=page.evaluate("""() => { const p=document.getElementById('mapHandSelectionPreview'); return {parent:p.parentElement&&p.parentElement.id, portal:p.classList.contains('tutorialPreviewPortal'), count:tutorialRuntimeDiagnostics().previewPortals}; }""")
    assert restored["parent"] == "boardWrap" and not restored["portal"] and restored["count"] == 0, restored
    assert not page_errors, page_errors
    assert not console_errors, console_errors
    browser.close()

print("F9O7h1 browser tutorial visibility hotfix smoke: OK")
