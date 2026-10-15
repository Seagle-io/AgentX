import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const browser = await chromium.launch()
const ctx = await browser.newContext({ locale: "fr-FR" })
await ctx.addInitScript(() => { localStorage.setItem("i18nextLng", "fr"); console.log("boot ss=" + JSON.stringify(Object.keys(sessionStorage))) })
const page = await ctx.newPage(); const t0 = Date.now(); let nav = 0
page.on("console", m => console.log(Date.now() - t0, "console", m.type(), m.text().slice(0, 90)))
page.on("framenavigated", f => { if (f === page.mainFrame()) console.log(Date.now() - t0, "framenavigated", ++nav) })
page.on("request", r => { if (r.resourceType() === "document") console.log(Date.now() - t0, "doc request") })
page.on("requestfailed", r => { if (r.resourceType() === "document") console.log(Date.now() - t0, "doc failed", r.failure()?.errorText) })
await page.route(u => u.href.endsWith("index-wrQ7AnnA.js"), r => r.abort())
await page.goto("http://localhost:4423/"); await page.waitForTimeout(3000)
console.log("navs(committed)=", nav)
await browser.close()
