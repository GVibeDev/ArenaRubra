"use strict";

// S2-C5b1: DOM-free localization service. Persistence and rendering are ports.
const ArenaI18nCore = (() => {
  const SUPPORTED_LANGUAGES = Object.freeze(["it", "en"]);
  const PLACEHOLDER_PATTERN = /\{([A-Za-z][A-Za-z0-9_]*)\}/g;

  function flattenDictionary(value, prefix = "", output = {}) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`Invalid locale branch: ${prefix || "<root>"}`);
    for (const [name, child] of Object.entries(value)) {
      const key = prefix ? `${prefix}.${name}` : name;
      if (typeof child === "string") output[key] = child;
      else flattenDictionary(child, key, output);
    }
    return output;
  }

  function placeholders(value) {
    const names = [];
    for (const match of String(value).matchAll(PLACEHOLDER_PATTERN)) names.push(match[1]);
    return [...new Set(names)].sort();
  }

  function audit(dictionaries, requiredLanguages = SUPPORTED_LANGUAGES) {
    const flattened = {};
    const errors = [];
    for (const language of requiredLanguages) {
      if (!dictionaries || !dictionaries[language]) {
        errors.push(`Missing locale: ${language}`);
        continue;
      }
      try { flattened[language] = flattenDictionary(dictionaries[language]); }
      catch (error) { errors.push(`${language}: ${error.message}`); }
    }
    const reference = flattened[requiredLanguages[0]] || {};
    const referenceKeys = Object.keys(reference).sort();
    for (const language of requiredLanguages.slice(1)) {
      const candidate = flattened[language] || {};
      const candidateKeys = Object.keys(candidate).sort();
      for (const key of referenceKeys) if (!(key in candidate)) errors.push(`${language}: missing key ${key}`);
      for (const key of candidateKeys) if (!(key in reference)) errors.push(`${language}: extra key ${key}`);
      for (const key of referenceKeys) {
        if (!(key in candidate)) continue;
        if (!candidate[key].trim()) errors.push(`${language}: empty value ${key}`);
        if (JSON.stringify(placeholders(reference[key])) !== JSON.stringify(placeholders(candidate[key]))) {
          errors.push(`${language}: placeholder mismatch ${key}`);
        }
      }
    }
    return Object.freeze({ ok: errors.length === 0, keys: referenceKeys.length, languages: [...requiredLanguages], errors: Object.freeze(errors) });
  }

  function normalizeLanguage(value, fallback = "it") {
    const normalized = String(value || "").trim().toLowerCase().split(/[-_]/)[0];
    return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : fallback;
  }

  function interpolate(template, params = {}) {
    return String(template).replace(PLACEHOLDER_PATTERN, (_match, name) => Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : `{${name}}`);
  }

  function create(options = {}) {
    const dictionaries = options.dictionaries || {};
    const report = audit(dictionaries);
    if (!report.ok) throw new Error(`Invalid locale dictionaries: ${report.errors.join("; ")}`);
    const flat = Object.fromEntries(SUPPORTED_LANGUAGES.map(language => [language, Object.freeze(flattenDictionary(dictionaries[language]))]));
    const fallbackLanguage = normalizeLanguage(options.fallbackLanguage, "it");
    let currentLanguage = normalizeLanguage(
      typeof options.readLanguage === "function" ? options.readLanguage() : options.initialLanguage,
      fallbackLanguage
    );

    function setLanguage(language, settings = {}) {
      const next = normalizeLanguage(language, fallbackLanguage);
      currentLanguage = next;
      if (settings.persist !== false && typeof options.writeLanguage === "function") options.writeLanguage(next);
      if (typeof options.onLanguageChanged === "function") options.onLanguageChanged(next);
      return next;
    }

    function translate(key, params = {}) {
      const id = String(key || "");
      const value = flat[currentLanguage][id] ?? flat[fallbackLanguage][id];
      if (value == null) {
        if (typeof options.onMissing === "function") options.onMissing(id, currentLanguage);
        return id;
      }
      return interpolate(value, params);
    }

    return Object.freeze({
      audit: () => report,
      availableLanguages: () => [...SUPPORTED_LANGUAGES],
      currentLanguage: () => currentLanguage,
      has: key => Object.prototype.hasOwnProperty.call(flat[currentLanguage], String(key || "")),
      setLanguage,
      t: translate
    });
  }

  return Object.freeze({ SUPPORTED_LANGUAGES, audit, create, flattenDictionary, interpolate, normalizeLanguage, placeholders });
})();

if (typeof module !== "undefined" && module.exports) module.exports = ArenaI18nCore;
