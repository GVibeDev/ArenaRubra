# Arena Rubra Starter 1.0 — English Rulebook

Status: rules content frozen for Desktop/Web. This document describes the Starter 1.0 runtime; if anything diverges, the frozen manifest and runtime rule services are authoritative.

## Goal and players

Arena Rubra is a turn-based, free-for-all strategy game for 2–4 human and/or bot players. Each player chooses a faction, a commander and a valid deck; the selected map must support exactly the configured player count.

## Setup

- Each player starts with 3 ENE.
- A regulation deck contains 30 cards. The initial hand contains 5 cards and includes the commander; when the deck has a Mission, the Mission is included according to the runtime contract.
- The faction's three Starter cards — Infantry, Vehicle and Structure — remain in a separate reusable reserve. Their cost and all placement rules still apply.
- Headquarters (HQ) is an empty, occupiable objective cell. Normal deployment is on the HQ or an empty cell adjacent to the HQ or an allied building; abilities and traits may modify this rule.

## Turn flow

At the start of a player's turn, statuses and effects resolve, income is awarded and — except on that player's first turn — one card is drawn. Base income is 3 ENE plus controlled Strategic Points (SP), modified by effects and doctrines.

Each ready unit may normally move and/or perform the action allowed by its type, traits and current state. Infantry and Commanders can normally act after moving; Vehicles and Structures follow the limits shown by the interface and cards. Attacks, abilities, building and tactics consume the displayed action or resources. A turn ends manually or when the runtime detects no remaining actions.

## Combat, SP and resources

- ATK is offensive strength; DEF absorbs damage before HP unless an effect deals direct damage; a unit at 0 HP is removed.
- An unlocked SP is controlled by the player occupying its cell with a valid unit.
- Hand size is capped at 10. Draws beyond the cap go directly to the discard pile.
- When the deck and ordinary hand cards are exhausted and the discard pile is not empty, recovery costs 5 ENE: shuffle the discard pile into the deck and draw 3. A Mission cycle follows its specific runtime contract.

## Pace and limits

Standard: Pressure begins on round `20 + ceil((SP + players) / 2)`, victory requires 7 increments, round limit 50, base Vehicle movement 1, light-unit cap 10.

Quick/Competitive: Pressure begins on round 20, victory requires 5 increments, round limit `30 + ceil((SP + players) / 2)`, base Vehicle movement 2, light-unit cap 5 (7 for Liberti).

The map movement multiplier applies to base movement. General caps: 1 Commander, 2 Heavy copies per blueprint, 1 non-Structure Elite/Pivot per blueprint. Deck Structures have no general cap. Tactical scale allows at most 2 living Starter Structures per player; Large Scale does not apply that dedicated cap.

## Victory conditions

1. **HQ conquest:** occupy an enemy HQ with your unit while controlling at least one SP. The defender is eliminated; in multiplayer, the last active player wins.
2. **Strategic Pressure:** at round end, exactly one player must control the designated central SP and at least `ceil(total SP / 2)` SP overall. That player gains one Pressure point; reaching the pace threshold wins.
3. **Round limit:** tiebreak in this order: most controlled SP, most units in play, most unspent ENE. A complete tie is a technical draw.
4. **Concession or technical resignation:** the player is eliminated; the last-active-player rule still applies.

## Missions and information

Missions are public in the digital runtime. Progress, rewards and pending choices are resolved through the interface; a pending Mission reward must be completed before ending the turn. Opponent hands remain hidden except for public cards or effects that grant information.

## Artificial intelligence

Advanced is the highest official Starter 1.0 level. Expert is a DEV/experimental feature, is excluded from the Distribution profile and is not a public product promise.

## Maps and numeric data

The generated `STARTER_1_0_STATISTICS_REGISTER.md` contains the actual official map list, dimensions, SP totals, movement multipliers and every frozen count. Two disabled legacy maps remain available only for save compatibility.

