---
tache: T032
statut: fait
---
## Promesses
G = repo Geolens ; C = Confidentialite.tsx ; S = api/src/server.ts. Tailles S<0,5j · M≈1j · L>2j.
| # | Promesse (citation, :L) | État | Preuve | A — aligner le texte | B — implémenter (fichiers, taille) |
|---|---|---|---|---|---|
| 1 | « données hébergées en France » C:91 | NV (hors code : console hébergeur) | .env.production.example S3_ENDPOINT=s3.fr-par.scw.cloud, S3_REGION=fr-par ; DATABASE_URL hôte placeholder (région DB ∅ dans repo) | — (vérifier région console) | ∅ code |
| 2 | « Scaleway SAS … DPA art. 28 » C:91 | NV (hors code) | DEPLOYMENT.md:159 « DPA avec l'hébergeur » listé « à finaliser » | retirer « sous contrat DPA » jusqu'à signature | signer DPA console · ∅ code |
| 3 | « Scaleway Transactional Email … France » C:92 | partielle | config.ts:217 smtp générique ; .env.production.example SMTP_HOST=smtp.exemple.fr ; 0 mention TEM dans repo | « e-mails via un prestataire SMTP européen » | .env.production.example + DEPLOYMENT.md:100-118 : SMTP_HOST=smtp.tem.scaleway.com · S (+ config console TEM) |
| 4 | « Aucun » transfert hors UE C:97 | NV (hors code) | cohérent cible Scaleway ; DEPLOYMENT.md:20-27 écarte US ; Let's Encrypt/Caddy = pas de donnée perso | — | ∅ |
| 5 | « chiffrement en transit (HTTPS) » C:122 | tenue | Caddy TLS auto (Caddyfile:1-2) ; COOKIE_SECURE=1 ; sslmode=require (.env.production.example) ; helmet HSTS (DEPLOYMENT.md:153) ; S3 endpoint https | — | ∅ |
| 6 | « chiffrement … au repos » C:122 | NV (hors code : console hébergeur) | DEPLOYMENT.md:66 « chiffrement au repos gérés par l'hébergeur » ; :158 « activé côté hébergeur » ; 0 config dans compose | — (à vérifier console : DB + bucket SSE) | ∅ code ; action console |
| 7 | « base … non exposée à Internet (réseau privé) » C:123 | NV (hors code : console hébergeur) | docker-compose.scaleway.yml:12-13 « DB et stockage services MANAGÉS externes » ; DATABASE_URL = hôte managé via sslmode=require ; 0 VPC/Private Network/ACL dans DEPLOYMENT.md (rg private\|VPC → ∅) | « accès base restreint par liste d'IP et TLS obligatoire » (si Private Network non activé) | ∅ code ; console : Private Network + retirer endpoint public · M |
| 8 | « mots de passe hachés (argon2id) » C:124 | tenue | auth.ts:49 hash(memoryCost 19456,timeCost 2,parallelism 1) | — | ∅ |
| 9 | « accès à privilèges minimaux » C:124 | partielle | rôles member/org_admin/platform_admin (schema.ts:57-62), isolation org ; DATABASE_URL = 1 compte DB unique (rôle droits ∅ dans repo) ; clé S3 unique | « contrôle d'accès par rôle applicatif » | rôle DB restreint (pas owner) + clé S3 limitée bucket : console · S |
| 10 | « sauvegardes automatiques » C:125 | NV (hors code : console hébergeur) | DEPLOYMENT.md:73 « sauvegardes automatiques Scaleway — régler la rétention » ; :74 versioning bucket « à activer » ; runbook jamais joué (:160) | « sauvegardes de la base ; objets : versioning » selon état console | activer rétention + versioning console, jouer runbook §5 quinquies · S |
| 11 | « Compte utilisateur … relation + 3 ans » C:105 | non tenue | rg setInterval S → seul sweepTimer :2446 (imports) ; 0 job comptes ; last_login écrit S:311, lu S:1333/2137 (affichage seul) | « comptes conservés tant que dure la relation ; suppression sur demande » | job périodique inactifs>N → disabled puis DELETE (réutiliser suppression complète) : api/src/retention.ts nouveau + server.ts (timer) + test · M |
| 12 | « Livrables projet … contrat + 1 an » C:106 | non tenue | 0 purge post-contrat (rg retention\|purge S → imports/rollbacks seulement) ; pas de date de fin de contrat dans schema.ts projects | « livrables conservés jusqu'à demande de suppression » | champ contract_end + job purge storage : schema.ts, server.ts, retention.ts · L |
| 13 | « Journaux de connexion / audit — 12 mois » C:107 | non tenue | schema.ts:134-141 audit_log sans purge ; 0 DELETE FROM audit_log (rg) ; logs Docker : rotation 10m×5 (docker-compose.scaleway.yml:26,33,47) = borne en taille, ≠ durée | « journaux conservés au plus 12 mois » → à ne garder que si job ajouté ; sinon « conservés tant que nécessaire à la sécurité » | DELETE audit_log < now()-12 months, job quotidien : retention.ts + server.ts · S |
| 14 | « Journaux … adresse IP » C:56 | partielle | audit_log sans colonne ip (schema.ts:134-141) ; IP uniquement dans detail accept_invite S:499-500 ; IP aussi dans logs pino remoteAddress (logRedact.ts:26) — rotation taille seulement ; Caddyfile 0 directive log | « adresse IP lors de l'acceptation des CGU et dans les journaux techniques » | ALTER audit_log ADD ip,user_agent ; repo.ts:139 audit(…, req) + ~51 appels S · M |
| 15 | « Dates de connexion, actions … (journal d'audit) » C:56 | tenue | S:311 last_login ; S:312 audit 'login' ; 51 appels audit() (écritures/admin seulement, lectures ∅) | — | ∅ |
| 16 | « droit d'accès » C:113 | partielle | e-mail → traitement manuel SQL ; 0 route /api/me/export (rg export\|portab S → ∅ routes utilisateur) | « accès sur demande par e-mail, traitement manuel sous 1 mois » | GET /api/me/export JSON (users, accès, audit_log, project_layers, report_artifacts) : server.ts + repo.ts + test · M |
| 17 | « droit de portabilité » C:113 | non tenue | idem #16 ; aucun format structuré fourni | idem A#16 « export fourni sur demande (JSON) » | idem B#16 (même route) · inclus |
| 18 | « droit de rectification » C:113 | partielle | pas de PATCH profil user ; admin peut-il éditer l'e-mail ? NV (routes admin :1472 PATCH non lue) ; reset mdp S:1454 | « rectification sur demande à GeoLens » | PATCH /api/me (nom/email) : server.ts + web profil · M |
| 19 | « droit d'effacement » C:113 | partielle | S:1516-1530 : purge auth_tokens, project_access, users ; reste : audit_log.detail e-mail (S:418,1410,1528,1588), project_layers.owner_user_id/published_by (userLayers.ts:58-69), report_artifacts.created_by (schema.ts:205) | « effacement du compte ; journaux d'audit pseudonymisés ≤ 12 mois » | transaction : UPDATE audit_log SET detail=NULL/user_id=NULL, DELETE project_layers WHERE owner_user_id, UPDATE report_artifacts created_by=NULL : server.ts:1516-1530 (+repo) · M |
| 20 | « limitation » C:113 | partielle | disabled=true réversible (schema.ts:65-66) = gel de connexion, pas de gel du traitement | « limitation = désactivation du compte » | ∅ (désactivation existe) · S doc |
| 21 | « opposition » C:113 | tenue (manuel) | procédure e-mail ; rien d'automatisable | — | ∅ |
| 22 | « Réponse sous 1 mois » C:115 | NV | organisationnel (aucun suivi ticket dans repo) | — | ∅ |
| 23 | « Cookie de session … (jeton JWT) » C:66 | tenue | auth.ts:14,67-73 glx_session httpOnly, secure=cookieSecure, sameSite lax, maxAge 7 j | — | ∅ |
| 24 | « aucun cookie publicitaire ni traceur » C:71 | tenue | rg analytics\|gtag\|pixel web/src non lancé ; audit AXES4 3.1 « aucun traceur » ; NV pour code post-audit | — | rg de contrôle · S |
| 25 | « pas DPO ; contact Benoît Isnard » C:38-40 | tenue | statement + mailto ; juridique hors périmètre | — | ∅ |
| 26 | « ne vend ni ne loue » C:94 | NV | organisationnel | — | ∅ |
| 27 | CGU.tsx:72-74 §7 données perso | tenue | renvoie vers /confidentialite, aucune promesse chiffrée propre (rg durée\|mois\|ans CGU → ∅) | — | ∅ |

## Recoupement audit
- Synthèse :233 (hébergeur, 3 ans, 12 mois, repos, réseau privé, sauvegardes) · ≠ partiel : cible = Scaleway managé (docker-compose.scaleway.yml) → repos/réseau privé/sauvegardes passent de « inexistants » à NV console (DEPLOYMENT.md:66,73-74) ; 3 ans et 12 mois restent confirmés inexistants (#11,#13)
- P-M1 effacement incomplet · confirmé : S:1516-1530 identique ; audit_log.detail e-mail S:418,1410,1528,1588 ; project_layers/report_artifacts non purgés. Ligne code décalée : route :1516 (époque :1519)
- P-M2 portabilité · confirmé : 0 route export utilisateur
- P-M3 rétention · confirmé : 0 purge audit_log, 0 job comptes ; last_login (S:311) toujours non exploité
- O-m2 IP audit · confirmé : audit_log sans ip/user_agent ; T030 a seulement fiabilisé req.ip (S:498-499) pour accept_invite
- Nouveau (absent AXES4) : #3 SMTP non Scaleway TEM par défaut ; #12 rétention livrables +1 an ∅ ; #9 privilèges DB/S3 ∅ preuve ; #18 rectification sans outil

## Vérifié comment
- `git -C G log --oneline -6` → 6e22e8c T030 · e5abacb T024+T029 · 8518f4b T027 · ad370d1 · 745d46f
- `rg -n "setInterval|retention|purge" api/src/server.ts` → seul sweepTimer :2446 (imports abandonnés) ; 0 audit_log/comptes
- `sed -n 1516,1530p server.ts` → DELETE auth_tokens, project_access, users ; audit 'delete_user' target.email
- `sed -n 134,141p schema.ts` → audit_log(id,user_id,org_id,action,detail,created_at) sans ip
- `rg -n "audit\(db[^;]*ip" server.ts` → :500 accept_invite seul
- `rg -c log Caddyfile` → ∅ (0 directive log)
- `rg -n "private|VPC" DEPLOYMENT.md` → ∅ réseau privé
- docker-compose.scaleway.yml:26,33,47 → max-size 10m max-file 5

## Écarts
- ∅ (0 lecture hors WL ; rg libre sur G/api/src, Caddyfile via rg)
- NV : région Postgres managé, SSE bucket, Private Network, rétention backup, DPA signé → console Scaleway
- NV : #18 PATCH users admin (S:1472) non relu ; #24 rg traceurs web/src non lancé

## Pour la suite
- Lots B à fichiers disjoints : (L1) retention.ts nouveau + timer server.ts : #11,#13 ; (L2) effacement complet repo/server.ts:1516-1530 : #19 ; (L3) export /api/me/export : #16-17 ; (L4) audit ip/user_agent schema.ts+repo.ts : #14 ; (L5) texte C:91-125 : options A. L1/L2/L4/L3 touchent server.ts → séquencer ou plages disjointes.
- Action console Scaleway (non code) : chiffrement repos DB+bucket, Private Network/ACL, rétention backup + versioning bucket, DPA, région DB, SMTP TEM (#2,#3,#6,#7,#10) ; jouer runbook §5 quinquies.
- Décision humaine : #12 livrables +1 an (aucune base contrat) → aligner texte probable ; #13/#11 durées → implémenter (S/M) ou retirer.
- Ordre risque : #11,#13,#19,#16-17 (non tenues/partielles vérifiables) avant #6,#7,#10 (console).

## Retour sur le pack
- Manquait: PATCH users admin :1472 (rectification) ; Caddyfile et userLayers.ts en WL
- Inutile: .env.production.example partiel, CGU.tsx (0 promesse chiffrée)
