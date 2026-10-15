---
pack: T036
projet: geolens-viewer
role: verificateur
cree: 2026-10-07
---

# Pack T036 — Vérif navigateur : preuves e2e réelles, CSP, T023+T027

> Seule source de vérité de l'agent T036. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Lancer pour la première fois les preuves navigateur sur G corrigé (CSP stricte, XSS, jetons) et tenter de réfuter que le viewer fonctionne en vrai : 0 violation CSP bloquante, preuves vertes, correctifs T023/T027 en place ; sans corriger.

## Definition of Done
- [ ] stack démarrée : `npm --prefix web run build`, API `npm run dev:api` (:4000), `npm --prefix web run preview -- --port 5180 --strictPort` (:5180) en arrière-plan ; preuves avec `BASE=http://localhost:5180` ; arrêtées en fin (`kill` des PID lancés)
- [ ] preuves lancées, sortie brute (dernières lignes) par preuve : proof-viewer, proof-persistence, proof-interaction, proof-range, proof-ortho, proof-upload, proof-export
- [ ] console navigateur : violations CSP comptées par preuve (`Refused to` / `Content Security Policy`) — liste des directives violées
- [ ] A1-A6 chacun OK/KO
- [ ] 0 fichier modifié dans G (`git -C G status --short` → ∅ hors dist/ ignoré) ; captures dans /tmp/glw-proofs
- [ ] `result.md` ≤ 60 lignes selon « Format de sortie »

## Fichiers autorisés
Lecture + exécution ; écriture : `result.md` seulement (captures hors G).
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/package.json` | L | scripts proof:* |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/_proofEnv.mjs` | L | DIR, minTiles, PROOF_MIN_TILES |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-viewer.mjs` | L | seuil :70-71 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-interaction.mjs` | L | minTiles(20) :39 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-persistence.mjs` | L | sessions |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-range.mjs` | L | jetons signés |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-export.mjs` | L | export PNG/HTML |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/vite.config.ts` | L | preview port, proxy /api, relaxCspForDev |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/viewer.html` | L | meta CSP |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/README.md` | L | section preuves |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/main.ts` | L | rg seulement : :8630-8641 metaBits, s.unit |

## Contrats
```
e2e/package.json : « Lancer API (4000) + front preview (5173) d'abord » ; playwright-core 1.61.0 ; chromium cache ~/.cache/ms-playwright/chromium-1234
_proofEnv.mjs : DIR (remplace C:/tmp/glw-proofs) ; minTiles(n) : PROOF_MIN_TILES entier ≥ 0 force, sinon warn + assouplissement si assets 3D absents (D4)
CSP viewer prod (dist/viewer.html) : script-src 'self' 'wasm-unsafe-eval' blob: ; seul unsafe-inline = style-src ; 0 unpkg ; décodeurs DRACO/KTX2 locaux (public/)
T027 : main.ts metaBits.join et s.unit échappés via escapeHTML
T015 connu : proof-viewer.mjs:71 mem.geometries >= 30 && mem.textures >= 10 dur → KO probable sans assets (constat, pas défaut nouveau)
```
Affirmations à réfuter :
- A1 viewer s'ouvre (proof-viewer) : tuiles signées servies, 0 requête sans token sur /storage
- A2 0 violation CSP script-src/worker-src/connect-src dans le viewer ; violations Report-Only du portail listées (attendues, pas défaut)
- A3 décodeurs DRACO/KTX2 chargés depuis l'origine (`/draco/`, `/basis/`), 0 requête unpkg (réseau)
- A4 persistance, range, ortho, upload, export : verts, ou KO attribué (assets absents / régression sécurité / autre) avec ligne d'erreur
- A5 `rg -n "C:/tmp" e2e/proof-*.mjs` → ∅ ; `rg -n ">= 20" e2e/proof-interaction.mjs` → ∅
- A6 régression liée aux correctifs : tout KO comparé en relançant la même preuve sur la base `745d46f` NON exigé ; à la place, citer le message d'erreur et le fichier source suspect

## Décisions actées
- seuils de tuiles assouplis, preuve réduite assumée — decisions.md D4
- portail CSP en Report-Only, viewer en enforce — D6

## Hors périmètre
- corriger, éditer src/, un test existant, un fichier de config
- push, remote, PR, commit — D5/D9 ; git stash/checkout/reset/clean
- npm install, npm audit fix, montée de dépendance
- éditer une preuve ou un seuil ; installer un navigateur (`npx playwright install`) — si chromium introuvable : BLQ avec la commande exacte
- preuves package, cloudpkg, pnts, splat, refine, photo (assets lourds absents)

## Environnement
- G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online · git local : base `745d46f`, HEAD `6e22e8c` · arbre propre (`git -C G status --short` → ∅)
- node v22.22.1 ; deps api, web, e2e installées ; vitest + pg-mem ; rate-limit actif seulement avec RATE_LIMIT=1
- état connu : typecheck 0 · lint 0 err 1 warn (Admin.tsx:368, préexistant) · api 73 fichiers 629 tests · web 176 fichiers 1691 tests
- 3 autres vérificateurs tournent en parallèle sur G : 0 écriture hors fichiers jetables listés ; ne jamais lancer `npm install`
- :5173 OCCUPÉ par le Vite d'OrthoPro (pid 252705) — ne jamais le tuer ; preview sur :5180, toutes les preuves lisent `process.env.BASE`
- :4000 doit être libre (`ss -ltnp | rg ':4000|:5180'`) ; si occupé → BLQ

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Write (result.md), Bash(npm --prefix web run build, npm run dev:api, npm --prefix web run preview -- --port 5180 --strictPort, BASE=… node e2e/proof-*.mjs, ss, curl, rg, kill des PID lancés, git -C G status)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T036
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- A<n> OK | KO — preuve ≤ 12 mots
## Défauts
- D<n> · chemin:L — symptôme — repro (commande ou cas) — correctif ≤ 15 mots | ∅
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack de correction
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
