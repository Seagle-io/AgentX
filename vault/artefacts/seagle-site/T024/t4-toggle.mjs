import { launch, open, state, summ } from "./lib.mjs"
const b = await launch(); let ko = 0
const log = (ok, ...a) => { if (!ok) ko++; console.log(ok?"OK":"KO", ...a) }
const NAME = { fr:"Français", en:"English", es:"Español", de:"Deutsch", it:"Italiano" }
const toggle = async (page, l) => { await page.locator('button[aria-label*=":"]:visible').filter({ hasText: /^(FR|EN|ES|DE|IT)$/ }).first().click(); await page.waitForTimeout(250); await page.locator("button:visible", { hasText: NAME[l] }).first().click(); await page.waitForLoadState("networkidle"); await page.waitForTimeout(700) }
// [page, expected per lang]
const P = [
  ["/de", { fr:"/", en:"/", es:"/es", de:"/de", it:"/it" }],
  ["/de/products", { fr:"/produits", en:"/products", es:"/es/products", de:"/de/products", it:"/it/products" }],
  ["/contact", { fr:"/contact", en:"/contact", es:"/es/contact", de:"/de/contact", it:"/it/contact" }],
  ["/a-propos", { fr:"/a-propos", en:"/about", es:"/es/about", de:"/de/about", it:"/it/about" }],
  ["/it/services/data-analyse", { fr:"/services/data-analyse", en:"/services/data-analyse", es:"/es/services/data-analyse", de:"/de/services/data-analyse", it:"/it/services/data-analyse" }],
  ["/de/contact?x=1#f", { fr:"/contact?x=1#f", en:"/contact?x=1#f", es:"/es/contact?x=1#f", de:"/de/contact?x=1#f", it:"/it/contact?x=1#f" }],
]
for (const [u, exp] of P) for (const l of ["fr","en","es","de","it"]) {
  const ctx = await b.newContext({ viewport:{width:1440,height:900}, locale:"fr-FR" })
  const { page, navs, errs } = await open(ctx, u); const n0 = navs.length
  await toggle(page, l); await page.waitForTimeout(800)
  const s = summ(await state(page))
  const ok = s.url===exp[l] && s.lang===l && s.tlang===l && s.canon===exp[l].split(/[?#]/)[0] && !errs.length
  log(ok, "toggle", u, "→", l, ":", s.url, s.lang, "text="+s.tlang, "canon="+s.canon, "hl="+s.hl, "navs+"+(navs.length-n0), errs.join("|"))
  await ctx.close()
}
// back x3
{
  const ctx = await b.newContext({ viewport:{width:1440,height:900}, locale:"fr-FR" })
  const { page, navs, errs } = await open(ctx, "/de")
  const click = async h => { await page.locator(`footer a[href="${h}"]`).first().click(); await page.waitForLoadState("networkidle"); await page.waitForTimeout(700) }
  await click("/de/about"); await toggle(page, "fr"); await click("/contact"); await toggle(page, "it"); await click("/it/products")
  const seq = [summ(await state(page))]
  const hist0 = await page.evaluate(()=>history.length)
  for (let i=0;i<4;i++) { await page.goBack(); await page.waitForTimeout(1200); seq.push(summ(await state(page))) }
  const n1 = navs.length; await page.waitForTimeout(2500); const n2 = navs.length
  console.log("back seq", seq.map(s=>`${s.url}[${s.lang}/${s.tlang}]`).join(" ← "), "hist", hist0, "navs total", navs.length, "idle+", n2-n1, errs.join("|"))
  console.log("navs", navs.join(" "))
  await ctx.close()
}
await b.close(); console.log("t4 KO", ko)
