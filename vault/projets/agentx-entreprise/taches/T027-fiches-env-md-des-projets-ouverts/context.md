---
pack: T027
projet: agentx-entreprise
role: scribe
cree: 2026-10-15
---

# Pack T027 — Fiches env.md des projets ouverts

> Seule source de vérité de l'agent T027. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Écrire `vault/projets/<slug>/env.md` pour les 6 projets à code (revendication R3 du syndicat) : les faits d'environnement que les agents ont redécouverts tâche après tâche (72 « Manquait »), sourcés, pour qu'ils soient recopiés dans chaque futur pack.

## Definition of Done
- [ ] `vault/_templates/env.md` : gabarit (cf. Contrats), Obsidian, 0 commentaire-gabarit survivant dans les fiches remplies
- [ ] 6 fiches : `orthopro`, `seagle-site`, `geolens-viewer`, `geolens-preview-3d`, `geolens-charge-3d`, `dashboard-grille` ; chaque ligne-fait suivie de sa source (`projet/TID` ou `chemin:L`) ; section sans fait → supprimée (pas de section vide)
- [ ] 0 secret : mots de passe, jetons, cookies de session, clés → jamais la valeur, seulement `chemin du fichier · nom de la variable` ; `rg -n -i "password|passwd|secret|token|apikey|api_key" vault/projets/*/env.md` → chaque occurrence est un nom de variable ou un chemin (sortie collée et commentée)
- [ ] 0 fait inventé : fait ambigu ou contradictoire entre 2 tâches → le plus récent, l'autre cité en `H:` ; fait périmé possible (version) → date de la tâche source
- [ ] chaque fiche ≤ 60 lignes de corps ; `wc -l` collé
- [ ] couverture : `python3 bin/vx.py integrer --projet <slug>` et `rg "Manquait" vault/projets/<slug>/taches/*/result.md` lus pour chaque projet ; nombre de « Manquait » environnement repris par fiche collé
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/_templates/env.md` | E | gabarit neuf |
| `vault/projets/orthopro/env.md` | E | neuf |
| `vault/projets/seagle-site/env.md` | E | neuf |
| `vault/projets/geolens-viewer/env.md` | E | neuf |
| `vault/projets/geolens-preview-3d/env.md` | E | neuf |
| `vault/projets/geolens-charge-3d/env.md` | E | neuf |
| `vault/projets/dashboard-grille/env.md` | E | neuf |
| `vault/projets/*/taches/*/result.md` | L | via `rg` / `vx integrer` seulement (sections Manquait, Environnement, Écarts) |
| `vault/projets/*/taches/*/context.md` | L | via `rg -A` sur `## Environnement` seulement |
| `vault/syndicat/2026-10-15-tous.md` | L | catégories et exemples de manques |
| `.claude/skills/conventions-orthopro/SKILL.md` | L | conventions déjà capitalisées (ne pas dupliquer, lier) |
| `.claude/skills/conventions-geolens/SKILL.md` | L | idem |

## Contrats
Gabarit `vault/_templates/env.md` :
```markdown
---
projet: {{PROJET}}
maj: {{DATE}}
tags: [env]
---

# Environnement — {{PROJET}}

## Dépôts et branches
## Lancer, tester, linter
## Comptes et données de test
## Versions
## Ports, URL, fuseau
## Rouge d'avance
## Interdits
## Bancs et scripts de référence
```
Ligne-fait : `- fait — source` (ex. `- tests back : \`npm test\` dans api/, 412 verts sur HEAD au 2026-10-08 — orthopro/T031`).
Secrets : `- admin de test : identifiants dans \`api/.env.test\` (ADMIN_EMAIL, ADMIN_PASSWORD) — orthopro/T042`.
Skills de conventions existants : lier `[[conventions-orthopro]]`, ne pas recopier.

## Décisions actées
- revendication syndicat R3 acceptée par l'humain 2026-10-15
- `env.md` est recopié au scaffold de chaque pack par `vx tache` (T026 en parallèle) : écrire en langage dense, chaque ligne utile à un agent
- BDD serveur de test Geolens intouchable : la fiche le dit en `## Interdits` ; OrthoPro : branche de travail `Ultime`, jamais de push, jamais de migration (l'humain les lance)

## Hors périmètre
- agentx-entreprise, agentx-immeuble, dashboard-direct (clos) : pas de fiche
- lancer un serveur, une base, un test : 0 exécution hors lecture du vault
- éditer un pack ou un result.md existant

## Environnement
- `rg -h` = aide en rg 14 : utiliser `-I`
- arbre partagé : T026 (bin/vx.py) et T028 (gabarit context.md, doctrine) en parallèle
- `garde_bash` refuse les commandes citant push/migrations : écrire avec Write

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Write, Edit, Grep, Glob, `Bash(python3 bin/vx.py:*)`, `Bash(rg:*)`, `Bash(wc:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T027
projet: agentx-entreprise
statut: fait | bloque
---
## Livré
- chemin — n faits, n sources
## Vérifié comment
commande → sortie brute (rg secrets, wc -l, couverture)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
