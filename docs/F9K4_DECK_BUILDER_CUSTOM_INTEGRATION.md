# F9K4 – Deck Builder Custom Integration

Base: `C2-STABLE-1-F9K3c-APK-M4c`.

## Scopo
Integrare le carte custom salvate dal Card Editor nel Deck Builder, ma solo dietro toggle esplicito e senza contaminarle con il flusso ufficiale Starter/Setup.

## Nuovo toggle
Nel Deck Builder è stato aggiunto:

`Includi carte CUSTOM nel pool`

Quando il toggle è disattivato:
- il pool resta ufficiale;
- il template automatico resta ufficiale;
- i deck salvati sono compatibili con Setup standard.

Quando il toggle è attivato:
- il pool include anche le carte custom salvate in `arenaRubra.customCards.v1`;
- le carte custom sono aggiungibili manualmente;
- ogni riga custom mostra badge `CUSTOM`;
- il draft che contiene custom viene marcato `NON UFFICIALE`.

## Separazione ufficiale/custom
I deck con custom vengono salvati su chiave separata:

`Fazione::Comandante::CUSTOM`

I deck ufficiali restano su:

`Fazione::Comandante`

Questo impedisce ai deck custom di sovrascrivere il deck ufficiale usato dal SetupScreen.

## Runtime standard
Il Setup/runtime standard continua a validare solo deck ufficiali. Un deck che contiene custom viene considerato non ufficiale ed è demandato a F9K5 Custom Match Test Lab.

## Non modificato
- gameplay
- AI
- deck rules freeze
- bilanciamento
- Card Editor data model
- Card Pool
- custom art
- coordinate renderer F9K2d
- Starter Logic Freeze
