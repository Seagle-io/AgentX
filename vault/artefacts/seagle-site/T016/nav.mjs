import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"

const BASE = "http://localhost:4416"
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
const errors = []
let fails = 0

const newPage = async (lng, viewport = { width: 1440, height: 900 }) => {
  const ctx = await browser.newContext({ viewport })
  await ctx.addInitScript(l => { localStorage.setItem("seagle-theme", "dark"); localStorage.setItem("i18nextLng", l) }, lng)
  const page = await ctx.newPage()
  page.on("pageerror", e => errors.push(`${page.url()} ${e.message}`))
  return page
}
const settle = page => page.waitForFunction(() => document.documentElement.classList.contains("app-mounted") || document.querySelector("#footer"), null, { timeout: 15000 }).then(() => page.waitForTimeout(400))
const check = async (page, label, prefixOk) => {
  const path = new URL(page.url()).pathname
  const lang = await page.evaluate(() => document.documentElement.lang)
  const ok = prefixOk(path, lang)
  if (!ok) fails++
  console.log(`${ok ? "OK" : "KO"} ${label} → ${path} lang=${lang}`)
}

const footerLink = (page, i) => page.locator("#footer a[href^='/']").nth(i)
// Ordre footer.tsx : about, career, services, contact, booking, kora, securePass, aisio, leefEditor, products, lab
const FOOTER = { about: 1, services: 3, contact: 4, products: 10, lab: 11 } // 0 = logo

for (const [start, lng, prefixOk, expectLang] of [
  ["/de", "de", p => p.startsWith("/de"), "de"],
  ["/produits", "fr", p => !/^\/(en|es|de|it)(\/|$)/.test(p) && !["/products", "/about", "/careers"].includes(p), "fr"],
]) {
  const ok = (p, l) => prefixOk(p) && l === expectLang
  const page = await newPage(lng)
  const go = async () => { await page.goto(BASE + start); await settle(page) }

  await go()
  const trigger = page.locator("nav button[aria-controls='mega-menu-1']")
  await trigger.click()
  await page.locator("#mega-menu-1 a").first().click()
  await page.waitForURL(u => u.pathname.includes("/services/")); await settle(page)
  await check(page, `${start} menu Services[0]`, ok)

  for (const [name, i] of Object.entries(FOOTER)) {
    await go()
    await footerLink(page, i).click()
    await page.waitForTimeout(800); await settle(page)
    await check(page, `${start} footer ${name}`, ok)
  }

  // Toutes les ancres internes des pages modifiées suivent la langue
  for (const p of lng === "de" ? ["/de", "/de/products", "/de/services/built-application", "/de/docs"] : ["/produits", "/services/built-application", "/docs"]) {
    await page.goto(BASE + p); await settle(page)
    const hrefs = await page.$$eval("a[href^='/']", as => as.map(a => a.getAttribute("href")))
    const bad = hrefs.filter(h => !prefixOk(h.split(/[?#]/)[0]))
    if (bad.length) fails++
    console.log(`${bad.length ? "KO" : "OK"} ${p}→${new URL(page.url()).pathname} ${hrefs.length} liens internes, hors langue: ${JSON.stringify(bad)}`)
  }
  await page.context().close()

  // Tiroir mobile
  const m = await newPage(lng, { width: 390, height: 844 })
  await m.goto(BASE + start); await settle(m)
  await m.locator("button[aria-controls='mobile-drawer']").click()
  const drawer = await m.$$eval("#mobile-drawer a[href^='/']", as => as.map(a => `${a.textContent.trim()}=${a.getAttribute("href")}`))
  console.log(`mobile ${start}: ${drawer.join(" | ")}`)
  await m.locator("#mobile-drawer a[href^='/']").nth(2).click()
  await m.waitForTimeout(800); await settle(m)
  await check(m, `${start} mobile[2]`, ok)
  await m.context().close()
}

// IMMERSIVE : force-dark sur /de/starry-night et /nuit-etoilee
for (const p of ["/nuit-etoilee", "/de/starry-night", "/de"]) {
  const page = await newPage(p.startsWith("/de") ? "de" : "fr")
  await page.goto(BASE + p); await settle(page)
  const dark = await page.$eval("header", h => h.classList.contains("force-dark"))
  const want = p !== "/de"
  if (dark !== want) fails++
  console.log(`${dark === want ? "OK" : "KO"} header force-dark ${p} = ${dark}`)
  await page.context().close()
}

console.log(`pageerror: ${errors.length}${errors.length ? "\n" + errors.join("\n") : ""}`)
console.log(`KO: ${fails}`)
await browser.close()
process.exit(fails || errors.length ? 1 : 0)
