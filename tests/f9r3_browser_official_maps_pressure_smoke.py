from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import re

ROOT = Path(__file__).resolve().parents[1]
errors = []
console_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        executable_path="/usr/bin/chromium",
        args=["--no-sandbox", "--allow-file-access-from-files"],
    )
    context = browser.new_context(viewport={"width": 1280, "height": 820})
    page = context.new_page()
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    scripts = re.findall(r'<script\s+src="([^"]+)"\s*></script>', index)
    html = re.sub(r'<script\s+src="[^"]+"\s*></script>', '', index)
    html = re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>', '', html)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    renderer_css = ROOT / "css/renderer_calibration_lab.css"
    if renderer_css.exists():
        page.add_style_tag(path=str(renderer_css))
    for rel in scripts:
        page.add_script_tag(path=str(ROOT / rel))
    page.wait_for_function("typeof BUILD_INFO !== 'undefined' && typeof getAvailableMapDefinitions === 'function'")
    page.evaluate("refreshSetupMapSelector('map1_starter')")
    page.wait_for_timeout(150)

    result = page.evaluate("""async () => {
      const expected = [
        ['map1_starter','Campo Starter',2,3,[0,0,0],'ps-center'],
        ['custom_single_ms0nf51r','Diamond 4',4,9,[0,0,0],'ps-center'],
        ['map1_starter_copy','Claustro Clash',4,7,[0,0,0],'ps-center'],
        ['custom_double_ms0ra3ds','Narrow Path',2,4,[0,-4,4],'ps-center'],
        ['map3_quadrivium_copy','Triple Battlefield',4,7,[2,3,-5],'ps-center'],
        ['custom_double_ms0cunhu','The Valley',3,7,[2,0,-2],'ps-center'],
        ['custom_triple_ms3r4ifn','Central hotspot',3,8,[0,-3,3],'ps-center-2'],
        ['custom_double_ms3ppdyc','Plains 2G large',2,7,[0,5,-5],'ps-center-2'],
        ['custom_triple_ms3s2abv','La Trappola',4,7,[0,0,0],'ps-center']
      ];
      const maps = getAvailableMapDefinitions();
      const summaries = maps.map(map => {
        const center = getCentralStrategicPoint(map);
        const validation = validateMapDefinition(map);
        return {
          id:map.id,
          name:map.name,
          players:map.playerCount,
          ps:map.strategicPoints.length,
          center:center ? center.coord : null,
          centerId:center ? center.id : null,
          distances:centralStrategicPointLinearDistances(map).map(item => item.distance),
          valid:validation.valid,
          errors:validation.errors
        };
      });
      const selector = [...document.getElementById('setupMapName').options].map(option => ({value:option.value,text:option.textContent}));

      const oldState = state;
      function profileFor(mapId, pacePreset) {
        const map = getMapDefinitionById(mapId);
        state = {
          mapId:map.id,
          mapDefinition:map,
          pacePreset,
          players:Array.from({length:map.playerCount},(_,index)=>({id:index+1,eliminated:false})),
          playerIds:Array.from({length:map.playerCount},(_,index)=>index+1),
          cells:map.strategicPoints.map(ps=>({coord:[...ps.coord],ps:true,control:null})),
          units:[], pressure:{}, energy:{}, psLocks:[]
        };
        const profile = pressureRuleProfile();
        return {
          mapId,
          pacePreset,
          scale:profile.scale,
          startRound:profile.startRound,
          pressureWin:profile.pressureWin,
          maxRound:profile.maxRound,
          requiredPs:profile.requiredPs,
          totalPs:profile.totalPs,
          center:profile.centralCoord
        };
      }
      const profiles = [
        profileFor('map1_starter','competitive'),
        profileFor('map1_starter','standard'),
        profileFor('custom_single_ms0nf51r','competitive'),
        profileFor('custom_single_ms0nf51r','standard'),
        profileFor('map3_quadrivium_copy','competitive'),
        profileFor('map3_quadrivium_copy','standard'),
        profileFor('custom_double_ms0cunhu','standard')
      ];
      state = oldState;

      const backgroundChecks = {};
      for (const [mapId, filename] of [
        ['custom_double_ms0ra3ds','f9r3_narrow_path_desertcenter.webp'],
        ['custom_triple_ms3r4ifn','map-bg-custom_triple_ms3r4ifn-ruins_webp-ms3rwq9c.webp'],
        ['custom_double_ms3ppdyc','map-bg-custom_double_ms3ppdyc-plains_webp-ms3qzmsc.webp'],
        ['custom_triple_ms3s2abv','map-bg-custom_triple_ms3s2abv-trap_webp-ms3skg6o.webp']
      ]) {
        const map = getMapDefinitionById(mapId);
        const resolved = await mapBackgroundResolveSource(map.presentation);
        backgroundChecks[mapId] = {
          resolved,
          ok:Boolean(resolved.ok && resolved.mode === 'static' && resolved.src.includes(filename))
        };
      }
      return {build:BUILD_INFO.version, expected, summaries, selector, profiles, backgroundChecks};
    }""")
    browser.close()

assert result["build"].startswith("C2-STABLE-1-F9"), result
assert len(result["summaries"]) == 9, result
assert len(result["selector"]) == 9, result
assert [entry["id"] for entry in result["summaries"]] == [item[0] for item in result["expected"]], result
for summary, expected in zip(result["summaries"], result["expected"]):
    assert summary["name"] == expected[1], (summary, expected)
    assert summary["players"] == expected[2], (summary, expected)
    assert summary["ps"] == expected[3], (summary, expected)
    assert summary["center"] == expected[4], (summary, expected)
    assert summary["centerId"] == expected[5], (summary, expected)
    assert summary["valid"] and not summary["errors"], summary
    assert len(set(summary["distances"])) == 1, summary

profiles = {(item["mapId"], item["pacePreset"]): item for item in result["profiles"]}
assert profiles[("map1_starter", "competitive")] == {
    "mapId":"map1_starter", "pacePreset":"competitive", "scale":3, "startRound":20,
    "pressureWin":5, "maxRound":33, "requiredPs":2, "totalPs":3, "center":[0,0,0]
}, profiles
assert profiles[("map1_starter", "standard")]["startRound"] == 23
assert profiles[("map1_starter", "standard")]["pressureWin"] == 7
assert profiles[("map1_starter", "standard")]["maxRound"] == 50
assert profiles[("custom_single_ms0nf51r", "competitive")]["scale"] == 7
assert profiles[("custom_single_ms0nf51r", "competitive")]["maxRound"] == 37
assert profiles[("custom_single_ms0nf51r", "competitive")]["requiredPs"] == 5
assert profiles[("custom_single_ms0nf51r", "standard")]["startRound"] == 27
assert profiles[("map3_quadrivium_copy", "competitive")]["maxRound"] == 36
assert profiles[("map3_quadrivium_copy", "standard")]["startRound"] == 26
assert profiles[("custom_double_ms0cunhu", "standard")]["startRound"] == 25
assert all(item["ok"] for item in result["backgroundChecks"].values()), result["backgroundChecks"]
assert not errors, errors
assert not console_errors, console_errors

print(json.dumps({"ok": True, **result, "pageErrors": errors, "consoleErrors": console_errors}, ensure_ascii=False, indent=2))
