---
tache: T030
projet: agentx-entreprise
statut: revue
---
## Livré
- bin/vx.py:44-54 — `PACK_SECTIONS` = 9, `## Environnement` ajouté
- bin/vx.py:252-259 — fiche : H1/vides/marqueur ôtés, `## X`→`**X**`
- bin/vx.py:581-589 — `\b` port|tz|type|api|tool|hunk|ligne ; `\btools?\b`
- bin/vx.py:706-720 — pack-lint : titre étranger, doublon, ordre (hors ```)
## Vérifié comment
banc `.cache/banc-T030`, fiche orthopro → `vx tache` ; `rg -n "^#{1,2} " T001/context.md` → `8:# Pack T001` · `13:## Mission` `16:## Definition of Done` `23:## Fichiers autorisés` `34:## Contrats` `45:## Décisions actées` `50:## Hors périmètre` `54:## Environnement` `115:## Budget` `123:## Format de sortie` · `132-140: ## Livré…## Retour sur le pack` (5, dans le ```markdown``` du gabarit, idem gabarit L85-93) → count 15 = 1+9+5
fiche seagle-site → T002 : même liste, `54:## Environnement` `113:## Budget` `121:## Format de sortie`, count 15
`rg -n "^\*\*" T001` → 57 Dépôts et branches · 63 Lancer, tester, linter · 71 Comptes… · 76 Versions · 80 Ports, URL, fuseau · 86 Rouge d'avance · 92 Interdits · 98 Bancs et scripts de référence (8)
fiche forgée `- TODO-PACK à compléter` → T003 § Environnement : `**Versions**` `- node 24 — x` (ligne absente)
pack-lint scaffolds T001/T002 → seul `x le pack contient encore des marqueurs a remplir` (marqueurs du gabarit)
pack-lint forgés (copies du pack T030) avant → après :
- T004 sain : rc 0 → rc 0 `OK — pack dispatchable.`
- T005 `## Notes libres` : rc 0 → rc 2 `x titre hors gabarit : ## Notes libres`
- T006 `## Contrats` ×2 : rc 0 → rc 2 `x section dupliquee : ## Contrats` + `x sections dans le desordre`
- T007 Décisions avant Contrats : rc 0 → rc 2 `x sections dans le desordre — suivre vault/_templates/context.md`
vrai vault, avant = `vx.avant.py` chargé ROOT=dépôt (`.cache/banc-T030/lint_avant.py`), même ensemble :
- agentx-immeuble T011 en-cours avant=0 apres=0 · agentx-entreprise T030 en-cours 0/0 · agentx-immeuble T014 en-cours 0/0
- agentx-immeuble T012 revue 0/0 · dashboard-grille T013 a-faire 0/0 · orthopro T042 bloque 0/2 (voir Écarts)
manques `categorie_manque` : 'comportement du widget' environnement→autre · 'toolbar absente' outil→autre · 'chunks rejetes' baseline→autre ; témoins 'port 3000'→environnement 'tools autorises'→outil 'type de retour'→contrat 'api /v2'→contrat 'ligne 42'→coordonnee 'TZ vide'→environnement
manques total avant `257 [environnement 75, autre 69, contrat 39, coordonnee 29, outil 15, wl 11, baseline 10, version 9]`
manques total après `257 8 cat [autre 83, environnement 45, contrat 45, coordonnee 35, outil 18, wl 13, version 9, baseline 9]`
`integrer --projet orthopro | rg -c "^   -- Retour sur le pack"` → 42
`python3 -m py_compile bin/vx.py` → rc 0 · `./bin/agentx doctor` → rc 0 `vault coherent.`
`git diff --stat -- bin/vx.py` avant → `105 ++++…, 99 insertions(+), 6 deletions(-)` ; après → `124 +++…, 118 insertions(+), 6 deletions(-)`
hunks avant : `-241,0 +242,17` `-267,2 +284,2` `-508 +525` `-531 +548` `-539 +556,2` `-557,0 +576,71` `-820 +909` `-822,0 +912,4`
hunks après : `-50,0 +51` `-241,0 +243,20` `-267,2 +288,2` `-508 +529` `-531 +552` `-539 +560,2` `-557,0 +580,71` `-612,0 +706,15` `-820 +928` `-822,0 +931,4`
`git status --short bin/` → ` M bin/vx.py` seul
## Écarts
- orthopro T042 (bloque, hors DoD en-cours|pret) : avant 0 → après 2 `x section manquante : ## Environnement` — pack antérieur au gabarit 9 sections ; non assoupli
- `tools?` : `\b` en tête seul laisse toolbar→outil ; ajouté `\b` en fin aussi
- set en-cours|pret du vault a changé pendant la tâche (T012→revue, T011/T014 apparus) → comparaison refaite avant/après sur le même ensemble
- ∅ lecture hors WL
## Pour la suite
- `lire_frontmatter` : corps commençant par `- ` tronqué (lstrip("-\n")) — non corrigé
- remplaçante de orthopro T042 : scaffold neuf → `## Environnement` présent, lint OK
- packs `fait` anciens sans `## Environnement` : lint KO désormais, sans effet (non redispatchés)
- manques : 30 Manquait passés environnement→autre (`import`, `support`…) ; `autre` 83 = prochain chantier de catégories
- banc conservé `.cache/banc-T030/` (vx.avant.py, lint_avant.py) ; `rm -rf` libre
## Retour sur le pack
- Manquait: `PACK_SECTIONS` réel = 8 (sans Environnement), pack dit 9 ; « toolbar » non résolu par `\b` en tête seul ; set en-cours|pret mouvant (figer la liste des TID au dispatch) | Inutile: `T029/result.md` (motif déjà recopié)
