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
    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    page = context.new_page()
    page.set_default_timeout(5000)
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

    page.wait_for_function("typeof BUILD_INFO !== 'undefined' && typeof initializeArenaAppShell === 'function' && typeof openDeckBuilderScreen === 'function' && typeof BUILTIN_DECKS !== 'undefined'")
    page.evaluate("""() => {
      window.__deckStoreForF9S1c1 = {};
      window.arenaStorageReadCustomDecks = () => ({ ...window.__deckStoreForF9S1c1 });
      window.arenaStorageWriteCustomDecks = store => {
        window.__deckStoreForF9S1c1 = JSON.parse(JSON.stringify(store || {}));
        return true;
      };
      initializeArenaAppShell();
      const splash = document.getElementById('appSplash');
      if (splash) { splash.style.display = 'none'; splash.style.pointerEvents = 'none'; }
      openDeckBuilderScreen();
    }""")
    page.wait_for_timeout(250)

    before = page.evaluate("""() => ({
      build: BUILD_INFO.version,
      officialDecks: Object.keys(BUILTIN_DECKS).length,
      quickActions: document.querySelectorAll('.deckBuilderQuickActions button').length,
      advancedCollapsed: !document.querySelector('.deckBuilderAdvancedTools').open,
      nameButtons: [...document.querySelectorAll('.deckBuilderSavedDeckNameBtn')].map(button => button.textContent.trim()),
      buttonChildren: [...document.querySelectorAll('.deckBuilderSavedDeckNameBtn')].map(button => button.children.length),
      groups: [...document.querySelectorAll('.deckBuilderSavedDeckGroup')].map(group => ({
        commander: group.querySelector('h4').textContent.trim(),
        count: group.querySelectorAll('.deckBuilderSavedDeckNameBtn').length
      })),
      poolControlButtons: document.querySelector('#deckBuilderPoolBody .deckBuilderCountControl').querySelectorAll('button').length,
      deckControlButtons: document.querySelector('#deckBuilderDeckBody .deckBuilderCountControl').querySelectorAll('button').length,
      curveColumns: document.querySelectorAll('.deckBuilderCurveColumn').length,
      ratioLabel: document.querySelector('.deckBuilderRatioBar').getAttribute('aria-label'),
      energyAverage: document.querySelector('.deckBuilderAnalysisHeadline strong').textContent.trim(),
      selectedDetail: document.querySelector('.deckBuilderSavedDeckDetail strong').textContent.trim()
    })""")

    page.get_by_role("button", name="Batteria di Soppressione", exact=True).click()
    page.wait_for_timeout(80)
    selected = page.evaluate("""() => ({
      selectedKey: deckBuilderState.selectedSavedKey,
      detailName: document.querySelector('.deckBuilderSavedDeckDetail strong').textContent.trim(),
      detailText: document.querySelector('.deckBuilderSavedDeckDetail').textContent,
      commanderBeforeLoad: document.getElementById('deckBuilderCommanderSelect').value
    })""")

    page.locator('.deckBuilderSavedDeckDetail [data-db-load-saved-key]').click()
    page.wait_for_timeout(120)
    after_load = page.evaluate("""() => {
      const report = deckBuilderReportObject();
      return {
        faction: report.faction,
        commanderId: report.commanderId,
        deckName: report.deckName,
        deckSize: report.deckIds.length,
        valid: report.sanity.ok,
        average: report.analysis.energyAverage,
        unitCount: report.analysis.unitCount,
        tacticCount: report.analysis.tacticCount,
        curveColumns: document.querySelectorAll('.deckBuilderCurveColumn').length,
        selectedDetail: document.querySelector('.deckBuilderSavedDeckDetail strong').textContent.trim(),
        feedback: document.getElementById('deckBuilderFeedback').textContent.trim()
      };
    }""")

    control_before = page.evaluate("""() => {
      const row = document.querySelector('#deckBuilderDeckBody tr[data-db-preview-card]');
      const control = row.querySelector('.deckBuilderCountControl');
      return { id: row.dataset.dbPreviewCard, text: control.textContent.trim() };
    }""")
    page.locator(f'#deckBuilderDeckBody tr[data-db-preview-card="{control_before["id"]}"] [data-db-remove-card]').click()
    page.wait_for_timeout(60)
    control_removed = page.evaluate("""id => ({
      size: deckBuilderReportObject().deckIds.length,
      text: document.querySelector(`#deckBuilderPoolBody tr[data-db-preview-card="${id}"] .deckBuilderCountControl`)?.textContent.trim() || ""
    })""", control_before["id"])
    page.locator(f'#deckBuilderPoolBody tr[data-db-preview-card="{control_before["id"]}"] [data-db-add-card]').click()
    page.wait_for_timeout(60)
    control_restored = page.evaluate("""id => ({
      size: deckBuilderReportObject().deckIds.length,
      valid: deckBuilderReportObject().sanity.ok,
      text: document.querySelector(`#deckBuilderDeckBody tr[data-db-preview-card="${id}"] .deckBuilderCountControl`)?.textContent.trim() || ""
    })""", control_before["id"])

    page.set_viewport_size({"width": 800, "height": 900})
    page.wait_for_timeout(100)
    responsive = page.evaluate("""() => {
      const boxes = [...document.querySelectorAll('.deckBuilderQuickActions button')].map(button => button.getBoundingClientRect());
      const overlaps = boxes.some((a, index) => boxes.slice(index + 1).some(b => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top)));
      const card = document.querySelector('.deckBuilderCard').getBoundingClientRect();
      const actions = document.querySelector('.deckBuilderHeaderActions').getBoundingClientRect();
      return {
        overlaps,
        cardLeft: card.left,
        cardRight: card.right,
        viewportWidth: innerWidth,
        actionsWidth: actions.width,
        galleryColumns: getComputedStyle(document.querySelector('.deckBuilderSavedGalleryLayout')).gridTemplateColumns,
        quickColumns: getComputedStyle(document.querySelector('.deckBuilderQuickActions')).gridTemplateColumns
      };
    }""")

    browser.close()

assert before["build"] == "C2-STABLE-1-F9U2b-APK-M4c", before
assert before["officialDecks"] == 50, before
assert before["quickActions"] == 7, before
assert before["advancedCollapsed"], before
assert len(before["nameButtons"]) == 10, before
assert before["buttonChildren"] == [0] * 10, before
assert before["groups"] == [{"commander": "Avatex", "count": 5}, {"commander": "Unità Comando", "count": 5}], before
assert before["poolControlButtons"] == 2, before
assert before["deckControlButtons"] == 2, before
assert before["curveColumns"] == 8, before
assert "unità" in before["ratioLabel"] and "tattiche" in before["ratioLabel"], before
assert before["energyAverage"], before
assert before["selectedDetail"] == "Nexus · Avatex · Civiltà Algoritmica", before

assert selected["detailName"] == "Batteria di Soppressione", selected
assert selected["selectedKey"] == "Nexus::NXCMD02::batteria-di-soppressione", selected
assert "Shooter/Armored" in selected["detailText"], selected
assert "ENE media" in selected["detailText"], selected
assert selected["commanderBeforeLoad"] == "NXCMD01", selected

assert after_load["faction"] == "Nexus", after_load
assert after_load["commanderId"] == "NXCMD02", after_load
assert after_load["deckName"] == "Batteria di Soppressione", after_load
assert after_load["deckSize"] == 30, after_load
assert after_load["valid"], after_load
assert after_load["unitCount"] == 14 and after_load["tacticCount"] == 16, after_load
assert after_load["curveColumns"] == 8, after_load
assert after_load["selectedDetail"] == "Batteria di Soppressione", after_load
assert "caricato nel draft" in after_load["feedback"], after_load

assert control_removed["size"] == 29, control_removed
assert control_restored["size"] == 30, control_restored
assert control_restored["valid"], control_restored
assert control_restored["text"], control_restored
assert not responsive["overlaps"], responsive
assert responsive["cardLeft"] >= 0 and responsive["cardRight"] <= responsive["viewportWidth"] + 1, responsive
assert responsive["actionsWidth"] > 0, responsive
assert not errors, errors
assert not console_errors, console_errors

print(json.dumps({
  "ok": True,
  "before": before,
  "selected": selected,
  "afterLoad": after_load,
  "controlBefore": control_before,
  "controlRemoved": control_removed,
  "controlRestored": control_restored,
  "responsive": responsive,
  "pageErrors": errors,
  "consoleErrors": console_errors
}, ensure_ascii=False, indent=2))
