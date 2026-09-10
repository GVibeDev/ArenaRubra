"use strict";

// AR-AC1 DOM-free game construction facade. Runtime/UI initialization remains
// in newGame(); this service owns only setup -> initial authoritative state.
function createGameCoreService(dependencies = {}) {
  const {
    normalizeSetup,
    createInitialState,
    chooseFirstPlayer,
    getMapDefinition,
    actionService,
    stateDomains
  } = dependencies;

  function createGame(rawSetup = {}, options = {}) {
    const raw = rawSetup && typeof rawSetup === "object" ? rawSetup : {};
    const normalized = normalizeSetup(raw, { getMapDefinitionById:getMapDefinition });
    const setup = { ...raw, ...normalized };
    const firstPlayer = setup.firstPlayer != null
      ? Number(setup.firstPlayer)
      : chooseFirstPlayer(setup.playerIds, options.rngController || null, setup.initiativeMode || options.initiativeMode || null);
    return createInitialState({ ...setup, firstPlayer });
  }

  function validateAction(action, context = {}) {
    return actionService.validate(action, context);
  }

  function applyAction(action, context = {}) {
    return actionService.apply(action, context);
  }

  return Object.freeze({
    createGame,
    validateAction,
    applyAction,
    actionTypes:actionService.knownTypes,
    stateDomains
  });
}
