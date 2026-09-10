from __future__ import annotations

from browser_runtime import chromium_launch_options
import contextlib
import http.server
import os
import socket
import socketserver
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


@contextlib.contextmanager
def server():
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    previous = os.getcwd()
    os.chdir(ROOT)
    try:
        with socketserver.TCPServer(("127.0.0.1", port), QuietHandler) as httpd:
            thread = threading.Thread(target=httpd.serve_forever, daemon=True)
            thread.start()
            yield f"http://127.0.0.1:{port}/index.html?profile=distribution"
            httpd.shutdown()
            thread.join(timeout=2)
    finally:
        os.chdir(previous)


def no_horizontal_overflow(page, selector):
    result = page.eval_on_selector(selector, """element => ({
        documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
        elementOverflow: element.scrollWidth - element.clientWidth
    })""")
    assert result["documentOverflow"] <= 1, result
    assert result["elementOverflow"] <= 1, result


def main():
    with server() as url, sync_playwright() as playwright:
        browser = playwright.chromium.launch(**chromium_launch_options())
        context = browser.new_context(viewport={"width": 1440, "height": 960})
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(url, wait_until="domcontentloaded")
        page.wait_for_function("() => typeof ArenaI18n === 'object' && ArenaI18n.diagnostics().status === 'ready'")
        page.wait_for_function("() => document.body.dataset.appScreen === 'mainMenu'")

        page.locator("#arenaLanguageSelect").select_option("en")
        page.wait_for_function("() => document.documentElement.lang === 'en'")
        assert page.locator("#endTurnBtn").text_content().strip() == "End turn"
        assert page.locator("#gameHudTurn").text_content().strip().startswith("Turn")
        assert page.locator('#selectedUnitFloat [data-i18n="game.noSelectedUnit"]').text_content().strip() == "No unit selected"
        assert page.locator("#boardVisualStack").get_attribute("aria-label").startswith("Interactive Arena Rubra map")
        unit_projection = page.evaluate("""() => {
            const bp = BLUEPRINTS.find(item => item.id === 'NX2B01');
            const card = buildUnitCardFromBlueprint(bp);
            const projected = ArenaContentI18n.card(card);
            const canvas = document.createElement('canvas');
            document.body.appendChild(canvas);
            const context = canvas.getContext('2d');
            const labels = [];
            const originalFillText = context.fillText.bind(context);
            context.fillText = (value, ...args) => { labels.push(String(value)); return originalFillText(value, ...args); };
            const rendered = renderArenaCardPreviewCanvas(canvas, card, { scale:0.2 });
            canvas.remove();
            return { source:card.name, projected:projected.name, sameId:projected.id === card.id, rendered, labels };
        }""")
        assert unit_projection["source"] == "Droide di Sicurezza"
        assert unit_projection["projected"] == "Security Droid"
        assert unit_projection["sameId"]
        assert unit_projection["rendered"]
        assert "Security Droid" in unit_projection["labels"], unit_projection

        splash = page.locator("#splashEnterBtn")
        if splash.count() and splash.is_visible():
            splash.click()
        page.locator("#mainMenuTutorialBtn").click()
        page.wait_for_function("() => document.body.dataset.appScreen === 'tutorial'")
        page.wait_for_function("() => document.querySelectorAll('#tutorialLessonGrid .tutorialLessonCard').length === 5")
        assert page.locator("#tutorialScreen h2").text_content().strip() == "Five-lesson tutorial"
        assert page.locator("#tutorialLessonGrid .tutorialLessonCard strong").first.text_content().strip() == "Cards, combat, and tactics"
        assert page.locator("#tutorialLessonGrid [data-tutorial-start]").first.text_content().strip() == "Start"
        assert page.locator("#tutorialRuntimeDemoBtn").text_content().strip() == "Start Lesson 1"
        assert page.locator("#tutorialChallengeSection h3").first.text_content().strip() == "Field tests"
        assert page.locator("#tutorialChallengeGrid .tutorialChallengeCard strong").first.text_content().strip() == "Elimination"
        assert "Field tests locked" in page.locator("#tutorialChallengeGate").text_content()
        assert page.locator("#tutorialScreen").get_attribute("aria-label") == "Arena Rubra tutorial"
        no_horizontal_overflow(page, "#tutorialScreen")

        page.evaluate("() => ArenaI18n.setLanguage('it')")
        page.wait_for_function("() => document.documentElement.lang === 'it'")
        assert page.locator("#tutorialLessonGrid .tutorialLessonCard strong").first.text_content().strip() == "Carte, combattimento e tattiche"
        page.evaluate("() => ArenaI18n.setLanguage('en')")
        page.wait_for_function("() => document.documentElement.lang === 'en'")
        assert page.locator("#tutorialLessonGrid .tutorialLessonCard strong").first.text_content().strip() == "Cards, combat, and tactics"

        page.evaluate("""() => arenaResultModalShowChallengeResultF9V3a(
            tutorialRuntimeChallengeById('challenge-1-elimination'), false, 'all_player_units_destroyed'
        )""")
        modal = page.locator("#arenaResultModalRootF9V3a")
        assert modal.locator(".arenaResultModalTitleF9V3a").text_content().strip() == "FIELD TEST FAILED"
        assert modal.locator(".arenaResultModalSubjectF9V3a").text_content().strip() == "Elimination"
        assert modal.locator(".arenaResultModalDetailF9V3a").text_content().strip() == "The test ended: Player forces eliminated."
        assert modal.locator('[data-result-action="retry-challenge"]').text_content().strip() == "Try again"
        assert modal.locator('[data-result-action="academy"]').text_content().strip() == "Back to the Academy"
        page.evaluate("() => arenaResultModalResolveF9V3c('browser-smoke')")

        page.evaluate("""() => arenaResultModalShowMatchVictoryF9V3a({
            data:{winner:1, winnerFaction:'Nexus', round:3, winType:'qg'}
        })""")
        assert modal.locator(".arenaResultModalTitleF9V3a").text_content().strip() in {"VICTORY", "DEFEAT"}
        assert modal.locator(".arenaResultModalEyebrowF9V3a").text_content().strip() == "MATCH ENDED"
        assert "Player 1" in modal.locator(".arenaResultModalSubjectF9V3a").text_content()
        assert modal.locator('[data-result-action="new-game"]').text_content().strip() == "New game"
        assert modal.locator('[data-result-action="log"]').text_content().strip() == "Log"
        page.evaluate("() => arenaResultModalResolveF9V3c('browser-smoke')")

        page.set_viewport_size({"width": 760, "height": 900})
        no_horizontal_overflow(page, "#tutorialScreen")
        assert not errors, errors

        context.close()
        browser.close()

    print("S2-C5b3/S2-C5b4b/S2-C5b5 browser localization smoke: 34/34 OK")


if __name__ == "__main__":
    main()
