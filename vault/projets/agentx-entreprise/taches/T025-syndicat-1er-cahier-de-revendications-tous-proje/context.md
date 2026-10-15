---
pack: T025
projet: agentx-entreprise
role: syndicat
cree: 2026-10-15
---

# Pack T025 — Syndicat : 1er cahier de revendications, tous projets

> Seule source de vérité de l'agent T025. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Évaluer les conditions de travail des agents sur tous les projets du vault (9 projets, ~280 tâches) et rendre le 1er cahier de revendications chiffré : les 5 à 10 changements qui feraient le plus gagner les agents (moins de lectures hors WL, moins de renvois, moins de blocages, packs plus courts).

## Definition of Done
- [ ] `vault/syndicat/2026-10-15-tous.md` écrit : frontmatter `tags: [syndicat]`, `perimetre: tous`, `date: 2026-10-15` ; sections `## Indicateurs` · `## Revendications` · `## Sans donnée`
- [ ] `## Indicateurs` : les 5 familles de ta consigne (charge, autonomie, qualité, flux, répétition), chaque chiffre suivi de sa source (`commande` ou `chemin:L`) ; découpe par rôle quand la donnée le permet
- [ ] `## Revendications` : 5 à 10, triées par gain attendu ; chacune = constat chiffré · source · correction proposée (gabarit, pack type, budget, modèle, découpe, outil) · gain attendu · coût
- [ ] répétition : top 5 des « Manquait » récurrents (≥ 2 tâches), avec les TID
- [ ] imputation : pour chaque renvoi (`rejete`) du vault, cause = pack | agent | ambigu, avec la source
- [ ] `## Sans donnée` : indicateurs voulus mais sans source dans le vault (ex. tokens réels, durée d'exécution)
- [ ] 0 édition hors ce fichier et ton `result.md` : `git status --short` avant/après collé
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/syndicat/2026-10-15-tous.md` | E | livrable (neuf, créer le dossier) |
| `vault/projets/*/taches/*/result.md` | L | via `rg` et `vx.py integrer` seulement, jamais lu en entier |
| `vault/projets/*/taches/*/task.md` | L | frontmatter via `rg` |
| `vault/projets/*/journal.md` | L | durées, blocages, renvois |
| `vault/_templates/context.md` | L | gabarit actuel : cible des corrections |
| `vault/_templates/LANGAGE.md` | L | langage dense |

## Contrats
Commandes de lecture (rien d'autre ne mute) :
```
python3 bin/vx.py personnel --json                     taux de renvoi par rôle/modèle (277 tâches, 9 projets)
python3 bin/vx.py integrer --projet <slug>             Écarts, Vérifié comment, Pour la suite
python3 bin/vx.py pack-lint <TID> --projet <slug>      lignes, tokens, taille WL d'un pack
python3 bin/vx.py board                                état de tous les projets
rg -n "^## Retour sur le pack" -A4 vault/projets/*/taches/*/result.md
rg -n "lecture hors WL" vault/projets/*/taches/*/result.md
rg -n "^statut: (rejete|bloque)|^remplace|^remplacee_par|^modele" vault/projets/*/taches/*/task.md
```
Projets : agentx-entreprise, agentx-immeuble, dashboard-direct (clos), dashboard-grille, geolens-*, orthopro, seagle-site ; archive `vault/archive/2026-10-05-recherche-floue`.

## Décisions actées
- tu proposes, le chef décide : 0 édition de pack, gabarit, agent
- échec causé par le pack (Manquait, WL trop étroite, contrat absent) → imputé au pack, jamais à l'agent
- 0 donnée inventée : indicateur sans source → `## Sans donnée`

## Hors périmètre
- code (`bin/*`, `dash/*`), `.claude/*` : lecture interdite sauf si une revendication l'exige (alors hors WL, journalisé)
- juger la qualité des livrables (rôle `evaluateur`)

## Environnement
- tâches en cours en parallèle : T024 (éval de ton rôle), T008-T010 agentx-immeuble — leurs result.md peuvent apparaître pendant ta lecture : figer ton périmètre au début (horodatage collé)
- `garde_bash` refuse les commandes citant push/migrations
- `vault/` = vault Obsidian : liens `[[wikilink]]`, pas de HTML

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (livrable + result.md), `Bash(python3 bin/vx.py:*)`, `Bash(rg:*)`, `Bash(wc:*)`, `Bash(python3 -c:*)`, `Bash(mkdir -p vault/syndicat)`, `Bash(git status:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T025
projet: agentx-entreprise
statut: fait | bloque
---
## Livré
- vault/syndicat/2026-10-15-tous.md — n revendications, n indicateurs
## Vérifié comment
commande → sortie brute (extraits des mesures clés)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : les 3 revendications à appliquer d'abord, recopiables dans un pack scribe
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
