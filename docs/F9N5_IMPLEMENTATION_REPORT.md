# C2-STABLE-1-F9N5-APK-M4c

## Contratto implementato

- Con Missione: apertura da cinque carte composta da Missione, Comandante e tre carte ordinarie.
- Senza Missione: Comandante e quattro carte ordinarie.
- Missione e Comandante protetti centralmente da scarto imposto, furto, copia e trasferimento.
- Il Comandante può essere normalmente consumato quando viene giocato dalla propria mano.
- Il blocco temporaneo non viene impedito dalla protezione.
- La Missione non rivelata è nascosta nelle viste della mano non appartenenti a un giocatore umano attivo.
- Se il deck è vuoto e in mano resta soltanto la Missione, il recupero standard non va in softlock.

## Limiti intenzionali

- La Missione non è ancora giocabile.
- Non esistono ancora tracker, progressi, rivelazione effettiva o ricompense.
- Il recupero completo Missione + 4 carte, il reset del ciclo e il blocco fino al turno successivo restano in F9N10.

## Verifica manuale consigliata

1. Avviare un deck 29 + 1 e verificare Missione + Comandante + 3 carte.
2. Avviare un deck da 30 senza Missione e verificare Comandante + 4 carte.
3. Confermare che una Missione del bot appaia come carta nascosta.
4. Giocare il Comandante e verificare che venga consumato normalmente.
5. Provare uno scarto casuale Fabeot: deve scegliere soltanto carte ordinarie.
6. Provare copia/furto con una mano contenente solo Missione e Comandante: l'effetto non deve acquisire carte.
7. Provare Embargo: deve poter bloccare anche Missione e Comandante.
