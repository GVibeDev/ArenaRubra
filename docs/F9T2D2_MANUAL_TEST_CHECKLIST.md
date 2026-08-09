# Checklist manuale — F9T2d2

## Preparazione

- [ ] Verificare build `C2-STABLE-1-F9T2d2-APK-M4c`.
- [ ] Verificare baseline logica `C2-STABLE-1-F9T2c4-APK-M4c`.
- [ ] Selezionare IA Expert e deck Exordium `Breccia Cremisi`.
- [ ] Esportare log e telemetria completi.

## Caso A — falso candidato non perforante

Preparare un presidio su PS con DEF residua e HP tali che la somma nominale dell'ATT sembri sufficiente, ma l'eccesso contro la DEF venga perso.

- [ ] Il candidato Clear viene respinto.
- [ ] `predictedTargetDestroyed = false`.
- [ ] La ragione è `insufficient_hp_damage_after_def_break` oppure `no_effective_kill_sequence`.
- [ ] Nessuna azione viene riservata inutilmente.

Caso di riferimento:

```text
attaccante ATT 4
bersaglio DEF 1, HP 3
risultato corretto: DEF 0, HP 3, bersaglio vivo
```

## Caso B — sequenza letale in due attacchi

- [ ] Il primo attaccante rimuove la DEF senza danneggiare gli HP.
- [ ] Il secondo attaccante colpisce gli HP.
- [ ] Il piano registra due attaccanti nell'ordine corretto.
- [ ] Il bersaglio viene eliminato.
- [ ] `clearPredictionMatched = true`.
- [ ] Il PS viene occupato o fortificato tramite commitment F9T2c4.

## Caso C — tre attaccanti

- [ ] La sequenza usa al massimo tre attaccanti.
- [ ] Il candidato viene respinto quando servirebbe un quarto attacco.
- [ ] Nessun attaccante estraneo viene consumato.

## Caso D — attaccante indisponibile

- [ ] Un attaccante richiesto diventa indisponibile prima del proprio passo.
- [ ] Avviene al massimo una ricomposizione bounded.
- [ ] La nuova sequenza usa lo stato corrente DEF/HP.
- [ ] Se resta letale, il piano prosegue.
- [ ] Se non resta letale, il piano abortisce con ragione esplicita.

## Caso E — bersaglio eliminato in anticipo

- [ ] Il fallback o un attore precedente elimina il presidio.
- [ ] Gli attacchi residui vengono saltati.
- [ ] Il commitment occupa o fortifica il PS.
- [ ] Nessun falso aborto `turn_ended_before_completion`.

## Telemetria

- [ ] `clearPredictedDefDamage` coincide con la previsione.
- [ ] `clearPredictedHpDamage` coincide con la previsione.
- [ ] `clearActualDefDamage` e `clearActualHpDamage` sono coerenti col log.
- [ ] `clearRequiredAttackerIds` e `clearExecutedAttackerIds` sono distinguibili.
- [ ] `clearPredictionMatched` è autorevole.
- [ ] Scanner e rejection counts restano riconciliati.
- [ ] Ogni turno rispetta `stored = len(decisions)` e `total = stored + dropped`.

## Regressioni

- [ ] Varran usa Ordine soltanto con danno marginale reale.
- [ ] Bastion Relay completa la sequenza legale.
- [ ] Survival Check attraversa tutte le costruzioni su PS.
- [ ] Forward Pivot conserva candidato, deployment e memoria d'impatto.
- [ ] Bootstrap valido con iniziativa G1 e G2.
- [ ] Nessun budget exhaustion del modulo Expert.
- [ ] Nessun errore pagina o console.

## APK

- [ ] Avvio su dispositivo reale.
- [ ] Match lungo completato senza blocchi.
- [ ] Esportazione log e telemetria riuscita.
- [ ] Nessuna regressione touch o UI nei pannelli principali.
