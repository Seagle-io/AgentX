---
pack: T026
projet: seagle-site
role: implementeur
cree: 2026-10-14
---

# Pack T026 — Corriger : animation spin, Échap au survol, focus RDV, tiroir rogné

> Seule source de vérité de l'agent T026. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger T020 D2, D5, D6 et le tiroir mobile rogné : toute animation CSS infinie coupée sous reduced-motion, Échap ferme un sous-menu ouvert au survol, focus conservé après choix d'un créneau, tiroir mobile entièrement atteignable.

## Definition of Done
- [ ] D2 : `style.css` reduced-motion couvre toute classe d'animation Tailwind infinie (dont `animate-[spin_3s_linear_infinite]`) ; 109 pages (sitemap) en reduced-motion → 0 animation CSS `infinite` en cours ; sans préférence : marquee et spin tournent ; canvas ASCII non concernés (JS)
- [ ] D5 : sous-menu ouvert au survol, focus ailleurs → Échap le ferme (écouteur `keydown` document actif seulement quand ouvert)
- [ ] D6 : /rendez-vous, Entrée sur un créneau → focus sur le 1er champ du formulaire (ou titre de l'étape, `tabIndex=-1`) ; « Changer de créneau » → focus sur la grille ; `document.activeElement` ≠ BODY dans les 2 cas
- [ ] tiroir mobile 390×844 ouvert : `scrollHeight ≤ clientHeight` ou défilable ; ligne langue + CTA visibles et cliquables (`header.tsx` `max-h-96` L256)
- [ ] non-régression clavier : `node ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T012/audit.mjs kbd` + `extra` (BASE ton preview) identiques à après-T012 ; visuels ASCII inchangés
- [ ] `npx tsc --noEmit -p .` → 0 erreur
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/src/style.css` | E | reduced-motion L103-114 |
| `~/Documents/Workspace/seagle-website/src/components/ui/mega-menu.tsx` | E | Échap L79-87 |
| `~/Documents/Workspace/seagle-website/src/pages/Booking/index.tsx` | E | créneaux ~L369, formulaire ~L330 |
| `~/Documents/Workspace/seagle-website/src/components/Header/header.tsx` | E | tiroir L250-280 |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T020-casser-garde-fou-e2e-et-accessibilite/result.md` | L | défauts + repro |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T012/audit.mjs` | L | non-régression clavier |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T020/` | L | scripts de repro |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T026/` | E | build, captures |

## Contrats
Défauts T020 (verbatim) :
```
D2 G2 — animate-[spin_3s_linear_infinite] tourne en reduced-motion sur /services/security-audit (fr,de,es,it) — style.css:L112-114 ne couvre que marquee/pulse/bounce
D5 G3 — mega-menu ouvert au survol, focus hors li → Échap ne ferme pas (WCAG 1.4.13)
D6 G3 — /rendez-vous Entrée sur créneau → focus BODY (bouton démonté) ; idem « Changer de créneau »
tiroir 390×844 : langue + CTA sous le bas (scrollHeight 454 / clientHeight 383) — préexistant
```

## Décisions actées
- encres ASCII (`--th-text-md/faint`) et canvas : intouchés
- ajouts a11y T012 (aria-*, inert, Échap) conservés
- visuels ASCII intouchables (`src/components/ui/ascii-*`, `*.data.ts`, `src/components/kit/Ascii*`) — décision humain 2026-10-14
- design intouchable : kit `src/components/kit/`, ∅ néon/halo/grille/blur décoratif ; Mona Sans + JetBrains Mono
- nouvelle clé i18n → 5 langues (`src/lib/local/{fr,en,de,es,it}/`) ; textes existants non réécrits

## Hors périmètre
- contrastes, tokens ; routes, liens ; textes

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` : React 18.3, Vite 7.3.6, react-router 7, i18next 25 + react-i18next 16, Tailwind 4, motion 12 ; TS strict, `npx tsc --noEmit -p .` → 0 erreur sur HEAD
- arbre partagé : 6 autres agents écrivent en même temps dans d'autres fichiers ; leurs diffs peuvent apparaître dans ton build — ne pas les corriger, les signaler
- **jamais `npm run build`** : il écrit `dist/` (servi sur :4173 par un preview partagé) et `prerender.mjs` exige le port 4173 libre
- ton build : `npx vite build --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T026/dist --emptyOutDir` (le plugin sitemap écrit aussi `dist/sitemap.xml` : sans effet, laisser)
- ton preview : `npx vite preview --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T026/dist --port 4426 --strictPort` en arrière-plan ; l'arrêter à la fin (kill du pid lancé, par pid)
- Playwright 1.62 lib : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; WebGL : `args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]` ; scripts dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T026/`
- thème/langue : `addInitScript` → `localStorage.setItem("seagle-theme","dark")`, `localStorage.setItem("i18nextLng","fr")`
- prérendu (`prerender.mjs`) non exécutable par toi → vérif HTML prérendu = `NV — prérendu réservé au chef`
- DoD périmètre : `git -C ~/Documents/Workspace/seagle-website diff --stat -- <chemins E>`, jamais diff global ; aucun commit (l'humain commite)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (fichiers E uniquement), Grep, Glob, Bash (`npx tsc`, `npx vite build/preview` comme ci-dessus, `node` sur scripts de `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T026/`, `rg`, `ls`, `wc`, `gzip`, `git diff`)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d'autres agents écrivent en même temps.
- Machine partagée : ne tuer que les processus que tu as lancés (par pid) ; ne supprimer que ce que la tâche a créé.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T026
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
