---
pack: T026
projet: geolens-viewer
role: verificateur
cree: 2026-10-07
---

# Pack T026 — Contre-vérif T021+T022 : sinks XSS restants, CSP dev/prod

> Seule source de vérité de l'agent T026. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Contre-vérifier les correctifs T021 (11 sinks XSS du viewer) et T022 (CSP assouplie en dev seulement) : chaque défaut D1-D3 de T016 et D1 de T017 est-il fermé, sans régression ; `OK` ou `DÉFAUTS` avec repro ; 0 correction. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online, V = G/web/src/viewer.

## Definition of Done
- [ ] S1-S11 (T021) : chacun OK/KO, coordonnée relue + charge `<img src=x onerror=1>` raisonnée jusqu'au sink
- [ ] C1-C4 (T022) : chacun OK/KO avec commande + sortie
- [ ] ≥ 3 contre-exemples en test jetable HORS G (`mktemp -d`, import par chemin absolu de safeHtml.ts / cspDev.ts, `npx --prefix <G>/web vitest run --root <tmp>`) : oneOf avec `'info '`/`['info']`/`Object('info')` · relaxCspForDev avec meta en majuscules / 2 metas / `script-src` absent
- [ ] `npm --prefix web test`, `npm --prefix web run typecheck`, `npm --prefix web run build:viewer-types`, `npm --prefix web run build` → sorties collées
- [ ] verdict `OK` | `DÉFAUTS` ; défaut = fichier:ligne + repro + attendu/obtenu + exploitable oui/non
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule (+ exécution). Écriture : `result.md` + dossier jetable hors G.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/ui/safeHtml.ts` | L | oneOf :23-27 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/services/photoInspector/PhotoInspectorMode.ts` | L | :350-362, :760-772 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/ui/homeCinematic.ts` | L | :438-458 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/ui/poiPanel.ts` | L | :15-35, :105-125 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/core/POIManager.ts` | L | :436-452 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/main.ts` | L | :4915-4945, :7188-7196, :8630-8640 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/install.ts` | L | :150-160 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/cspDev.ts` | L | 22 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/vite.config.ts` | L | :1-25 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/__tests__/csp.test.ts` | L | 71 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/viewer.html` | L | meta :12 |

## Contrats
```ts
export function escapeHtml(str: unknown): string;               // safeHtml.ts
export function isSafeImageDataUrl(v: unknown): v is string;    // ^data:image/(png|jpeg);base64,[A-Za-z0-9+/]+=*$
export function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T;  // égalité stricte
export function relaxCspForDev(html: string): string;           // cspDev.ts : + 'unsafe-inline' à script-src de la meta CSP, idempotent
// vite.config.ts : plugins [react(), { name: 'glr-csp-dev', apply: 'serve', transformIndexHtml: (html) => relaxCspForDev(html) }]
// CSP prod (viewer.html:12 = src/viewer/index.html:12) : script-src 'self' 'wasm-unsafe-eval' blob: — 0 'unsafe-inline'
```
Affirmations T021 : S1 PhotoInspectorMode:358 filename · S2 :769 `${f}` · S3 homeCinematic:443-444 value/label · S4 :454-455 title/subtitle · S5 poiPanel:111-120 priority via oneOf · S6 :122-123 data-poi-* = escapeHTML(id) · S7 POIManager:446 priority via oneOf · S8 main.ts:4935-4941 d.type/label/metaParts · S9 main.ts:7193 err.message · S10 main.ts:8636-8638 d.type · S11 install.ts:155-159 orgLogo isSafeImageDataUrl
Affirmations T022 : C1 dev : transformIndexHtml('/viewer.html') → script-src contient 'unsafe-inline' (repro `node -e` createServer middlewareMode, hmr port libre, server.close()) · C2 prod : dist/viewer.html script-src ∌ unsafe-inline · C3 csp.test.ts lit les 2 HTML réels · C4 check-viewer-html-sync OK
Reste connu (pas défaut) : main.ts:4919-4925 `title="${tooltipText}"` (sizeTxt) — vérifier si la source peut être une chaîne du manifeste ; `npm run dev` navigateur réel NV.

## Décisions actées
- échappement au site d'appel ; showToast inchangé
- priority hors liste → 'info' ; id POI échappé, pas filtré
- dev assoupli, prod stricte

## Hors périmètre
- corriger, éditer un fichier de G, ajouter un test dans G
- api/, e2e/, worker/, Caddyfile
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; web/node_modules ; vitest env node, 0 jsdom ; ne pas importer main.ts/POIManager.ts dans un test
- build ≈ 35 s ; `node scripts/check-viewer-html-sync.mjs` (cwd G)
- G sous git ; un agent écrit api/test en parallèle (sans effet sur web/)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(npm --prefix web test/typecheck/build/build:viewer-types, npx vitest, node -e, node scripts/check-viewer-html-sync.mjs, mktemp, rg, git diff), Write (result.md + dossier jetable hors G)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T026
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- S1..S11, C1..C4 — OK | KO (≤ 8 mots)
## Défauts
- ∅ | Dn · fichier:ligne · repro · attendu / obtenu · exploitable oui/non
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
