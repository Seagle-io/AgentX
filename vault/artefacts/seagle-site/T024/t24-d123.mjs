// T024 : D1 og:url = canonical = URL courante après bascule ; D2 majuscules ; D3 slug inconnu + bascule
import { launch, open, state, summ } from "./lib.mjs"
const NAME = { fr:"Français", en:"English", es:"Español", de:"Deutsch", it:"Italiano" }
const toggle = async (page, l) => { await page.locator('button[aria-label*=":"]:visible').filter({ hasText: /^(FR|EN|ES|DE|IT)$/ }).first().click(); await page.waitForTimeout(250); await page.locator("button:visible", { hasText: NAME[l] }).first().click(); await page.waitForLoadState("networkidle"); await page.waitForTimeout(1200) }
const cases = [
  ["/DE/products", null, "/de/products", "de"], ["/De", null, "/de", "de"], ["/PRODUITS", null, "/produits", "fr"],
  ["/DE/Contact?X=1#F", null, "/de/contact?X=1#F", "de"], ["/IT/Services/Data-Analyse", null, "/it/services/data-analyse", "it"],
  ["/DE/products", "fr", "/produits", "fr"],
  ["/de/services/inconnu", "fr", "/services/inconnu", "fr"], ["/de/services/inconnu", "it", "/it/services/inconnu", "it"],
  ["/de/services/inconnu", "en", "/services/inconnu", "en"], ["/services/inconnu", "de", "/de/services/inconnu", "de"],
  ["/es/services/inconnu?q=1#h", "de", "/de/services/inconnu?q=1#h", "de"],
  ["/a-propos", "de", "/de/about", "de"], ["/de", "fr", "/", "fr"],
]
const b = await launch(); let ko = 0
for (const [u, t, exp, l] of cases) {
  const ctx = await b.newContext({ viewport:{width:1440,height:900}, locale:"fr-FR" })
  const { page, navs, errs } = await open(ctx, u)
  if (t) await toggle(page, t)
  const s = summ(await state(page))
  const ogu = await page.evaluate(() => document.querySelector('meta[property="og:url"]')?.content?.replace("https://seagle.io",""))
  const path = exp.split(/[?#]/)[0]
  const ok = s.url === exp && s.lang === l && s.canon === path && ogu === path && !errs.length
  if (!ok) ko++
  console.log(ok?"OK":"KO", u, t ? "toggle "+t : "", "→", s.url, "lang="+s.lang, "text="+s.tlang, "canon="+s.canon, "og:url="+ogu, "hl="+s.hl, errs.join("|"))
  await ctx.close()
}
await b.close(); console.log("t24 KO", ko)
