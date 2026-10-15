import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const B = "http://localhost:4423"
const LOC = { "index-wrQ7AnnA.js": "fr", "index-DWnRCt51.js": "en", "index-CX6jW941.js": "de", "index-BFFoC9iq.js": "es", "index-DNebYSPw.js": "it" }
const FR = "index-wrQ7AnnA.js", DE = "index-CX6jW941.js"
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
async function run(label, path, { ls = "fr", abort, locale = "fr-FR", prerender, lsOnce, switchDe, abortAfter } = {}) {
  const ctx = await browser.newContext({ locale, viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(([v, once]) => {
    localStorage.setItem("seagle-theme", "dark")
    if (v === null) return
    if (once && sessionStorage.getItem("x")) return
    localStorage.setItem("i18nextLng", v); sessionStorage.setItem("x", "1")
  }, [ls, !!lsOnce])
  const page = await ctx.newPage()
  const errs = [], locs = []; let docs = 0
  page.on("pageerror", e => errs.push(e.message.slice(0, 80)))
  page.on("domcontentloaded", () => docs++) // 1 par document chargé (≠ pushState)
  page.on("request", r => { const f = r.url().split("/").pop(); if (LOC[f]) locs.push(LOC[f]) })
  // HTML prérendu simulé : marqueur h1 dans #root (dist T023 non prérendu)
  if (prerender) await page.route(u => u.origin === B && !u.pathname.startsWith("/assets/") && !/\.\w+$/.test(u.pathname), async r => {
    const res = await r.fetch(); const body = (await res.text()).replace('<div id="root"></div>', '<div id="root"><h1>PRERENDU</h1></div>')
    await r.fulfill({ response: res, body })
  })
  if (abort) await page.route(u => abort.some(a => u.href.endsWith(a)), r => r.abort())
  await page.goto(B + path, { waitUntil: "load" })
  await page.waitForTimeout(3000)
  const state = () => page.evaluate(() => {
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(s => { try { const j = JSON.parse(s.textContent); return [j, ...(j["@graph"] || [])] } catch { return [] } })
    return {
      h1: [...document.querySelectorAll("#root h1")].map(h => h.textContent.replace(/\s+/g, " ").trim()).join(" || ").slice(0, 50),
      lang: document.documentElement.lang, mounted: document.documentElement.classList.contains("app-mounted"),
      ls: localStorage.getItem("i18nextLng"), inLanguage: ld.filter(j => j["@type"] === "WebSite").map(j => j.inLanguage).join(","),
    }
  })
  let r = await state()
  let extra = ""
  if (switchDe) {
    if (abortAfter) await page.route(u => u.href.endsWith(DE), x => x.abort())
    await page.locator('header button[aria-label^="Langue"]').first().click(); await page.waitForTimeout(300)
    await page.locator("header button", { hasText: /^Deutsch$/ }).first().click(); await page.waitForTimeout(2500)
    extra = " after-switch=" + JSON.stringify({ ...(await state()), url: new URL(page.url()).pathname })
  }
  console.log(label, path, JSON.stringify(r), "reloads=", docs - 1, "locales=", [...new Set(locs)].join(","), "pageerror=", errs.length, errs.join("|"), extra)
  await ctx.close()
}
await run("D1 abort fr", "/", { abort: [FR], prerender: true })
await run("D1 abort de+fr", "/de/products/", { abort: [DE, FR], prerender: true })
await run("D1b abort de", "/de/products/", { abort: [DE], prerender: true })
await run("D2 ls=xx nav=fr", "/", { ls: "xx" })
await run("D2 ls=xx nav=de", "/", { ls: "xx", locale: "de-DE" })
await run("D2 ls=xx nav=ja", "/", { ls: "xx", locale: "ja-JP" })
await run("D3 ls='' nav=de", "/", { ls: "", locale: "de-DE", lsOnce: true })
await run("D3 ls=null nav=de", "/", { ls: null, locale: "de-DE" })
await run("D3b ls=de-DE nav=fr", "/", { ls: "de-DE" })
await run("D3b ls=DE nav=fr", "/", { ls: "DE" })
await run("D3b ls=it-CH nav=fr", "/", { ls: "it-CH" })
await run("D2b ls=xx-YY nav=fr", "/", { ls: "xx-YY" })
await run("nav=es-MX no-ls", "/", { ls: null, locale: "es-MX" })
for (const l of ["fr", "en", "es", "de", "it"]) await run(`ok ls=${l}`, "/", { ls: l })
await run("ok", "/de/products/", { prerender: true })
await run("switch fr->de", "/", { switchDe: true })
await run("obs switch abort de", "/", { switchDe: true, abortAfter: true })
await browser.close()
