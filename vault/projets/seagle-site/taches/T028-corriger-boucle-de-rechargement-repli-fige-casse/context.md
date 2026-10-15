---
pack: T028
projet: seagle-site
role: implementeur
cree: 2026-10-14
---

# Pack T028 — Corriger : boucle de rechargement, repli figé, casse encodée, hôtes locaux

> Seule source de vérité de l'agent T028. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger les défauts T027 D1-D5 : jamais de boucle de rechargement (une seule clé, purgée seulement après montage réussi), repli prérendu lisible (éléments à opacité 0 rendus visibles), casse encodée normalisée, hôtes locaux supplémentaires détectés par check-dist.


## Definition of Done
- [ ] D1 : `node ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T027/loop.mjs / <chunk fr> 7000 40000` (BASE ton preview, nom de chunk de TON build) → loads ≤ 2 ; purge de `reloaded:*` déplacée : après `createRoot().render` réussi (pas sur `load` + 5 s)
- [ ] D5 : `/DE` + chunk coupé → 1 seul rechargement (preload et locale partagent la garde `reloaded:boot`) ; `node ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T027/dbl.mjs` → loads ≤ 2
- [ ] D2 : repli (React non monté) → `html` reçoit une classe (ex. `boot-failed`) ; `style.css` : sous cette classe, `[style*="opacity: 0"]` et `[style*="opacity:0"]` → `opacity: 1 !important; transform: none !important` ; `node ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T027/shot-fallback.mjs` → section « Huit métiers… » visible (capture), 0 bloc à opacité 0 dans `#root`
- [ ] D3 : `App.tsx` compare le chemin **décodé** (`decodeURIComponent`, try/catch → chemin brut) à sa version minuscule ; `/%44E/products` → `/de/products` ; `/a-propo%53` → `/a-propos` ; `node ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T027/case.mjs` → OK
- [ ] D4 : check-dist détecte aussi `localhost.`, `*.localhost`, `127.x.y.z` (tout 127/8) ; builds `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T027/build-*` → exit 1 ; `dist/` → « dist OK » ; fausses alertes 0
- [ ] non-régression : 5 langues normales (React monté, `__reactContainer` présent sur `#root` — la classe `app-mounted` est figée dans le prérendu, ne pas s'y fier) ; `node ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T027/case.mjs` cas valides ; échec unique de chunk → 1 reload puis montage
- [ ] `npx tsc --noEmit -p .` → 0 erreur
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/src/main.tsx` | E | gardes L8-17, montage L21-31 |
| `~/Documents/Workspace/seagle-website/src/style.css` | E | règle repli seulement |
| `~/Documents/Workspace/seagle-website/src/App.tsx` | E | redirection minuscules ~L91-93 |
| `~/Documents/Workspace/seagle-website/scripts/check-dist.mjs` | E | motif L23-26 |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T027-re-verifier-les-corrections-t023-a-t026/result.md` | L | défauts + repro |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T027/` | L | loop.mjs, dbl.mjs, shot-fallback.mjs, case.mjs, build-* |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T028/` | E | build (cwd = ce dossier), scripts |

## Contrats
Défauts T027 (verbatim) :
```
D1 G2 — chunk locale qui échoue > 5 s après load → rechargement infini (~1/7 s) ; purge reloaded:* à load+5 s passe avant le rejet — main.tsx:15-16 × :27-28
D2 G3 — repli HTML prérendu → section Expertises de / vide : 20 blocs opacity 0 figés (dist/index.html : 32 style="opacity: 0…")
D3 G3 — /%44E/products → page FR, canonical /%44e/products — App.tsx:93 compare le chemin brut
D4 G3 — VITE_CHAT_API_URL http://localhost.:3001, http://127.0.0.2:3001, http://api.localhost:3001 → dist OK — check-dist.mjs:26
D5 G3 — /DE + chunk coupé → 2 rechargements (preload puis locale)
```
Code actuel main.tsx : garde `reloaded:preload` sur `vite:preloadError` ; purge `reloaded:*` sur `load` + 5000 ms ; `i18nReady.then(render + app-mounted, () => reloaded:locale → reload)`.
Motif actuel : `/(?:https?:|wss?:)?\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])[:/]/i`

## Décisions actées
- repli = HTML prérendu lisible, jamais d'écran blanc ni de boucle — chef
- garde de rechargement page par page (`reloaded:<pathname>` dans App.tsx `page()`) : inchangée
- visuels ASCII intouchables (`src/components/ui/ascii-*`, `*.data.ts`, `src/components/kit/Ascii*`) — décision humain 2026-10-14
- design intouchable : kit `src/components/kit/`, ∅ néon/halo/grille/blur décoratif ; Mona Sans + JetBrains Mono
- nouvelle clé i18n → 5 langues (`src/lib/local/{fr,en,de,es,it}/`) ; textes existants non réécrits

## Hors périmètre
- i18n.ts, hooks, pages ; e2e/run.mjs

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` : React 18.3, Vite 7.3.6, react-router 7, i18next 25 + react-i18next 16, Tailwind 4, motion 12 ; TS strict, `npx tsc --noEmit -p .` → 0 erreur sur HEAD
- arbre partagé : 6 autres agents écrivent en même temps dans d'autres fichiers ; leurs diffs peuvent apparaître dans ton build — ne pas les corriger, les signaler
- **jamais `npm run build`** : il écrit `dist/` (servi sur :4173 par un preview partagé) et `prerender.mjs` exige le port 4173 libre
- ton build : `npx vite build --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T028/dist --emptyOutDir` (le plugin sitemap écrit aussi `dist/sitemap.xml` : sans effet, laisser)
- ton preview : `npx vite preview --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T028/dist --port 4428 --strictPort` en arrière-plan ; l'arrêter à la fin (kill du pid lancé, par pid)
- Playwright 1.62 lib : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; WebGL : `args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]` ; scripts dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T028/`
- thème/langue : `addInitScript` → `localStorage.setItem("seagle-theme","dark")`, `localStorage.setItem("i18nextLng","fr")`
- prérendu (`prerender.mjs`) non exécutable par toi → vérif HTML prérendu = `NV — prérendu réservé au chef`
- DoD périmètre : `git -C ~/Documents/Workspace/seagle-website diff --stat -- <chemins E>`, jamais diff global ; aucun commit (l'humain commite)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (fichiers E uniquement), Grep, Glob, Bash (`npx tsc`, `npx vite build/preview` comme ci-dessus, `node` sur scripts de `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T028/`, `rg`, `ls`, `wc`, `gzip`, `git diff`)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d'autres agents écrivent en même temps.
- Machine partagée : ne tuer que les processus que tu as lancés (par pid) ; ne supprimer que ce que la tâche a créé.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T028
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
