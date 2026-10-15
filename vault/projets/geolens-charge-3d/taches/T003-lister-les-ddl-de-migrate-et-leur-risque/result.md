---
tache: T003
statut: fait
---
## Livré
Fichier : G/api/src/schema.ts · 32 stmts SQL (split sur `;` :225) + 1 UPDATE (:258) + 5 DML JS (:289-307). Chaque stmt = autocommit, 0 transaction.

### Tableau DDL (S = présent sur serveur ; NEW = absent du serveur)
| schema.ts:L | DDL | idem | nature | verrou |
|---|---|---|---|---|
| :18 | CREATE TABLE IF NOT EXISTS organizations … | oui | CREATE TABLE | ∅ (no-op si existe) |
| :48-54 | ALTER TABLE organizations ADD COLUMN status/white_label/self_import/contact_email/contact_site/contact_phone/logo (7) | non (erreur « existe » avalée :238) | ADD COLUMN | ACCESS EXCLUSIVE ≈ instantané (DEFAULT constant, PG≥11) · S |
| :55 | ALTER TABLE organizations ADD COLUMN contract_end_at TIMESTAMPTZ | non (avalé) | ADD COLUMN nullable | ACCESS EXCLUSIVE ≈ instantané · **NEW** |
| :57 | CREATE TABLE IF NOT EXISTS users … | oui | CREATE TABLE | ∅ |
| :84-87 | ALTER TABLE users ADD COLUMN is_platform_admin/disabled/status/last_login (4) | non (avalé) | ADD COLUMN | ACCESS EXCLUSIVE ≈ instantané · S |
| :88 | ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0 | non (avalé) | ADD COLUMN NOT NULL DEFAULT const | ACCESS EXCLUSIVE ≈ instantané (PG≥11, sinon réécriture) · **NEW** |
| :94 | CREATE TABLE IF NOT EXISTS projects … | oui | CREATE TABLE | ∅ |
| :116 | ALTER TABLE projects ALTER COLUMN org_id DROP NOT NULL | oui (no-op si déjà nullable) | ALTER … DROP NOT NULL | ACCESS EXCLUSIVE ≈ instantané · S |
| :118-119 | ALTER TABLE projects ADD COLUMN processing_provenance/geolens_verified (2) | non (avalé) | ADD COLUMN NOT NULL DEFAULT | ACCESS EXCLUSIVE ≈ instantané · S |
| :121 | CREATE TABLE IF NOT EXISTS project_access … | oui | CREATE TABLE | ∅ |
| :131 | CREATE TABLE IF NOT EXISTS project_orgs … | oui | CREATE TABLE | ∅ |
| :137 | CREATE TABLE IF NOT EXISTS audit_log … (ip, user_agent dans CREATE) | oui | CREATE TABLE | ∅ |
| :149 | ALTER TABLE audit_log ADD COLUMN ip TEXT | non (avalé) | ADD COLUMN nullable | ACCESS EXCLUSIVE ≈ instantané · **NEW** |
| :150 | ALTER TABLE audit_log ADD COLUMN user_agent TEXT | non (avalé) | ADD COLUMN nullable | ACCESS EXCLUSIVE ≈ instantané · **NEW** |
| :151 | CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at) | oui | CREATE INDEX (non CONCURRENTLY) | SHARE : bloque écritures audit_log pendant build ∝ taille table (NV taille) · **NEW** |
| :152 | CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id) | oui | CREATE INDEX (non CONCURRENTLY) | SHARE idem · **NEW** |
| :158 | CREATE TABLE IF NOT EXISTS project_sidecars … | oui | CREATE TABLE | ∅ |
| :172 | CREATE TABLE IF NOT EXISTS auth_tokens … | oui | CREATE TABLE | ∅ |
| :182 | CREATE INDEX IF NOT EXISTS idx_auth_tokens_token_hash ON auth_tokens(token_hash) | oui | CREATE INDEX | SHARE ; no-op si existe · S |
| :190 | CREATE TABLE IF NOT EXISTS org_packs … | oui | CREATE TABLE | ∅ |
| :207 | CREATE TABLE IF NOT EXISTS report_artifacts … | oui | CREATE TABLE | ∅ |
| :220 | CREATE INDEX IF NOT EXISTS idx_report_artifacts_project ON report_artifacts(project_id) | oui | CREATE INDEX | SHARE ; no-op si existe · S |

Décompte : 10 CREATE TABLE · 17 ADD COLUMN · 1 DROP NOT NULL · 4 CREATE INDEX = 32.

### Destructifs
- DROP / TRUNCATE / ALTER TYPE / SET NOT NULL sur colonne peuplée : ∅
- DROP NOT NULL :116 — assouplit, 0 perte
- ADD COLUMN NOT NULL :88 — DEFAULT 0 fourni, 0 échec sur lignes existantes
- DELETE ×2 (JS) : schema.ts:304 `DELETE FROM org_packs WHERE pack_key = $1` (×4 boucle : industrie, patrimoine, solaire, stocks) · schema.ts:307 `… 'premium'` (supprimé SANS remplacement)
  - bornes : lignes org_packs de ces 5 clés uniquement ; après 1er passage = 0 ligne → no-op
- UPDATE de masse : ∅ (cf. backfills)

### Backfills
| schema.ts:L | table | WHERE | lignes touchées |
|---|---|---|---|
| :258 UPDATE projects SET geolens_verified = true | projects | processing_provenance='geolens' AND geolens_verified=false | ≤ nb projets geolens non vérifiés ; 0 au 2ᵉ passage. Piège : ré-annule tout « dé-vérifié » manuel d'un projet geolens à chaque boot |
| :296 UPDATE org_packs SET enabled=true, updated_at=now() | org_packs | org_id=$1 AND pack_key=newKey | 1 ligne/org ayant ancien pack enabled=true ; 0 si ancien absent |
| :300 INSERT INTO org_packs (org_id,pack_key,enabled) VALUES(…,true) | org_packs | si UPDATE rowCount=0 | ≤ 1/org ayant ancien pack enabled=true |
| :290 SELECT org_id FROM org_packs WHERE pack_key=$1 AND enabled=true | org_packs | lecture | — |
- Les 3 DML packs bornés par nb d'orgs avec ancien pack (industrie/patrimoine/solaire/stocks) ; 0 après 1er passage.
- migrate() n'appelle pas userLayers.ts (index project_layers : userLayers.ts:~72-80, hors migrate()) : rg `migrate\w*\(` appelants inchangés (server.ts:159 + schema.ts:242-243).

### Échec d'un DDL
- schema.ts:238 : `ALTER TABLE` ET `CREATE INDEX` → `continue`, TOUTE erreur avalée (pas seulement « existe déjà » : lock timeout, droits, type ≠ passent aussi en silence)
- CREATE TABLE / UPDATE / DELETE en erreur → `throw e` :239 (stmt SQL) ; migratePackEntitlements/ProvenanceenErreur → propage → `await migrate(db)` server.ts:159 rejette → boot API arrêté
- 0 BEGIN/COMMIT autour de migrate : arrêt en cours de route = stmts précédents déjà appliqués (db.ts:62 ROLLBACK ne concerne que `transaction()`)
- Index échoué silencieusement → API démarre sans index (perf seulement)

### Diff serveur (ssh 1 connexion, rc=0, serveur 293 l vs G 308 l)
`diff srv G` → seuls ajouts G, 0 suppression, 0 modification :
- NEW organizations.contract_end_at (CREATE :44-45 + ALTER :55)
- NEW users.session_version (CREATE :75-77 + ALTER :88)
- NEW audit_log.ip, audit_log.user_agent (CREATE :143-146 + ALTER :149-150)
- NEW 2 CREATE INDEX audit_log (:151-152)
- Fonctions migrate*, UPDATE, DELETE : identiques serveur/G → backfills déjà joués, no-op attendu
- Donc DDL réellement effectifs au redémarrage : 4 ADD COLUMN + 2 CREATE INDEX ; les 26 autres = no-op (existent)

### Verdict
0 perte de données possible. Seul risque : 2 CREATE INDEX sur audit_log (SHARE, bloque les écritures audit le temps du build, ∝ lignes, NV) + ADD COLUMN session_version NOT NULL DEFAULT (réécriture si PG<11, NV version). Aucun DDL destructif effectif.

## Vérifié comment
- `ssh -p 34522 -o BatchMode=yes -o ConnectTimeout=15 geo-test@82.65.97.67 'cat ~/geolens-web/api/src/schema.ts'` → rc=0, 293 lignes (copie scratchpad)
- `diff srv_schema.ts G/api/src/schema.ts` → 8 hunks, uniquement `>` (ajouts G), listés ci-dessus
- Read schema.ts:1-308, server.ts:148-172, db.ts:55-95 → faits ci-dessus
- NV : version PostgreSQL du serveur · taille/nb lignes audit_log · contenu org_packs/projects (0 accès base, interdit)
- NV : « le serveur a joué ce schema.ts » — présumé ; une base peut dater d'un état antérieur à la copie

## Écarts
- ∅ lecture hors WL (userLayers.ts lu partiellement via rg dans WL : 1 sed 60-115, WL)

## Pour la suite
- migrate() au redémarrage : 32 stmts, 26 no-op sur le serveur ; effectifs = 4 ADD COLUMN (organizations.contract_end_at, users.session_version, audit_log.ip, audit_log.user_agent) + 2 CREATE INDEX audit_log (:151-152, non CONCURRENTLY).
- Destructif : ∅ effectif ; DELETE org_packs (:304,:307) et UPDATE projects (:258) = no-op car code identique au serveur.
- Piège : schema.ts:238 avale TOUTE erreur ALTER/CREATE INDEX ; pas de transaction ; erreur CREATE TABLE/UPDATE/DELETE = boot arrêté.
- Avant redéploiement, à vérifier par l'humain (NV ici) : version PG ≥ 11 et taille audit_log.
- Aucun backup nécessaire pour perte de données ; verdict : 0 perte possible.

## Retour sur le pack
- Manquait: version PG du serveur, taille audit_log (non constatables sans accès base) · Inutile: db.ts, userLayers.ts (non pertinents pour la liste)
