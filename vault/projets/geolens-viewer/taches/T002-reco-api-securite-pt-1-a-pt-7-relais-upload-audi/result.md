---
tache: T002
statut: fait
---
## Constats
G=…/geolens-web-feat-viewer-online ; chemins relatifs à G/api ; lignes = code actuel (≠ audit souvent)
- PT-1/C1 · src/server.ts:160 — `Fastify({ logger })` sans trustProxy — confirmé
- PT-1 · src/server.ts:240-242 — rateLimit enregistré si config.rateLimitEnabled ; max 300/min, aucun keyGenerator — confirmé
- PT-1 · src/server.ts:286 login 10/min · :392 contact 5/10min · :421 forgot 5/min · :731 tuiles config.rateLimitTileMax (5000) — lignes audit décalées (:298/:427/:737)
- PT-1 · src/config.ts:146-147 — RATE_LIMIT (défaut !useMemDb), RATE_LIMIT_TILE_MAX — confirmé
- PT-1 · installé fastify 5.8.5 (<5.12.5) ; advisory « X-Forwarded-* spoofing under trustProxy » (5.8.3–5.12.0) → upgrade AVANT trustProxy
- PT-2/M3 · src/auth.ts:105 l — `loadSessionUser` ∅ (rg 0 occurrence) ; audit auth.ts:436-456 ≠ (fichier 105 l) — ≠ audit
- PT-2 · src/server.ts:304 — jwtSign(toSessionUser, 7d) ; claims = SessionUser{userId,orgId,role,email,isPlatformAdmin}+iat/exp auto
- PT-2 · src/auth.ts:88-95 — requireAuth = jwtVerify seul, 0 lookup DB — ≠ audit : AUCUNE route requireAuth/requireAdmin ne relit l'user
- PT-2 · src/server.ts:318-343 — seul /api/auth/me relit user (disabled, org suspendue → 401) ; test admin-console.test.ts:216-227 le fige
- PT-2 · conséquence : désactivation/rétrogradation/suspension org non appliquées hors /me et tuiles pendant ≤7 j (cookie maxAge auth.ts:76)
- PT-2 · mdp modifié sans invalidation : server.ts:386 (change-password) · :460-466 (reset self) · :488-494 (reset self #2) · :1458 (admin reset) — lignes à recouper
- PT-2 · colonne password_changed_at / session_version : ∅ (rg 0 occurrence dans src)
- PT-3 · src/server.ts:278-281 resolveSignedProject — getUserById+disabled+getAccessibleProject ; 0 contrôle organizations.status — confirmé (audit :290-294 ≠)
- PT-3 · src/tenancy.ts:87-121 getAccessibleProject — 0 jointure status org ; vaut aussi pour sessions (org_admin/membre) — org suspendue passe
- PT-3 · appelants resolveSignedProject : server.ts:670 (thumbnail) · :740 (storage/*) · :1175 (objet importé)
- PT-7 · src/storage.ts:47-51 signTileToken — base64url(JSON{p,u,exp}).HMAC-SHA256(jwtSecret) ; non chiffré — confirmé
- PT-7 · src/storage.ts:53-69 verifyTileToken — MAC + exp ; pas de binding session/IP — confirmé
- PT-7 · src/server.ts:507-512 — fenêtre = max(config.tileTokenTtlSec, env TILE_URL_WINDOW_SEC ?? 86400) ; exp=(floor(now/w)+2)*w → validité 24-48 h
- PT-7 · config.ts:144 TILE_TOKEN_TTL_SEC défaut 3600 (.env.example:15) — masqué par le plancher 86400 : TTL configuré inopérant < 86400
- PT-7 · émission : server.ts:538,592,608-609,838-839 · geoplan/computeProxy.ts:229 ; réception `req.query.token` :668,733,1173
- PT-7 · process.env hors config.ts : server.ts:509 TILE_URL_WINDOW_SEC (viole règle G, audit m13)
- PT-7 · log query string : logger Fastify = `opts.logger` (server.ts:160), sérialiseur req par défaut inclut url → token journalisé ; configuration logger côté index.ts (17 l) NV
- PT-4/m4 · src/server.ts:1075-1105 PUT /api/projects/:id/:kind/:scope — seul contrôle `typeof json==='string'` (:1082) ; bodyLimit 8 Mo ; UPSERT project_sidecars — confirmé (audit :1087 ≈)
- PT-4 · lecture : GET même route :1058-1072 → `{json}` verbatim ; garde accès/packs = sidecarAccess :1018-1052
- PT-4 · schéma kind/scope : aucun enum ; kinds vus : homeview (:1090 plateforme seule), packdata (préfixe `<pack>:`), vectors, annotations
- PT-4 · consommateurs web : web/src/viewer/{ui/importedObjects.ts, layers/layersApi.ts, services/photoInspector/PhotoAnnotationStore.ts, ui/inspectionTours.ts, geoplan/workspace.ts…} (rg -il sidecar, 12 hits+) ; innerHTML = hors périmètre (éclaireur viewer)
- PT-5 · src/server.ts:1370-1372 — getUserByEmail global → 409 « existe déjà » ; :1399-1400 catch 23505 → même 409 — confirmé (audit :1378 ≈)
- PT-5 · MÊME fuite : POST /api/admin/invitations server.ts:1555 (409 global) — non listé dans l'audit
- PT-5 · email UNIQUE global (users.email) : « conflit seulement dans l'org » impossible sans changer le modèle → réponse neutre = choix produit
- PT-6/m2 · server.ts:1369 `password.length < 6` (message :1370 « ≥ 6 ») ; ≥8 : :371 (change) · :453 (reset) · :478 (invite accept) — confirmé
- PT-6 · constante/validateur partagé : ∅ (littéraux 8 ×3, 6 ×1) ; reset admin = generateTempPassword(14) auth.ts:21
- M5 · src/server.ts:2575 partRelay = driver local OU partTransport 'relay' (défaut config.ts:177)
- M5 · server.ts:2579 RELAY_PART_BODY_LIMIT = max(8 Mo(:130), ceil(maxBytes/floor(maxParts·0.9)))+4 Mo ; défaut 64 Go/1000 parts ≈ 80,5 Mo — confirmé
- M5 · server.ts:2699 addContentTypeParser octet-stream parseAs buffer ; :2701-2712 PUT …/upload/:uploadId/part/:partNumber, preHandler requireAdmin
- M5 · sémaphore/limite parts simultanées : ∅ (rg semaph|inflight 0 hit ; upload.ts:538 runPool = publication, ≠ relais) ; rate-limit global 300/min seul
- M5 · :2707 putMultipartPart(…, req.body Buffer) → storage.ts:170 (iface), :340 (local), :564 (S3 UploadPartCommand)
- M4/invitation · server.ts:1549-1551 email : toLowerCase/trim + regex `/.+@.+\..+/` ; 0 borne longueur ; bodyLimit global 1 Mo — confirmé
- M4 · mailer.ts:58-62 `sendMail({from,to,…})` to = email brut — addressparser appelé par nodemailer
- Audit npm (5 high, 0 crit ; --omit=dev) : voir Vérifié ; fastify 5.8.5→5.12.5 non majeur ; find-my-way 9.6.0 ; fast-uri 3.1.2 ; @fastify/busboy 3.2.0 : fix non majeur (npm : fixAvailable true)
- nodemailer 9.0.3 : addressparser quadratique `<9.1.0` → 9.1.1 non majeur OK ; advisories `<10.0.2` et `<=10.0.5` (free-text backtracking) → 10.0.6+ = MAJEUR — choix humain
## Correctif minimal
Contrainte : server.ts gelé → logique dans nouveaux modules, 1 ligne d'appel dans server.ts
- PT-1 · E: package.json(+lock) fastify→^5.12.5 ; src/server.ts:160 `trustProxy` ; nouveau src/rateLimitKey.ts ; src/config.ts (TRUST_PROXY) — hop/IP Caddy via config, keyGenerator userId (JWT) sinon ip · test: nouveau test/rate-limit-proxy.test.ts (login 11× XFF différents ⇒ pas de 429 global ; trustProxy actif)
- PT-2 · E: src/schema.ts (migration password_changed_at) ; nouveau src/session.ts (loadSessionUser: relit user, disabled, org suspendue, iat<password_changed_at → 401) ; src/auth.ts requireAuth l'appelle ; server.ts :386/:466/:494/:1458 UPDATE password_changed_at · test: test/session-revocation.test.ts (À CRÉER, ∅ aujourd'hui) : reset admin/self/change ⇒ ancien cookie 401 ; désactivé/suspendu ⇒ 401 hors /me
- PT-2 piège · iat en secondes vs timestamp DB : comparer en s, tolérer le cookie réémis au change-password (réémettre cookie)
- PT-3 · E: src/server.ts:278-281 (resolveSignedProject → session.ts helper partagé) · org suspendue ⇒ null (403) · test: test/auth-and-tiles.test.ts + cas suspension org ⇒ tuile 403 (modèle admin-console.test.ts:216)
- PT-7 · E: src/config.ts (TILE_URL_WINDOW_SEC rapatrié, ≠ process.env), index.ts/logger redact query `token` ; en-tête/cookie = refonte viewer (hors lot API) · test: unit fenêtre ≥ TTL ; log sans `token=`
- PT-4 · E: nouveau src/sidecarSchema.ts ; server.ts:1082 appel (JSON.parse try/catch ⇒ 400 ; kind∈enum) · test: test/risque-sidecar.test.ts + « non-JSON ⇒ 400 », JSON valide ⇒ 200 ; homeview/packdata inchangés
- PT-5 · E: server.ts:1371 et :1555 + catch :1400 · réponse neutre hors org cible (décision produit : 201 générique vs 409) · test: test/accounts.test.ts (email autre org ≠ 409 discriminant)
- PT-6 · E: nouveau src/passwordPolicy.ts (MIN=8) ; server.ts:1369,371,453,478 · test: test/accounts.test.ts (création 6 car ⇒ 400, 8 ⇒ 201)
- M5 · E: nouveau src/relayGate.ts (sémaphore par user + global) ; server.ts:2701 preHandler · 429/503 au-delà · test: test/upload-relay.test.ts (N+1ᵉ part simultanée ⇒ 429)
- M5 alt · flux direct putMultipartPart(Buffer→Readable) = changement d'interface storage.ts:170 + 2 drivers → lot plus gros
- invitation · E: server.ts:1549 (appel) + src/emailSchema.ts (max 254, regex) ; aussi 1360-1368 · test: test/admin-console.test.ts (email 300 car ⇒ 400)
- audit npm · E: api/package.json + package-lock.json (humain lance `npm install`/`audit fix` ; interdit agent) · test: npm test api + typecheck verts
## Contrats
```
// src/storage.ts:47-69
export function signTileToken(config: AppConfig, payload: TileTokenPayload): string
export function verifyTileToken(config: AppConfig, token: string | undefined): TileTokenPayload | null   // payload {p,u,exp}
// src/auth.ts
export interface SessionUser { userId: string; orgId: string; role: 'org_admin'|'member'; email: string; isPlatformAdmin: boolean }
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void>
export function setSessionCookie(reply, token, config)   // maxAge 7 j
// src/server.ts:278
async function resolveSignedProject(payload: { u: string; p: string }): Promise<ProjectRow | null>
// src/tenancy.ts:87
export async function getAccessibleProject(db: Db, user: SessionUser, projectId: string): Promise<ProjectRow | null>
// src/repo.ts:25,30
export async function getUserById(db: Db, id: string): Promise<UserRow | null>
export function toSessionUser(u: UserRow): SessionUser
// src/storage.ts:170
putMultipartPart(prefix: string, relPath: string, s3UploadId: string, partNumber: number, body: Buffer): Promise<{ etag: string }>
// src/server.ts:240
if (config.rateLimitEnabled) { await app.register(rateLimit, { max: 300, timeWindow: '1 minute' }); }
// src/server.ts:507
const tileUrlWindowSec = Math.max(config.tileTokenTtlSec, Number(process.env.TILE_URL_WINDOW_SEC ?? 86400));
const quantizedTileExp = (): number => (Math.floor(Date.now() / 1000 / tileUrlWindowSec) + 2) * tileUrlWindowSec;
```
## Vérifié comment
- `npm --prefix api audit --omit=dev --json` → high 5/total 5 : @fastify/busboy ≤3.2.1, fast-uri 3.0.0-3.1.7, fastify ≤5.12.4, find-my-way ≤9.6.0, nodemailer ≤10.0.5 ; tous fixAvailable=true
- `node -p require(pkg).version` → fastify 5.8.5 · nodemailer 9.0.3 · find-my-way 9.6.0 · fast-uri 3.1.2 · busboy 3.2.0 · rate-limit 10.3.0
- `npm view fastify@5 version` → dernier 5.12.5 ; `npm view nodemailer@9 version` → 9.1.1 ; latest 10.0.15
- `rg -n loadSessionUser|password_changed|session_version src` → ∅
- `rg -n "semaph|inflight" src/server.ts src/upload.ts` → ∅
- `rg -n "length *(<|>=) *[0-9]" src/server.ts` → :371 <8 · :453 <8 · :478 <8 · :1369 <6
- tests existants : rate-limit test/hardening.test.ts:27-49 (429 tuile, login) · trustProxy/XFF ∅ · tuiles test/auth-and-tiles.test.ts · suspension org test/admin-console.test.ts:216 (/me seul) · reset test/password-reset.test.ts, accounts.test.ts:38 · sidecar test/risque-sidecar.test.ts, persistence.test.ts, geoplan-sidecar.test.ts · relais test/upload-relay.test.ts, multipart-driver.test.ts · invitations test/admin-console.test.ts · révocation session test/session-revocation.test.ts : ∅ fichier inexistant
## Écarts
- ∅ lecture hors WL (rg/sed ciblés autorisés sur G/api et G/web/src uniquement) ; `npm view` (réseau registre) en lecture
- audit cite loadSessionUser, test/session-revocation.test.ts, auth.ts:436-456 : inexistants dans ce code (divergence de version) ; lignes serveur décalées de ≈ 5-12
- nodemailer : « fixAvailable true » npm contredit la plage ≤10.0.5 (fix = 10.x) — NV, recouper `npm audit fix --dry-run` côté humain
## Pour la suite
- Lot A (sessions, PT-2+PT-3+M3 élargi) : schema.ts, nouveau session.ts, auth.ts, server.ts(appels), tests ; ≥ ampleur : requireAuth global
- Lot B (PT-1) : package.json/lock (fastify 5.12.5 d'abord, action humaine npm), config.ts, rateLimitKey.ts, server.ts:160/240 ; collision lots A/B/C/D sur server.ts (lignes disjointes, séquencer) et config.ts (A: aucun, B+PT-7: oui)
- Lot C (entrées : PT-4, PT-5, PT-6, email invitation) : nouveaux modules sidecarSchema/passwordPolicy/emailSchema + server.ts 1082/1369/1371/1549/1555 ; PT-5 = décision produit (réponse neutre) avant pack
- Lot D (M5 relais) : relayGate.ts + server.ts:2701 ; PT-7 jeton hors query = refonte viewer+API, à scinder
## Retour sur le pack
- Manquait: version du code cible (audit ≠ code : loadSessionUser, lignes) ; accès au logger index.ts (17 l) pour PT-7 ; index.ts/schema.ts/repo.ts/upload.ts hors WL réellement utiles (lus via rg/sed) | Inutile: AXES2/AXES3 (non lus, rapport pentest suffisant), mailer.ts/upload.ts presque inutiles
