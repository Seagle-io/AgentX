import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const B = "http://localhost:4173/agentx/"
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
async function mk(opts) {
  const ctx = await browser.newContext(opts); const page = await ctx.newPage()
  const vids = []; const errs = []
  page.on("pageerror", e => errs.push(e.message.slice(0, 80)))
  page.on("requestfinished", async r => { if (/\.(webm|mp4)(\?|$)/.test(r.url())) { const s = await r.sizes().catch(() => ({})); vids.push(r.url().split("/").pop() + ":" + (s.responseBodySize ?? "?")) } })
  page.on("requestfailed", r => { if (/\.(webm|mp4)/.test(r.url())) vids.push(r.url().split("/").pop() + ":failed(" + r.failure()?.errorText + ")") })
  return { ctx, page, vids, errs }
}
const playing = page => page.evaluate(() => [...document.querySelectorAll("video")].map(v => `${v.currentSrc.split("/").pop() || v.querySelector("source")?.src.split("/").pop()}:${v.paused ? "paused" : "PLAY"}:top=${Math.round(v.getBoundingClientRect().top)}`))
// 1. mobile load
{ const { ctx, page, vids, errs } = await mk({ viewport: { width: 390, height: 844 } })
  await page.goto(B); await page.waitForTimeout(4000)
  console.log("390x844 load+4s vids=", JSON.stringify(vids), await playing(page), "pageerror=", errs.length)
  await ctx.close() }
// 2. 1440 idle 22s at top (auto-rotation offscreen)
{ const { ctx, page, vids } = await mk({ viewport: { width: 1440, height: 900 } })
  await page.goto(B); await page.waitForTimeout(22000)
  console.log("1440 idle 22s vids=", JSON.stringify(vids), await playing(page))
  await ctx.close() }
// 3. rapid tabs
for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  const { ctx, page, vids, errs } = await mk({ viewport: vp })
  await page.goto(B); await page.waitForTimeout(1500)
  const tabs = page.locator('[role="tab"]')
  await tabs.first().scrollIntoViewIfNeeded(); await page.waitForTimeout(300)
  await page.evaluate(() => document.querySelector('[role="tablist"]').scrollIntoView({ block: "start" })); await page.mouse.wheel(0, -120)
  await page.waitForTimeout(1500)
  const n = await tabs.count()
  const t0 = Date.now()
  await tabs.nth(1).click(); await tabs.nth(2).click(); await tabs.nth(0).click()
  const dt = Date.now() - t0
  await page.waitForTimeout(2500)
  const st = await playing(page)
  console.log("path", page.url(), `${vp.width} tabs=${n} 3 clicks in ${dt}ms → playing=${st.filter(s => s.includes("PLAY")).length}`, JSON.stringify(st), "vids=", JSON.stringify(vids), "pageerror=", errs.length)
  // 3 more clicks with 50ms gaps, then check selected tab vs video
  for (const i of [2, 1, 2]) { await tabs.nth(i).click(); await page.waitForTimeout(50) }
  await page.waitForTimeout(2500)
  const sel = await page.evaluate(() => [...document.querySelectorAll('[role="tab"]')].findIndex(t => t.getAttribute("aria-selected") === "true"))
  console.log(`${vp.width} after 2,1,2: selected=${sel}`, JSON.stringify(await playing(page)))
  await ctx.close()
}
// 4. reduced motion, full scroll + tab click
for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  const { ctx, page, vids } = await mk({ viewport: vp, reducedMotion: "reduce" })
  await page.goto(B); await page.waitForTimeout(1500)
  for (let y = 0; y < 12000; y += 600) { await page.mouse.wheel(0, 600); await page.waitForTimeout(150) }
  const tabs = page.locator('[role="tab"]'); await tabs.first().scrollIntoViewIfNeeded()
  await tabs.nth(1).dispatchEvent("click"); await page.waitForTimeout(2000)
  console.log(`RM ${vp.width} vids=`, JSON.stringify(vids), JSON.stringify(await playing(page)))
  await ctx.close()
}
await browser.close()
