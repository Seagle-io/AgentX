---
tache: T022
statut: fait
---
## Livré
- src/pages/Home/index.tsx:23 — import getLocalizedChildPath
- src/pages/Home/index.tsx:166 — destructuring `{ t, i18n }` (composant Services)
- src/pages/Home/index.tsx:193,253 — to={getLocalizedChildPath(i18n.language,"services",slug)}
- src/pages/Services/index.tsx:11,168 — import + navigate(getLocalizedChildPath(lang,...))
## Vérifié comment
rg -n '(to|href)=\{`/|navigate\(`/' src -g '!src/pages/Lab*/**' -g '!src/App.tsx' → ∅ (exit 1)
npx tsc --noEmit -p . → exit 0
vite build (outDir T022/dist) → ✓ built in 4.76s
playwright :4422 → /de href /de/services/built-application ; clic → url /de/services/built-application lang de errs 0
playwright :4422 → / href /services/built-application ; clic → url /services/built-application lang fr errs 0
preview pid tué
prérendu HTML → NV — réservé au chef
## Écarts
- DoD 3 (diff-stat 3 lignes) non littérale: diff --stat = +26/-7 (arbre sale vs HEAD, autres modifs préexistantes) ; mes lignes = 5 (3 liens + import×2 + destructuring)
- 1er `a[href*="/services/"]` testé: sélecteur générique, pas prouvé = L193 (peut être header) ; href localisé OK dans les 2 cas
## Pour la suite
- ∅
## Retour sur le pack
- Manquait: composant Home L165 n'avait que `t` (pack disait déjà-présent) | Inutile: ∅
