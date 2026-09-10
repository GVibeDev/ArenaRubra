"use strict";

// S2-C5b2: browser adapter for locale loading, DOM binding and persisted choice.
const ArenaI18n = (() => {
  const DEFAULT_LANGUAGE = "it";
  const LANGUAGE_EVENT = "arena:languagechange";
  const LOCALE_FRAGMENTS = Object.freeze(["content/units", "content/unit_text", "content/tactics", "content/missions", "content/decks", "content/tutorial_text", "ui/tools"]);
  const state = {
    service: null,
    status: "loading",
    error: null,
    missing: []
  };

  function storedLanguage() {
    try {
      const settings = typeof arenaStorageReadSettings === "function" ? arenaStorageReadSettings() : {};
      return settings && settings.localization ? settings.localization.language : "";
    } catch (_) {
      return "";
    }
  }

  function requestedLanguage() {
    try {
      const requested = new URLSearchParams(window.location.search || "").get("lang");
      if (requested) return requested;
    } catch (_) {}
    return storedLanguage() || DEFAULT_LANGUAGE;
  }

  function persistLanguage(language) {
    if (typeof arenaStorageReadSettings !== "function" || typeof arenaStorageWriteSettings !== "function") return;
    const settings = arenaStorageReadSettings();
    arenaStorageWriteSettings({
      ...settings,
      localization: { ...(settings.localization || {}), language }
    });
  }

  function mergeLocale(target, source) {
    if (!source || typeof source !== "object" || Array.isArray(source)) return target;
    const merged = { ...(target || {}) };
    Object.entries(source).forEach(([key, value]) => {
      merged[key] = value && typeof value === "object" && !Array.isArray(value)
        ? mergeLocale(merged[key], value)
        : value;
    });
    return merged;
  }

  async function readLocaleFile(path, label) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
    return response.json();
  }

  async function readLocale(language) {
    const base = await readLocaleFile(`locales/${language}.json`, `Locale ${language}`);
    const fragments = await Promise.all(LOCALE_FRAGMENTS.map(fragment =>
      readLocaleFile(`locales/${fragment}.${language}.json`, `Locale ${language}/${fragment}`)
    ));
    return fragments.reduce(mergeLocale, base);
  }

  function localizedElements(root, attribute) {
    const selector = `[${attribute}]`;
    const elements = [];
    if (root && root.nodeType === 1 && root.matches(selector)) elements.push(root);
    if (root && typeof root.querySelectorAll === "function") elements.push(...root.querySelectorAll(selector));
    return elements;
  }

  function apply(root = document) {
    if (!state.service || typeof document === "undefined") return false;
    const bindings = [
      ["data-i18n", "textContent"],
      ["data-i18n-aria-label", "aria-label"],
      ["data-i18n-title", "title"],
      ["data-i18n-placeholder", "placeholder"]
    ];
    bindings.forEach(([attribute, target]) => {
      localizedElements(root, attribute).forEach(element => {
        const key = element.getAttribute(attribute);
        let params = {};
        const rawParams = element.getAttribute("data-i18n-params");
        if (rawParams) {
          try { params = JSON.parse(rawParams); } catch (_) {}
        }
        const value = state.service.t(key, params);
        if (target === "textContent") {
          if (element.textContent !== value) element.textContent = value;
        } else if (element.getAttribute(target) !== value) {
          element.setAttribute(target, value);
        }
      });
    });
    document.documentElement.lang = state.service.currentLanguage();
    const selector = document.getElementById("arenaLanguageSelect");
    if (selector) {
      selector.value = state.service.currentLanguage();
      selector.disabled = false;
    }
    return true;
  }

  function dispatchLanguageChange(language) {
    if (typeof window === "undefined" || typeof CustomEvent !== "function") return;
    window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: { language } }));
  }

  function bindSelector() {
    if (typeof document === "undefined") return;
    const selector = document.getElementById("arenaLanguageSelect");
    if (!selector || selector.dataset.i18nBound === "true") return;
    selector.dataset.i18nBound = "true";
    selector.addEventListener("change", () => setLanguage(selector.value));
  }

  async function setLanguage(language, options = {}) {
    await readyPromise;
    if (!state.service) return DEFAULT_LANGUAGE;
    const next = state.service.setLanguage(language, { persist: options.persist !== false });
    apply(document);
    dispatchLanguageChange(next);
    // Synchronous feature listeners may rewrite copy after the first pass.
    queueMicrotask(() => apply(document));
    return next;
  }

  async function initialize() {
    if (typeof ArenaI18nCore === "undefined") throw new Error("ArenaI18nCore is not available");
    const entries = await Promise.all(ArenaI18nCore.SUPPORTED_LANGUAGES.map(async language => [language, await readLocale(language)]));
    state.service = ArenaI18nCore.create({
      dictionaries: Object.fromEntries(entries),
      fallbackLanguage: DEFAULT_LANGUAGE,
      readLanguage: requestedLanguage,
      writeLanguage: persistLanguage,
      onMissing: (key, language) => state.missing.push({ key, language })
    });
    state.status = "ready";
    bindSelector();
    apply(document);
    dispatchLanguageChange(state.service.currentLanguage());
    return api;
  }

  const readyPromise = (async () => {
    if (typeof document !== "undefined" && document.readyState === "loading") {
      await new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
    }
    try {
      return await initialize();
    } catch (error) {
      state.status = "error";
      state.error = error;
      const selector = typeof document !== "undefined" ? document.getElementById("arenaLanguageSelect") : null;
      if (selector) selector.disabled = true;
      return null;
    }
  })();

  function translate(key, params = {}, fallback = "") {
    if (!state.service) return fallback || String(key || "");
    const value = state.service.t(key, params);
    return value === key && fallback ? fallback : value;
  }

  const api = Object.freeze({
    apply,
    currentLanguage: () => state.service ? state.service.currentLanguage() : DEFAULT_LANGUAGE,
    diagnostics: () => Object.freeze({ status: state.status, error: state.error ? state.error.message : "", missing: [...state.missing] }),
    ready: () => readyPromise,
    has: key => Boolean(state.service && state.service.has(key)),
    setLanguage,
    t: translate
  });
  return api;
})();

globalThis.ArenaI18n = ArenaI18n;
globalThis.arenaI18nText = (key, fallback, params = {}) => ArenaI18n.t(key, params, fallback);

if (typeof module !== "undefined" && module.exports) module.exports = ArenaI18n;
