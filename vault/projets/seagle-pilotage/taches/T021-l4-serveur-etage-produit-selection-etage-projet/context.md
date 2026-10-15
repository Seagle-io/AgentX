---
pack: T021
projet: seagle-pilotage
role: implementeur
cree: 2026-10-16
---

# Pack T021 — L4 serveur : étage = produit, sélection ?etage=&projet=

> Seule source de vérité de l'agent T021. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Faire produire à `bin/dash.py` un immeuble où chaque étage est un PRODUIT du registre (`produits.json`) qui agrège ses projets, l'entreprise Seagle au rez-de-chaussée, la sélection `?etage=<cle>&projet=<slug>` — à la lettre de `contrat.md` §C2 — sans casser la voix, la garde de dispatch ni le mode « projets » de secours.

## Definition of Done
- [ ] §C2 appliqué : `immeuble.mode`, `selection.projet`, `etages[].produit`, `etages[].projets[]`, `selectionnable`, `sous_sol[].produit`, `todo[].etage`, `evenements[].etage`, `produits_erreur` ; signatures `construire_etat(projet=None, etage=None)`, `_bloc_produit` (pur, 0 IO), `_groupes`, `_choisir` (5 étapes §C2) ; `main()` + `--etage`
- [ ] DoD L4 (`contrat.md:330`) sur le vrai vault, sorties collées : `len(etages) == 4` (kora, geolens, agentx, seagle) ; `etages[-1].slug == 'seagle'` ; `selection.projet == projet.slug` ; `--projet orthopro` → `selection.slug == 'kora'` ; `--etage zz` → `refus` ; ancien lien `--etage orthopro` → étage kora, projet orthopro
- [ ] mode secours : `produits.json` renommé dans une COPIE du dépôt (banc) → `mode == 'projets'`, `produits_erreur` ≠ "", comportement T019 intégral (un étage par projet) ; jamais renommer le vrai `produits.json`
- [ ] perf (commande §C7 de `vault/projets/agentx-immeuble/contrat.md:242-251`) : chaud médiane ≤ 120 ms, froid ≤ 600 ms, collée
- [ ] non-régression : `state.voix` (6 clés), `taches[].actions`, todo « T0xx prête mais aucun agent » (T036), cache par signature + empreinte d'événements, `/api/run`, `/api/voix/*` inchangés (rg + 1 curl chacun sur salle-banc) ; `python3 -m py_compile bin/dash.py` rc 0
- [ ] salle-banc `python3 bin/dash.py --port 7826 --no-open` (vrai vault, GET seulement) : `curl '/state.json?etage=kora'`, `?etage=kora&projet=dashboard-grille`, `?projet=seagle-site` → sélections attendues ; kill → 000
- [ ] `git diff --stat -- bin/dash.py` collé ; `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/dash.py` | E | `construire_etat`, `_bloc_projet`, `_etage`, `_choisir`, `_sous_sol`, `_todo`, `_evenements`, `do_GET`, `main` |
| `vault/projets/seagle-pilotage/contrat.md` | L | **§C1 signatures L78-116 · §C2 L118-176 · DoD L4 L330 : contrat verbatim** |
| `vault/projets/agentx-immeuble/contrat.md` | L | §C1-C3 L23-115 (forme T019 à garder en mode projets) · §C7 perf L242-251 |
| `bin/produits.py` | L | `charger`, `tous`, `produit`, `entreprise`, `produit_de`, `erreur` |
| `bin/vx.py` | L | `lister_projets`, `lire_frontmatter`, `lister_taches` |
| `produits.json` | L | registre réel (ne pas modifier) |
| `.cache/seagle-T021/` | E | banc |

## Contrats
`contrat.md` §C2 = contrat, à appliquer à la lettre (forme JSON, règles d'agrégat, ordre = ordre du fichier, entreprise en dernier `num = 1`, sélection en 5 étapes). Rattachements réels : agentx-entreprise, agentx-immeuble, agentx-voix, agentx-serveur → agentx · geolens-* → geolens · orthopro, dashboard-grille, dashboard-direct → kora · seagle-site, seagle-pilotage → seagle.
API registre :
```python
def charger(chemin=FICHIER) -> dict[str, Produit] ; def erreur() -> str ; def tous() -> tuple[str, ...]
def produit(cle) -> Produit | None ; def entreprise() -> Produit | None ; def produit_de(meta_brief: dict) -> tuple[str, str]
```

## Décisions actées
- étage = produit (cadrage humain) ; projets = travail en cours d'un étage ; 0 donnée inventée ; le front (L5) viendra après toi
- mode « projets » = repli automatique si le registre est invalide (jamais une salle vide)

## Hors périmètre
- `dash/*` (L5, après toi), `bin/vx.py`, `bin/produits.py`, `bin/voix.py`, `bin/garde_dispatch.py`
- relancer la salle réelle :7777 (le chef le fera)

## Environnement
- banc : `B=.cache/seagle-T021/banc; rm -rf $B; mkdir -p $B; cp -r bin dash roles.json produits.json $B/; ln -s "$PWD/vault" $B/vault` (lecture) ; pour le mode secours : copie du vault + `produits.json` absent dans `$B`
- `garde_bash` refuse push/migrations ; `grep -nE` si `rg` absent

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(python3:*)`, `Bash(curl:*)`, `Bash(kill:*)`, `Bash(cp:*)`, `Bash(ln:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/seagle-T021/banc)`, `Bash(rg:*)`, `Bash(grep:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T021
projet: seagle-pilotage
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison | écart au contrat: § — raison
## Pour la suite
- ≤ 5 lignes : forme réelle d'un étage produit (JSON) pour L5
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
