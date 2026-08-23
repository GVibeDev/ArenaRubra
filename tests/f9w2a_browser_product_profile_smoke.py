from __future__ import annotations

import contextlib
import http.server
import os
import socket
import socketserver
import threading
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return int(s.getsockname()[1])


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


@contextlib.contextmanager
def local_server(root: Path):
    port = free_port()
    cwd = os.getcwd()
    os.chdir(root)
    try:
        with socketserver.TCPServer(("127.0.0.1", port), QuietHandler) as httpd:
            thread = threading.Thread(target=httpd.serve_forever, daemon=True)
            thread.start()
            yield f"http://127.0.0.1:{port}/index.html"
            httpd.shutdown()
            thread.join(timeout=2)
    finally:
        os.chdir(cwd)


def hidden(page, selector: str) -> bool:
    return bool(page.eval_on_selector(selector, "el => el.hidden || getComputedStyle(el).display === 'none'"))


def main() -> None:
    if not (ROOT / "index.html").exists():
        raise SystemExit("F9W2a browser smoke richiede il checkout completo (index.html + asset), non il solo overwrite ZIP.")

    with local_server(ROOT) as url, sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        errors: list[str] = []
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        page.goto(url, wait_until="domcontentloaded")
        page.wait_for_function("() => typeof window.arenaProductProfileSnapshotF9W2a === 'function'")
        page.wait_for_function("() => document.documentElement.dataset.arenaProductProfile === 'dev'")

        splash = page.locator("#splashEnterBtn")
        if splash.count() and splash.is_visible():
            splash.click()

        snap = page.evaluate("arenaProductProfileSnapshotF9W2a()")
        assert snap["profile"] == "dev", snap
        assert snap["capabilities"]["cardEditor"] is True
        assert snap["capabilities"]["calibration"] is True
        assert not hidden(page, "[data-app-open-card-editor]")
        assert not hidden(page, "[data-app-open-map-editor]")
        assert not hidden(page, "#mainMenuTelemetryBtn")
        assert not hidden(page, "#mainMenuLogBtn")
        assert not hidden(page, "#mainMenuOptionsBtn")

        # Keep a naturally closed popover closed across profile roundtrip.
        assert page.eval_on_selector("#gameDebugMenu", "el => el.hidden") is True

        page.evaluate("arenaProductProfileSetF9W2a('distribution', {persist:false})")
        page.wait_for_function("() => document.documentElement.dataset.arenaProductProfile === 'distribution'")
        page.wait_for_timeout(50)

        snap = page.evaluate("arenaProductProfileSnapshotF9W2a()")
        assert snap["profile"] == "distribution", snap
        for cap in ["play", "tutorial", "deckBuilder", "cardPool", "playerStatistics", "playerHistory", "settings", "version"]:
            assert snap["capabilities"][cap] is True, cap
        for cap in ["cardEditor", "mapEditor", "rawTelemetry", "rawLog", "debug", "calibration", "expertAi", "fullVaultTransfer", "customMaps"]:
            assert snap["capabilities"][cap] is False, cap

        # Public/player surface remains.
        for selector in [
            "#mainMenuNewGameBtn", "#mainMenuTutorialBtn", "[data-app-open-deck-builder]",
            "[data-app-open-card-pool]", "#mainMenuStatsBtn", "#mainMenuHistoryBtn", "#mainMenuSettingsBtn"
        ]:
            assert not hidden(page, selector), selector

        # DEV-only surface disappears.
        for selector in [
            "[data-app-open-card-editor]", "[data-app-open-map-editor]", "#mainMenuTelemetryBtn",
            "#mainMenuLogBtn", "#mainMenuOptionsBtn", "#mainMenuTransferBtn", "#gameDebugHeaderBtn",
            "#gameDebugBtn", "#logDock", "#cardPoolDebugDetails"
        ]:
            assert hidden(page, selector), selector

        assert page.eval_on_selector("#setupBotAiMode option[value='expert']", "el => el.hidden && el.disabled") is True
        assert page.eval_on_selector("#botAiMode option[value='expert']", "el => el.hidden && el.disabled") is True

        # Direct entrypoints are guarded, not merely hidden.
        assert page.evaluate("openCardEditorScreen()") is False
        assert page.evaluate("openMapEditorScreen('map1_starter')") is False
        assert page.evaluate("openMenuLayoutCalibrationLabScreen({sourceScreen:'mainMenu'})") is False
        assert page.evaluate("controlCenterOpenPanel('telemetry')") is False
        assert page.evaluate("controlCenterOpenPanel('log')") is False
        assert page.evaluate("controlCenterOpenPanel('debug')") is False
        assert page.evaluate("controlCenterOpenPanel('statistics')") is True
        page.evaluate("controlCenterClosePanel()")

        page.evaluate("setAppScreen('cardEditor')")
        assert page.evaluate("currentAppScreen()") == "mainMenu"

        # Result modal keeps player Statistics, but removes raw Log/Telemetry.
        page.evaluate("arenaResultModalShowF9V3a({kind:'victory',title:'VITTORIA',subject:'QA',detail:'QA',analysisAllowed:true,primaryAction:'new-game'})")
        page.wait_for_timeout(50)
        assert hidden(page, "[data-result-action='log']")
        assert hidden(page, "[data-result-action='telemetry']")
        assert not hidden(page, "[data-result-action='statistics']")
        page.evaluate("arenaResultModalResolveF9V3c('qa')")

        # Return to DEV: controls return, but a menu that was closed stays closed.
        page.evaluate("arenaProductProfileSetF9W2a('dev', {persist:false})")
        page.wait_for_function("() => document.documentElement.dataset.arenaProductProfile === 'dev'")
        page.wait_for_timeout(50)
        assert not hidden(page, "[data-app-open-card-editor]")
        assert not hidden(page, "[data-app-open-map-editor]")
        assert not hidden(page, "#mainMenuTelemetryBtn")
        assert page.eval_on_selector("#gameDebugMenu", "el => el.hidden") is True

        # DEV debug must expose both permanent calibration labs.
        assert page.evaluate("controlCenterOpenPanel('debug')") is True
        page.wait_for_timeout(20)
        assert page.locator("[data-control-center-action='open-layout-lab']").count() == 1
        assert page.locator("[data-control-center-action='open-renderer-lab']").count() == 1
        page.evaluate("controlCenterClosePanel()")

        assert not errors, f"Browser page errors: {errors}"
        browser.close()

    print("F9W2a browser product profile smoke: PASS")


if __name__ == "__main__":
    main()
