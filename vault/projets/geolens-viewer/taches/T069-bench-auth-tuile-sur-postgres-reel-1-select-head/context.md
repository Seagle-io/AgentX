---
pack: T069
projet: geolens-viewer
role: verificateur
cree: 2026-10-08
---

# Pack T069 — Bench auth tuile sur Postgres réel : 1 SELECT (HEAD) vs 2 SELECT (base) — trancher D1 T068

> Seule source de vérité de l'agent T069. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Mesurer sur un VRAI Postgres 16 (conteneur local) le coût du chemin d'auth d'une tuile (requêtes 304, sans stockage) pour HEAD (1 SELECT `TILE_GRANT_SQL`, tileAuth.ts) et pour la base 120d0aa (2 SELECT resolveSignedProject), + `EXPLAIN (ANALYZE, BUFFERS)` des requêtes ; rendre une recommandation chiffrée : garder 1 SELECT, revenir à 2 SELECT, ou réécrire la requête (préciser laquelle) ; 0 modification de G. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] Postgres : `docker run -d --rm --name t069-pg -e POSTGRES_PASSWORD=t069 -p 5544:5432 postgres:16-alpine` (image en cache) ; 2 bases `head` et `base`
- [ ] 2 API : HEAD (cwd G/api) sur :4110 et BASE (`git -C G archive 120d0aa api seed-data | tar -x -C $W/base`, `npm ci` INTERDIT → lancer avec `NODE_PATH`/lien symbolique vers G/api/node_modules, ou `cp -rs`) sur :4111 ; env : `USE_MEM_DB=0 DATABASE_URL=postgresql://postgres:t069@127.0.0.1:5544/<base> SEED_DEMO=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=<copie seed hors G> JWT_SECRET=<32+ car> PORT=… WEB_ORIGIN=http://localhost:5180 RATE_LIMIT=0 RETENTION_MODE=off`
- [ ] bench 304 (script T068 `b304.mjs`, réutilisé depuis le dossier T068) : K = 1, 10, 50 × 3 répétitions par API → req/s, p50, p95 ; ordre alterné HEAD/BASE
- [ ] `EXPLAIN (ANALYZE, BUFFERS)` via `docker exec t069-pg psql` : TILE_GRANT_SQL (paramètres réels : admin démo + projet villelaure ; membre sans accès) ; et les 2 requêtes de la base (loadUserAccessState + getAccessibleProject, SQL lus dans session.ts / tenancy.ts) → temps d'exécution, plan (Index Scan / Seq Scan)
- [ ] variante candidate si 1 SELECT plus lent : écrire le SQL proposé dans result.md, l'EXPLAINer (sans toucher G)
- [ ] recommandation : `garder 1 SELECT` | `revenir à 2 SELECT` | `réécrire : <SQL>` avec chiffres
- [ ] nettoyage : `docker stop t069-pg` ; API tuées ; `git -C G status --short` vide
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule (+ exécution) ; écriture : result.md + dossier jetable `mktemp -d` dans le scratchpad, HORS G.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileAuth.ts` | L | TILE_GRANT_SQL |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/session.ts` | L | loadUserAccessState SQL (base) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tenancy.ts` | L | getAccessibleProject SQL :87-121 (base) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/schema.ts` | L | index / PK disponibles |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | variables d'env (garde prod : GEOLENS_ENV non posé) |
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/2e7b366b-45a7-450b-b9df-37aa6f7ce759/scratchpad/t068.76Hp/b304.mjs` | L | bench 304 T068 (réutiliser) |
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/2e7b366b-45a7-450b-b9df-37aa6f7ce759/scratchpad/t068.76Hp/lib.mjs` | L | login, URL signée |

## Contrats
```
T068 (pg-mem, même machine) : chemin 304 HEAD 830-850 req/s vs BASE 120d0aa 1460-1502 req/s ; M1 K=50 HEAD 619-668 vs BASE 920-1049 req/s
TILE_GRANT_SQL (tileAuth.ts:14-26) : users u LEFT JOIN organizations uo LEFT JOIN projects p ON p.id = $2 LEFT JOIN project_orgs pog LEFT JOIN project_access pa WHERE u.id = $1
base : resolveSignedProject = loadUserAccessState (users ⋈ organizations, 1 SELECT) + getAccessibleProject (1 à 2 SELECT selon rôle)
hypothèse à tester : pg-mem exécute mal les LEFT JOIN multiples ; Postgres réel avec PK → < 1 ms chacun
ports interdits : 5173, 5183, 5432 (Postgres d'autres projets) ; utiliser 5544, 4110-4111
login seed : admin@demo.geolens.fr / demo1234 ; projet « Vieux Château de Villelaure » (préfixe villelaure-real)
```

## Décisions actées
- D20 : 1 SELECT voulu pour réduire la charge DB ; garde = test de parité ; 0 cache d'auth (D6)
- critère : la solution retenue doit être ≥ BASE en req/s sur Postgres réel au chemin 304, à ±10 %

## Hors périmètre
- modifier G ; npm install/ci ; supprimer des volumes Docker ; toucher d'autres conteneurs
- push, remote, PR, commit

## Environnement
- docker + image postgres:16-alpine en cache ; node v22.22.1 ; G HEAD = commit T067 (9bcd265), arbre propre
- l'API refuse de démarrer en prod mal configurée seulement si GEOLENS_ENV=production : ne pas le poser

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(docker run/exec/stop t069-pg, git archive, tar, cp, ln, node, npx tsx, curl, ps, kill des seuls process lancés, git status), Write (result.md + dossier jetable)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T069
statut: fait | bloque
recommandation: garder-1-select | revenir-2-select | reecrire
---
## Mesures
| API | K | req/s (3 rép.) | p50 | p95 |
## EXPLAIN
- requête · temps exec · plan clé
## Recommandation
- choix + chiffres ; SQL proposé si réécriture
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
