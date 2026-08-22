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
    value = page.evaluate("""() => ({
      step:tutorialRuntimeDiagnostics().stepId,
      currentPlayer:state && state.currentPlayer,
      turn:state && state.turn,
      energy:state && state.energy && state.energy[1],
      handState:tutorialRuntimeDiagnostics().actualHandState,
      handCount:state && state.hand && state.hand[1].length,
      starterCount:state && state.starterCards && Object.values(state.starterCards[1] || {}).length,
      livingUnits:state && state.units.filter(u => u && u.alive && u.type !== 'QG').length
    })""")
    trace.append({"label": label, **value})
    return value

with sync_playwright() as p:
    browser = p.chromium.launch(**chromium_launch_options())
    page = browser.new_page(viewport={"width": 1365, "height": 900}, has_touch=True)
    page.set_default_timeout(8000)
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    calibration = ROOT / "css/renderer_calibration_lab.css"
    if calibration.exists(): page.add_style_tag(path=str(calibration))
    for rel in scripts: page.add_script_tag(path=str(ROOT / rel))
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.evaluate("""() => { const splash=document.getElementById('appSplash'); if(splash){ splash.hidden=true; splash.style.display='none'; splash.setAttribute('aria-hidden','true'); } }""")
    page.wait_for_timeout(250)

    initial = page.evaluate("""() => {
      tutorialRuntimeRenderMenu();
      return {
        build:BUILD_INFO.version,
        audit:tutorialScenarioAuditF9O6(),
        precheck:runPrecheck({quiet:true,source:'f9o7c-initial'}),
        menu:{
          available:document.querySelectorAll('#tutorialLessonGrid .tutorialLessonCard.isAvailable').length,
          starts:document.querySelectorAll('#tutorialLessonGrid [data-tutorial-start]').length,
          lesson2:Boolean(document.querySelector('#tutorialLessonGrid [data-tutorial-start="lesson-2-nexus"]'))
        }
      };
    }""")
    assert page.evaluate("tutorialRuntimeResetProgress()") is True
    assert page.evaluate("tutorialRuntimeStartScenario('lesson-2-nexus')") is True
    page.wait_for_timeout(400)
    snap(page, "start")

    def next_step(label):
        page.locator("#narrativeOverlayRoot .narrativeNextBtn").click()
        page.wait_for_timeout(280)
        return snap(page, label)

    next_step("starter-overview")
    next_step("read-droid")
    next_step("select-droid")
    droid_card = page.evaluate("state.starterCards[1].starter_infantry.cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{droid_card}"]').first.click(); page.wait_for_timeout(320); snap(page,"deploy-droid")
    page.locator('.hex[data-coord-key="-5,0,5"]').click(); page.wait_for_timeout(500); snap(page,"starter-remains")
    next_step("end-turn-droid")
    page.locator(".mapLeftEndTurnBtn").first.click(); page.wait_for_timeout(520); snap(page,"opponent-pass-droid")
    next_step("select-droid-unit")
    droid_uid = page.evaluate("state.units.find(u=>u.alive&&u.id==='NX2B01').uid")
    page.locator(f'.unitToken[data-unit-uid="{droid_uid}"]').click(); page.wait_for_timeout(300); snap(page,"move-droid")
    page.locator('.hex[data-coord-key="-4,0,4"]').click(); page.wait_for_timeout(500); snap(page,"read-structure")
    next_step("select-structure")
    structure_card = page.evaluate("state.starterCards[1].starter_structure.cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{structure_card}"]').first.click(); page.wait_for_timeout(320); snap(page,"build-structure")
    page.locator('.hex[data-coord-key="-3,0,3"]').click(); page.wait_for_timeout(550); snap(page,"network-online")
    next_step("read-quad")
    # Il checkpoint della rete deve riprendere la seconda lezione, non la Lezione 1.
    resume_before = page.evaluate("""() => ({
      step:tutorialRuntimeDiagnostics().stepId,
      player:state.currentPlayer,
      hand:tutorialRuntimeDiagnostics().actualHandState,
      progress:tutorialRuntimeProgressForScenario('lesson-2-nexus'),
      seenDroid:state.events.some(e=>e.type==='UNIT_SPAWNED'&&e.data&&e.data.blueprintId==='NX2B01'),
      seenBuild:state.events.some(e=>e.type==='UNIT_BUILT'&&e.data&&e.data.blueprintId==='NXC1F07')
    })""")
    assert page.evaluate("tutorialRuntimeAbort({silent:true,keepScreen:true,reason:'f9o7c-resume-check'})") is True
    assert page.evaluate("tutorialRuntimeStartScenario('lesson-2-nexus',{resume:true})") is True
    page.wait_for_timeout(500)
    resume_after = page.evaluate("""() => ({step:tutorialRuntimeDiagnostics().stepId, player:state.currentPlayer, hand:tutorialRuntimeDiagnostics().actualHandState})""")
    assert resume_before["step"] == "read-starter-vehicle" and resume_before["seenDroid"] and resume_before["seenBuild"], resume_before
    assert resume_after == {"step":"read-starter-vehicle","player":1,"hand":"open"}, resume_after
    snap(page,"resume-network-checkpoint")
    next_step("select-quad-card")
    quad_card = page.evaluate("state.starterCards[1].starter_vehicle.cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{quad_card}"]').first.click(); page.wait_for_timeout(320); snap(page,"deploy-quad")
    page.locator('.hex[data-coord-key="-2,0,2"]').click(); page.wait_for_timeout(550); snap(page,"quad-exhausted")
    next_step("end-turn-quad")
    page.locator(".mapLeftEndTurnBtn").first.click(); page.wait_for_timeout(520); snap(page,"opponent-pass-quad")
    next_step("select-quad-unit")
    quad_uid = page.evaluate("state.units.find(u=>u.alive&&u.id==='NX3B01').uid")
    page.locator(f'.unitToken[data-unit-uid="{quad_uid}"]').click(); page.wait_for_timeout(300); snap(page,"quad-center")
    page.locator('.hex[data-coord-key="0,0,0"]').click(); page.wait_for_timeout(650); snap(page,"ordinary-route-complete")
    next_step("prepare-vanguard")
    next_step("select-vanguard-card")
    mech_card = page.evaluate("state.hand[1].find(c=>c.id==='UNIT:NXC1F03').cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{mech_card}"]').first.click(); page.wait_for_timeout(320); snap(page,"deploy-vanguard")
    page.locator('.hex[data-coord-key="-2,0,2"]').click(); page.wait_for_timeout(550); snap(page,"select-vanguard-unit")
    mech_uid = page.evaluate("state.units.find(u=>u.alive&&u.id==='NXC1F03').uid")
    page.locator(f'.unitToken[data-unit-uid="{mech_uid}"]').click(); page.wait_for_timeout(300); snap(page,"vanguard-center")
    page.locator('.hex[data-coord-key="0,0,0"]').click(); page.wait_for_timeout(650); snap(page,"lesson-complete")
    next_step("finished")
    page.wait_for_timeout(900)

    final = page.evaluate("""() => {
      const center = state.cells.find(c => Array.isArray(c.coord) && c.coord.join(',') === '0,0,0');
      const centerUnit = state.units.find(u => u && u.alive && Array.isArray(u.pos) && u.pos.join(',') === '0,0,0');
      return {
        active:tutorialRuntimeDiagnostics().active,
        progress:tutorialRuntimeProgressForScenario('lesson-2-nexus'),
        store:tutorialRuntimeStorageRead(),
        precheck:runPrecheck({quiet:true,source:'f9o7c-final'}),
        center:{control:center && center.control, occupant:centerUnit && centerUnit.name},
        starterIds:Object.values(state.starterCards[1] || {}).map(c=>c.id).sort(),
        handIds:state.hand[1].map(c=>c.id),
        events:state.events.filter(e=>['UNIT_SPAWNED','UNIT_BUILT','UNIT_MOVED','TURN_ENDED','PS_CONTROL_CHANGED'].includes(e.type)).map(e=>({type:e.type,data:e.data}))
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
    "eventCount": len(final["events"]),
    "pageErrors": page_errors,
    "consoleErrors": unexpected
}
print(json.dumps(result, ensure_ascii=False, indent=2))

assert initial["build"] == "C2-STABLE-1-F9V2a-APK-M4c", initial
assert initial["audit"]["ok"] and initial["precheck"]["ok"], initial
assert initial["menu"] == {"available":5,"starts":5,"lesson2":True}, initial["menu"]
assert final["active"] is False and final["progress"]["completed"] is True, final
assert final["store"]["lessons"]["lesson-2-nexus"]["completed"] is True, final
assert final["precheck"]["ok"], final["precheck"]
assert final["center"]["control"] == 1 and final["center"]["occupant"] == "Mech Leggero", final["center"]
assert final["starterIds"] == sorted(["UNIT:NX2B01", "UNIT:NX3B01", "UNIT:NXC1F07"]), final["starterIds"]
assert "UNIT:NXC1F03" not in final["handIds"], final["handIds"]
assert any(e["type"] == "UNIT_SPAWNED" and e["data"].get("blueprintId") == "NX3B01" for e in final["events"]), final["events"]
assert any(e["type"] == "UNIT_SPAWNED" and e["data"].get("blueprintId") == "NXC1F03" for e in final["events"]), final["events"]
assert sum(1 for e in final["events"] if e["type"] == "PS_CONTROL_CHANGED" and e["data"].get("nextControl") == 1) >= 2, final["events"]
assert not page_errors, page_errors
assert not unexpected, unexpected
