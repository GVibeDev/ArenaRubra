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
    page = browser.new_page(viewport={"width": 1365, "height": 900})
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

    index = (ROOT / "index.html").read_text(encoding="utf-8")
    scripts = re.findall(r'<script\s+src="([^"]+)"\s*></script>', index)
    html = re.sub(r'<script\s+src="[^"]+"\s*></script>', '', index)
    html = re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>', '', html)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    for rel in scripts:
        page.add_script_tag(path=str(ROOT / rel))

    page.wait_for_function("typeof BUILD_INFO !== 'undefined' && typeof refreshSetupDeckSelectorForSide === 'function' && typeof BUILTIN_DECKS !== 'undefined'")
    page.evaluate("""() => {
      window.arenaStorageReadCustomDecks = () => ({});
      window.arenaStorageWriteCustomDecks = () => true;
      initializeArenaAppShell();
      const splash = document.getElementById('appSplash');
      if (splash) { splash.style.display = 'none'; splash.style.pointerEvents = 'none'; }
    }""")

    result = page.evaluate("""() => {
      const factions = ["Nexus", "Exordium", "Liberti", "Agathoi", "Fabeot"];
      const rows = [];
      const factionCounts = {};
      const commanderCounts = {};
      for (const faction of factions) {
        writeControlValue('setupP1Faction', faction);
        populateSetupCommanderSelectForSide(1);
        writeControlValue('setupP1DeckMode', 'custom');
        refreshSetupDeckSelectorForSide(1);
        const select = document.getElementById('setupP1DeckSavedKey');
        const keys = [...select.options].map(option => option.value).filter(Boolean);
        factionCounts[faction] = keys.length;
        for (const key of keys) {
          select.value = key;
          select.dispatchEvent(new Event('change', { bubbles:true }));
          const info = setupDeckInfoForSide(1);
          const payload = BUILTIN_DECKS[key];
          const commander = document.getElementById('setupP1Commander').value;
          const commanderKey = `${faction}::${commander}`;
          commanderCounts[commanderKey] = (commanderCounts[commanderKey] || 0) + 1;
          rows.push({
            faction,
            key,
            deckName: payload && payload.deckName,
            commander,
            expectedCommander: payload && payload.commanderId,
            ok: Boolean(info && info.check && info.check.ok),
            issues: info && info.check ? info.check.issues : ["check assente"],
            countedDeckSize: info && info.check ? info.check.countedDeckSize : -1,
            runtimeMissionCopies: info && info.check ? info.check.runtimeMissionCopies : -1,
            savedKey: info && info.savedKey
          });
        }
      }
      return {
        build: BUILD_INFO.version,
        builtInCount: Object.keys(BUILTIN_DECKS).length,
        rows,
        factionCounts,
        commanderCounts,
        legacyPresent: [
          'Nexus::NXCMD01::nexus-avatex-ufficiale',
          'Exordium::EX0B00::varran-default',
          'Liberti::LXCMD02::pravus-default'
        ].some(key => Object.prototype.hasOwnProperty.call(BUILTIN_DECKS, key))
      };
    }""")
    browser.close()

assert result["build"] == "C2-STABLE-1-F9U2b-APK-M4c", result
assert result["builtInCount"] == 50, result
assert len(result["rows"]) == 50, result
assert result["factionCounts"] == {"Nexus": 10, "Exordium": 10, "Liberti": 10, "Agathoi": 10, "Fabeot": 10}, result
assert len(result["commanderCounts"]) == 10, result
assert all(count == 5 for count in result["commanderCounts"].values()), result
assert not result["legacyPresent"], result
for row in result["rows"]:
    assert row["ok"], row
    assert row["countedDeckSize"] == 30, row
    assert row["commander"] == row["expectedCommander"], row
    assert row["savedKey"] == row["key"], row
    assert row["runtimeMissionCopies"] in (0, 1), row
assert sum(row["runtimeMissionCopies"] for row in result["rows"]) == 10, result
assert not errors, errors
assert not console_errors, console_errors

print(json.dumps({
    "ok": True,
    "build": result["build"],
    "builtInCount": result["builtInCount"],
    "validatedSetupDecks": len(result["rows"]),
    "factionCounts": result["factionCounts"],
    "commanderCounts": result["commanderCounts"],
    "missionDecks": sum(row["runtimeMissionCopies"] for row in result["rows"]),
    "legacyPresent": result["legacyPresent"],
    "pageErrors": errors,
    "consoleErrors": console_errors
}, ensure_ascii=False, indent=2))
