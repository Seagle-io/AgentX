# pipeline — jauges par statut + seuils

Module sans route. `component/PipelinePanel.tsx` (export défaut, props `{}`) :
7 `Gauge vertical` (ratio = n / max) + seuils DUR/SOUPLE avec ✓/✗.
`script/select.ts` : `selectPipeline(s) → { bars, seuils }`. i18n ns `pipeline`
(`k.<statut>` avec repli clé brute). Tests : `tests/select.ts` (env node).
