import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
for (const p of ["/", "/agentx/", "/contact/", "/lab/", "/de/products/", "/la-joconde/", "/rendez-vous/", "/secure-pass/"]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage()
  const hosts = new Map(); const errs = []
  page.on("pageerror", e => errs.push(e.message.slice(0, 60)))
  page.on("request", r => { const u = new URL(r.url()); if (!["localhost", "127.0.0.1"].includes(u.hostname) && u.protocol.startsWith("http")) hosts.set(u.hostname, (hosts.get(u.hostname) || 0) + 1) })
  await page.goto("http://localhost:4173" + p); await page.waitForTimeout(1500)
  for (let i = 0; i < 15; i++) { await page.mouse.wheel(0, 800); await page.waitForTimeout(120) }
  await page.waitForTimeout(1500)
  const a = await page.evaluate(() => document.querySelectorAll("#seagle-analytics").length)
  console.log(p.padEnd(16), "3rd-party=", JSON.stringify(Object.fromEntries(hosts)), "analytics=", a, "pageerror=", errs.length, errs.join("|"))
  await ctx.close()
}
await browser.close()
