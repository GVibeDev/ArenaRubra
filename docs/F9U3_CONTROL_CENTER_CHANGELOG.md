# Arena Rubra — F9U3 Control Center

Build candidata: `C2-STABLE-1-F9U3-APK-M4c`  
Baseline logica: `C2-STABLE-1-F9U2b-APK-M4c`  
Schema telemetrico conservato: `F9Q3e1-2`

## Obiettivo

Trasformare il menu principale nel Centro di controllo dell’applicazione, senza modificare gameplay o contenuti dati.

## Implementazione

### Cinque aree centrali

- **Gioca**: Nuova partita, Tutorial, Riprendi.
- **Carte e deck**: Deck Builder, Pool carte, Card Editor.
- **Mappe**: Archivio mappe, Map Editor.
- **Analisi**: Statistiche, Cronologia, Telemetria, Log.
- **Sistema**: Versione, Impostazioni, Debug, Import/Export.

### Stato applicazione

La plancia mostra dati calcolati dalle fonti runtime esistenti:

- versione completa e nome build da `BUILD_INFO`;
- baseline logica dichiarata;
- schema telemetrico runtime/storico con fallback `F9Q3e1-2`;
- numero deck ufficiali da `BUILTIN_DECKS`;
- numero mappe ufficiali attive da `getBuiltinMapDefinitions()`;
- spazio archivio tramite `navigator.storage.estimate()` con fallback alla dimensione JSON delle chiavi riconosciute;
- ultimo match registrato;
- errori e avvisi diagnostici.

### Pannelli

- Archivio mappe con validazione e accesso diretto a Setup/Editor.
- Statistiche, Cronologia, Telemetria e Log con export/copia.
- Versione e note build.
- Impostazioni che riusano i controlli audio, SFX, animazioni carte e FX miniature esistenti.
- Debug completo con precheck, backend storage, migrazione, errori runtime, copia/export e Layout Calibration Lab.
- Import/Export versionato del vault; backup di sicurezza prima del ripristino e filtro delle chiavi non riconosciute.

### Modalità sviluppatore

La candidata `f9u3-candidate` abilita Debug per impostazione predefinita. Il valore è persistente nelle impostazioni del vault; quando disattivato nasconde Debug e gli elementi marcati come strumenti di sviluppo.

## Fuori ambito

Nessuna modifica a:

- regole e calcolo partita;
- statistiche delle carte;
- 50 deck ufficiali;
- geometria o regole delle mappe;
- IA, targeting, Missioni e Pressione;
- bilanciamento;
- schema telemetrico `F9Q3e1-2`.
