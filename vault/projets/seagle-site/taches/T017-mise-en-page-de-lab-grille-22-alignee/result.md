---
tache: T017
statut: fait
---
## Livré
- src/components/ui/ascii-gallery-nav.tsx:L33-34 — commentaire : sans current, h1 remplace titre
- src/components/ui/ascii-gallery-nav.tsx:L35 — conteneur `max-w-6xl` si !current, sinon `max-w-5xl`
- src/components/ui/ascii-gallery-nav.tsx:L36-52 — label + h2 rendus seulement si current (fragment, 0 nœud DOM)
- src/components/ui/ascii-gallery-nav.tsx:L54 — !current : `grid gap-4 sm:grid-cols-2`, sans mt-8
- src/pages/Lab/index.tsx — ∅ modif (hero `pb-16` gardé → écart 64 px)

## Vérifié comment
`npx tsc --noEmit -p .` → exit 0, 0 sortie
`npx vite build --outDir …/T017/dist --emptyOutDir` → `✓ built in 8.03s`
avant = build de l'arbre pré-édition dans `…/T017/dist-avant` (supprimé ensuite), preview :4418 ; après = :4417
`node …/T017/verif.mjs` →
```
joconde nav: 1440x417 pixels différents=0 | outerHTML identique: true
lab 1440 light: {"h2":0,"span":0,"maxw":"max-w-6xl mx-auto","cartes":4,"lignes":2,"h1Left":144,"carteLeft":144,"ecart":64}
lab 1440 dark: {"h2":0,"span":0,"maxw":"max-w-6xl mx-auto","cartes":4,"lignes":2,"h1Left":144,"carteLeft":144,"ecart":64}
lab 390 light: {"h2":0,"span":0,"maxw":"max-w-6xl mx-auto","cartes":4,"lignes":4,"h1Left":24,"carteLeft":24,"ecart":64}
lab 390 dark: {"h2":0,"span":0,"maxw":"max-w-6xl mx-auto","cartes":4,"lignes":4,"h1Left":24,"carteLeft":24,"ecart":64}
```
captures : `…/T017/lab-{light,dark}-{1440,390}.png`, `…/T017/joconde-nav-{avant,apres}.png` (pleine page /lab après défilement, 4 cartes visibles)
previews 4417/4418 tués par pid (2843576, 2843339)
prérendu → NV — prérendu réservé au chef
`git diff --stat -- <E>` → ascii-gallery-nav.tsx 36 ±, Lab/index.tsx 296 ± (diff Lab préexistant, ≠ moi)

## Écarts
- ∅ lecture hors WL
- Lab/index.tsx déjà modifié dans l'arbre avant T017 (296 lignes de diff) — pas touché

## Pour la suite
- AsciiGalleryNav sans current = grille 2×2 `max-w-6xl`, 0 titre ; avec current inchangé (0 px diff /la-joconde)
- clé `AsciiGallery.title` désormais utilisée seulement sur les 4 pages tableaux
- écart intro→cartes /lab = 64 px (hero `pb-16`, grille sans mt)
- NV : prérendu /lab

## Retour sur le pack
- Manquait: ∅ | Inutile: nouvelle clé i18n (aucune requise)
