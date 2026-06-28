# C2-FINAL-B3 – Liberti Numerical / Faction Rules Balance Pass

## Obiettivo

Ridurre la sovrapposizione gratuita di stat alte, Superiorità Numerica e Sanguinamento nei Liberti, senza aggiungere nuove meccaniche e senza cambiare effetti/tattiche.

## Regola di bilanciamento

- Unità leggere/pesanti: Superiorità Numerica **oppure** Sanguinamento.
- Elite, comandante e pivot: possono mantenere entrambe.
- Le unità da Sanguinamento hanno ATT più basso.
- Le tattiche restano il modo pagato per accendere eccezioni e picchi di valore.

## Modifiche tecniche

- `normalizeBlueprints()` non aggiunge più automaticamente entrambe le regole Liberti.
- `numericalSuperiorityBonus()` usa `factionRules`.
- Il Sanguinamento automatico da attacco base usa `factionRules`.
- Anche gli attacchi di reazione rispettano le nuove regole.
- UI e roster mostrano solo le regole realmente presenti.

## Modifiche unità Liberti

### Solo Superiorità Numerica

- Miliziano Liberto
- Predone Liberto
- Buggy Predone
- Avanguardia Liberta
- Buggy Demolitore
- Predone cacciacarri
- Predone corazzato
- Buggy da Sbarco
- Ariete Liberto

### Solo Sanguinamento

- Moto Guerriglia: ATT 2 → 1
- Predone Sanguis: ATT 3 → 2

### Entrambe le regole

- Carro Recuperato Titanus: ATT 5 → 4; Speronata Brutale costo 1 ENE.
- Bestia della Fossa: ATT 4 → 3.
- Capobanda Liberto: invariato, rimandato al futuro pass comandanti.

## Non modificato

- Tattiche Liberti.
- Spawn tattici.
- Cap mano / recupero deck / income 3.
- Nexus ed Exordium B1/B2.
- AI tattiche C2.
