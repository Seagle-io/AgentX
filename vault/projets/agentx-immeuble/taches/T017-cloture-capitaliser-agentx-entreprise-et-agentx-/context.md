---
pack: T017
projet: agentx-immeuble
role: scribe
cree: 2026-10-15
---

# Pack T017 — Clôture : capitaliser agentx-entreprise et agentx-immeuble

> Seule source de vérité de l'agent T017. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Capitaliser les 2 projets méta du 2026-10-15 (agentx-entreprise : 33 tâches ; agentx-immeuble : 17 tâches) : leçons → gabarit et doctrine, todo.md triées (fait / à garder / à abandonner), notes de connaissance, briefs à jour — pour que le prochain projet démarre avec de meilleurs packs.

## Definition of Done
- [ ] `python3 bin/vx.py manques --projet agentx-entreprise` et `--projet agentx-immeuble` lus ; top 5 des manques récurrents → chacun traité : ligne ajoutée au gabarit `vault/_templates/context.md` (ou à `pack-verificateur.md`) OU raison écrite de ne pas l'ajouter ; tableau manque → action collé
- [ ] leçons nouvelles intégrées au gabarit, si absentes (vérifier par `rg` avant d'ajouter) :
  - instantané `.cache/snap-<T>/` pour évaluer un livrable pendant qu'un autre lot édite les mêmes fichiers
  - DoD « `git diff --stat` » inapplicable en arbre partagé non commité : le chef commite avant le lot ou donne les hunks de référence
  - interception `/api/term/*` obligatoire dans tout script Playwright sur la salle (la page POST seule `/api/term/open`)
  - DoD de mesure sur vault vivant : comparer des Δ, pas des valeurs absolues
  - marqueur de lint jamais écrit en clair dans un pack (`"TODO" + "-PACK"`)
- [ ] `vault/projets/agentx-entreprise/todo.md` et `vault/projets/agentx-immeuble/todo.md` : chaque `- [ ]` → `- [x]` si fait (preuve : commande ou TID), sinon conservé ; lignes en double fusionnées ; 0 ligne supprimée sans trace
- [ ] `brief.md` des 2 projets : section `## Bilan` ajoutée (≤ 12 lignes : livré, renvois, chiffres clés, reste à faire) ; `statut:` inchangé (le chef clôt)
- [ ] 1 à 3 notes atomiques `vault/connaissances/<slug>.md` (Obsidian, frontmatter `tags:`) : ex. « remplacement d'agent : virer → remplaçante → 2e renvoi opus », « évaluer sur instantané », « salle multi-projets : cache par signature mtime » — liens `[[…]]` depuis les briefs
- [ ] `python3 bin/vx.py doctor` rc 0 ; `python3 bin/vx.py index` OK
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/_templates/context.md` | E | leçons § Environnement / Budget |
| `vault/_templates/pack-verificateur.md` | E | leçons vérificateur |
| `vault/projets/agentx-entreprise/todo.md` | E | tri |
| `vault/projets/agentx-immeuble/todo.md` | E | tri |
| `vault/projets/agentx-entreprise/brief.md` | E | bilan |
| `vault/projets/agentx-immeuble/brief.md` | E | bilan |
| `vault/connaissances/` | E | notes atomiques |
| `vault/projets/agentx-entreprise/decisions.md` | L | décisions de la journée |
| `vault/projets/agentx-immeuble/decisions.md` | L | décisions de la journée |
| `vault/projets/*/taches/*/result.md` | L | via `vx integrer` / `vx manques` / `rg` seulement |
| `vault/syndicat/2026-10-15-tous.md` | L | revendications R6-R10 non appliquées (à garder en todo) |

## Contrats
Chiffres de la journée (constat chef) :
```
agentx-entreprise : T001-T033 ; renvois : T026 (env.md coupe § Environnement), T030 (bloc de code non fermé, manques 33 %) ; T032 opus retenu
agentx-immeuble   : T001-T017 ; vérif navigateur T009 → 3 défauts (D1 action sur mauvais étage) corrigés T012 ; T016 en cours
rôles : 11 → 17 (designer…, juriste, tresorier, produit, marketing, rssi, syndicat)
syndicat : 10 revendications ; R1-R5 acceptées et appliquées ; R6-R10 refusées pour l'instant
```

## Décisions actées
- le scribe propose et capitalise ; il ne clôt pas les projets (`statut`) et ne touche ni `bin/*` ni `dash/*` ni `.claude/*`
- append-only : `decisions.md` et `result.md` jamais réécrits

## Hors périmètre
- code ; SKILL.md, CLAUDE.md (déjà mis à jour par T010, T021, T023, T028 agentx-entreprise)
- archiver les projets

## Environnement
- `rg -h` = aide en rg 14 : utiliser `-I` ; `garde_bash` refuse les commandes citant push/migrations : écrire avec Write/Edit
- T015, T016 (évaluation et vérification de la vue animée) peuvent écrire leurs result.md pendant ta tâche : figer ton périmètre au début

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Glob, `Bash(python3 bin/vx.py:*)`, `Bash(rg:*)`, `Bash(wc:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T017
projet: agentx-immeuble
statut: fait | bloque
---
## Livré
- chemin — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : ce que le chef doit trancher
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
