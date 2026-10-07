---
pack: T009
projet: dashboard-direct
role: implementeur
cree: 2026-10-06
---

# Pack T009 — Corriger auto-save, toast Annuler ciblé, coalesce onglets

> Seule source de vérité de l'agent T009. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger les défauts D2-D6 du vérificateur (T007) dans `use-layout-autosave.ts`, `dashboard-page.tsx`, `tab-bar.tsx`, sans changer les contrats exportés.

## Definition of Done
- [ ] D2 : `lastSent` initialisé à `value` quand `enabled` passe à true (et sur `reset`) → `schedule`/`flush` sans changement ≠ PUT ; test node ajouté dans `autosave.core.test.ts` si la logique pure le permet, sinon décrire le scénario rejoué à la main
- [ ] D5 : succès → `setError(null)`
- [ ] D3 : « Annuler » des toasts (retirer widget `:253`, retirer onglet `:229`) annule **ce geste précis**, pas le dernier de l'historique : capture l'état d'avant (`history.value`) et `commit(() => avant)` (record true) ; si un autre geste a eu lieu entre-temps, l'annulation reste correcte (elle restaure l'élément retiré à sa place, en gardant les gestes suivants si possible ; sinon, restaure l'état capturé — documente le choix en 1 ligne)
- [ ] D6 : retirer l'onglet actif puis Annuler → l'onglet restauré est resélectionné (`selectTab(id)` dans l'action du toast)
- [ ] D4 : `moveTab` → `commit(…, { coalesce: 'move-tab:' + fromId })` → un glisser = 1 pas d'historique
- [ ] `npx tsc -b` → 0 ; `npx eslint` sur les 3 fichiers E → 0 erreur ; `PATH=~/.nvm/versions/node/v24.15.0/bin:$PATH npm run test:unit` → tout vert ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/use-layout-autosave.ts` | E | D2 :44,55 · D5 :60-65 |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | E | D3 :229,253 · D4 :231 · D6 :228-229 ; commit/undo :157-186 |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/tab-bar.tsx` | E | D4 :158-161 (dragover → onMoveTab) |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/autosave.core.test.ts` | E | test D2 si possible |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/use-edit-history.ts` | L | `set(update, record?: RecordOpt)`, `undo` |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-history.core.ts` | L | `RecordOpt = boolean | { coalesce: string }`, `COALESCE_WINDOW_MS = 1000` |
| `vault/projets/dashboard-direct/taches/T007-casser-la-manipulation-directe/result.md` | L | repros D1-D6 |

## Contrats
Défauts (vérificateur, verbatim) :
```
D2 use-layout-autosave.ts:44,55 — lastSent null au départ → 1er schedule/flush part en PUT sans changement ; page appelle schedule sans condition (:183,185,186,275). Praticien neuf (saved.saved=false) + Ctrl+Z historique vide / Ctrl+S / flèche contre un bord → PUT → saved=true en base. Attendu : 0 PUT.
D3 dashboard-page.tsx:229,253 — action « Annuler » du toast = undo global. Retirer A → ArrowRight sur B → Annuler → B recule, A reste retiré.
D4 tab-bar.tsx:158-161 + dashboard-page.tsx:231 — chaque dragover réordonnant = 1 pas d'historique sans coalesce → [A,B,C], glisser A au-delà de B puis C → 1 Ctrl+Z donne [B,A,C].
D5 use-layout-autosave.ts:60-65 — error non remis à null après succès → {status:'idle', error:Error}.
D6 dashboard-page.tsx:228-229 — onglet actif supprimé puis Annuler → onglet non resélectionné.
```
Code actuel à corriger :
```ts
// use-layout-autosave.ts:44-65
const lastSent = useRef<DashboardTab[] | null>(null)
…
if (lastSent.current && sameTabs(snapshot, lastSent.current)) { setStatus('idle'); return }
…
next => { inFlight.current = false; lastSent.current = snapshot; callbacks.current.onSaved(next, snapshot); if (dirty.current) fire(); else setStatus('idle') },
// dashboard-page.tsx:222-255
const removeTab = (id: string) => { …; commit(() => rest); if (id === activeTab?.id) selectTab(rest[…].id); addToast({ title: 'Onglet retiré', action: { label: 'Annuler', onClick: undo } }) }
const moveTab = (fromId: string, toId: string) => commit(d => { … })
const removeCell = (id: string) => { setLayout(l => l.filter(c => c.i !== id)); …; addToast({ title: 'Widget retiré', action: { label: 'Annuler', onClick: undo } }) }
// tab-bar.tsx:158-161
const onTabDragOver = (e, tabId) => { if (!dragId || !e.dataTransfer.types.includes(TAB_MIME)) return; e.preventDefault(); if (dragId !== tabId) onMoveTab(dragId, tabId) }
```
Exports à **ne pas changer** : `LayoutAutosave`, `UseLayoutAutosaveOptions`, `DashboardTabBarProps`, `DashboardGridProps`.

## Décisions actées
- historique = état affiché ; `history.reset` interdit hors effet resync — architecte
- 1 seul canal d'écriture : `commit` → `autosave.schedule()` — architecte
- D3 : le toast annule son geste, pas « le dernier » — vérificateur

## Hors périmètre
- e2e (T010), `grid.tsx`, `cell-chrome.tsx`, `widget-panels.tsx`, CSS.
- Refactor, renommage, nouveaux composants.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(npx tsc:*)`, `Bash(npx eslint:*)`, `Bash(npm run test:unit:*)`, `Bash(node --test:*)`, `Bash(rg:*)`, `Bash(git diff:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T009
statut: fait | bloque
---
## Livré
- Dn chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
