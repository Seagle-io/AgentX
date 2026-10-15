---
tache: T013
statut: fait
---
## Livré
G=…/geolens-web-feat-viewer-online/api/src
- Q1 gate : config.ts:325 — `productionProblems` = [] si `GEOLENS_ENV`≠'production' ; GEOLENS_ENV ∉ clés .env S (keys-et-ls) → 0 problème, boot non bloqué. NODE_ENV ≠ GEOLENS_ENV.
- Q1 NODE_ENV : `rg NODE_ENV G/src` → ∅ hors tests ; seul usage Dockerfile:13 `ENV NODE_ENV=production` → effet 0 sur la config.
- Q1 si GEOLENS_ENV=production posé (déconseillé) :
  - config.ts:328-330 JWT_SECRET → inconnu (valeur secrète ; clé présente)
  - :331-333 DB → passe probable (USE_MEM_DB=0, DATABASE_URL présente ; motif exemple NV)
  - :334-338 S3 → passe (STORAGE_DRIVER=s3, S3_BUCKET=geolens, clés présentes)
  - :340 SEED_DEMO → passe (absent → false, config.ts:~232)
  - :341 RATE_LIMIT → passe (RATE_LIMIT=1)
  - :342 COOKIE_SECURE → ÉCHOUE (=0)
  - :343 WEB_ORIGIN → ÉCHOUE (http://82.65.97.67)
  - :344 TRUST_PROXY → passe (absent)
  - :347 RETENTION_* → passe (absent)
- Q1 autre refus : server.ts:152 — throw si JWT_SECRET absent/=défaut (useMemDb=false) → clé JWT_SECRET présente ; valeur inconnue (S tourne déjà avec).
- Q2 jobs :
| job | déclencheur | cible | opération | dans S |
|---|---|---|---|---|
| sweepOrphans server.ts:2497,2502,~2488 | boot + /15 min | table organizations ; S3 `uploads/<org>/_ingest-tmp/` (orphanSweep.ts:40-52) | SELECT ; list ; DeleteObject si mtime>2 h | oui (S server.ts ~2430 identique) |
| pruneAnalyze server.ts:2502 | /15 min | Map mémoire analyzeStore | abortMultipart/deleteFile sur entrées mémoire (∅ au boot) | oui |
| retention scheduler retention.ts:141-152 | +10 min puis /24 h | audit_log, users, organizations, projects | SELECT ×3 (mode report) | non (G seul) |
| runRetentionPass retention.ts:125 | idem | audit_log | INSERT `retention_<purge>` ×3 par passe, même en report | non |
- Q2 `RETENTION_MODE` absent, base réelle → mode='report', deliverablesMode='report' (config.ts:220,~296) → scheduler démarre ; S3 : 0 écriture ; base : OUI INSERT audit_log (retention.ts:125) ; purges = SELECT seulement (:42,:52,:80). 3 INSERT/24 h dès +10 min.
- Q2 `RETENTION_MODE=off` → deliverablesMode défaut 'off' (config.ts retention.deliverablesMode) → retention.ts:142 return, aucun timer, 0 requête. OK.
- Q2 sweepOrphans/pruneAnalyze : aucune clé env (constantes server.ts ORPHAN_TMP_TTL_MS, SWEEP_INTERVAL_MS) → non désactivables par env.
- Q3 boot hors migrate (server.ts:145-245) : seed(db) uniquement si `config.seedDemo` (:~160) ; SEED_DEMO absent + USE_MEM_DB=0 → false → 0 seed. Admin : ∅ autre écriture dans :145-245.
- Q3 PIÈGE migrate() = écritures DML en plus du DDL, à chaque boot (schema.ts:223-246) :
  - schema.ts:307 `DELETE FROM org_packs WHERE pack_key='premium'` — inconditionnel
  - schema.ts:296-304 renames packs industrie/patrimoine→etat_des_lieux, solaire→architecte, stocks→btp : UPDATE/INSERT/DELETE org_packs si lignes anciennes (:281-292)
  - schema.ts:258 `UPDATE projects SET geolens_verified=true WHERE processing_provenance='geolens' AND geolens_verified=false` — 0 ligne si colonne déjà en place ; si colonne ajoutée par D4 (DEFAULT false) → UPDATE de tous projets geolens (NV : D4 non lu)
  - non désactivable par env (`migrateAndSeed:false` = option code, index.ts ne la passe pas)
- Q4 : session.ts:48 `claims.sv ?? 0` ; schema.ts:88 `ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0` → anciens JWT (sv absent) = 0 = valeur colonne → sessions/cookies existants VALIDES après redéploiement, si JWT_SECRET inchangé (auth.ts:62 jwtSecret signe). Rejet seulement si user disabled/pending/org suspendue (session.ts:34-37).
## Vérifié comment
- `rg -n NODE_ENV G/src` → ∅ (hors tests)
- `rg -n NODE_ENV G/api/Dockerfile` → 13:ENV NODE_ENV=production
- `rg -n "setInterval|startRetention|sweepOrphans\(\)" G/server.ts` → :2497,:2502,:2505
- `rg DML schema.ts` → :258,:296,:300,:304,:307
- NV : valeurs JWT_SECRET/DATABASE_URL (secrètes) ; contenu D4 ; migrate() de l'API S non comparé ; cookie/auth.ts hors session.ts non lus.
## Écarts
- lecture hors WL: api/src/schema.ts:223-310 — migrate() contient DML (Q3 sinon faux négatif)
- lecture hors WL: api/src/server.ts rg setInterval (même fichier, WL partielle)
## Pour la suite
- Boot G sur S avec env actuel : OK attendu — GEOLENS_ENV absent ⇒ productionProblems=[] ; seul fail-fast restant server.ts:152 (JWT_SECRET fort présent, valeur NV).
- Écritures hors D4 : (1) audit_log INSERT ×3 /24 h dès +10 min (retention report) ; (2) migrate() chaque boot : DELETE org_packs 'premium' (schema.ts:307), renames packs (:296-304), UPDATE projects geolens_verified (:258, massif si colonne nouvelle) ; (3) sweepOrphans : DeleteObject `uploads/<org>/_ingest-tmp/*` >2 h, boot + /15 min (déjà fait par API S).
- Sessions : conservées si JWT_SECRET inchangé (sv absent→0, colonne DEFAULT 0).
- Env à ajouter : `RETENTION_MODE=off` (seule clé utile ; supprime (1)). NE PAS poser GEOLENS_ENV (COOKIE_SECURE=0 et WEB_ORIGIN http feraient refuser le boot). SEED_DEMO absent. Rien d'autre requis.
- Impossible par env seul : (2) migrate DML et (3) sweepOrphans (aucune clé) ; pour 0 écriture il faut un patch : schema.ts:223-246 (skip DML) / server.ts:2497-2505 (garde) — ou accepter.
## Retour sur le pack
- Manquait: schema.ts (migrate DML) hors WL ; contenu D4 pour juger :258
- Inutile: ∅
