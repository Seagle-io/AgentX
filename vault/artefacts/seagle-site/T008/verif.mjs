import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const B = "http://localhost:4403"
const cases = [
  ["fr", "/", "WebSite"], ["fr", "/a-propos", "AboutPage"], ["fr", "/contact", "ContactPage"],
  ["fr", "/produits", "ItemList"], ["fr", "/services", "ItemList"], ["fr", "/carrieres", null], ["en", "/about", "AboutPage"],
]
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
for (const [lng, path, type] of cases) {
  const ctx = await browser.newContext()
  await ctx.addInitScript(l => { localStorage.setItem("seagle-theme", "dark"); localStorage.setItem("i18nextLng", l) }, lng)
  const page = await ctx.newPage()
  await page.goto(B + path, { waitUntil: "networkidle" })
  await page.waitForTimeout(800)
  const all = await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => ({ id: s.id, txt: s.textContent })))
  const own = all.filter(s => s.id === "page-jsonld")
  let out = `${lng} ${path} ld+json=${all.length} page-jsonld=${own.length}`
  if (own.length) {
    const j = JSON.parse(own[0].txt)
    const urls = [...own[0].txt.matchAll(/"url":"([^"]+)"/g)].map(m => m[1])
    const badUrl = urls.filter(u => !u.startsWith("https://seagle.io"))
    const rawKey = /"[A-Z][A-Za-z]+\.[a-z][A-Za-z.-]+"/.test(own[0].txt)
    out += ` parse=OK @type=${j["@type"]} expect=${type} ${j["@type"] === type ? "OK" : "KO"} urls=${urls.length} badUrl=${badUrl.length} rawKey=${rawKey}`
    out += `\n  ${own[0].txt.slice(0, 400)}`
  } else out += ` expect=${type ?? "none"} ${type ? "KO" : "OK"}`
  console.log(out)
  await ctx.close()
}
await browser.close()
