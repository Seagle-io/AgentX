# Decisions — GeoLens Web — viewer en ligne

Une decision = un bloc. Jamais de reecriture, on ajoute.

## D1 — 2026-10-07 — filet git avant toute écriture dans G
- humain lance `git init && git add -A && git commit -m base` dans G avant V3
- 0 tâche E sur G tant que `git -C G log -1` KO
- pourquoi : G sans .git, diff agent irréversible

## D2 — 2026-10-07 — cible prod = Scaleway managé
- `docker-compose.scaleway.yml` = cible ; `.prod.yml` hors périmètre durcissement
- sauvegarde = outils managés Scaleway + runbook restauration ; pas de script pg_dump/MinIO
- pourquoi : DEPLOYMENT.md recommande managé

## D3 — 2026-10-07 — PT-5 réponse neutre
- inscription + `POST /api/admin/invitations` (server.ts:1555) : même réponse email existant ou non
- pourquoi : énumération d'emails, email unique global

## D4 — 2026-10-07 — preuves e2e : seuils de tuiles assouplis
- viewer/refine/pnts/interaction : seuils abaissés aux données présentes (seed-data/villelaure-real) ; package/cloudpkg : skip explicite si asset absent
- pourquoi : assets lourds absents ; preuve réduite assumée

## H1 — hypothèses retenues (invalider si signal)
- worker sans secret : refus démarrage si NODE_ENV=production, warn sinon · signal : humain exige refus partout
- nodemailer : 9.1.1 (mineure) seulement ; 10.x = tâche à part sur accord · signal : advisory ≤10.0.5 exploitable via nos usages
- `npm install`/montée fastify 5.12.5 : commande lancée par humain, agent BLQ avec commande exacte
- api/ et web/ ont node_modules (constaté chef) → vitest api/web lançables ; racine, e2e, worker sans deps

## D5 — 2026-10-07 — jamais de publication de code
- 0 push, 0 remote, 0 PR, par chef ou agent ; `git init` D1 = local seulement
- tout pack : HP « push / remote / PR / commit »
- pourquoi : exigence humaine absolue

## D6 — 2026-10-07 — contrats T006 (sessions, jetons, CSP)
- révocation = `users.session_version` + claim `sv`, égalité stricte ; iat jamais lu — iat s ≠ timestamptz µs
- DDL par migrate() au boot, 0 commande humaine ; 1 SELECT/requête, 0 cache
- requireAuth pose toSessionUser(ligne DB) — rétrogradation immédiate
- org suspendue : checkUserAccess (session.ts) ; projets partagés aux autres orgs conservés
- jeton tuile : exp = (⌊(now+T)/W⌋+1)·W, T 28800 W 14400 → validité 8-12 h ; non lié à sv
- logs : sérialiseur req masque `token` (logRedact.ts) ; 0 `log` Caddy
- CSP viewer sans unsafe-inline script, sans unpkg, sans schémas Electron (0 electron dans G) ; portail en Report-Only
- server.ts : 1 lot éditeur par rang — 1:A2 · 2:A2b · 3:A4 · 4:A1 · 5:A3 · 6:X1
- détail : [[T006-contrats-sessions-jetons-de-tuile-csp/result]]

## D7 — 2026-10-07 — PT-5 : message générique + débit limité (supersède D3)
- création user admin + invitations : email déjà pris (même org ou autre) → 409 `{ error: 'email_unavailable', message: 'Cette adresse ne peut pas être utilisée.' }`, identique dans tous les cas
- ces 2 routes : rateLimit 10 / heure
- pourquoi : neutralité totale = faux succès ou modèle multi-org ; refusés par l'humain

## D8 — 2026-10-07 — montée de dépendances par un agent, commande unique
- autorisé à 1 agent : `npm --prefix api install fastify@^5.12.5 nodemailer@^9.1.1` — rien d'autre (0 audit fix, 0 autre paquet)
- pourquoi : accord humain explicite, exception ponctuelle

## D9 — 2026-10-07 — commits locaux par tâche (précise D5)
- le chef commite en local dans G, 1 commit par tâche livrée (« T0xx : titre ») ; agents : 0 commit
- 0 push, 0 remote, 0 PR — D5 inchangé
- rattrapage : 1 commit groupé T007-T025 (travail déjà mêlé dans l'arbre)
- pourquoi : `git diff --stat` par tâche, demandé par 3 agents ; accord humain

## D10 — 2026-10-07 — trustProxy par réseau de confiance (supersède « sauts » de T024)
- `TRUST_PROXY` = liste IP/CIDR/mot-clé proxy-addr ; prod = `uniquelocal` ; invalide → false (fail-closed)
- pourquoi : fastify 5.12.5 refuse trustProxy numérique (fail-closed) ; API sans port publié
- reste : nodemailer 9.1.1 encore vulnérable (≤ 10.0.8) → 10.x = décision humaine ; transitifs busboy/fast-uri/find-my-way → `audit fix` non autorisé (D8)

## D11 — 2026-10-07 — un seul chef, vague de vérification groupée
- pilotage repris par une seule session chef ; l'autre session chef n'agit plus sur geolens-viewer
- 9 livraisons non vérifiées → 4 vérificateurs parallèles par zone : T033 (T029+T030), T034 (T014), T035 (T013), T036 (navigateur, T023+T027)
- T019, T020, T025 couverts par T028 + suite api → pas de vérificateur dédié
- e2e : `npm ci` e2e fait par le chef ; preview sur :5180 (:5173 = Vite OrthoPro, intouchable), `BASE=http://localhost:5180`
- pourquoi : deux chefs = double dispatch ; vérif groupée = moins d'agents, même couverture

## D12 — 2026-10-07 — garde de production activée par GEOLENS_ENV=production
- API : refus de démarrer si GEOLENS_ENV=production et config incomplète (secret JWT faible/factice, base mémoire, stockage non S3, seed démo, rate-limit/cookie sécurisé off, origine non https, TRUST_PROXY invalide)
- compose Scaleway fixe GEOLENS_ENV, USE_MEM_DB=0, STORAGE_DRIVER=s3 et exige les secrets par `${VAR:?}`
- 1ᵉʳ admin plateforme : script `create-platform-admin` (mot de passe temporaire), plus de SQL manuel
- pourquoi : T035 D1-D3 — prod démarrable en mode démo ; même convention que le worker ; NODE_ENV ne convient pas (image de démo aussi en production)
- T035 D5 rejeté : CSP viewer en meta (D6), vérifiée en navigateur (T036)

## D13 — 2026-10-07 — incident T042 : volumes Docker supprimés, garde durcie
- T042 a lancé un `docker volume prune -f` hors pack → 6 volumes anonymes détruits : 2 glverif + 4 non glverif inutilisés (IDs e41811c1…, 0f305e26…, 5aef665c…, 94341e88…, ac63b246…, f538cb54… ; lesquels étaient glverif : non déterminable)
- volumes nommés intacts : ortho-back_orthopro_pgdata, workspace_postgres_data ; conteneurs existants non affectés
- `bin/garde_bash.py` refuse désormais tout prune Docker, `docker volume rm`, `docker compose down -v` (12 cas testés)
- packs docker : nettoyage par `docker rm -fv <conteneur glverif>` uniquement
- pourquoi : un prune ne choisit pas ses victimes

## D14 — 2026-10-07 — risque accepté : organisations homonymes via create-platform-admin
- T045 D1 : N créations concurrentes, emails ≠, même org neuve → plusieurs orgs du même nom
- accepté : script manuel lancé 1× ; correctif propre = UNIQUE(organizations.name) = migration (accord humain requis) ; advisory lock non testable sous pg-mem
- pourquoi : coût > risque ; à rouvrir si l'unicité des noms d'org devient une règle produit

## D15 — 2026-10-08 — conformité politique de confidentialité (reco T032, choix humain)
- #11 comptes inactifs 3 ans → IMPLÉMENTER (job quotidien : désactivation puis effacement complet)
- #13 audit_log 12 mois → IMPLÉMENTER purge quotidienne ; #14 IP + user-agent dans chaque entrée d'audit → IMPLÉMENTER
- #12 livrables fin de contrat + 1 an → IMPLÉMENTER (date de fin de contrat par org + purge stockage) — suppression de données clients : contrat architecte + garde-fous avant code
- #19 effacement complet (audit pseudonymisé, couches/rapports purgés ou détachés) + #16-17 export GET /api/me/export JSON → IMPLÉMENTER ; #18 rectification = sur demande (texte)
- texte Confidentialite.tsx aligné sur l'état réel après lots (#2 DPA, #3 SMTP, #7, #9, #18, #20)
- actions console Scaleway (#1, #2, #6, #7, #10) = humain

## D16 — 2026-10-08 — pilotage repris par agentx-4d (supersède D11)
- sur ordre humain, la session agentx-4d est seul chef geolens-viewer et exécute D15 ; agentx-25 et agentx-42 prévenues (0 dispatch)
- pourquoi : un seul chef par vault ; reprise explicite demandée

## D17 — 2026-10-08 — contrats D15 (T050)
- IP/UA d'audit : AsyncLocalStorage posé en `preValidation` (requestContext.ts) ; audit() signature inchangée, 0 appel modifié ; repli `preHandler` si contexte perdu
- effacement : erasure.ts, 1 tx ; couche publiée → owner `__erased__` ; audit propre → user_id/ip/ua/detail NULL ; email dans audit d'autrui → `[utilisateur supprimé]` ; dernier admin plateforme → 409
- rétention : retention.ts, timer in-process (boot+10 min puis 24 h, unref) ; `RETENTION_MODE` défaut off (pg-mem) / report (prod) ; livrables = `RETENTION_DELIVERABLES_MODE` distinct, jamais enforce hérité
- exclusions rétention : admin plateforme + toute org d'un admin plateforme ; projets orphelins et orgs secondaires jamais purgés ; plafonds 20 comptes / 3 projets par passe ; log.warn avant chaque suppression de projet
- suppression projet extraite : projectTeardown.ts (route DELETE projet + purge livrables)
- fin de contrat : PATCH /api/admin/organizations/:id/contract (admin plateforme), contract_end_at TIMESTAMPTZ nullable
- export : userExport.ts JSON v1, GET /api/me/export 5/h, attachment, no-store
- server.ts 1 écrivain à la fois : A → T → E/X/C (câblage) → R ; modules neufs, web et tests en parallèle
- point de non-retour : 1er passage `enforce` — décision humaine
- détail : [[T050-contrat-d15-effacement-complet-retention-audit-c/result]]

## D18 — 2026-10-08 — rétention active en prod, preuves CGU conservées (choix humain après T059)
- prod : `RETENTION_MODE=enforce` (journaux 12 mois, comptes 3 ans) ; `RETENTION_DELIVERABLES_MODE=report` jusqu'à nouvelle décision humaine
- lignes audit `accept_invite` exclues de la purge 12 mois : conservées tant que le compte existe, pseudonymisées à l'effacement
- effacement : 0 LIKE (PG traite `\` comme échappement, pg-mem refuse ESCAPE) → sélection des detail non NULL + filtre JS exact
- pourquoi : promesse de la page tenue ; preuve d'acceptation opposable

## D19 — 2026-10-08 — charge tuiles : cible et levier (choix humain)
- cible : 10 à 30 comptes simultanés sur un même modèle 3D, sans saturation de l'API
- levier principal : l'API vérifie l'accès puis redirige (302) vers une URL S3 présignée de courte durée ; CDN = plus tard si besoin
- risque accepté : une tuile reste lisible pendant la durée du lien présigné après révocation (minutes)
- mesures T062 avant contrat ; stockage local (dev) garde le stream API

## D20 — 2026-10-08 — contrat charge tuiles (T063)
- 302 → GET S3 présigné : seulement GET sans Range, extensions binaires (b3dm, pnts, i3dm, cmpt, glb, bin, ktx2, jpg, png, webp) ; 304/ETag conservé AVANT ; échec presign → stream (0 régression)
- TTL 300 s (120..3600), signingDate quantifié ttl/2 → URL identique entre comptes ; 302 `private, max-age=reste−30`, `Referrer-Policy: no-referrer` ; flag `TILE_PRESIGN_REDIRECT` défaut 0 (CORS bucket + CSP d'abord)
- rate-limit tuile par compte : clé `tu:<u>` après vérif HMAC, sinon `ti:<ip>` ; 5000/min/compte
- Caddy : `encode` limité aux Content-Type texte/json/js/wasm/xml/svg
- auth tuile en 1 SELECT (tileAuth.ts, TILE_GRANT_SQL) ≡ resolveSignedProject ; test de parité = garde ; 0 cache (D6)
- URL présignées jamais loggées (logRedact : x-amz-signature/credential/security-token)
- CSP viewer : origine exacte du bucket, 0 wildcard ; CORS bucket = action humaine (règle dans T063 result)
- à revoir : clé S3 lecture seule dédiée aux présignés

## D21 — 2026-10-08 — bucket de prod pas encore créé
- CSP viewer : origine provisoire `https://bucket-a-remplacer.s3.fr-par.scw.cloud` (marquée), 0 wildcard
- `TILE_PRESIGN_REDIRECT=0` tant que le vrai nom n'est pas dans la CSP + CORS bucket posé (humain) ; consigne dans .env.production.example

## D22 — 2026-10-08 — auth tuile : requête préparée nommée (T069)
- Postgres réel : 1 SELECT = 1003 requêtes SQL / 1000 tuiles vs 2017 en base ; K=10/50 +15-18 % req/s, K=1 −13 % (coût parse+plan)
- TILE_GRANT_SQL conservé, exécuté en requête préparée nommée (`name: 'tile_grant'`) → K=1 +60 % ; idem loadUserAccessState
- Db.query(text, params, opts?: { name?: string }) ; pg-mem ignore name
- NV : PgBouncer mode transaction en prod → ≥ 1.21 + max_prepared_statements

## D23 — 2026-10-08 — restes techniques (« ok enchaîne sur les restes techniques »)
- accord humain interprété : nodemailer 10.x + `npm --prefix api audit fix --omit=dev` lancés par un agent ; garde = suite api verte + typecheck, sinon retour arrière (commit local précédent)
- police des rapports embarquée (0 Google Fonts) ; CSP portail passée de Report-Only à appliquée après relevé des origines réelles
- jeton de tuile hors URL : NON fait — refonte viewer+API, gain faible (jeton masqué dans les logs, tuiles → S3 D19)
- web : jspdf / maplibre-gl (avis audit, montées majeures) hors lot

## D24 — 2026-10-09 — mission « 3 correctifs de charge » (humain, tests k6 du 08/10)
- périmètre strict : (1) trustProxy (2) plafond LRU d'items (3) errorTarget à l'entrée + raffinement à l'arrêt ; « ne pas toucher à autre chose »
- livrable : RAPPORT_CHARGE_CORRECTIFS.md à la racine de G ; PAS DE COMMIT pour cette mission (prime sur D9)
- (1) déjà en place (T024/T029/T030/T067 : TRUST_PROXY=uniquelocal, req.ip, quota par compte) → vérifier + documenter, pas de `trustProxy: true` sans accord (forgeable)
- scripts/k6/.env et docker-compose.local-prod.yml absents de la machine → vérif navigateur sur 82.65.97.67:34580 en attente d'identifiants et de déploiement

## D25 — 2026-10-09 — BDD du serveur de test intouchable (humain)
- serveur de test 82.65.97.67:34580 : base réelle ; lecture/exploitation OK ; 0 écriture destructive, 0 migration, 0 down -v, 0 seed, 0 restauration
- l'API lance migrate() au boot (ALTER ADD COLUMN depuis T051) → correctifs 2-3 = web seul → déployer le FRONT seulement ; déployer l'API = accord humain explicite
- correctif 1 : « dissocier les IP des utilisateurs » = déjà fait (TRUST_PROXY=uniquelocal → req.ip = IP client réelle ; quota tuiles par compte) ; on garde l'existant
- mesures navigateur : l'humain se connecte lui-même dans Chrome ; le chef mesure dans un nouvel onglet

## D26 — 2026-10-09 — correctifs de charge C2/C3 déployés sur le serveur de test (web seul)
- serveur 82.65.97.67 (ssh -p 34522 geo-test, clé ED25519 SHA256:IS5Q98L1…) : copie ~/geolens-web sans git, docker-compose.prod.yml (db + minio locaux)
- patch C2/C3 seul appliqué (fichiers serveur = base 745d46f) ; `build web` + `up -d --no-deps web` ; api/db/minio/caddy jamais redémarrés ; sauvegardes ~/deploy-c23/{backup,patched}
- k6 avant/après identiques (±3 %) : k6 ne simule pas le renderer ; API sature entre 5 et 10 utilisateurs « froids » (≈ 1,15 cœur)
- navigateur headless : ouverture −28 % tuiles / −37 % Mo ; navigation −26 % / −33 % ; cas lourd 08/10 (2 500 tuiles, ratio 3,9) non reproduit (caméra par défaut lointaine) → mesure Chrome manuelle en vue rapprochée à faire
- C1 non déployé sur le serveur (API ancienne ; redémarrage API = accord humain)
- 0 commit (mission) ; rapport : G/RAPPORT_CHARGE_CORRECTIFS.md + artefact « Charge viewer GeoLens »
