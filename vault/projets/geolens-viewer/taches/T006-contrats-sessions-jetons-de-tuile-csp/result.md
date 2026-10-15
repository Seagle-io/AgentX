---
tache: T006
statut: fait
---
## Décisions
- contrainte qui décide : révoquer sans store serveur, viewer à jeton fixe (install.ts:94, 0 refresh)
- A2 `users.session_version` + claim `sv`, égalité stricte — 0 horloge, 0 tolérance — écarté `password_changed_at` (iat s ≠ timestamptz µs, même seconde ambiguë)
- A2 table sessions stateful écartée — écritures + purge, ≠ auth.ts:2-4
- A2 DDL appliqué par `migrate()` au boot (server.ts:164) — ALTER toléré schema.ts:223 — 0 commande humaine
- A2 coût : +1 SELECT PK (users LEFT JOIN organizations)/requête requireAuth, cache ∅, TTL ∅ — révocation immédiate, multi-instance sûr — cache court écarté
- A2 requireAuth pose `toSessionUser(ligne DB)` ≠ claims JWT — rétrogradation rôle immédiate
- A2 jeton tuile NON lié à sv — coupure tuile = disabled/org suspendue ; lot futur
- PT-3 règle pure unique `checkUserAccess` ; tenancy.ts:87-121 = 0 modif — entrées = requireAuth + resolveSignedProject ; org suspendue ≠ projets partagés (collaborateurs autre org gardent l'accès)
- A2b exp = (⌊(now+T)/W⌋+1)·W, validité ∈ (T, T+W] ; T 28800, W 14400 → (8 h, 12 h] — écarté statu quo (24 h, 48 h] et T 3600 (viewer sans refresh casse)
- A2b redaction = sérialiseur `req` Fastify à server.ts:160 — écarté pino `redact` (ne réécrit pas une sous-chaîne d'URL)
- C1 viewer : meta sans 'unsafe-inline' script, sans unpkg, sans schémas Electron ; portail : en-têtes minimaux enforced + CSP complète Report-Only — deps portail non inspectées (web/src ∉ WL) — écarté CSP portail enforced d'emblée
- ordre server.ts : 1 lot éditeur par rang — Edit concurrent même fichier = écrasement
- point de non-retour : colonne `session_version` en base prod (DROP manuel) + claim `sv` dans tout JWT émis ; T 8 h = durée max d'un onglet viewer sans recharge
## Contrats
```ts
// ═══ A2 — api/src/session.ts (NEUF). imports : type FastifyReply ; type Db ; type SessionUser (./auth.js) ; toSessionUser, type UserRow (./repo.js). 0 import runtime de auth.ts
export interface SessionClaims extends SessionUser { sv?: number; iat?: number; exp?: number }
export interface UserAccessState { row: UserRow; orgStatus: string | null }
export type AccessDenial = 'user_missing' | 'user_disabled' | 'user_pending' | 'org_suspended' | 'session_revoked';
export type AccessCheck = { ok: true; user: SessionUser; row: UserRow } | { ok: false; reason: AccessDenial };
// SQL : SELECT u.*, o.status AS org_status FROM users u LEFT JOIN organizations o ON o.id = u.org_id WHERE u.id = $1
export async function loadUserAccessState(db: Db, userId: string): Promise<UserAccessState | null>;
// PT-3 PURE, ordre fixe : null→user_missing · row.disabled→user_disabled · row.status==='pending'→user_pending
//   · orgStatus==='suspended'→org_suspended · (expectedSv!==undefined && expectedSv!==row.session_version)→session_revoked
//   · sinon { ok: true, user: toSessionUser(row), row }
export function checkUserAccess(state: UserAccessState | null, expectedSv?: number): AccessCheck;
// PT-3 helper partagé = checkUserAccess(await loadUserAccessState(db, userId), expectedSv) ; expectedSv omis = jeton tuile
export async function resolveActiveUser(db: Db, userId: string, expectedSv?: number): Promise<AccessCheck>;
// = resolveActiveUser(db, claims.userId, claims.sv ?? 0)
export async function validateSession(db: Db, claims: SessionClaims): Promise<AccessCheck>;
// = reply.jwtSign({ ...toSessionUser(row), sv: row.session_version }, { expiresIn: '7d' }) ; n'écrit PAS le cookie
export async function signSession(reply: FastifyReply, row: UserRow): Promise<string>;
// 1 UPDATE hash+bump puis SELECT session_version FROM users WHERE id = $1 ; rowCount 0 → throw new Error('user_not_found')
//   défaut        : UPDATE users SET password_hash = $1, session_version = session_version + 1 WHERE id = $2
//   activate:true : UPDATE users SET password_hash = $1, status = 'active', session_version = session_version + 1 WHERE id = $2
export async function setPasswordAndRevoke(db: Db, userId: string, passwordHash: string, opts?: { activate?: boolean }): Promise<number>;

// ═══ A2 — repo.ts:7-18 UserRow : + session_version: number;
// ═══ A2 — auth.ts:39-44 : payload: SessionUser & { sv?: number };   (user inchangé)
// ═══ A2 — auth.ts:80-87 requireAuth, remplacement intégral (requireAdmin/requirePlatformAdmin inchangés) :
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  let claims: SessionClaims;
  try { claims = await request.jwtVerify<SessionClaims>(); }
  catch { await reply.code(401).send({ error: 'unauthenticated', message: 'Session requise.' }); return; }
  const check = await validateSession(request.server.db, claims); // db décoré server.ts:57-58,171 ; erreur DB → 500
  if (!check.ok) { clearSessionCookie(reply); await reply.code(401).send({ error: 'unauthenticated', message: 'Session invalide.' }); return; }
  request.sessionUser = check.user;
}
// ═══ A2 — schema.ts (migrate() au boot) ; commentaires ajoutés : 0 ';' (split schema.ts:210)
//   CREATE users, après L71 :  session_version INTEGER NOT NULL DEFAULT 0,
//   après L81 :                ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0;
// ═══ A2 — server.ts (baseline 2026-10-07)
//   :278-282 resolveSignedProject → const c = await resolveActiveUser(db, payload.u); if (!c.ok) return null; return getAccessibleProject(db, c.user, payload.p);
//   :304     login → const token = await signSession(reply, user);
//   :322-341 /me → claims = jwtVerify<SessionClaims> (catch → { user: null } inchangé) ; c = await validateSession(db, claims) ;
//            !c.ok → clearSessionCookie + 401 'Session invalide.' ; u = c.user ; fresh = c.row ; L342+ inchangées
//   mdp ① :379  change-password → const sv = await setPasswordAndRevoke(db, u.userId, await hashPassword(newPassword));
//                                 setSessionCookie(reply, await signSession(reply, { ...fresh, session_version: sv }), config);
//   mdp ② :458  reset self      → await setPasswordAndRevoke(db, valid.userId, await hashPassword(password), { activate: true });
//   mdp ③ :486  accept-invite   → idem ②
//   mdp ④ :1458 admin reset     → await setPasswordAndRevoke(db, target.id, await hashPassword(tempPassword));
// ═══ A2 — règle révocation (sv, pas iat)
//   sv entier ≥ 0 = users.session_version au jwtSign · session valide ⇔ (claims.sv ?? 0) === row.session_version
//   iat/exp : s epoch posés par @fastify/jwt ; exp = iat + 7 j vérifié par jwtVerify ; iat NON lu ; tolérance 0
//   JWT pré-A2 sans sv → 0 = DEFAULT → valide jusqu'au 1er bump ; 0 déconnexion forcée au déploiement
//   bump = même UPDATE que password_hash ; change-password réémet cookie (sv neuf) DANS la réponse → appelant connecté, autres sessions 401
//   reset self / accept-invite / admin reset : bump, 0 cookie émis

// ═══ A2b — api/src/tileExp.ts (NEUF), PURE. import type { AppConfig } from './config.js';
//   now = Math.floor(nowMs / 1000) ; W = cfg.tileUrlWindowSec ; T = cfg.tileTokenTtlSec ; return (Math.floor((now + T) / W) + 1) * W
//   invariant : T < exp - now ≤ T + W ; exp constant sur W s consécutives
export function tileTokenExp(cfg: Pick<AppConfig, 'tileTokenTtlSec' | 'tileUrlWindowSec'>, nowMs: number): number;
//   server.ts:507-512 → const quantizedTileExp = (): number => tileTokenExp(config, Date.now());  (appelants :530 :582 :607 :838 inchangés ; commentaire :497-506 → « validité (T, T+W] »)
//   config.ts:21-22 AppConfig : tileTokenTtlSec: number; /** durée MIN garantie (s) */ · tileUrlWindowSec: number; /** quantification exp (s) */
//   config.ts:144 → tileTokenTtlSec: posInt(env.TILE_TOKEN_TTL_SEC, 28800),  tileUrlWindowSec: posInt(env.TILE_URL_WINDOW_SEC, 14400),
//   config.ts local : function posInt(v: string | undefined, def: number): number  // n = Number(v) ; Number.isFinite(n) && n >= 60 ? Math.floor(n) : def
//   invariant : `process.env` ∉ api/src/** sauf config.ts
// ═══ A2b — api/src/logRedact.ts (NEUF)
export const SENSITIVE_QUERY_KEYS: readonly string[] = ['token'];
// par clé k : url.replace(new RegExp(`([?&]${k}=)[^&#]*`, 'gi'), '$1[redacted]') ; reste de l'URL identique
export function redactUrl(url: string): string;
export interface LoggableReq { method?: string; url?: string; ip?: string; hostname?: string; socket?: { remotePort?: number } }
export function serializeReq(req: LoggableReq): { method?: string; url: string; hostname?: string; remoteAddress?: string; remotePort?: number };
export function loggerOptions(enabled: boolean): false | { serializers: { req: typeof serializeReq } };
//   accroche server.ts:160 → const app = Fastify({ logger: loggerOptions(opts.logger ?? false) });  index.ts inchangé
//   Caddyfile : 0 directive `log`

// ═══ C1 — meta, identique web/viewer.html:16 ET web/src/viewer/index.html:16 (règle G-04)
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' blob: data:; worker-src 'self' blob:; frame-src blob:; object-src blob:; base-uri 'self'; form-action 'self'" />
//   préalables : inline web/viewer.html:23-26 → boot-web.ts ; TilesRendererLoader.ts:169 → '/draco/' ; :177 → '/basis/'
//   (copie three 0.184.0 examples/jsm/libs/{draco,basis} → web/public/{draco,basis}, 0 dep npm) ; object-src blob: gardé — PDF iframe blob:
// ═══ C1 — Caddyfile, remplacement intégral (caddy:2-alpine, docker-compose.scaleway.yml:30-38)
portail.geolens.fr {
    encode zstd gzip

    @front not path /api/*
    header @front {
        defer
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
        Content-Security-Policy "frame-ancestors 'self'; base-uri 'self'; form-action 'self'"
    }

    @portail_doc not path /api/* /viewer.html /viewer /assets/* /draco/* /basis/*
    header @portail_doc {
        defer
        Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; frame-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"
    }

    handle /api/* {
        reverse_proxy api:4000
    }

    handle {
        reverse_proxy web:80
    }
}
```
## Ordre server.ts
| rang | lot | plages (baseline 2026-10-07 ; ré-ancrer par grep après rang 1) | dépend de |
|---|---|---|---|
| 1 | A2 + PT-3 | 278-282 · 304 · 322-341 · 374-381 · 458 · 486 · 1458 | ∅ |
| 2 | A2b | 160 · 497-512 (+ config.ts:21-22,144) | rang 1 (fichier) |
| 3 | A4 PT-5/PT-6/email | inféré NV : 390-445 · 1366-1374 · 1399-1400 · 1553 | rang 2 ; :486 réécrit en rang 1 |
| 4 | A1 PT-1 | NV — ∉ pack | rang 3 |
| 5 | A3 PT-4 + relais | NV — routes upload ∉ plages lues | rang 4 |
| 6 | X1 config prod | inféré NV : 155-158 · 238-242 (+ config.ts) | rang 5 ; config.ts après A2b |
- 1 lot/rang → 0 chevauchement ; session.ts, tileExp.ts, logRedact.ts, Caddyfile, HTML viewer, tests = parallélisables hors rang
## Tests par lot
- A2 · api/test/session-revocation.test.ts · change-password → cookie réémis : GET /api/projects 200 ; 2e session antérieure → 401
- A2 · idem · /me avec session antérieure au change → 401 + cookie effacé
- A2 · idem · admin reset membre → session membre 401 ; session admin 200
- A2 · idem · reset self (mailer capturé, cf. password-reset.test.ts) → session antérieure 401
- A2 · idem · accept-invite → SELECT session_version = 1
- A2 · idem · JWT sans sv (app.jwt.sign(SessionUser)) → 200 si sv=0 ; 401 après bump
- A2 · idem · user désactivé → GET /api/projects 401 (≠ seulement /me)
- A2 · idem · org_admin rétrogradé member → GET /api/admin/users 403 sans re-login
- A2 · idem · change-password sans cookie → 401 ; reset user autre org → 404 (accounts.test.ts:78 existant)
- A2 · api/test/schema-session-version.test.ts · migrate() ×2 → 0 throw ; nouvel user session_version = 0
- PT-3 · api/test/session-unit.test.ts · checkUserAccess : null · disabled · pending · suspended · sv≠ · ok ; disabled+suspended → user_disabled ; expectedSv undefined → sv ignoré
- PT-3 · api/test/org-suspension.test.ts · org suspendue → GET /api/projects (session antérieure) 401 ; URL tuile émise avant → 403 ; réactivée → même URL 200 ; user org active sur projet partagé (project_orgs) de l'org suspendue → 200
- non-rég · admin-console.test.ts:216-227 · accounts.test.ts:38-54,94-114 · auth-and-tiles.test.ts · password-reset.test.ts → verts
- A2b · api/test/tile-window.test.ts · T 28800 W 14400 : exp-now ∈ (28800, 43200] sur 10 000 now ; 2 now même fenêtre → même exp ; now+W → exp+W ; loadConfig({}) → 28800/14400 ; 'abc' → défaut ; '30' → défaut ; '7200' → 7200
- A2b · api/test/log-redact.test.ts · '/p/storage/x.b3dm?token=a.b' → '?token=[redacted]' ; '?x=1&token=a&y=2' → x,y gardés ; '?TOKEN=a' masqué ; '?mytoken=a' et '?tokens=a' intacts ; sans query identique ; loggerOptions(false) === false ; serializeReq({ url: '/x?token=secret' }).url ∌ 'secret'
- A2b · cmd · `rg -n "process\.env" api/src --glob '!config.ts'` → ∅
- C1 · web/src/viewer/__tests__/csp.test.ts · meta web/viewer.html === meta web/src/viewer/index.html === constante contrat ; script-src ∌ 'unsafe-inline' ; ∌ unpkg|glr-file:|file:|cog:|photo: ; 0 `<script>` sans src ; TilesRendererLoader.ts ∌ 'unpkg.com'
- C1 · cmd · `npm run build` → dist/viewer.html : 0 `<script>` inline (modulepreload NV T003) ; dist/draco/draco_decoder.wasm + dist/basis/basis_transcoder.wasm présents
- C1 · humain · `docker run --rm -v "$PWD/Caddyfile:/etc/caddy/Caddyfile:ro" caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile` → `Valid configuration`
- C1 · humain post-déploiement · `curl -sI https://portail.geolens.fr/ | grep -ciE 'content-security|nosniff|referrer-policy'` → 4
- C1 · manuel · tileset draco + KTX2, COPC/laz, PDF (PDFViewer.ts:20), aperçus srcDoc (GenerationScreen.tsx:150, DocumentsScreen.tsx:325) → 0 violation CSP console
## Vérifié comment
- lecture auth.ts:80-87 → requireAuth = jwtVerify seul (pack disait 88-95)
- lecture repo.ts:7-18 → UserRow sans session_version ; schema.ts:54-81 → users DDL
- lecture schema.ts:208-229 → migrate() boot, ALTER toléré, split ';' ; server.ts:163-164 → appelé au boot
- lecture server.ts:379,458,486,1458 → 4 UPDATE password_hash, 0 invalidation (T002 disait 386/460/488)
- grep `jwtVerify` api/src → 2 sites : auth.ts:82, server.ts:324
- lecture server.ts:278-282 → disabled seul, org ∅ ; :301-302,:333-337 → org lue login + /me seuls
- lecture server.ts:507-512 → plancher 86400 masque T 3600 ; process.env :509
- grep install.ts:94 + lecture HttpBackend.ts:47-67 → jeton lu de l'URL page, 0 refresh ; sidecars aussi en ?token=
- grep computeProxy.ts:228 → exp = now+7200, non quantifié, hors lot
- lecture server.ts:160 + index.ts:7 → logger true, sérialiseur défaut ; grep server.ts:253 → 404 custom
- lecture Caddyfile:1-16 → 0 header, 0 log ; compose:30-38 → caddy:2-alpine
- grep web/src/viewer `on*=` → 0 ; iframes PDFViewer.ts:20,36 · srcDoc ×2 ; install.ts:64 → /viewer.html
- grep api/test TILE_URL_WINDOW|tileTokenTtlSec|session_version → ∅
## Écarts
- ∅ lecture hors WL
- decisions.md non écrit — pack : écriture result.md seule ; § Décisions à appendre par le chef
- web/viewer.html ∉ WL : CSP + inline :23-26 repris de T003, NV
## Pour la suite
- A2 : révocation = session_version + claim sv ; interdit : comparer iat/horodatage, cache de session, droits lus du JWT
- PT-3 : `checkUserAccess` seule règle d'éligibilité ; interdit : nouveau `SELECT status FROM organizations` ad hoc
- A2b : exp via `tileTokenExp` seul ; interdit : process.env hors config.ts, URL loggée non redactée, `log` Caddy
- C1 : interdit script inline et CDN externe dans le viewer ; portail Report-Only → enforce = lot dédié après 0 violation
- BLQ implémenteur C1 si Electron construit depuis ce dépôt (schémas glr-file:/cog:/photo: retirés)
## Retour sur le pack
- Manquait: plages server.ts A1/A3/A4/X1 ; web/viewer.html (entrée web réelle) ; lignes auth.ts et sites mdp T002 décalées ; install.ts:94 (jeton sans refresh, décisif pour T)
- Inutile: ∅
