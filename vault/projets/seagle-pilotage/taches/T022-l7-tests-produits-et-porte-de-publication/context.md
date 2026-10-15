---
pack: T022
projet: seagle-pilotage
role: testeur
cree: 2026-10-16
---

# Pack T022 — L7 tests : produits et porte de publication

> Seule source de vérité de l'agent T022. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Écrire les tests automatiques (`unittest`, stdlib) du registre des produits et de la porte de publication, pour que toute régression future soit vue : `tests/test_produits.py`, `tests/test_publier.py`, avec des dépôts git temporaires — jamais les vrais dépôts.

## Definition of Done
- [ ] `tests/test_produits.py` : registre valide → `tous()`, `entreprise()`, `produit_de` (brief, défaut, invalide) ; ≥ 12 registres invalides (1 par règle de `_valider`, messages au format `produits[i].<champ> : … invalide (…)`) ; cache (2 appels = 1 lecture ; mtime changé = relu) ; `verifier` ne lève jamais (chemin `~user/`, dossier sans `.git`, branche absente)
- [ ] `tests/test_publier.py` : dépôts git TEMPORAIRES (`tempfile`, `git init`, commits datés par `GIT_COMMITTER_DATE`) + registre temporaire pointant dessus : GO (site à jour) ; P1 site hors branche → NO-GO `site-branche` ; P2 titres « pages et textes absents » / « captures absentes » ; P3 sans troncature (> 200 commits dont N feat → titre exact), `RE_FEAT` (`feat`, `ajout`, `ajoute`) ; P4 captures < UI → bloquant ; P5 calendrier ouvert → bloquant ; contrôle en erreur → NO-GO même tout acquitté ; acquit expire quand la preuve change ; `--taches` idempotent (copie de vault temporaire) ; codes 0/1/2/3
- [ ] chaque test prouvé ROUGE sur un défaut injecté (au moins 4 : retirer le `try` de `verifier`, remettre `-n 200` en P3, retirer « erreur ⇒ NO-GO », casser un message de `_valider`) puis VERT sur le livrable — sorties collées, fichiers d'origine restaurés (vérifier `md5sum` avant/après)
- [ ] `python3 -m unittest discover -s tests -v` → sortie collée, 0 échec, < 30 s
- [ ] 0 écriture hors `tests/` et `$TMPDIR` ; vrais dépôts : `git -C <d> status --porcelain` avant == après
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `tests/test_produits.py` | E | neuf |
| `tests/test_publier.py` | E | neuf |
| `bin/produits.py` | L | API (injection de défaut sur une COPIE seulement) |
| `bin/publier.py` | L | API, contrôles |
| `produits.json` | L | forme du registre |
| `vault/projets/seagle-pilotage/contrat.md` | L | §C1 L40-116 · §C5 L207-247 · DoD L7 L333 |
| `vault/projets/seagle-pilotage/decisions.md` | L | amendements §C5 du 2026-10-16 |

## Contrats
API :
```python
# bin/produits.py
def charger(chemin: Path = FICHIER) -> dict[str, Produit] ; def erreur() -> str ; def tous() -> tuple[str, ...]
def produit(cle) -> Produit | None ; def entreprise() -> Produit | None ; def produit_de(meta_brief: dict) -> tuple[str, str] ; def verifier(p) -> list[str]
# bin/publier.py
def cmd(args) -> None ; def evaluer(cle: str, aujourd_hui: date | None = None) -> dict ; def git(depot: Path, *argv: str) -> str
```
`charger(chemin)` : passer le chemin (défaut figé à l'import) ; `publier` lit le registre via `produits` — injecter un registre temporaire (variable d'environnement si elle existe, sinon monkeypatch de `produits.FICHIER` + `charger.__defaults__`, à constater dans le code).

## Décisions actées
- tests stdlib (`unittest`), 0 dépendance ; jamais de réseau ; jamais les vrais dépôts en écriture
- injection de défaut : sur une copie dans `$TMPDIR` importée par chemin, jamais sur `bin/` réel

## Hors périmètre
- modifier `bin/*` (constater un défaut = le décrire en `## Pour la suite`) ; `bin/dash.py` (T021 en parallèle)

## Environnement
- `git` 2.x local ; `GIT_AUTHOR_DATE` / `GIT_COMMITTER_DATE` pour dater ; `git -c user.email=t@t -c user.name=t`
- `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (`tests/`), Grep, `Bash(python3:*)`, `Bash(md5sum:*)`, `Bash(git -C:*)` (lecture des vrais dépôts), `Bash(mkdir -p tests)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T022
projet: seagle-pilotage
statut: revue | bloque
---
## Livré
- chemin — n tests
## Vérifié comment
commande → sortie brute (rouge puis vert)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : défauts constatés
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
