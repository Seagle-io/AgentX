import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"

const BASE = "http://localhost:4404"
const OUT = "/home/jdrac/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T009"
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
const errors = []

for (const lang of ["fr", "en"]) {
  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    await ctx.addInitScript(([th, lg]) => {
      localStorage.setItem("seagle-theme", th)
      localStorage.setItem("i18nextLng", lg)
    }, [theme, lang])
    const page = await ctx.newPage()
    page.on("pageerror", e => errors.push(`${lang}/${theme}: ${e.message}`))
    await page.goto(`${BASE}/lab`, { waitUntil: "networkidle" })
    await page.waitForTimeout(1500)
    const h1 = (await page.locator("h1").allTextContents()).map(s => s.replace(/\s+/g, " ").trim()).join(" | ")
    const title = await page.title()
    const hrefs = await page.locator("main a[href], section a[href]").evaluateAll(as =>
      [...new Set(as.map(a => a.getAttribute("href")))])
    const demoLinks = hrefs.filter(h => /nuit-etoilee|starry-night|creation|grande-vague|great-wave|joconde|mona-lisa/.test(h))
    const statuses = []
    for (const h of demoLinks) statuses.push(`${h}=${(await page.request.get(BASE + h)).status()}`)
    const label = await page.getByText(lang === "fr" ? "Les autres démos" : "The other demos").count()
    await page.screenshot({ path: `${OUT}/lab-${lang}-${theme}.png`, fullPage: true })
    // lien du pied de page
    const footLab = page.locator("footer a", { hasText: /^Lab$/ })
    const footCount = await footLab.count()
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" })
    await page.locator("footer a", { hasText: /^Lab$/ }).click()
    await page.waitForURL("**/lab")
    console.log(`${lang}/${theme} | title="${title}" | h1="${h1}" | demos=${demoLinks.length} [${statuses.join(" ")}] | label=${label} | footerLab=${footCount} → ${new URL(page.url()).pathname}`)
    await ctx.close()
  }
}

// régression : /la-joconde garde 3 cartes et l'étiquette
const ctx = await browser.newContext()
await ctx.addInitScript(() => localStorage.setItem("i18nextLng", "fr"))
const page = await ctx.newPage()
await page.goto(`${BASE}/la-joconde`, { waitUntil: "networkidle" })
const cards = await page.locator("section a[href]").evaluateAll(as =>
  as.map(a => a.getAttribute("href")).filter(h => /nuit-etoilee|creation|grande-vague|joconde/.test(h)))
const label = await page.getByText("Les autres démos").count()
await page.getByText("Les autres démos").scrollIntoViewIfNeeded()
await page.waitForTimeout(1200)
await page.screenshot({ path: `${OUT}/la-joconde-nav.png` })
console.log(`/la-joconde | cards=${cards.length} [${cards.join(" ")}] | label=${label}`)
console.log(`pageerrors=${errors.length}${errors.length ? " " + errors.join(" ; ") : ""}`)
await browser.close()
