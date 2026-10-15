---
titre: geolens-web — modules sécurité livrés et contrats
resume: session_version, jeton tuile à expiration, trustProxy, safeHtml, CSP stricte, Caddy, secret worker
source: geolens-viewer T001-T045, decisions.md D1-D14
cree: 2026-10-07
tags: [note, geolens-web, securite]
---

# geolens-web — sécurité livrée

Chemins relatifs au dépôt geolens-web ([[geolens-web-outillage]]).

## Fait
- `api/src/session.ts` — session_version + claim `sv` ; requireAuth relit user+org à chaque requête
- `api/src/session.ts` — `setPasswordAndRevoke(db,id,hash,{activate?,expectedSv?})`
- `api/src/session.ts` — checkUserAccess ordre : user_missing → disabled → pending → org_suspended → session_revoked
- `api/src/tileExp.ts` — exp = (⌊(now+T)/W⌋+1)·W ; T 28800, W 14400 → 8-12 h
- `api/src/logRedact.ts` — `token` masqué dans req.url loggée
- `api/src/passwordPolicy.ts` — 8..256 points de code
- `api/src/emailSchema.ts` — normalizeEmail ; EMAIL_UNAVAILABLE 409 générique + 10/h
- `api/src/config.ts` — trustProxy = proxyList(TRUST_PROXY) IP/CIDR/mots-clés ; prod `uniquelocal` ; invalide → false ([[fastify-trustproxy-5-12]])
- `web/src/viewer/ui/safeHtml.ts` — escapeHtml, isSafeImageDataUrl (png|jpeg base64), oneOf ; `main.ts` garde escapeHTML:465
- `web/src/viewer/backend/HttpBackend.ts` — makeSignUrl : jeton seulement vers l'origine de apiBase
- CSP viewer stricte : 0 inline script, 0 CDN ; décodeurs DRACO/Basis dans `web/public/`
- dev : CSP assouplie par plugin vite `glr-csp-dev` (`web/src/viewer/cspDev.ts`)
- Caddyfile — nosniff, Referrer-Policy, frame-ancestors ; portail en CSP Report-Only ; 0 directive log
- `worker/geolens_worker/secret.py` — compare_digest ; GEOLENS_ENV=production ⇒ secret obligatoire

## Fait (T037-T045)
- `api/src/bodyField.ts` — `bodyStr(v: unknown): string` ; non-string → '' ; from-upload l'applique avant le verrou (T043)
- `api/src/logRedact.ts` — `redactUrl` : clé de query DÉCODÉE, insensible casse (`tok%65n`, `TOKEN`) ; chemin/fragment/`;token` non masqués
- `api/src/config.ts` — `posInt(v, def, max)` : TTL ≤ 604800, fenêtre ≤ 86400 ; "1e9", "Infinity", "0x3c" bornés
- `api/src/config.ts` — `proxyList` : v6 recouvrant `::ffff:0:0/96` exige ≥ /104
- `api/src/config.ts` — `productionProblems` / `loadProductionSafeConfig` : actif si GEOLENS_ENV (trim, lower) = production ([[fastify-trustproxy-5-12]])
- garde prod : R1-R8 ; JWT ≥ 32 car. et ≥ 10 distincts ; valeurs d'exemple refusées (JWT, DATABASE_URL, S3_BUCKET, clés S3) ; refus = exit 1 avant écoute
- `api/src/scripts/create-platform-admin.ts` — 1er admin sans SQL ; transaction ; mdp temporaire affiché ; exige Postgres déjà migré (API démarrée 1×) ; passe par la garde
- risque accepté : orgs homonymes si création concurrente emails ≠ (0 unicité de nom ; migration requise, decisions.md D14)
- `api/src/health.ts` — `registerHealth` : `/api/health` vivacité `{ok:true}` ; `/api/ready` DB `SELECT 1` + `storage.probe()` (HeadBucket) ; sondes 3 s ; 503 sans détail
- `/api/ready` publique, soumis au rate-limit global 300/min/IP ; `StorageDriver.probe()` ; droit s3:ListBucket requis
- `api/src/server.ts` upload : erreur stockage journalisée avant 502 `storage_transfer_failed`
- infra : compose Scaleway `environment:` en `${VAR:?}` ; GEOLENS_ENV, USE_MEM_DB, STORAGE_DRIVER fixés ; HSTS Caddy ; `api/Dockerfile` USER node + HEALTHCHECK `/api/ready`
- vérifié en conteneurs réels : [[verif-conteneurs-jetables]]

## Restes ouverts
- nodemailer 10.x (majeure) · audit fix transitifs
- jeton tuile hors URL · police Google Fonts dans ReportGenerator
- runbook restauration jamais joué (restauration Scaleway = humain)
- `req.query.search` `.toString()` (server.ts:2136) ; `catch {}` silencieux hors upload
- `.env.example` TTL 3600 ≠ 8-12 h (dev seulement) ; SMTP `__…__` hors garde
- pool pg épuisé par requêtes figées : NV

## Voir aussi
- [[geolens-web-outillage]]
