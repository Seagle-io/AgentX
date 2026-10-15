// animations CSS infinies actives, sans préférence vs reduce
import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const BASE = process.env.BASE ?? "http://localhost:4408"
const b = await chromium.launch()
for (const rm of ["no-preference", "reduce"]) {
  const c = await b.newContext({ reducedMotion: rm }); const p = await c.newPage()
  for (const u of ["/", "/solutions/kora", "/leef-editor", "/services/infrastructure"]) {
    await p.goto(BASE + u); await p.waitForTimeout(1200)
    const a = await p.evaluate(() => [...document.querySelectorAll("*")].map(e => getComputedStyle(e)).filter(cs => cs.animationIterationCount === "infinite" && cs.animationName !== "none").map(cs => cs.animationName))
    console.log(rm, u, JSON.stringify(a))
  }
  await c.close()
}
await b.close()
