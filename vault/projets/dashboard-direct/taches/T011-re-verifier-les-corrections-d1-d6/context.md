---
pack: T011
projet: dashboard-direct
role: verificateur
cree: 2026-10-06
---

# Pack T011 — Re-vérifier les corrections D1-D6

> Seule source de vérité de l'agent T011. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rejouer les six repros de T007 contre les corrections T009/T010, et chercher ce que les corrections ont cassé. Verdict `CONFORME` / `DÉFAUTS` / `NON VÉRIFIABLE`.

## Definition of Done
- [ ] D1 : rg `name: 'Annuler'` e2e/dashboard → chaque occurrence `exact: true` ou scoped ; harnais Playwright de T007 (`scratchpad/pw/role.spec.ts`) rejoué si présent
- [ ] D2 : harnais `scratchpad/hook/repro.test.mjs` test A → `PUTs: 0` ; + variante : changement réel → `PUTs: 1`
- [ ] D3 : lecture `dashboard-page.tsx` removeCell/removeTab → l'action du toast restaure l'élément retiré, pas `undo` global ; scénario « retirer A, bouger B, Annuler » raisonné ligne par ligne
- [ ] D4 : `moveTab` coalesce → lecture + `edit-history.core.ts` `COALESCE_WINDOW_MS`
- [ ] D5 : succès → `error === null` (harnais test B)
- [ ] D6 : removeTab actif + Annuler → `selectTab` de l'onglet restauré
- [ ] régressions : `npx tsc -b` · `npx tsc -p tsconfig.e2e.json` · `npx eslint src/modules/dashboard e2e/dashboard` · `PATH=~/.nvm/versions/node/v24.15.0/bin:$PATH npm run test:unit` · `npm run build` → sorties collées
- [ ] e2e Playwright : seulement si `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5183` ≠ 000 ; sinon `NV — stack absente`
- [ ] `result.md` : verdict en tête

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/dashboard-direct/taches/T007-casser-la-manipulation-directe/result.md` | L | les 6 repros |
| `vault/projets/dashboard-direct/taches/T009-corriger-auto-save-toast-annuler-cible-coalesce-/result.md` | L | affirmations à rejouer |
| `vault/projets/dashboard-direct/taches/T010-corriger-la-spec-annulation-selecteur-annuler-ex/result.md` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/use-layout-autosave.ts` | L | D2 D5 |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | L | D3 D4 D6 |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/tab-bar.tsx` | L | D4 |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-history.core.ts` | L | coalesce |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/autosave.core.test.ts` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/` | L | 4 specs |
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/d4a2126e-085a-48b3-92aa-2bb44b582a4a/scratchpad/` | E | harnais T007 (pw/, hook/) ; tu peux les adapter |

## Contrats
Repros T007 (verbatim) :
```
D1 annulation.spec.ts:35 — getByRole('button',{name:'Annuler'}) sous-chaîne → 2 éléments (dash-undo aria-label 'Annuler la dernière action' + toast) → strict mode violation
D2 use-layout-autosave.ts — lastSent null → 1er schedule/flush part en PUT sans changement ; harnais hook test A → PUTs: 1 (attendu 0)
D3 dashboard-page.tsx removeCell/removeTab — Annuler du toast = undo global → retirer A, ArrowRight B, Annuler → B recule, A reste retiré
D4 tab-bar.tsx onTabDragOver + moveTab — 1 pas d'historique par dragover réordonnant → [A,B,C] glisser A au-delà de B puis C → 1 Ctrl+Z = [B,A,C]
D5 use-layout-autosave.ts — error non remis à null après succès
D6 dashboard-page.tsx removeTab — onglet actif supprimé puis Annuler → non resélectionné
```
Harnais hook : `FAKE=<scratchpad>/hook/fake-react.mjs HOOK=<ortho-front>/src/modules/dashboard/components/use-layout-autosave.ts node --import <scratchpad>/hook/register.mjs --test <scratchpad>/hook/repro.test.mjs`

## Décisions actées
- tu ne corriges rien — rôle
- un test vert sans sortie collée = non vérifié = défaut

## Hors périmètre
- Lancer la stack e2e ; `npx playwright install`.

## Budget
- Lectures hors whitelist : **5 maximum**, journalisées dans `## Écarts`.
- Outils autorisés : Read, Grep, Glob, Write (scratchpad, result.md), `Bash(npx tsc:*)`, `Bash(npx eslint:*)`, `Bash(npm run build:*)`, `Bash(npm run test:unit:*)`, `Bash(npx playwright test:*)`, `Bash(node --import:*)`, `Bash(node --test:*)`, `Bash(rg:*)`, `Bash(curl -s:*)`, `Bash(git diff:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 80 lignes, sections exactes :

```markdown
---
tache: T011
statut: fait | bloque
---
## Livré
VERDICT: CONFORME | DÉFAUTS | NON VÉRIFIABLE
- D1…D6 : CORRIGÉ (preuve) | PERSISTE (repro) ; Dn+ nouveaux défauts fichier:ligne — scénario — repro
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
