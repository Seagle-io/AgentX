---
pack: T002
projet: seagle-site
role: eclaireur
cree: 2026-10-14
---

# Pack T002 — Carte i18n, prérendu, hreflang, JSON-LD et Lab

> Seule source de vérité de l'agent T002. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Cartographier comment la langue est choisie, routée, prérendue et annoncée (hreflang, sitemap), l'état du JSON-LD par page et de la page Lab désactivée → carte collable dans le contrat « URLs /de /es /it » et les packs JSON-LD et /lab.

## Definition of Done
- [ ] choix de langue : chaîne complète `chemin:Lx` (localStorage `i18nextLng`, navigator, URL ?) dans `i18n.ts`, `useLanguageRedirect.ts`, `ToogleLanguage.tsx`
- [ ] `routes.ts` : `getLocalizedPath` recopié verbatim ; nb d'appelants (`rg -c getLocalizedPath src`)
- [ ] liens internes codés en dur (`rg 'to="/' src`, `href="/'`) : nb + 5 exemples `chemin:Lx`
- [ ] `prerender.mjs` : liste des routes prérendues, comment la langue est forcée par route, sortie (`dist/<route>/index.html`) — lignes + extrait verbatim de la boucle principale
- [ ] `useHreflang.ts` recopié verbatim (44 l.) ; sitemap `vite.config.js` : où ajouter des langues (lignes)
- [ ] hébergement : y a-t-il des règles de réécriture (`public/_redirects`, `404.html`, `.htaccess`) ? rg/ls
- [ ] JSON-LD : tableau page → types schema.org présents (`rg -n '@type' src/pages index.html`) ; `useJsonLd.ts` verbatim (18 l.)
- [ ] manques JSON-LD : Career (JobPosting ?), Organization/WebSite (index.html ?), services (`ServiceDetail`), Home, About, Contact — présent/∅ par page
- [ ] Lab : pourquoi désactivé (commentaires `App.tsx`, `routes.ts:23`, sitemap) ; `src/pages/Lab/index.tsx` contenu (articles ? tableaux ?) ; `src/content/lab/` liste ; liens vers les 4 tableaux existants ou ∅ ; composant `ascii-gallery-nav` (rg) et où il est utilisé
- [ ] menu + pied de page : fichier et lignes où ajouter un lien Lab
- [ ] `result.md` rempli selon « Format de sortie », ≤ 150 lignes

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/src/lib/routes.ts` | L | 37 l., routes fr/en |
| `~/Documents/Workspace/seagle-website/src/App.tsx` | L | routeur, Lab commenté L46-97 |
| `~/Documents/Workspace/seagle-website/src/lib/i18n.ts` | L | init langue |
| `~/Documents/Workspace/seagle-website/src/hooks/` | L | useHreflang, useLanguageRedirect, useJsonLd, usePageMeta |
| `~/Documents/Workspace/seagle-website/src/components/ToogleLanguage.tsx` | L | sélecteur de langue |
| `~/Documents/Workspace/seagle-website/src/components/Header/` | L | menu, pied de page ? |
| `~/Documents/Workspace/seagle-website/prerender.mjs` | L | 145 l. |
| `~/Documents/Workspace/seagle-website/vite.config.js` | L | sitemap fr/en |
| `~/Documents/Workspace/seagle-website/index.html` | L | 94 l., JSON-LD global ? |
| `~/Documents/Workspace/seagle-website/src/pages/` | L | rg JSON-LD ; Read Career, Lab, LabArticle |
| `~/Documents/Workspace/seagle-website/src/content/lab/` | L | articles |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T002/` | E | notes si besoin |

## Contrats
∅ — tu les produis.

## Décisions actées
- de/es/it reçoivent une URL propre, prérendue, hreflang — décision humain 2026-10-14
- URLs fr/en existantes inchangées — déjà indexées
- /lab activé, regroupe les 4 tableaux ASCII — décision humain 2026-10-14
- `usePageMeta(title, description?, image?)` fait, hors sujet

## Hors périmètre
- proposer le schéma d'URL (architecte, V2)
- vitesse, bundle, vidéos (T001) ; a11y (T003)
- toute écriture hors `result.md` et `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T002/`

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` (React 18, Vite 7, react-router 7, i18next 25, Tailwind 4) ; branche `feat/ascii-nuit-etoilee`
- `dist/` = build courant (`VITE_CHAT_API_URL=http://localhost:3001 npm run build`), servi par `vite preview` sur http://localhost:4173 — déjà lancé, ne pas l'arrêter
- Playwright 1.62 lib (pas `@playwright/test`) : dans un script de l'artefact, `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; canvas WebGL : `chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] })`
- thème : `localStorage.setItem("seagle-theme","dark"|"light")` ; langue : `localStorage.setItem("i18nextLng","fr")` via `addInitScript`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash lecture seule (`rg`, `ls`, `wc`, `du`, `gzip -c | wc -c`, `git diff --stat`, `node <script dans l'artefact>`)
- Écriture : uniquement `result.md` et le dossier artefact `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T002/`.
- Arbre partagé, très modifié, non commité : jamais `git stash`, `checkout --`, `reset`, `clean`, jamais `npm run build` (écrase `dist/` servi par le preview).
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T002
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
