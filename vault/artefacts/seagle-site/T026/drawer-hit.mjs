import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const b = await chromium.launch()
for (const [w, h] of [[390, 844], [390, 500]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } }); await p.goto("http://localhost:4426/"); await p.waitForTimeout(1000)
  await p.locator("button[aria-controls=mobile-drawer]").click(); await p.waitForTimeout(700)
  const d = p.locator("#mobile-drawer")
  for (const sel of ["#mobile-drawer button", "#mobile-drawer a[href$='contact']"]) {
    const el = p.locator(sel).last(); await el.scrollIntoViewIfNeeded()
    const hit = await el.evaluate(e => { const r = e.getBoundingClientRect(); const x = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e === x || e.contains(x) })
    console.log(`${w}x${h}`, sel, "hit", hit)
  }
  console.log(`${w}x${h}`, JSON.stringify(await d.evaluate(e => ({ client: e.clientHeight, scroll: e.scrollHeight, ov: getComputedStyle(e).overflowY }))))
  await p.locator("#mobile-drawer a[href$='contact']").last().click(); await p.waitForTimeout(600)
  console.log(`${w}x${h}`, "clic CTA →", new URL(p.url()).pathname)
  await p.close()
}
await b.close()
