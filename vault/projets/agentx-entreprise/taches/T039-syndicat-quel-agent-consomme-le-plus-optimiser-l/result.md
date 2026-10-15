---
tache: T039
projet: agentx-entreprise
statut: fait
---
## Livré
- vault/syndicat/2026-10-16-tokens.md — 309 agents + 15 sessions chef mesurés, 10 revendications
- .cache/syndicat-T039/tokens.py — lecture seule, stdlib, 1,5 s ; sorties agents.csv · chef.csv · chef_appels.csv · outils.csv · journal_renvois.csv · erreurs.txt
- .cache/syndicat-T039/analyse{,2,3,4}.py — agrégats (lecture des CSV)

## Vérifié comment
`python3 .cache/syndicat-T039/tokens.py` → `agents=309 chef_sessions=15 renvois=11 erreurs={'tid-hors-format': 1}`
`python3 .cache/syndicat-T039/analyse.py` →
```
TOTAL agents pondere 56175945 chef 114058824 n 309
implementeur  149  pond 18553979 33.0  med 98442  p90 203873
verificateur   52  pond 16700635 29.7  med 225233 p90 650451
evaluateur     38  pond  6536002 11.6  med 156525 p90 263337
architecte     14  pond  4585086  8.2  med 337678 p90 538413
designer        6  pond  3652953  6.5  med 472790 p90 573693
eclaireur      29  pond  3242593  5.8  med 95347  p90 159045
scribe         14  pond  1559002  2.8  med 79508  p90 197307
opus          233  pond 48379118 86.1
sonnet         43  pond  4801595  8.5
claude-fable-5-1 33 pond 2995232  5.3
```
`python3 .cache/syndicat-T039/analyse3.py` → `rebuild chef: cc 12429509 n 40 pond% 13.6` · `économie cr si ctx<=150k 46050301 40.4`
`python3 -c` (agents.csv, implementeur ≥ 2026-10-07) → `Counter({('opus', 'herite'): 108, ('opus', 'opus'): 8})`

## Écarts
- ∅ lecture hors WL
- `tid-hors-format 1` : eclaireur 2026-10-05 sans `T### · projet`, gardé, projet vide
- T039 inclus partiel (89 691 au gel) ; agents dispatchés après 00:51 exclus
- cible des évaluateurs sp/voix prise dans `journal.md` « Evaluer Tx » (description sans TID)
- scripts d'analyse en plus du script demandé : `.cache/syndicat-T039/` (dans la WL)

## Pour la suite
- chef = 67 % du total ; 1663/2470 appels à contexte > 200k → session chef neuve par vague, plafond 150k : ≤ 46,1 M (27 % total)
- reprise chef après pause > 1h : `/clear` + `agentx board` au lieu de reprendre 335k → ≈ 12,1 M
- gabarit : « appels d'outils indépendants groupés dans 1 message ; commandes DoD chaînées en 1 Bash ; sorties bornées `| tail -n 40`, `rg -c`, Read offset/limit » → ≈ 7,3 M + 2,6 M (HP)
- verificateur : banc préconstruit recopié en `## Environnement`, commandes ≤ 5 min (TTL 5m agents) → ≈ 3,7 M + 3,0 M
- `--modele opus` au renvoi = nul sous chef opus (108/108 herite → opus) ; corriger le contrat recopié à la place

## Retour sur le pack
- Manquait: règle d'appariement évaluateur → cible (description sans TID pour sp) ; TTL cache agents 5m vs chef 1h (découvert)
- Inutile: ∅
