---
pack: T046
projet: geolens-viewer
role: scribe
cree: 2026-10-07
---

# Pack T046 — Capitaliser geolens-viewer : vague sécurité/exploitation T033-T045

> Seule source de vérité de l'agent T046. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Transformer les retours de T033-T045 en (1) mise à jour des 2 notes geolens-web existantes, (2) 1 note NEUVE sur la vérification en conteneurs jetables, (3) ≤ 4 règles ajoutées au gabarit de pack, (4) état coché de la DoD du brief ; 0 récit, 0 fichier de G touché.

## Definition of Done
- [ ] `vault/connaissances/geolens-web-securite-carte.md` : modules livrés T037-T044 ajoutés (liste N1), ≤ 70 l
- [ ] `vault/connaissances/geolens-web-outillage.md` : faits N2 ajoutés, ≤ 55 l
- [ ] `vault/connaissances/verif-conteneurs-jetables.md` NEUF ≤ 35 l : faits N3 ; frontmatter `titre`, `resume`, `source`, `cree: 2026-10-07`, `tags: [note, …]` (modèle ortho-front-outillage.md) ; liens `[[geolens-web-securite-carte]]`, `[[geolens-web-outillage]]`
- [ ] `vault/_templates/context.md` : ≤ 4 règles issues des `## Retour sur le pack` T033-T045 (au moins R1-R3 ci-dessous), 1 ligne dense chacune dans la section qui empêche la dérive ; gabarit ≤ 100 l ; règles déjà présentes non dupliquées
- [ ] `vault/projets/geolens-viewer/brief.md` : DoD cochée `[x]` avec preuve `(T0xx)` ou annotée `— remplacé : D2/D6` ou laissée `[ ]` avec la raison ≤ 10 mots ; frontmatter `statut:` inchangé ; aucune autre section modifiée
- [ ] `python3 bin/vx.py index` lancé (cwd AgentX) → sortie collée
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/vault/connaissances/geolens-web-securite-carte.md` | E | note existante |
| `/home/jdrac/Documents/Workspace/AgentX/vault/connaissances/geolens-web-outillage.md` | E | note existante |
| `/home/jdrac/Documents/Workspace/AgentX/vault/connaissances/verif-conteneurs-jetables.md` | E | NEUF |
| `/home/jdrac/Documents/Workspace/AgentX/vault/_templates/context.md` | E | gabarit |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/geolens-viewer/brief.md` | E | DoD :16-28 seulement |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/geolens-viewer/decisions.md` | L | D1-D13 |
| `/home/jdrac/Documents/Workspace/AgentX/vault/connaissances/ortho-front-outillage.md` | L | modèle de note |

## Contrats
Sources : `python3 bin/vx.py integrer T033 T034 T035 T036 T037 T038 T039 T040 T041 T042 T043 T044 T045 --projet geolens-viewer` + `rg -A4 "## Retour sur le pack" vault/projets/geolens-viewer/taches/T03[3-9]*/result.md vault/projets/geolens-viewer/taches/T04[0-5]*/result.md` (seules lectures de result.md autorisées).
```
N1 modules (G/api/src) :
- bodyField.ts bodyStr(v: unknown): string — champ de corps non-string → '' (T037, T043 from-upload avant le verrou)
- logRedact.ts redactUrl — clé de query DÉCODÉE, insensible casse (T037)
- config.ts posInt(v, def, max) — TTL ≤ 604800, fenêtre ≤ 86400 ; proxyList v6 recouvrant ::ffff:0:0/96 exige ≥ /104 (T037)
- config.ts productionProblems / loadProductionSafeConfig — garde si GEOLENS_ENV (trim, lower) = production ; R1-R8 + entropie ≥ 10 car. distincts, valeurs d'exemple refusées (T040, T043)
- scripts/create-platform-admin.ts — 1er admin sans SQL, transaction, mdp temporaire affiché (T040, T043) ; risque accepté : orgs homonymes en concurrence (pas d'unicité de nom, migration requise)
- health.ts registerHealth — /api/health vivacité, /api/ready DB SELECT 1 + storage.probe() (HeadBucket), sondes 3 s, 503 sans détail (T044) ; StorageDriver.probe()
- server.ts upload : erreur stockage journalisée avant 502 (T044)
- infra : compose Scaleway environment ${VAR:?}, GEOLENS_ENV/USE_MEM_DB/STORAGE_DRIVER fixés ; HSTS Caddy ; api/Dockerfile USER node + HEALTHCHECK /api/ready (T039, T044)
N2 outillage :
- e2e : playwright-core 1.61.0 exige chromium_headless_shell-1228 (`npx playwright-core install chromium` dans e2e) ; preview :5180, BASE=http://localhost:5180 (:5173 = Vite OrthoPro)
- e2e : Admin à onglets (« Projets & accès »), groupes d'org repliés, confirmDialog in-app (pas window.confirm) (T038)
- dev:api = tsx watch → toute édition de api/src redémarre l'API des preuves → séquencer lots api/ et e2e/
- pg-mem : ON CONFLICT non fiable ; ROLLBACK inopérant ; incompatible fake timers (T043, T044)
- G sans identité git : commit chef `git -c user.name=Julien -c user.email=julien@seagle.io` (1 commit/tâche, 0 push)
N3 vérif conteneurs (T042, T045) :
- préfixe glverif- partout ; nettoyage `docker rm -fv <nom>`, `docker network rm`, `docker rmi glverif-api` ; JAMAIS de prune (incident D13, garde_bash)
- minio/minio et minio/mc non pullables → bitnamilegacy/minio (mc inclus)
- COOKIE_SECURE=1 : curl -c ignore le cookie sur http → -D - puis -H "Cookie: glx_session=…"
- ports hôte 127.0.0.1:4100-4101 ; panne simulée par docker stop/start ou network disconnect/connect
Règles gabarit (au moins) :
- R1 Environnement : images Docker réellement pullables vérifiées par le chef (`docker pull` à blanc) avant dispatch
- R2 Contrats : pour un test HTTP, recopier nom du cookie de session, route de login et helper de fabrication (multipartBody, MINI_TILESET)
- R3 DoD : compter les occurrences d'une regex de DoD sur HEAD et les écrire dans le pack (« → N sur HEAD »), imports inclus dans « net 0 ligne »
```

## Décisions actées
- notes = faits réutilisables, pas le récit du projet — règle 10 CLAUDE.md
- brief : on coche, on ne réécrit pas — append-only esprit règle 7

## Hors périmètre
- tout fichier de G ; result.md / context.md des tâches ; decisions.md (le chef l'écrit)
- archiver le projet (`vx archive`) — décision humaine
- push, remote, PR, commit

## Environnement
- cwd AgentX ; vault Obsidian : wikilinks, frontmatter YAML, 0 HTML
- `python3 bin/vx.py` disponible (integrer, index) ; la garde Bash refuse toute commande dont le TEXTE contient un prune Docker → écrire les notes avec Write/Edit, pas en heredoc

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(python3 bin/vx.py integrer, python3 bin/vx.py index, rg, wc)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T046
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
