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

        assert page.get_attribute("html", "lang") == "it"
        assert page.locator("#arenaLanguageSelect").input_value() == "it"
        initial_title = page.locator("#controlCenterPlayTitle").text_content().strip()
        assert initial_title == "Entra nell’Arena", repr(initial_title)

        page.locator("#arenaLanguageSelect").select_option("en")
        page.wait_for_function("() => document.documentElement.lang === 'en'")
        page.wait_for_function("() => arenaStorageReadSettings().localization?.language === 'en'")
        assert page.locator("#controlCenterPlayTitle").text_content().strip() == "Enter the Arena"
        assert page.locator("#mainMenuNewGameBtn strong").text_content().strip() == "New game"
        assert page.locator("#mainMenuResumeBtn small").text_content().strip() == "No active session"
        page.wait_for_function("() => document.querySelector('#mainMenuLocalSummary').textContent.includes('local decks')")
        assert page.locator("#controlCenterLastMatch").text_content().strip() == "No matches"
        page.wait_for_function("() => document.querySelector('#controlCenterDiagnosticErrors').textContent.trim() !== 'Checking…'")
        diagnostic_label = page.locator("#controlCenterDiagnosticErrors").text_content().strip()
        assert diagnostic_label == "No errors" or diagnostic_label.endswith(" errors"), diagnostic_label
        no_horizontal_overflow(page, "#mainMenuScreen")

        splash = page.locator("#splashEnterBtn")
        if splash.count() and splash.is_visible():
            splash.click()
        page.locator("#mainMenuNewGameBtn").click()
        page.wait_for_function("() => document.body.dataset.appScreen === 'setup'")
        assert page.locator("#setupScreen .mainMenuKicker").text_content().strip() == "New game"
        assert page.locator("#setupScreen .setupPlayerBox h3").first.text_content().strip() == "Player 1"
        assert page.locator('label[for="setupP1Faction"]').text_content().strip() == "Faction"
        assert page.locator('label[for="setupP1Commander"]').text_content().strip() == "Commander"
        assert page.locator('label[for="setupGameScaleMode"]').text_content().strip() == "Game scale"
        assert page.locator("#setupStartGameBtn").text_content().strip() == "Start game"
        assert "-player FFA" in page.locator("#setupMapMeta").text_content()
        assert "Automatic Starter Deck" in page.locator("#setupP1DeckInfo").text_content()
        unresolved = page.eval_on_selector_all(
            "#mainMenuScreen [data-i18n], #setupScreen [data-i18n]",
            "elements => elements.map(element => element.textContent.trim()).filter(text => /^(menu|setup|language)\\./.test(text) || /\\{[A-Za-z]/.test(text))",
        )
        assert unresolved == [], unresolved
        no_horizontal_overflow(page, "#setupScreen")

        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("() => typeof ArenaI18n === 'object' && ArenaI18n.diagnostics().status === 'ready'")
        assert page.get_attribute("html", "lang") == "en"
        assert page.locator("#arenaLanguageSelect").input_value() == "en"
        assert page.locator("#controlCenterPlayTitle").text_content().strip() == "Enter the Arena"

        page.set_viewport_size({"width": 760, "height": 900})
        no_horizontal_overflow(page, "#mainMenuScreen")
        page.locator("#arenaLanguageSelect").select_option("it")
        page.wait_for_function("() => document.documentElement.lang === 'it'")
        assert page.locator("#controlCenterPlayTitle").text_content().strip() == "Entra nell’Arena"
        assert not errors, errors

        context.close()
        browser.close()

    print("S2-C5b2 browser shell/setup localization smoke: 25/25 OK")


if __name__ == "__main__":
    main()
