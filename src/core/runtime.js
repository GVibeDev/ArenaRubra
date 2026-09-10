"use strict";

// AR-AC1 legacy bridge: explicit action ports over the current authoritative
// implementations. UI callers may migrate one action at a time.
function arenaCreateLegacyActionHandlers() {
  const sameTarget = (left, right) => typeof sameCoord === "function" ? sameCoord(left, right) : JSON.stringify(left) === JSON.stringify(right);
  return {
    move: {
      validate:({unit,coord}) => Boolean(unit && Array.isArray(coord) && movableCells(unit).some(candidate => sameTarget(candidate,coord))) || "illegal_move",
      apply:({unit,coord}) => moveUnit(unit,coord)
    },
    attack: {
      validate:({attacker,defender}) => Boolean(attacker && defender && defender.alive !== false && canAttack(attacker) && areAdjacent(attacker.pos,defender.pos)) || "illegal_attack",
      apply:({attacker,defender}) => attackUnit(attacker,defender)
    },
    deploy: {
      validate:({blueprint,side,coord}) => Boolean(blueprint && Number(side)>0 && Array.isArray(coord) && spawnCellsFor(Number(side),blueprint).some(candidate => sameTarget(candidate,coord))) || "illegal_deployment",
      apply:({blueprint,side,coord,options}) => spawnUnit(blueprint,Number(side),coord,options||{})
    },
    build: {
      validate:({builder,blueprint,coord,options}) => {
        if (!blueprint || !Array.isArray(coord)) return "illegal_build";
        if (options && options.buildSource === "own_hq") return true;
        return Boolean(builder && buildableCells(builder).some(candidate => sameTarget(candidate,coord))) || "illegal_build";
      },
      apply:({builder,blueprint,coord,options}) => buildStructure(builder,blueprint,coord,options||{})
    },
    ability: {
      validate:({unit,target,ability}) => Boolean(unit && ability && canUseAbility(unit,ability) && abilityTargets(unit,ability).includes(target)) || "illegal_ability",
      apply:({unit,target,ability}) => useAbility(unit,target,ability)
    },
    tactic: {
      validate:({player,card}) => Boolean(card && canUseHandTacticCard(Number(player),card)) || "illegal_tactic",
      apply:({player,card,target}) => useHandTacticCard(Number(player),card,target)
    },
    end_turn: {
      validate:() => Boolean(state && !state.winner) || "match_finished",
      apply:({options}) => endTurn(options||{})
    }
  };
}

let ARENA_GAME_CORE = null;
function arenaGameCore() {
  if (!ARENA_GAME_CORE) {
    const actions = createGameActionService({ handlers:arenaCreateLegacyActionHandlers() });
    ARENA_GAME_CORE = createGameCoreService({
      normalizeSetup:(setup,dependencies) => ArenaSetupAdapter.normalize(setup,dependencies),
      createInitialState:setup => createInitialGameState(setup),
      chooseFirstPlayer:(players,rng,mode) => chooseFirstPlayer(players,rng,mode),
      getMapDefinition:id => getMapDefinitionById(id),
      actionService:actions,
      stateDomains:ArenaStateDomains
    });
  }
  return ARENA_GAME_CORE;
}

const GameCore = Object.freeze({
  createGame:(setup,options) => arenaGameCore().createGame(setup,options),
  validateAction:(action,context) => arenaGameCore().validateAction(action,context),
  applyAction:(action,context) => arenaGameCore().applyAction(action,context),
  actionTypes:() => [...arenaGameCore().actionTypes],
  stateDomains:ArenaStateDomains
});
