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
    page.wait_for_function("typeof BUILD_INFO !== 'undefined' && typeof buildCardCatalog === 'function' && typeof f9s1aResolveTactic === 'function'")
    page.wait_for_timeout(100)

    result = page.evaluate("""() => {
      const factions = ['Nexus','Exordium','Liberti','Agathoi','Fabeot'];
      const unitCounts = Object.fromEntries(factions.map(f => [f, BLUEPRINTS.filter(x => x.faction === f).length]));
      const tacticCounts = Object.fromEntries(factions.map(f => [f, DECK_TACTICS.filter(x => x.faction === f).length]));
      const catalog = buildCardCatalog();
      const ids = catalog.map(card => card.id);
      const duplicateCatalogIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      const newUnits = ['NXS1A01','NXS1A02','NXS1A03','EXS1A01','EXS1A02','EXS1A03','LBS1A01','LBS1A02','LBS1A03','LBS1A04','LBS1A05','FBS1A01','FBS1A02','FBS1A03'];
      const newTactics = ['NXTAC13','NXTAC14','EXTAC13','EXTAC14','AGTAC10','AGTAC11','AGTAC12','AGTAC13','AGTAC14','FABTAC13','FABTAC14'];
      const catalogUnits = Object.fromEntries(newUnits.map(id => [id, catalog.some(card => card.id === `UNIT:${id}`)]));
      const catalogTactics = Object.fromEntries(newTactics.map(id => [id, catalog.some(card => card.id === `TACTIC:${id}` && card.implementationStatus === 'playable_f9s1a')]));
      const builtinDeckLists = Object.values(BUILTIN_DECK_EXPORT.decks || {}).map(deck => deck.deckIds || []);
      const insertedInBuiltinDecks = [...newUnits.map(id => `UNIT:${id}`), ...newTactics.map(id => `TACTIC:${id}`)]
        .filter(id => builtinDeckLists.some(list => list.includes(id)));
      const taxonomy = unitTaxonomyAuditF9O5(BLUEPRINTS);
      const fxAudit = tokenFxProfileAuditF9O5a(BLUEPRINTS);
      const artillery = BLUEPRINTS.find(x => x.id === 'NXS1A03');
      const mortar = BLUEPRINTS.find(x => x.id === 'EXS1A02');
      const attacker = BLUEPRINTS.find(x => x.id === 'LBS1A01');
      const courier = BLUEPRINTS.find(x => x.id === 'FBS1A01');
      const precheck = runPrecheck({quiet:true, source:'f9s1a-browser-smoke'});
      return {
        build: BUILD_INFO.version,
        baseline: BUILD_INFO.logicBaseline,
        unitCounts,
        tacticCounts,
        catalogSize: catalog.length,
        duplicateCatalogIds,
        catalogUnits,
        catalogTactics,
        insertedInBuiltinDecks,
        taxonomy,
        fxAudit,
        artillery: {selectionCount:artillery.ability.selectionCount, range:artillery.ability.range, value:artillery.ability.value},
        mortar: {selectionCount:mortar.ability.selectionCount, range:mortar.ability.range, value:mortar.ability.value},
        attackerKind: attacker.ability.kind,
        courierAbility: {kind:courier.ability.kind, cost:courier.ability.cost, cooldown:courier.ability.cooldown},
        precheck: {ok:precheck.ok, problems:precheck.problems, warnings:precheck.warnings},
        config: {
          version:CARD_CATALOG_CONFIG.version,
          mode:CARD_CATALOG_CONFIG.mode,
          enabled:CARD_CATALOG_CONFIG.factionUnitsTacticsExpansionF9S1a,
          unitTarget:CARD_CATALOG_CONFIG.officialFactionUnitCountF9S1a,
          tacticTarget:CARD_CATALOG_CONFIG.officialFactionTacticCountF9S1a
        }
      };
    }""")
    browser.close()

assert result["build"] == "C2-STABLE-1-F9S1b1-APK-M4c", result
assert result["baseline"] == "C2-STABLE-1-F9S1b-APK-M4c", result
assert all(value == 23 for value in result["unitCounts"].values()), result
assert all(value == 14 for value in result["tacticCounts"].values()), result
assert not result["duplicateCatalogIds"], result
assert all(result["catalogUnits"].values()), result
assert all(result["catalogTactics"].values()), result
assert not result["insertedInBuiltinDecks"], result
assert result["taxonomy"]["ok"] and result["taxonomy"]["total"] == 115, result
assert result["fxAudit"]["ok"] and result["fxAudit"]["total"] == 115, result
assert result["artillery"] == {"selectionCount":2,"range":3,"value":2}, result
assert result["mortar"] == {"selectionCount":3,"range":2,"value":1}, result
assert result["attackerKind"] == "f9s1Assassinate", result
assert result["courierAbility"] == {"kind":"f9s1DoubleMove","cost":2,"cooldown":2}, result
assert result["precheck"]["ok"] and not result["precheck"]["problems"], result
assert result["config"] == {
    "version":"C2-STABLE-1-F9S1b1-APK-M4c",
    "mode":"alternative_pivots_complete_40_card_pools",
    "enabled":True,
    "unitTarget":22,
    "tacticTarget":14,
}, result
assert not errors, errors
assert not console_errors, console_errors

print(json.dumps({"ok": True, **result, "pageErrors": errors, "consoleErrors": console_errors}, ensure_ascii=False, indent=2))
