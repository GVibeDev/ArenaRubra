from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT = Path(__file__).resolve().parents[1]
errors = []
console_errors = []
PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZJ9sAAAAASUVORK5CYII="

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.set_content("""<!doctype html><html><body>
      <div id="boardVisualStack"><div id="mapBgLayer"><img id="mapBgAssetImage" hidden></div></div>
      <select id="mapEditorBackgroundFit"><option value="cover">cover</option><option value="contain">contain</option><option value="native">native</option></select>
      <input id="mapEditorBackgroundOpacity"><output id="mapEditorBackgroundOpacityValue"></output>
      <input id="mapEditorBackgroundScale"><output id="mapEditorBackgroundScaleValue"></output>
      <input id="mapEditorBackgroundOffsetX"><input id="mapEditorBackgroundOffsetY">
      <div id="mapEditorBackgroundStatus"></div><button id="mapEditorBackgroundRemoveBtn"></button>
      <svg id="mapEditorCanvas" viewBox="0 0 1200 800"></svg>
    </body></html>""")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    page.add_script_tag(path=str(ROOT / "src/map_backgrounds.js"))
    page.add_script_tag(path=str(ROOT / "src/map_editor.js"))
    page.evaluate("""(dataUrl) => {
      window.mapRuntimeClone = value => JSON.parse(JSON.stringify(value));
      window.mapRuntimeNormalizeDefinition = value => value;
      window.mapRuntimeSafeText = value => String(value || '');
      window.mapRuntimeSafeId = value => String(value || 'map');
      window.mapRuntimeCellKey = coord => coord.join(',');
      window.terrainDefinition = () => ({name:'Libero', icon:'', visualClass:'terrain-free', blocksMovement:false, movementCost:1, defenseModifier:0});
      window.terrainDefinitions = () => [];
      window.validateMapDefinition = draft => ({valid:true, errors:[], warnings:[], definition:draft, summary:{cellCount:draft.geometry.cells.length, strategicPointCount:0}});
      mapEditorState.draft = {
        presentation:{backgroundInlineDataUrl:dataUrl, backgroundFit:'contain', backgroundOpacity:.66, backgroundScale:1.2, backgroundOffsetX:7, backgroundOffsetY:-5, backgroundName:'browser.png', backgroundWidth:640, backgroundHeight:360},
        geometry:{cells:[{coord:[0,0,0],terrainType:'free',cellRole:'normal'}]},
        metadata:{revision:1}, strategicPoints:[], playerSlots:[]
      };
      mapEditorState.backgroundPreviewUrl = dataUrl;
      mapEditorState.backgroundStatus = 'fallback inline';
      mapEditorSyncBackgroundControls();
      document.getElementById('mapEditorCanvas').innerHTML = '<g>' + mapEditorBackgroundMarkup(mapEditorState.draft.geometry.cells) + '</g>';
    }""", PNG)
    editor = page.evaluate("""() => ({
      image:document.querySelector('.mapEditorBackgroundImage') !== null,
      opacity:document.querySelector('.mapEditorBackgroundImage').getAttribute('opacity'),
      fit:document.getElementById('mapEditorBackgroundFit').value,
      status:document.getElementById('mapEditorBackgroundStatus').textContent
    })""")
    assert editor["image"] and editor["fit"] == "contain" and editor["opacity"] == "0.66", editor

    page.evaluate("""(dataUrl) => mapBackgroundApplyForMap({presentation:{
      backgroundInlineDataUrl:dataUrl,
      backgroundFit:'cover', backgroundOpacity:.7, backgroundScale:1.1,
      backgroundOffsetX:3, backgroundOffsetY:-2
    }})""", PNG)
    page.wait_for_function("document.getElementById('mapBgAssetImage').classList.contains('loaded') && !document.getElementById('mapBgAssetImage').hidden")
    runtime = page.evaluate("""() => {
      const img=document.getElementById('mapBgAssetImage');
      return {fit:img.style.objectFit, opacity:img.style.opacity, transform:img.style.transform, mode:document.documentElement.dataset.mapBgMode, loaded:img.classList.contains('loaded'), hidden:img.hidden};
    }""")
    assert runtime["fit"] == "cover" and runtime["opacity"] == "0.7" and runtime["mode"] == "custom" and runtime["loaded"] and not runtime["hidden"], runtime
    browser.close()

print(json.dumps({"ok": True, "editor": editor, "runtime": runtime, "pageErrors": errors, "consoleErrors": console_errors}, ensure_ascii=False, indent=2))
assert not errors, errors
assert not console_errors, console_errors
