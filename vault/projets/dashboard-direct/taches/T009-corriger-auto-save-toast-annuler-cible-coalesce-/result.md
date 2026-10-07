---
tache: T009
statut: fait
---
## Livré
- D2 `ortho-front/src/modules/dashboard/components/use-layout-autosave.ts:92-96` — effet `[value, enabled]` : idle + !inFlight → `lastSent = value` ; couvre enable initial + `history.reset` (resync page, idle garanti)
- D5 `use-layout-autosave.ts:63` — `setError(null)` après succès
- D3+D6 `dashboard-page.tsx:223-236` — `removeTab` : capture `removed`/`index`, toast → `restore` : réinsère à `index` si absent, puis `selectTab(id)`
- D3 `dashboard-page.tsx:257-266` — `removeCell` : capture `tabId`/`removed`, toast → `commit` réinsère la case (fin de grille) dans son onglet si absente ; choix : gestes suivants conservés, pas de retour à l'état capturé
- D4 `dashboard-page.tsx:238-245` — `moveTab` → `{ coalesce: 'move-tab:' + fromId }`
- `tab-bar.tsx` — ∅ (coalesce côté page suffit : dragover continu < 1 s)
- `autosave.core.test.ts` — ∅ test D2 (logique dans le hook React, pas pure)

## Vérifié comment
`npx tsc -b` → `tsc=0`
`npx eslint dashboard-page.tsx use-layout-autosave.ts tab-bar.tsx` → `eslint=0`
`npm run test:unit` → `ℹ tests 406 · pass 406 · fail 0`
D2 rejoué mentalement (NV navigateur) : mount enabled → effet pose `lastSent=value` → Ctrl+S / Ctrl+Z vide / flèche bord → `fire` → `sameTabs` → idle, 0 PUT. `commit` pose `statusRef='pending'` avant l'effet → pas d'écrasement de `lastSent` après un geste.
D3 scénario : retirer A → ArrowRight B → Annuler → A réinséré, B reste déplacé (NV navigateur).

## Écarts
- ∅ lecture hors WL
- DoD D2 test node non ajouté — hook non pur, scénario décrit ci-dessus
- `removeCell` restore : case réinsérée en fin de grille, la grille la recompacte (`onLayoutChange` byUser=false) — position d'origine non garantie si des cases ont bougé

## Pour la suite
- T010 e2e à couvrir : D2 (0 PUT praticien neuf), D3 (retirer A, bouger B, Annuler), D4 (1 glisser = 1 Ctrl+Z), D6 (onglet resélectionné)
- Annuler du toast = étape d'historique (record true) : Ctrl+Z après annule la restauration — voulu, à confirmer avec vérificateur
- Commit record=false (recompaction) pendant idle met aussi `lastSent` à jour : la recompaction seule ne part jamais en PUT (inchangé vs avant)
- `tab-bar.tsx` dragover ping-pong (A sur B puis B sur A) pré-existant, hors D4

## Retour sur le pack
- Manquait: sémantique de « reset » côté hook (aucun reset dans `LayoutAutosave`) — interprété via resync page
- Inutile: `tab-bar.tsx` en E, `autosave.core.test.ts` en E
