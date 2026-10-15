---
pack: T013
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T013 — Déploiement Scaleway : journaux bornés, healthcheck, runbook sauvegarde/restauration

> Seule source de vérité de l'agent T013. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Durcir la cible prod managée : rotation des journaux Docker + healthcheck api dans `docker-compose.scaleway.yml`, journaux nginx sans query string, `.env.production.example` aligné sur les décisions, et une section runbook sauvegarde/restauration dans `DEPLOYMENT.md`. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] `docker-compose.scaleway.yml` : bloc `logging` contrat sur api, web, caddy ; `healthcheck` contrat sur api ; web `depends_on: { api: { condition: service_healthy } }` ; commentaires d'en-tête L1-16 conservés
- [ ] `web/nginx.conf` : `log_format noquery` (hors bloc server) + `access_log /var/log/nginx/access.log noquery;` dans server
- [ ] `.env.production.example` : TILE_TOKEN_TTL_SEC=28800 + TILE_URL_WINDOW_SEC=14400 commentés (contrat) ; `JWT_SECRET` commentaire « identique à la restauration »
- [ ] `DEPLOYMENT.md` : nouvelle section `## 5 quinquies. Sauvegarde & restauration (managé)` après §5 (L59-66), 6 rubriques contrat ; §6 L128 « sauvegardes testées » → « runbook §5 quinquies, à jouer une fois »
- [ ] vérif compose : dossier jetable `mktemp -d` hors G, y copier docker-compose.scaleway.yml + `.env` factice (contrat) → `docker compose -f <tmp>/docker-compose.scaleway.yml config --quiet` exit 0, sortie collée
- [ ] vérif nginx : `docker run --rm -v <G>/web/nginx.conf:/etc/nginx/conf.d/default.conf:ro nginx:alpine nginx -t` → sortie collée, ou NV si image absente (pas de pull > 1 essai)
- [ ] `git -C G diff --stat` collé : 4 fichiers exactement
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/docker-compose.scaleway.yml` | E | 42 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/nginx.conf` | E | 23 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | E | 41 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/DEPLOYMENT.md` | E | §5 :59-66, §6 :119-128 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/Dockerfile` | L | image finale (node:22-slim, 0 wget/curl) |

## Contrats
```yaml
# logging — identique sur api, web, caddy
    logging:
      driver: json-file
      options: { max-size: "10m", max-file: "5" }
# healthcheck api — node:22-slim n'a ni wget ni curl → fetch node
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
# route existante : api/src/server.ts:257 app.get('/api/health', async () => ({ ok: true }));
```
```nginx
# web/nginx.conf — fichier monté en conf.d (contexte http) : log_format AVANT server {}
log_format noquery '$remote_addr - [$time_local] "$request_method $uri $server_protocol" $status $body_bytes_sent';
# dans server { } :
  access_log /var/log/nginx/access.log noquery;
```
```dotenv
# .env.production.example — remplacer la ligne TILE_TOKEN_TTL_SEC=3600 (L31) par :
# Jetons de tuile : validité garantie ≥ TTL, quantifiée par fenêtre (→ entre 8 h et 12 h)
TILE_TOKEN_TTL_SEC=28800
TILE_URL_WINDOW_SEC=14400
# .env factice de vérif (dossier jetable, JAMAIS dans G) : USE_MEM_DB=0 DATABASE_URL=postgresql://u:p@h:5432/g JWT_SECRET=x STORAGE_DRIVER=s3
```
DEPLOYMENT.md §5 quinquies — 6 rubriques, ≤ 45 lignes, puces :
1. Ce qui est sauvegardé par l'hébergeur : PostgreSQL managé (sauvegardes auto Scaleway, rétention à régler dans la console), Object Storage (activer versioning du bucket)
2. Ce qui NE l'est PAS et qu'il faut garder hors serveur : `.env` complet (JWT_SECRET — sans lui toutes les sessions et URLs de tuile sont invalides), volume `caddy-data` (certificats ; sinon ré-émission Let's Encrypt, quota)
3. Commandes de sauvegarde locale : `docker run --rm -v <projet>_caddy-data:/d -v "$PWD":/b alpine tar czf /b/caddy-data.tgz -C /d .` ; copie chiffrée du `.env`
4. Restauration pas à pas : restaurer la base (console Scaleway → point de restauration) · pointer `DATABASE_URL` · remettre `.env` identique · restaurer caddy-data · `docker compose -f docker-compose.scaleway.yml up -d --build`
5. Vérification après restauration : `docker compose ps` (api healthy) · login admin OK · ouverture d'un projet, tuile HTTP 200 · `curl -sI https://<domaine>/ | grep -ciE 'content-security|nosniff|referrer-policy'` → ≥ 3
6. Fréquence : runbook joué 1× avant ouverture client, puis 1×/trimestre ; noter date + résultat

## Décisions actées
- cible = docker-compose.scaleway.yml — decisions.md D2
- sauvegarde DB/objets = outils managés, pas de pg_dump — D2
- jetons tuile T 28800 W 14400 — D6
- 0 directive `log` Caddy, nginx sans query — jetons en query string
- `.prod.yml` hors périmètre — D2

## Hors périmètre
- Caddyfile (T010 en parallèle), docker-compose.prod.yml, docker-compose.yml, .env.example
- api/src, web/src, worker ; script de création d'admin (lot futur)
- créer un `.env` dans G ; `docker compose up`, build d'image
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- docker + Docker Compose v5.3.1 présents ; images non garanties en cache ; 0 `.env` dans G (gitignoré)
- `config --quiet` depuis G échoue faute de `.env` (T004) → d'où le dossier jetable
- shell humain fish → `bash -c` si POSIX
- G sous git : baseline 745d46f ; d'autres agents écrivent dans api/, web/src, worker/, e2e/, Caddyfile en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(mktemp, cp, docker compose config, docker run nginx -t, git diff, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T013
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
