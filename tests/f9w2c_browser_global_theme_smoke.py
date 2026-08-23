"""F9W2c browser E2E smoke.

Richiede checkout completo Arena Rubra e Playwright. Non viene eseguito dal solo
pacchetto overwrite perché index.html/css/assets restano nella baseline.
"""
from __future__ import annotations

import argparse
import contextlib
import http.server
import socketserver
import threading
import time
from pathlib import Path


def serve(root: Path, port: int):
    handler = lambda *a, **kw: http.server.SimpleHTTPRequestHandler(*a, directory=str(root), **kw)
    server = socketserver.TCPServer(("127.0.0.1", port), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    root = args.root.resolve()
    if not (root / "index.html").exists():
        raise SystemExit("F9W2c browser smoke richiede il checkout completo, non il solo overwrite ZIP.")

    from playwright.sync_api import sync_playwright

    server = serve(root, args.port)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1440, "height": 1000})
            page.goto(f"http://127.0.0.1:{args.port}/index.html", wait_until="networkidle")
            if page.locator("#splashEnterBtn").is_visible():
                page.locator("#splashEnterBtn").click()
            page.wait_for_function("() => typeof arenaUiThemeSnapshotF9W2c === 'function' && typeof arenaMenuThemeApplyF9W2b === 'function'")

            # Global theme must propagate beyond Home.
            page.evaluate("arenaMenuThemeApplyF9W2b('fabeot_vesper', {persist:false})")
            page.locator("#mainMenuNewGameBtn").click()
            page.wait_for_function("() => document.body.classList.contains('app-screen-setup')")
            snap = page.evaluate("arenaUiThemeSnapshotF9W2c()")
            assert snap["activeTheme"] == "fabeot_vesper"
            assert snap["source"] == "global-selection"
            assert page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--arena-ui-text-primary').trim()")

            # One-human game: Player 1 faction controls UI even if initiative is G2.
            page.select_option("#setupP1Faction", "Nexus")
            page.select_option("#setupP1Mode", "human")
            page.select_option("#setupP2Faction", "Exordium")
            page.select_option("#setupP2Mode", "bot")
            page.select_option("#setupInitiativeMode", "2")
            page.locator("#setupStartGameBtn").click()
            page.wait_for_function("() => document.body.classList.contains('app-screen-game') && typeof state !== 'undefined' && !!state")
            page.evaluate("arenaUiThemeSyncF9W2c({force:true})")
            snap = page.evaluate("arenaUiThemeSnapshotF9W2c()")
            assert snap["activeTheme"] == "nexus_basalt"
            assert snap["activeSide"] == 1
            assert snap["source"] == "player1"
            assert snap["boardPresentationUntouched"] is True

            # Return to shell: persisted/global selection becomes active again.
            page.locator("#returnMainMenuBtn").click()
            page.wait_for_function("() => document.body.classList.contains('app-screen-menu')")
            snap = page.evaluate("arenaUiThemeSnapshotF9W2c()")
            assert snap["activeTheme"] == "fabeot_vesper"
            assert snap["source"] == "global-selection"

            # Dedicated multi-human resolution contract without mutating gameplay.
            synthetic = page.evaluate("""
              (() => {
                const saved = state;
                const app = typeof arenaApp !== 'undefined' ? arenaApp.screen : null;
                state = {
                  playerIds:[1,2,3], currentPlayer:2,
                  players:[
                    {id:1,faction:'Nexus',mode:'human'},
                    {id:2,faction:'Exordium',mode:'human'},
                    {id:3,faction:'Liberti',mode:'bot'}
                  ],
                  factions:{1:'Nexus',2:'Exordium',3:'Liberti'}, modes:{1:'human',2:'human',3:'bot'}
                };
                if (typeof arenaApp !== 'undefined') arenaApp.screen = 'game';
                const human = arenaUiThemeResolveF9W2c();
                state.currentPlayer = 3;
                arenaUiThemeStateF9W2c.lastHumanSide = 2;
                const bot = arenaUiThemeResolveF9W2c();
                state = saved;
                if (typeof arenaApp !== 'undefined' && app) arenaApp.screen = app;
                arenaUiThemeSyncF9W2c({force:true});
                return {human,bot};
              })()
            """)
            assert synthetic["human"]["key"] == "exordium_imperium"
            assert synthetic["human"]["source"] == "active-human"
            assert synthetic["bot"]["key"] == "exordium_imperium"
            assert synthetic["bot"]["source"] == "last-human-during-bot-turn"

            browser.close()
    finally:
        with contextlib.suppress(Exception):
            server.shutdown()
        with contextlib.suppress(Exception):
            server.server_close()
    print("F9W2c Global Theme Scope browser smoke: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
