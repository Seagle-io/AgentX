---
pack: T011
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T011 — Worker : secret comparé en temps constant, obligatoire en prod

> Seule source de vérité de l'agent T011. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Déplacer le contrôle du secret worker dans un module pur NEUF `worker/geolens_worker/secret.py` (comparaison `hmac.compare_digest`, refus de démarrer sans secret si `GEOLENS_ENV=production`), brancher `app.py` dessus, tester avec un fichier neuf lançable sans scipy. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] `geolens_worker/secret.py` NEUF = contrat verbatim, imports stdlib seulement (os, hmac, logging) + `fastapi.HTTPException`
- [ ] `app.py:49-52` `_check_secret` supprimé → `from .secret import check_secret, require_secret_at_startup` ; 4 appels (:122, :133, :139, :155) → `check_secret(x_worker_secret)`
- [ ] `app.py` `create_app()` (:112) appelle `require_secret_at_startup()` en 1ʳᵉ ligne
- [ ] `rg -n "compare_digest" worker/geolens_worker` → 1 hit (secret.py) ; `rg -n "!= expected" worker/geolens_worker` → ∅
- [ ] `tests/test_secret.py` NEUF : 7 cas listés
- [ ] `python3 -m pytest -q --noconftest tests/test_secret.py` (cwd worker) → verts, sortie collée
- [ ] `python3 -m py_compile geolens_worker/app.py geolens_worker/secret.py` → exit 0
- [ ] `git -C G diff --stat` + `git -C G status --short worker` collés : 0 fichier hors WL
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/worker/geolens_worker/secret.py` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/worker/geolens_worker/app.py` | E | :16-52, :112-160 seulement |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/worker/tests/test_secret.py` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/worker/tests/test_app.py` | L | :118-124 test_secret_partage (modèle, 0 modif) |

## Contrats
```python
# ═══ actuel app.py:49-52 (à supprimer)
def _check_secret(x_worker_secret: str | None) -> None:
    expected = os.environ.get("GEOPLAN_WORKER_SECRET", "").strip()
    if expected and x_worker_secret != expected:
        raise HTTPException(status_code=401, detail="secret worker invalide")

# ═══ geolens_worker/secret.py (NEUF)
SECRET_ENV = "GEOPLAN_WORKER_SECRET"
ENV_ENV = "GEOLENS_ENV"          # "production" ⇒ secret obligatoire

class MissingWorkerSecret(RuntimeError): ...

def expected_secret() -> str:
    """os.environ.get(SECRET_ENV, "").strip()"""

def is_production() -> bool:
    """os.environ.get(ENV_ENV, "").strip().lower() == "production" """

def require_secret_at_startup() -> None:
    """secret vide + production → raise MissingWorkerSecret(f"{SECRET_ENV} requis quand {ENV_ENV}=production")
       secret vide hors production → logging.getLogger("geolens_worker").warning(… « worker SANS authentification » …)
       secret présent → rien"""

def check_secret(x_worker_secret: str | None) -> None:
    """expected vide → return (dev, comportement actuel conservé)
       sinon : hmac.compare_digest(expected.encode(), (x_worker_secret or "").encode()) faux
               → raise HTTPException(status_code=401, detail="secret worker invalide")"""
```
Côté API (info, 0 modif) : api/src/geoplan/computeProxy.ts:155 envoie `X-Worker-Secret` si config.geoplanWorker.secret.
Cas test_secret.py (monkeypatch ; importer `geolens_worker.secret` seul, JAMAIS `geolens_worker.app`) :
- secret "s3cret", header "s3cret" → 0 exception
- secret "s3cret", header "faux" → HTTPException 401
- secret "s3cret", header None → 401
- secret vide, header None → 0 exception
- secret vide + GEOLENS_ENV=production → require_secret_at_startup lève MissingWorkerSecret
- secret vide + GEOLENS_ENV absent → 0 exception, warning journalisé (caplog)
- secret "  s3cret  " (espaces) + header "s3cret" → 0 exception (strip)

## Décisions actées
- refus de démarrage seulement si GEOLENS_ENV=production — decisions.md H1
- sans secret hors prod : warning, accès ouvert — dev inchangé
- module pur séparé — app.py importe scipy, non installé

## Hors périmètre
- tests/test_app.py, conftest.py (0 modif) ; autres routes/logique worker
- api/, compose, Dockerfile, README worker
- installer des paquets Python (pip)
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- python3 système + /usr/bin/pytest ; fastapi, numpy, httpx importables ; scipy ABSENT → `tests/test_app.py` KO à la collecte (attendu, NV) ; conftest.py importe des deps lourdes → `--noconftest`
- worker absent des docker-compose*.yml
- G sous git : baseline 745d46f ; d'autres agents écrivent dans api/, web/, e2e/ en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(python3 -m pytest, python3 -m py_compile, git diff, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T011
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
