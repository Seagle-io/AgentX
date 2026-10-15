---
pack: T006
projet: seagle-pilotage
role: implementeur
cree: 2026-10-16
---

# Pack T006 — L3 porte de publication : bin/publier.py

> Seule source de vérité de l'agent T006. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Écrire `bin/publier.py`, la porte de publication d'un produit : contrôles P0-P5 en LECTURE seule (git local, calendrier marketing), verdict GO / NO-GO avec écarts à ids stables, acquits append-only, `--taches` qui crée 1 tâche par écart — à la lettre de `contrat.md` §C5.

## Definition of Done
- [ ] API §C5 : `cmd(args)`, `evaluer(cle, aujourd_hui=None) -> dict`, `git(depot, *argv) -> str` (timeout 10 s, `GitErreur`) ; `main()` propre ; codes 0 GO · 1 NO-GO · 2 usage · 3 registre
- [ ] P0-P5 exactement comme le tableau §C5 (commandes, ids, gravités, rôles, `RE_FEAT`, `RE_OUVERT`, pathspec `:(glob)`) ; sortie `--json` = forme §C5 verbatim ; sortie texte `GO|NO-GO <cle>` + 1 ligne par écart
- [ ] 0 écriture git, 0 réseau : `git -C <d> status --porcelain` et `git -C <d> rev-parse HEAD` avant == après pour seagle-website, Geolens-website, ortho-front, ortho-back, geolens-web (collés) ; `rg -n "fetch|pull|push|checkout|commit|worktree" bin/publier.py` → seulement des chaînes de doc/commentaires justifiées
- [ ] les 4 premières commandes « DoD L3 » de `contrat.md:326-332` sur le vrai dépôt → sorties collées (attendu kora : NO-GO avec `site-branche`, cf. 16 commits hors main)
- [ ] `--acquitter <id> --motif "…"` et `--taches` testés sur une COPIE du vault (`.cache/banc-T006/`, AGENTX vault copié) : acquit → écart `acquitte: true`, verdict recalculé ; id absent → exit 2 ; `--taches` ×2 → 2e passage `taches_creees == []` ; packs créés : `pack-lint` FAIL attendu (marqueur conservé dans `## Décisions actées`) ; sorties collées
- [ ] `seagle` (entreprise) → exit 2 ; `zz` → exit 2 ; registre muté invalide → exit 3
- [ ] `python3 -m py_compile bin/publier.py` rc 0 ; `git status --short` → `bin/publier.py` (+ result.md)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/publier.py` | E | neuf |
| `vault/projets/seagle-pilotage/contrat.md` | L | **§C1 signatures L78-116 · §C5 L207-247 · DoD L3 L326-332 : contrat verbatim** |
| `bin/produits.py` | L | API du registre (T003) |
| `bin/vx.py` | L | `cmd_projet`, `cmd_tache`, `ecrire_frontmatter`, `rendre_template`, `verrou`, `STATUT_OUVERT` |
| `vault/_templates/context.md` | L | gabarit des packs créés par `--taches` |
| `produits.json` | L | registre réel |
| `.cache/banc-T006/` | E | copie du vault pour `--taches` / `--acquitter` |

## Contrats
`contrat.md` §C5 = contrat. Rappels :
```python
RE_FEAT   = re.compile(r"^(feat|ajout|nouveau|new)\b", re.I)
RE_OUVERT = re.compile(r"à (faire|corriger|vérifier|valider|relire)|\bTODO\b|- \[ \]", re.I)
```
Acquits : `vault/projets/publication-<cle>/acquits.md`, append-only, `- <AAAA-MM-JJ> \`<id>\` — <motif>`.
`--taches` : projet `publication-<cle>` créé si absent (`produit: <cle>`), 1 tâche `a-faire` par écart bloquant non acquitté, titre `publier <cle> : <type> <id-court>`, doublon (id dans le titre d'une tâche ouverte) → sauté. Le marqueur de lint du gabarit reste dans `## Décisions actées` (le chef relit avant dispatch).
`vx.py` (T005 en parallèle) ajoute `agentx publier` qui fait `import publier ; publier.cmd(args)` : `cmd(args)` doit accepter un `argparse.Namespace` avec `cle, json, taches, acquitter, motif`.

## Décisions actées
- la porte juge les refs LOCALES (pas de fetch) ; heuristique P3 = sujets de commit, comparaison texte ↔ fonctionnalité non tentée (« à vérifier par un agent »)
- `--taches` / `--acquitter` sur le vrai vault : jamais dans ce lot (banc seulement)
- jamais push, jamais migration

## Hors périmètre
- `bin/vx.py` (T005), `bin/dash.py`, `dash/*`, `outils/captures/`
- lancer un produit ou un site

## Environnement
- banc : `B=.cache/banc-T006; rm -rf $B; mkdir -p $B; cp -r bin roles.json produits.json $B/; cp -r vault $B/vault` (copie COMPLÈTE du vault : `--taches` y écrit) ; `python3 $B/bin/publier.py …` ; dépôts produits/sites = les vrais, en LECTURE
- `garde_bash` refuse les commandes citant push/migrations et `git checkout --` ; écrire le module avec Write/Edit

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (WL), Grep, `Bash(python3:*)`, `Bash(git -C:*)` (lecture : log, status, rev-parse, ls-tree), `Bash(rg:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/banc-T006)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T006
projet: seagle-pilotage
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (verdicts réels kora, geolens)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : verdict réel kora/geolens en 1 ligne chacun
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
