from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import re

ROOT = Path(__file__).resolve().parents[1]


def load_base(page):
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    scripts = re.findall(r'<script\s+src="([^"]+)"\s*></script>', index)
    html = re.sub(r'<script\s+src="[^"]+"\s*></script>', '', index)
    html = re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>', '', html)
    page.set_content(html, wait_until="load")
    page.add_style_tag(path=str(ROOT / "css/style.css"))
    calibration = ROOT / "css/renderer_calibration_lab.css"
    if calibration.exists():
        page.add_style_tag(path=str(calibration))
    for rel in scripts:
        page.add_script_tag(path=str(ROOT / rel))
    page.wait_for_function("typeof BUILD_INFO !== 'undefined' && typeof initializeArenaAppShell === 'function' && typeof initializeControlCenter === 'function'")
    page.evaluate("""() => {
      const splash = document.getElementById('appSplash');
      if (splash) { splash.style.display='none'; splash.style.pointerEvents='none'; }
      initializeArenaAppShell();
      setAppScreen(ARENA_APP_SCREENS.MAIN_MENU);
    }""")
    page.wait_for_function("typeof controlCenterSnapshot === 'function' && !controlCenterSnapshot().diagnostics.pending")


def snapshot(page):
    return page.evaluate("""() => ({
      build: BUILD_INFO.version,
      baseline: BUILD_INFO.logicBaseline,
      areas: [...document.querySelectorAll('.controlCenterArea .mainMenuSectionEyebrow')].map(el => el.textContent.trim()),
      version: document.getElementById('controlCenterVersion')?.textContent.trim(),
      logic: document.getElementById('controlCenterLogicBaseline')?.textContent.trim(),
      schema: document.getElementById('controlCenterTelemetrySchema')?.textContent.trim(),
      decks: document.getElementById('controlCenterOfficialDecks')?.textContent.trim(),
      maps: document.getElementById('controlCenterOfficialMaps')?.textContent.trim(),
      storage: document.getElementById('controlCenterStorageSpace')?.textContent.trim(),
      lastMatch: document.getElementById('controlCenterLastMatch')?.textContent.trim(),
      diagnostics: document.getElementById('controlCenterDiagnosticErrors')?.textContent.trim(),
      diagnosticTone: document.getElementById('controlCenterDiagnosticCard')?.dataset.tone,
      debugHidden: document.getElementById('mainMenuOptionsBtn')?.hidden,
      resumeDisabled: document.getElementById('mainMenuResumeBtn')?.disabled,
      resumeMarkup: document.getElementById('mainMenuResumeBtn')?.innerHTML,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      snap: controlCenterSnapshot()
    })""")


def panel_snapshot(page):
    return page.evaluate("""() => ({
      open: !document.getElementById('controlCenterPanel').hidden,
      title: document.getElementById('controlCenterPanelTitle').textContent.trim(),
      text: document.getElementById('controlCenterPanelBody').textContent.trim().slice(0, 800),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      sheet: document.querySelector('.controlCenterPanelSheet')?.getBoundingClientRect().toJSON(),
      viewport: {width: innerWidth, height: innerHeight}
    })""")


page_errors = []
console_errors = []
results = {}
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox', '--allow-file-access-from-files'])

    ctx = browser.new_context(viewport={'width': 1440, 'height': 1000})
    page = ctx.new_page(); page.set_default_timeout(20000)
    page.on('pageerror', lambda exc: page_errors.append(f'desktop: {exc}'))
    page.on('console', lambda msg: console_errors.append(f'desktop: {msg.text}') if msg.type == 'error' else None)
    load_base(page)
    desktop = snapshot(page)
    page.screenshot(path=str(ROOT / 'docs/F9U3_CONTROL_CENTER_DESKTOP.png'), full_page=True)

    page.locator('#mainMenuAboutBtn').click()
    version_panel = panel_snapshot(page)
    page.locator('#controlCenterPanelCloseBtn').click()

    page.locator('#mainMenuMapArchiveBtn').click()
    page.wait_for_function("document.querySelectorAll('[data-control-center-map-row]').length === 9")
    map_panel = panel_snapshot(page)
    map_rows = page.locator('[data-control-center-map-row]').count()
    first_map_id = page.locator('[data-control-center-map-row]').first.get_attribute('data-control-center-map-row')
    page.locator('[data-control-center-map-setup]').first.click()
    page.wait_for_function("document.body.dataset.appScreen === 'setup'")
    setup_selected = page.locator('#setupMapName').input_value()
    setup_panel_closed = page.locator('#controlCenterPanel').is_hidden()
    page.evaluate("openMainMenu()")

    page.locator('#mainMenuStatsBtn').click(); stats_panel = panel_snapshot(page); page.locator('#controlCenterPanelCloseBtn').click()
    page.locator('#mainMenuHistoryBtn').click(); history_panel = panel_snapshot(page); page.locator('#controlCenterPanelCloseBtn').click()
    page.locator('#mainMenuTelemetryBtn').click(); telemetry_panel = panel_snapshot(page); page.locator('#controlCenterPanelCloseBtn').click()
    page.locator('#mainMenuLogBtn').click(); log_panel = panel_snapshot(page); page.locator('#controlCenterPanelCloseBtn').click()

    page.locator('#mainMenuSettingsBtn').click()
    settings_panel = panel_snapshot(page)
    toggle = page.locator('#controlCenterDeveloperModeToggle')
    assert toggle.is_checked()
    toggle.uncheck()
    debug_hidden_after_off = page.locator('#mainMenuOptionsBtn').is_hidden()
    toggle.check()
    debug_visible_after_on = page.locator('#mainMenuOptionsBtn').is_visible()
    page.locator('#controlCenterPanelCloseBtn').click()

    page.locator('#mainMenuOptionsBtn').click()
    debug_panel = panel_snapshot(page)
    debug_metrics = page.locator('.controlCenterMiniMetrics .controlCenterMiniMetric').count()
    page.locator('[data-control-center-action="run-diagnostics"]').click()
    page.wait_for_function("controlCenterSnapshot().diagnostics.errorCount === 0")
    page.locator('#controlCenterPanelCloseBtn').click()

    page.locator('#mainMenuTransferBtn').click()
    transfer_panel = panel_snapshot(page)
    transfer_actions = page.locator('[data-control-center-action="copy-archive"], [data-control-center-action="download-archive"], [data-control-center-action="select-import-archive"]').count()
    page.locator('#controlCenterPanelCloseBtn').click()

    # Mobile portrait
    mctx = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True)
    mobile = mctx.new_page(); mobile.set_default_timeout(20000)
    mobile.on('pageerror', lambda exc: page_errors.append(f'mobile: {exc}'))
    mobile.on('console', lambda msg: console_errors.append(f'mobile: {msg.text}') if msg.type == 'error' else None)
    load_base(mobile)
    mobile_snap = snapshot(mobile)
    mobile_areas = mobile.evaluate("""() => [...document.querySelectorAll('.controlCenterArea')].map(el => el.getBoundingClientRect().toJSON())""")
    mobile.screenshot(path=str(ROOT / 'docs/F9U3_CONTROL_CENTER_MOBILE.png'), full_page=True)
    mobile.locator('#mainMenuMapArchiveBtn').click()
    mobile_panel = panel_snapshot(mobile)
    mobile_table_overflow = mobile.evaluate("""() => {
      const wrap=document.querySelector('.controlCenterTableWrap');
      return wrap ? {client:wrap.clientWidth,scroll:wrap.scrollWidth} : null;
    }""")
    mobile.screenshot(path=str(ROOT / 'docs/F9U3_CONTROL_CENTER_MOBILE_PANEL.png'), full_page=False)

    results = {
      'desktop': desktop,
      'versionPanel': version_panel,
      'mapPanel': map_panel,
      'mapRows': map_rows,
      'firstMap': first_map_id,
      'setupSelected': setup_selected,
      'setupPanelClosed': setup_panel_closed,
      'statsPanel': stats_panel,
      'historyPanel': history_panel,
      'telemetryPanel': telemetry_panel,
      'logPanel': log_panel,
      'settingsPanel': settings_panel,
      'debugPanel': debug_panel,
      'debugMetrics': debug_metrics,
      'transferPanel': transfer_panel,
      'transferActions': transfer_actions,
      'debugHiddenAfterOff': debug_hidden_after_off,
      'debugVisibleAfterOn': debug_visible_after_on,
      'mobile': mobile_snap,
      'mobileAreas': mobile_areas,
      'mobilePanel': mobile_panel,
      'mobileTableOverflow': mobile_table_overflow
    }
    browser.close()

assert desktop['build'] == 'C2-STABLE-1-F9T0-APK-M4c', desktop
assert desktop['baseline'] == 'C2-STABLE-1-F9U3-APK-M4c', desktop
assert desktop['areas'] == ['Gioca', 'Carte e deck', 'Mappe', 'Analisi', 'Sistema'], desktop
assert desktop['version'] == desktop['build'] and desktop['logic'] == desktop['baseline'], desktop
assert desktop['schema'] == 'F9Q3e1-2', desktop
assert desktop['decks'] == '50' and desktop['maps'] == '9', desktop
assert desktop['storage'] and desktop['lastMatch'], desktop
assert desktop['diagnostics'] == 'Nessun errore' and desktop['diagnosticTone'] in ('good', 'warn'), desktop
assert desktop['snap']['diagnostics']['errorCount'] == 0, desktop
assert desktop['snap']['officialDecks'] == 50 and desktop['snap']['officialMaps'] == 9, desktop
assert desktop['debugHidden'] is False and desktop['resumeDisabled'] is True, desktop
assert '<strong>Riprendi</strong>' in desktop['resumeMarkup'] and '<small>Nessuna sessione attiva</small>' in desktop['resumeMarkup'], desktop
assert desktop['overflow'] <= 1, desktop

assert version_panel['open'] and version_panel['title'] == 'Versione' and 'Baseline logica' in version_panel['text'], version_panel
assert map_panel['open'] and map_panel['title'] == 'Archivio mappe' and map_rows == 9, map_panel
assert setup_selected == first_map_id and setup_panel_closed, (setup_selected, first_map_id, setup_panel_closed)
assert stats_panel['title'] == 'Statistiche' and 'Registro matchup' in stats_panel['text'], stats_panel
assert history_panel['title'] == 'Cronologia' and 'Storico partite' in history_panel['text'], history_panel
assert telemetry_panel['title'] == 'Telemetria' and ('F9Q3e1-2' in telemetry_panel['text'] or 'Telemetria' in telemetry_panel['text']), telemetry_panel
assert log_panel['title'] == 'Log' and 'Log partita attiva' in log_panel['text'], log_panel
assert settings_panel['title'] == 'Impostazioni' and 'Modalità sviluppatore' in settings_panel['text'], settings_panel
assert debug_hidden_after_off and debug_visible_after_on, (debug_hidden_after_off, debug_visible_after_on)
assert debug_panel['title'] == 'Debug' and 'Diagnostica di sviluppo' in debug_panel['text'] and debug_metrics >= 4, debug_panel
assert transfer_panel['title'] == 'Import / Export' and 'backup di sicurezza' in transfer_panel['text'].lower() and transfer_actions == 3, transfer_panel

assert mobile_snap['overflow'] <= 1 and mobile_snap['areas'] == desktop['areas'], mobile_snap
assert all(mobile_areas[i]['bottom'] <= mobile_areas[i+1]['top'] + 2 for i in range(len(mobile_areas)-1)), mobile_areas
assert mobile_panel['open'] and mobile_panel['sheet']['width'] <= mobile_panel['viewport']['width'] + 1, mobile_panel
assert mobile_panel['sheet']['top'] >= 0 and mobile_panel['sheet']['bottom'] <= mobile_panel['viewport']['height'] + 1, mobile_panel
assert mobile_panel['sheet']['height'] <= mobile_panel['viewport']['height'] + 1, mobile_panel
assert mobile_panel['overflow'] <= 1, mobile_panel
assert mobile_table_overflow and mobile_table_overflow['scroll'] >= mobile_table_overflow['client'], mobile_table_overflow
assert not page_errors, page_errors
assert not console_errors, console_errors

print(json.dumps({'ok': True, **results}, ensure_ascii=False, indent=2))
