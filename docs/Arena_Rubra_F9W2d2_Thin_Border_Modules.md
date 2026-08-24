# Arena Rubra — F9W2d2 Thin Border Modules & Ornament Simplification

## Baseline

- Baseline validata: `C2-STABLE-1-F9W2d1-APK-M4c`
- Build candidata: `C2-STABLE-1-F9W2d2-APK-M4c`
- Build name: `Thin Border Modules & Ornament Simplification`
- Channel: `starter2-ui-border-modules-w2d2`
- Logic baseline: `C2-STABLE-1-F9T2c4-APK-M4c`

## Diagnosi

Il set `ASSET 0.2 UI Agathoi` presente su `main` è stato ridotto manualmente al bordo esterno.
I nuovi side module sono molto più sottili dei crop originari: il top corrente è 520×16 px e
il left corrente è 13×520 px. Il renderer F9W2d/F9W2d1 continuava però a forzare i lati a
44 px di spessore, producendo un ingrandimento visivo eccessivo.

## Contratto F9W2d2

La decorazione UI viene semplificata a **8 moduli** per tema:

- corner TL;
- corner TR;
- corner BL;
- corner BR;
- side TOP;
- side RIGHT;
- side BOTTOM;
- side LEFT.

`crest` e `divider` non vengono più referenziati o renderizzati. I file eventualmente ancora
presenti nel repository sono innocui e possono essere rimossi durante il futuro asset freeze.

## Scala dei moduli

Il dimensionamento non è più hardcoded come 76 px / 44 px. Vengono introdotti token espliciti:

- corner: `48px`;
- lati orizzontali: `16px`;
- lati verticali: `14px`.

I token sono gestiti dal theme slot e potranno essere ritoccati senza riscrivere il layer CSS.

## Protezione asset manuali

La patch F9W2d2 **non contiene asset ornamentali**. Non sovrascrive quindi il set Agathoi
corretto manualmente né le future revisioni delle altre fazioni.

## Invarianti

Restano invariati:

- material texture layer e correzione Agathoi F9W2d1;
- scrolling nativo ripristinato da F9W2d1;
- tema globale e tema contestuale durante il match;
- board / map presentation;
- gameplay, AI, Match Data, Player/DEV, Tutorial Runtime.
