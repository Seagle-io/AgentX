---
pack: T068
projet: geolens-viewer
role: verificateur
cree: 2026-10-08
---

# Pack T068 — Mesure de contrôle + vérif tuiles : K=1/10/50, 302 MinIO, 2 comptes même IP

> Seule source de vérité de l'agent T068. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Prouver ou réfuter par la mesure que les lots T064-T067 tiennent la cible D19 (10-30 comptes sur un même modèle sans saturer l'API) : M1 régression locale vs T062, M2 redirection 302 vers S3 (MinIO local), M3 quota par compte (2 comptes derrière une IP) ; + tentatives de casser (URL présignée dans les logs, 302 hors périmètre, accès révoqué) ; `OK` ou `DÉFAUTS` chiffrés ; 0 correction. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] M1 · API :4100 (pg-mem, stockage local, RATE_LIMIT off), même mix que T062 (5 fichiers villelaure-real dont 2 synthétiques créés dans une COPIE du stockage hors G), K = 1, 10, 50 × 20 boucles → tableau ; critère : 0 5xx ; req/s ≥ 0,9 × (401 / 796 / 972) ; p95 ≤ 1,1 × (5,5 / 25,6 / 93,9 ms)
- [ ] M2 · MinIO local (`docker run -d --rm --name t068-minio -p 9100:9000 … bitnamilegacy/minio:latest` ou image équivalente déjà en cache ; bucket créé ; seed villelaure-real copié) + API :4101 `STORAGE_DRIVER=s3 S3_ENDPOINT=http://127.0.0.1:9100 S3_FORCE_PATH_STYLE=1 TILE_PRESIGN_REDIRECT=1` ; K=50 × 20, `fetch(u, { redirect: 'manual' })` → 302 sur 100 % des binaires (.b3dm/.pnts/.jpg) ; tileset.json/project.json → 200 ; req/s ≥ 972 ; p95 ≤ 94 ms ; octets de corps servis par l'API pour les binaires = 0 ; `curl -s -o /dev/null -w '%{http_code}' "<Location>"` → 200 ; 2 Location même fenêtre (2 comptes) identiques
- [ ] M3 · API :4102 `RATE_LIMIT=1` (pg-mem), 1 IP : compte A (admin@demo) et compte B (membre@demo, accès au projet villelaure accordé par la route admin existante) ; A ×6200 → ≈ 5000 OK puis 429 ; B ×2000 PENDANT → 0 × 429
- [ ] casser : grep des logs API (stdout capturé) → 0 `X-Amz-Signature` / `X-Amz-Credential` ; HEAD et Range sur .b3dm → pas de 302 ; compte désactivé (route admin) après émission du jeton → 403 au lieu de 302 ; jeton forgé → 403 puis 429 (clé IP)
- [ ] `npm --prefix api test` et `npm --prefix web test` → sorties collées
- [ ] nettoyage : `docker stop t068-minio` ; process API tués ; 0 fichier créé dans G (`git -C G status --short` vide hors lots non commités éventuels)
- [ ] verdict `OK` | `DÉFAUTS` ; défaut = fichier:ligne + repro + attendu/obtenu
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule (+ exécution) ; écriture : result.md + scripts et copie de stockage dans un dossier `mktemp -d` HORS G.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | route storage (rg `'/api/projects/:id/storage/*'`), routes admin d'accès projet / désactivation (rg) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/storage.ts` | L | presignGet, createStorageDriver S3 (env attendues) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | variables S3_*, TILE_PRESIGN_*, RATE_LIMIT* |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileRedirect.ts` | L | extensions redirigées |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/seed.ts` | L | comptes démo, projet villelaure |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/docker-compose.yml` | L | config MinIO de dev (image, variables) |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/geolens-viewer/taches/T062-reco-charge-tuiles-n-comptes-sur-un-meme-modele-/result.md` | L | mesure de référence, protocole |

## Contrats
```
référence T062 (loopback, pg-mem, stockage local, 1 user, mix 5 fichiers ×20/session) :
K=1 401 req/s p50 2,2 p95 5,5 · K=10 796 / 10,3 / 25,6 · K=50 972 / 41,9 / 93,9 ms ; 0 429 / 0 5xx ; RSS 217→393 Mo
rate-limit T062 : 1 IP, 6200 GET → 5000 × 200 puis 1200 × 429 (clé IP)
lancement API (T062) : cwd api, `USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=<copie> JWT_SECRET=e2e PORT=4100 WEB_ORIGIN=http://localhost:5180 npx tsx src/index.ts`
login : POST /api/auth/login {email,password} → cookie glx_session ; admin@demo.geolens.fr / demo1234 ; membre@demo.geolens.fr (mot de passe : seed.ts)
GET /api/projects → id villelaure ; GET /api/projects/:id → tilesetUrl signée ; URL de tuile = même base + rel + `?token=`
ports INTERDITS : 5173 (Vite d'un autre projet) ; 5183 ; utiliser 4100-4102, 9100-9101
D20 : 302 seulement GET sans Range, binaires ; 304 avant 302 ; échec presign → stream ; TTL 300 s ; quota `tu:<u>` 5000/min
```

## Décisions actées
- D19 cible 10-30 comptes ; D20 contrat ; D21 flag à 0 en prod tant que bucket + CORS absents (ici MinIO local, flag à 1 pour la mesure seulement)

## Hors périmètre
- corriger quoi que ce soit ; éditer un fichier de G ; installer une dépendance npm ; docker compose de prod ; supprimer des volumes Docker
- push, remote, PR, commit

## Environnement
- node v22.22.1 ; api/node_modules (@aws-sdk) ; docker présent, images en cache : bitnamilegacy/minio:latest, caddy:2-alpine
- G sous git (HEAD = commits T064-T067) ; aucun autre agent actif sur G pendant la mesure
- mesure loopback : chiffres relatifs (avant/après), pas des seuils de prod — le dire

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(node, npx tsx, curl, docker run/stop/exec (minio), mktemp, cp, ps, kill des seuls process lancés, rg, git status, npm --prefix api test, npm --prefix web test), Write (result.md + fichiers du dossier jetable)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T068
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Mesures
| scénario | K | req/s | p50 | p95 | 302 % | 429 | 5xx | octets API | critère |
## Livré
- M1, M2, M3, casse — OK | KO (≤ 8 mots)
## Défauts
- ∅ | Dn · fichier:ligne · repro · attendu / obtenu
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
