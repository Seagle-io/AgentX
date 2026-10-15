---
pack: T019
projet: seagle-pilotage
role: implementeur
cree: 2026-10-16
remplace: T016
---

# Pack T019 — Frontmatter : sauts de ligne, tabulations, contrôles, motif intact (remplace T016, 3e renvoi)

> Seule source de vérité de l'agent T019. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Finir le frontmatter YAML de `bin/vx.py` : échapper sauts de ligne, retours chariot, tabulations et caractères de contrôle à l'écriture (et les dé-échapper à la lecture), et cesser de tronquer le motif de `virer` — tout le reste livré par T016 (41/45 valeurs OK, aller-retour à l'octet) conservé tel quel.

## Definition of Done
- [ ] motif levé — `_scalaire` : toute valeur contenant `\n`, `\r`, `\t` ou un caractère de contrôle (`\x00-\x1f`, `\x7f`) → guillemets doubles avec échappes YAML (`\n`, `\r`, `\t`, `\xHH` / `\uHHHH`, `\"`, `\\`) ; `_valeur` dé-échappe symétriquement
- [ ] motif levé — `cmd_virer` : plus de `.strip("\"'")` sur `args.motif` (`bin/vx.py:~L466`) ; `virer --motif 'a "b"'` → relu `a "b"` ; le nettoyage existant (espaces, `[`→`(`) conservé
- [ ] banc imposé de l'évaluateur `.cache/seagle-eval-T018/banc/val.py` (45 valeurs, relues par vx ET `yaml.safe_load`) → `total 45 KO 0` (sortie collée) ; + CLI : `set --note` multi-ligne, `set --note` avec tabulation, `virer --motif 'a "b"'` → frontmatter valide (`yaml.safe_load`) et relu identique
- [ ] aller-retour à l'octet sur une copie du vrai vault : tous les `task.md` et `brief.md` → KO 0 (compte collé)
- [ ] non-régression : `banc_valeurs.py`, `banc_cli.py` de T016 (`.cache/seagle-T016/`) → KO 0
- [ ] `python3 -m py_compile bin/vx.py` rc 0 ; `./bin/agentx doctor` → pas de nouvelle erreur ; `git diff --stat -- bin/vx.py` collé
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/vx.py` | E | `_valeur :162-168` · `_scalaire :171-177` · `cmd_virer :~466` (lignes à re-repérer : T036 a pu modifier `cmd_set`/`cmd_doctor`) |
| `vault/projets/seagle-pilotage/taches/T018-evaluer-t016-yaml-valide/result.md` | L | verdict détaillé |
| `vault/projets/seagle-pilotage/taches/T016-l2-cli-projet-produit-rattacher-doctor-produits-/result.md` | L | ce que T016 a livré |
| `.cache/seagle-eval-T018/banc/` | L | `val.py` (45 valeurs), `ar.py`, `yv.py` |
| `.cache/seagle-T016/` | L | bancs de T016 |
| `.cache/seagle-T019/` | E | ton banc |

## Contrats
Motif du 3e renvoi (évaluation T018, verbatim) :
```
_scalaire n'echappe ni saut de ligne ni tabulation : set --note multi-ligne ou a TAB b donne un YAML invalide ; virer --motif 'a "b"' perd le guillemet final, vx.py L466 strip
27 'ligne1\nligne2' → vx 'ligne1' | yaml ScannerError
28 'a\tb'           → vx 'a\tb'   | yaml ScannerError
43 '\x07bell'       → vx '\x07bell' | yaml ReaderError
45 'a\rb'           → vx 'a'      | yaml ScannerError
```
PyYAML 6.0.3 installé : outil de preuve seulement ; `bin/vx.py` reste stdlib.

## Décisions actées
- 3e renvoi sur la chaîne T005 → T012 → T016 → T019 : opus ; si cette tâche échoue encore, le chef réduit la portée (pas de 4e itération du même pack)
- aller-retour à l'octet des fichiers existants = contrainte dure ; `bin/vx.py` stdlib

## Hors périmètre
- `cmd_set` / `cmd_doctor` / garde de dispatch (agentx-entreprise T036, qui édite `bin/vx.py` : démarrer APRÈS sa livraison, lignes re-repérées) ; `bin/publier.py`, `bin/produits.py`

## Environnement
- banc : `B=.cache/seagle-T019; rm -rf $B; mkdir -p $B; cp -r bin roles.json produits.json $B/; cp -r vault $B/vault` ; recopier `bin/vx.py` avant chaque essai
- `garde_bash` refuse push/migrations ; `grep -nE` si `rg` absent

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(python3:*)`, `Bash(./bin/agentx:*)`, `Bash(cp:*)`, `Bash(cmp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/seagle-T019)`, `Bash(grep:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T019
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
