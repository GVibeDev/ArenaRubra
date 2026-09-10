"use strict";

// AR-AC1 boot-time module manifest and conditional classic-script loader.
// Distribution exclusion happens before optional scripts execute.
const ArenaRuntimeProfile = (() => {
  const MANIFEST = Object.freeze({
    schemaVersion:"AR-AC1-RUNTIME-MODULES-1",
    devOnly:Object.freeze([
      "src/renderer_calibration_lab.js",
      "src/menu_layout_calibration_lab.js",
      "src/card_editor.js",
      "src/map_editor.js",
      "src/expert_ai/expert_common_strategy.js",
      "src/expert_ai/expert_nexus.js",
      "src/expert_ai/expert_exordium.js",
      "src/expert_ai/expert_liberti.js",
      "src/expert_ai/expert_agathoi.js",
      "src/expert_ai/expert_fabeot.js",
      "src/expert_ai/expert_router.js",
      "src/expert_ai/expert_runtime.js"
    ])
  });
  const requested = [];
  const loaded = [];

  function normalize(value, fallback="dev") {
    const text=String(value||"").trim().toLowerCase();
    if (["distribution","demo","player","public"].includes(text)) return "distribution";
    if (["dev","developer","development"].includes(text)) return "dev";
    return fallback === "distribution" ? "distribution" : "dev";
  }

  function queryProfile() {
    try {
      if (typeof location === "undefined") return null;
      const value=new URLSearchParams(location.search||"").get("profile");
      return value ? normalize(value,null) : null;
    } catch (_) { return null; }
  }

  function storedProfile() {
    try {
      if (typeof arenaStorageReadSettings !== "function") return null;
      const settings=arenaStorageReadSettings();
      const current=settings&&settings.productProfile;
      if (current&&current.profile) return normalize(current.profile,null);
      const legacy=settings&&settings.controlCenter;
      if (legacy&&typeof legacy.developerMode==="boolean") return legacy.developerMode?"dev":"distribution";
    } catch (_) {}
    return null;
  }

  function buildProfile() {
    try {
      if (typeof ARENA_RUNTIME_BUILD_PROFILE !== "undefined") return normalize(ARENA_RUNTIME_BUILD_PROFILE,"dev");
      if (typeof BUILD_INFO !== "undefined"&&BUILD_INFO) return normalize(BUILD_INFO.productProfileDefault,"dev");
    } catch (_) {}
    return "dev";
  }

  const profile=queryProfile()||storedProfile()||buildProfile();

  function allows(capability) {
    return capability !== "dev" || profile === "dev";
  }

  function loadScript(path, capability="dev") {
    const modulePath=String(path||"");
    requested.push(Object.freeze({path:modulePath,capability,allowed:allows(capability)}));
    if (!allows(capability)) return false;
    if (capability === "dev" && !MANIFEST.devOnly.includes(modulePath)) throw new Error(`Modulo DEV non dichiarato: ${modulePath}`);
    if (typeof document === "undefined" || typeof document.write !== "function") return false;
    loaded.push(modulePath);
    document.write('<script src="' + modulePath + '"></' + 'script>');
    return true;
  }

  function diagnostics() {
    return Object.freeze({profile,manifestSchema:MANIFEST.schemaVersion,requested:[...requested],loaded:[...loaded]});
  }

  return Object.freeze({MANIFEST,normalize,current:()=>profile,allows,loadScript,diagnostics});
})();
