import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const b = await chromium.launch()
for (const [p,w] of [["/",1440],["/de",1440],["/",390]]) {
  const pg = await b.newPage({ viewport: { width: w, height: 900 } }); await pg.goto("http://localhost:4173"+p, { waitUntil: "load" }); await pg.waitForTimeout(800)
  console.log(p, w, JSON.stringify(await pg.$$eval("header button, body > div a[href='#main'], a[href='#main']", els => els.map(e => [e.tagName, e.textContent.trim().slice(0,30), e.getAttribute("aria-label"), e.getAttribute("aria-expanded"), e.getAttribute("aria-controls"), e.getBoundingClientRect().width>0]))))
  await pg.close()
}
await b.close()
