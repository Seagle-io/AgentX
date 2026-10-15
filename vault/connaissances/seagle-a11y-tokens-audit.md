---
titre: seagle-website — a11y : tokens texte vs encres ASCII, audit.mjs
resume: --th-text-md/faint = encres ASCII (ne pas relever) ; texte = tokens découplés ; audit rejouable
source: seagle-site T003 T012 T013 T020 T026
cree: 2026-10-14
tags: [note, seagle, a11y, contraste, ascii]
---

# seagle-website : tokens texte vs encres ASCII

## Fait
- `readInk` (`src/components/kit/ascii-core.ts:62-69`) lit `--th-text-md` et `--th-text-faint` comme encres md/lo de tous les visuels ASCII → relever ces tokens CHANGE les visuels intouchables
- décision : découplage — utilitaires texte lisent `--th-copy-md` / `--th-copy-faint` (≥ 4.5) ; `--th-text-md/faint` inchangés pour l'ASCII ; surcharge `.force-dark`
- preuve : `INK=… node ascii-sensib.mjs` → hash `/` change si `--th-text-md/faint` modifiés, inchangé si `--th-copy-md` / `--th-text-lo` ; `node ascii-dom.mjs` (17 pages) → ∅ art ASCII DOM en text-md/faint
- `.force-dark` lo/copy-faint .40 → 3.77 sur #0a0a0a (sous seuil, T020)
- résiduel < 4.5 en clair : Home « export » #2ca9bc, « −6 h 40 / week », SecurePass/visuals.tsx/global-seo-shots accents 10-12px ; accents ServiceDetail sur `surface-hi` #e9e7e1 → 4.17-4.21
- reduced-motion : règle CSS globale coupe toute classe `animate-*` (y compris one-shot, voulu) ; `no-preference` → 56 animations infinies sur 109 pages (marquee, pulse, spin, bounce)
- clavier : mega-menu bouton `aria-expanded` + Entrée/Échap ; Échap global même souris dessus (focus body) ; tiroir `#mobile-drawer` `inert` fermé (React 18.3 : `{ inert: "" } as object`) ; skip link `id="main"` ; tiroir mobile 390×844 scroll 454 → `overflow auto`
- bouton langue : nom « Langue : Français » ≠ visible « FR » (WCAG 2.5.3) ; aria-label « Toggle theme/menu » en anglais
- Booking : `autoFocus` Nom ouvre le clavier mobile au choix d'un créneau
- audit : `BASE=http://localhost:<port> node <T>/audit.mjs struct|contrast|motion|kbd|forms|extra` ; contraste = ratio WCAG 2.x, fond composé par ancêtres, ignore image/canvas ; faux positif connu `trap` (CTA adjacents identiques)
- sonde `extra` tiroir : `#mobile-drawer` (≠ `.max-h-96`, classe retirée)

## Pourquoi ça compte
- un « correctif contraste » naïf modifie les visuels ASCII déclarés intouchables

## Où
- `src/style.css` — tokens `--th-*`, `--th-copy-*`, règle reduced-motion
- `vault/artefacts/seagle-site/T003/audit.mjs` (copies T012, T026) — banc

## Voir aussi
- [[seagle-e2e-check-dist]]
