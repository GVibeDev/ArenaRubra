# C2e-4a1 – PS Support Gate / Anti-Suicide

Obiettivo: ridurre le contestazioni suicide dei PS, soprattutto da parte di unità leggere/Liberti isolate contro 2-3 nemici.

Modifiche AI:
- helper `botPsSupportScore`;
- helper `botPsSupportGatePenalty`;
- helper `botPsSupportGateBonus`;
- helper `botPsAdjacentStagingBonus`;
- penalità integrata in movimento generale, emergency move, home PS duty e scelta coordinate di deployment;
- selezione avanzata evita, quando possibile, il movimento su PS con gate penalty molto alto.

Perimetro: AI only. Nessuna modifica a regole, stat, carte, economia o UI.
