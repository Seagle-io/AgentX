---
pack: T027
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T027 — Dernier sink viewer : scene-item-meta + unité de stat (D1 T026)

> Seule source de vérité de l'agent T027. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Échapper les 2 dernières interpolations HTML de `web/src/viewer/main.ts` alimentées par le manifeste : `metaBits.join(' · ')` (:8641, contient `d.type` et `d.resolution`) et `s.unit` (:4863), avec `escapeHTML` déjà présent dans main.ts. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] main.ts:8641 `${metaBits.join(' · ')}` → `${escapeHTML(metaBits.join(' · '))}`
- [ ] main.ts:4863 `${s.unit}` → `${escapeHTML(String(s.unit))}`
- [ ] `rg -n '\$\{metaBits\.join|\$\{s\.unit\}' web/src/viewer/main.ts` → ∅ (sortie collée)
- [ ] `wc -l web/src/viewer/main.ts` = 9405 (0 ligne ajoutée)
- [ ] `npm --prefix web run typecheck` → exit 0 ; `npm --prefix web run build:viewer-types` → exit 0 ; `npm --prefix web test` → 176 fichiers / 1691 tests verts (sorties collées)
- [ ] `git -C G diff --stat` collé : 1 fichier (main.ts), 2 lignes (HEAD ad370d1 = tout l'antérieur commité ; T024 écrit api/ en parallèle → filtrer `-- web`)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/main.ts` | E | :4858-4866, :8622-8645 seulement |

## Contrats
```ts
// main.ts:465 (existant)
export function escapeHTML(str: string): string;  // & < > " ' ; null → ''
// main.ts:8622-8641 ACTUEL
const label = DELIVERABLE_LABELS[d.type] || d.type;
const metaBits: string[] = [label];
if (d.resolution) metaBits.push(`${d.resolution.width}×${d.resolution.height}`);
if (d.pointCount) metaBits.push(`${fmtCount(d.pointCount)} pts`);
//   <div class="scene-item-meta">${metaBits.join(' · ')}</div>
// main.ts:4863 ACTUEL
//   ${escapeHTML(String(s.value))}${s.unit ? `<span class="dash-stat-unit">${s.unit}</span>` : ''}
```
Repro T026 : livrable `{filename:"a.pdf", type:"<img src=x onerror=alert(1)>"}` → rendu brut dans `.scene-item-meta` (listEl.innerHTML :8687).

## Décisions actées
- échapper la chaîne jointe, pas chaque élément — 1 ligne, même effet
- showToast :6279, :6351 (`parts.join`) HP — compteurs internes

## Hors périmètre
- toute autre ligne de main.ts ; autres fichiers
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; web/node_modules ; vitest env node ; 0 test possible sur main.ts (ne pas l'importer)
- G sous git, HEAD ad370d1 ; T024 modifie api/ en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Bash(npm --prefix web test, npm --prefix web run typecheck, npm --prefix web run build:viewer-types, git diff, rg, wc)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T027
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
