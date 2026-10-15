---
pack: T027
projet: seagle-site
role: verificateur
cree: 2026-10-14
---

# Pack T027 — Re-vérifier les corrections T023 à T026

> Seule source de vérité de l'agent T027. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rejouer chaque défaut des vérifications T018, T019, T020 sur le build final (:4173, 109 pages, e2e 113/113) et tenter de casser les corrections T023-T026 → verdict OK ou défauts reproductibles.

## Definition of Done
- [ ] T018 D1-D3 rejoués avec les repro de `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T018/` (BASE :4173, HTML prérendu réel) → corrigés ; `i18nextLng` ∈ {"de-DE","DE","it-CH","xx",""} → langue attendue
- [ ] T019 D1-D3 rejoués avec `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T019/` → corrigés ; redirection minuscules : pas de boucle, query+hash gardés, `/` intact
- [ ] T020 D1-D7 rejoués avec `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T020/` (sauf D5 préexistant si non corrigé) → corrigés ; check-dist sur `dist/` → OK ; e2e → 113/113
- [ ] régressions croisées : rechargement unique (T023) × redirection minuscules (T024) → 0 boucle (`/DE` avec chunk `de` coupé) ; reduced-motion `[class*="animate-"]` → pas d'effet sur canvas ASCII ni sur les transitions `motion` nécessaires (menu qui s'ouvre toujours)
- [ ] Booking : `autoFocus` Nom → pas de défilement brusque hors écran à 390×844 (capture)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T018-casser-vitesse-json-ld-lab-et-audience/result.md` | L | défauts d'origine |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T019-casser-les-urls-en-cinq-langues/result.md` | L | défauts d'origine |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T020-casser-garde-fou-e2e-et-accessibilite/result.md` | L | défauts d'origine |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T023-corriger-langue-qui-ne-charge-pas-langue-enregis/result.md` | L | affirmations |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T024-corriger-canonical-apres-bascule-majuscules-slug/result.md` | L | affirmations |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T025-corriger-check-dist-et-e2e-qui-laissent-passer/result.md` | L | affirmations |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T026-corriger-animation-spin-echap-au-survol-focus-rd/result.md` | L | affirmations |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T018/` | L | repro |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T019/` | L | repro |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T020/` | L | repro |
| `~/Documents/Workspace/seagle-website/dist/` | L | build final |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T027/` | E | scripts, sorties |

## Contrats
Corrections déclarées : i18n.ts `supported()` (xx-YY→xx), i18nReady rejetée si chunk KO → main.tsx 1 reload (`reloaded:locale`) sinon HTML prérendu ; usePageMeta deps pathname ; App.tsx minuscules ; useLanguageRedirect slug inconnu ; check-dist motif `/(?:https?:|wss?:)?\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])[:/]/i` + index.html requis ; e2e canonical ≡ path, sitemap vide KO ; style.css reduce `[class*="animate-"]{animation:none}` ; mega-menu Échap document ; Booking autoFocus ; tiroir `max-h-[calc(100dvh-4rem)] overflow-y-auto`.

## Décisions actées
- visuels ASCII et design hors critique — décision humain
- défaut = entrée concrète → sortie observée ≠ attendue + repro

## Hors périmètre
- nouveaux chantiers ; corriger quoi que ce soit

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` ; build complet frais (`npm run build`, 109 pages prérendues, fait par le chef après T016) servi par `vite preview` sur **http://localhost:4173** — partagé, lecture seule, ne pas l'arrêter ni rebuilder
- Playwright 1.62 lib : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; WebGL : `args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]`
- scripts de repro dans ton dossier artefact ; jamais d'écriture dans le dépôt ; jamais `npm run build` ; builds annexes éventuels : `npx vite build --outDir <ton artefact>/dist` + preview sur ton port
- arbre partagé, non commité : jamais `git stash/checkout/reset/clean/commit`

## Budget
- Lectures hors whitelist : **5 maximum** (marge de contre-exemple), journalisées dans `## Écarts`.
- Outils : Read, Grep, Glob, Bash (node, rg, curl, git diff), Write (result.md + artefact seulement). Aucune édition du dépôt.
- Si bloqué : statut `bloque`, **une** question précise, arrête-toi.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 80 lignes, sections exactes :

```markdown
---
tache: T027
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- [D1..Dn] gravité (G1 casse un usage · G2 régression/contrat KO · G3 mineur) — entrée/état → sortie observée ≠ attendue — chemin:Lx — repro: commande
- affirmations des result.md rejouées : OK/KO une ligne chacune
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : défauts à recopier dans un pack de correction
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
