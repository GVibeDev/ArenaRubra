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
      const oplite=state && state.units.find(u=>u&&u.alive&&u.id==='AG1B02');
      const grove=state && state.units.find(u=>u&&u.alive&&u.id==='AG4B01');
      return {
        step:tutorialRuntimeDiagnostics().stepId,
        currentPlayer:state && state.currentPlayer,
        turn:state && state.turn,
        energy:state && state.energy && state.energy[1],
        handState:tutorialRuntimeDiagnostics().actualHandState,
        handIds:state && state.hand && state.hand[1].map(c=>c.id),
        oplite:oplite?{hp:oplite.currentHp,def:oplite.currentDef,att:oplite.currentAtt,statuses:(oplite.statuses||[]).map(s=>s.kind)}:null,
        grove:grove?{hp:grove.currentHp,def:grove.currentDef}:null,
        enemies:state && state.units.filter(u=>u&&u.alive&&u.side===2&&u.type!=='QG').map(u=>({id:u.id,hp:u.currentHp,def:u.currentDef,pos:u.pos}))
      };
    }""")
    trace.append({"label": label, **value})
    return value

with sync_playwright() as p:
    browser = p.chromium.launch(**chromium_launch_options())
    page = browser.new_page(viewport={"width": 1365, "height": 900}, has_touch=True)
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
        precheck:runPrecheck({quiet:true,source:'f9o7e-initial'}),
        menu:{
          available:document.querySelectorAll('#tutorialLessonGrid .tutorialLessonCard.isAvailable').length,
          starts:document.querySelectorAll('#tutorialLessonGrid [data-tutorial-start]').length,
          lesson3:Boolean(document.querySelector('#tutorialLessonGrid [data-tutorial-start="lesson-3-agathoi"]'))
        }
      };
    }""")
    assert page.evaluate("tutorialRuntimeResetProgress()") is True
    assert page.evaluate("tutorialRuntimeStartScenario('lesson-3-agathoi')") is True
    page.wait_for_timeout(500)
    snap(page, "start")

    def next_step(label, wait=320):
        page.locator("#narrativeOverlayRoot .narrativeNextBtn").click()
        page.wait_for_timeout(wait)
        return snap(page, label)

    next_step("line-overview")
    next_step("choose-thorns")
    next_step("select-thorns")
    thorns_uid = page.evaluate("state.hand[1].find(c=>c.id==='TACTIC:AGTAC07').cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{thorns_uid}"]').first.click(); page.wait_for_timeout(320); snap(page,"target-thorns")
    oplite_uid = page.evaluate("state.units.find(u=>u.alive&&u.id==='AG1B02').uid")
    page.locator(f'.unitToken[data-unit-uid="{oplite_uid}"]').click(); page.wait_for_timeout(520); snap(page,"thorns-ready")
    next_step("end-wave-one")
    page.locator(".mapLeftEndTurnBtn").first.click(); page.wait_for_timeout(850); wave1 = snap(page,"wave-one-resolved")
    assert wave1["step"] == "wave-one-resolved", wave1
    assert not any(e["id"] == "EX1B01" for e in wave1["enemies"]), wave1
    next_step("choose-counterattack-before-resume")

    # Verifica ripresa dal primo checkpoint della Lezione 3.
    resume_before = page.evaluate("""() => ({
      step:tutorialRuntimeDiagnostics().stepId,
      player:state.currentPlayer,
      progress:tutorialRuntimeProgressForScenario('lesson-3-agathoi'),
      oplite:state.units.find(u=>u.alive&&u.id==='AG1B02') && {hp:state.units.find(u=>u.alive&&u.id==='AG1B02').currentHp,def:state.units.find(u=>u.alive&&u.id==='AG1B02').currentDef},
      seenThornsTactic:state.events.some(e=>e.type==='TACTIC_USED'&&e.data&&e.data.tacticId==='AGTAC07'),
      seenWaveOneDestroyed:state.events.some(e=>e.type==='UNIT_DESTROYED'&&e.data&&e.data.unitName==='Guardia di Aurex')
    })""")
    assert page.evaluate("tutorialRuntimeAbort({silent:true,keepScreen:true,reason:'f9o7e-resume-check'})") is True
    assert page.evaluate("tutorialRuntimeStartScenario('lesson-3-agathoi',{resume:true})") is True
    page.wait_for_timeout(550)
    resume_after = page.evaluate("""() => ({step:tutorialRuntimeDiagnostics().stepId,player:state.currentPlayer,hand:tutorialRuntimeDiagnostics().actualHandState})""")
    assert resume_before["step"] == "choose-counterattack" and resume_before["seenThornsTactic"] and resume_before["seenWaveOneDestroyed"], resume_before
    assert resume_after == {"step":"choose-counterattack","player":1,"hand":"open"}, resume_after
    snap(page,"resume-wave-one")

    next_step("select-counterattack")
    counter_uid = page.evaluate("state.hand[1].find(c=>c.id==='TACTIC:AGTAC05').cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{counter_uid}"]').first.click(); page.wait_for_timeout(320); snap(page,"target-counterattack")
    page.locator(f'.unitToken[data-unit-uid="{oplite_uid}"]').click(); page.wait_for_timeout(520); snap(page,"counterattack-ready")
    next_step("end-wave-two")
    page.locator(".mapLeftEndTurnBtn").first.click(); page.wait_for_timeout(950); wave2 = snap(page,"wave-two-resolved")
    assert wave2["step"] == "wave-two-resolved", wave2
    assert not any(e["id"] == "EX1B04" for e in wave2["enemies"]), wave2
    assert wave2["oplite"]["hp"] == 3, wave2

    next_step("choose-fortification")
    next_step("select-fortification")
    fort_uid = page.evaluate("state.hand[1].find(c=>c.id==='TACTIC:AGTAC04').cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{fort_uid}"]').first.click(); page.wait_for_timeout(320); snap(page,"target-fortification")
    grove_uid = page.evaluate("state.units.find(u=>u.alive&&u.id==='AG4B01').uid")
    page.locator(f'.unitToken[data-unit-uid="{grove_uid}"]').click(); page.wait_for_timeout(550); fort = snap(page,"fortification-ready")
    assert fort["grove"]["def"] == fort["grove"]["hp"] == 4, fort
    next_step("end-wave-three")
    page.locator(".mapLeftEndTurnBtn").first.click(); page.wait_for_timeout(950); wave3 = snap(page,"wave-three-survived")
    assert wave3["step"] == "wave-three-survived", wave3
    assert wave3["grove"] == {"hp":4,"def":0}, wave3
    assert any(e["id"] == "EX2B04" and e["hp"] == 2 and e["def"] == 0 for e in wave3["enemies"]), wave3

    next_step("select-oplite-final")
    page.locator(f'.unitToken[data-unit-uid="{oplite_uid}"]').click(); page.wait_for_timeout(300); snap(page,"destroy-third-wave")
    artillery_uid = page.evaluate("state.units.find(u=>u.alive&&u.id==='EX2B04').uid")
    page.locator(f'.unitToken[data-unit-uid="{artillery_uid}"]').click(); page.wait_for_timeout(750); snap(page,"lesson-complete")
    next_step("finished")
    page.wait_for_timeout(1200)

    final = page.evaluate("""() => {
      const center=state.cells.find(c=>Array.isArray(c.coord)&&c.coord.join(',')==='0,0,0');
      const oplite=state.units.find(u=>u&&u.alive&&u.id==='AG1B02');
      const grove=state.units.find(u=>u&&u.alive&&u.id==='AG4B01');
      return {
        active:tutorialRuntimeDiagnostics().active,
        progress:tutorialRuntimeProgressForScenario('lesson-3-agathoi'),
        store:tutorialRuntimeStorageRead(),
        precheck:runPrecheck({quiet:true,source:'f9o7e-final'}),
        centerControl:center&&center.control,
        oplite:oplite&&{hp:oplite.currentHp,def:oplite.currentDef,att:oplite.currentAtt},
        grove:grove&&{hp:grove.currentHp,def:grove.currentDef},
        enemies:state.units.filter(u=>u&&u.alive&&u.side===2&&u.type!=='QG').map(u=>u.id),
        handIds:state.hand[1].map(c=>c.id),
        events:state.events.filter(e=>['TACTIC_USED','TURN_ENDED','UNIT_ATTACKED','UNIT_DAMAGED','UNIT_DESTROYED'].includes(e.type)).map(e=>({type:e.type,data:e.data}))
      };
    }""")
    browser.close()

unexpected = [msg for msg in console_errors if not msg.startswith("Arena AppShell: inizializzazione GameScreen non bloccante fallita")]
result = {
    "ok": True,
    "build": initial["build"],
    "stepsVisited": len(trace),
    "lessonCompleted": final["progress"]["completed"],
    "centerControl": final["centerControl"],
    "oplite": final["oplite"],
    "grove": final["grove"],
    "eventCount": len(final["events"]),
    "pageErrors": page_errors,
    "consoleErrors": unexpected
}
print(json.dumps(result, ensure_ascii=False, indent=2))

assert initial["build"] == "C2-STABLE-1-F9V2b-APK-M4c", initial
assert initial["audit"]["ok"] and initial["precheck"]["ok"], initial
assert initial["menu"] == {"available":5,"starts":5,"lesson3":True}, initial["menu"]
assert final["active"] is False and final["progress"]["completed"] is True, final
assert final["store"]["lessons"]["lesson-3-agathoi"]["completed"] is True, final
assert final["precheck"]["ok"], final["precheck"]
assert final["centerControl"] == 1, final
assert final["oplite"]["hp"] == 3, final["oplite"]
assert final["grove"]["hp"] == 4, final["grove"]
assert final["enemies"] == [], final["enemies"]
assert final["handIds"] == ["TACTIC:AGTAC08"], final["handIds"]
assert resume_before["seenThornsTactic"], resume_before
for tactic_id in ["AGTAC05","AGTAC04"]:
    assert any(e["type"] == "TACTIC_USED" and e["data"].get("tacticId") == tactic_id for e in final["events"]), (tactic_id, final["events"])
assert resume_before["seenWaveOneDestroyed"], resume_before
for unit_name in ["Legionario Pesante","Artiglieria Exordium"]:
    assert any(e["type"] == "UNIT_DESTROYED" and e["data"].get("unitName") == unit_name for e in final["events"]), (unit_name, final["events"])
assert not page_errors, page_errors
assert not unexpected, unexpected
