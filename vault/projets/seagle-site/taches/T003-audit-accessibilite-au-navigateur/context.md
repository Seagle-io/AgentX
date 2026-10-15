---
pack: T003
projet: seagle-site
role: eclaireur
cree: 2026-10-14
---

# Pack T003 — Audit accessibilité au navigateur

> Seule source de vérité de l'agent T003. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Auditer au navigateur (Playwright, http://localhost:4173) clavier, focus, contrastes et « réduire les animations » sur les 15 pages → liste de défauts `page — défaut — chemin:Lx`, triée par gravité, séparant ASCII (`src/components/ui/ascii-*`, `src/components/kit/Ascii*`) du reste.

## Definition of Done
- [ ] clavier : Tab depuis le haut de `/` jusqu'au pied de page ; menu, sous-menus, sélecteur de langue, bascule de thème, chat atteignables et activables (Entrée/Espace/Échap) — OK/KO par contrôle + `chemin:Lx` du composant
- [ ] focus visible : contrôles sans contour au focus (`outline` calculé = none et ∅ `box-shadow`) — liste
- [ ] lien d'évitement (« aller au contenu ») présent ? ; `<main>`, `<nav>`, `lang` de `<html>` suivant la langue — OK/KO
- [ ] contrastes : thèmes clair ET sombre, textes gris (`text-neutral-*`, `text-muted*`, couleurs calculées) sur les 15 pages ; ratio WCAG calculé dans le script (couleur texte vs fond effectif) ; liste des < 4.5:1 (< 3:1 si ≥ 24px) : page, sélecteur, couleurs, ratio, classe source
- [ ] reduced-motion : contexte `reducedMotion: "reduce"` ; chaque animation qui continue (canvas qui change entre 2 captures à 1 s, `animation-name` CSS actif, vidéo qui joue) — page + composant ; distinguer ASCII / non-ASCII
- [ ] images sans `alt`, boutons/liens sans nom accessible (`aria-label`, texte) — liste
- [ ] formulaires `/contact`, `/rendez-vous` : chaque champ a un label associé ; erreurs annoncées (`aria-live`/`role=alert`) — OK/KO
- [ ] script d'audit déposé dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T003/`, relançable : `node ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T003/audit.mjs`
- [ ] `result.md` rempli selon « Format de sortie », ≤ 150 lignes

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/crawl-15-pages.mjs` | L | liste des 15 pages + crawl de base |
| `~/Documents/Workspace/seagle-website/src/components/Header/` | L | header.tsx, footer.tsx, layout.tsx |
| `~/Documents/Workspace/seagle-website/src/components/ToogleLanguage.tsx` | L | sélecteur langue |
| `~/Documents/Workspace/seagle-website/src/components/ChatBot/` | L | chat |
| `~/Documents/Workspace/seagle-website/src/contexts/` | L | ThemeContext |
| `~/Documents/Workspace/seagle-website/src/style.css` | L | couleurs, focus, reduced-motion global ? |
| `~/Documents/Workspace/seagle-website/src/components/kit/` | L | rg reduced-motion seulement |
| `~/Documents/Workspace/seagle-website/src/components/ui/` | L | rg seulement, pour coordonnées |
| `~/Documents/Workspace/seagle-website/src/pages/Contact/index.tsx` | L | formulaire |
| `~/Documents/Workspace/seagle-website/src/pages/Booking/index.tsx` | L | formulaire |
| `~/Documents/Workspace/seagle-website/index.html` | L | `lang`, skip link |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T003/` | E | script d'audit + captures |

## Contrats
∅ — tu les produis. Format de chaque défaut :
```
- [G1|G2|G3] <page> — <défaut ≤ 10 mots> — <chemin:Lx> — ASCII|non-ASCII
```
G1 bloque un usage (clavier piégé, champ sans label) · G2 WCAG AA KO · G3 confort.

## Décisions actées
- visuels ASCII intouchables : les relever (marque ASCII), ne rien proposer d'autre — décision humain 2026-10-14
- cible WCAG 2.2 AA
- pas d'axe-core (installation interdite) : calculs maison dans le script

## Hors périmètre
- corriger quoi que ce soit (implémenteur, V2)
- lecteurs d'écran réels, mobile tactile
- toute écriture hors `result.md` et `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T003/`

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` (React 18, Vite 7, react-router 7, i18next 25, Tailwind 4) ; branche `feat/ascii-nuit-etoilee`
- `dist/` = build courant (`VITE_CHAT_API_URL=http://localhost:3001 npm run build`), servi par `vite preview` sur http://localhost:4173 — déjà lancé, ne pas l'arrêter
- Playwright 1.62 lib (pas `@playwright/test`) : dans un script de l'artefact, `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; canvas WebGL : `chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] })`
- thème : `localStorage.setItem("seagle-theme","dark"|"light")` ; langue : `localStorage.setItem("i18nextLng","fr")` via `addInitScript`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash lecture seule (`rg`, `ls`, `wc`, `du`, `gzip -c | wc -c`, `git diff --stat`, `node <script dans l'artefact>`)
- Écriture : uniquement `result.md` et le dossier artefact `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T003/`.
- Arbre partagé, très modifié, non commité : jamais `git stash`, `checkout --`, `reset`, `clean`, jamais `npm run build` (écrase `dist/` servi par le preview).
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T003
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
