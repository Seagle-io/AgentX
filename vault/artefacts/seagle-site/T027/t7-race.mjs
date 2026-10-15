import { launch, open, state, summ } from "./lib.mjs"
const b = await launch()
const NAME = { fr:"Français", en:"English", es:"Español", de:"Deutsch", it:"Italiano" }
const tg = async (page, l, wait=0) => { await page.locator('button[aria-label*=":"]:visible').filter({ hasText: /^(FR|EN|ES|DE|IT)$/ }).first().click(); await page.locator("button:visible", { hasText: NAME[l] }).first().click(); if (wait) await page.waitForTimeout(wait) }
const ctx = await b.newContext({ viewport:{width:1440,height:900}, locale:"fr-FR" })
// rapid toggles
{ const { page, navs, errs } = await open(ctx, "/a-propos")
  await tg(page,"de"); await tg(page,"it"); await tg(page,"en"); await tg(page,"es"); await page.waitForTimeout(2000)
  const s = summ(await state(page)); console.log("rapid fr→de→it→en→es", s.url, s.lang, s.tlang, "navs", navs.join(" "), errs.join("|"))
  await page.goBack(); await page.waitForTimeout(1500); const s2 = summ(await state(page)); console.log(" back", s2.url||"(blank)", s2.lang); await page.close() }
{ const ctx = await b.newContext({ viewport:{width:1440,height:900}, locale:"fr-FR" })
// shared URL in history + forward/back
{ const { page, navs, errs } = await open(ctx, "/contact")
  await page.locator('footer a[href="/produits"]').click(); await page.waitForTimeout(800)
  await tg(page,"de",1200)
  const seq=[]; for (const dir of ["back","forward","back","back"]) { dir==="back"?await page.goBack():await page.goForward(); await page.waitForTimeout(1300); const s=summ(await state(page)); seq.push(`${dir}:${s.url}[${s.lang}/${s.tlang}]`) }
  const n=navs.length; await page.waitForTimeout(2000)
  console.log("shared hist", seq.join(" "), "navs", navs.join(" "), "idle+", navs.length-n, errs.join("|")); await page.close() }
}
// back link on unknown service
{ const { page } = await open(ctx, "/de/services/inconnu")
  console.log("unknown back href", await page.evaluate(()=>[...document.querySelectorAll("main a")].map(a=>a.getAttribute("href")).join(","))); await page.close() }
await b.close()
