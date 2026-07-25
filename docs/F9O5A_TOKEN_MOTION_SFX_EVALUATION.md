# F9O5a — Token Motion & SFX Evaluation

Baseline logica: C2-STABLE-1-F9O5-APK-M4c.

## Scelta tecnica

La build mantiene miniature statiche e renderer DOM incrementale. Non introduce WebGL e
non richiede spritesheet individuali. Gli eventi del motore alimentano un layer FX separato.

## Eventi visuali

- UNIT_ATTACKED: rinculo interno del token e tracciante verso il bersaglio.
- UNIT_DAMAGED: burst di impatto, con variante sanguinamento.
- UNIT_DESTROYED: ghost della miniatura e burst di distruzione.
- ABILITY_USED: impulso sul lanciatore e, quando disponibile, sul bersaglio.

## Profili riutilizzabili

ballistic_light, ballistic_heavy, energy, organic, occult, structure, support, melee.

## Controlli

FX token: ON / RIDOTTI / OFF, persistente.
SFX: ON / OFF e volume 0–100, persistente, default 38%.

Gli SFX F9O5a sono sintetici tramite Web Audio e sono limitati a cinque voci con rate limit,
per evitare cacofonia nei turni bot. La cartella assets/audio/sfx è predisposta per campioni
futuri, ma non viene ancora caricata automaticamente.

## Fuori ambito

- nessun WebGL;
- nessun spritesheet massivo;
- nessuna animazione idle continua;
- nessun cambiamento a gameplay, IA, camera, timing dei turni o asset miniature.
