---
tache: T059
statut: fait
verdict: DÉFAUTS
---
## Livré
- A1 — KO : id effacé survit dans audit d'autrui (D3)
- A2 — OK : couche `__erased__` listée 200, lue 200, supprimable
- A3 — KO : export admin contient emails d'autrui (D2) ; 401/429/0 secret OK
- A4 — OK : 400 ×9 formats, plateforme 400, org_admin 403, 404
- A5 — OK : report 0 suppression ; enforce plafonné (3 cand. → 1)
- A6 — OK : plateforme, bascule entre 2 passes, orphelin, project_orgs exclus
- A7 — OK : RETENTION_MODE=enforce → deliverables `report`, 5→5 projets ; invalide → productionProblems
- A8 — OK : XFF ignoré sans TRUST_PROXY, honoré loopback, UA 255, hors req NULL
- A9 — KO : « suppression automatique » inactive par défaut (D1) ; LEGAL_DOCS_VERSION OK
- A10 — OK : 763/763, typecheck api 0, web 0
## Défauts
- D1 · api/src/config.ts:197 + web/src/pages/Confidentialite.tsx:105,107 · prod sans RETENTION_MODE (rg `RETENTION_` hors api/src → 0 hit, aucun compose/env ne le pose) + audit_log 800 j + user 4000 j → runRetentionPass → audit report acted 0, 1→1 ligne · attendu « supprimé automatiquement après 3 ans » / « 12 mois puis suppression automatique » / obtenu 0 suppression · non-conformité (défaut voulu D17 → humain : enforce en prod OU reformuler page)
- D2 · api/src/userExport.ts:50-53 (audit user_id=moi, detail brut) ← server.ts:1408,1460,1494,1498,1591,1610,1626 (detail = email cible) · admin POST /api/admin/users/<membre>/reset-password puis admin GET /api/me/export → `body.includes('membre@demo.geolens.fr') = true` · attendu 0 donnée d'autrui (A3) / obtenu emails de tiers · fuite (faible : admin les connaissait)
- D3 · api/src/erasure.ts:82-90 (scrub email seul) ← server.ts:1717,1740 ; retention.ts:126 · admin grant_access user X puis DELETE /api/admin/users/X → audit_log `grant_access` detail `"<X> -> <projet>"` intact · attendu 0 occurrence id (A1) / obtenu 2 lignes (grant_access + delete_user) · non-conformité (faible, id pseudonyme ; delete_user = contrat)
## Vérifié comment
npx vitest run test/zz-verif-t059.test.ts (jetable, 12 tests, supprimé) →
- `E1 200 200 email hits []` · `E1 id hits [audit_log grant_access "c0bd624d-… -> 0a1b…0201", audit_log delete_user {"userId":"c0bd624d-…"}]`
- `E2 create backslash 201 … email "a\\b.e2@demo.fr"` · `E2 delete 200 hits []` (pg-mem) · `E2 synth [synth_json "jos\\u00e9.e2@demo.fr", synth_case "JOSÉ.E2@DEMO.FR"]` non scrubés
- `E3 … del 200 | list 200 owner_user_id "__erased__" published_by null mine false | one 200 | member list 200` · `E3 admin delete erased layer 200`
- `X1 grant 200 member export 200 attachment; filename="geolens-export-2026-10-08.json" no-store` · projectAccess inclut 0a1b…0204 (accès réel accordé) · `X1 admin export has member email: true secrets: false` · `X1 anon 401` · `X2 200,200,200,200,200,429`
- `C1 "2026-02-30"→400 "2026-2-3"→400 "2026-13-01"→400 ""→400 "x"→400 "0000-01-01"→200 "+02026-01-01"→400 "2026-01-01T00:00"→400 12→400 null→200 undefined→400 "2026-12-31"→200 | plat 400 platNull 200 | org_admin 403 | 404 404`
- `R1 before [3,1,4] after [3,4,4] deletePrefix 0 [["audit","report",1,0,[]],["accounts","report",0,0,[]],["deliverables","report",1,0,["…0204"]]]` (+3 = audits retention_*)
- `R2 p1 ["…0103"] p2 [0,0,[]] rival users left 2`
- `R3a [0,0,[]] deletePrefix 0` · `R3b cfg enforce report projects 5 → 5 [["audit","enforce",0,0],["accounts","enforce",0,0],["deliverables","report",1,0]]`
- `P1 ["RETENTION_MODE / RETENTION_DELIVERABLES_MODE invalide (off | report | enforce)"]` · `P1 cap 3 1 true ["old0@…","old1@…"]` (le plus ancien effacé)
- `I1 {} 200 127.0.0.1 255` · `I1 {"TRUST_PROXY":"loopback"} 200 6.6.6.6 255` · `I1 {"TRUST_PROXY":"0.0.0.0/0"} 200 127.0.0.1 255` · `I1 hors req [{"ip":null,"user_agent":null}]` · `E4 second not_found`
npm --prefix api test → `Test Files 88 passed (88)` `Tests 763 passed (763)` (avant et après rm)
npm --prefix api run typecheck → rc 0 · npm --prefix web run typecheck → rc 0
git -C G status --short → (vide), `| wc -l` → 0
## Écarts
- lecture hors WL: api/test/retention.test.ts L1-30 — forme RetentionDeps/stub storage
- lecture hors WL: rg `RETENTION_` dépôt hors api/src+api/test — config de déploiement (D1)
- lecture hors WL: api/src/seed.ts L15-140, db.ts L13-30, emailSchema.ts L1-25 (sed, pas rg) — ids seed, interface Db, normalisation email
- budget pack 3 dépassé (5) ; budget rôle 5 tenu
## Pour la suite
- NV Postgres : erasure.ts:83 `LIKE '%'+email+'%'` ; `\` = échappement LIKE par défaut en PG ; normalizeEmail (emailSchema.ts:7) accepte `a\b@x.fr` (201) → 0 ligne sélectionnée → email survit dans create_user/reset_password ; pg-mem masque (scrub OK) → remplacer par `strpos(detail, $1) > 0` ; repro PG : `SELECT 'x a\b@x.fr' LIKE '%a\b@x.fr%'` → attendu f
- NV Postgres : PATCH contract `"0000-01-01"` → 200 pg-mem ; PG sans an 0 → 500 probable → borner l'année ≥ 1970
- D2 fix : export audit → detail filtré (ou null) pour actions admin visant un tiers ; D3 fix : scrub aussi `userId` dans detail (grant/revoke_access, retention_accounts ids)
- non couvert : organizations.contact_email = email effacé reste ; audit enforce purge les preuves accept_invite > 12 mois (Admin.tsx:1124 se vide) → décision humaine
- page Confidentialite.tsx:51 annonce « Nom » : 0 colonne nom dans users (schema.ts) — cosmétique
## Retour sur le pack
- Manquait: ids seed (orgs, users, projets) + `app.db` (accès Db en test) + liste des colonnes users/projects/project_orgs → 3 lectures hors WL évitées ; config de déploiement (compose/.env) pour juger les promesses « automatiques » ; Bash psql non autorisé → bords PG invérifiables
- Inutile: Admin.tsx (aucun affichage du detail d'audit, seulement acceptations L1105-1125)
