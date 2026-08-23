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
MAP_ID = "map10_snow_bf_4pl_3x"


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
        raise SystemExit("F9W2a1 browser smoke richiede il checkout completo, non il solo overwrite ZIP.")

    with local_server(ROOT) as url, sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        errors: list[str] = []
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        page.goto(url, wait_until="domcontentloaded")
        page.wait_for_function("() => typeof getMapDefinitionById === 'function' && typeof arenaInstallOfficialSnowMapF9W2a1 === 'function'")

        definition = page.evaluate(f"getMapDefinitionById('{MAP_ID}')")
        assert definition["official"] is True
        assert definition["editable"] is False
        assert definition["playerCount"] == 4
        assert definition["movementMultiplier"] == 3
        assert len(definition["geometry"]["cells"]) == 349
        assert len(definition["strategicPoints"]) == 13
        assert len(definition["initialHazards"]) == 4

        validation = page.evaluate(f"validateMapDefinition(getMapDefinitionById('{MAP_ID}'))")
        assert validation["valid"] is True, validation
        assert validation["errors"] == [], validation

        builtin_ids = page.evaluate("getBuiltinMapDefinitions().map(m => m.id)")
        assert builtin_ids.count(MAP_ID) == 1, builtin_ids

        asset_ok = page.evaluate(f"fetch(getMapDefinitionById('{MAP_ID}').presentation.backgroundAssetPath).then(r => r.ok)")
        assert asset_ok is True

        page.evaluate("openNewGameSetupScreen()")
        page.wait_for_timeout(50)
        assert page.locator(f"#setupMapName option[value='{MAP_ID}']").count() == 1

        # Official Standard/Classic must remain available in Distribution.
        page.evaluate("arenaProductProfileSetF9W2a('distribution', {persist:false})")
        page.evaluate("refreshSetupMapSelector()")
        page.wait_for_timeout(50)
        assert page.locator(f"#setupMapName option[value='{MAP_ID}']").count() == 1

        assert not errors, f"Browser page errors: {errors}"
        browser.close()

    print("F9W2a1 Snow BF browser smoke: PASS")


if __name__ == "__main__":
    main()
