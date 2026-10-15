---
pack: T005
projet: seagle-pilotage
role: implementeur
cree: 2026-10-16
---

# Pack T005 — L2 CLI : projet --produit, rattacher, doctor produits, publier

> Seule source de vérité de l'agent T005. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Brancher le registre des produits dans la CLI `bin/vx.py` (`projet --produit`, `rattacher`, contrôles produits de `doctor`, sous-commande `publier` qui délègue à `bin/publier.py`) et le gabarit `brief.md`, puis rattacher les 11 projets existants — à la lettre de `contrat.md` §C0 (migration) et §C4.

## Definition of Done
- [ ] `agentx projet <slug> [--titre T] [--produit <cle>]` : écrit `produit: <cle>` dans le brief ; cle inconnue → die 2 avec la liste des clés, AUCUN dossier créé
- [ ] `agentx rattacher <projet> <cle>` : réécrit le frontmatter du brief par `ecrire_frontmatter` (jamais à la main), journalise « rattaché à <cle> » ; idempotent (2e appel : 0 changement, message)
- [ ] `agentx doctor` : + « projet <slug> : produit absent|inconnu (<v>) » ; + `produits.erreur()` ; + `verifier(p)` par produit actif ; rc ≠ 0 si erreur de registre
- [ ] `agentx publier <cle> [--json] [--taches] [--acquitter <id> --motif "…"]` : délègue `import publier ; publier.cmd(args)` ; `bin/publier.py` absent (T006 en parallèle) → message clair + exit 3, pas de traceback
- [ ] `vault/_templates/brief.md` : ligne `produit: {{PRODUIT}}` après `depot:` ; `cmd_projet` remplit `{{PRODUIT}}` (vide si absent)
- [ ] migration du VRAI vault par la CLI : `./bin/agentx rattacher <slug> <cle>` ×11 (table Contrats) ; puis les 3 commandes « DoD L2 » de `contrat.md:320-325` → sorties collées (`['agentx', 'geolens', 'kora', 'seagle']`)
- [ ] prouvé d'abord sur banc `.cache/banc-T005` (projet avec/sans produit, cle inconnue, rattacher ×2) avant le vrai vault ; sorties collées
- [ ] aide `./bin/agentx help` : 2 lignes `projet … --produit`, `rattacher`, 1 ligne `publier` (bloc d'aide de `bin/agentx`) ; `python3 -m py_compile bin/vx.py` rc 0 ; `./bin/agentx doctor` → 0 « produit absent|inconnu »
- [ ] `git diff --stat -- bin/vx.py bin/agentx vault/_templates/brief.md` collé ; briefs migrés : `git diff --stat -- vault/projets/*/brief.md` collé (11 fichiers, 1 ligne chacun)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/vx.py` | E | `cmd_projet`, `cmd_doctor`, parser, nouvelles `cmd_rattacher`, `cmd_publier` |
| `bin/agentx` | E | bloc d'aide seulement |
| `vault/_templates/brief.md` | E | ligne `produit:` |
| `bin/produits.py` | L | API du registre (T003) |
| `vault/projets/seagle-pilotage/contrat.md` | L | **§C0 migration L32-37 · §C4 L196-205 · DoD L2 L320-325** |
| `vault/projets/*/brief.md` | E | via `agentx rattacher` UNIQUEMENT |
| `.cache/banc-T005/` | E | banc |

## Contrats
Migration (§C0) :
```
agentx-entreprise, agentx-immeuble, agentx-voix            → agentx
geolens-viewer, geolens-preview-3d, geolens-charge-3d      → geolens
orthopro, dashboard-grille, dashboard-direct (clos)        → kora
seagle-site, seagle-pilotage                               → seagle   (entreprise)
```
API registre (T003, `bin/produits.py`) :
```python
def erreur() -> str ; def tous() -> tuple[str, ...] ; def produit(cle) -> Produit | None ; def entreprise() -> Produit | None
def produit_de(meta_brief: dict) -> tuple[str, str]   # (cle, "brief"|"defaut"|"")
def verifier(p: Produit) -> list[str]                  # [] = OK
```
`cmd_tache` recopie déjà `env.md` au scaffold (`_avec_fiche_env`) ; `verrou(proj)` (flock) entoure les écritures d'id.

## Décisions actées
- R1 : `produit:` dans brief.md ; jamais de liste de projets dans produits.json ; jamais déplacer `vault/projets/<slug>`
- `agentx-voix` : rattaché à agentx seulement ; ne PAS toucher à ses tâches (autre initiative)
- frontmatter jamais édité à la main : CLI seule

## Hors périmètre
- `bin/publier.py` (T006 en parallèle), `bin/dash.py`, `dash/*`
- statut des projets (`clos`…) : inchangé

## Environnement
- banc : `B=.cache/banc-T005; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin dash roles.json produits.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` ; recopier ton `bin/vx.py` avant chaque essai
- `garde_bash` refuse les commandes citant push/migrations ; `rg -h` = aide en rg 14 : utiliser `-I`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(python3:*)`, `Bash(./bin/agentx:*)`, `Bash(rg:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/banc-T005)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T005
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
