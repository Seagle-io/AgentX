---
pack: T066
projet: geolens-viewer
role: implementeur
cree: 2026-10-08
---

# Pack T066 — Tuiles L5+L6 : CSP viewer (origine S3 provisoire), credentials same-origin, Caddy encode par type, .env

> Seule source de vérité de l'agent T066. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Préparer le navigateur et l'infra à la redirection des tuiles vers S3 : CSP viewer autorisant l'origine du bucket (provisoire, bucket pas encore créé), fetch des tuiles en `credentials: 'same-origin'` pour que la 302 cross-origin passe le CORS, Caddy ne compressant que les types texte, `.env.production.example` documenté ; test CSP neuf. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] meta CSP de `web/viewer.html:12` ET `web/src/viewer/index.html:12` = contrat octet pour octet ; `node scripts/check-viewer-html-sync.mjs` (cwd G) → exit 0
- [ ] commentaire HTML 1 ligne au-dessus de la meta dans les 2 fichiers : « S3 : remplacer bucket-a-remplacer par S3_BUCKET réel avant TILE_PRESIGN_REDIRECT=1 (D21) »
- [ ] HttpBackend.ts:114, :126, :220, :241 (fetch d'URL signées `/storage/`) : `credentials: 'include'` → `'same-origin'` ; :298-363 (appels API JSON) INCHANGÉS ; pvPanels.ts:208 : changé SEULEMENT si l'URL est une URL de stockage signée (lire le code appelant, citer la preuve)
- [ ] Caddyfile:5 `encode zstd gzip` → bloc contrat ; Report-Only portail (Caddyfile ~:19) : img-src + origine S3 provisoire
- [ ] `.env.production.example` : ligne RATE_LIMIT_TILE_MAX (:10) + 2 lignes contrat
- [ ] `web/src/viewer/__tests__/csp-s3.test.ts` NEUF : cas listés, verts ; csp.test.ts existant reste vert (si sa constante CSP casse → l'adapter à la nouvelle meta, seule modif autorisée de ce fichier, la noter)
- [ ] `npm --prefix web run typecheck` → exit 0 ; `npm --prefix web test` → verts ; `npm --prefix web run build` → exit 0 — sorties collées
- [ ] caddy : `docker run --rm -v <G>/Caddyfile:/etc/caddy/Caddyfile:ro caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile` → sortie collée (image déjà tirée en T017)
- [ ] `git -C G diff --stat` collé
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/viewer.html` | E | meta :12 + commentaire |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/index.html` | E | miroir :12 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/HttpBackend.ts` | E | :110-130, :215-245 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/packs/shared/pvPanels.ts` | E | :195-215 (conditionnel) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/Caddyfile` | E | :5, Report-Only ~:19 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | E | :10 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/__tests__/csp-s3.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/__tests__/csp.test.ts` | E | adapter la constante si elle casse, rien d'autre |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/scripts/check-viewer-html-sync.mjs` | L | synchro des 2 HTML |

## Contrats
```html
<!-- meta, identique web/viewer.html:12 ET web/src/viewer/index.html:12 (S3 provisoire, D21) -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://bucket-a-remplacer.s3.fr-par.scw.cloud; font-src 'self' data:; connect-src 'self' blob: data: https://bucket-a-remplacer.s3.fr-par.scw.cloud; worker-src 'self' blob:; frame-src blob:; object-src blob:; base-uri 'self'; form-action 'self'" />
```
```caddy
# Caddyfile:5 « encode zstd gzip » → (tuiles binaires déjà compactes : 0 compression)
    encode {
        zstd
        gzip
        match {
            header Content-Type text/*
            header Content-Type application/json*
            header Content-Type application/javascript*
            header Content-Type application/wasm*
            header Content-Type application/xml*
            header Content-Type image/svg+xml*
        }
    }
# Report-Only portail (~:19) : img-src 'self' data: blob: → img-src 'self' data: blob: https://bucket-a-remplacer.s3.fr-par.scw.cloud
```
```dotenv
# .env.production.example — remplace la ligne RATE_LIMIT_TILE_MAX (:10) par :
RATE_LIMIT_TILE_MAX=5000                   # plafond/min PAR COMPTE (jeton vérifié) ; par IP si jeton invalide
TILE_PRESIGN_REDIRECT=0                    # 1 = tuiles binaires en 302 → GET S3 présigné (APRÈS : nom du bucket dans la CSP viewer + CORS bucket)
TILE_PRESIGN_TTL_SEC=300                   # validité max URL S3 = lecture possible après révocation (120..3600)
```
```
navigateur : fetch même origine → 302 vers S3 (autre origine) : avec credentials 'same-origin', pas de cookie envoyé à S3, ACAO exact suffit (pas d'ACAC) ; avec 'include', S3 devrait renvoyer Access-Control-Allow-Credentials → échec probable
```
Cas csp-s3.test.ts (readFileSync, env node) :
- les 2 HTML : connect-src ET img-src contiennent une origine qui matche /^https:\/\/[a-z0-9-]+\.s3\.fr-par\.scw\.cloud$/ ; 0 `*.` dans la CSP
- les 2 metas identiques
- HttpBackend.ts : 0 `credentials: 'include'` sur les lignes qui appellent `sign(` (regex sur le source)

## Décisions actées
- D20 : origine exacte, 0 wildcard ; encode par Content-Type ; credentials same-origin pour le stockage
- D21 : bucket provisoire marqué, flag à 0 jusqu'au vrai nom + CORS

## Hors périmètre
- api/ (L4 en cours/suivant) ; activer le flag ; CORS bucket (humain)
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; web/node_modules ; vitest env node ; build ≈ 20-35 s ; docker + image caddy:2-alpine en cache
- G sous git ; d'autres agents écrivent dans api/ en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix web run typecheck, npm --prefix web test, npm --prefix web run build, npx vitest, node scripts/check-viewer-html-sync.mjs, docker run caddy validate, git diff, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T066
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
