---
pack: T010
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T010 — CSP viewer stricte, décodeurs locaux, en-têtes Caddy (C1-CSP, M3)

> Seule source de vérité de l'agent T010. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Appliquer la CSP stricte du viewer (sans `'unsafe-inline'` script, sans unpkg), servir les décodeurs DRACO/Basis depuis `web/public/`, externaliser le seul script inline, et remplacer le `Caddyfile` par la version à en-têtes de sécurité — contrats verbatim ci-dessous. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] meta CSP de `web/viewer.html:16` ET `web/src/viewer/index.html:16` = constante contrat, octet pour octet
- [ ] `web/viewer.html:22-26` : bloc `<script type="module">` inline supprimé (commentaire :22 peut rester) ; `boot-web.ts` appelle `installIdleLogout()` en tête de module
- [ ] `TilesRendererLoader.ts:169` → `'/draco/'` ; `:177` → `'/basis/'` ; `rg unpkg web/src web/viewer.html` → ∅
- [ ] `web/public/draco/` = copie de `node_modules/three/examples/jsm/libs/draco/{draco_decoder.js,draco_decoder.wasm,draco_wasm_wrapper.js}` ; `web/public/basis/` = `{basis_transcoder.js,basis_transcoder.wasm}` (cp, 0 dep npm)
- [ ] `Caddyfile` = remplacement intégral contrat
- [ ] `web/src/viewer/__tests__/csp.test.ts` NEUF : 5 cas listés, verts
- [ ] `node scripts/check-viewer-html-sync.mjs` (cwd G) → exit 0, sortie collée
- [ ] `npm --prefix web test` → verts, compte collé
- [ ] `npm --prefix web run build` → sortie collée ; puis `ls web/dist/draco web/dist/basis` et `rg -c '<script(?![^>]*src=)' web/dist/viewer.html` (attendu 0) collés
- [ ] `git -C G diff --stat` + `git -C G status --short web/public` collés : 0 fichier hors WL
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/viewer.html` | E | meta :16, inline :22-26 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/index.html` | E | meta :16 (miroir) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/boot-web.ts` | E | 20 l, import idleLogout |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/loaders/TilesRendererLoader.ts` | E | :160-180 seulement |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/public/draco/` | E | NEUF, 3 fichiers copiés |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/public/basis/` | E | NEUF, 2 fichiers copiés |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/Caddyfile` | E | 16 l, remplacement |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/__tests__/csp.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/idleLogout.ts` | L | export :43 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/scripts/check-viewer-html-sync.mjs` | L | ce que la synchro vérifie |

## Contrats
```html
<!-- ═══ meta, identique web/viewer.html:16 ET web/src/viewer/index.html:16 -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' blob: data:; worker-src 'self' blob:; frame-src blob:; object-src blob:; base-uri 'self'; form-action 'self'" />
<!-- ═══ inline actuel web/viewer.html:23-26 (à supprimer) -->
<script type="module">
  import { installIdleLogout } from '/src/idleLogout';
  installIdleLogout();
</script>
```
```ts
// web/src/idleLogout.ts:43
export function installIdleLogout(opts: { idleMs?: number; onIdle?: () => void } = {}): () => void
// boot-web.ts actuel :8-20 : import installHttpBackend ; import maybeAutoCaptureThumbnail ; async boot() ; void boot();
//   → ajouter : import { installIdleLogout } from '../idleLogout';  puis installIdleLogout(); avant void boot();
// TilesRendererLoader.ts actuel
draco.setDecoderPath('https://unpkg.com/three@0.184.0/examples/jsm/libs/draco/');   // :169 → '/draco/'
draco.setDecoderConfig({ type: 'js' });                                              // :172 inchangé
ktx2.setTranscoderPath('https://unpkg.com/three@0.184.0/examples/jsm/libs/basis/');  // :177 → '/basis/'
```
```caddy
# ═══ Caddyfile, remplacement intégral (garder les 3 lignes de commentaire d'en-tête actuelles au-dessus)
portail.geolens.fr {
    encode zstd gzip

    @front not path /api/*
    header @front {
        defer
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
        Content-Security-Policy "frame-ancestors 'self'; base-uri 'self'; form-action 'self'"
    }

    @portail_doc not path /api/* /viewer.html /viewer /assets/* /draco/* /basis/*
    header @portail_doc {
        defer
        Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; frame-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"
    }

    handle /api/* {
        reverse_proxy api:4000
    }

    handle {
        reverse_proxy web:80
    }
}
```
Cas csp.test.ts (readFileSync, env node ; chemins via `new URL('../../../…', import.meta.url)`) :
- meta web/viewer.html === meta web/src/viewer/index.html === constante du test
- script-src ∌ `'unsafe-inline'`
- CSP ∌ `unpkg` · `glr-file:` · `file:` · `cog:` · `photo:`
- web/viewer.html : 0 `<script` sans `src=`
- TilesRendererLoader.ts ∌ `unpkg.com`

## Décisions actées
- schémas Electron retirés — 0 dépendance electron dans G (vérifié chef)
- décodeurs copiés dans public/, pas de plugin vite — 0 dep
- portail en Report-Only, enforce = lot futur — deps portail non inspectées
- frame-ancestors/nosniff/Referrer en-tête Caddy — meta les ignore
- 0 directive `log` dans le Caddyfile — jetons en query
- cible = Caddy du compose scaleway — decisions.md D2

## Hors périmètre
- nginx.conf, docker-compose*.yml, .env*
- main.ts, ui/*, install.ts, HttpBackend.ts (T008, T009 en parallèle) — si `npm run build` échoue sur un de ces fichiers : le noter, ne pas corriger
- passer draco en type 'wasm'
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; web/node_modules installé ; three 0.184.0 ; vitest env node, 0 jsdom
- `npm --prefix web run build` = `tsc --noEmit -p tsconfig.json && vite build` → dist/ gitignoré ; vite publicDir défaut = web/public (absent aujourd'hui)
- `node scripts/check-viewer-html-sync.mjs` lançable sans deps (cwd G)
- Caddy/Docker non lançables ici → `caddy validate` = NV, à faire par l'humain
- G sous git : baseline 745d46f ; T008/T009 écrivent dans web/src/viewer en parallèle (fichiers disjoints)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(cp, mkdir, ls, npm --prefix web test, npm --prefix web run build, npx vitest, node scripts/check-viewer-html-sync.mjs, git diff, git status, rg, wc)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T010
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
