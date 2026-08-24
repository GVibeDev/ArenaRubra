# Arena Rubra — F9W2d1 UI Scroll & Agathoi Material Hotfix

## Baseline

- Base di correzione: `C2-STABLE-1-F9W2d-APK-M4c`
- Build candidata: `C2-STABLE-1-F9W2d1-APK-M4c`
- Build name: `UI Scroll & Agathoi Material Hotfix`
- Channel: `starter2-ui-material-hotfix-w2d1`
- Logic baseline: `C2-STABLE-1-F9T2c4-APK-M4c`

## Problema scroll

F9W2d aggiungeva al layer ornamentale una regola comune:

`overflow:hidden`

sui contenitori annotati come shell/panel/header e su vari pannelli di gioco.

Questa regola sovrascriveva la policy di overflow già definita dal CSS dell'applicazione.
In particolare Setup/Nuova partita e Deck Builder usano contenitori con `max-height` e
`overflow:auto`, mentre altre schermate e il Control Center delegano lo scroll al proprio
screen/body dedicato.

F9W2d1 rimuove quindi qualunque override globale dell'overflow dal layer decorativo.
La decorazione continua a essere contenuta tramite `border-radius:inherit` applicato ai
pseudo-elementi, senza cambiare la policy di scrolling del componente sottostante.

Questo fix è volutamente generale: non corregge soltanto Setup, ma evita che la skin
possa disabilitare scroll nativo anche su altri menu/pannelli.

## Agathoi

Il materiale Agathoi derivato dallo sfondo pagina risultava molto più luminoso delle
altre texture. F9W2d1:

- attenua la luminanza del solo `material.webp` Agathoi;
- sostituisce l'overlay chiaro con un velo verde più neutro/scuro;
- mantiene i token di contrasto e tutti gli slot ornamentali invariati.

Mean luma del materiale hotfix: circa `0.55` contro circa `0.81` del materiale F9W2d.

## Protezione degli asset manuali

Questa patch NON include né sovrascrive corner, edge, divider o crest delle cinque fazioni.
È intenzionale: eventuali correzioni manuali agli asset ornamentali possono essere mantenute
durante il test del fix.

## Invarianti

Nessuna modifica a gameplay, AI, mappe, Match Data, Tutorial Action Contract,
Player/DEV profile o `presentation_theme`.
