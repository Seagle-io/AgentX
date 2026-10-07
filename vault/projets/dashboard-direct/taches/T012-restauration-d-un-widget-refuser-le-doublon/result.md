---
tache: T012
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/dashboard-page.tsx:162-165` — ref `shownNow` : onglets courants au clic
- `ortho-front/src/modules/dashboard/dashboard-page.tsx:266-273` — `restore` : no-op si id présent ; toast neutre si même `widget` ; sinon réinsertion
- `removeTab:223-236` — garde `d.some(t => t.id === id)` déjà en place, inchangé
## Vérifié comment
`npx tsc -b; echo exit=$?` → `tsc exit=0`
`npx eslint src/modules/dashboard/dashboard-page.tsx; echo exit=$?` → `eslint exit=0` (0 sortie)
Scénario D3+ (retirer clock → + clock → Annuler) : NV — pas de test runner autorisé
## Écarts
- ref ajoutée hors :257-267 (L162-165) — closure `restore` sinon figée sur `shownTabs` du rendu du retrait ; check dans l'updater impossible (toast = effet de bord, updater pur)
- lecture hors WL : ∅
## Pour la suite
- `removeTab.restore` lit aussi `d` dans l'updater → déjà juste ; `shownNow` réutilisable si besoin de toast là aussi
- test unitaire D3+ à ajouter (hors WL)
## Retour sur le pack
- Manquait: contrat `commit`/`history.set` (updater sync ou différé ?) — déterminant pour placer le toast ; Inutile: ∅
