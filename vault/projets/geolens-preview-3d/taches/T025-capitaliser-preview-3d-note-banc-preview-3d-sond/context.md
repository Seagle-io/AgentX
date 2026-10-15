---
pack: T025
projet: geolens-preview-3d
role: scribe
cree: 2026-10-14
tags: [pack]
---

# Pack T025 — Capitaliser preview-3d et charge-3d

> Seule source de vérité de l'agent T025. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Transformer les comptes rendus des projets geolens-preview-3d (T001-T024) et geolens-charge-3d (T031-T035) en connaissances réutilisables : une note atomique « banc preview 3D » (pour qu'un futur vérificateur lance le banc sans exploration), la note outillage geolens-web mise à jour, et le gabarit de pack corrigé des manques récurrents. Le futur pack doit pouvoir citer ces notes au lieu de recopier 30 lignes de banc.

## Definition of Done
- [ ] `vault/connaissances/geolens-banc-preview-3d.md` (neuve, ≤ 120 l, frontmatter `tags: [connaissance, geolens, banc]`) : commandes banc (bench-tileset, build `--outDir`, API mémoire, vite preview, AVANT = `git archive HEAD`), comptes/projet, lancement GPU réel (flags), sondes `window.__glrTest` / `__glrMotionGate` / `__glrSplatStats` / `glr:active-camera` (zoom), mapping souris (gauche translation, milieu orbite, droit/molette dolly-persp zoom-ortho), pièges (accueil `#gx-home-explore` + `gx-home-open`, flag 3DGS `glr.settings.v1` {gaussianSplatBeta:true}, clé vues `glr.savedViews.pkg:…`, prompt nom via `input:focus`, contexte Playwright neuf = cache, `camLen()` = |camPos|, lib.mjs BASE par défaut, EDL jamais rendu, nuage seed `pnts` vide ⇒ PLY généré, entrée Playwright sur canvas lève l'exemption d'ouverture), métriques de référence (avant/après) utiles comme témoins, emplacement des scripts réutilisables (chemins scratchpad listés dans les dumps) avec la mise en garde « scratchpad = éphémère »
- [ ] `vault/connaissances/geolens-web-outillage.md` : typecheck viewer `npx tsc --noEmit -p tsconfig.viewer.json` (`npm run typecheck` exclut src/viewer), vitest env node 0 jsdom, modules purs extraits en `core/*.ts` ; compte de tests courant 196 fichiers / 1849 ; lien `[[geolens-banc-preview-3d]]` ; rien de dupliqué
- [ ] `vault/_templates/context.md` : agréger les `Retour sur le pack` des deux dumps ; corriger le gabarit SEULEMENT pour les manques récurrents (≥ 2 occurrences) et génériques (pas propres à geolens) ; ≤ +10 lignes ; lister dans result.md chaque manque retenu/écarté avec son compte
- [ ] 0 récit, 0 section vide, liens `[[wikilink]]`, Obsidian (règle 10) ; ce qui n'aide pas un futur pack n'entre pas
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
`S` = `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad`.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `S/integrer-preview3d.md` | L | Pour la suite / Écarts / Vérifié comment / Retour T001-T024 (641 l) |
| `S/integrer-charge3d.md` | L | idem T031-T035 (773 l) |
| `vault/projets/geolens-preview-3d/decisions.md` | L | D1-D8 (contexte, ne pas modifier) |
| `vault/connaissances/geolens-banc-preview-3d.md` | E (neuf) | note banc |
| `vault/connaissances/geolens-web-outillage.md` | E | outillage |
| `vault/_templates/context.md` | E | gabarit (84 l) |
| `vault/_templates/LANGAGE.md` | L | style dense |

## Contrats
Gabarit actuel : sections `Mission`, `Definition of Done`, `Fichiers autorisés`, `Contrats`, `Décisions actées`, `Hors périmètre`, `Environnement`, `Budget`, `Format de sortie` (+ résultat : `Livré`, `Vérifié comment`, `Écarts`, `Pour la suite`, `Retour sur le pack`) ; `bin/vx.py pack-lint` refuse sections manquantes, DoD non vérifiable, > 220 l, WL > 12 ⇒ ne renommer/supprimer AUCUNE section.
Manques déjà vus dans ce projet (à confirmer par compte dans les dumps) : flag bêta 3DGS ; accueil auto-ouvre / clic Explorer ; HEAD sans fichiers non suivis (git archive) ; sondes caméra (zoom non exposé) ; BASE par défaut des scripts ; clé localStorage des vues ; implémenteurs parallèles qui changent le compte de tests ; outils hors liste (python3 heredoc).

## Décisions actées
- notes atomiques, une par sujet ; liens plutôt que recopie
- gabarit : corrections génériques seulement

## Hors périmètre
- code G ; decisions.md, brief.md, plan.md (écriture) ; autres notes de connaissances ; `bin/` ; commit, push

## Environnement
- vault Obsidian (markdown + frontmatter YAML, `[[wikilink]]`, pas de HTML) ; comptabilité par CLI (`./bin/agentx`), jamais d'édition de frontmatter de tâche à la main

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Write, Edit, Grep, Bash (wc, rg, ls)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 80 lignes, sections exactes :

```markdown
---
tache: T025
statut: fait | bloque
---
## Fait
- chemin — quoi (lignes)
## Manques agrégés
- manque · n occurrences · retenu (gabarit:L) | écarté (raison)
## Vérifié comment
commande → sortie brute (wc, rg des liens)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
