"use strict";
const fs=require("fs"),path=require("path"),assert=require("assert"),vm=require("vm");
const root=path.resolve(__dirname,"..");
const read=rel=>fs.readFileSync(path.join(root,rel),"utf8");
const render=read("src/render.js");
const cards=read("src/card_renderer.js");
const mobile=read("src/mobile.js");
const css=read("css/style.css");
const build=read("src/build_info.js");
const config=read("data/cards_base.js");
const precheck=read("src/precheck.js");
let checks=0;
function ok(value,message){assert.ok(value,message);checks++;}
ok(build.includes("C2-STABLE-1-F9O4d-APK-M4c") || build.includes("C2-STABLE-1-F9O4c-APK-M4c"),"metadata F9O4c o successiva");
ok(build.includes("cross-platform-render-signature-integrity-hotfix") || build.includes("android-render-stability-hotfix"),"canale F9O4c o successiva");
ok(build.includes('logicBaseline: "C2-STABLE-1-F9O4c-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O4a-APK-M4c"'),"baseline logica F9O4c/F9O4a");
ok(config.includes("webViewReplaceChildrenFallbackF9O4c: true"),"flag compatibilità WebView");
ok(config.includes("boardContainmentDisabledF9O4c: true"),"flag containment disattivato");
ok(config.includes("boundedThumbnailQueueF9O4c: true"),"flag coda thumbnail");
ok(config.includes("staleCanvasRedrawGuardF9O4c: true"),"flag canvas stale guard");
ok(config.includes("coalescedMobilePanelLayoutF9O4c: true"),"flag pannelli coalescenti");
ok(render.includes("function boardRenderReplaceChildrenCompat"),"fallback replaceChildren presente");
ok(render.includes("while (board.firstChild) board.removeChild(board.firstChild)"),"fallback DOM legacy esplicito");
ok(render.includes('board.dataset.renderer = "incremental-f9o4c"'),"marker F9O4c");
ok(render.includes("skeletonRepairs"),"autoripristino skeleton diagnosticato");
ok(render.includes("queued: new Set()"),"coda thumbnail persistente deduplicata");
ok(!render.includes("HAND_THUMB_RENDER_QUEUE.generation += 1"),"nessuna cancellazione coda a ogni renderAll");
ok(render.includes("let budget = mobile ? 1 : 3"),"budget canvas per frame");
ok(cards.includes("cardRendererPreviewAssetsSettled"),"stato asset canvas verificabile");
ok(cards.includes('canvas.dataset.cardRenderState = ready ? "ready" : "pending"'),"canvas mantiene stato pending/ready");
ok(cards.includes("settled-error"),"ultimo fallback asset conclude il caricamento");
ok(cards.includes("canvas.__arenaCardRenderGeneration !== generation"),"callback stale bloccata");
ok(!css.includes(":has(.mapHandThumbCanvas)"),"fallback non sparisce alla sola presenza del canvas");
ok(css.includes('#board[data-renderer="incremental-f9o4c"]') && css.includes("contain: none"),"containment board disattivato");
ok(mobile.includes("function apkM4SchedulePanelLayout"),"scheduler pannelli presente");
ok(mobile.includes("apkM4PanelLayoutState.token += 1"),"aperture pannello obsolete cancellate");
ok(mobile.includes("mobile-panel-layout-pending"),"stato transitorio pannello esplicito");
ok(precheck.includes("F9O4c: fallback WebView"),"precheck F9O4c presente");

// Contratto runtime della funzione compatibile senza Element.replaceChildren.
const segment=render.slice(render.indexOf("function boardRenderReplaceChildrenCompat"),render.indexOf("function boardRenderCacheNodesConnected"));
const ctx=vm.createContext({});
vm.runInContext(segment,ctx);
let removed=0,appended=0;
const board={
  firstChild:{},
  removeChild(){removed++; this.firstChild=removed<2?{}:null;},
  appendChild(fragment){appended++; this.fragment=fragment;}
};
ctx.boardRenderReplaceChildrenCompat(board,{kind:"fragment"});
ok(removed===2 && appended===1,"fallback legacy sostituisce i figli senza eccezioni");
console.log(`F9O4c Android render stability smoke: ${checks}/${checks} OK`);
