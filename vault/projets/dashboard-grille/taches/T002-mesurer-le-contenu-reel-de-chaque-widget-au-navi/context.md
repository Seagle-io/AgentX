---
pack: T002
projet: dashboard-grille
role: eclaireur
cree: 2026-10-08
---

# Pack T002 — Mesurer le contenu réel de chaque widget au navigateur

> Seule source de vérité de l'agent T002. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Mesurer dans le vrai front (http://localhost:5173, branche `master`, compte de test) la taille naturelle du contenu de chacun des widgets du catalogue : largeur minimale lisible, hauteur naturelle à 3 largeurs → tableau en pixels qui servira à fixer les tailles en modules carrés.

## Definition of Done
- [ ] harnais Playwright dans `$S/mesure/` (Chrome système `/usr/bin/google-chrome`, `playwright` importé depuis `~/Documents/Workspace/OrthoPro/ortho-front/node_modules`) ; session : `localStorage.setItem('auth_token', <auth_token de $S/orthopro-session.json>)` sur l'origine `http://localhost:5173` avant `goto('/dashboard')`
- [ ] disposition de mesure posée par API : `PUT http://localhost:5173/api/dashboard/layout` (Bearer token) avec 1 onglet contenant **tous** les widgets disponibles (`availableWidgets` côté front ≈ ids de `components/widget/*/index.tsx`, rg `id: '`), chacun en `w:12` (largeur pleine actuelle), `h:40`, empilés — corps : `{ tabs: [{ id, name:'Mesure', color:null, cells:[{ id, widget, x:0, y, w:12, h:40, config:{} }] }] }`
- [ ] pour chaque case `[data-testid=dash-cell][data-widget=ID]` : forcer la largeur de la case (style inline) à 160, 240, 320, 480 px puis lire sur le conteneur de contenu (`.dash-cell-chrome > div` ou premier enfant scrollable) `scrollWidth`, `scrollHeight`, `clientWidth` → largeur min sans débordement horizontal ni texte tronqué (`scrollWidth > clientWidth` = trop étroit), hauteur naturelle à chaque largeur
- [ ] 1 capture PNG par widget à sa largeur mini lisible dans `$S/mesure/png/` + capture de `weather` à 160/240/320/480
- [ ] tableau final : `widget | larg. min lisible px | haut. naturelle @240 | @320 | @480 | contenu en 1 ligne | remarque (vide, erreur, données absentes)`
- [ ] à la fin : remettre une disposition vide pour le compte de test (`PUT` `{tabs:[]}`)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/d4a2126e-085a-48b3-92aa-2bb44b582a4a/scratchpad/orthopro-session.json` | L | `auth_token` du compte de test local — ne jamais l'afficher |
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/d4a2126e-085a-48b3-92aa-2bb44b582a4a/scratchpad/mesure/` | E | harnais + PNG |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/` | L | rg `id: '` et `grid:` seulement |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | L | testids des cases |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/cell-chrome.tsx` | L | structure du conteneur de contenu |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/api/dashboard-layout.ts` | L | forme du PUT |

## Contrats
```ts
// api/dashboard-layout.ts
export type DashboardCellData = { id: string; widget: string; x: number; y: number; w: number; h: number; config: Record<string, unknown> }
export type DashboardTabData = { id: string; name: string; color: string | null; cells: DashboardCellData[] }
// PUT /api/dashboard/layout  body { tabs: DashboardTabData[] }  → { saved: boolean; tabs: DashboardTabData[] }
// grille actuelle : 12 col, rangée 24 px, gouttière 16 px ; case = div[data-testid=dash-cell][data-widget][data-cell-id] > .dash-cell-chrome > div.min-h-0.flex-1.overflow-auto
```
`$S` = `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/d4a2126e-085a-48b3-92aa-2bb44b582a4a/scratchpad`

## Décisions actées
- mesure sur données réelles du compte de test (souvent vides) : noter « données absentes » plutôt que deviner
- viewport 1440×900, zoom 100 %

## Hors périmètre
- Tout fichier d'ortho-front ou d'ortho-back en écriture ; tout autre compte que le compte de test ; proposer des tailles en modules (c'est l'architecte).

## Environnement
- front `http://localhost:5173` (Vite, master) et back `:3000` déjà lancés — ne pas les relancer
- Playwright attend chromium 1243, absent : utiliser `executablePath: '/usr/bin/google-chrome'` ; ne pas lancer `playwright install`
- `node` 24 : `~/.nvm/versions/node/v24.15.0/bin`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Write ($S/mesure), `Bash(node:*)`, `Bash(curl -s:*)`, `Bash(rg:*)`, `Bash(ls:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 120 lignes, sections exactes :

```markdown
---
tache: T002
statut: fait | bloque
---
## Livré
- tableau des mesures (1 ligne par widget) ; chemins des PNG
## Vérifié comment
commande → sortie brute (extrait) | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
