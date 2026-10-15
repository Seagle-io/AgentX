---
pack: T073
projet: geolens-viewer
role: implementeur
cree: 2026-10-08
---

# Pack T073 — CSP portail appliquée, police des rapports embarquée, onerror inline retiré (MapView)

> Seule source de vérité de l'agent T073. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
(A) Passer la CSP du portail de Report-Only à appliquée dans le Caddyfile avec les origines relevées par T071 ; (B) remplacer l'`@import` Google Fonts des rapports HTML par Poppins embarquée en data URI (module NEUF `reportFonts.ts`) ; (C) retirer le `onerror` inline de la vignette de popup MapView (bloqué par `script-src 'self'`) au profit d'un écouteur ; tests. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] A : Caddyfile ligne `Content-Security-Policy-Report-Only …` (~:30) remplacée par la ligne contrat (en-tête appliqué) ; 1 commentaire au-dessus (contrat) ; `docker run --rm -v <G>/Caddyfile:/etc/caddy/Caddyfile:ro caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile` → `Valid configuration` collé
- [ ] B : `web/src/viewer/core/reportFonts.ts` NEUF = contrat ; ReportGenerator.ts:156 `@import url('https://fonts.googleapis.com/…')` → `${REPORT_FONT_FACE_CSS}` ; `rg -n "googleapis|gstatic" web/src` → seulement le commentaire de src/viewer/index.html:11 (sortie collée)
- [ ] C : MapView.tsx:72 `onerror="this.style.display='none'"` retiré ; masquage de l'image en erreur fait par un écouteur `error` posé là où le popup est créé (setHTML / getElement) ; `rg -n "onerror=" web/src -g '!viewer/**'` → ∅
- [ ] tests NEUFS : `web/src/viewer/core/reportFonts.test.ts` (cas listés) ; `web/src/__tests__/portal-csp.test.ts` (lit le Caddyfile, cas listés)
- [ ] `npm --prefix web run typecheck` → exit 0 ; `npm --prefix web run build:viewer-types` → exit 0 ; `npm --prefix web test` → verts ; `npm --prefix web run build` → exit 0 — sorties collées
- [ ] `git -C G diff --stat` collé : Caddyfile, ReportGenerator.ts, MapView.tsx + 3 fichiers neufs
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/Caddyfile` | E | ~:25-32 bloc @portail_doc |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/core/reportFonts.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/core/ReportGenerator.ts` | E | :150-160 seulement (+ import en tête) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/pages/MapView.tsx` | E | :62-80 popupHtml ; création du popup (rg setHTML) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/core/reportFonts.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/__tests__/portal-csp.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/styles/fonts.css` | L | @font-face existants (graisses, unicode-range) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/glb-assets.d.ts` | L | modèle de déclaration de module si `?inline` non typé |

## Contrats
```caddy
# Caddyfile — CIBLE dans `header @portail_doc { defer … }` (remplace la ligne Content-Security-Policy-Report-Only)
        # CSP portail APPLIQUÉE (T071/T073). Bucket : remplacer bucket-a-remplacer par S3_BUCKET réel (D21) — requis seulement si UPLOAD_PART_TRANSPORT=direct (défaut relay).
        Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://data.geopf.fr https://tile.openstreetmap.org https://bucket-a-remplacer.s3.fr-par.scw.cloud; font-src 'self'; connect-src 'self' https://data.geopf.fr https://tile.openstreetmap.org https://bucket-a-remplacer.s3.fr-par.scw.cloud; worker-src 'self' blob:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"
```
```ts
// ═══ web/src/viewer/core/reportFonts.ts (NEUF) — 5 woff2 LATIN locaux (fonts/poppins-{300,400,500,600,700}-latin.woff2, ≈ 39 Ko → ≈ 52 Ko base64)
import p300 from '../styles/fonts/poppins-300-latin.woff2?inline';   // idem 400, 500, 600, 700 ; `?inline` vite → data URI string
/** CSS @font-face Poppins embarqué (data URI) pour les rapports HTML téléchargés : 0 appel réseau à l'ouverture (RGPD, hors-ligne). */
export const REPORT_FONT_FACE_CSS: string;   // 5 blocs @font-face { font-family: 'Poppins'; font-style: normal; font-weight: N; font-display: swap; src: url(<data URI>) format('woff2'); } (unicode-range latin repris de fonts.css si présent)
// si TypeScript refuse `*.woff2?inline` : déclarer `declare module '*?inline' { const s: string; export default s }` dans un .d.ts du viewer (vite/client le déclare peut-être déjà : vérifier d'abord par typecheck)
// ═══ ReportGenerator.ts:154-156 ACTUEL (template HTML du rapport)
// <style>
//   @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
// → <style>\n${REPORT_FONT_FACE_CSS}\n … (reste du style inchangé)
// contexte T071 : rapport = fichier HTML TÉLÉCHARGÉ (main.ts:9341, HttpBackend.ts:588), ouvert hors du site → la CSP du site ne s'y applique pas ; l'@import était un vrai appel réseau
// ═══ MapView.tsx:72 ACTUEL (chaîne HTML du popup maplibre)
// `<img src="${esc(p.thumbnailUrl)}" alt="" onerror="this.style.display='none'"/>`
// → `<img src="${esc(p.thumbnailUrl)}" alt=""/>` + après création du popup : popup.getElement()?.querySelectorAll('.gl-pop-img img').forEach(img => img.addEventListener('error', () => { (img as HTMLImageElement).style.display = 'none'; }, { once: true }))
```
Cas de test :
- reportFonts.test : REPORT_FONT_FACE_CSS contient 5 × `@font-face`, poids 300/400/500/600/700, `format('woff2')`, `data:font/woff2;base64,` (ou `data:application/font-woff2`) ; ∌ `googleapis` ; longueur < 80 000
- portal-csp.test (readFileSync du Caddyfile) : ligne `Content-Security-Policy "` présente dans le bloc @portail_doc ; ∌ `Content-Security-Policy-Report-Only` ; script-src ∌ `'unsafe-inline'` ; img-src et connect-src contiennent `https://data.geopf.fr` et `https://tile.openstreetmap.org` ; 0 `*.`
- ReportGenerator : `rg -n "googleapis" web/src/viewer/core/ReportGenerator.ts` → ∅

## Décisions actées
- D23 : CSP portail appliquée ; police embarquée ; 0 wildcard
- D21 : bucket provisoire marqué ; portail n'en dépend qu'en UPLOAD_PART_TRANSPORT=direct (config.ts:247, défaut relay → PUT vers l'API, même origine)
- onerror retiré plutôt que 'unsafe-inline' — garder script-src strict

## Hors périmètre
- viewer.html / meta CSP viewer ; reportEngine.ts, ReportExporter.ts (rg `@import` dessus seulement : les citer s'ils en ont, sans modifier) ; api/
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; web/node_modules ; vite (`?inline` → data URI base64) ; vitest env node (import `?inline` en test : si vitest ne résout pas, tester une fonction pure `buildFontFaceCss(map)` exportée et laisser l'import dans le module) ; docker + caddy:2-alpine en cache
- G sous git HEAD 1a740db, arbre propre ; seul agent sur G

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix web run typecheck, npm --prefix web run build:viewer-types, npm --prefix web test, npm --prefix web run build, npx vitest, docker run caddy validate, git diff, git status, rg, ls)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T073
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
