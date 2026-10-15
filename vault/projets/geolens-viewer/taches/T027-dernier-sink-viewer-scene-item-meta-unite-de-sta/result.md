---
tache: T027
statut: fait
---
## Livré
- G/web/src/viewer/main.ts:4863 — `s.unit` → `escapeHTML(String(s.unit))`
- G/web/src/viewer/main.ts:8641 — `metaBits.join` enveloppé dans `escapeHTML`
## Vérifié comment
```
rg -n '\$\{metaBits\.join|\$\{s\.unit\}' web/src/viewer/main.ts → ∅ (exit 1)
wc -l web/src/viewer/main.ts → 9405 web/src/viewer/main.ts
git log -1 --format=%h → ad370d1
git diff --stat -- web →
 web/src/viewer/main.ts | 4 ++--
 1 file changed, 2 insertions(+), 2 deletions(-)
npm --prefix web run typecheck → tsc --noEmit -p tsconfig.json ; exit 0
npm --prefix web run build:viewer-types → tsc --noEmit -p tsconfig.viewer.json ; exit 0
npm --prefix web test →
 Test Files  176 passed (176)
      Tests  1691 passed (1691)
 exit 0
```
## Écarts
- ∅
## Pour la suite
- main.ts:8638 `${icon}` non échappé — map interne `DELIVERABLE_ICONS` ou '📁', HP
- main.ts:8630 `resolution.width/height` désormais échappés via join — si non-number, plus de XSS
- 0 test unitaire sur rendu main.ts — repro T026 NV en navigateur
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
- Contrat :8622-8641 omettait lignes orientation :8628-8629 — sans impact
