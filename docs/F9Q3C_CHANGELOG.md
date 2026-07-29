# Arena Rubra — Changelog F9Q3c

Build candidata: `C2-STABLE-1-F9Q3c-APK-M4c`
Baseline validata: `C2-STABLE-1-F9Q3b-APK-M4c`

## Aggiunto

- Modulo `src/map_backgrounds.js` per importazione, persistenza, risoluzione e applicazione degli sfondi custom.
- Salvataggio Blob degli sfondi nel Local Data Vault.
- Rimozione Blob tramite `ArenaDataStore.removeBlob()`.
- Pannello “Sfondo personalizzato” nell’editor mappe.
- Controlli `cover`, `contain`, `native`, opacità, scala e offset X/Y.
- Preview dello sfondo dentro la superficie SVG dell’editor.
- Applicazione dello sfondo custom durante partita e Match Lab.
- Export JSON leggero con riferimento locale.
- Export JSON portatile con immagine incorporata.
- Import compatibile con entrambi i formati.
- Diagnostica/fallback quando l’asset non è disponibile.
- Test Node e browser dedicati a F9Q3c.

## Modificato

- Normalizzazione `presentation` nello schema mappe.
- Export standard delle mappe per escludere i dati binari inline.
- Map Editor per gestione lifecycle degli object URL e cancellazione asset.
- Map Skin/Presentation Theme per evitare race fra skin ufficiale e sfondo custom.
- UI e CSS dell’editor.
- Build info e marker della candidata.

## Non modificato

- Pressione e regole F9Q3b.
- Terreni e costi movimento.
- IA e targeting.
- Missioni.
- Carte, deck ufficiali e bilanciamento.
- Tutorial e relativi testi/passaggi.
- Geometria delle mappe integrate.
