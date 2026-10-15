import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const BASE = process.env.BASE ?? "http://localhost:4408"
const tag = process.argv[2] // avant | apres
const dir = new URL(".", import.meta.url).pathname
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
for (const theme of ["light", "dark"]) {
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } })
  await c.addInitScript(t => { localStorage.setItem("seagle-theme", t); localStorage.setItem("i18nextLng", "fr") }, theme)
  const p = await c.newPage()
  for (const u of ["/", "/contact", "/rendez-vous", "/services/infrastructure"]) {
    await p.goto(BASE + u); await p.waitForLoadState("networkidle").catch(() => {})
    for (let y = 0; y < 8000; y += 900) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(120) }
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(800)
    const name = (u === "/" ? "home" : u.slice(1).replace(/\//g, "-"))
    await p.screenshot({ path: `${dir}${tag}-${theme}-${name}.png`, fullPage: true })
  }
  await c.close()
}
await b.close()
console.log("ok", tag)
