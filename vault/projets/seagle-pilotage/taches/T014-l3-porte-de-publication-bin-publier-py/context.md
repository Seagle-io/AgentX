---
pack: T014
projet: seagle-pilotage
role: implementeur
cree: 2026-10-16
remplace: T006
---

# Pack T014 — L3 porte de publication : titres justes, erreur = NO-GO (remplace T006)

> Seule source de vérité de l'agent T014. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger `bin/publier.py` (livré par T006, conservé) pour lever le motif de renvoi — titres d'écart contredits par git — et appliquer les 3 amendements du contrat §C5 décidés par le chef ; reste de la porte inchangé (acquits, `--taches`, codes, forme JSON).

## Definition of Done
- [ ] motif 1 levé (P3) : plus de troncature silencieuse — `git log` sans `-n 200` (ou pagination complète) pour COMPTER ; le titre donne les vrais nombres : `ortho-front` → « 410 commits dont 50 feat » (valeurs du jour, collées) ; `preuves` reste ≤ 20 lignes (les 20 plus récentes) + 1 ligne `… N autres`
- [ ] motif 2 levé (P2) : titre de l'écart selon la référence VIDE : `T_txt` vide → « pages et textes absents de <B> » ; `T_cap` vide → « captures absentes de <B> » ; les 2 → les 2 ; kora réel → titre « captures absentes de main » (pages et textes y sont : `git ls-tree -r --name-only main` collé)
- [ ] amendement §C5 : un contrôle au statut `erreur` impose `NO-GO` (y compris si tous les écarts sont acquittés) ; preuve sur banc : acquitter les 5 bloquants kora → verdict NO-GO tant que P4 est en erreur (avant : GO)
- [ ] amendement : `RE_FEAT = re.compile(r"^(feat|ajout|ajoute|nouveau|new)\b", re.I)` ; effet sur kora collé
- [ ] chaque écart des verdicts réels kora et geolens confronté à sa commande git (relancée, sortie collée) : 0 titre contredit par git
- [ ] non-régression (banc `.cache/seagle-T014/`, copie du vault) : `--acquitter` (id absent → 2, expiration sur dépôt de test), `--taches` ×2 (2e → `[]`), codes 0/1/2/3, 0 écriture git (`rev-parse HEAD` + `status --porcelain` + `stash list` + `worktree list` avant == après, 5 dépôts)
- [ ] `python3 -m py_compile bin/publier.py` rc 0 ; `git diff --no-index --stat <copie avant> bin/publier.py` collé
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/publier.py` | E | P2/P3 `~:120-232`, verdict, `RE_FEAT :30` |
| `vault/projets/seagle-pilotage/taches/T013-evaluer-t006-porte-de-publication/result.md` | L | verdict détaillé, commandes git |
| `vault/projets/seagle-pilotage/taches/T006-l3-porte-de-publication-bin-publier-py/result.md` | L | ce que T006 a livré |
| `vault/projets/seagle-pilotage/contrat.md` | L | §C5 L207-247 |
| `vault/projets/seagle-pilotage/decisions.md` | L | amendements 2026-10-16 |
| `bin/produits.py` | L | registre |
| `.cache/seagle-eval-T013/depot/` | L | dépôts de test réutilisables (site, ui) |
| `.cache/seagle-T014/` | E | banc |

## Contrats
Motif de renvoi de T006 (évaluation T013, verbatim) :
```
P3 kora faux : fenetre -n 200 tronquee au 2026-10-08, titres 2 feat et 198 autres alors que git donne 410 commits dont 50 feat ; titre pages absentes de main alors que pages et textes y sont
git -C seagle-website ls-tree -r --name-only main → src/lib/local/{de,en,es,fr,it}/Kora.ts, src/pages/Kora/index.tsx
git -C ortho-front log --since=T_txt master -- src → total 410 feat 50
```
Amendements §C5 (decisions.md 2026-10-16) : erreur ⇒ NO-GO ; P3 sans troncature silencieuse ; P2 titre selon la référence vide ; `RE_FEAT` + `ajoute|ajout`.

## Décisions actées
- la porte juge les refs LOCALES (0 fetch) ; 0 écriture git ; jamais push
- ids d'écart inchangés (`<type>:<cle>:<preuve>`) : les acquits existants restent valides

## Hors périmètre
- `bin/vx.py` (T012 en revue), `bin/produits.py`, `bin/dash.py`, `dash/*`

## Environnement
- banc : `B=.cache/seagle-T014; rm -rf $B; mkdir -p $B; cp -r bin roles.json produits.json $B/; cp -r vault $B/vault` ; dépôts produits/sites = les vrais, en LECTURE
- `garde_bash` refuse push/migrations et `git checkout --`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(python3:*)`, `Bash(git -C:*)` (lecture), `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/seagle-T014)`, `Bash(rg:*)`, `Bash(md5sum:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T014
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
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
