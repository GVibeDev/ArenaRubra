# Arena Rubra - F9W2d4 Repository Repair & Right Inspector Hotfix

Il tool V2 riconosce anche le 25 modifiche locali EOL rilevate nel report
`F9W2d4_GIT_DIAGNOSTIC_20260827_014735.txt`.

Prima di ripristinarle verifica due condizioni:
1. l'elenco dei file deve coincidere esattamente col report;
2. `git diff --ignore-space-at-eol` deve risultare vuoto.

Solo in quel caso ripristina quei file a HEAD e prosegue.

Il commit estraneo `3c8cad461921b7c4b2ded7a970b019c2a6a24c9e` viene poi annullato con
`git revert --no-commit`. La storia non viene riscritta.

Su Desktop/Web `selectedUnitFloat` viene ancorato al viewport sul lato destro.
La preview `selectedUnitCardPreviewCanvas` sale a un massimo di 370 px.
Mobile M4 resta invariato.