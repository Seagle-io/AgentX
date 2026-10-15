---
pack: T001
projet: seagle-site
role: eclaireur
cree: 2026-10-14
---

# Pack T001 — Carte du bundle d'entrée et des vidéos AgentX

> Seule source de vérité de l'agent T001. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Mesurer ce qui compose le chunk JS d'entrée (`dist/assets/index-BZy5-XuT.js`, 904 Ko) et ce que télécharge la page /agentx au chargement → liste de leviers chiffrés (Ko brut + gzip) collable dans les packs d'implémentation.

## Definition of Done
- [ ] chunk d'entrée identifié depuis `dist/index.html` (`<script type=module>` + `modulepreload`), taille brute + gzip
- [ ] composition du chunk d'entrée : top 10 contributeurs estimés (traductions 5 langues, i18next, react-dom, router, motion, lenis, lucide, kit, ChatBot, Header…) avec Ko, méthode d'estimation dite
- [ ] imports statiques qui tirent ces contributeurs : `chemin:Lx — import` (main.tsx, App.tsx, i18n.ts, layout Header, ChatBot, contexts)
- [ ] traductions : taille cumulée par langue (`du -b src/lib/local/<l>`) et part dans le chunk ; `src/lib/local/fr/index.ts` recopié si < 40 l.
- [ ] composants lourds chargés sur toutes les pages (Header/layout, ChatBot, fond animé) : coordonnées + Ko
- [ ] /agentx : octets vidéo (webm/mp4) téléchargés au chargement sans défiler, mesurés navigateur (Playwright, écoute `response`), viewport 1440×900 et 390×844
- [ ] `src/pages/AgentX/index.tsx` : chaque `<RoomVideo>` `Lx` + position (hero / onglets) ; props `autoPlay`/`preload` relevées
- [ ] prérendu : le HTML `dist/index.html` charge-t-il des `modulepreload` inutiles ? liste
- [ ] `result.md` rempli selon « Format de sortie », ≤ 150 lignes

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/dist/index.html` | L | point d'entrée, preloads |
| `~/Documents/Workspace/seagle-website/dist/assets/` | L | `ls -S`, `du`, `rg` sur chunks (jamais Read intégral d'un .js > 50 Ko) |
| `~/Documents/Workspace/seagle-website/src/main.tsx` | L | 24 l., imports globaux |
| `~/Documents/Workspace/seagle-website/src/App.tsx` | L | 116 l., pages lazy |
| `~/Documents/Workspace/seagle-website/src/lib/i18n.ts` | L | 44 l., 5 langues statiques |
| `~/Documents/Workspace/seagle-website/src/lib/local/` | L | `du`, index.ts par langue |
| `~/Documents/Workspace/seagle-website/src/components/Header/` | L | layout chargé partout |
| `~/Documents/Workspace/seagle-website/src/components/ChatBot/` | L | chargé partout ? |
| `~/Documents/Workspace/seagle-website/src/pages/AgentX/index.tsx` | L | L34-58 RoomVideo |
| `~/Documents/Workspace/seagle-website/vite.config.js` | L | manualChunks three |
| `~/Documents/Workspace/seagle-website/package.json` | L | deps |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T001/` | E | scripts de mesure |

## Contrats
∅ — tu les produis.

## Décisions actées
- visuels ASCII intouchables — décision humain 2026-10-14
- pages déjà en `lazy()` (`App.tsx:15-45`) — ne pas re-mesurer leur découpage
- `three` déjà en chunk séparé (`vite.config.js` manualChunks)

## Hors périmètre
- proposer une architecture de découpage (chef, V2)
- toute écriture hors `result.md` et `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T001/`
- lancer un build (`dist/` partagé)

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` (React 18, Vite 7, react-router 7, i18next 25, Tailwind 4) ; branche `feat/ascii-nuit-etoilee`
- `dist/` = build courant (`VITE_CHAT_API_URL=http://localhost:3001 npm run build`), servi par `vite preview` sur http://localhost:4173 — déjà lancé, ne pas l'arrêter
- Playwright 1.62 lib (pas `@playwright/test`) : dans un script de l'artefact, `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; canvas WebGL : `chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] })`
- thème : `localStorage.setItem("seagle-theme","dark"|"light")` ; langue : `localStorage.setItem("i18nextLng","fr")` via `addInitScript`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash lecture seule (`rg`, `ls`, `wc`, `du`, `gzip -c | wc -c`, `git diff --stat`, `node <script dans l'artefact>`)
- Écriture : uniquement `result.md` et le dossier artefact `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T001/`.
- Arbre partagé, très modifié, non commité : jamais `git stash`, `checkout --`, `reset`, `clean`, jamais `npm run build` (écrase `dist/` servi par le preview).
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T001
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
