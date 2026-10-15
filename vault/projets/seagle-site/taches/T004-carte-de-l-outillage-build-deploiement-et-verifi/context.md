---
pack: T004
projet: seagle-site
role: eclaireur
cree: 2026-10-14
---

# Pack T004 — Carte de l'outillage build, déploiement et vérification

> Seule source de vérité de l'agent T004. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Cartographier la chaîne build → prérendu → déploiement (CI `.github/workflows/deploy.yml` et scripts locaux), l'usage de `VITE_CHAT_API_URL`, et le point d'injection d'un script d'audience → carte collable dans les packs « garde-fou build », « audience inactive » et « suite e2e ».

## Definition of Done
- [ ] `deploy.yml` : déclencheur, étapes, commande de build, variables passées (`VITE_*`), cible (GitHub Pages ? autre) — lignes ; recopier le bloc build verbatim
- [ ] `Makefile` + `scripts/deploy-static.sh` (fichiers perso, non versionnés) : cibles/étapes qui buildent et envoient `dist/` — lignes ; qui est le vrai chemin de mise en ligne (CI ou script perso) ?
- [ ] `VITE_CHAT_API_URL` : 4 usages `chemin:Lx` + valeur par défaut si non posée (verbatim) ; `src/lib/site.ts` recopié si < 30 l.
- [ ] comment détecter un build « localhost » après coup : chaîne repérable dans `dist/assets/*.js` (`rg -l 'localhost:3001' dist` → résultat brut)
- [ ] `prerender.mjs` : serveur utilisé, port, Playwright ou autre, ce qui fait échouer le build (exit code) — lignes
- [ ] `index.html` : `<head>` — où insérer un `<script>` conditionnel ; Vite `%VITE_X%` utilisable ? (`vite.config.js`, version Vite `package.json`)
- [ ] CSP/headers éventuels (`index.html` meta, `public/_headers`) qui bloqueraient un script tiers — ∅ ou lignes
- [ ] e2e : outils présents (`playwright` version, `@playwright/test` ∅ ?, `node_modules/.bin/playwright`), navigateurs installés (`ls ~/.cache/ms-playwright`), scripts npm existants ; `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/crawl-15-pages.mjs` résumé en 2 lignes
- [ ] `server/` : comment il se lance (`server/package.json` scripts, port, variables requises) — 5 lignes max, pour l'e2e RDV
- [ ] `result.md` rempli selon « Format de sortie », ≤ 150 lignes

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/.github/workflows/deploy.yml` | L | CI |
| `~/Documents/Workspace/seagle-website/Makefile` | L | perso, non versionné |
| `~/Documents/Workspace/seagle-website/scripts/deploy-static.sh` | L | perso, non versionné |
| `~/Documents/Workspace/seagle-website/docs/deploiement.md` | L | perso, procédure |
| `~/Documents/Workspace/seagle-website/package.json` | L | scripts, versions |
| `~/Documents/Workspace/seagle-website/prerender.mjs` | L | 145 l. |
| `~/Documents/Workspace/seagle-website/vite.config.js` | L | plugins |
| `~/Documents/Workspace/seagle-website/index.html` | L | 94 l., head |
| `~/Documents/Workspace/seagle-website/src/lib/site.ts` | L | URL du site |
| `~/Documents/Workspace/seagle-website/server/package.json` | L | lancement API |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/crawl-15-pages.mjs` | L | crawl existant |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T004/` | E | notes si besoin |

## Contrats
∅ — tu les produis.

## Décisions actées
- garde-fou : un build qui pointe vers localhost ne doit jamais partir en ligne — décision humain 2026-10-14
- audience : script chargé seulement si variable de build posée, inactif par défaut ; fournisseur non choisi (Plausible/Umami)
- e2e : Playwright déjà installé, pas de nouvelle dépendance sans accord
- `Makefile`, `scripts/deploy-static.sh`, `docs/deploiement.md` ne seront jamais commités : les lire, ne rien y proposer de versionné

## Hors périmètre
- écrire le garde-fou, l'e2e ou le script d'audience (V2)
- lancer un build, un déploiement, `make`
- toute écriture hors `result.md` et `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T004/`

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` (React 18, Vite 7, react-router 7, i18next 25, Tailwind 4) ; branche `feat/ascii-nuit-etoilee`
- `dist/` = build courant (`VITE_CHAT_API_URL=http://localhost:3001 npm run build`), servi par `vite preview` sur http://localhost:4173 — déjà lancé, ne pas l'arrêter
- Playwright 1.62 lib (pas `@playwright/test`) : dans un script de l'artefact, `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; canvas WebGL : `chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] })`
- thème : `localStorage.setItem("seagle-theme","dark"|"light")` ; langue : `localStorage.setItem("i18nextLng","fr")` via `addInitScript`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash lecture seule (`rg`, `ls`, `wc`, `du`, `gzip -c | wc -c`, `git diff --stat`, `node <script dans l'artefact>`)
- Écriture : uniquement `result.md` et le dossier artefact `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T004/`.
- Arbre partagé, très modifié, non commité : jamais `git stash`, `checkout --`, `reset`, `clean`, jamais `npm run build` (écrase `dist/` servi par le preview).
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T004
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots) ; contrats en bloc de code verbatim
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
