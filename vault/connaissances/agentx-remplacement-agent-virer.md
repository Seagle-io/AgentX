---
titre: Remplacement d'un agent KO (virer → remplaçante)
resume: virer crée la remplaçante ; pack à corriger avant lint ; 2e renvoi → opus
source: agentx-entreprise T026, T030, T032
cree: 2026-10-15
tags: [note, agentx, process]
---

# Remplacement d'un agent KO

## Fait
- `./bin/agentx virer <T> --motif "<1 ligne>" --projet X` → T rejete, remplaçante `remplace: T`, pack copié.
- lint bloque tant que le pack copié n'est pas corrigé (règle 4).
- renvoi 1 : corriger le manque nommé dans le motif (T026 : coupe env.md § Environnement).
- renvoi 2 de la même lignée : modèle opus (T032 retenu après T026 → T030 → T032).
- T030 renvoyé : bloc de code non fermé (manques 33 %) → `pack-lint` contrôle les fences.
- défauts connus : `--motif -x` lu comme option (émettre `--motif=`) ; « Seule source de vérité de l'agent Txxx » non renuméroté.

## Pourquoi ça compte
- corriger le pack, pas l'agent : même pack ⇒ même échec.
- 2 renvois = signal de pack à découper, pas de modèle seul.

## Où
- `bin/vx.py:395-405` — création remplaçante (`_pack_remplacant`)
- `./bin/agentx personnel` — taux de renvoi par rôle

## Voir aussi
- [[evaluer-sur-instantane]]
