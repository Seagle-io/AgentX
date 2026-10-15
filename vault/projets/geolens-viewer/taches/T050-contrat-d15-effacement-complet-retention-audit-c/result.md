---
tache: T050
statut: fait
---
## Décisions
- A : AsyncLocalStorage, hook `preValidation` + `als.run(store, done)` — 0 des 57 appels audit modifié — écarté : param `req` ×57 ; `onRequest` (contexte perdu au parsing corps)
- E : `erasure.ts` 1 tx ; couche publiée → owner `__erased__` ; audit propre → 4 colonnes NULL, audit d'autrui → email remplacé — officiel org partagé, trace 12 mois anonyme — écarté : DELETE publiées / DELETE audit / hash pseudonyme
- R : timer in-process boot+10 min puis 24 h, cutoffs JS en jours — 1 service api, `interval` pg-mem non fiable — écarté : cron externe, `now() - interval`
- R : `RETENTION_MODE` défaut `off` (pg-mem) / `report` ; livrables = clé distincte jamais enforce hérité — 2e choix humain explicite — écarté : mode global unique
- R : purge audit bornée par cutoff seul (1 DELETE) — métadonnées, volume faible — écarté : lots par id (sous-requête pg-mem)
- T : extraction `projectTeardown.ts` de server.ts:94-110 + :2944-2999 — 1 seul chemin suppression projet — écarté : duplication
- C : route NEUVE `PATCH …/organizations/:id/contract` — `status` requis sur :1871 intact — écarté : étendre :1871
- X : `userExport.ts` JSON v1, bouton client `api` + Blob — cookie/CORS déjà gérés — écarté : `<a href>` direct
- decisions.md non écrit — pack : écriture result.md seule → chef recopie ce bloc
## Contrats
```
// ===== A — api/src/requestContext.ts (NEUF) — import { AsyncLocalStorage } from 'node:async_hooks'
export interface RequestMeta { ip: string | null; userAgent: string | null }; export const UA_MAX_LEN = 255;
export function truncateUa(raw: string | string[] | undefined): string | null;   // tableau → [0] ; ''|undefined → null ; slice(0, UA_MAX_LEN)
export function currentRequestMeta(): RequestMeta | undefined;                   // hors requête (timer, scripts) → undefined
export function registerRequestContext(app: FastifyInstance): void;
//   app.addHook('preValidation', (req, _r, done) => als.run({ ip: req.ip || null, userAgent: truncateUa(req.headers['user-agent']) }, done))
// repo.ts:139-152 audit() signature INCHANGÉE ; m = currentRequestMeta() ; try/catch conservé
//   'INSERT INTO audit_log (id, user_id, org_id, action, detail, ip, user_agent) VALUES ($1,$2,$3,$4,$5,$6,$7)' [..., m?.ip ?? null, m?.userAgent ?? null]
// repo.ts NEUF : export async function getPlatformOrgIds(db: Db): Promise<Set<string>>;  // SELECT org_id FROM users WHERE is_platform_admin = true
// schema.ts CREATE : organizations + `contract_end_at TIMESTAMPTZ,` (avant :44) ; audit_log + `ip TEXT, user_agent TEXT,` (avant :140)
ALTER TABLE organizations ADD COLUMN contract_end_at TIMESTAMPTZ;   -- après :52
ALTER TABLE audit_log ADD COLUMN ip TEXT; ALTER TABLE audit_log ADD COLUMN user_agent TEXT;   -- après :141, 1 instr/ligne
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at); CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
// 0 ';' dans commentaires SQL ; ALTER/CREATE INDEX tolérés par migrate():227
// ===== T — api/src/projectTeardown.ts (NEUF, extrait verbatim)
export async function tableExists(db: Db, table: string): Promise<boolean>;  // + isMissingRelation : déplacés de server.ts:94-110 (supprimés là)
export interface ProjectRef { id: string; org_id: string | null; storage_prefix: string }
export interface TeardownResult { filesDeleted: boolean; storageKept: boolean; importedKept: boolean }
export async function teardownProject(db: Db, storage: StorageDriver, log: Pick<FastifyBaseLogger, 'warn' | 'error'>, proj: ProjectRef): Promise<TeardownResult>;
// = server.ts:2944-2999 : isPrefixShared ×2 avant tx ; tableExists hors tx ; tx 6 DELETE ordre inchangé ; deletePrefix best-effort hors tx
// throw si tableExists/tx échoue (0 fichier touché) ; storageKept = sharedMain ; importedKept = sharedImported · route :2958-2999 → try { res = await teardownProject(db, app.storage, app.log, proj) } catch (e) { app.log.error(e) ; 500 delete_failed inchangé } ; guardNote ← res ; audit + réponse INCHANGÉS
// ===== E — api/src/erasure.ts (NEUF)
export const ERASED_USER_ID = '__erased__'; export const ERASED_LABEL = '[utilisateur supprimé]';
export type EraseErrorCode = 'not_found' | 'last_platform_admin'; export class EraseError extends Error { constructor(readonly code: EraseErrorCode) }
export interface EraseCounts { authTokens: number; projectAccess: number; layersDeleted: number; layersReassigned: number; layersPublishedByCleared: number; sidecars: number; artifacts: number; auditOwn: number; auditScrubbed: number }
export async function eraseUser(db: Db, userId: string): Promise<EraseCounts>;
// pré-tx : getUserById null → EraseError('not_found') ; is_platform_admin ET nb(is_platform_admin = true) ≤ 1 → 'last_platform_admin' ; hasLayers = tableExists(db,'project_layers') HORS tx
// db.transaction(tx => …) ordre STRICT, counts = rowCount :
//  1 DELETE FROM auth_tokens WHERE user_id = $1 ;  2 DELETE FROM project_access WHERE user_id = $1
//  3 si hasLayers : DELETE FROM project_layers WHERE owner_user_id = $1 AND visibility = 'private'
//                  UPDATE project_layers SET owner_user_id = $2 WHERE owner_user_id = $1 AND visibility = 'published'   -- $2 = ERASED_USER_ID
//                  UPDATE project_layers SET published_by = NULL WHERE published_by = $1
//  4 UPDATE project_sidecars SET updated_by = NULL WHERE updated_by = $1 ;  5 UPDATE report_artifacts SET created_by = NULL WHERE created_by = $1
//  6 UPDATE audit_log SET user_id = NULL, ip = NULL, user_agent = NULL, detail = NULL WHERE user_id = $1
//  7 SELECT id, detail FROM audit_log WHERE detail LIKE $1   -- '%'+email+'%' ; filtre JS includes(email) ; par ligne UPDATE audit_log SET detail = $2 WHERE id = $1 (split(email).join(ERASED_LABEL))
//  8 DELETE FROM users WHERE id = $1
// erreur SQL → rethrow ; 0 audit() dans le module ; organizations/projects/project_orgs/org_packs : ∅ réf user
// server.ts:1524-1527 → counts = await eraseUser(db, target.id) ; commentaire :1505-1513 (« sans transaction ») à réécrire
//   EraseError last_platform_admin → 409 { error: 'last_platform_admin', message: 'Impossible de supprimer le dernier administrateur plateforme.' }
//   EraseError not_found → 404 { error: 'not_found', message: 'Utilisateur introuvable dans votre organisation.' }
//   autre → app.log.error ; 500 { error: 'delete_failed', message: 'Échec de la suppression de l’utilisateur.' }
//   audit(db, admin, 'delete_user', JSON.stringify({ userId: target.id, orgId: target.org_id, ...counts }))  -- 0 email ; return { ok: true }
// ===== R — config.ts : AppConfig.retention (+ loadConfig, productionProblems)
retention: { mode: RetentionMode; deliverablesMode: RetentionMode; auditDays: number; accountInactiveDays: number;
  deliverableGraceDays: number; maxUsersPerPass: number; maxProjectsPerPass: number; intervalMs: number };
// RETENTION_MODE absent/invalide → useMemDb ? 'off' : 'report' · RETENTION_DELIVERABLES_MODE absent/invalide → mode === 'off' ? 'off' : 'report'
// intIn : RETENTION_AUDIT_DAYS (365, 30, 3650) · RETENTION_ACCOUNT_INACTIVE_DAYS (1095, 365, 3650) · RETENTION_DELIVERABLE_GRACE_DAYS (365, 30, 3650)
//   RETENTION_MAX_USERS_PER_PASS (20, 1, 500) · RETENTION_MAX_PROJECTS_PER_PASS (3, 1, 50) · RETENTION_INTERVAL_HOURS (24, 1, 168) × 3_600_000
// productionProblems : l'une des 2 clés non vide ∉ {off,report,enforce} → 'RETENTION_MODE / RETENTION_DELIVERABLES_MODE invalide (off | report | enforce)'
// ===== R — api/src/retention.ts (NEUF)
export type RetentionMode = 'off' | 'report' | 'enforce'; export type PurgeKind = 'audit' | 'accounts' | 'deliverables';
export interface RetentionDeps { db: Db; storage: StorageDriver; log: Pick<FastifyBaseLogger, 'info' | 'warn' | 'error'>; cfg: AppConfig['retention']; now?: () => Date }
export interface PurgeReport { purge: PurgeKind; mode: RetentionMode; cutoff: string; candidates: number; acted: number; ids: string[]; capped: boolean; errors: number }
export async function purgeAuditLog(d: RetentionDeps): Promise<PurgeReport>;
//   cutoff = now − auditDays j ; report : SELECT id FROM audit_log WHERE created_at < $1 ; enforce : DELETE FROM audit_log WHERE created_at < $1 (acted = rowCount) ; ids = []
export async function purgeInactiveAccounts(d: RetentionDeps): Promise<PurgeReport>;
//   cutoff = now − accountInactiveDays j ; SELECT id, org_id, last_login, created_at FROM users WHERE is_platform_admin = false
//   candidat ⇔ (last_login ?? created_at) < cutoff ET org_id ∉ getPlatformOrgIds ; tri plus ancien d'abord ; slice(maxUsersPerPass) → capped
//   enforce : eraseUser(db, id) un par un ; EraseError/SQL → errors++, log.error, continue
export async function purgeExpiredDeliverables(d: RetentionDeps): Promise<PurgeReport>;
//   mode = cfg.deliverablesMode ; cutoff = now − deliverableGraceDays j
//   SELECT id FROM organizations WHERE contract_end_at IS NOT NULL AND contract_end_at < $1 ; − getPlatformOrgIds
//   par org : SELECT id, org_id, storage_prefix, name FROM projects WHERE org_id = $1 ORDER BY created_at ASC ; cumul slice(maxProjectsPerPass)
//   enforce : log.warn({ retention: 'deliverables', projectId, name, orgId, storagePrefix, cutoff }) AVANT teardownProject ; échec → errors++
//   jamais : projet org_id NULL, org secondaire via project_orgs, org plateforme
export async function runRetentionPass(d: RetentionDeps): Promise<PurgeReport[]>;
//   audit → accounts → deliverables ; mode 'off' → sautée ; try/catch par purge, jamais throw
//   par purge exécutée : audit(db, null, `retention_${purge}`, JSON.stringify({ mode, cutoff, candidates, acted, ids: ids.slice(0, 50), capped, errors }))
export const RETENTION_FIRST_DELAY_MS = 10 * 60 * 1000;
export function startRetentionScheduler(app: FastifyInstance, d: RetentionDeps): void;
//   2 modes 'off' → return (0 timer) ; garde `running` anti-chevauchement ; setTimeout(tick, RETENTION_FIRST_DELAY_MS).unref() ; setInterval(tick, cfg.intervalMs).unref() ; app.addHook('onClose', clear ×2)
// server.ts après :2447 : startRetentionScheduler(app, { db, storage: app.storage, log: app.log, cfg: config.retention });
// ===== C — fin de contrat
PATCH /api/admin/organizations/:id/contract   { preHandler: requirePlatformAdmin }   (après :1884)
Body { contractEndAt: string | null }   // /^\d{4}-\d{2}-\d{2}$/ ET new Date(`${d}T00:00:00.000Z`).toISOString().slice(0, 10) === d
400 { error: 'bad_request', message: 'Champ `contractEndAt` : date AAAA-MM-JJ ou null.' } · 404 { error: 'not_found', message: 'Organisation introuvable.' }
400 { error: 'platform_org', message: 'Pas de fin de contrat pour l’organisation GeoLens.' }   // id ∈ getPlatformOrgIds ET d ≠ null
UPDATE organizations SET contract_end_at = $1 WHERE id = $2   -- `${d}T00:00:00.000Z` | null
audit(db, admin, 'org_contract_end', `${id} -> ${d ?? 'null'}`) ; 200 { ok: true, organization: { id, contractEndAt: d | null } }
GET /api/admin/organizations :1821 : SELECT + contract_end_at ; item + contractEndAt: string | null   // toIsoDate(v: unknown): Date|string → 'YYYY-MM-DD' | null
web/src/api.ts Organization : + contractEndAt?: string | null
Admin.tsx OrgPacksEditor entre :246 et :247 : label « Fin de contrat — livrables purgés à fin + 1 an si rétention active » ; <input type="date" className="gl-input">
  + « Enregistrer » + ghost « Effacer » (null) → api.patch(`/api/admin/organizations/${org.id}/contract`, { contractEndAt }) ; onChanged() ; catch → onError
// ===== X — api/src/userExport.ts (NEUF) + route
export interface UserExportV1 { format: 'geolens-user-export'; version: 1; exportedAt: string;
  user: { id: string; email: string; role: string; isPlatformAdmin: boolean; disabled: boolean; status: string; lastLogin: string | null; createdAt: string; organization: { id: string; name: string } | null };
  projectAccess: Array<{ projectId: string; projectName: string | null }>;
  auditLog: Array<{ id: string; action: string; detail: string | null; ip: string | null; userAgent: string | null; createdAt: string }>;          // user_id = moi
  layers: Array<{ id: string; projectId: string; kind: string; scope: string; visibility: string; data: string; createdAt: string; updatedAt: string; publishedAt: string | null }>; // owner_user_id = moi ; [] si table absente
  reportArtifacts: Array<{ id: string; projectId: string; pack: string; kind: string; title: string; createdAt: string }>;                         // created_by = moi
  sidecarEdits: Array<{ projectId: string; kind: string; scope: string; updatedAt: string }>;                                                    // updated_by = moi, sans json
}
// EXCLUS : password_hash, session_version, auth_tokens (token_hash), image_key, meta_json, project_sidecars.json, audit d'autrui
export async function buildUserExport(db: Db, userId: string, now?: Date): Promise<UserExportV1 | null>;  // user absent → null ; dates toISOString()
export function exportFilename(now: Date): string;  // `geolens-export-${YYYY-MM-DD}.json`
app.get('/api/me/export', { preHandler: requireAuth, config: { rateLimit: { max: 5, timeWindow: '1 hour' } } }, …)   (avant `// ── Auth` :290)
//   null → 404 { error: 'not_found', message: 'Utilisateur introuvable.' } ; audit(db, u, 'export_me') ; headers : Content-Type application/json; charset=utf-8 · Content-Disposition attachment; filename="<exportFilename>" · Cache-Control no-store
// Account.tsx carte « Mes données » entre :60 et :61, bouton « Télécharger mes données (JSON) » : data = await api.get<unknown>('/api/me/export')
//   → Blob(JSON.stringify(data, null, 2), application/json) ; download modèle Admin.tsx:1078-1080 ; catch → setErr
```
## Ordre server.ts
| rang | lot | plages (HEAD 003e284, Edit par chaîne) | parallèle avec |
|---|---|---|---|
| 1 | A | :247-251 `registerRequestContext(app)` après rate-limit, avant 1re route ; + schema.ts, repo.ts, requestContext.ts | ∅ (fondation) |
| 2 | T | :94-110 (retrait) ; :2958-2999 → teardownProject ; + projectTeardown.ts | C (hors server.ts) |
| 3 | E | :1505-1530 ; + erasure.ts | X, C (fichiers neufs/web) |
| 4 | X | insertion avant :290 ; + userExport.ts, Account.tsx | E, C (fichiers neufs/web) |
| 5 | C | :1821-1838 ; insertion après :1884 ; + Admin.tsx, web/src/api.ts | E, X (fichiers neufs/web) |
| 6 | R | insertion après :2447 ; + retention.ts, config.ts | ∅ (dépend A, T, E) |
## Tests par lot
- A · api/test/audit-context.test.ts · login → ip '127.0.0.1' + user_agent = en-tête · UA 400 car. → 255 · POST JSON (change-password) → ip ≠ NULL · audit(db,null,…) hors requête → ip NULL · migrate() ×2 OK · TRUST_PROXY=loopback + XFF 203.0.113.7 → 203.0.113.7 · sans TRUST_PROXY → XFF ignoré
- T · delete.test.ts, delete-user-layers.test.ts, scenes-shared-prefix.test.ts verts inchangés · api/test/project-teardown.test.ts · uploads/ → filesDeleted · préfixe partagé → storageKept + fichiers présents · project_layers absente → OK
- E · api/test/erasure.test.ts · fixture (token, access, couche privée+publiée, sidecar, artefact, audit propre, audit admin citant email) → users/auth_tokens/project_access/privée = 0 · publiée owner '__erased__', published_by NULL · updated_by/created_by NULL · audit propres 4 col. NULL · `detail LIKE '%email%'` → 0 · delete_user sans email · dernier platform admin → 409 · self → 400 · flag layers off → 200 · org_admin autre org → 404
- R · api/test/retention.test.ts (now injecté) · audit report → 0 supprimé, candidates N · enforce → < cutoff supprimé, ≥ conservé · last_login 4 ans / NULL + created_at vieux → candidat · récent → non · platform admin, membre org plateforme → jamais · cap 1/3 → acted 1 capped · enforce → eraseUser effectif · org contract_end −2 ans : report → intacts ; deliverablesMode enforce → supprimés + log.warn avant · org plateforme datée, projet orphelin → jamais · cap projets · audit 'retention_*' par purge · mode off → 0 audit
- R · api/test/retention-config.test.ts · défaut pg-mem off · DATABASE_URL → report · RETENTION_MODE=enforce → deliverablesMode 'report' · invalide prod → productionProblems · scheduler modes off → 0 timer
- C · api/test/org-contract.test.ts · PATCH 200 + GET contractEndAt · null efface · '2026-13-40' → 400 · org_admin → 403 · inconnue → 404 · org plateforme → 400 platform_org · audit org_contract_end
- X · api/test/me-export.test.ts · 200 + Content-Disposition `geolens-export-YYYY-MM-DD.json` · corps sans password_hash/token_hash/session_version · auditLog = moi seul · layers [] flag off · anonyme → 401 · audit export_me · 6e appel → 429 si rateLimitEnabled
## Vérifié comment
- schema.ts:17-210 → réf user : users, project_access:119, auth_tokens:163, audit_log:136, project_sidecars.updated_by:152, report_artifacts.created_by:205 ; userLayers.ts:57-82 → owner_user_id NOT NULL, published_by nullable
- repo.ts:139-153 → INSERT 5 col. ; rg `transaction` db.ts → :21 `transaction<T>(fn: (tx: Pick<Db,'query'>) => Promise<T>)`, :74-75 ROLLBACK pg-mem non effectif
- server.ts:1514-1530 → 3 DELETE hors tx, audit target.email ; :2929-3004 → tx 6 DELETE + isPrefixShared + deletePrefix ; :1870-1884 → status requis ; :2444-2447 sweepTimer
- rg `addHook\(` server.ts → :251, :2447 seuls ; rg `audit\(` api/src → 57 ; rg `delete_user` api/test → ∅
- Admin.tsx:235-247, :1144 · Account.tsx:43-61 · Confidentialite.tsx:105-113
## Écarts
- ∅ lecture hors WL (rg db.ts, auth.ts, scenes.ts dans G/api/src autorisé) · NV : ALS en `preValidation` sous inject (cas A POST JSON tranche ; repli `preHandler` global) · NV : TIMESTAMPTZ < param ISO sous pg-mem (tests R)
## Pour la suite
- Ordre A → T → (E ‖ X ‖ C hors server.ts) → R ; server.ts : 1 écrivain à la fois
- Interdit : SQL `interval`/sous-requête ; email dans audit post-effacement ; enforce livrables sans RETENTION_DELIVERABLES_MODE explicite
- Point de non-retour : 1er passage `enforce` (suppressions définitives) ; sentinelle `__erased__` en base
- À revoir si : >1 réplique api (→ pg_try_advisory_lock) ; contrat porté par projet et non par org
- web/src/api.ts (type Organization) à mettre en WL du lot C
## Retour sur le pack
- Manquait: db.ts (transaction, ROLLBACK pg-mem) ; web/src/api.ts (type Organization) ; chemin decisions.md vs écriture result.md seule
- Inutile: config.ts posInt/proxyList (seul intIn sert)
