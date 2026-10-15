---
pack: T012
projet: seagle-site
role: implementeur
cree: 2026-10-14
---

# Pack T012 — Accessibilité clavier du menu, du tiroir et du sélecteur

> Seule source de vérité de l'agent T012. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre le menu (sous-menus), le tiroir mobile et le sélecteur de langue utilisables au clavier, et ajouter un lien d'évitement → défauts G1/G2 « clavier » de l'audit T003 à 0 au script `audit.mjs kbd`.

## Definition of Done
- [ ] `mega-menu.tsx:77-110` : déclencheur = `<button aria-expanded aria-haspopup="true" aria-controls>` ; Entrée/Espace ouvre, Échap ferme et rend le focus au déclencheur, sortie du focus (Tab hors panneau) ferme ; survol souris inchangé
- [ ] `header.tsx:230-262` : burger `aria-expanded` + `aria-controls` ; tiroir fermé = `inert` (ou `hidden`) → 0 lien focusable ; Échap ferme et rend le focus au burger
- [ ] `ToogleLanguage.tsx:50-55` : Échap ferme (`aria-expanded=false`) et rend le focus ; nom accessible du bouton = « Langue : Français » (texte via clé existante ou nouvelle clé `navbar.language`)
- [ ] `layout.tsx:31` : `<main id="main">` ; lien d'évitement premier élément focusable, invisible hors focus, visible au focus (style kit : carré, `label-mono`, fond `bg-page`, bordure `border-rim`), texte `t("navbar.skipToContent")`
- [ ] `Navbar.ts` ×5 : `skipToContent` (+ `language` si créée) traduits fr/en/de/es/it
- [ ] `node ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T003/audit.mjs kbd` sur ton preview (`BASE` si le script le lit, sinon copie adaptée dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T012/`) : sous-menus Entrée → liens visibles ; tiroir fermé → 0 focusable ; Échap OK — sortie avant/après collée
- [ ] desktop 1440 + mobile 390 : captures menu ouvert au clavier dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T012/` ; rendu souris identique à avant (capture survol)
- [ ] `npx tsc --noEmit -p .` → 0 erreur
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/src/components/ui/mega-menu.tsx` | E | L77-110 sous-menus hover seul |
| `~/Documents/Workspace/seagle-website/src/components/Header/header.tsx` | E | burger L230-235, tiroir L242-262 |
| `~/Documents/Workspace/seagle-website/src/components/ToogleLanguage.tsx` | E | L50-55 |
| `~/Documents/Workspace/seagle-website/src/components/Header/layout.tsx` | E | `<main>` L31 |
| `~/Documents/Workspace/seagle-website/src/lib/local/fr/Navbar.ts` | E | + clés (en, de, es, it : même chemin, même droit E) |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T003-audit-accessibilite-au-navigateur/result.md` | L | audit complet, coordonnées |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T003/audit.mjs` | L | re-mesure (`kbd`) |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T012/` | E | build, captures, copie du script si besoin |

## Contrats
Défauts T003 visés (verbatim) :
```
[G1] sous-menus Services/Solutions/Outils/Entreprise hover seul ; Entrée/Espace → 0 lien visible (souris → 8) — mega-menu.tsx:77-78,98-110
[G1] mobile — tiroir fermé : 7 liens restent focusables (max-h-0 + overflow-hidden) — header.tsx:242-262
[G2] ∅ lien d'évitement (15/15) ; <main> sans id — layout.tsx:31
[G2] burger : ∅ aria-expanded/aria-controls ; Échap ne ferme pas — header.tsx:230-235
[G2] sélecteur langue : Échap ne ferme pas ; bouton nommé "FR" seul — ToogleLanguage.tsx:50-55
```
Déjà OK, ne pas casser : 42 arrêts Tab sur `/` sans piège ; bouton thème `aria-label="Toggle theme"` (header.tsx:210-228) ; `lang` de `<html>` suit la langue.

## Décisions actées
- `inert` (attribut HTML natif, React 18 : `inert=""`/`{...(open ? {} : { inert: "" })}`) — 0 dépendance
- rendu visuel souris inchangé ; seul ajout visible : le lien d'évitement au focus
- visuels ASCII intouchables (`src/components/ui/ascii-*`, `*.data.ts`, `src/components/kit/Ascii*`) — décision humain 2026-10-14
- design intouchable : kit `src/components/kit/`, ∅ néon/halo/grille/blur décoratif ; Mona Sans + JetBrains Mono
- nouvelle clé i18n → 5 langues (`src/lib/local/{fr,en,de,es,it}/`) ; textes existants non réécrits

## Hors périmètre
- contrastes, formulaires, animations (T013)
- `footer.tsx`, `App.tsx`, `routes.ts` (autre agent) ; `main.tsx`, `i18n.ts` (autre agent)
- liens de menu (contenu), URLs

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` : React 18.3, Vite 7.3.6, react-router 7, i18next 25 + react-i18next 16, Tailwind 4, motion 12 ; TS strict, `npx tsc --noEmit -p .` → 0 erreur sur HEAD
- arbre partagé : 6 autres agents écrivent en même temps dans d'autres fichiers ; leurs diffs peuvent apparaître dans ton build — ne pas les corriger, les signaler
- **jamais `npm run build`** : il écrit `dist/` (servi sur :4173 par un preview partagé) et `prerender.mjs` exige le port 4173 libre
- ton build : `npx vite build --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T012/dist --emptyOutDir` (le plugin sitemap écrit aussi `dist/sitemap.xml` : sans effet, laisser)
- ton preview : `npx vite preview --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T012/dist --port 4407 --strictPort` en arrière-plan ; l'arrêter à la fin (kill du pid lancé, par pid)
- Playwright 1.62 lib : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; WebGL : `args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]` ; scripts dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T012/`
- thème/langue : `addInitScript` → `localStorage.setItem("seagle-theme","dark")`, `localStorage.setItem("i18nextLng","fr")`
- prérendu (`prerender.mjs`) non exécutable par toi → vérif HTML prérendu = `NV — prérendu réservé au chef`
- DoD périmètre : `git -C ~/Documents/Workspace/seagle-website diff --stat -- <chemins E>`, jamais diff global ; aucun commit (l'humain commite)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (fichiers E uniquement), Grep, Glob, Bash (`npx tsc`, `npx vite build/preview` comme ci-dessus, `node` sur scripts de `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T012/`, `rg`, `ls`, `wc`, `gzip`, `git diff`)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d'autres agents écrivent en même temps.
- Machine partagée : ne tuer que les processus que tu as lancés (par pid) ; ne supprimer que ce que la tâche a créé.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T012
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
