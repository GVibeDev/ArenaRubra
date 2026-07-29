from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT = Path(__file__).resolve().parents[1]
errors = []
console_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        executable_path="/usr/bin/chromium",
        args=["--no-sandbox", "--allow-file-access-from-files"],
    )
    context = browser.new_context(viewport={"width": 1365, "height": 900})
    page = context.new_page()
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    import re
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
      window.__deckStoreForTest = {};
      window.arenaStorageReadCustomDecks = () => ({ ...window.__deckStoreForTest });
      window.arenaStorageWriteCustomDecks = store => {
        window.__deckStoreForTest = JSON.parse(JSON.stringify(store || {}));
        return true;
      };
      initializeArenaAppShell();
    }""")

    result = page.evaluate("""() => {
      const sourceKey = 'Nexus::NXCMD01::bastione-mobile';
      const source = JSON.parse(JSON.stringify(BUILTIN_DECKS[sourceKey]));
      const alternateKey = 'Nexus::NXCMD02::unita-comando-test-pivot';
      source.key = alternateKey;
      source.baseKey = 'Nexus::NXCMD02';
      source.deckName = 'Nexus · Unità Comando · Test Pivot';
      source.name = source.deckName;
      source.commanderId = 'NXCMD02';
      source.commanderName = 'Unità Comando';
      source.builtIn = false;
      source.immutable = false;
      source.savedAt = '2026-07-28T00:00:00.000Z';
      source.deckIds = source.deckIds.map(id => id === 'UNIT:NXCMD01' ? 'UNIT:NXCMD02' : id);
      arenaStorageWriteCustomDecks({ [alternateKey]: source });

      writeControlValue('setupP1Faction', 'Nexus');
      populateSetupCommanderSelectForSide(1);
      writeControlValue('setupP1Commander', 'NXCMD01');
      writeControlValue('setupP1DeckMode', 'custom');
      refreshSetupDeckSelectorForSide(1);

      const select = document.getElementById('setupP1DeckSavedKey');
      const initialOptions = [...select.options].map(option => ({ value: option.value, text: option.textContent }));
      select.value = alternateKey;
      select.dispatchEvent(new Event('change', { bubbles: true }));

      const alternateInfo = setupDeckInfoForSide(1);
      const alternateCommander = document.getElementById('setupP1Commander').value;
      const commanderDisabledInCustom = document.getElementById('setupP1Commander').disabled;
      const validation = validateSetupDeckSelectionsBeforeStart();
      syncLegacyControlsFromSetupScreen();
      const setup = readGameSetupFromDom();

      select.value = sourceKey;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      const builtinInfo = setupDeckInfoForSide(1);
      const builtinCommander = document.getElementById('setupP1Commander').value;

      writeControlValue('setupP1DeckMode', 'template');
      refreshSetupDeckSelectorForSide(1);
      const commanderEnabledInTemplate = !document.getElementById('setupP1Commander').disabled;

      return {
        build: BUILD_INFO.version,
        optionCount: initialOptions.length,
        optionKeys: initialOptions.map(item => item.value),
        optionTexts: initialOptions.map(item => item.text),
        alternateCommander,
        commanderDisabledInCustom,
        alternateSavedKey: alternateInfo.savedKey,
        alternateCheckOk: Boolean(alternateInfo.check && alternateInfo.check.ok),
        alternateCheckIssues: alternateInfo.check ? alternateInfo.check.issues : [],
        validation,
        setupSelectedDeck: setup.selectedDecks[1],
        setupCommander: setup.selectedCommanders[1],
        builtinCommander,
        builtinSavedKey: builtinInfo.savedKey,
        builtinCheckOk: Boolean(builtinInfo.check && builtinInfo.check.ok),
        commanderEnabledInTemplate
      };
    }""")
    browser.close()

assert result["build"].startswith("C2-STABLE-1-F9"), result
assert result["optionCount"] >= 2, result
assert "Nexus::NXCMD01::bastione-mobile" in result["optionKeys"], result
assert "Nexus::NXCMD02::unita-comando-test-pivot" in result["optionKeys"], result
assert result["alternateCommander"] == "NXCMD02", result
assert result["commanderDisabledInCustom"], result
assert result["alternateSavedKey"] == "Nexus::NXCMD02::unita-comando-test-pivot", result
assert result["alternateCheckOk"], result
assert result["validation"]["ok"], result
assert result["setupSelectedDeck"] == {"mode": "custom", "savedKey": "Nexus::NXCMD02::unita-comando-test-pivot"}, result
assert result["setupCommander"] == "NXCMD02", result
assert result["builtinCommander"] == "NXCMD01", result
assert result["builtinSavedKey"] == "Nexus::NXCMD01::bastione-mobile", result
assert result["builtinCheckOk"], result
assert result["commanderEnabledInTemplate"], result
assert not errors, errors
assert not console_errors, console_errors

print(json.dumps({"ok": True, **result, "pageErrors": errors, "consoleErrors": console_errors}, ensure_ascii=False, indent=2))
