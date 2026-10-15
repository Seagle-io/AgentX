---
pack: T031
projet: geolens-viewer
role: scribe
cree: 2026-10-07
---

# Pack T031 — Capitaliser geolens-viewer : gabarit de pack, notes geolens-web

> Seule source de vérité de l'agent T031. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Transformer les retours des 30 tâches geolens-viewer en (1) 6 améliorations du gabarit `vault/_templates/context.md`, (2) 3 notes atomiques NEUVES dans `vault/connaissances/` réutilisables par un futur pack geolens-web ; 0 récit, 0 fichier de G touché.

## Definition of Done
- [ ] `vault/_templates/context.md` : les 6 règles R1-R6 ajoutées, chacune 1 ligne dense dans la section qui empêche la dérive ; gabarit ≤ 95 lignes
- [ ] `vault/connaissances/geolens-web-outillage.md` NEUF (≤ 40 l) — commandes, versions, pièges (liste N1)
- [ ] `vault/connaissances/geolens-web-securite-carte.md` NEUF (≤ 50 l) — modules sécurité livrés et leurs contrats (liste N2)
- [ ] `vault/connaissances/fastify-trustproxy-5-12.md` NEUF (≤ 20 l) — fait N3
- [ ] chaque note : frontmatter `titre`, `resume`, `source`, `cree: 2026-10-07`, `tags: [note, …]` (modèle : ortho-front-outillage.md) ; liens `[[…]]` entre les 3 notes
- [ ] `python3 bin/vx.py index` lancé (cwd AgentX) → sortie collée ; INDEX liste les 3 notes
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/vault/_templates/context.md` | E | gabarit de pack |
| `/home/jdrac/Documents/Workspace/AgentX/vault/connaissances/geolens-web-outillage.md` | E | NEUF |
| `/home/jdrac/Documents/Workspace/AgentX/vault/connaissances/geolens-web-securite-carte.md` | E | NEUF |
| `/home/jdrac/Documents/Workspace/AgentX/vault/connaissances/fastify-trustproxy-5-12.md` | E | NEUF |
| `/home/jdrac/Documents/Workspace/AgentX/vault/connaissances/ortho-front-outillage.md` | L | modèle de note |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/geolens-viewer/decisions.md` | L | D1-D10, source des contrats |

## Contrats
Règles gabarit (agrégées des `## Retour sur le pack`, chef) :
- R1 DoD périmètre : `git diff --stat -- <chemins E>` (jamais diff global : arbre partagé) ; le chef commite en local après chaque tâche → base propre
- R2 plages de lignes E : inclure les imports en tête de fichier quand la tâche ajoute un import
- R3 coordonnées : donner une ancre `rg` en plus du n° de ligne (les lignes dérivent entre tâches successives sur le même fichier)
- R4 règle durcie (validation, borne) : `rg` des fixtures de test qu'elle casse AVANT dispatch, les lister dans le pack
- R5 contrat sur une option de lib tierce : vérifier le `.d.ts` de la version installée APRÈS montée (fastify 5.12.5 a retiré trustProxy numérique)
- R6 commande `rg` avec lookahead → `--pcre2` ; regex de DoD testée à blanc sur la chaîne de test elle-même (un test qui cite `unpkg` fait mentir `rg unpkg → ∅`)
Faits N1 (outillage) :
- G = ~/Documents/Workspace/Geolens/geolens-web-feat-viewer-online ; git local seul (0 remote, 0 push) ; commits locaux par tâche (chef)
- node v22.22.1 ; api : `npm --prefix api test` (vitest + pg-mem, USE_MEM_DB=1), `npm --prefix api run typecheck` (tsc -p tsconfig.test.json, noUnusedLocals) ; base 72 fichiers / ≥ 622 tests
- web : `npm --prefix web test` (vitest env node, 0 jsdom → helpers purs seulement ; ne jamais importer main.ts/POIManager.ts), `npm --prefix web run typecheck`, `build:viewer-types`, `build` (tsc + vite ≈ 20-35 s) ; 176 fichiers / 1691 tests
- `node scripts/check-viewer-html-sync.mjs` : synchro viewer.html ↔ src/viewer/index.html (meta CSP identique dans les 2)
- worker : scipy absent → app.py non importable ; `python3 -m pytest -q --noconftest tests/test_secret.py`
- e2e : `node proof-*.mjs` (playwright-core), e2e/node_modules absent ; `_proofEnv.mjs` : DIR, ASSETS_PRESENT, minTiles, skipIfMissing ; assets 3D absents de seed-data
- docker + compose v5 présents : `docker compose -f <tmp>/docker-compose.scaleway.yml config --quiet` avec .env factice hors G ; `docker run caddy:2-alpine caddy validate` ; nginx -t avec `--add-host api:127.0.0.1`
- monolithes gelés : main.ts 9405 l, server.ts ~3390 l → logique en module neuf + appel
Faits N2 (sécurité livrée, chemins relatifs à G) :
- api/src/session.ts : session_version + claim sv ; requireAuth relit user+org à chaque requête ; setPasswordAndRevoke(db,id,hash,{activate?,expectedSv?}) ; checkUserAccess ordre user_missing→disabled→pending→org_suspended→session_revoked
- api/src/tileExp.ts : exp = (⌊(now+T)/W⌋+1)·W, T 28800 W 14400 → 8-12 h ; api/src/logRedact.ts : `token` masqué dans req.url loggée
- api/src/passwordPolicy.ts (8..256 points de code) ; api/src/emailSchema.ts (normalizeEmail, EMAIL_UNAVAILABLE 409 générique + 10/h)
- api/src/config.ts : trustProxy = proxyList(TRUST_PROXY) IP/CIDR/mots-clés, prod `uniquelocal`, invalide → false
- web/src/viewer/ui/safeHtml.ts : escapeHtml, isSafeImageDataUrl (png|jpeg base64), oneOf ; main.ts garde escapeHTML:465
- web/src/viewer/backend/HttpBackend.ts makeSignUrl : jeton seulement vers l'origine de apiBase
- CSP viewer stricte (0 inline script, 0 CDN) ; dev assoupli par plugin vite `glr-csp-dev` (web/src/viewer/cspDev.ts) ; décodeurs DRACO/Basis dans web/public/
- Caddyfile : nosniff, Referrer-Policy, frame-ancestors ; portail en CSP Report-Only ; 0 directive log
- worker/geolens_worker/secret.py : compare_digest ; GEOLENS_ENV=production ⇒ secret obligatoire
- restes ouverts : nodemailer 10.x (majeure), audit fix transitifs, HSTS Caddy, jeton tuile hors URL, police Google Fonts dans ReportGenerator, runbook restauration jamais joué
Fait N3 : fastify ≥ 5.12.5 — `trustProxy: <number>` fail-closed (lib/request.js:51-54, jamais XFF) et retiré des types (fastify.d.ts:152 : boolean | string | string[] | fn) → utiliser IP/CIDR ou 'loopback'|'linklocal'|'uniquelocal'

## Décisions actées
- notes atomiques, 1 sujet par fichier — rejouables dans un pack
- gabarit : ajout de lignes, 0 section supprimée — packs existants restent valides

## Hors périmètre
- tout fichier de G ; packs/result.md des tâches (append-only, ne pas réécrire)
- skill chef-de-projet, CLAUDE.md, bin/
- push, remote, PR, commit

## Environnement
- vault Obsidian : markdown + frontmatter YAML, `[[wikilink]]`, 0 HTML, 0 section vide
- `python3 bin/vx.py index` régénère vault/INDEX.md (ne pas l'éditer à la main)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(python3 bin/vx.py index)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T031
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
