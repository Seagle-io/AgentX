---
titre: Playwright getByRole name = sous-chaîne
resume: name:'X' matche par sous-chaîne insensible casse → strict mode violation ; exact:true
source: dashboard-direct T007 T010 T011
cree: 2026-10-06
tags: [note, playwright, e2e, piege]
---

# Playwright getByRole : name = sous-chaîne

## Fait
- `getByRole('button',{name:'Annuler'})` matche aussi `aria-label='Annuler la dernière action'` → `strict mode violation … resolved to 2 elements`
- correctif : `{ name: 'Annuler', exact: true }` (harnais : `count exact: 1 count substr: 2`)
- ou scoper : `container.getByRole(...)`
- `exact` casse si 2 toasts « Annuler » simultanés (`count exact 2 toasts: 2`)
- toast ortho-front : ∅ `role=status`/`aria-live` → ciblage par rôle impossible
- piège voisin : regex rg `\b` matche avant `-` (`dash-save\b` ≈ `dash-save-status`)

## Pourquoi ça compte
- test rouge dès que la stack tourne, invisible en tsc/lint

## Où
- `ortho-front/e2e/dashboard/annulation.spec.ts:35` — exact ; `:76` — Réessayer scopé
- `ortho-front/src/shared/ui/toast/toast.tsx:46-61` — action = `<Button>`

## Voir aussi
- [[ortho-front-dashboard-carte]]
- [[ortho-front-outillage]]
