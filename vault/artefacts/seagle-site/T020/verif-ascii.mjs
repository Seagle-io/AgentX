// canvas ASCII (reduced-motion => statiques) : hash pixel par canvas + capture page, pour comparer deux builds
import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
import crypto from "node:crypto"
const BASE = process.env.BASE ?? "http://localhost:4408"
const tag = process.argv[2]
const dir = new URL(".", import.meta.url).pathname
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
const out = {}
for (const theme of ["light", "dark"]) {
  const c = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" })
  await c.addInitScript(t => { localStorage.setItem("seagle-theme", t); localStorage.setItem("i18nextLng", "fr") }, theme)
  const p = await c.newPage()
  for (const u of ["/", "/solutions/kora", "/leef-editor"]) {
    await p.goto(BASE + u); await p.waitForLoadState("networkidle").catch(() => {}); await p.waitForTimeout(2500)
    const name = u === "/" ? "home" : u.slice(1).replace(/\//g, "-")
    const cvs = p.locator("canvas"); const n = await cvs.count(); const h = []
    for (let i = 0; i < n; i++) { const cv = cvs.nth(i); const bb = await cv.boundingBox(); if (!bb || bb.width < 20) continue; await cv.scrollIntoViewIfNeeded().catch(() => {}); await p.waitForTimeout(1500); const data = await cv.evaluate(e => { try { return e.toDataURL() } catch (x) { return "ERR " + x.message } }); const ctx = await cv.evaluate(e => e.dataset.engine ?? (e.getContext("2d") ? "2d" : "gl")).catch(() => "?"); h.push(ctx + ":" + crypto.createHash("sha1").update(data).digest("hex").slice(0, 12) + ":" + data.length) }
    out[`${theme} ${u}`] = h
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(800)
    await p.screenshot({ path: `${dir}ascii-${tag}-${theme}-${name}.png` })
  }
  await c.close()
}
await b.close()
console.log(JSON.stringify(out))
