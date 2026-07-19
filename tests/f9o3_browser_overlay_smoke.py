from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT = Path(__file__).resolve().parents[1]
errors=[]
console_errors=[]

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--allow-file-access-from-files'])
    page=browser.new_page(viewport={"width":980,"height":620}, has_touch=True)
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type=='error' else None)
    page.set_content('<!doctype html><html><body><div id="gameScreen" style="display:block;position:fixed;inset:0"></div></body></html>')
    page.add_style_tag(path=str(ROOT/'css/style.css'))
    page.add_script_tag(path=str(ROOT/'src/event_overlay.js'))

    page.evaluate('''() => eventOverlayEnqueue({type:'TURN_STARTED',title:'INIZIO TURNO',message:'Giocatore 1 · Nexus',icon:'▶',durationMs:1000})''')
    page.wait_for_timeout(80)
    start=page.evaluate('''() => {
      const c=document.querySelector('.gameEventOverlayCard');
      return {hidden:c.hidden,opacity:getComputedStyle(c).opacity,transform:getComputedStyle(c).transform,title:c.querySelector('.gameEventOverlayTitle').textContent};
    }''')
    page.wait_for_timeout(430)
    middle=page.evaluate('''() => {
      const c=document.querySelector('.gameEventOverlayCard');
      return {hidden:c.hidden,opacity:Number(getComputedStyle(c).opacity),transform:getComputedStyle(c).transform};
    }''')
    assert start['title']=='INIZIO TURNO' and not start['hidden'], start
    assert middle['opacity'] > .9, middle
    page.click('.gameEventOverlayCard')
    page.wait_for_timeout(60)
    dismissed=page.evaluate("document.querySelector('.gameEventOverlayCard').hidden")
    assert dismissed

    page.evaluate('''() => narrativeOpen([
      {speaker:'Istruttore Nexus',text:'Osserva la mappa.',expression:'neutral',side:'left'},
      {speaker:'Istruttore Nexus',text:'Il QG è minacciato.',expression:'warning',side:'right'}
    ])''')
    narr1=page.evaluate('''() => ({
      hidden:document.querySelector('#narrativeOverlayRoot').hidden,
      speaker:document.querySelector('#narrativeSpeaker').textContent,
      text:document.querySelector('#narrativeText').textContent,
      symbol:document.querySelector('.narrativePortraitSymbol').textContent,
      step:document.querySelector('.narrativeStepLabel').textContent
    })''')
    assert not narr1['hidden'] and narr1['symbol']=='●' and narr1['step']=='1/2', narr1
    page.click('.narrativeNextBtn')
    narr2=page.evaluate('''() => ({
      text:document.querySelector('#narrativeText').textContent,
      symbol:document.querySelector('.narrativePortraitSymbol').textContent,
      side:document.querySelector('.narrativeDialog').dataset.side,
      step:document.querySelector('.narrativeStepLabel').textContent
    })''')
    assert narr2['symbol']=='!' and narr2['side']=='right' and narr2['step']=='2/2', narr2
    page.click('.narrativeCloseBtn')
    assert page.evaluate("document.querySelector('#narrativeOverlayRoot').hidden")
    browser.close()

print(json.dumps({'ok':True,'start':start,'middle':middle,'narrative1':narr1,'narrative2':narr2,'pageErrors':errors,'consoleErrors':console_errors},ensure_ascii=False,indent=2))
assert not errors, errors
assert not console_errors, console_errors
