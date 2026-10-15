---
pack: T059
projet: geolens-viewer
role: verificateur
cree: 2026-10-08
---

# Pack T059 — Vérif D15 : effacement, export, fin de contrat, rétention, audit IP — tenter de casser

> Seule source de vérité de l'agent T059. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter les livrables D15 (T051-T058) : trouver une donnée personnelle qui survit à l'effacement, un secret ou une donnée d'autrui dans l'export, une purge de rétention qui supprime ce qu'elle ne doit pas (ou en `report`), une IP d'audit fausse, une promesse de la page Confidentialité non tenue ; `OK` ou `DÉFAUTS` avec test de repro ; 0 correction. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] A1-A10 : chacune OK/KO avec commande + sortie ou coordonnée lue
- [ ] ≥ 6 contre-exemples en test jetable `api/test/zz-verif-t059.test.ts`, lancés puis SUPPRIMÉS : effacement d'un user cité dans un `detail` sous forme JSON échappée / casse différente · couche publiée `__erased__` encore listée et affichable (route de listage des couches) · export d'un user qui a un accès à un projet d'une autre org · rétention `report` avec cutoff dépassé → 0 suppression réelle · rétention comptes : user dont l'org devient plateforme entre 2 passes · livrables : projet partagé via project_orgs à une org expirée → intact · deliverablesMode non posé + RETENTION_MODE=enforce → 0 projet supprimé · audit IP sous XFF spoofé sans TRUST_PROXY
- [ ] `npm --prefix api test` + `npm --prefix api run typecheck` + `npm --prefix web run typecheck` → sorties collées
- [ ] `git -C G status --short` final : 0 fichier zz-verif restant
- [ ] verdict `OK` | `DÉFAUTS` ; défaut = fichier:ligne + repro + attendu/obtenu + gravité (perte de données / fuite / non-conformité / cosmétique)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule (+ exécution) ; écriture : result.md + le test jetable zz-verif-t059 (dernière ligne). rg libre sur les dossiers api/src et web/src/pages du dépôt.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/erasure.ts` | L | T054 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/userExport.ts` | L | T055 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/retention.ts` | L | T057 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/requestContext.ts` | L | T051 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/projectTeardown.ts` | L | T053 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | retention, productionProblems |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/userLayers.ts` | L | listage couches (owner `__erased__`) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | rg : /api/me/export, DELETE users/:id, organizations/:id/contract, startRetentionScheduler, LEGAL_DOCS_VERSION |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/pages/Confidentialite.tsx` | L | promesses réécrites (T058) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/pages/Admin.tsx` | L | affichage du journal d'audit (detail JSON de delete_user) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp, login |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/zz-verif-t059.test.ts` | E | jetable, supprimé à la fin |

## Contrats
```
D17 (contrats T050, résumé) :
- audit() renseigne ip/user_agent via AsyncLocalStorage (preValidation) ; ip = req.ip (TRUST_PROXY) ; UA ≤ 255
- eraseUser(db, id) 1 tx : auth_tokens, project_access, couches privées DELETE ; publiées → owner '__erased__' ; published_by/updated_by/created_by NULL ;
  audit propre → user_id/ip/user_agent/detail NULL ; email dans detail d'autrui → '[utilisateur supprimé]' (LIKE + includes) ; users DELETE ; dernier admin plateforme → EraseError
- DELETE /api/admin/users/:id → eraseUser ; audit 'delete_user' detail = JSON { userId, orgId, …counts } sans email
- GET /api/me/export (5/h, attachment, no-store) : JSON v1 sans password_hash/token_hash/session_version, audit = moi seul
- PATCH /api/admin/organizations/:id/contract (admin plateforme) ; contract_end_at TIMESTAMPTZ minuit UTC ; org plateforme → 400
- retention : RETENTION_MODE défaut off (pg-mem) / report (DB réelle) ; RETENTION_DELIVERABLES_MODE jamais enforce hérité ;
  audit > auditDays ; comptes (last_login ?? created_at) > accountInactiveDays, hors admin plateforme et orgs plateforme, ≤ maxUsersPerPass ;
  livrables : orgs contract_end_at < now − graceDays, hors plateforme, projets org_id = org seulement, ≤ maxProjectsPerPass, log.warn avant teardown ;
  1 audit retention_<purge> par purge exécutée ; timer boot+10 min puis intervalMs, unref
- page Confidentialité : 3 ans sans connexion, 12 mois journaux (IP + navigateur), fin de contrat + 1 an, export JSON depuis Mon compte, pseudonymisation à l'effacement
```
Affirmations à réfuter :
- A1 après DELETE user : `rg` SQL sur TOUTES les tables (users, auth_tokens, project_access, project_layers, project_sidecars, report_artifacts, audit_log) → 0 occurrence de l'id ni de l'email
- A2 couche publiée d'un user effacé : toujours servie sans erreur (JOIN/affichage avec owner `__erased__`)
- A3 export : 0 secret, 0 donnée d'autrui (audit, couches, accès d'une autre org) ; anonyme 401 ; 6ᵉ appel 429 (RATE_LIMIT=1)
- A4 fin de contrat : validation date (impossible, format, null), org plateforme 400, org_admin 403
- A5 rétention report : 0 ligne supprimée, rapport cohérent ; enforce : seulement les cibles, bornées par les plafonds
- A6 exclusions rétention : admin plateforme, membres et projets des orgs plateforme, projets orphelins, orgs secondaires via project_orgs
- A7 RETENTION_MODE=enforce seul ne supprime aucun livrable ; valeur invalide en prod → productionProblems
- A8 audit IP/UA : correct avec TRUST_PROXY, XFF ignoré sans ; hors requête NULL
- A9 LEGAL_DOCS_VERSION = '2026-10-08' ; page Confidentialité : chaque promesse D15 a son code (lister promesse → fichier:ligne)
- A10 suites vertes : api, typecheck api et web
Reste connu (pas défaut) : 409 last_platform_admin inatteignable par la route (403 resolveTargetUser avant) ; ROLLBACK pg-mem non effectif (atomicité prouvable seulement sur Postgres réel).

## Décisions actées
- défauts non destructifs (report/off) ; enforce livrables = décision humaine — decisions.md D17
- couche publiée conservée sous `__erased__` ; audit pseudonymisé — D17

## Hors périmètre
- corriger, éditer src/ ou un test existant ; activer enforce hors test jetable
- console Scaleway (chiffrement au repos, sauvegardes, DPA)
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api vitest + pg-mem ; rate-limit seulement avec RATE_LIMIT=1 ; RetentionDeps.now injectable
- G sous git, HEAD = commit T057 ; seul agent sur G

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Write (result.md + zz-verif-t059.test.ts), Bash(npx vitest, npm --prefix api test, npm --prefix api run typecheck, npm --prefix web run typecheck, rg, rm du seul zz-verif-t059.test.ts, git diff, git status, git show)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T059
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- A1..A10 — OK | KO (≤ 8 mots)
## Défauts
- ∅ | Dn · fichier:ligne · repro (cas verbatim) · attendu / obtenu · gravité
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
