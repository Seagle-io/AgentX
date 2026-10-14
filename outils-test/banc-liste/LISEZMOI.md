# banc-liste

    node banc.mjs --dist <dist> --api <api.mjs> --out <préfixe> [--scenario <scenario.mjs>] [--chemin /exercises]
- `dist` : front buildé, servi par `page.route` (origine `http://banc.liste`, aucun serveur) ; route inconnue → `index.html`
- `api.mjs` : `export const api = pathname => undefined | { json } | { status } | { path }` (path relatif = dossier banc-impression)
- `scenario.mjs` : `export default async ({ page, out, log, errs, origine })` ; sans scénario → `<préfixe>-probe.png` + texte de la page
- `--out` relatif → `/tmp/banc-sorties/<préfixe>` ; stdout du scénario puis `errs [...]`
- exemple (T270, filtres conservés après impression) : `cd projets/orthoworkspace && node ../../banc.mjs --dist <dist> --api liste-api.mjs --chemin /exercises --out t270/apres --scenario liste-filtres.mjs`
