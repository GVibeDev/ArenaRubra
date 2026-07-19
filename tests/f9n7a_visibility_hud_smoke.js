"use strict";
const fs = require("fs");
const assert = require("assert");

const render = fs.readFileSync("src/render.js","utf8");
const css = fs.readFileSync("css/style.css","utf8");
const deck = fs.readFileSync("src/deck.js","utf8");
const config = fs.readFileSync("data/cards_base.js","utf8");

let checks=0;
function ok(v,m){assert.ok(v,m);checks++;}

ok(render.includes("function missionCardHiddenFromViewer(side, card)"),"helper Missione presente");
ok(render.includes("return false;\n    }\n\n    function renderHiddenMissionHandSlot"),"Missione non mascherata nella mano");
ok(render.includes("manuallyCollapsed: false"),"stato riduzione manuale presente");
ok(render.includes("function mapHandOverlayCollapse()"),"funzione riduzione manuale presente");
ok(render.includes("MAP_HAND_OVERLAY_STATE.manuallyCollapsed = true"),"riduzione attivabile");
ok(render.includes("onclick=\"mapHandOverlayCollapse()\">Riduci mano"),"pulsante Riduci mano presente");
ok(render.includes("MAP_HAND_OVERLAY_STATE.hiddenForMovement || MAP_HAND_OVERLAY_STATE.manuallyCollapsed"),"render compatto usa riduzione manuale");
ok(!/function mapHandOverlayCollapse\(\)[\s\S]{0,260}state\.modes\[state\.currentPlayer\] === \"bot\"/.test(render),"riduzione non bloccata durante bot");
ok(render.includes("class=\"mapActionDockEnergy\""),"blocco ENE nel dock presente");
ok(render.includes("${currentEnergy}<small> ENE</small>"),"ENE corrente evidenziata");
ok(render.includes("+${income.total} prossimo turno"),"income successivo secondario presente");
ok(css.includes(".mapActionDockEnergy strong"),"stile ENE evidente presente");
ok(css.includes("top: 50% !important"),"dock centrato sull'asse verticale");
ok(css.includes("transform: translateY(-50%) !important"),"centratura verticale applicata");
ok(deck.includes("if (includeMissionWhenPresent)"),"Missione inclusa nella mano iniziale");
ok(deck.indexOf("if (includeMissionWhenPresent)") < deck.indexOf("if (requireCommander)"),"Missione estratta insieme e prima del Comandante");
ok(config.includes('missionVisibility: "public_in_digital_runtime"'),"config visibilità pubblica digitale");
ok(config.includes("initialHandIncludesMissionWhenPresent: true"),"contratto mano iniziale confermato");

console.log(`F9N7a visibility/HUD smoke: ${checks}/${checks} OK`);
