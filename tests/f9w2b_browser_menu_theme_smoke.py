from __future__ import annotations
import contextlib
import http.server
import os
import socket
import socketserver
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
THEMES = [
    "rubra_classic",
    "nexus_basalt",
    "exordium_imperium",
    "liberti_sine_vinculis",
    "agathoi_kleos",
    "fabeot_vesper",
]


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


def main() -> None:
    if not (ROOT / "index.html").exists():
        raise SystemExit("F9W2b browser smoke richiede il checkout completo, non il solo overwrite ZIP.")

    with local_server(ROOT) as url, sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        errors: list[str] = []
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        page.goto(url, wait_until="domcontentloaded")
        page.wait_for_function("() => typeof arenaMenuThemeSnapshotF9W2b === 'function' && typeof arenaProductProfileSetF9W2a === 'function'")

        snapshot = page.evaluate("arenaMenuThemeSnapshotF9W2b()")
        assert snapshot["key"] == "rubra_classic", snapshot
        assert snapshot["available"] == THEMES, snapshot
        assert page.evaluate("document.documentElement.dataset.arenaMenuTheme") == "rubra_classic"

        page.evaluate("controlCenterOpenPanel('settings')")
        page.wait_for_timeout(50)
        select = page.locator("#arenaMenuThemeSelectF9W2b")
        assert select.count() == 1
        assert select.locator("option").count() == 6

        # Live preview for every preset.
        for key in THEMES:
            page.evaluate(f"arenaMenuThemeApplyF9W2b('{key}', {{persist:false}})")
            assert page.evaluate("document.documentElement.dataset.arenaMenuTheme") == key
            assert page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--arena-menu-accent').trim()")

        # Persistence survives reload.
        page.evaluate("arenaMenuThemeApplyF9W2b('fabeot_vesper', {persist:true})")
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("() => typeof arenaMenuThemeSnapshotF9W2b === 'function'")
        assert page.evaluate("arenaMenuThemeCurrentF9W2b()") == "fabeot_vesper"
        assert page.evaluate("document.documentElement.dataset.arenaMenuTheme") == "fabeot_vesper"

        # Theme choice remains a Player/Distribution setting, not a DEV-only tool.
        page.evaluate("arenaProductProfileSetF9W2a('distribution', {persist:false})")
        page.evaluate("controlCenterOpenPanel('settings')")
        page.wait_for_timeout(50)
        assert page.locator("#arenaMenuThemeSelectF9W2b").count() == 1
        assert page.locator("#arenaMenuThemeSelectF9W2b").is_visible()

        style_text = page.evaluate("document.getElementById('arenaMenuThemeStylesF9W2b').textContent")
        assert ".mainMenuScreen" in style_text
        assert ".controlCenterPanelSheet" in style_text
        assert ".gameScreen" not in style_text
        assert "#board" not in style_text

        assert not errors, f"Browser page errors: {errors}"
        browser.close()

    print("F9W2b Menu Theme browser smoke: PASS")


if __name__ == "__main__":
    main()
