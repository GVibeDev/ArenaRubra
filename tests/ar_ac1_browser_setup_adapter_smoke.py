from browser_runtime import assert_valid_build_version, chromium_launch_options
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import re


ROOT = Path(__file__).resolve().parents[1]
page_errors = []
console_errors = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(**chromium_launch_options())
    context = browser.new_context(viewport={"width": 1365, "height": 900})
    page = context.new_page()
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

    index = (ROOT / "index.html").read_text(encoding="utf-8")
    scripts = re.findall(r'<script\s+src="([^"]+)"\s*></script>', index)
    html = re.sub(r'<script\s+src="[^"]+"\s*></script>', "", index)
    html = re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>', "", html)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css" / "style.css"))
    for relative in scripts:
        page.add_script_tag(path=str(ROOT / relative))

    page.wait_for_function(
        "typeof BUILD_INFO !== 'undefined' && typeof ArenaSetupAdapter !== 'undefined' "
        "&& typeof newGame === 'function' && typeof refreshSetupMapSelector === 'function'"
    )
    page.evaluate("initializeArenaAppShell(); refreshSetupMapSelector('map1_starter')")

    result = page.evaluate("""() => {
      const scenarios = [
        {
          mapId: 'map1_starter',
          factions: ['Nexus', 'Exordium'],
          players: 2
        },
        {
          mapId: 'custom_double_ms0cunhu',
          factions: ['Fabeot', 'Nexus', 'Liberti'],
          players: 3
        },
        {
          mapId: 'map1_starter_copy',
          factions: ['Agathoi', 'Fabeot', 'Exordium', 'Nexus'],
          players: 4
        }
      ];

      return {
        build: BUILD_INFO.version,
        adapterApi: Object.keys(ArenaSetupAdapter).sort(),
        snapshots: scenarios.map((scenario, scenarioIndex) => {
          writeControlValue('setupMapName', scenario.mapId);
          refreshSetupForSelectedMap();
          scenario.factions.forEach((faction, index) => {
            const side = index + 1;
            writeControlValue(`setupP${side}Faction`, faction);
            populateSetupCommanderSelectForSide(side);
            writeControlValue(`setupP${side}Mode`, 'human');
            writeControlValue(`setupP${side}DeckMode`, 'template');
          });
          writeControlValue('setupInitiativeMode', '1');
          writeControlValue('setupBotAiMode', 'advanced');
          writeControlValue('setupPacePreset', 'standard');
          writeControlValue('setupGameScaleMode', 'large_scale');
          syncLegacyControlsFromSetupScreen();

          const dto = readGameSetupFromDom();
          newGame({ mapId: scenario.mapId, matchSeed: `AR-AC1-SETUP-${scenarioIndex + 1}` });
          return {
            expectedPlayers: scenario.players,
            dto: {
              mapId: dto.mapId,
              playerIds: [...dto.playerIds],
              factions: { ...dto.factions },
              modes: { ...dto.modes },
              selectedDecks: JSON.parse(JSON.stringify(dto.selectedDecks))
            },
            game: {
              mapId: state.mapId,
              playerIds: [...state.playerIds],
              factions: { ...state.factions },
              modes: { ...state.modes },
              currentPlayer: state.currentPlayer,
              turnOrder: [...state.turnOrder],
              hqCount: state.units.filter(unit => unit && unit.type === 'QG').length,
              cardZones: state.playerIds.every(side => Array.isArray(state.deck[side]) && Array.isArray(state.hand[side]))
            }
          };
        })
      };
    }""")
    browser.close()

assert_valid_build_version(result["build"])
assert result["adapterApi"] == ["normalize", "readFromDom", "readInitiativeMode"], result
for snapshot in result["snapshots"]:
    expected_ids = list(range(1, snapshot["expectedPlayers"] + 1))
    assert snapshot["dto"]["playerIds"] == expected_ids, snapshot
    assert snapshot["game"]["playerIds"] == expected_ids, snapshot
    assert snapshot["dto"]["mapId"] == snapshot["game"]["mapId"], snapshot
    assert snapshot["dto"]["factions"] == snapshot["game"]["factions"], snapshot
    assert snapshot["dto"]["modes"] == snapshot["game"]["modes"], snapshot
    assert all(deck["mode"] == "template" for deck in snapshot["dto"]["selectedDecks"].values()), snapshot
    assert snapshot["game"]["currentPlayer"] == 1, snapshot
    assert snapshot["game"]["turnOrder"] == expected_ids, snapshot
    assert snapshot["game"]["hqCount"] == snapshot["expectedPlayers"], snapshot
    assert snapshot["game"]["cardZones"], snapshot

assert not page_errors, page_errors
assert not console_errors, console_errors

print(json.dumps({"ok": True, **result, "pageErrors": page_errors, "consoleErrors": console_errors}, ensure_ascii=False, indent=2))
