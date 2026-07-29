from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import re

ROOT = Path(__file__).resolve().parents[1]


def load_app(page):
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    scripts = re.findall(r'<script\s+src="([^"]+)"\s*></script>', index)
    html = re.sub(r'<script\s+src="[^"]+"\s*></script>', '', index)
    html = re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>', '', html)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    renderer_css = ROOT / "css/renderer_calibration_lab.css"
    if renderer_css.exists():
        page.add_style_tag(path=str(renderer_css))
    for rel in scripts:
        page.add_script_tag(path=str(ROOT / rel))
    page.wait_for_function("typeof initializeCardPoolScreen === 'function' && typeof BUILD_INFO !== 'undefined'")
    page.evaluate("""() => {
      const splash=document.getElementById('appSplash');
      if (splash) { splash.style.display='none'; splash.style.pointerEvents='none'; }
      if (typeof initializeArenaAppShell === 'function') initializeArenaAppShell();
      if (typeof setAppScreen === 'function') setAppScreen(ARENA_APP_SCREENS.CARD_POOL);
      initializeCardPoolScreen();
      renderCardPoolScreen();
    }""")
    page.wait_for_function("document.querySelectorAll('.cardPoolGalleryItem').length > 0")


def snapshot(page):
    return page.evaluate("""() => {
      const rect = selector => document.querySelector(selector)?.getBoundingClientRect().toJSON() || null;
      const styles = selector => {
        const el=document.querySelector(selector); if (!el) return null;
        const cs=getComputedStyle(el); return {fontSize:cs.fontSize,display:cs.display,visibility:cs.visibility};
      };
      const headerButtons=[...document.querySelectorAll('.cardPoolHeaderActions button')].map(btn=>btn.textContent.trim());
      const debug=document.getElementById('cardPoolDebugDetails');
      const nav=[...document.querySelectorAll('.cardPoolPreviewToolbar button')].map(btn=>btn.textContent.trim());
      return {
        build:BUILD_INFO.version,
        headerButtons,
        nav,
        selectedName:document.querySelector('.cardPoolSelectedHeading h4')?.textContent.trim() || '',
        selectedMeta:document.getElementById('cardPoolPreviewMeta')?.textContent.trim() || '',
        statLabels:[...document.querySelectorAll('.cardPoolLargeStat span')].map(el=>el.textContent.trim()),
        statValues:[...document.querySelectorAll('.cardPoolLargeStat strong')].map(el=>el.textContent.trim()),
        abilityTitles:[...document.querySelectorAll('.cardPoolAbilitySection h5')].map(el=>el.textContent.trim()),
        abilityStyle:styles('.cardPoolAbilitySection p'),
        canvas:rect('#cardPoolPreviewCanvas'),
        info:rect('.cardPoolSelectedInfoBox'),
        toolbar:rect('.cardPoolPreviewToolbar'),
        viewGroup:rect('.cardPoolViewModeGroup'),
        navGroup:rect('.cardPoolNavGroup'),
        focusGroup:rect('.cardPoolFocusGroup'),
        debugOpen:debug?.open || false,
        debugBodyText:document.getElementById('cardPoolDebugBody')?.textContent.trim() || '',
        copyButtons:[...document.querySelectorAll('.cardPoolDebugActions button')].map(btn=>btn.textContent.trim()),
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        precheck:typeof runPrecheck==='function' ? runPrecheck({quiet:true,source:'f9u2a-browser'}) : null
      };
    }""")


page_errors=[]
console_errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--allow-file-access-from-files'])

    desktop_context=browser.new_context(viewport={'width':1440,'height':960})
    desktop=desktop_context.new_page()
    desktop.set_default_timeout(10000)
    desktop.on('pageerror',lambda exc:page_errors.append(f'desktop: {exc}'))
    desktop.on('console',lambda msg:console_errors.append(f'desktop: {msg.text}') if msg.type=='error' else None)
    load_app(desktop)
    before=snapshot(desktop)
    desktop.locator('#cardPoolDebugDetails summary').click()
    debug_open=snapshot(desktop)
    desktop.locator('#cardPoolNextBtn').click()
    after_next=snapshot(desktop)
    desktop.locator('#cardPoolViewTableBtn').click()
    table_state=desktop.evaluate("""() => ({
      tableHidden:document.getElementById('cardPoolTableWrap').hidden,
      galleryHidden:document.getElementById('cardPoolGalleryWrap').hidden,
      tableActive:document.getElementById('cardPoolViewTableBtn').classList.contains('active')
    })""")

    mobile_context=browser.new_context(viewport={'width':820,'height':900},is_mobile=True)
    mobile=mobile_context.new_page()
    mobile.set_default_timeout(10000)
    mobile.on('pageerror',lambda exc:page_errors.append(f'mobile: {exc}'))
    mobile.on('console',lambda msg:console_errors.append(f'mobile: {msg.text}') if msg.type=='error' else None)
    load_app(mobile)
    mobile_result=snapshot(mobile)
    browser.close()

assert before['build']=='C2-STABLE-1-F9T0-APK-M4c',before
assert before['headerButtons']==['Deck Builder','Card Editor','Duplica selezionata','Menu principale'],before
assert before['nav']==['Galleria','Tabella','← Precedente','Successiva →','Apri focus','Chiudi focus'],before
assert before['selectedName'],before
assert before['selectedMeta'].startswith('Nexus · Unità'),before
assert before['statLabels']==['ENE','HP','DEF','ATT'],before
assert len(before['statValues'])==4,before
assert before['abilityTitles'],before
assert float(before['abilityStyle']['fontSize'].replace('px',''))>=15,before
assert before['canvas'] and before['info'],before
assert abs(before['canvas']['top']-before['info']['top'])<=2,before
assert before['toolbar'] and before['viewGroup'] and before['navGroup'] and before['focusGroup'],before
assert before['viewGroup']['right']<=before['navGroup']['left']+2,before
assert before['navGroup']['right']<=before['focusGroup']['left']+2,before
assert not before['debugOpen'],before
assert 'Card ID:' in before['debugBodyText'],before
assert before['copyButtons']==['Calibra renderer','Copia carta JSON','Copia manifest asset'],before
assert before['precheck']['ok'] and not before['precheck']['problems'] and not before['precheck']['warnings'],before
assert debug_open['debugOpen'],debug_open
assert after_next['selectedName']!=before['selectedName'],(before,after_next)
assert 'Card ID:' in after_next['debugBodyText'],after_next
assert table_state=={'tableHidden':False,'galleryHidden':True,'tableActive':True},table_state
assert mobile_result['overflow']<=1,mobile_result
assert (mobile_result['canvas']['bottom']<=mobile_result['info']['top']+2 or mobile_result['canvas']['right']<=mobile_result['info']['left']+2),mobile_result
assert float(mobile_result['abilityStyle']['fontSize'].replace('px',''))>=14,mobile_result
assert not page_errors,page_errors
assert not console_errors,console_errors
print(json.dumps({'ok':True,'desktop':before,'debug':debug_open,'next':after_next,'table':table_state,'mobile':mobile_result},ensure_ascii=False,indent=2))
