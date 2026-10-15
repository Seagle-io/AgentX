// Résumé contraste : agrège par (thème, couleur, fond) hors faux positifs image/canvas/ratio<1.35
import fs from "node:fs"
const f = process.argv[2]; const j = JSON.parse(fs.readFileSync(f, "utf8")).contrast
const agg = {}
for (const [k, list] of Object.entries(j)) { const [theme, page] = k.split(" "); for (const x of list) {
  if (x.img || x.canvasAncestor || x.ratio < 1.35) continue
  const key = `${theme} ${x.fg} on ${x.bg} px${x.px}`; (agg[key] ??= { n: 0, pages: new Set(), r: x.ratio, sel: x.sel, ex: x.ex }).n += x.n; agg[key].pages.add(page) } }
const rows = Object.entries(agg).sort((a, b) => a[1].r - b[1].r)
for (const [k, v] of rows) console.log(v.r, k, "n=" + v.n, "pages=" + v.pages.size, v.sel, JSON.stringify(v.ex))
console.log("total combos:", rows.length)
