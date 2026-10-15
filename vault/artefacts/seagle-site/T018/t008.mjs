import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const B = "http://localhost:4173"
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
const ctx = await browser.newContext()
const page = await ctx.newPage()
const errs = []
page.on("pageerror", e => errs.push(e.message.slice(0, 80)))
const state = async (label) => {
  await page.waitForTimeout(1500)
  const r = await page.evaluate(() => {
    const s = [...document.querySelectorAll('script[type="application/ld+json"]')]
    const p = [...document.querySelectorAll("script#page-jsonld")]
    let t = p.map(x => { try { const j = JSON.parse(x.textContent); return (j["@type"] || "graph") + ":" + (j.url || "") + (j.inLanguage ? ":" + j.inLanguage : "") } catch { return "PARSE-KO" } })
    return { path: location.pathname, ldjson: s.length, pageJsonld: p.length, types: t, canon: document.querySelector('link[rel=canonical]')?.href }
  })
  console.log(label.padEnd(26), JSON.stringify(r))
}
const clickHref = async (href) => {
  const ok = await page.evaluate(h => { const a = document.querySelector(`a[href="${h}"]`); if (!a) return false; a.click(); return true }, href)
  if (!ok) console.log("  no link", href)
}
await page.goto(B + "/a-propos/"); await state("load /a-propos/ (hydr.)")
await clickHref("/contact"); await state("click → /contact")
await clickHref("/carrieres"); await state("click → /carrieres")
await clickHref("/produits"); await state("click → /produits")
await clickHref("/"); await state("click → /")
await clickHref("/a-propos"); await state("click → /a-propos")
await page.goBack(); await state("back → /")
await page.goBack(); await state("back → /produits")
await page.goBack(); await state("back → /carrieres")
await clickHref("/lab"); await state("click → /lab")
await clickHref("/agentx"); await state("click → /agentx")
await clickHref("/la-joconde"); await state("click → /la-joconde")
for (const p of ["/", "/a-propos/", "/contact/", "/produits/", "/carrieres/", "/de/", "/about/"]) { await page.goto(B + p); await state("load " + p) }
console.log("pageerror=", errs.length, errs.join("|"))
// ls=xx inLanguage
const c2 = await browser.newContext(); await c2.addInitScript(() => localStorage.setItem("i18nextLng", "xx"))
const p2 = await c2.newPage(); await p2.goto(B + "/"); await p2.waitForTimeout(2000)
console.log("ls=xx / page-jsonld=", await p2.evaluate(() => document.getElementById("page-jsonld")?.textContent.slice(0, 200)))
await browser.close()
