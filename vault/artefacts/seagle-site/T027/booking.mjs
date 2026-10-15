import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const D = "/home/jdrac/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T027/"
const b = await chromium.launch()
for (const [vw, vh, mob] of [[390, 844, true], [1440, 900, false], [390, 600, true]]) {
  const c = await b.newContext({ viewport: { width: vw, height: vh }, isMobile: mob, hasTouch: mob, deviceScaleFactor: 1 })
  await c.addInitScript(() => { localStorage.setItem("i18nextLng", "fr") })
  const d0 = new Date(); d0.setDate(d0.getDate() + 2); d0.setHours(10, 0, 0, 0)
  await c.route("**/api/booking/slots*", r => r.fulfill({ json: { timezone: "Europe/Paris", minutes: 30, slots: [0, 1, 2, 3, 4, 5].map(h => new Date(d0.getTime() + h * 3600e3).toISOString()) } }))
  const p = await c.newPage(); await p.goto("http://localhost:4173/rendez-vous/"); await p.waitForTimeout(1500)
  const slot = p.locator("button", { hasText: /^\s*1[0-5]:00\s*$/ }).first()
  await slot.scrollIntoViewIfNeeded(); await p.waitForTimeout(400)
  const before = await p.evaluate(() => scrollY)
  const sr = await slot.boundingBox()
  await p.screenshot({ path: D + `booking-${vw}x${vh}-avant.png` })
  const samples = []
  if (mob) await slot.tap(); else await slot.click()
  for (let i = 0; i < 8; i++) { samples.push(await p.evaluate(() => Math.round(scrollY))); await p.waitForTimeout(60) }
  await p.waitForTimeout(500)
  const r = await p.evaluate(() => { const a = document.activeElement, q = a.getBoundingClientRect(); const h = [...document.querySelectorAll("main h1,main h2,main h3,main p")].find(e => /\d\d:\d\d/.test(e.innerText) && e.getBoundingClientRect().height > 0); const hr = h?.getBoundingClientRect(); return { scrollY: Math.round(scrollY), focus: a.tagName + "[" + (a.getAttribute("aria-label") || a.name || a.placeholder || "") + "]", focusTop: Math.round(q.top), focusBottom: Math.round(q.bottom), inView: q.top >= 0 && q.bottom <= innerHeight, slotRecap: h ? h.innerText.slice(0, 50).replace(/\n/g, " ") + "@" + Math.round(hr.top) : "∅", docH: document.body.scrollHeight } })
  await p.screenshot({ path: D + `booking-${vw}x${vh}-apres.png` })
  console.log(`${vw}x${vh}`, "slotTop=" + Math.round(sr.y), "scrollAvant=" + before, "samples=" + samples.join(","), JSON.stringify(r))
  await c.close()
}
await b.close()
