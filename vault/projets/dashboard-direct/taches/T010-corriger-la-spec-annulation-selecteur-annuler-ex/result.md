---
tache: T010
statut: fait
---
## Livré
- `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/annulation.spec.ts:35` — `{ name: 'Annuler', exact: true }` ; dash-undo exclu
- `ajout-widget.spec.ts` · `deplacement.spec.ts` · `persistance.spec.ts` — ∅ `getByRole('button'` → inchangés
- `annulation.spec.ts:76` — `Réessayer` scopé `status.getByRole` → ∅ ambiguïté, inchangé
- toast.tsx:46-61 — ∅ rôle ARIA sur le toast → ciblage par `exact` retenu, pas par `getByRole('status')`
## Vérifié comment
- `rg "getByRole\('button'" e2e/dashboard` → 2 hits : annulation:35 (exact), annulation:76 (scopé)
- `npx tsc -p tsconfig.e2e.json` → ∅ sortie, rc=0
- `npx eslint e2e/dashboard` → ∅ sortie, rc=0
- `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5183` → `000` → Playwright NV — stack absente
- D3/D6 scénario « retirer + Annuler » (:32-37) : NV — exécution impossible ; spec attend cell count 0→1 + status idle, compatible T009
## Écarts
- ∅ lecture hors WL
- DoD 3 (D3/D6) : vérifié par lecture seule, pas d'exécution — stack absente
- Playwright chromium 1243 ≠ 1234 installé — non installé (hors périmètre)
## Pour la suite
- annulation.spec.ts:36 ne vérifie pas `data-x` des autres cases (D6) : seed n'a qu'une case → ajouter une 2e case au seed + `toHaveAttribute('data-x', …)` après Annuler si T009 l'exige
- toast.tsx:46 sans `role='status'`/`aria-live` → a11y + ciblage e2e fragile ; hors WL (src/)
- lancer `npx playwright test e2e/dashboard/annulation.spec.ts` une fois stack 5183 + chromium 1243 présents
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
