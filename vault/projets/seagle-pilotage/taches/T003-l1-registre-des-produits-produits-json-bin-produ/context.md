---
pack: T003
projet: seagle-pilotage
role: implementeur
cree: 2026-10-16
---

# Pack T003 — L1 registre des produits : produits.json + bin/produits.py

> Seule source de vérité de l'agent T003. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Créer le registre des produits Seagle — `produits.json` (racine) et son propriétaire unique `bin/produits.py` (stdlib, modèle `bin/roles.py`) — à la lettre de `contrat.md` §C1, valeurs NV vérifiées sur disque.

## Definition of Done
- [ ] `produits.json` = bloc §C1 (`contrat.md:43-77`) ; chaque valeur NV (`ortho-front ui`, branche de publication agentx, `env` geolens, chemins `sources[]`) vérifiée par commande collée ; valeur fausse → corrigée ET listée en Écarts (ex. `PLAN_FACTURATION.md` inexistant → retiré)
- [ ] `bin/produits.py` : constantes, dataclasses, fonctions et `_valider` de §C1 (`contrat.md:78-116`) avec ces signatures ; n'importe ni `vx` ni `dash` ; cache `(chemin, st_mtime_ns)`
- [ ] 3 commandes « DoD L1 » de `contrat.md:313-319` exécutées, sorties collées (`verifier` → `[]` ×4, sinon `bloque` avec la sortie)
- [ ] registre muté dans `.cache/T003/` : 2 `entreprise:true`, couleur en double, `cle` `"Kora"`, `ui` `"../x"`, `version` 2, `bool` à la place d'un `int` → `charger(chemin)` lève `RegistreInvalide` ×6, messages collés ; `erreur()` sur registre absent → message, pas d'exception
- [ ] `verifier` ne fait que LIRE : `git rev-parse --verify -q` seulement ; `git -C <dépôt> status --porcelain` avant == après pour les 4 dépôts (collé)
- [ ] `python3 -m py_compile bin/produits.py` rc 0 ; `git status --short` → `produits.json`, `bin/produits.py` seuls (+ ton result.md)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `produits.json` | E | registre (neuf) |
| `bin/produits.py` | E | propriétaire du registre (neuf) |
| `vault/projets/seagle-pilotage/contrat.md` | L | **§C1 L40-116 · DoD L1 L313-319 : contrat verbatim** |
| `bin/roles.py` | L | modèle de registre (structure, cache, erreur) |
| `roles.json` | L | format de référence |
| `.cache/T003/` | E | registres mutés |

## Contrats
`contrat.md` §C1 = contrat, à appliquer à la lettre. Rappel des signatures :
```python
def charger(chemin: Path = FICHIER) -> dict[str, Produit]   # ordre fichier ; cache (chemin, st_mtime_ns) ; lève RegistreInvalide
def erreur() -> str ; def tous() -> tuple[str, ...] ; def produit(cle) -> Produit | None ; def entreprise() -> Produit | None
def chemin(s: str) -> Path ; def produit_de(meta_brief: dict) -> tuple[str, str] ; def verifier(p: Produit) -> list[str]
```
Faits constatés par le chef : `W/OrthoPro/ortho-front/src/app/router.tsx` (routes) ; `W/seagle-website/public/kora/` (61 fichiers) ; `W/Geolens-website/public/images/logiciel/vue-*.webp` (7).

## Décisions actées
- registre = source unique ; ajouter un produit = 1 entrée ; ordre du fichier = ordre des étages
- chemins finance listés, 0 montant ; `.docx` cités par chemin seulement
- jamais d'écriture git (0 fetch, 0 checkout) ; jamais de push

## Hors périmètre
- `bin/vx.py`, `bin/dash.py`, `dash/*` (lots suivants) ; `outils/captures/` (T004 en parallèle)

## Environnement
- `W` = `~/Documents/Workspace` ; Python 3 stdlib ; `garde_bash` refuse les commandes citant push/migrations
- `rg -h` = aide en rg 14 : utiliser `-I`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (WL), Grep, `Bash(python3:*)`, `Bash(git -C:*)` (lecture : rev-parse, status, log, ls-files), `Bash(ls:*)`, `Bash(rg:*)`, `Bash(mkdir:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T003
projet: seagle-pilotage
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison | valeur NV corrigée: champ — avant → après
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
