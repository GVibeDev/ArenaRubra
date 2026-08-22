from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT = Path(__file__).resolve().parents[1]
page_errors = []
console_errors = []

html = """
<!doctype html><html><body>
  <section id='tutorialScreen'>
    <div id='tutorialLessonGrid'></div>
    <button id='tutorialRuntimeDemoBtn' type='button'></button>
    <button id='tutorialResumeBtn' type='button'></button>
    <button id='tutorialResetProgressBtn' type='button'></button>
    <div id='tutorialRuntimeStatus'></div>
  </section>
</body></html>
"""

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.set_content(html, wait_until="load")
    page.add_script_tag(path=str(ROOT / "data/tutorial_scenarios.js"))
    page.add_script_tag(path=str(ROOT / "src/tutorial_runtime.js"))
    page.evaluate("tutorialRuntimeRenderMenu()")

    initial = page.evaluate("""() => ({
      lessons:document.querySelectorAll('[data-tutorial-lesson]').length,
      challenges:document.querySelectorAll('[data-tutorial-challenge]').length,
      unlocked:[...document.querySelectorAll('[data-tutorial-challenge]')].map(card => card.dataset.challengeUnlocked),
      disabled:[...document.querySelectorAll('[data-tutorial-challenge-start]')].map(button => button.disabled),
      labels:[...document.querySelectorAll('[data-tutorial-challenge-start]')].map(button => button.textContent.trim()),
      gate:document.getElementById('tutorialChallengeGate')?.textContent || '',
      status:document.getElementById('tutorialRuntimeStatus')?.textContent || ''
    })""")

    assert initial["lessons"] == 5, initial
    assert initial["challenges"] == 5, initial
    assert all(value == "false" for value in initial["unlocked"]), initial
    assert all(initial["disabled"]), initial
    assert all(label == "Bloccata" for label in initial["labels"]), initial
    assert "0/5" in initial["gate"] and "bloccate" in initial["gate"].lower(), initial

    page.evaluate("""() => {
      const lessons = {};
      for (const item of TUTORIAL_LESSON_PLAN_F9O6) lessons[item.id] = { completed:true, scenarioId:item.scenarioId };
      tutorialRuntimeStorageWrite({ schemaVersion:1, scenarios:{}, lessons, updatedAt:new Date().toISOString() });
      tutorialRuntimeRenderMenu();
    }""")

    unlocked = page.evaluate("""() => ({
      cards:[...document.querySelectorAll('[data-tutorial-challenge]')].map(card => ({
        unlocked:card.dataset.challengeUnlocked,
        cls:card.className,
        text:card.innerText
      })),
      disabled:[...document.querySelectorAll('[data-tutorial-challenge-start]')].map(button => button.disabled),
      labels:[...document.querySelectorAll('[data-tutorial-challenge-start]')].map(button => button.textContent.trim()),
      gate:document.getElementById('tutorialChallengeGate')?.textContent || '',
      status:document.getElementById('tutorialRuntimeStatus')?.textContent || '',
      diag:tutorialRuntimeChallengeDiagnostics()
    })""")

    assert all(card["unlocked"] == "true" for card in unlocked["cards"]), unlocked
    assert all("isAvailable" in card["cls"] for card in unlocked["cards"]), unlocked
    assert all("Sbloccata: Accademia completata." in card["text"] for card in unlocked["cards"]), unlocked
    assert all(unlocked["disabled"]), unlocked  # content F9V2b–F9V2f not shipped yet
    assert all(label == "In preparazione" for label in unlocked["labels"]), unlocked
    assert "5/5" in unlocked["gate"] and "sbloccate" in unlocked["gate"].lower(), unlocked
    assert unlocked["diag"]["unlocked"] is True and unlocked["diag"]["completedLessons"] == 5, unlocked

    browser.close()

assert not page_errors, page_errors
assert not console_errors, console_errors

print(json.dumps({
    "ok": True,
    "lessons": initial["lessons"],
    "challengeCards": initial["challenges"],
    "initialGate": initial["gate"],
    "unlockedGate": unlocked["gate"],
    "pageErrors": page_errors,
    "consoleErrors": console_errors
}, ensure_ascii=False, indent=2))
