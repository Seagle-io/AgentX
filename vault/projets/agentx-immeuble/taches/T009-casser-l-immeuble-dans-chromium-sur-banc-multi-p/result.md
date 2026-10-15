---
tache: T009
projet: agentx-immeuble
statut: fait
---
## Livré
- verdict : DÉFAUTS (3)
- D1 · saisie motif ouverte pendant la bascule (réponse `state.json` lente) · requête vers l'étage affiché · étage affiché gamma (`#projet-nom` « Gamma : en sommeil ») mais `#tasks` garde les lignes alpha + saisie ouverte → Entrée = `{"action":"virer","tid":"T004","projet":"alpha"}`, alpha T004 en-cours→rejete ; même TID dans plusieurs étages → l'humain croit virer l'étage vu · repro `node .cache/banc-T009/e2e-T009.mjs` bloc V2b (Alt+↓, clic `✕ virer` T004 dans les 150 ms, réponse retardée 1500 ms) · dash/dash.js:590 `rendreTaches` sort tôt si `SAISIE.tid` ; dash.js:1163-1169 `charger` ne ferme pas la saisie quand `s.projet.slug ≠ ETAT.projet.slug` ; dash.js:986 `surHash` laisse les lignes de l'ancien étage cliquables jusqu'à la réponse
- D2 · Alt+↓ ×2 avant la réponse du 1er · rang 2 (gamma) · beta (rang 1) : le 2e appui part de `ETAT` périmé → `allerEtage(beta)` = recharge · repro e2e bloc V3b (`ordre alpha,beta,gamma · obtenu beta #/beta`) · dash/dash.js:1404-1406 — index depuis `x.selection` de ETAT, pas `IMMEUBLE.slug`
- D3 · `run/evenements.jsonl` absent/vide au chargement, 1er événement `projet: beta` · `.sonne` beta + toast + bip · rien (0 toast, 0 `.sonne`) ; seuls les suivants sonnent · repro e2e bloc V6a (`sonne [] toasts []`) · dash/dash.js:922 `if (SON.vu === null){ SON.vu = dernier; return; }` — « page fraîche » confondue avec « aucun événement vu » ; logique probablement antérieure à L2 (NV)
## Vérifié comment
```
banc : rm -rf .cache/banc-T009 ; cp bin dash roles.json _templates agents ; python3 setup.py → banc ok
  alpha(T001 en-cours,T002 revue,T003 bloque,T004 en-cours) · beta actif(T001 pret,T002 revue,T003 en-cours,T004 eval retenir fait)
  gamma(T001 a-faire, os.utime -10 j) · delta clos (2 designer virés → item toit) · vault/archive/2026-01-01-vieux
python3 bin/dash.py --port 7802 --no-open & (pid 225244 puis relance banc neuf)
curl -s 127.0.0.1:7802/state.json → 3 2 [('alpha',0,3,False),('beta',1,2,False),('gamma',2,1,True)] {'slug':'alpha','source':'activite','refus':''} dormants 1 mesure_ms 5
curl state.json?projet= ../x | %00 | <script> | a×300 | delta | 2026-01-01-vieux →
  'slug inconnu : ../x' · '\x00' · '<script>' · 'a'×48 (len 63) · delta requete '' · 'slug inconnu : 2026-01-01-vieux'
curl -X POST /api/run sans jeton → 403
node .cache/banc-T009/e2e-T009.mjs (sortie .cache/banc-T009/e2e.out) → BILAN 32/35 OK
OK V1 /api/run portent projet beta — [["set","T001","beta"],["retenir","T002","beta"],["virer","T003","beta"]] codes 0
OK V1 alpha intact — alpha Δ [] · beta Δ ["T001:pret→abandonne","T002:revue→fait","T003:en-cours→rejete","T005:∅→a-faire"]
OK V2 Alt+↓ ferme la saisie, 0 requête · OK V2 clic étage ferme la saisie, 0 requête
KO V2b — affiché gamma · requête [["virer","T004","alpha"]] · alpha Δ ["T004:en-cours→rejete","T005:∅→a-faire"] · lignes "Alpha un|…|Alpha quatre"
OK V3 étage = dernier clic — ["gamma","#/gamma","gamma","Gamma : en sommeil","gamma"]
KO V3b Alt+↓ ×2 → rang 2 — ordre alpha,beta,gamma · obtenu beta #/beta
V4 #/../x #/%00 #/<script> #/<img onerror> #/a×300 #/%E2%80%AEbeta #/BETA → im null, défaut alpha, err+0, hash conservé
   #/2026-01-01-vieux #/zz-inconnu → refus, hash "" · OK V4 0 XSS · OK clos lisible delta · OK archive refusée
OK V5 #todo-count 8/8 · toit = SPAN sans data-etage, clic → hash inchangé · .ti-etage beta → #/beta
KO V6a sonne [] toasts [] · OK V6b ["beta · T002 · 14:03:12"] · OK V6c toast «T002 · 14:03:13», 0 étage · OK V6d projet hostile échappé
OK V7 epsilon apparaît puis sous-sol ≤ 2 polls (SOUS-SOL · 3) · OK gamma en-cours → plus dormant · OK V7b étage supprimé → hash "", défaut
OK V8 390 : 3 étages {"sw":390} · 12 étages {"sw":390,"n":12}
OK V9 Tab → im-toit → rang 0 · ↓+Entrée → rang 1, focus conservé après poll · retour navigateur → #/p08 · Ctrl+K « étage » 14/14 · Entrée palette → étage · Ctrl+K muet dans xterm
OK 0 erreur console · OK 0 dialogue
captures : .cache/banc-T009/T009-1280.png · T009-1280-12.png · T009-390.png · T009-390-12.png
kill $(cat salle.pid) ; curl :7802 → 000
git status --short vault/projets/agentx-immeuble → ∅ fichier banc ; seuls chef (T010,T011,todo…) + ce result.md
```
## Écarts
- lecture hors WL: bin/rh.py:15-23 — seuils item toit RH
- lecture hors WL: dash/index.html:1-60 — ids #projet-nom, #todo, #tiroir
- lecture hors WL: vault/_templates/{brief,context}.md — banc : statut brief, pack lintable
- lecture hors WL: supervision.json (ls seul) — banc sans sonde
- banc : beta enrichi (revue+eval retenir, en-cours) — V1 exige set/retenir/virer, « actif, pret » seul insuffisant
## Pour la suite
- D1 : `charger()` dash.js:1167 — réponse acceptée avec `s.projet.slug !== ETAT?.projet?.slug` ⇒ `SAISIE.tid=null` avant `rendre(s)` ; `surHash` dash.js:986 ⇒ `#tasks` inerte (classe/`inert`) jusqu'à la réponse
- D2 : Alt+↑/↓ dash.js:1404 — partir de `IMMEUBLE.slug ?? sélection ETAT`, pas de `x.selection`
- D3 : dash.js:922 — `SON.vu` initialisé au 1er état reçu (même `evs` vide → sentinelle `''`), pas au 1er événement
- hors défaut : hash client-invalide (`#/BETA`, `#/../x`) conservé dans l'URL (C8 `etageDemande` → null, pas de refus serveur) — trancher si la page doit l'effacer
- toit « arrêté » vs tiroir « en session » sur le banc : artefact interception `/api/term/*` (NV sur :7777)
## Retour sur le pack
- Manquait: beta « actif, pret » ne permet ni retenir ni virer (V1) — préciser statuts ; item toit exige rôle ≥ 2 livrées ≥ 50 % virées (rh.py:15-20) — à recopier ; Alt+↓ dépend de l'ordre post-action (V1 réordonne)
- Inutile: ∅
