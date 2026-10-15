---
pack: T030
projet: agentx-entreprise
role: implementeur
cree: 2026-10-15
remplace: T026
---

# Pack T030 — Fiche env.md au scaffold sans casser le pack (remplace T026)

> Seule source de vérité de l'agent T030. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger dans `bin/vx.py` la recopie de `env.md` au scaffold (motif de renvoi de T026 ci-dessous) et faire détecter par `pack-lint` tout pack aux sections cassées ; garder intacts `integrer` (Retour sur le pack) et `manques`, déjà livrés et validés.

## Definition of Done
- [ ] motif T026 corrigé : `_avec_fiche_env` retire le titre H1 (`# …`) de la fiche et démote chaque titre `## X` → `**X**` (ligne seule, pas un titre markdown) ; sur ton banc avec la VRAIE fiche `vault/projets/orthopro/env.md` copiée : `vx tache` → `rg -n "^#{1,2} " <pack>` = 1 H1 + exactement les 9 sections du gabarit dans l'ordre (sortie collée) ; même chose avec `seagle-site/env.md`
- [ ] lignes portant le marqueur de lint (`"TODO" + "-PACK"`) éventuelles de la fiche filtrées à la recopie (un env.md ne doit jamais rendre un pack non lintable)
- [ ] `pack-lint` : ✗ si un titre `## ` hors des 9 sections de `PACK_SECTIONS`, si une section est dupliquée, ou si l'ordre diffère ; prouvé sur 3 packs forgés dans le banc (titre étranger, doublon, ordre) → ✗ chacun, et sur un pack sain → inchangé ; sorties collées
- [ ] non-régression du vrai vault : `for` sur tous les packs `en-cours|pret` du vrai vault → `pack-lint` même verdict qu'avant ta modif (avant/après collés ; le nouveau contrôle ne doit pas casser un pack existant — s'il en casse un, le lister en Écarts, ne pas assouplir sans le dire)
- [ ] `manques` : `\b` en tête des motifs `port|tz|type|api|tool|hunk|ligne` (faux positifs comportement→port, toolbar→tool, chunks→hunk) ; ces 3 exemples re-testés → bonne catégorie ; total `manques` avant/après collé
- [ ] `integrer` et `manques` inchangés hors ce qui précède : `integrer --projet orthopro | rg -c "^   -- Retour sur le pack"` → ≥ 1 ; `manques --json | python3 -c` → 8 catégories
- [ ] `python3 -m py_compile bin/vx.py` rc 0 ; `./bin/agentx doctor` rc 0
- [ ] `git diff --stat -- bin/vx.py` collé (diff de T026 déjà présent dans l'arbre : coller aussi `git diff -U0 bin/vx.py | rg "^@@"` avant/après) ; 0 autre fichier
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/vx.py` | E | `PACK_SECTIONS :44` · `_avec_fiche_env :242-256` · `cmd_tache :258-290` · `MANQUES_CATEGORIES :577-600` · `cmd_pack_lint :689-740` |
| `vault/projets/orthopro/env.md` | L | vraie fiche, 8 titres `## ` + H1 |
| `vault/projets/seagle-site/env.md` | L | 2e vraie fiche |
| `vault/projets/agentx-entreprise/taches/T029-evaluer-t026/result.md` | L | verdict détaillé du renvoi |
| `vault/_templates/context.md` | L | 9 sections, ordre |
| `.cache/banc-T030/` | E | banc jetable |

## Contrats
Motif de renvoi de T026 (évaluation T029) — à corriger, recopié verbatim :
```
cmd_tache recopie env.md avec ses titres ## : fiche réelle (8 titres) coupe Environnement, corps du gabarit sous un titre étranger ; démoter les titres de la fiche et faire détecter par pack-lint
rg -n "^## " = 17 titres au lieu de 9 ; le corps du gabarit § Environnement tombe sous ## Bancs et scripts de référence ; H1 « # Environnement — orthopro » recopié ; pack-lint ne signale rien
bin/vx.py:252-255 : corps.strip() inséré tel quel, aucun traitement des #
```
Bloc scaffold attendu (après `## Environnement`) :
```
Fiche projet (`vault/projets/<slug>/env.md`, recopiée au scaffold — ne pas éditer ici) :
**Dépôts et branches**
- fait — source
**Lancer, tester, linter**
- …
```
`PACK_SECTIONS` = Mission · Definition of Done · Fichiers autorisés · Contrats · Décisions actées · Hors périmètre · Environnement · Budget · Format de sortie. Attention : le bloc « Format de sortie » d'un pack contient un exemple de `result.md` dans un bloc de code ```markdown``` avec des `## Livré` etc. → le contrôle de titres doit ignorer les lignes à l'intérieur des blocs de code.

## Décisions actées
- `env.md` reste structuré en sections pour l'humain (Obsidian) ; c'est la recopie qui adapte
- `integrer` (Retour sur le pack) et `manques` livrés par T026 sont conservés tels quels (DoD validée par T029)
- règle 4 : la remplaçante reçoit le motif recopié — ce pack

## Hors périmètre
- éditer les fiches `env.md` ; `dash/*` (T012 en cours) ; `bin/agentx`
- bug latent `lire_frontmatter` (corps commençant par `- ` tronqué) : noter en Pour la suite seulement

## Environnement
- banc : `B=.cache/banc-T030; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin dash roles.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` ; `python3 $B/bin/vx.py projet banc --titre Banc` ; copier la fiche dans `$B/vault/projets/banc/env.md` ; recopier ton `bin/vx.py` dans `$B/bin/` avant chaque essai
- `rg -h` = aide en rg 14 : utiliser `-I` ; `garde_bash` refuse les commandes citant push/migrations

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(python3:*)`, `Bash(rg:*)`, `Bash(diff:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/banc-T030)`, `Bash(git diff:*)`, `Bash(./bin/agentx:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T030
projet: agentx-entreprise
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
