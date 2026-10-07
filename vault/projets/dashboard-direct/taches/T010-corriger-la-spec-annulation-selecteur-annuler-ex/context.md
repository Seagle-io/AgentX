---
pack: T010
projet: dashboard-direct
role: implementeur
cree: 2026-10-06
---

# Pack T010 — Corriger la spec annulation : sélecteur Annuler exact

> Seule source de vérité de l'agent T010. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger D1 (T007) dans `e2e/dashboard/annulation.spec.ts` : le bouton « Annuler » du toast doit être ciblé sans ambiguïté avec `dash-undo` (`aria-label='Annuler la dernière action'`) ; vérifier le même piège dans les 3 autres specs.

## Definition of Done
- [ ] `annulation.spec.ts:35` (et toute autre occurrence) : `getByRole('button', { name: 'Annuler', exact: true })` ou ciblage dans le toast (`getByRole('status')`/`[role=alert]` selon `toast.tsx:40-60`) — ∅ strict mode violation possible
- [ ] rg `name: 'Annuler'` e2e/dashboard → toutes exactes ; rg `getByRole\('button', \{ name: '(Réessayer|Ajouter)` → idem si ambiguïté avec un aria-label
- [ ] D3/D6 côté specs : le scénario « retirer + Annuler » reste valable une fois l'annulation ciblée sur le geste (T009) : la case retirée revient, `data-x` des autres inchangé
- [ ] `npx tsc -p tsconfig.e2e.json` → 0 ; `npx eslint e2e/dashboard` → 0 erreur ; sorties collées ; exécution Playwright : seulement si `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5183` ≠ 000, sinon `NV — stack absente`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/annulation.spec.ts` | E | D1 :35 |
| `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/ajout-widget.spec.ts` | E | même piège ? |
| `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/deplacement.spec.ts` | E | |
| `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/persistance.spec.ts` | E | |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/shared/ui/toast/toast.tsx` | L | :40-60 rôle ARIA du toast, bouton :53 |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/tab-bar.tsx` | L | :220 dash-undo aria-label |
| `vault/projets/dashboard-direct/taches/T007-casser-la-manipulation-directe/result.md` | L | D1 repro |

## Contrats
```
D1 e2e/dashboard/annulation.spec.ts:35 — getByRole('button',{name:'Annuler'}) = sous-chaîne → matche aussi dash-undo aria-label='Annuler la dernière action' (tab-bar.tsx:220) + bouton du toast (toast.tsx:53) → strict mode violation. Correctif : exact: true.
Playwright attend chromium 1243, seul 1234 installé (NV exécution) — ne pas installer, signaler.
```

## Décisions actées
- plus de mode édition ; auto-save ; toast « Annuler » cible le geste (T009 en parallèle) — projet

## Hors périmètre
- Tout fichier `src/` ; lancer la stack ; `npx playwright install`.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(npx tsc:*)`, `Bash(npx eslint:*)`, `Bash(npx playwright test:*)`, `Bash(rg:*)`, `Bash(curl -s:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T010
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
