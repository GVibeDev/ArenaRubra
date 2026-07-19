from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT = Path(__file__).resolve().parents[1]
errors=[]
console_errors=[]

HTML='''<!doctype html><html data-token-graphics-mode="on"><body>
<div id="ready" class="unitToken faction-nexus type-fanteria has-token-art token-art-loaded is-selected">
  <span class="tokenFactionBase"></span><span class="tokenArt"></span><span class="symbol">N</span>
  <span class="mini statMini">1 1 1</span><span class="tokenSelectionHalo"></span><span class="tokenActiveArrow"></span>
</div>
<div id="acted" class="unitToken faction-nexus type-fanteria has-token-art token-art-loaded acted is-selected">
  <span class="tokenFactionBase"></span><span class="tokenArt"></span><span class="symbol">N</span>
  <span class="mini statMini">1 1 1</span><span class="tokenSelectionHalo"></span><span class="tokenActiveArrow"></span>
</div>
<div id="fallback" class="unitToken faction-nexus type-fanteria acted">
  <span class="tokenFactionBase"></span><span class="symbol">N</span><span class="mini statMini">1 1 1</span>
</div>
</body></html>'''

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--allow-file-access-from-files'])
    page=browser.new_page(viewport={"width":720,"height":420}, has_touch=True)
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type=='error' else None)
    page.set_content(HTML)
    page.add_style_tag(path=str(ROOT/'css/style.css'))
    page.wait_for_timeout(100)
    styles=page.evaluate('''() => {
      const style=(id,sel)=>getComputedStyle(document.querySelector(`#${id} ${sel}`));
      const token=id=>getComputedStyle(document.getElementById(id));
      return {
        readyBase:Number(style('ready','.tokenFactionBase').opacity),
        actedBase:Number(style('acted','.tokenFactionBase').opacity),
        readyArt:Number(style('ready','.tokenArt').opacity),
        actedArt:Number(style('acted','.tokenArt').opacity),
        actedShell:Number(token('acted').opacity),
        actedShellFilter:token('acted').filter,
        fallbackBase:Number(style('fallback','.tokenFactionBase').opacity),
        haloDisplay:style('ready','.tokenSelectionHalo').display,
        haloAnimation:style('ready','.tokenSelectionHalo').animationName,
        haloPointer:style('ready','.tokenSelectionHalo').pointerEvents,
        arrowDisplay:style('ready','.tokenActiveArrow').display,
        arrowAnimation:style('ready','.tokenActiveArrow').animationName,
        arrowPointer:style('ready','.tokenActiveArrow').pointerEvents,
        statOpacity:Number(style('acted','.statMini').opacity)
      };
    }''')
    assert abs(styles['readyBase']-.22) < .02, styles
    assert abs(styles['actedBase']-.22) < .02, styles
    assert styles['readyArt'] > styles['actedArt'], styles
    assert abs(styles['actedArt']-.50) < .03, styles
    assert styles['actedShell'] == 1, styles
    assert styles['actedShellFilter'] == 'none', styles
    assert styles['fallbackBase'] < 1, styles
    assert styles['haloDisplay'] == 'block' and styles['arrowDisplay'] == 'block', styles
    assert styles['haloAnimation'] == 'tokenActiveHaloPulse', styles
    assert styles['arrowAnimation'] == 'tokenActiveArrowBob', styles
    assert styles['haloPointer'] == 'none' and styles['arrowPointer'] == 'none', styles
    assert styles['statOpacity'] == 1, styles

    page.emulate_media(reduced_motion='reduce')
    page.wait_for_timeout(50)
    reduced=page.evaluate('''() => ({
      halo:getComputedStyle(document.querySelector('#ready .tokenSelectionHalo')).animationName,
      arrow:getComputedStyle(document.querySelector('#ready .tokenActiveArrow')).animationName,
      haloPointer:getComputedStyle(document.querySelector('#ready .tokenSelectionHalo')).pointerEvents,
      arrowPointer:getComputedStyle(document.querySelector('#ready .tokenActiveArrow')).pointerEvents
    })''')
    assert reduced['halo'] == 'none' and reduced['arrow'] == 'none', reduced
    assert reduced['haloPointer'] == 'none' and reduced['arrowPointer'] == 'none', reduced
    browser.close()

print(json.dumps({'ok':True,'styles':styles,'reducedMotion':reduced,'pageErrors':errors,'consoleErrors':console_errors},ensure_ascii=False,indent=2))
assert not errors, errors
assert not console_errors, console_errors
