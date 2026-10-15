import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const b = await chromium.launch()
for (const u of ["/", "/de"]) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); await p.goto("http://localhost:4426" + u); await p.waitForTimeout(1000)
  await p.locator("button[aria-controls=mobile-drawer]").click(); await p.waitForTimeout(700)
  console.log(u, JSON.stringify(await p.evaluate(() => { const d = document.getElementById("mobile-drawer"), r = d.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, client: d.clientHeight, scroll: d.scrollHeight, items: [...d.querySelectorAll("a,button")].map(e => { const q = e.getBoundingClientRect(); return `${(e.getAttribute("aria-label") || e.innerText).trim().split("\n")[0].slice(0, 16)}:${Math.round(q.top)}-${Math.round(q.bottom)}` }) } })))
  await p.close()
}
await b.close()
