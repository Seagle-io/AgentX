import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const B = "http://localhost:4173"
const [path, file, delay, total] = [process.argv[2] || "/", process.argv[3] || "index-wrQ7AnnA.js", +(process.argv[4] || 7000), +(process.argv[5] || 40000)]
const browser = await chromium.launch()
const ctx = await browser.newContext({ locale: "fr-FR" })
const page = await ctx.newPage()
const t0 = Date.now(), ev = []
page.on("load", () => ev.push("load@" + ((Date.now() - t0) / 1000).toFixed(1)))
page.on("request", r => { if (r.url().endsWith(file)) ev.push("req@" + ((Date.now() - t0) / 1000).toFixed(1)) })
await page.route(u => u.href.endsWith(file), async r => { await new Promise(s => setTimeout(s, delay)); r.abort().catch(() => {}) })
await page.goto(B + path, { waitUntil: "commit" })
await page.waitForTimeout(total)
const loads = ev.filter(e => e.startsWith("load")).length
console.log(path, file, "delay=" + delay, "total=" + total / 1000 + "s", "loads=" + loads, ev.join(" "))
await browser.close()
