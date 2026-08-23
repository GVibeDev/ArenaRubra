from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import os
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
index = (ROOT / "index.html").read_text(encoding="utf-8")
scripts = re.findall(r'<script\s+src="([^"]+)"\s*></script>', index)
html = re.sub(r'<script\s+src="[^"]+"\s*></script>', "", index)
html = re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>', "", html)
page_errors = []
console_errors = []
trace = []


def browser_executable():
    candidates = [
        os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE"),
        shutil.which("chromium"),
        shutil.which("chromium-browser"),
        shutil.which("google-chrome"),
        shutil.which("chrome"),
        shutil.which("msedge"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        "/usr/bin/chromium",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return str(candidate)
    return None


def snap(page, label):
    value = page.evaluate(
        """() => {
          const target=state && state.units.find(u=>u&&u.alive&&u.id==='NXC1F01');
          const adept=state && state.units.find(u=>u&&u.alive&&u.id==='FB1B01');
          const enemyCard=state && state.hand && state.hand[2] && state.hand[2][0];
          return {
            step:tutorialRuntimeDiagnostics().stepId,
            currentPlayer:state && state.currentPlayer,
            energy:{p1:state&&state.energy&&state.energy[1],p2:state&&state.energy&&state.energy[2]},
            handState:tutorialRuntimeDiagnostics().actualHandState,
            mode:typeof mode==='undefined'?null:mode,
            handIds:state&&state.hand&&state.hand[1].map(c=>c.id),
            target:target?{
              side:target.side,
              faction:target.faction,
              hp:target.currentHp,
              def:target.currentDef,
              acted:target.acted,
              statuses:(target.statuses||[]).map(s=>({kind:s.kind,value:s.value,turns:s.turns,owner:s.owner}))
            }:null,
            adept:adept?{acted:adept.acted}:null,
            enemyCard:enemyCard?{
              id:enemyCard.id,
              blockedTurns:enemyCard.c2c7aBlockedTurns||0,
              blockedBy:enemyCard.c2c7aBlockedBy||null
            }:null,
            controlledPs:typeof countControlledPS==='function'?countControlledPS(1):null,
            enemyEffects:state&&state.playerEffects&&state.playerEffects[2].map(e=>({
              kind:e.kind,value:e.value,turns:e.turns,source:e.source
            }))
          };
        }"""
    )
    trace.append({"label": label, **value})
    return value


with sync_playwright() as playwright:
    launch_options = {
        "headless": True,
        "args": ["--no-sandbox", "--allow-file-access-from-files"],
    }
    executable = browser_executable()
    if executable:
        launch_options["executable_path"] = executable
    browser = playwright.chromium.launch(**launch_options)
    page = browser.new_page(viewport={"width": 1365, "height": 900})
    page.set_default_timeout(10000)
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    calibration = ROOT / "css/renderer_calibration_lab.css"
    if calibration.exists():
        page.add_style_tag(path=str(calibration))
    for rel in scripts:
        page.add_script_tag(path=str(ROOT / rel))
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.evaluate(
        """() => {
          const splash=document.getElementById('appSplash');
          if(splash){splash.hidden=true;splash.style.display='none';splash.setAttribute('aria-hidden','true');}
        }"""
    )
    page.wait_for_timeout(350)

    initial = page.evaluate(
        """() => {
          tutorialRuntimeRenderMenu();
          return {
            build:BUILD_INFO.version,
            audit:tutorialScenarioAuditF9O6(),
            precheck:runPrecheck({quiet:true,source:'f9o7g-initial'}),
            menu:{
              available:document.querySelectorAll('#tutorialLessonGrid .tutorialLessonCard.isAvailable').length,
              starts:document.querySelectorAll('#tutorialLessonGrid [data-tutorial-start]').length,
              lesson5:Boolean(document.querySelector('#tutorialLessonGrid [data-tutorial-start="lesson-5-fabeot"]'))
            }
          };
        }"""
    )
    assert page.evaluate("tutorialRuntimeResetProgress()") is True
    assert page.evaluate("tutorialRuntimeStartScenario('lesson-5-fabeot')") is True
    page.wait_for_timeout(550)
    started = snap(page, "start")
    assert started["controlledPs"] == 1 and started["enemyCard"]["id"] == "UNIT:NXC1F03", started

    def next_step(label, wait=360):
        page.locator("#narrativeOverlayRoot .narrativeNextBtn").click()
        page.wait_for_timeout(wait)
        return snap(page, label)

    next_step("contract-overview")
    next_step("select-hierarch")

    hierarch_uid = page.evaluate("state.units.find(u=>u.alive&&u.id==='FB0B00').uid")
    page.locator(f'.unitToken[data-unit-uid="{hierarch_uid}"]').click()
    page.wait_for_timeout(300)
    assert snap(page, "activate-sentence")["step"] == "activate-purple-sentence"
    page.locator('#selectedUnitPrimaryAbilitySlot [data-unit-action="ability"]').click()
    page.wait_for_timeout(320)
    assert snap(page, "mark-target")["step"] == "mark-fante-with-vulnerability"

    target_uid = page.evaluate("state.units.find(u=>u.alive&&u.id==='NXC1F01').uid")
    page.locator(f'.unitToken[data-unit-uid="{target_uid}"]').click()
    page.wait_for_timeout(650)
    vulnerable = snap(page, "vulnerability-checkpoint")
    assert vulnerable["step"] == "vulnerability-contract-ready", vulnerable
    assert vulnerable["energy"]["p1"] == 18, vulnerable
    assert any(status["kind"] == "fabeot_vulnerable" and status["value"] == 1 for status in vulnerable["target"]["statuses"]), vulnerable

    next_step("select-adept")
    adept_uid = page.evaluate("state.units.find(u=>u.alive&&u.id==='FB1B01').uid")
    page.locator(f'.unitToken[data-unit-uid="{adept_uid}"]').click()
    page.wait_for_timeout(260)
    assert snap(page, "attack-vulnerable")["step"] == "exploit-fabeot-vulnerability"
    page.locator(f'.unitToken[data-unit-uid="{target_uid}"]').click()
    page.wait_for_timeout(700)
    prepared = snap(page, "target-ready")
    assert prepared["step"] == "target-ready-for-acquisition", prepared
    assert prepared["target"]["hp"] == 2 and prepared["target"]["def"] == 0, prepared
    assert page.evaluate(
        """state.events.some(e=>e.type==='UNIT_DAMAGED'&&e.data&&e.data.targetName==='Fante Robot'&&e.data.modifier==='Sentenza Porpora'&&e.data.extraDamage===1)"""
    )

    next_step("select-citadel")
    citadel_uid = page.evaluate("state.units.find(u=>u.alive&&u.id==='FBPIV01').uid")
    page.locator(f'.unitToken[data-unit-uid="{citadel_uid}"]').click()
    page.wait_for_timeout(280)
    assert snap(page, "activate-acquisition")["step"] == "activate-acquisition-clause"
    page.locator('#selectedUnitPrimaryAbilitySlot [data-unit-action="ability"]').click()
    page.wait_for_timeout(300)
    assert snap(page, "convert-target")["step"] == "convert-marked-fante"
    page.locator(f'.unitToken[data-unit-uid="{target_uid}"]').click()
    page.wait_for_timeout(750)
    converted = snap(page, "conversion-checkpoint")
    assert converted["step"] == "fabeot-conversion-resolved", converted
    assert converted["energy"]["p1"] == 14, converted
    assert converted["target"]["side"] == 1 and converted["target"]["faction"] == "Fabeot" and converted["target"]["acted"], converted
    assert any(status["kind"] == "inhibit_action" for status in converted["target"]["statuses"]), converted

    next_step("inspect-contracts")

    doctrine_uid = page.evaluate("state.hand[1].find(c=>c.id==='TACTIC:FABTAC04').cardUid")
    doctrine_slot = page.locator(f'#mapHandOverlay [data-preview-card-uid="{doctrine_uid}"]').first
    doctrine_slot.hover()
    page.wait_for_timeout(450)
    preview_layer = page.evaluate(
        """() => {
          const preview=document.getElementById('mapHandSelectionPreview');
          const spot=document.getElementById('tutorialSpotlightRoot');
          const narrative=document.getElementById('narrativeOverlayRoot');
          return {
            visible:Boolean(preview&&preview.classList.contains('isVisible')&&preview.classList.contains('hoverPreview')&&!preview.hidden),
            preview:Number(getComputedStyle(preview).zIndex||0),
            spotlight:Number(getComputedStyle(spot).zIndex||0),
            narrative:Number(getComputedStyle(narrative).zIndex||0),
            opacity:getComputedStyle(preview).opacity,
            filter:getComputedStyle(preview).filter
          };
        }"""
    )
    assert preview_layer["visible"], preview_layer
    assert preview_layer["preview"] == 95 and preview_layer["spotlight"] == 94 and preview_layer["narrative"] == 96, preview_layer
    assert preview_layer["opacity"] == "1" and preview_layer["filter"] == "none", preview_layer

    next_step("play-embargo")

    # Una carta diversa resta leggibile, ma lo scrim ne impedisce l'attivazione.
    doctrine_slot = page.locator(f'#mapHandOverlay [data-preview-card-uid="{doctrine_uid}"]').first
    doctrine_slot.click()
    page.wait_for_timeout(260)
    wrong_contract = snap(page, "wrong-contract")
    assert wrong_contract["step"] == "play-fabeot-embargo", wrong_contract
    assert "TACTIC:FABTAC04" in wrong_contract["handIds"], wrong_contract
    assert not page.evaluate("state.events.some(e=>e.type==='TACTIC_USED'&&e.data&&e.data.tacticId==='FABTAC04')")

    embargo_uid = page.evaluate("state.hand[1].find(c=>c.id==='TACTIC:FABTAC07').cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{embargo_uid}"]').first.click()
    page.wait_for_timeout(750)
    embargo = snap(page, "embargo-checkpoint")
    assert embargo["step"] == "fabeot-embargo-resolved", embargo
    assert embargo["energy"]["p1"] == 11, embargo
    assert embargo["enemyCard"]["blockedTurns"] == 1 and embargo["enemyCard"]["blockedBy"] == 1, embargo
    assert "TACTIC:FABTAC07" not in embargo["handIds"], embargo

    # Il checkpoint appena completato deve ripristinare conversione, blocco Mano, ENE e UI.
    next_step("usury-before-resume")
    resume_before = page.evaluate(
        """() => ({
          step:tutorialRuntimeDiagnostics().stepId,
          progress:tutorialRuntimeProgressForScenario('lesson-5-fabeot'),
          target:state.units.find(u=>u&&u.alive&&u.id==='NXC1F01'),
          enemyCard:state.hand[2][0],
          energy:{p1:state.energy[1],p2:state.energy[2]}
        })"""
    )
    assert page.evaluate("tutorialRuntimeAbort({silent:true,keepScreen:true,reason:'f9o7g-resume-check'})") is True
    assert page.evaluate("tutorialRuntimeStartScenario('lesson-5-fabeot',{resume:true})") is True
    page.wait_for_timeout(700)
    resumed = snap(page, "resumed-embargo-checkpoint")
    assert resumed["step"] == "play-fabeot-usury" and resumed["handState"] == "open", resumed
    assert resumed["target"]["side"] == 1 and resumed["target"]["faction"] == "Fabeot", resumed
    assert resumed["enemyCard"]["blockedTurns"] == 1 and resumed["enemyCard"]["blockedBy"] == 1, resumed
    assert resumed["energy"] == {"p1": 11, "p2": 5}, resumed
    lesson_index = page.evaluate(
        "TUTORIAL_SCENARIOS_F9O6['lesson-5-fabeot'].steps.findIndex(s=>s.id==='play-fabeot-usury')"
    )
    assert resume_before["progress"]["nextStepIndex"] == lesson_index, resume_before

    usury_uid = page.evaluate("state.hand[1].find(c=>c.id==='TACTIC:FABTAC09').cardUid")
    page.locator(f'#mapHandOverlay [data-preview-card-uid="{usury_uid}"]').first.click()
    page.wait_for_timeout(750)
    usury = snap(page, "usury-checkpoint")
    assert usury["step"] == "fabeot-usury-resolved", usury
    assert usury["energy"] == {"p1": 7, "p2": 4}, usury
    assert any(
        effect["kind"] == "income_delta"
        and effect["value"] == -1
        and effect["turns"] == 2
        and effect["source"] == "Contratto di Usura"
        for effect in usury["enemyEffects"]
    ), usury

    next_step("lesson-complete")
    assert snap(page, "completion-card")["step"] == "fabeot-lesson-complete"
    next_step("finished")
    page.wait_for_timeout(950)

    final = page.evaluate(
        """() => {
          const target=state.units.find(u=>u&&u.alive&&u.id==='NXC1F01');
          return {
            active:tutorialRuntimeDiagnostics().active,
            progress:tutorialRuntimeProgressForScenario('lesson-5-fabeot'),
            store:tutorialRuntimeStorageRead(),
            precheck:runPrecheck({quiet:true,source:'f9o7g-final'}),
            target:{side:target&&target.side,faction:target&&target.faction},
            energy:{p1:state.energy[1],p2:state.energy[2]},
            enemyCard:{id:state.hand[2][0].id,blockedTurns:state.hand[2][0].c2c7aBlockedTurns||0},
            handIds:state.hand[1].map(c=>c.id),
            effects:state.playerEffects[2],
            events:state.events.filter(e=>['TACTIC_USED','ECONOMY_CHANGED'].includes(e.type)).map(e=>({type:e.type,data:e.data}))
          };
        }"""
    )
    browser.close()

unexpected = [
    message
    for message in console_errors
    if not message.startswith("Arena AppShell: inizializzazione GameScreen non bloccante fallita")
]
result = {
    "ok": True,
    "build": initial["build"],
    "stepsVisited": len(trace),
    "lessonCompleted": final["progress"]["completed"],
    "previewLayer": preview_layer,
    "resumeStep": resumed["step"],
    "energy": final["energy"],
    "pageErrors": page_errors,
    "consoleErrors": unexpected,
}
print(json.dumps(result, ensure_ascii=False, indent=2))

assert initial["build"] == "C2-STABLE-1-F9V4a-APK-M4c", initial
assert initial["audit"]["ok"] and initial["audit"]["scenarios"] == 5 and initial["precheck"]["ok"], initial
assert initial["menu"] == {"available": 5, "starts": 5, "lesson5": True}, initial["menu"]
assert final["active"] is False and final["progress"]["completed"] is True, final
assert final["store"]["lessons"]["lesson-5-fabeot"]["completed"] is True, final
assert final["precheck"]["ok"], final["precheck"]
assert final["target"] == {"side": 1, "faction": "Fabeot"}, final["target"]
assert final["energy"] == {"p1": 7, "p2": 4}, final["energy"]
assert final["enemyCard"] == {"id": "UNIT:NXC1F03", "blockedTurns": 1}, final["enemyCard"]
assert sorted(final["handIds"]) == sorted(["TACTIC:FABTAC03", "TACTIC:FABTAC04"]), final["handIds"]
assert any(
    event["type"] == "ECONOMY_CHANGED"
    and event["data"].get("source") == "C2c-6b-usury"
    and event["data"].get("energyBefore") == 5
    and event["data"].get("energyAfter") == 4
    for event in final["events"]
), final["events"]
assert not page_errors, page_errors
assert not unexpected, unexpected
