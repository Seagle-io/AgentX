---
tache: T001
projet: seagle-pilotage
statut: fait
---
## Livré
- Kora = OrthoPro : ortho-front/index.html:7 `<title>Kora…`, STRUCTURE.md:1, Makefile kora-suite
- 6 dépôts git relevés ; 6 dossiers Geolens/audit ∅ .git — [[carte]]
- seagle-website : ∅ page Geolens ; Kora = 8 modules ×3 pts + 5 jeux, 5 langues
- seagle-website HEAD = feat/ascii-nuit-etoilee, 16 commits hors main ; pages Kora actuelles hors main
- captures Kora : public/kora 61 fichiers, git 2026-10-13 ; production script ∅ (manuel NV)
- OG : scripts/og-images.mjs (Playwright) → public/og/*.jpg 9 fichiers
- Geolens-website : 7 captures public/images/logiciel/, 8 packs site.ts, 2026-10-02
- écart : Geolens produit 2026-10-14 vs site 2026-10-02 ; Kora front 2026-10-15 vs captures 2026-10-13
- Seagle-Marketing : 10 notes + Calendrier éditorial + 10 posts, ∅ git ; doublon OrthoPro/Marketing
- finance : 3 devis .docx + OrthoPro/{Businessplan,business_plan,PRICING_LICENCES}.md ; ∅ factures/tableurs
## Vérifié comment
- `git -C <d> remote -v; branch -a; log -1 --format='%h %ad %s'` → sorties dans [[carte]] (tableau dépôts)
- `rg -il geolens` seagle-website hors node_modules/dist → ∅ (0 fichier)
- `git -C seagle-website log main..HEAD --oneline | wc -l` → 16
- `git log -1 --format='%h %ad' -- public/kora` → 7624a43 2026-10-13
- `git -C Geolens-website log -1 -- src/pages/Logiciel.tsx src/content` → 6ae6bfe 2026-10-02
- `find . -maxdepth 3 -iname 'devis*|facture*|*.xlsx|*.ods'` → 3 devis .docx
## Écarts
- lecture hors WL: Geolens/{geolens-reality-main,…} listings `ls -a` seulement, Audit-geolens/ `find` nom seul, Geolens-website/README.md, geolens-web README.md (rg), ortho-front/index.html+Makefile+ STRUCTURE.md (rg) — preuves Kora/lancement
## Pour la suite
- Kora = OrthoPro : `W/OrthoPro/{ortho-back,ortho-front}` (W=~/Documents/Workspace) ; remotes git@github.com:Seagle-io/ortho-{back,front}.git ; défaut origin/HEAD=master ; Ultime = branche de travail en retard (2026-10-06) ; « branche de publication » à trancher (master vs Ultime)
- Geolens produit : `W/Geolens/geolens-web-feat-viewer-online` branche master, remote unique `geolens-old` (Geolens-software/geolens-old) ; 5 autres dossiers Geolens ∅ .git (non surveillables par git)
- Sites : seagle-website (main défaut ; HEAD local feat/ascii-nuit-etoilee, 16 commits d'avance) ; Geolens-website (main ; origin/HEAD→claude/nifty-bohr-900lv4)
- seagle-website ∅ page Geolens → la porte Geolens ne concerne que Geolens-website
- Textes Kora : src/lib/local/{fr,en,de,es,it}/Kora.ts:23-75 (modules.items, 8) ; page src/pages/Kora/index.tsx ; route src/lib/site-routes.json:16
- Captures Kora : seagle-website/public/kora/ `{dark|light}-<écran>-{1280|2400}.webp`, game-*, kora-games.{mp4,webm} ; réf. src/pages/Kora/index.tsx:77-80,116-122,241-242,312 ; production script ∅
- OG : scripts/og-images.mjs, `npm run build && npm run preview` (:4173) puis `node scripts/og-images.mjs` → public/og/*.jpg
- Textes Geolens : Geolens-website/src/site.ts (packs ~l.244-253, riskSteps) + src/pages/Logiciel.tsx ; captures public/images/logiciel/vue-*.webp (7) ; production script ∅
- Dates comparables : git log -1 --format=%ad sur dépôt produit vs `-- public/kora` / `-- public/images/logiciel`
- Lancement : sites `npm run dev` :5173 / preview :4173 ; Geolens web `npm run dev:api` :4000 + `dev:web` :5173 (docker :8080 NV exécuté) ; Kora back :3000 front :5173 (node 24.15.0)
- Marketing : W/Seagle-Marketing/Calendrier éditorial.md (10 posts 21/10→25/11, colonne Statut) ; ∅ git ; doublon W/OrthoPro/Marketing/
- Finance : W/Geolens/Devis DEV-2026-001 - SEAGLE - Geolens V2.docx, W/Audit-geolens/charte_seagle/DEVIS_GEOLENS_{BPIFRANCE,MEP_V1}.docx, W/OrthoPro/{Businessplan.md,business_plan.MD,PRICING_LICENCES.md}
- Pièges : Doc-Geolens ≈ Geolens-Audit-Vault (doublon) ; 2 ports :5173 en collision (sites + front + web) ; Kora ports/DB test en env.md orthopro
## Retour sur le pack
- Manquait: nom de la branche « publication » par produit ; Ortholan/Orthosaurus-api (anciens dossiers) absents de la WL
- Inutile: vault/projets/{seagle-site,geolens-viewer}/env.md non lus (budget)
