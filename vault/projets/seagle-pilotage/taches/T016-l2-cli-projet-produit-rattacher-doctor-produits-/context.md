---
pack: T016
projet: seagle-pilotage
role: implementeur
cree: 2026-10-16
remplace: T012
---

# Pack T016 — Frontmatter YAML valide de bout en bout (remplace T012, 2e renvoi)

> Seule source de vérité de l'agent T016. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre `lire_frontmatter` / `ecrire_frontmatter` / la création de tâches et de projets (`bin/vx.py`) toujours valides en YAML (`yaml.safe_load`) et fidèles (valeur relue == valeur écrite), sans changer un octet des fichiers existants qui ne sont pas réécrits ; les 11 rattachements déjà faits sur le vrai vault restent tels quels.

## Definition of Done
- [ ] motif levé — lecture : seule une PAIRE `"…"` (avec dé-échappement `\"`, `\\`) ou `'…'` (avec `''` → `'`) entoure la valeur est retirée ; jamais un guillemet isolé, jamais un espace final
- [ ] motif levé — écriture (`_scalaire`) : quoter si espace en tête/fin, ` #` n'importe où, `: ` ou `:` final, 1er caractère ∈ `- ? : , [ ] { } # & * ! | > ' " % @ \``, ou valeur interprétable autrement (`true`, `null`, `~`, nombre pur, date `AAAA-MM-JJ` → seulement si la valeur d'origine était une chaîne quotée) ; vide → `cle:`
- [ ] motif levé — création : `cmd_tache`, `cmd_projet`, `virer` (titre de la remplaçante), `set --note`, `--motif` passent TOUTES leurs valeurs utilisateur par `_scalaire` (plus de `rendre_template(TITRE=…)` brut dans un frontmatter) ; `tache "Essai : banc eval"` et `projet x --titre "A : B"` → `yaml.safe_load` OK et titre relu == `A : B`
- [ ] banc : les 26 valeurs pièges de l'évaluateur (`.cache/seagle-eval-T015/`, à relire) + 10 de toi → écrire puis relire par vx ET par `yaml.safe_load` → valeur identique ×36 (tableau collé)
- [ ] aller-retour à l'octet : TOUS les `task.md` (≥ 324) et `brief.md` (≥ 13) du vrai vault, dans une copie → `ecrire(lire(f))` == f, 0 écart (compte collé)
- [ ] non-régression CLI : `projet --produit`, `rattacher` ×2, `doctor`, `set`, `virer`, `retenir` sur banc → frontmatter valide (`yaml.safe_load` sur chaque fichier touché, collé)
- [ ] `python3 -m py_compile bin/vx.py` rc 0 ; `./bin/agentx doctor` → `vault coherent.`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/vx.py` | E | `_frontmatter`/`lire_frontmatter :90-141` · `_scalaire`/`ecrire_frontmatter :153-173` · `rendre_template` · `cmd_tache :~255` · `cmd_projet` · `cmd_virer :~363` · `cmd_set` |
| `vault/projets/seagle-pilotage/taches/T015-evaluer-t012-frontmatter-et-rattachements/result.md` | L | verdict détaillé, valeurs pièges |
| `vault/projets/seagle-pilotage/taches/T012-l2-cli-projet-produit-rattacher-doctor-produits-/result.md` | L | ce que T012 a livré |
| `vault/_templates/task.md` | L | frontmatter du gabarit |
| `vault/_templates/brief.md` | L | frontmatter du gabarit |
| `.cache/seagle-eval-T015/` | L | banc et pièges de l'évaluateur |
| `.cache/seagle-T016/` | E | ton banc |

## Contrats
Motif du 2e renvoi (évaluation T015, verbatim) :
```
lire_frontmatter tronque guillemet ou espace final non quotés ; ecrire_frontmatter ne quote ni - x en tête ni a #b ; tache et projet --titre A : B écrivent un YAML invalide
bin/vx.py:L137 val.strip("\"'") — guillemet final perdu
bin/vx.py:L153-L158 _scalaire — ignore espace final, ` #`, `- ` en tête, `:` final
bin/vx.py:L255,L363 rendre_template(TITRE=…) brut
4 KO / 26 (a "b", x', `x  `, x") ; YAML invalide `- x`, `a:` ; YAML tronqué `a #b` → `a`
```
PyYAML 6.0.3 est installé (`import yaml`) : outil de PREUVE seulement, jamais une dépendance de `bin/vx.py` (stdlib).

## Décisions actées
- 2e renvoi sur la chaîne T005 → T012 → T016 : modèle opus
- aller-retour à l'octet des fichiers existants = contrainte dure ; les 6 `titre:` non quotés déjà présents restent tels quels (normalisation différée, decisions.md 2026-10-16)
- `bin/vx.py` reste stdlib

## Hors périmètre
- `bin/publier.py` (T014 en cours), `bin/produits.py`, `bin/dash.py`, `dash/*`
- réécrire des fichiers existants du vault

## Environnement
- banc : `B=.cache/seagle-T016; rm -rf $B; mkdir -p $B; cp -r bin roles.json produits.json $B/; cp -r vault $B/vault` ; recopier ton `bin/vx.py` avant chaque essai
- `garde_bash` refuse push/migrations (écrire « rattachement ») ; `rg -h` = aide : utiliser `-I`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(python3:*)`, `Bash(./bin/agentx:*)`, `Bash(cp:*)`, `Bash(cmp:*)`, `Bash(diff:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/seagle-T016)`, `Bash(rg:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T016
projet: seagle-pilotage
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
