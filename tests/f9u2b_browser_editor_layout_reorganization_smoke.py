from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import re

ROOT = Path(__file__).resolve().parents[1]


def load_base(page):
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    scripts = re.findall(r'<script\s+src="([^"]+)"\s*></script>', index)
    html = re.sub(r'<script\s+src="[^"]+"\s*></script>', '', index)
    html = re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>', '', html)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    calibration = ROOT / "css/renderer_calibration_lab.css"
    if calibration.exists():
        page.add_style_tag(path=str(calibration))
    for rel in scripts:
        page.add_script_tag(path=str(ROOT / rel))
    page.wait_for_function("typeof BUILD_INFO !== 'undefined' && typeof initializeArenaAppShell === 'function'")
    page.evaluate("""() => {
      const splash=document.getElementById('appSplash');
      if (splash) { splash.style.display='none'; splash.style.pointerEvents='none'; }
      initializeArenaAppShell();
    }""")


def rect_snapshot(page, selector):
    return page.evaluate("""selector => {
      const el=document.querySelector(selector);
      return el ? el.getBoundingClientRect().toJSON() : null;
    }""", selector)


def card_snapshot(page):
    return page.evaluate("""() => ({
      build: BUILD_INFO.version,
      headerButtons:[...document.querySelectorAll('.cardEditorHeaderActions button')].map(b=>b.textContent.trim()),
      toolsOpen:document.querySelector('.cardEditorHeaderTools')?.open || false,
      dataOpen:document.querySelector('.cardEditorDataExchange')?.open || false,
      previewText:document.getElementById('cardEditorPreviewMeta')?.textContent.trim() || '',
      validation:document.getElementById('cardEditorValidation')?.textContent.trim() || '',
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
    })""")


def map_snapshot(page):
    return page.evaluate("""() => ({
      build:BUILD_INFO.version,
      headerButtons:[...document.querySelectorAll('.mapEditorHeaderActions button')].map(b=>b.textContent.trim()),
      live:{
        status:document.getElementById('mapEditorValidationSummary')?.textContent.trim() || '',
        name:document.getElementById('mapEditorLiveName')?.textContent.trim() || '',
        players:document.getElementById('mapEditorLivePlayers')?.textContent.trim() || '',
        cells:document.getElementById('mapEditorLiveCells')?.textContent.trim() || '',
        hq:document.getElementById('mapEditorLiveHq')?.textContent.trim() || '',
        ps:document.getElementById('mapEditorLivePs')?.textContent.trim() || '',
        movement:document.getElementById('mapEditorLiveMovement')?.textContent.trim() || '',
        zoom:document.getElementById('mapEditorLiveZoom')?.textContent.trim() || '',
        tool:document.getElementById('mapEditorLiveTool')?.textContent.trim() || '',
        selection:document.getElementById('mapEditorLiveSelection')?.textContent.trim() || ''
      },
      cellsRendered:document.querySelectorAll('[data-map-cell]').length,
      errors:document.querySelectorAll('#mapEditorValidationList .error').length,
      warnings:document.querySelectorAll('#mapEditorValidationList .warning').length,
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      precheck:typeof runPrecheck==='function' ? runPrecheck({quiet:true,source:'f9u2b-browser'}) : null
    })""")


page_errors=[]
console_errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--allow-file-access-from-files'])

    # Card Editor desktop
    ctx=browser.new_context(viewport={'width':1440,'height':1000})
    page=ctx.new_page(); page.set_default_timeout(12000)
    page.on('pageerror',lambda exc:page_errors.append(f'card desktop: {exc}'))
    page.on('console',lambda msg:console_errors.append(f'card desktop: {msg.text}') if msg.type=='error' else None)
    load_base(page)
    page.wait_for_function("typeof initializeCardEditorScreen === 'function' && typeof renderCardEditorScreen === 'function'")
    page.evaluate("""() => {
      setAppScreen(ARENA_APP_SCREENS.CARD_EDITOR);
      initializeCardEditorScreen();
      renderCardEditorScreen();
    }""")
    page.wait_for_function("document.getElementById('cardEditorPreviewMeta').textContent.trim().length > 0")
    card=card_snapshot(page)
    card_left=rect_snapshot(page,'.cardEditorFormBox')
    card_right=rect_snapshot(page,'.cardEditorPreviewBox')
    card_header=rect_snapshot(page,'.cardEditorHeader')
    card_policy=rect_snapshot(page,'.cardEditorLivePolicyBar')
    page.locator('.cardEditorHeaderTools summary').click()
    card_tools_open=card_snapshot(page)

    # Map Editor desktop
    page.evaluate("""() => {
      setAppScreen(ARENA_APP_SCREENS.MAP_EDITOR);
      initializeMapEditorScreen();
      openMapEditorScreen('map1_starter');
    }""")
    page.wait_for_function("document.querySelectorAll('[data-map-cell]').length > 0")
    map_before=map_snapshot(page)
    live_rect=rect_snapshot(page,'.mapEditorLiveBar')
    map_header=rect_snapshot(page,'.mapEditorHeader')
    left=rect_snapshot(page,'.mapEditorProjectPanel')
    canvas=rect_snapshot(page,'.mapEditorCanvasPanel')
    right=rect_snapshot(page,'.mapEditorToolsPanel')
    page.locator('[data-map-tool="terrain"]').click()
    page.wait_for_function("document.getElementById('mapEditorLiveTool').textContent.trim() === 'Terreno'")
    map_tool=map_snapshot(page)
    page.locator('[data-map-cell]').first.click()
    page.wait_for_function("document.getElementById('mapEditorLiveSelection').textContent.trim() !== '—'")
    map_selected=map_snapshot(page)

    # Mobile/reflow: no Android-specific claim, only responsive browser layout
    mctx=browser.new_context(viewport={'width':820,'height':1000},is_mobile=True)
    mobile=mctx.new_page(); mobile.set_default_timeout(12000)
    mobile.on('pageerror',lambda exc:page_errors.append(f'mobile: {exc}'))
    mobile.on('console',lambda msg:console_errors.append(f'mobile: {msg.text}') if msg.type=='error' else None)
    load_base(mobile)
    mobile.wait_for_function("typeof initializeCardEditorScreen === 'function'")
    mobile.evaluate("""() => { setAppScreen(ARENA_APP_SCREENS.CARD_EDITOR); initializeCardEditorScreen(); renderCardEditorScreen(); }""")
    mobile_card=card_snapshot(mobile)
    mobile_card_left=rect_snapshot(mobile,'.cardEditorFormBox')
    mobile_card_right=rect_snapshot(mobile,'.cardEditorPreviewBox')
    mobile.evaluate("""() => { setAppScreen(ARENA_APP_SCREENS.MAP_EDITOR); initializeMapEditorScreen(); openMapEditorScreen('map1_starter'); }""")
    mobile.wait_for_function("document.querySelectorAll('[data-map-cell]').length > 0")
    mobile_map=map_snapshot(mobile)
    mobile_left=rect_snapshot(mobile,'.mapEditorProjectPanel')
    mobile_canvas=rect_snapshot(mobile,'.mapEditorCanvasPanel')
    mobile_right=rect_snapshot(mobile,'.mapEditorToolsPanel')
    browser.close()

assert card['build']=='C2-STABLE-1-F9T0-APK-M4c',card
assert card['headerButtons']==['Nuova','Salva','Duplica','Elimina','Calibra renderer','Copia JSON carta','Copia libreria','Deck Builder','Pool carte','Menu'],card
assert card['previewText'],card
assert card['validation'],card
assert not card['toolsOpen'] and card_tools_open['toolsOpen'],(card,card_tools_open)
assert card['dataOpen'],card
assert card_left and card_right and card_left['right']<=card_right['left']+2,(card_left,card_right)
assert card_header and card_policy and card_header['bottom']<=card_policy['top']+2,(card_header,card_policy)
assert card['overflow']<=1,card

assert map_before['build']=='C2-STABLE-1-F9T0-APK-M4c',map_before
assert map_before['headerButtons']==['Nuova','Salva','Importa','JSON leggero','JSON portatile','Annulla','Ripeti','Adatta','Menu'],map_before
assert map_before['cellsRendered']>0,map_before
assert map_before['live']['status'],map_before
for key in ['name','players','cells','hq','ps','movement','zoom','tool','selection']:
    assert map_before['live'][key],(key,map_before)
assert map_before['live']['tool']=='Ispeziona',map_before
assert live_rect and map_header and map_header['bottom']<=live_rect['top']+2,(map_header,live_rect)
assert left and canvas and right and left['right']<=canvas['left']+2 and canvas['right']<=right['left']+2,(left,canvas,right)
assert map_tool['live']['tool']=='Terreno',map_tool
assert map_selected['live']['selection']!='—',map_selected
assert map_before['precheck']['ok'] and not map_before['precheck']['problems'] and not map_before['precheck']['warnings'],map_before
assert map_before['overflow']<=1,map_before

assert mobile_card['overflow']<=1,mobile_card
assert mobile_card_left and mobile_card_right and mobile_card_left['bottom']<=mobile_card_right['top']+2,(mobile_card_left,mobile_card_right)
assert mobile_map['overflow']<=1,mobile_map
assert mobile_left and mobile_canvas and mobile_right,mobile_map
assert mobile_left['bottom']<=mobile_canvas['top']+2 and mobile_canvas['bottom']<=mobile_right['top']+2,(mobile_left,mobile_canvas,mobile_right)
assert not page_errors,page_errors
assert not console_errors,console_errors

print(json.dumps({
  'ok':True,
  'card':card,
  'cardToolsOpen':card_tools_open,
  'map':map_before,
  'mapTool':map_tool,
  'mapSelected':map_selected,
  'mobileCard':mobile_card,
  'mobileMap':mobile_map
},ensure_ascii=False,indent=2))
