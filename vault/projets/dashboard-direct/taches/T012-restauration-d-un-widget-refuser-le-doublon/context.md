---
pack: T012
projet: dashboard-direct
role: implementeur
cree: 2026-10-06
---

# Pack T012 — Restauration d'un widget : refuser le doublon

> Seule source de vérité de l'agent T012. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Dans `dashboard-page.tsx` `removeCell` (:257-267), l'action « Annuler » du toast ne doit pas réinsérer la case si un widget du même type est déjà présent dans l'onglet (défaut D3+ de T011) ; même garde pour `removeTab` si l'onglet a été recréé avec le même id (no-op déjà en place, vérifier).

## Definition of Done
- [ ] `restore` de `removeCell` : no-op si `t.layout.some(c => c.i === id || c.widget === removed.widget)` ; sinon réinsertion inchangée
- [ ] si no-op parce que le widget est déjà là : `addToast({ title: 'Ce widget est déjà sur l’onglet' })` (variant neutre), pas d'erreur
- [ ] `npx tsc -b` → 0 ; `npx eslint src/modules/dashboard/dashboard-page.tsx` → 0 erreur ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | E | :257-267 removeCell, :223-236 removeTab |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/shared/ui/toast/toast.tsx` | L | `addToast` :20 |

## Contrats
```ts
// dashboard-page.tsx:257-267 actuel
const removeCell = (id: string) => {
  const tabId = activeTab?.id
  const removed = layout.find(c => c.i === id)
  if (!tabId || !removed) return
  setLayout(l => l.filter(c => c.i !== id))
  if (settingsFor === id) setSettingsFor(null)
  const restore = () => commit(d => d.map(t => t.id !== tabId || t.layout.some(c => c.i === id) ? t : { ...t, layout: [...t.layout, removed] }))
  addToast({ title: 'Widget retiré', action: { label: 'Annuler', onClick: restore } })
}
// D3+ (T011) : retirer la case clock → catalogue la repropose (:451 filtre onPage) → « + » clock (id neuf) → Annuler → 2 cases clock dans l'onglet, état que le catalogue interdit
```

## Décisions actées
- un widget par onglet (le catalogue filtre `onPage`) — code existant
- « Annuler » du toast restaure ce geste-là, sans écraser les gestes suivants — T009

## Hors périmètre
- Tout autre fichier ; D4+ (fenêtre de coalesce 1 s) accepté tel quel.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(npx tsc:*)`, `Bash(npx eslint:*)`, `Bash(rg:*)`, `Bash(git diff:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 40 lignes, sections exactes :

```markdown
---
tache: T012
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
