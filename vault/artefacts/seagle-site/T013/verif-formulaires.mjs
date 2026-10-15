// /rendez-vous et /contact avec API simulée (route Playwright) : noms, aria-pressed, alertes, contour de focus
import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const BASE = process.env.BASE ?? "http://localhost:4408"
const tag = process.argv[2] ?? "apres"
const dir = new URL(".", import.meta.url).pathname
const b = await chromium.launch()
const out = {}
for (const theme of ["dark", "light"]) {
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } })
  await c.addInitScript(t => { localStorage.setItem("seagle-theme", t); localStorage.setItem("i18nextLng", "fr") }, theme)
  const d0 = new Date(); d0.setDate(d0.getDate() + 2); d0.setHours(10, 0, 0, 0)
  const slots = [0, 1, 2].map(h => new Date(d0.getTime() + h * 3600e3).toISOString())
  await c.route("**/api/booking/slots*", r => r.fulfill({ json: { slots } }))
  await c.route("**/api/booking", r => r.fulfill({ status: 500, json: { error: "x" } }))
  await c.route("**/api/contact", r => r.fulfill({ status: 500, json: { error: "x" } }))
  const p = await c.newPage(); const o = out[theme] = {}
  await p.goto(BASE + "/rendez-vous"); await p.waitForTimeout(1500)
  o.jours = await p.evaluate(() => { const bs = [...document.querySelectorAll("button")].filter(b => /^\d{1,2}$/.test(b.innerText.trim())); return { n: bs.length, sansNom: bs.filter(b => !b.getAttribute("aria-label")).length, pressed: bs.filter(b => b.getAttribute("aria-pressed") === "true").map(b => b.getAttribute("aria-label")), ex: bs.slice(0, 2).map(b => b.getAttribute("aria-label") + " pressed=" + b.getAttribute("aria-pressed")) } })
  o.creneaux = await p.evaluate(() => [...document.querySelectorAll("button")].filter(b => /^\d{1,2}[:h]\d{2}$/.test(b.innerText.trim())).map(b => b.getAttribute("aria-label") + " pressed=" + b.getAttribute("aria-pressed")))
  await p.locator("button", { hasText: /^\d{1,2}[:h]\d{2}$/ }).first().click(); await p.waitForTimeout(800)
  o.champs = await p.evaluate(() => [...document.querySelectorAll("form input,form textarea")].filter(e => e.getAttribute("aria-hidden") === null).map(e => `${e.type} aria-label=${e.getAttribute("aria-label")} ph=${e.placeholder}`))
  const f = p.locator("form input").first(); await p.keyboard.press("Tab"); await f.focus()
  const ol = () => p.evaluate(() => { const cs = getComputedStyle(document.activeElement); return `${document.activeElement.tagName} fv=${document.activeElement.matches(":focus-visible")} outline=${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} offset=${cs.outlineOffset}` })
  o.focusRdv = await ol()
  await p.locator("form input").first().screenshot({ path: `${dir}${tag}-${theme}-focus-rendez-vous.png` }).catch(() => {})
  await p.locator("form input").nth(0).fill("Test"); await p.locator("form input").nth(1).fill("t@seagle.io")
  await p.locator("form button[type=submit]").click(); await p.waitForTimeout(1200)
  o.alerteRdv = await p.evaluate(() => [...document.querySelectorAll("[role=alert]")].map(e => e.innerText.slice(0, 60)))
  await p.blur?.("body").catch(() => {})
  await p.goto(BASE + "/contact"); await p.waitForTimeout(1500)
  o.focusContactRepos = await p.evaluate(() => getComputedStyle(document.querySelector("input[name=name]")).outlineStyle)
  await p.locator("input[name=name]").focus(); o.focusContact = await ol()
  for (const [n, v] of [["name", "T"], ["email", "t@seagle.io"], ["subject", "s"]]) await p.locator(`input[name=${n}]`).fill(v)
  await p.locator("textarea[name=message]").fill("m"); await p.locator("form button[type=submit]").click(); await p.waitForTimeout(1200)
  o.alerteContact = await p.evaluate(() => [...document.querySelectorAll("[role=alert]")].map(e => e.innerText.slice(0, 60)))
  await p.goto(BASE + "/secure-pass"); await p.waitForTimeout(1500)
  await p.locator("#sp-demo").focus(); o.focusSp = await ol()
  await c.close()
}
await b.close()
console.log(JSON.stringify(out, null, 1))
