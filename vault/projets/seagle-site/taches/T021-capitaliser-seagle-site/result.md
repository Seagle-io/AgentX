---
tache: T021
statut: fait
---
## Livré
- vault/connaissances/seagle-outillage-build.md — build/prérendu/preview/ports/sitemap en dur, builds isolés
- vault/connaissances/seagle-i18n-routes-5-langues.md — contrat site-routes.json, URLs, pièges langue/canonical
- vault/connaissances/seagle-reload-chunk-prerendu.md — reload borné, .boot-failed, app-mounted ≠ montage
- vault/connaissances/seagle-a11y-tokens-audit.md — th-text-md/faint = encres ASCII, découplage, audit.mjs
- vault/connaissances/seagle-e2e-check-dist.md — e2e + check-dist : motif, trous connus
- vault/_templates/context.md:60-63 — 4 lignes (non suivis, build partagé, classe figée, serveur test)
- vault/projets/seagle-site/brief.md — DoD annotée 6 [x] · 4 [~] · 0 [ ] + refermées/invalidées + carte MAJ
- vault/projets/seagle-site/todo.md — T006 coché, T022 coché, +6 entrées (T007 T021 T023-T028)
## Vérifié comment
python3 bin/vx.py integrer --projet seagle-site → T001-T020, T022-T028 lus (T021 = moi)
wc -l vault/connaissances/seagle-*.md → 32 · 35 · 35 · 37 · 33 (≤ 40)
python3 bin/vx.py index → index ecrit : vault/INDEX.md (7 projet(s))
python3 bin/vx.py doctor → vault coherent.
NV — noms `--th-copy-md/--th-copy-faint` déduits de T020 (ascii-sensib) ; non relus dans style.css (dépôt interdit)
NV — liste extensions scannées par check-dist (.js .mjs .json .css .html) déduite des fixtures T025
## Écarts
- ∅ lecture hors WL (3 lectures budget non utilisées ; decisions.md = 1 seule décision T005, T013/T023 non consignées)
- 5 notes (DoD : 3-5) ; reload/prérendu séparé de i18n pour tenir ≤ 40 l.
- DoD « tout cocher » : 4 cases [~] = réserve réelle, pas cochées pleines
- brief.md statut resté `cadrage` (non changé : archivage/clôture = chef + humain)
## Pour la suite
- humain : valider visuellement puis commiter ; `git add -f .env.example` ; ajouter `npm run check:dist` à deploy-static.sh ; fichiers `??` (e2e/, scripts/check-dist.mjs, site-routes.*, analytics.ts) à `git add`
- trancher : rootMargin vidéos AgentX (390×844), `supported()` de-DE, JobPosting `postedOn`, Services page routée ou JSON-LD retiré
- chef : consigner dans decisions.md le découplage tokens ASCII/texte (T013 BLQ → T020) et la garde de reload (T023/T028) — absents
- packs futurs sur seagle : joindre [[seagle-outillage-build]] (builds isolés cwd=tâche) et [[seagle-i18n-routes-5-langues]] ; DoD rg liens = 2 regex
- vérif prérendu réel restait NV dans 20+ tâches (« réservé au chef ») : prévoir une tâche chef dédiée post-build
## Retour sur le pack
- Manquait: retours « Retour sur le pack » absents de la sortie `integrer` (seulement Pour la suite/Écarts/Vérifié) → défaut d'outil ; décisions.md incomplet (1 entrée)
- Inutile: ∅ (T022-T028 absents du pack comme annoncé, couverts via integrer)
