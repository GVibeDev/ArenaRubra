ARENA RUBRA — F9W2a CANDIDATE PATCH OVERWRITE
==============================================

Milestone
  C2-STABLE-1-F9W2a-APK-M4c
  Player / DEV Runtime Profile Foundation

Base richiesta
  C2-STABLE-1-F9W1a-APK-M4c VALIDATA

Applicazione
  Sovrascrivere i file della baseline F9W1a mantenendo la stessa struttura cartelle.

Scopo
  Avvia S2-C4 formalizzando un unico runtime Arena Rubra con due profili di
  esposizione: DEV e Demo / Distribution. Nessun fork della logica di gioco.

Profilo DEV
  - gioco / Tutorial / Challenge
  - Deck Builder / Pool carte
  - Card Editor
  - Map Editor / custom maps / Match Lab
  - Statistiche e Cronologia
  - Telemetria raw e Log tecnico
  - Debug / Precheck / diagnostica
  - Expert AI sperimentale
  - full vault Import / Export
  - Layout Calibration Lab
  - Renderer Calibration Lab

Profilo Demo / Distribution
  - gioco / Tutorial / Challenge
  - Deck Builder / Pool carte
  - mappe ufficiali
  - Statistiche Player / Cronologia
  - Impostazioni / Versione
  - NASCONDE e GUARDA gli entrypoint di Card Editor, Map Editor, custom maps,
    Telemetria raw, Log tecnico, Debug, Expert, full vault e calibratori.
  - Il pulsante Statistiche del Result Modal resta Player-facing; Log e
    Telemetria non vengono esposti.

Contratto build
  Questa candidata parte in DEV ed è switchabile dalle Impostazioni per poter
  testare entrambe le superfici nello stesso runtime.

  BUILD_INFO.productProfileDefault = "dev"
  BUILD_INFO.productProfileSwitchable = true

  Una futura build pubblica potrà usare:

  productProfileDefault = "distribution"
  productProfileSwitchable = false

  In questo caso la preferenza locale DEV non può riattivare il profilo di
  sviluppo. Questo è un contratto di esposizione prodotto, non un sandbox di
  sicurezza: il codice DEV continua intenzionalmente a esistere nella codebase.

Preservazione strumenti DEV
  Il codice dei due calibratori era ancora presente nella baseline F9W1a, ma
  la raggiungibilità non era più sufficientemente esplicita. F9W2a li rende
  strumenti DEV permanenti:

  - Debug -> Apri Layout Calibration Lab
  - Debug -> Apri Renderer Calibration Lab

  Inoltre le letture/scritture dei due store di calibrazione passano dal facade
  arenaStorage quando disponibile, mantenendo OPFS / IndexedDB / localStorage
  coerenti con il Data Vault.

Invarianti
  Nessuna modifica a:
  - regole e condizioni di vittoria;
  - carte, roster, costi, deck, ENE;
  - mappe ufficiali e terreni;
  - Missioni;
  - AI di gioco / decisioni Expert;
  - QG / PS / Pressione;
  - Tutorial Action Contract e contenuti F9V4a;
  - MatchRecord / MatchTelemetry F9W1a.

Nota roadmap
  Il sistema di temi menu NON fa parte di F9W2a: resta la fase immediatamente
  successiva alla fondazione Player/DEV, così il tema viene costruito sopra un
  profilo prodotto già stabile.

Test automatici eseguiti in ambiente patch-only
  PASS  node --check src/ui.js
  PASS  node --check src/build_info.js
  PASS  tests/f9w2a_product_profile_smoke.js
  PASS  tests/f9w2a_profile_static_smoke.js
  PASS  tests/f9w1a_match_data_v2_smoke.js
  PASS  python -m py_compile tests/f9w2a_browser_product_profile_smoke.py

Browser E2E
  Preparato tests/f9w2a_browser_product_profile_smoke.py.
  Non eseguito nel container patch-only perché il pacchetto overwrite non
  contiene index.html, CSS, asset e l'intero checkout. Eseguirlo sul progetto
  completo è parte del gate manuale.
