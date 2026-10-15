import { launch, open, state, summ, B } from "./lib.mjs"
const b = await launch(); const out = []; let ko = 0
const log = (ok, ...a) => { if (!ok) ko++; console.log(ok?"OK":"KO", ...a) }
const check = (s, l) => s.url.startsWith(`/${l}`) && s.lang===l && s.tlang===l && s.canon===s.url.split(/[?#]/)[0] && s.og===({de:"de_DE"})[l]
// a) desktop menu + header + footer depuis /de
{
  const ctx = await b.newContext({ viewport:{width:1440,height:900}, locale:"fr-FR" })
  const menus = ["Leistungen","Lösungen","Tools","Unternehmen"]
  const targets = []
  for (const m of menus) {
    const { page } = await open(ctx, "/de")
    await page.locator("header button:visible", { hasText: m }).first().click(); await page.waitForTimeout(300)
    const hrefs = await page.evaluate(() => [...document.querySelectorAll("header a")].filter(a=>a.offsetParent!==null).map(a=>a.getAttribute("href")))
    for (const h of hrefs) if (h.startsWith("/") && !targets.some(t=>t[1]===h&&t[0]===m)) targets.push([m,h])
    await page.close()
  }
  const { page: p0 } = await open(ctx, "/de")
  const foot = await p0.evaluate(() => [...document.querySelectorAll("footer a")].map(a=>a.getAttribute("href")).filter(h=>h.startsWith("/")))
  await p0.close()
  for (const h of new Set(foot)) targets.push(["footer",h])
  for (const [m,h] of targets) {
    const { page, navs, errs } = await open(ctx, "/de")
    if (m==="footer") await page.locator(`footer a[href="${h}"]`).first().click()
    else { await page.locator("header button:visible", { hasText: m }).first().click(); await page.waitForTimeout(300); await page.locator(`header a[href="${h}"]:visible`).first().click() }
    await page.waitForLoadState("networkidle"); await page.waitForTimeout(600)
    const s = summ(await state(page))
    log(check(s,"de") && !errs.length, "desk", m, h, "→", s.url, s.lang, s.og, "text="+s.tlang, "canon="+s.canon, "hl="+s.hl, "navs="+navs.length, errs.join("|"))
    await page.close()
  }
  await ctx.close()
}
// b) tiroir mobile
{
  const ctx = await b.newContext({ viewport:{width:390,height:844}, locale:"fr-FR", isMobile:true, hasTouch:true })
  const { page: p0 } = await open(ctx, "/de")
  await p0.locator('button[aria-label="Toggle menu"]:visible').click(); await p0.waitForTimeout(500)
  const hrefs = await p0.evaluate(() => [...document.querySelectorAll("a")].filter(a=>a.offsetParent!==null && !a.closest("footer") && a.getBoundingClientRect().height>0).map(a=>a.getAttribute("href")+"|"+a.textContent.trim().slice(0,15)))
  console.log("drawer", hrefs.join(" · ")); await p0.close()
  for (const h of [...new Set(hrefs.map(x=>x.split("|")[0]))].filter(h=>h.startsWith("/"))) {
    const { page, navs, errs } = await open(ctx, "/de")
    await page.locator('button[aria-label="Toggle menu"]:visible').click(); await page.waitForTimeout(500)
    await page.locator(`a[href="${h}"]:visible`).first().click()
    await page.waitForLoadState("networkidle"); await page.waitForTimeout(600)
    const s = summ(await state(page))
    log(check(s,"de") && !errs.length, "mobile", h, "→", s.url, s.lang, "text="+s.tlang, "navs="+navs.length, errs.join("|"))
    await page.close()
  }
  await ctx.close()
}
await b.close(); console.log("t3 KO", ko)
