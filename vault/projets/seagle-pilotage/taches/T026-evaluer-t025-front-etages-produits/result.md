---
tache: T026
projet: seagle-pilotage
statut: fait
evalue: T025
verdict: retenir
---
## Verdict
retenir — DoD T025 et cas hostiles tenus
## DoD
- [x] §C3 appliqué (IMMEUBLE.projet, etageDemande→{etage,projet}, allerEtage(cle,projet), charger etage=/projet=, puces, sous-sol, sonnerEtages e.etage||e.projet, etiquetteEtage/todo, bandeau produits_erreur, palette) — `git diff -- dash/` → présents ; puces dans #pa-projets = écart acté
- [x] `node --check dash/dash.js` → ∅ — `node --check dash/dash.js; echo exit=$?` → `exit=0`
- [x] Chromium :7777 — `node .cache/seagle-eval-T026/eval.mjs` → `R étages → ["É4 Kora","É3 Geolens","É2 AgentX","É1 Seagle"]` · `R direction → "É5 · CHEFen session "` · `R clic Kora → hash "#/kora/orthopro"` · `R après puce → slug agentx-immeuble→agentx-entreprise, hash "#/agentx/agentx-entreprise"` · `R #tasks changé → true` · `R #/orthopro → "#/kora/orthopro"` · `R #/zz → ""` · `R sous-sol dashboard-grille → "#/kora/dashboard-grille"`
- [x] 390 px + PNG — `R 390 scrollWidth étage → 390` · `immeuble → 390` ; `ls .cache/seagle-T025/` → `etage-1280.png etage-390.png immeuble-1280.png immeuble-390.png`
- [x] non-régression — `R tiroir → true` · `R palette étages → ["⇅ étage Kora","⇅ étage Geolens","⇅ étage AgentX","⇅ étage Seagle",…]` · `R Alt+↑ → "#/geolens/geolens-charge-3d"` · `R Alt+↓ → "#/agentx/agentx-immeuble"` · registre_erreur : `B bandeaux → ["roles.json invalide : version : None invalide (attendu 1)"]`
- [x] `git diff --stat -- dash/` → `dash.css 7 + · dash.js 128 · index.html 1 + · 95 insertions(+), 41 deletions(-)` (= déclaré) ; result.md T025 conforme
- [x] banc (a) produits.json absent :7828 — `A bandeaux → ["produits.json invalide : produits.json absent"]` · `A étages → 10 slugs projets` · `A clic orthopro → {"hash":"#/orthopro/orthopro","slug":"orthopro","actif":["orthopro"]}` · `A #/geolens-viewer → slug geolens-viewer` · `A pageerrors → []`
- [x] banc (b) roles.json `{}` :7829 — `B bandeaux → ["roles.json invalide : version : None invalide (attendu 1)"]` · `B pageerrors → []`
- [x] hostiles :7777 — `#/kora/zz → {"hash":"#/kora/orthopro","slug":"orthopro","actif":["orthopro"]}` · `#/zz/orthopro → idem` · `#/KORA/OrthoPro → {"hash":"#/KORA/OrthoPro","slug":"orthopro","actif":["orthopro"]}` · `#/kora/%3Cscript%3E → "#/kora/orthopro", slug orthopro` · `R double clic cohérent → true` (slug agentx-voix == .actif) · `R pageerrors → []`
- [x] périmée A→B→A — `R périmée A=agentx-serveur B=agentx-immeuble ms → 170` · `R périmée final = A → true`
- [x] 390 puces AgentX — `R 390 puces visibles → 4` · `R 390 scrollWidth étage → 390`
- [x] isolation — `md5sum … | diff - md5avant && echo md5 identiques` → `md5 identiques` ; `curl 7828/7829` → `000` `000` (kill pid 1205522 1205524)
## Motif
∅
## Vérifié comment
node .cache/seagle-eval-T026/eval.mjs → sorties ci-dessus ; script + PNG : /home/jdrac/Documents/Workspace/AgentX/.cache/seagle-eval-T026/{eval.mjs,etage-1280.png,etage-agentx-390.png,banc-a.png,banc-b.png}
curl :7828/state.json → mode projets, produits_erreur "produits.json absent" ; :7829 → mode produits, registre_erreur "version : None invalide (attendu 1)"
## Écarts
- ∅ (0 lecture hors WL ; bancs a/b copiés dans .cache/seagle-eval-T026/)
## Pour la suite
- défaut hors DoD : dash.js:1425-1426 `<g class="tour-etage">` porte 2 attributs `style` (--c puis --retard si sonne) → le 2e est ignoré par le parseur : --retard perdu pendant la sonnerie ; fusionner en un seul style
- mode projets : hash réécrit `#/<slug>/<slug>` (ex. `#/orthopro/orthopro`) ; fonctionnel mais redondant — réécrire `#/<slug>` si immeuble.mode == "projets"
- `#/KORA/OrthoPro` : état correct mais hash non normalisé en minuscules (sel == demande après lowercase → pas de replaceState)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
