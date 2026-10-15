---
pack: T019
projet: seagle-site
role: verificateur
cree: 2026-10-14
---

# Pack T019 — Casser les URLs en cinq langues

> Seule source de vérité de l'agent T019. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de faire échouer T014 (routage 5 langues), T015 (prérendu, sitemap, hreflang) et T016 (liens internes) sur le build final (:4173 + `dist/`) → verdict OK ou défauts reproductibles.

## Definition of Done
- [ ] chaque ligne « Vérifié comment » des 3 result.md rejouée → OK/KO
- [ ] URLs fr/en de HEAD (`git show HEAD:src/lib/routes.ts`) : toutes servies, même contenu de langue qu'avant, 0 redirection nouvelle
- [ ] `dist/sitemap.xml` : 109 `<loc>`, chaque `<loc>` → fichier `dist/<path>/index.html` existant ; chaque `xhtml:link` réciproque (A annonce B ⇒ B annonce A) ; 0 hreflang vers une URL absente
- [ ] HTML prérendu de 10 URLs tirées (dont `/es`, `/it/services/data-analyse`, `/de/lab`, `/about`, `/contact`) : `<html lang>`, `og:locale`, canonical, hreflang, texte dans la bonne langue
- [ ] navigation : depuis `/de` cliquer chaque lien du menu, du tiroir mobile et du pied de page → URL `/de…` + allemand ; sélecteur fr/en/es/de/it sur 5 pages → URL et langue cohérentes ; retour arrière ×3 → 0 boucle (compter les navigations)
- [ ] bords : `/de/`, `/DE/products`, `/de/produits` (slug fr sous préfixe), `/de/services/inconnu`, `/fr`, `/en/products`, query + hash conservés (`/de/contact?x=1#f`) → comportement observé, aucun écran blanc
- [ ] `rg -n '(to|href)(=|: ?)"/[a-z]' src -g '!src/pages/Lab*/**'` → ∅ ; `rg -n 'pathname\.(match|startsWith)' src` → ∅
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T014-routage-en-cinq-langues/result.md` | L | affirmations T014 |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T015-prerendu-sitemap-et-hreflang-en-cinq-langues/result.md` | L | affirmations T015 |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T016-liens-internes-sans-chemin-en-dur/result.md` | L | affirmations T016 |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T005-contrat-des-urls-de-es-it/result.md` | L | contrat de référence |
| `~/Documents/Workspace/seagle-website/src/lib/site-routes.json` | L | source unique |
| `~/Documents/Workspace/seagle-website/src/lib/site-routes.mjs` | L | indexedPages, alternates |
| `~/Documents/Workspace/seagle-website/src/lib/routes.ts` | L | matchRoute, langFromPath |
| `~/Documents/Workspace/seagle-website/src/hooks/useLanguageRedirect.ts` | L | règle sans boucle |
| `~/Documents/Workspace/seagle-website/prerender.mjs` | L | |
| `~/Documents/Workspace/seagle-website/dist/` | L | HTML prérendus, sitemap |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T019/` | E | scripts de repro |

## Contrats
Choix A : es/de/it = `/<l>` + chemin EN ; fr/en inchangés ; URL partagée fr/en (/, /contact, /services/*) = contenu fr, hreflang sans `en` ; 109 pages ; langue initiale = URL > localStorage > navigator > fr.

## Décisions actées
- schéma d'URL tranché (decisions.md 2026-10-14) — ne pas le contester, le tester
- défaut = entrée concrète → sortie observée ≠ attendue + repro

## Hors périmètre
- vitesse, JSON-LD, /lab visuel (T018) ; accessibilité (T020)
- corriger quoi que ce soit

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
tache: T019
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
