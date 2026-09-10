"use strict";

// AR-AC1 canonical action contract. It validates the transport envelope and
// delegates domain legality/application to explicit ports without knowing DOM.
function createGameActionService(options = {}) {
  const handlers = options.handlers && typeof options.handlers === "object" ? options.handlers : {};
  const knownTypes = Object.freeze(Object.keys(handlers).sort());

  function normalizeAction(rawAction) {
    if (!rawAction || typeof rawAction !== "object" || Array.isArray(rawAction)) {
      return { ok:false, reason:"action_object_required", action:null };
    }
    const type = String(rawAction.type || "").trim().toLowerCase();
    if (!type) return { ok:false, reason:"action_type_required", action:null };
    const payload = rawAction.payload && typeof rawAction.payload === "object" && !Array.isArray(rawAction.payload)
      ? rawAction.payload
      : {};
    return { ok:true, reason:null, action:Object.freeze({ type, payload }) };
  }

  function validate(rawAction, context = {}) {
    const normalized = normalizeAction(rawAction);
    if (!normalized.ok) return normalized;
    const handler = handlers[normalized.action.type];
    if (!handler || typeof handler.apply !== "function") {
      return { ok:false, reason:"unknown_action_type", action:normalized.action };
    }
    if (typeof handler.validate !== "function") {
      return { ok:true, reason:null, action:normalized.action };
    }
    const result = handler.validate(normalized.action.payload, context, normalized.action);
    if (result === true || result == null) return { ok:true, reason:null, action:normalized.action };
    if (result === false) return { ok:false, reason:"domain_rejected", action:normalized.action };
    if (typeof result === "string") return { ok:false, reason:result, action:normalized.action };
    if (result && typeof result === "object") {
      return { ok:result.ok !== false, reason:result.reason || null, action:normalized.action, details:result.details || null };
    }
    return { ok:false, reason:"invalid_validator_result", action:normalized.action };
  }

  function apply(rawAction, context = {}) {
    const validation = validate(rawAction, context);
    if (!validation.ok) return Object.freeze({ ...validation, applied:false, result:null });
    const handler = handlers[validation.action.type];
    const result = handler.apply(validation.action.payload, context, validation.action);
    return Object.freeze({ ...validation, applied:result !== false, result:result === undefined ? null : result });
  }

  return Object.freeze({ knownTypes, normalizeAction, validate, apply });
}
