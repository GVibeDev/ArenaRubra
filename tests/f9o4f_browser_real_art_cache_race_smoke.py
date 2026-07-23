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

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox", "--allow-file-access-from-files"])
    page = browser.new_page(viewport={"width": 900, "height": 600})
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    page.add_style_tag(path=str(ROOT / "css/renderer_calibration_lab.css"))
    for rel in scripts:
        page.add_script_tag(path=str(ROOT / rel))
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.wait_for_timeout(80)

    result = page.evaluate("""() => {
      const makeCanvas = () => {
        const wrap = document.createElement('div');
        wrap.className = 'mapHandVisualCard';
        const canvas = document.createElement('canvas');
        canvas.className = 'handCardThumbCanvas';
        canvas.width = 194;
        canvas.height = 292;
        wrap.appendChild(canvas);
        document.body.appendChild(wrap);
        return canvas;
      };
      const paint = (canvas, value) => {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      };
      const setStatus = (path, status) => {
        if (!path) return;
        cardRendererImageCache[path] = {status, img:null, listeners:[]};
      };

      const card = {
        id:'F9O4F-RACE-REAL', sourceId:'F9O4F-RACE-REAL', name:'Race Real', faction:'Nexus',
        sourceType:'unit', cardType:'unit', cost:1, hp:1, att:1, def:0,
        customArt:{dataUrl:'f9o4f://real-art-pending'}
      };
      const paths = cardRendererPreviewAssetPaths(card);
      setStatus(paths.realArt[0], 'loading');
      setStatus(paths.placeholder[0], 'loaded');
      setStatus(paths.frame[0], 'loaded');

      const first = makeCanvas();
      paint(first, '#aa0000');
      const pendingReady = cardRendererSyncCanvasReadyState(first, card);
      const pendingState = cardRendererPreviewAssetState(card);
      const pendingDiagnostics = cardRendererHandThumbCacheDiagnostics();

      const restoredPending = makeCanvas();
      const pendingRestoreResult = cardRendererRestoreHandThumbnailSnapshot(restoredPending, card);
      const pendingRestore = {
        result: pendingRestoreResult,
        renderState: restoredPending.dataset.cardRenderState || '',
        artState: restoredPending.dataset.cardArtState || '',
        rendered: restoredPending.hasAttribute('data-thumb-rendered'),
        final: restoredPending.dataset.thumbSnapshotFinal || ''
      };

      setStatus(paths.realArt[0], 'loaded');
      paint(first, '#00aa00');
      const realReady = cardRendererSyncCanvasReadyState(first, card);
      const realState = cardRendererPreviewAssetState(card);
      const realDiagnostics = cardRendererHandThumbCacheDiagnostics();

      const restoredReal = makeCanvas();
      const realRestoreResult = cardRendererRestoreHandThumbnailSnapshot(restoredReal, card);
      const realRestore = {
        result: realRestoreResult,
        renderState: restoredReal.dataset.cardRenderState || '',
        artState: restoredReal.dataset.cardArtState || '',
        rendered: restoredReal.hasAttribute('data-thumb-rendered'),
        final: restoredReal.dataset.thumbSnapshotFinal || ''
      };

      const fallbackCard = {
        id:'F9O4F-RACE-FALLBACK', sourceId:'F9O4F-RACE-FALLBACK', name:'Race Fallback', faction:'Nexus',
        sourceType:'unit', cardType:'unit', cost:1, hp:1, att:1, def:0,
        customArt:{dataUrl:'f9o4f://real-art-error'}
      };
      const fallbackPaths = cardRendererPreviewAssetPaths(fallbackCard);
      setStatus(fallbackPaths.realArt[0], 'error');
      setStatus(fallbackPaths.placeholder[0], 'loaded');
      setStatus(fallbackPaths.frame[0], 'loaded');
      const fallbackCanvas = makeCanvas();
      paint(fallbackCanvas, '#0000aa');
      const fallbackReady = cardRendererSyncCanvasReadyState(fallbackCanvas, fallbackCard);
      const fallbackState = cardRendererPreviewAssetState(fallbackCard);

      return {
        build: BUILD_INFO.version,
        pendingReady, pendingState, pendingDiagnostics, pendingRestore,
        realReady, realState, realDiagnostics, realRestore,
        fallbackReady, fallbackState
      };
    }""")
    browser.close()

ignored_prefix = "Arena AppShell: inizializzazione GameScreen non bloccante fallita"
unexpected_console_errors = [msg for msg in console_errors if not msg.startswith(ignored_prefix)]
print(json.dumps({"result":result,"pageErrors":page_errors,"consoleErrors":unexpected_console_errors}, ensure_ascii=False, indent=2))

assert result["build"] == "C2-STABLE-1-F9O4f-APK-M4c", result
assert result["pendingReady"] is False, result
assert result["pendingState"]["ready"] is False, result
assert result["pendingState"]["realArtState"] == "pending", result
assert result["pendingState"]["placeholderState"] == "loaded", result
assert result["pendingState"]["artSource"] == "placeholder", result
assert result["pendingDiagnostics"]["provisional"] >= 1, result
assert result["pendingRestore"] == {"result":"pending","renderState":"pending","artState":"placeholder","rendered":False,"final":"0"}, result
assert result["realReady"] is True, result
assert result["realState"]["ready"] is True and result["realState"]["artSource"] == "real", result
assert result["realDiagnostics"]["final"] >= 1 and result["realDiagnostics"]["realArt"] >= 1, result
assert result["realRestore"] == {"result":"ready","renderState":"ready","artState":"real","rendered":True,"final":"1"}, result
assert result["fallbackReady"] is True, result
assert result["fallbackState"]["ready"] is True and result["fallbackState"]["artSource"] == "placeholder", result
assert not page_errors, page_errors
assert not unexpected_console_errors, unexpected_console_errors
