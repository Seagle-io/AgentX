# pipeline — jauges par statut

Module sans route. `component/PipelinePanel.tsx` (export défaut, props `{}`) :
7 `Gauge vertical` (ratio = n / max).
`script/select.ts` : `selectPipeline(s) → { bars }`. i18n ns `pipeline`
(`k.<statut>` avec repli clé brute). Tests : `tests/select.ts` (env node).
