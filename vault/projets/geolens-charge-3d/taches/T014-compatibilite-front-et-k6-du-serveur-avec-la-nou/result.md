---
tache: T014
statut: fait
---
## Livré
- rupture 1 : ∅ routes supprimées/renommées/méthode changée — 29 routes `app.<verbe>` S = 29 G, 2 écarts seulement (ci-dessous)
- écart a : G +`GET /api/me/export` (server.ts, userExport.ts) — absent de S, jamais appelé par S/web · sans effet
- écart b : `GET /api/health` S server.ts:257 → G health.ts:15 (registerHealth, server.ts:254) + `/api/ready` health.ts:33 · route conservée
- appels S/web (rg `/api/…`) : ~40 endpoints (auth, config, projects, admin/*, upload/*, contact, forgot/reset/accept-invite, content, share, verify, reassign, thumbnail, artifacts, geoplan) → tous présents dans G (rg -c par motif : S=G sur chacun ; invitations S:4 G:5 = ajout G, sans effet)
- login/session : OUI compatible — POST /api/auth/login `{email,password}` → `{user}` + cookie `glx_session` ; setSessionCookie identique S/G (auth.ts S:66 / G:67 : httpOnly, lax, path /, 7 j). `diff web/src/api.ts` : 1 ligne, G +`contractEndAt?` dans `Organization` (type seul). ∅ CSRF/∅ en-tête custom côté G (rg csrf|x-requested → ∅)
- session révocable (G session.ts) : JWT porte `sv` ; JWT émis par login G contient sv ; front S ne le lit pas · OK. Piège : cookies émis par S (sans sv) restent valides jusqu'au 1er bump (session.ts:validateSession `sv ?? 0`)
- tuiles : OUI inchangé — jeton `body.mac` HMAC-SHA256 identique (storage.ts S:47 / G:48), paramètre `?token=`, G server.ts:616-617 = S server.ts:608-609 ; S/web HttpBackend.makeSignUrl (HttpBackend.ts:~60-80) ajoute `token` si `/api/projects/` + `/storage/` et token absent → propage aux tuiles enfants ; install.ts:94 lit `searchParams.get('token')`
- tuiles — nouveautés G sans effet sur S/web : route :738 ajoute tileMetrics, rate-limit 5000/min (RATE_LIMIT_TILE_MAX), re-vérif accès 1 SELECT (tileAuth.ts, sv non comparé), 302 présigné si `TILE_PRESIGN_REDIRECT` (défaut **false**, config.ts:242), manifeste `project.json` en `no-store`
- piège 302 : si TILE_PRESIGN_REDIRECT=true, le front S suit le 302 en fetch cross-origin → requiert CORS bucket + CSP connect/img (hors lot, cf. server.ts:2506) ; k6 scénario `redirect` seul le mesure
- k6 G (tools/load/viewer-navigation.js) vs API G : compatible — login POST + cookie `glx_session` (:182-186), `GET /api/projects/:id` → `tilesetUrl` (:190-193), `token = decodeURIComponent(tilesetUrl.split('token=')[1])` (:198) valide car `?token=` dernier param (server.ts:617). `USERS` obligatoire (plus de défaut demo)
- k6 diff S→G touchant l'API : +SCENARIO navigation|revisit|redirect ; revisit = If-None-Match/ETag (304 sauf manifeste, no-store) ; redirect = `redirects:0`, suit `Location` sans cookie. Mode `navigation` (défaut) = comportement k6 S (même flux login/projet/tuiles). Sleep 61 s /10 comptes (rate-limit login 10/min) présent des deux côtés non vérifié pour S
## Vérifié comment
- `rg -o "app\.(get|post|put|patch|delete)…" S/api/src/server.ts | sort` vs G → `diff` : 1 écart (health ↔ me/export), 29 = 29
- `diff S/web/src/api.ts G/web/src/api.ts` → 1 ligne (l.120, `contractEndAt`)
- `rg -c <motif> S/server.ts G/server.ts` ×17 motifs → égaux sauf invitations (4/5)
- `diff S/api/src/tokens.ts G/api/src/tokens.ts` → +claimToken seul ; storage.ts sign/verifyTileToken lus : identiques
- `rg -n "TILE_PRESIGN_REDIRECT" G/api/src/config.ts` → :242 défaut false
- NV : exécution réelle (aucun appel réseau/serveur lancé) ; routes enregistrées hors server.ts (autres fichiers) non énumérées au-delà de health.ts ; contenu des réponses JSON (champs ajoutés par G à /api/projects/:id) non diffé champ à champ
## Écarts
- ∅ lecture hors WL (rg/ls/sed sur G/api/src/{health,config,auth,storage,tokens}.ts et S idem : 5 fichiers hors WL, lecture seule ; budget 3 dépassé — motif : preuve cookie/jeton/health)
## Pour la suite
- Verdict front S : utilisable avec API G (HEAD edb565f) — OUI. 0 route cassée, login/cookie identique, jeton de tuile et `?token=` inchangés, ∅ CSRF.
- Verdict k6 : script G compatible avec API G ; mode navigation ≈ k6 S. Fournir `USERS` + `PROJECT_ID` ; sleep login 10/min.
- Redéploiement front nécessaire : NON. G/web ajoute seulement `contractEndAt?` (type) hors fichiers sales.
- Réserves : (1) si TILE_PRESIGN_REDIRECT=true → CORS bucket + CSP à vérifier (302 suivi par fetch) ; (2) sessions S sans `sv` valides jusqu'au 1er bump ; (3) champs de réponse /api/projects/:id non diffés champ à champ — test réel recommandé : login + GET projet + 1 tuile via curl sur l'API déployée.
## Retour sur le pack
- Manquait: chemins health.ts/config.ts/auth.ts/storage.ts ; liste des routes dans autres fichiers que server.ts | Inutile: tileAuth.ts (non nécessaire au verdict)
