import { launch, open, state, summ } from "./lib.mjs"
const b = await launch()
const cases = [
  ["/de/"],["/DE/products"],["/De"],["/de/produits"],["/de/services/inconnu"],["/services/inconnu"],["/fr"],["/en/products"],["/en"],
  ["/de/contact?x=1#f"],["/contact?x=1#f",{storage:"de"}],["/de/products/"],["/de//products"],["/es/services"],["/de/lab/x"],["/de/docs"],["/de/preview"],
  ["/",{storage:"de"}],["/contact",{storage:"it"}],["/produits",{storage:"de"}],["/services/data-analyse",{storage:"es"}],
  ["/",{nav:"de-AT"}],["/about",{nav:"de-DE"}],["/",{storage:"xx"}],["/",{storage:"de-DE"}],["/es/about",{storage:"en"}],
  ["/de/services/inconnu",{toggle:"fr"}],["/DE/products",{toggle:"fr"}],
]
const NAME = { fr:"Français", en:"English", es:"Español", de:"Deutsch", it:"Italiano" }
for (const [u, o={}] of cases) {
  const ctx = await b.newContext({ viewport:{width:1440,height:900}, locale: o.nav ?? "fr-FR" })
  const { page, navs, errs } = await open(ctx, u, o)
  if (o.toggle) { await page.locator('button[aria-label*=":"]:visible').filter({ hasText: /^(FR|EN|ES|DE|IT)$/ }).first().click(); await page.waitForTimeout(250); await page.locator("button:visible", { hasText: NAME[o.toggle] }).first().click(); await page.waitForTimeout(1200) }
  const n1 = navs.length; await page.waitForTimeout(1500)
  const s = summ(await state(page))
  const ls = await page.evaluate(()=>localStorage.getItem("i18nextLng"))
  const h1 = await page.evaluate(()=>document.querySelector("h1")?.innerText.slice(0,40))
  console.log(JSON.stringify(u), JSON.stringify(o), "→", s.url, "lang="+s.lang, "text="+s.tlang, "og="+s.og, "canon="+s.canon, "hl="+s.hl, "body="+s.bodyLen, "h1="+JSON.stringify(h1), "ls="+ls, "navs="+navs.length+(navs.length!==n1?"(+idle)":""), errs.join("|"))
  await ctx.close()
}
await b.close()
