# C2c-4b – Unit Ability Compatibility Pass

## Obiettivo

Recuperare e consolidare le abilità unità già compatibili con gli effetti implementati fino a C2c-4a-fix, evitando di aprire sistemi futuri come movimento/celle, conversione, furto mano o reazioni.

## Base

Base di partenza: `arena_rubra_C2c_4a_fix_recovered_playability_hpmax.zip`.

C2c-4a-fix è considerata validata.

## Abilità incluse/confermate

### Nexus – Fante Robot / Visione

Visione era già funzionante tramite `tags:["vision"]` e abilità passiva `passiveTag`.
La patch aggiorna la descrizione dati rimuovendo il vecchio placeholder.

Effetto: le unità con Visione entro R2 permettono di rilevare/aggirare Furtivo nel targeting nemico.

### Fabeot – Spia Silente / Furtivo + pesca

La Spia Silente entra già con `startStatuses:[{kind:"stealth"}]` e possiede `stealthDraw:true`.
La patch aggiorna la descrizione dati rimuovendo il vecchio placeholder.

Effetto: se almeno una Spia Silente resta Furtiva a inizio turno, il giocatore Fabeot pesca +1 carta totale.

### Exordium – Torretta Lanciafiamme / Getto Lanciafiamme

`flameArea` viene irrobustita:
- fallisce in modo esplicito se il bersaglio non è valido;
- colpisce il bersaglio e fino a 2 unità nemiche adiacenti valide;
- non include bersagli non validi/non bersagliabili da abilità;
- produce un log più chiaro.

### Agathoi – Selva Simbiotica / Manto della Selva

Confermata compatibilità con `agathoiShroud` e status `untargetable`.

### Agathoi – Domos Cosmico / Velo del Domos

Confermata compatibilità con `abilityUntargetable` e status `ability_untargetable`.
Il fallimento su target non valido ora produce log esplicito.

### Agathoi – Demagos Verde / Mandato del Demagos

Confermata compatibilità con `armorThorns`, DEF a perdere e Spine.

### Nexus – Corazzato Assalto / Assetto Impermeabile

Confermata compatibilità con `enemy_effect_immune`.

## Esclusioni volontarie

Non sono state implementate in questo step:
- Rilascio Mina / mine: C2c-5 movimento e celle;
- Traslazione Karyon / Dislocazione Locale: C2c-5 movimento e celle;
- Esproprio di Mano, Contratto Capestro, Embargo: C2c-7 mano/furto;
- Corruzione e conversioni avanzate: C2c-7;
- Agguato Preparato e attacchi opportunità: C2c-8 reazioni.

## File toccati

- `data/units_base.js`
- `src/abilities.js`
- `src/precheck.js`
- `README.md`
- `docs/C2C_4B_UNIT_ABILITY_COMPATIBILITY_PASS.md`
- `docs/CHECK_C2C_4B.txt`
