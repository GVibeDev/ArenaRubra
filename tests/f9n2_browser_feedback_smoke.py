from playwright.sync_api import sync_playwright
import json
from pathlib import Path
ROOT=str(Path(__file__).resolve().parents[1])
errors=[]
console_errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page=browser.new_page(viewport={"width":1280,"height":900})
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type=='error' else None)
    page.set_content('''<!doctype html><html><head></head><body>
      <div id="boardVisualStack" style="position:relative;width:920px;height:780px">
        <div id="board" style="position:absolute;inset:0"></div>
        <div id="mapOverlayLayer" class="mapOverlayLayer" style="position:absolute;inset:0"></div>
      </div>
    </body></html>''')
    page.add_style_tag(path=ROOT+'/css/style.css')
    page.add_script_tag(content='const CENTER_X=460, CENTER_Y=390, HEX_SIZE=31; let state=null;')
    page.add_script_tag(path=ROOT+'/src/build_info.js')
    page.add_script_tag(path=ROOT+'/src/events.js')
    page.add_script_tag(path=ROOT+'/src/combat_feedback.js')
    base=page.evaluate('''() => ({
      build: buildInfoLabel(),
      hasFeedback: typeof combatFeedbackEnqueueEvent === 'function',
      hasEvent: EventTypes.UNIT_DEFENSE_LOST === 'UNIT_DEFENSE_LOST',
      hasOverlay: !!document.getElementById('mapOverlayLayer')
    })''')
    assert base['build'] in {'C2-STABLE-1-F9N2a-APK-M4c','C2-STABLE-1-F9O4a-APK-M4c','C2-STABLE-1-F9O4b-APK-M4c','C2-STABLE-1-F9O4c-APK-M4c','C2-STABLE-1-F9O4d-APK-M4c','C2-STABLE-1-F9O4f-APK-M4c','C2-STABLE-1-F9O4e-APK-M4c','C2-STABLE-1-F9O5-APK-M4c','C2-STABLE-1-F9O5a-APK-M4c','C2-STABLE-1-F9O5b-APK-M4c','C2-STABLE-1-F9O6-APK-M4c','C2-STABLE-1-F9O7e-APK-M4c'}, base
    assert base['hasFeedback'] and base['hasEvent'] and base['hasOverlay'], base
    page.evaluate('''() => {
      const board=document.getElementById('board');
      function add(uid,key,left,top){
        const h=document.createElement('button'); h.className='hex'; h.dataset.coordKey=key; h.style.left=left+'px'; h.style.top=top+'px';
        const t=document.createElement('div'); t.className='unitToken'; t.dataset.unitUid=uid; h.appendChild(t); board.appendChild(h);
      }
      add('A','0,0,0',460,390); add('B','1,-1,0',514,390);
      emitGameEvent({type:EventTypes.UNIT_ATTACKED,data:{attackerId:'A',defenderId:'B',attackerPos:[0,0,0],defenderPos:[1,-1,0]}});
    }''')
    page.wait_for_timeout(60)
    assert page.locator('[data-unit-uid="A"]').evaluate("e=>e.classList.contains('feedback-attacking')")
    page.wait_for_timeout(260)
    page.evaluate('''() => emitGameEvent({type:EventTypes.UNIT_DAMAGED,data:{targetId:'B',targetPos:[1,-1,0],defLoss:2,hpLoss:1}})''')
    page.wait_for_timeout(80)
    texts=page.locator('.combatFeedbackFloat').all_text_contents()
    assert '-2 DEF' in texts and '-1 HP' in texts, texts
    assert page.locator('[data-unit-uid="B"]').evaluate("e=>e.classList.contains('feedback-impact')")
    page.wait_for_timeout(820)
    # F9N2a: i float devono essere ancora leggibili vicino a 1 secondo.
    texts=page.locator('.combatFeedbackFloat').all_text_contents()
    assert '-2 DEF' in texts or '-1 HP' in texts, texts
    page.wait_for_timeout(260)
    page.evaluate('''() => emitGameEvent({type:EventTypes.STATUS_APPLIED,data:{targetId:'B',targetPos:[1,-1,0],statusKind:'inhibit_action'}})''')
    page.wait_for_timeout(80)
    texts=page.locator('.combatFeedbackFloat').all_text_contents()
    assert 'STORDITO' in texts, texts
    assert page.locator('[data-unit-uid="B"]').evaluate("e=>e.classList.contains('feedback-stun')")
    page.wait_for_timeout(850)
    assert 'STORDITO' in page.locator('.combatFeedbackFloat').all_text_contents()
    page.wait_for_timeout(230)
    page.evaluate("""() => emitGameEvent({type:EventTypes.STATUS_APPLIED,data:{targetId:'B',targetPos:[1,-1,0],statusKind:'inhibit_move'}})""")
    page.wait_for_timeout(80)
    assert 'BLOCCO' in page.locator('.combatFeedbackFloat').all_text_contents()
    assert page.locator('[data-unit-uid="B"]').evaluate("e=>e.classList.contains('feedback-block')")
    page.wait_for_timeout(850)
    assert 'BLOCCO' in page.locator('.combatFeedbackFloat').all_text_contents()
    page.wait_for_timeout(230)
    page.evaluate("""() => emitGameEvent({type:EventTypes.STATUS_APPLIED,data:{targetId:'B',targetPos:[1,-1,0],statusKind:'bleed'}})""")
    page.wait_for_timeout(80)
    assert 'SANGUINAMENTO' in page.locator('.combatFeedbackFloat').all_text_contents()
    assert page.locator('[data-unit-uid="B"]').evaluate("e=>e.classList.contains('feedback-bleed')")
    page.wait_for_timeout(850)
    assert 'SANGUINAMENTO' in page.locator('.combatFeedbackFloat').all_text_contents()
    page.wait_for_timeout(230)
    page.evaluate("""() => combatFeedbackEmitDefenseLoss({uid:'B',name:'B',side:2,pos:[1,-1,0]},3,'Smoke test',{sourceType:'test'})""")
    page.wait_for_timeout(80)
    assert '-3 DEF' in page.locator('.combatFeedbackFloat').all_text_contents()
    page.wait_for_timeout(850)
    assert '-3 DEF' in page.locator('.combatFeedbackFloat').all_text_contents()
    page.wait_for_timeout(230)
    remaining=page.locator('.combatFeedbackFloat').count()
    debug=page.evaluate('combatFeedbackDebugState()')
    browser.close()

print(json.dumps({"ok":True,"base":base,"pageErrors":errors,"consoleErrors":console_errors,"remainingFloats":remaining,"debug":debug}, ensure_ascii=False, indent=2))
assert not errors, errors
assert remaining == 0, remaining
assert debug['queued'] == 0 and not debug['running'], debug
