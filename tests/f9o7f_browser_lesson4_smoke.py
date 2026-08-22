from browser_runtime import chromium_launch_options
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, re

ROOT = Path(__file__).resolve().parents[1]
index = (ROOT / "index.html").read_text(encoding="utf-8")
scripts = re.findall(r'<script\s+src="([^"]+)"\s*></script>', index)
html = re.sub(r'<script\s+src="[^"]+"\s*></script>', '', index)
html = re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>', '', html)
page_errors = []
console_errors = []
trace = []

def snap(page, label):
    value = page.evaluate("""() => {
      const enemy=state && state.units.find(u=>u&&u.alive&&u.id==='AGC1F04');
      const predone=state && state.units.find(u=>u&&u.alive&&u.id==='LX2B02');
      const militia=state && state.units.find(u=>u&&u.alive&&u.id==='LX2B01'&&Array.isArray(u.pos)&&u.pos.join(',')==='0,-1,1');
      return {
        step:tutorialRuntimeDiagnostics().stepId,
        currentPlayer:state && state.currentPlayer,
        turn:state && state.turn,
        energy:state && state.energy && state.energy[1],
        handState:tutorialRuntimeDiagnostics().actualHandState,
        mode:typeof mode==='undefined'?null:mode,
        selectedCardUid:typeof MAP_HAND_OVERLAY_STATE==='undefined'?null:MAP_HAND_OVERLAY_STATE.selectedCardUid,
        handIds:state && state.hand && state.hand[1].map(c=>c.id),
        enemy:enemy?{hp:enemy.currentHp,def:enemy.currentDef,att:enemy.currentAtt,statuses:(enemy.statuses||[]).map(s=>({kind:s.kind,value:s.value,turns:s.turns}))}:null,
        militia:militia?{acted:militia.acted,hp:militia.currentHp,def:militia.currentDef,statuses:(militia.statuses||[]).map(s=>({kind:s.kind,value:s.value,turns:s.turns}))}:null,
        predone:predone?{acted:predone.acted,pos:predone.pos}:null
      };
    }""")
    trace.append({"label": label, **value})
    return value

with sync_playwright() as p:
    browser = p.chromium.launch(**chromium_launch_options())
    # Desktop/fine pointer: necessario per testare davvero l'anteprima hover.
    page = browser.new_page(viewport={"width": 1365, "height": 900})
    page.set_default_timeout(10000)
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    calibration = ROOT / "css/renderer_calibration_lab.css"
    if calibration.exists(): page.add_style_tag(path=str(calibration))
    for rel in scripts: page.add_script_tag(path=str(ROOT / rel))
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.evaluate("""() => { const splash=document.getElementById('appSplash'); if(splash){ splash.hidden=true; splash.style.display='none'; splash.setAttribute('aria-hidden','true'); } }""")
    page.wait_for_timeout(300)

    initial = page.evaluate("""() => {
      tutorialRuntimeRenderMenu();
      return {
        build:BUILD_INFO.version,
        audit:tutorialScenarioAuditF9O6(),
        precheck:runPrecheck({quiet:true,source:'f9o7f-initial'}),
        menu:{
          available:document.querySelectorAll('#tutorialLessonGrid .tutorialLessonCard.isAvailable').length,
          starts:document.querySelectorAll('#tutorialLessonGrid [data-tutorial-start]').length,
          lesson4:Boolean(document.querySelector('#tutorialLessonGrid [data-tutorial-start="lesson-4-liberti"]'))
        }
      };
    }""")
    assert page.evaluate("tutorialRuntimeResetProgress()") is True
    assert page.evaluate("tutorialRuntimeStartScenario('lesson-4-liberti')") is True
    page.wait_for_timeout(500)
    snap(page, "start")

    def next_step(label, wait=340):
        page.locator("#narrativeOverlayRoot .narrativeNextBtn").click()
        page.wait_for_timeout(wait)
        return snap(page, label)

    next_step("formation-overview")
    next_step("inspect-hand")

    # Anteprima hover: deve stare sopra lo scrim (94), ma sotto la vignetta (96).
    granata_uid = page.evaluate("state.hand[1].find(c=>c.id==='TACTIC:LBTAC05').cardUid")
    granata_slot = page.locator(f'#mapHandOverlay [data-preview-card-uid="{granata_uid}"]').first
    granata_slot.hover()
    page.wait_for_timeout(450)
    preview_layer = page.evaluate("""() => {
      const preview=document.getElementById('mapHandSelectionPreview');
      const spot=document.getElementById('tutorialSpotlightRoot');
      const narrative=document.getElementById('narrativeOverlayRoot');
      return {
        visible:Boolean(preview && preview.classList.contains('isVisible') && preview.classList.contains('hoverPreview') && !preview.hidden),
        preview:Number(getComputedStyle(preview).zIndex || 0),
        spotlight:Number(getComputedStyle(spot).zIndex || 0),
        narrative:Number(getComputedStyle(narrative).zIndex || 0),
        opacity:getComputedStyle(preview).opacity,
        filter:getComputedStyle(preview).filter
      };
    }""")
    assert preview_layer["visible"], preview_layer
    assert preview_layer["preview"] == 95 and preview_layer["spotlight"] == 94 and preview_layer["narrative"] == 96, preview_layer
    assert preview_layer["opacity"] == "1" and preview_layer["filter"] == "none", preview_layer

    next_step("choose-sanguis")

    # Scelta errata: Granata Sporca non deve avviare targeting né avanzare il tutorial.
    granata_slot.click()
    page.wait_for_timeout(260)
    wrong_first = snap(page, "wrong-sanguis-choice")
    wrong_first_hint = page.evaluate("""() => ({visible:document.querySelector('.tutorialSpotlightHint.isVisible')!==null,text:document.querySelector('.tutorialSpotlightHint')?.textContent||''})""")
    assert wrong_first["step"] == "choose-sanguis-card", wrong_first
    assert wrong_first["selectedCardUid"] in ("", None) and wrong_first["mode"] == "idle", wrong_first
    assert wrong_first_hint["visible"] and "Marchio" in wrong_first_hint["text"], wrong_first_hint

    mark_uid = page.evaluate("state.hand[1].find(c=>c.id==='TACTIC:LBTAC08').cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{mark_uid}"]').first.click()
    page.wait_for_timeout(420)
    after_mark_choice = snap(page, "apply-mark")
    assert after_mark_choice["step"] == "apply-sanguis-mark", after_mark_choice

    militia_uid = page.evaluate("state.units.find(u=>u.alive&&u.id==='LX2B01'&&u.pos.join(',')==='0,-1,1').uid")
    page.locator(f'.unitToken[data-unit-uid="{militia_uid}"]').click()
    page.wait_for_timeout(520)
    marked = snap(page, "marked-militia")
    assert marked["step"] == "select-marked-militia", marked
    assert any(s["kind"] == "next_attack_bleed_two" and s["value"] == 2 for s in marked["militia"]["statuses"]), marked

    page.locator(f'.unitToken[data-unit-uid="{militia_uid}"]').click()
    page.wait_for_timeout(280)
    snap(page, "attack-anthropos")
    enemy_uid = page.evaluate("state.units.find(u=>u.alive&&u.id==='AGC1F04').uid")
    page.locator(f'.unitToken[data-unit-uid="{enemy_uid}"]').click()
    page.wait_for_timeout(720)
    first_attack = snap(page, "bleed-prepared")
    assert first_attack["step"] == "bleed-prepared", first_attack
    assert first_attack["enemy"]["hp"] == 6 and first_attack["enemy"]["def"] == 1, first_attack
    assert any(s["kind"] == "bleed" and s["value"] == 2 for s in first_attack["enemy"]["statuses"]), first_attack

    next_step("end-turn-for-bleed")
    page.locator(".mapLeftEndTurnBtn").first.click()
    page.wait_for_timeout(900)
    bleed = snap(page, "bleed-resolved")
    assert bleed["step"] == "bleed-resolved" and bleed["currentPlayer"] == 1, bleed
    assert bleed["enemy"]["hp"] == 4 and bleed["enemy"]["def"] == 1, bleed

    next_step("choose-coordinated")

    # Seconda scelta errata: Predoni in Agguato deve essere respinta.
    ambush_uid = page.evaluate("state.hand[1].find(c=>c.id==='TACTIC:LBTAC09').cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{ambush_uid}"]').first.click()
    page.wait_for_timeout(260)
    wrong_second = snap(page, "wrong-coordinated-choice")
    assert wrong_second["step"] == "choose-coordinated-card", wrong_second
    assert wrong_second["selectedCardUid"] in ("", None) and wrong_second["mode"] == "idle", wrong_second

    coordinated_uid = page.evaluate("state.hand[1].find(c=>c.id==='TACTIC:LBTAC14').cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{coordinated_uid}"]').first.click()
    page.wait_for_timeout(400)
    coordinated_choice = snap(page, "play-coordinated")
    assert coordinated_choice["step"] == "play-coordinated-attack", coordinated_choice
    page.locator(f'.unitToken[data-unit-uid="{enemy_uid}"]').click()
    page.wait_for_timeout(1050)
    pressure = snap(page, "coordinated-pressure-resolved")
    assert pressure["step"] == "coordinated-pressure-resolved" and pressure["enemy"] is None, pressure

    # Completa il passo-checkpoint, poi verifica la ripresa dal suo snapshot.
    next_step("select-predone-before-resume")
    resume_before = page.evaluate("""() => ({
      step:tutorialRuntimeDiagnostics().stepId,
      player:state.currentPlayer,
      progress:tutorialRuntimeProgressForScenario('lesson-4-liberti'),
      enemyAlive:state.units.some(u=>u&&u.alive&&u.id==='AGC1F04'),
      seenMark:state.events.some(e=>e.type==='TACTIC_USED'&&e.data&&e.data.tacticId==='LBTAC08'),
      seenCoord:state.events.some(e=>e.type==='TACTIC_USED'&&e.data&&e.data.tacticId==='LBTAC14'),
      seenDestroyed:state.events.some(e=>e.type==='UNIT_DESTROYED'&&e.data&&e.data.unitName==='Anthropos di Pietra')
    })""")
    assert page.evaluate("tutorialRuntimeAbort({silent:true,keepScreen:true,reason:'f9o7f-resume-check'})") is True
    assert page.evaluate("tutorialRuntimeStartScenario('lesson-4-liberti',{resume:true})") is True
    page.wait_for_timeout(600)
    resume_after = page.evaluate("""() => ({step:tutorialRuntimeDiagnostics().stepId,player:state.currentPlayer,hand:tutorialRuntimeDiagnostics().actualHandState,enemyAlive:state.units.some(u=>u&&u.alive&&u.id==='AGC1F04')})""")
    assert resume_before["step"] == "select-predone-to-capture" and not resume_before["enemyAlive"] and resume_before["seenMark"] and resume_before["seenCoord"] and resume_before["seenDestroyed"], resume_before
    assert resume_after == {"step":"select-predone-to-capture","player":1,"hand":"collapsed","enemyAlive":False}, resume_after
    snap(page, "resume-coordinated-checkpoint")

    predone_uid = page.evaluate("state.units.find(u=>u.alive&&u.id==='LX2B02').uid")
    page.locator(f'.unitToken[data-unit-uid="{predone_uid}"]').click()
    page.wait_for_timeout(300)
    snap(page, "capture-center")
    page.locator('.hex[data-coord-key="0,0,0"]').click()
    page.wait_for_timeout(800)
    completed_step = snap(page, "lesson-complete")
    assert completed_step["step"] == "liberti-lesson-complete", completed_step
    next_step("finished")
    page.wait_for_timeout(1000)

    final = page.evaluate("""() => {
      const center=state.cells.find(c=>Array.isArray(c.coord)&&c.coord.join(',')==='0,0,0');
      const occupant=state.units.find(u=>u&&u.alive&&Array.isArray(u.pos)&&u.pos.join(',')==='0,0,0');
      return {
        active:tutorialRuntimeDiagnostics().active,
        progress:tutorialRuntimeProgressForScenario('lesson-4-liberti'),
        store:tutorialRuntimeStorageRead(),
        precheck:runPrecheck({quiet:true,source:'f9o7f-final'}),
        center:{control:center&&center.control,occupant:occupant&&occupant.name},
        enemies:state.units.filter(u=>u&&u.alive&&u.side===2&&u.type!=='QG').map(u=>u.id),
        handIds:state.hand[1].map(c=>c.id),
        events:state.events.filter(e=>['TACTIC_USED','TURN_ENDED','UNIT_ATTACKED','UNIT_DAMAGED','UNIT_DESTROYED','PS_CONTROL_CHANGED'].includes(e.type)).map(e=>({type:e.type,data:e.data}))
      };
    }""")
    browser.close()

unexpected = [msg for msg in console_errors if not msg.startswith("Arena AppShell: inizializzazione GameScreen non bloccante fallita")]
result = {
    "ok": True,
    "build": initial["build"],
    "stepsVisited": len(trace),
    "lessonCompleted": final["progress"]["completed"],
    "center": final["center"],
    "previewLayer": preview_layer,
    "eventCount": len(final["events"]),
    "pageErrors": page_errors,
    "consoleErrors": unexpected
}
print(json.dumps(result, ensure_ascii=False, indent=2))

assert initial["build"] == "C2-STABLE-1-F9V2d-APK-M4c", initial
assert initial["audit"]["ok"] and initial["precheck"]["ok"], initial
assert initial["menu"] == {"available":5,"starts":5,"lesson4":True}, initial["menu"]
assert final["active"] is False and final["progress"]["completed"] is True, final
assert final["store"]["lessons"]["lesson-4-liberti"]["completed"] is True, final
assert final["precheck"]["ok"], final["precheck"]
assert final["center"] == {"control":1,"occupant":"Predone Liberto"}, final["center"]
assert final["enemies"] == [], final["enemies"]
assert sorted(final["handIds"]) == sorted(["TACTIC:LBTAC05", "TACTIC:LBTAC09"]), final["handIds"]
assert resume_before["seenMark"] and resume_before["seenCoord"] and resume_before["seenDestroyed"], resume_before
assert any(e["type"] == "PS_CONTROL_CHANGED" and e["data"].get("nextControl") == 1 and e["data"].get("occupantName") == "Predone Liberto" for e in final["events"]), final["events"]
assert not page_errors, page_errors
assert not unexpected, unexpected
