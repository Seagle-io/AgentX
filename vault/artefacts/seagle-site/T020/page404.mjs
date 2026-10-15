import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] })
for (const p of process.argv.slice(2)) {
  const pg = await b.newPage(); const r = await pg.goto("http://localhost:4173"+p, { waitUntil: "load" }); await pg.waitForTimeout(1000)
  console.log(p, r.status(), JSON.stringify({ h1: await pg.locator("h1").first().textContent(), title: await pg.title(), can: await pg.locator('link[rel=canonical]').first().getAttribute("href"), robots: await pg.locator('meta[name=robots]').first().getAttribute("content").catch(()=>null) }))
  await pg.close()
}
await b.close()
