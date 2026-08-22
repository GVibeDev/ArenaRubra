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
      handCount:state && state.hand && state.hand[1].length,
      livingUnits:state && state.units.filter(u => u && u.alive && u.type !== 'QG').length
    })""")
    trace.append({"label": label, **value})
    return value

with sync_playwright() as p:
    browser = p.chromium.launch(**chromium_launch_options())
    page = browser.new_page(viewport={"width": 1365, "height": 900}, has_touch=True)
    page.set_default_timeout(5000)
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    calibration = ROOT / "css/renderer_calibration_lab.css"
    if calibration.exists(): page.add_style_tag(path=str(calibration))
    for rel in scripts: page.add_script_tag(path=str(ROOT / rel))
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.evaluate("""() => { const splash=document.getElementById('appSplash'); if(splash){ splash.hidden=true; splash.style.display='none'; splash.setAttribute('aria-hidden','true'); } }""")
    page.wait_for_timeout(200)

    initial = page.evaluate("""() => ({build:BUILD_INFO.version,audit:tutorialScenarioAuditF9O6(),precheck:runPrecheck({quiet:true,source:'f9o7a-initial'})})""")
    assert page.evaluate("tutorialRuntimeStartScenario('lesson-1-exordium')") is True
    page.wait_for_timeout(350)
    snap(page, "start")

    def next_step(label):
        page.locator("#narrativeOverlayRoot .narrativeNextBtn").click()
        page.wait_for_timeout(260)
        snap(page, label)

    next_step("read-card")
    next_step("collapse")
    page.locator("#mapHandOverlay .mapHandCollapseBtn").click(); page.wait_for_timeout(240); snap(page,"show-hand")
    page.locator("#mapActionDock .mapLeftHandBtn").click(); page.wait_for_timeout(240); snap(page,"select-tribune")
    trib_card = page.evaluate("state.hand[1].find(c=>c.id==='UNIT:EXC1F01').cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{trib_card}"]').first.click(); page.wait_for_timeout(300); snap(page,"deploy-tribune")
    page.locator('.hex[data-coord-key="-5,0,5"]').click(); page.wait_for_timeout(450); snap(page,"fante-arrives")
    next_step("defense")
    next_step("end-turn")
    page.locator(".mapLeftEndTurnBtn").first.click(); page.wait_for_timeout(500); snap(page,"nexus-yields")
    next_step("select-legionary-card")
    leg_card = page.evaluate("state.hand[1].find(c=>c.id==='UNIT:EX1B04').cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{leg_card}"]').first.click(); page.wait_for_timeout(300); snap(page,"deploy-legionary")
    page.locator('.hex[data-coord-key="-5,-1,6"]').click(); page.wait_for_timeout(420); snap(page,"select-tribune-unit")
    trib_uid = page.evaluate("state.units.find(u=>u.alive&&u.id==='EXC1F01').uid")
    page.locator(f'.unitToken[data-unit-uid="{trib_uid}"]').click(); page.wait_for_timeout(260); snap(page,"attack-fante")
    fante_uid = page.evaluate("state.units.find(u=>u.alive&&u.id==='NXC1F01').uid")
    page.locator(f'.unitToken[data-unit-uid="{fante_uid}"]').click(); page.wait_for_timeout(520); snap(page,"legionary-ready")
    next_step("select-legionary-unit")
    leg_uid = page.evaluate("state.units.find(u=>u.alive&&u.id==='EX1B04').uid")
    page.locator(f'.unitToken[data-unit-uid="{leg_uid}"]').click(); page.wait_for_timeout(260); snap(page,"activate-ability")
    page.locator('#selectedUnitPrimaryAbilitySlot [data-unit-action="ability"]').click(); page.wait_for_timeout(260); snap(page,"ability-target")
    page.locator(f'.unitToken[data-unit-uid="{fante_uid}"]').click(); page.wait_for_timeout(650); snap(page,"mech-arrival")
    next_step("read-emp")
    next_step("select-emp")
    emp_uid = page.evaluate("state.hand[1].find(c=>c.id==='TACTIC:EXTAC03').cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{emp_uid}"]').first.click(); page.wait_for_timeout(300); snap(page,"emp-target")
    mech_uid = page.evaluate("state.units.find(u=>u.alive&&u.id==='NX3B03').uid")
    page.locator(f'.unitToken[data-unit-uid="{mech_uid}"]').click(); page.wait_for_timeout(520); snap(page,"emp-result")
    next_step("select-tribune-again")
    page.locator(f'.unitToken[data-unit-uid="{trib_uid}"]').click(); page.wait_for_timeout(260); snap(page,"break-mech-defense")
    page.locator(f'.unitToken[data-unit-uid="{mech_uid}"]').click(); page.wait_for_timeout(700); snap(page,"mech-counterattack")
    next_step("select-legionary-final")
    page.locator(f'.unitToken[data-unit-uid="{leg_uid}"]').click(); page.wait_for_timeout(260); snap(page,"destroy-mech")
    page.locator(f'.unitToken[data-unit-uid="{mech_uid}"]').click(); page.wait_for_timeout(650); snap(page,"lesson-complete")
    next_step("finished")
    page.wait_for_timeout(1300)

    final = page.evaluate("""() => ({
      active:tutorialRuntimeDiagnostics().active,
      progress:tutorialRuntimeProgressForScenario('lesson-1-exordium'),
      store:tutorialRuntimeStorageRead(),
      screen:document.body.dataset.appScreen,
      precheck:runPrecheck({quiet:true,source:'f9o7a-final'}),
      events:state.events.filter(e=>['UNIT_ATTACKED','UNIT_DESTROYED','ABILITY_USED','TACTIC_USED'].includes(e.type)).map(e=>({type:e.type,data:e.data})),
      startupLog:(state.logs||[])[0] || ''
    })""")
    browser.close()

unexpected = [msg for msg in console_errors if not msg.startswith("Arena AppShell: inizializzazione GameScreen non bloccante fallita")]
result = {
    "ok": True,
    "build": initial["build"],
    "stepsVisited": len(trace),
    "lessonCompleted": final["progress"]["completed"],
    "eventCount": len(final["events"]),
    "pageErrors": page_errors,
    "consoleErrors": unexpected
}
print(json.dumps(result, ensure_ascii=False, indent=2))

assert initial["build"] == "C2-STABLE-1-F9V2d-APK-M4c", initial
assert initial["audit"]["ok"] and initial["precheck"]["ok"], initial
assert final["active"] is False and final["progress"]["completed"] is True, final
assert final["store"]["lessons"]["lesson-1-exordium"]["completed"] is True, final
assert final["precheck"]["ok"], final["precheck"]
assert any(e["type"] == "ABILITY_USED" and e["data"].get("abilityName") == "Colpo Pesante" for e in final["events"]), final["events"]
assert any(e["type"] == "TACTIC_USED" and e["data"].get("tacticId") == "EXTAC03" for e in final["events"]), final["events"]
assert any(e["type"] == "UNIT_DESTROYED" and e["data"].get("unitName") == "Fante Robot" for e in final["events"]), final["events"]
assert any(e["type"] == "UNIT_DESTROYED" and e["data"].get("unitName") == "Mech Pesante" for e in final["events"]), final["events"]
assert not page_errors, page_errors
assert not unexpected, unexpected
