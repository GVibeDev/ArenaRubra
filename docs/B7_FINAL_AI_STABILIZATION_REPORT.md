# B7-final – AI stabilization report

## Syntax
- JavaScript combined `node --check`: OK

## Function definitions
- Duplicate function definitions: none
- `main.js` function count: 27
- `src/ai.js` function count: 71
- Primary AI functions missing from `src/ai.js`: none
- Primary AI functions still defined in `main.js`: none

## Nexus data hotfix retention
- Avatex entry found: True
- Avatex is Comandante: True
- Avatex id NXCMD01: True
- Nexus commander count static: 1
- Nodo Comando Nexus entry found: True
- Nodo type Struttura: True
- Nodo role command_node: True
- Nodo att:0: True
- Nodo canAttack:false: True
- Protocollo Ripristino retained: True

## Data/precheck static checks
- Blueprint count static: 42
- Duplicate blueprint IDs: none
- Structures with ATT > 0: none
- Precheck accepts weight `Leggero`: True
- Precheck accepts enemy `incomeDelta`: True

## Remaining `main.js` functions

```text
normalizeBlueprints
capGroupForBlueprint
validateDataModel
newGame
chooseFirstPlayer
staticLimitLabel
unitCardHtml
handleCellClick
toggleAbilityMode
passUnit
postActionChecks
endTurn
startTurn
applyStartTurnStatuses
applyEndTurnStatuses
applyAgathoiIdleGuardThorns
doctrineSummary
unitStatusSummary
statusPillsHtml
hasAnyInhibition
endUnitAction
clearSelection
isAttackTarget
isAbilityTarget
adjacentAlliedAuras
attackAuraBonus
defenseAuraBonus
```

## Note

This is a stabilization pass. Browser playtests are still required for runtime behavior, especially bot-vs-bot and turn closure.