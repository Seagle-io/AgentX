---
pack: T013
projet: seagle-site
role: implementeur
cree: 2026-10-14
---

# Pack T013 — Accessibilité des formulaires, contrastes et animations

> Seule source de vérité de l'agent T013. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger les défauts G1/G2 « formulaires, contrastes, animations » de l'audit T003 : libellés et annonces d'erreur sur /rendez-vous et /contact, contour de focus des champs, tokens de texte gris à ≥ 4.5:1, animations infinies coupées sous reduced-motion.

## Definition of Done
- [ ] `Booking/index.tsx:329-331` : chaque champ a un `<label>` (ou `aria-label`) = texte du placeholder actuel ; boutons jour (L66-69) `aria-label` = date longue (`Intl.DateTimeFormat(i18n.language,{weekday:"long",day:"numeric",month:"long"})`) + `aria-pressed` ; boutons créneau idem (heure) + `aria-pressed`
- [ ] erreurs : `role="alert"` sur `Booking:335,343` et `Contact:215-220`
- [ ] focus des champs (`Contact:129`, `Booking:224`, `SecurePass:103` `#sp-demo`) : contour visible au `focus-visible` (outline 1px `--th-text-hi` décalé 2px, carré) ; aspect hors focus inchangé
- [ ] `style.css` tokens : `--th-text-lo` et `--th-text-faint` (sombre L17-18, clair L52-53) et `--th-text-md` (clair L51) relevés au minimum nécessaire pour ≥ 4.5:1 sur `--th-bg` du thème (ratio calculé, avant/après dans Livré) ; teinte (gris neutre) conservée
- [ ] `style.css` : `@media (prefers-reduced-motion: reduce)` coupe `animate-pulse`, `animate-bounce` et la marquee (`style.css:100-101`, `marquee.tsx:28`) ; 0 changement hors reduced-motion
- [ ] `ServiceDetail` : `label-mono` coloré inline en thème clair ≥ 4.5:1 (couleur d'accent assombrie en clair seulement, même teinte) ; sombre inchangé
- [ ] `node ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T003/audit.mjs contrast`, `forms`, `motion` sur ton preview : 0 défaut G1/G2 restant dans ce périmètre (hors faux positifs `.on-figures`/`force-dark`/canvas) — sorties avant/après collées
- [ ] captures clair + sombre de `/`, `/contact`, `/rendez-vous`, `/services/infrastructure` avant/après dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T013/` (validation humaine)
- [ ] `npx tsc --noEmit -p .` → 0 erreur
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/src/pages/Booking/index.tsx` | E | champs L329-331, jours L66-69, créneaux ~L270-290, erreurs L335,343, focus L224 |
| `~/Documents/Workspace/seagle-website/src/pages/Contact/index.tsx` | E | erreurs L215-220, focus L129 (JSON-LD ajouté par T008 : ne pas toucher) |
| `~/Documents/Workspace/seagle-website/src/pages/SecurePass/index.tsx` | E | `#sp-demo` L103 focus seulement |
| `~/Documents/Workspace/seagle-website/src/pages/ServiceDetail/index.tsx` | E | label-mono colorés |
| `~/Documents/Workspace/seagle-website/src/style.css` | E | tokens L17-18, L51-53 ; animations L100-101 |
| `~/Documents/Workspace/seagle-website/src/components/ui/marquee.tsx` | E | L28, si le CSS seul ne suffit pas |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T003-audit-accessibilite-au-navigateur/result.md` | L | audit complet |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T003/audit.mjs` | L | re-mesure |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T013/` | E | build, captures |

## Contrats
Mesures T003 (avant) : `--th-text-lo` 2.51:1 clair / 3.01:1 sombre ; `--th-text-faint` 1.64:1 clair / 1.66-1.77:1 sombre ; `--th-text-md` 4.2-4.34:1 clair (sombre OK) ; accents 11px clair : jaune 1.28-1.69, vert 1.71-2.53, bleu 2.43-2.66, orange 2.48, cyan 2.49-2.68, rose 3.05, rouge 3.34, violet 3.77.
Ratio WCAG : `(L1+0.05)/(L2+0.05)`, L = luminance relative sRGB.

## Décisions actées
- cible WCAG 2.2 AA (4.5:1 texte courant, 3:1 ≥ 24px)
- visuels ASCII : déjà statiques sous reduced-motion (T003) → rien à faire ; ne pas toucher `.on-figures`, `force-dark`, canvas
- relever les tokens plutôt que changer les classes des 15 pages — 1 point de modification
- BLQ répondu (chef 2026-10-14) : DÉCOUPLER. `--th-text-md`/`--th-text-faint` intouchés (encres ASCII via ascii-core.ts readInk) ; nouveaux tokens texte (ex. `--th-copy-md`, `--th-copy-faint`, clair + sombre + `.force-dark`) branchés sur les utilitaires `text-md`/`text-faint` ; hiérarchie clair conservée : md > lo ≥ faint en contraste (ex. md 0.66, lo 0.58, faint 0.58), tous ≥ 4.5:1
- `text-faint` décoratif (n° « 01 ») peut rester < 4.5 s'il est `aria-hidden` ; sinon relevé
- visuels ASCII intouchables (`src/components/ui/ascii-*`, `*.data.ts`, `src/components/kit/Ascii*`) — décision humain 2026-10-14
- design intouchable : kit `src/components/kit/`, ∅ néon/halo/grille/blur décoratif ; Mona Sans + JetBrains Mono
- nouvelle clé i18n → 5 langues (`src/lib/local/{fr,en,de,es,it}/`) ; textes existants non réécrits

## Hors périmètre
- menu, tiroir, sélecteur, lien d'évitement (T012)
- JSON-LD de Contact (T008, déjà fait) ; textes des pages
- `header.tsx`, `footer.tsx`, `layout.tsx`

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` : React 18.3, Vite 7.3.6, react-router 7, i18next 25 + react-i18next 16, Tailwind 4, motion 12 ; TS strict, `npx tsc --noEmit -p .` → 0 erreur sur HEAD
- arbre partagé : 6 autres agents écrivent en même temps dans d'autres fichiers ; leurs diffs peuvent apparaître dans ton build — ne pas les corriger, les signaler
- **jamais `npm run build`** : il écrit `dist/` (servi sur :4173 par un preview partagé) et `prerender.mjs` exige le port 4173 libre
- ton build : `npx vite build --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T013/dist --emptyOutDir` (le plugin sitemap écrit aussi `dist/sitemap.xml` : sans effet, laisser)
- ton preview : `npx vite preview --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T013/dist --port 4408 --strictPort` en arrière-plan ; l'arrêter à la fin (kill du pid lancé, par pid)
- Playwright 1.62 lib : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; WebGL : `args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]` ; scripts dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T013/`
- thème/langue : `addInitScript` → `localStorage.setItem("seagle-theme","dark")`, `localStorage.setItem("i18nextLng","fr")`
- prérendu (`prerender.mjs`) non exécutable par toi → vérif HTML prérendu = `NV — prérendu réservé au chef`
- DoD périmètre : `git -C ~/Documents/Workspace/seagle-website diff --stat -- <chemins E>`, jamais diff global ; aucun commit (l'humain commite)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (fichiers E uniquement), Grep, Glob, Bash (`npx tsc`, `npx vite build/preview` comme ci-dessus, `node` sur scripts de `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T013/`, `rg`, `ls`, `wc`, `gzip`, `git diff`)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d'autres agents écrivent en même temps.
- Machine partagée : ne tuer que les processus que tu as lancés (par pid) ; ne supprimer que ce que la tâche a créé.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T013
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
