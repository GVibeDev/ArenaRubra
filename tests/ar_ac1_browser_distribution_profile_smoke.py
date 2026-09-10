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

SOURCE_ROOT=Path(__file__).resolve().parents[1]
ROOT=Path(os.environ.get("ARENA_BROWSER_ROOT",SOURCE_ROOT)).resolve()
PROFILE_QUERY=os.environ.get("ARENA_BROWSER_PROFILE_QUERY","?profile=distribution")
DEV_ONLY=[
    "src/renderer_calibration_lab.js","src/menu_layout_calibration_lab.js","src/card_editor.js","src/map_editor.js",
    "src/expert_ai/expert_common_strategy.js","src/expert_ai/expert_nexus.js","src/expert_ai/expert_exordium.js",
    "src/expert_ai/expert_liberti.js","src/expert_ai/expert_agathoi.js","src/expert_ai/expert_fabeot.js",
    "src/expert_ai/expert_router.js","src/expert_ai/expert_runtime.js"
]

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_args): pass

@contextlib.contextmanager
def server():
    with socket.socket() as probe:
        probe.bind(("127.0.0.1",0));port=probe.getsockname()[1]
    cwd=os.getcwd();os.chdir(ROOT)
    try:
        with socketserver.TCPServer(("127.0.0.1",port),QuietHandler) as httpd:
            thread=threading.Thread(target=httpd.serve_forever,daemon=True);thread.start()
            yield f"http://127.0.0.1:{port}/index.html{PROFILE_QUERY}"
            httpd.shutdown();thread.join(timeout=2)
    finally: os.chdir(cwd)

def main():
    with server() as url,sync_playwright() as p:
        browser=p.chromium.launch(**chromium_launch_options())
        page=browser.new_page(viewport={"width":1440,"height":960})
        errors=[];requests=[]
        page.on("pageerror",lambda exc:errors.append(str(exc)))
        page.on("request",lambda request:requests.append(request.url))
        page.goto(url,wait_until="domcontentloaded")
        page.wait_for_function("() => typeof arenaProductProfileSnapshotF9W2a === 'function'")
        page.wait_for_function("() => document.documentElement.dataset.arenaProductProfile === 'distribution'")
        diagnostics=page.evaluate("ArenaRuntimeProfile.diagnostics()")
        assert diagnostics["profile"]=="distribution",diagnostics
        assert diagnostics["loaded"]==[],diagnostics
        for module in DEV_ONLY:
            assert not any(request.endswith("/"+module) for request in requests),module
        assert page.evaluate("typeof cardEditorState") == "undefined"
        assert page.evaluate("typeof mapEditorState") == "undefined"
        assert page.evaluate("typeof expertAiRuntimeStateF9T1") == "undefined"
        assert page.evaluate("typeof GameCore === 'object'") is True
        assert page.evaluate("GameCore.actionTypes()") == ["ability","attack","build","deploy","end_turn","move","tactic"]
        splash=page.locator("#splashEnterBtn")
        if splash.count() and splash.is_visible(): splash.click()
        assert page.locator("#mainMenuNewGameBtn").is_visible()
        card_controls=page.eval_on_selector_all("[data-app-open-card-editor]","els => els.map(el => ({hidden:el.hidden,display:getComputedStyle(el).display,rects:el.getClientRects().length}))")
        map_controls=page.eval_on_selector_all("[data-app-open-map-editor]","els => els.map(el => ({hidden:el.hidden,display:getComputedStyle(el).display,rects:el.getClientRects().length}))")
        assert all(item["hidden"] and item["rects"] == 0 for item in card_controls),card_controls
        assert all(item["hidden"] and item["rects"] == 0 for item in map_controls),map_controls
        assert not errors,errors
        browser.close()
    print("AR-AC1 Distribution boot/module exclusion smoke: PASS")

if __name__=="__main__": main()
