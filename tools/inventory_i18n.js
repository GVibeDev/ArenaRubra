"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const scopes = {
  shell: ["index.html", "src/app.js", "src/control_center.js", "src/ui.js"],
  setup: ["index.html", "src/setup_adapter.js", "src/game.js"],
  gameplay: ["src/combat.js", "src/movement.js", "src/deployment.js", "src/economy.js", "src/rules.js", "src/turns.js"],
  content: ["data/units_base.js", "data/tactics_base.js", "data/tactics_cards_c2.js", "data/missions_base.js", "data/map_definitions.js"],
  tutorial: ["data/tutorial_scenarios.js", "src/tutorial_runtime.js"],
  tools: ["src/deck_builder.js", "src/card_pool.js", "src/stats.js", "src/data/match_data.js"]
};
const italianSignals = /[àèéìòù]|\b(abilità|annulla|archivio|attacco|carta|carte|chiudi|comandante|conferma|continua|danno|deck|difesa|energia|errore|gioca|giocatore|impostazioni|mappa|mappe|missione|movimento|nuova|partita|pressione|salva|sconfitta|seleziona|statistiche|terreno|turno|unità|vittoria)\b/i;
const result = {};
for (const [scope, files] of Object.entries(scopes)) {
  const rows = [];
  for (const relative of files) {
    const absolute = path.join(root, relative);
    const lines = fs.readFileSync(absolute, "utf8").split(/\r?\n/);
    const candidates = lines.filter(line => italianSignals.test(line)).length;
    rows.push({ file: relative, candidateLines: candidates });
  }
  result[scope] = { candidateLines: rows.reduce((sum, row) => sum + row.candidateLines, 0), files: rows };
}
console.log(JSON.stringify({ schemaVersion: "S2-C5B-I18N-INVENTORY-1", heuristic: true, scopes: result }, null, 2));
