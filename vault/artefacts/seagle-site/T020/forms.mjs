import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const BASE = "http://localhost:4173"
const b = await chromium.launch()
const fv = p => p.evaluate(() => { const e = document.activeElement, cs = getComputedStyle(e); const vis = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== "none"; return `${e.tagName}[${(e.getAttribute("aria-label") || e.innerText || e.name || "").trim().slice(0, 20)}]${vis ? "" : " SANS-FOCUS(outline=" + cs.outlineStyle + " shadow=" + cs.boxShadow + ")"}` })
for (const [path, lng, theme] of [["/rendez-vous", "fr", "dark"], ["/de/book", "de", "light"]]) {
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } })
  await c.addInitScript(([t, l]) => { localStorage.setItem("seagle-theme", t); localStorage.setItem("i18nextLng", l) }, [theme, lng])
  const d0 = new Date(); d0.setDate(d0.getDate() + 2); d0.setHours(10, 0, 0, 0)
  const slots = [0, 1, 2].map(h => new Date(d0.getTime() + h * 3600e3).toISOString())
  await c.route("**/api/booking/slots*", r => r.fulfill({ json: { timezone: "Europe/Paris", minutes: 30, slots } }))
  await c.route("**/api/booking", r => r.fulfill({ status: 409, json: { error: "Ce créneau vient d'être réservé." } }))
  const p = await c.newPage(); await p.goto(BASE + path); await p.waitForTimeout(1500)
  const seq = []
  for (let i = 0; i < 70; i++) { await p.keyboard.press("Tab"); if (await p.evaluate(() => !!document.activeElement.closest("#main"))) seq.push(await fv(p)); if (await p.evaluate(() => !!document.activeElement.closest("footer"))) break }
  const sans = seq.filter(s => s.includes("SANS-FOCUS"))
  console.log(path, theme, "tabs main", seq.length, "sansFocus", sans.length, JSON.stringify([...new Set(sans)].slice(0, 6)))
  console.log("  jours ex", JSON.stringify(await p.evaluate(() => [...document.querySelectorAll("button[aria-pressed]")].slice(0, 3).map(b => `${b.getAttribute("aria-label")} disabled=${b.disabled} p=${b.getAttribute("aria-pressed")}`))))
  const slotBtn = p.getByRole("button", { name: /^\d{1,2}[:.h]\d{2}/ }).first()
  await slotBtn.focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(800)
  console.log("  créneaux après Entrée", JSON.stringify(await p.evaluate(() => [...document.querySelectorAll("button[aria-pressed]")].filter(b => /\d[:.h]\d\d/.test(b.innerText)).map(b => `${b.getAttribute("aria-label")} p=${b.getAttribute("aria-pressed")}`))), "focus", await fv(p))
  const snap = await p.locator("form").first().ariaSnapshot().catch(e => "ERR " + e.message.slice(0, 80))
  console.log("  form aria:\n    " + snap.split("\n").join("\n    "))
  // envoi vide → erreurs ?
  await p.locator("form button[type=submit]").click(); await p.waitForTimeout(600)
  console.log("  envoi vide: invalid=", JSON.stringify(await p.evaluate(() => [...document.querySelectorAll("form :invalid")].map(e => e.name || e.type + ":" + e.validationMessage.slice(0, 30)))), "alerts=", JSON.stringify(await p.evaluate(() => [...document.querySelectorAll("[role=alert]")].map(e => e.innerText.slice(0, 50)))))
  await p.locator("form input").nth(0).fill("Test"); await p.locator("form input[type=email]").fill("t@seagle.io")
  await p.locator("form button[type=submit]").click(); await p.waitForTimeout(1200)
  console.log("  409 alerts=", JSON.stringify(await p.evaluate(() => [...document.querySelectorAll("[role=alert]")].map(e => e.innerText.slice(0, 60)))), "p.text-red-500 role=", JSON.stringify(await p.evaluate(() => [...document.querySelectorAll("p.text-red-500")].map(e => e.getAttribute("role")))))
  await c.close()
}
for (const [path, lng, theme] of [["/contact", "fr", "dark"], ["/de/contact", "de", "light"]]) {
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } })
  await c.addInitScript(([t, l]) => { localStorage.setItem("seagle-theme", t); localStorage.setItem("i18nextLng", l) }, [theme, lng])
  await c.route("**/api/contact", r => r.abort("internetdisconnected"))
  const p = await c.newPage(); await p.goto(BASE + path); await p.waitForTimeout(1500)
  console.log(path, theme, "form aria:\n    " + (await p.locator("form").first().ariaSnapshot()).split("\n").join("\n    "))
  const seq = []
  for (let i = 0; i < 80; i++) { await p.keyboard.press("Tab"); if (await p.evaluate(() => !!document.activeElement.closest("form"))) seq.push(await fv(p)); if (await p.evaluate(() => !!document.activeElement.closest("footer"))) break }
  console.log("  tabs form", seq.length, JSON.stringify(seq))
  await p.locator("form button[type=submit]").click(); await p.waitForTimeout(600)
  console.log("  envoi vide invalid=", JSON.stringify(await p.evaluate(() => [...document.querySelectorAll("form :invalid")].map(e => e.name))), "alerts=", JSON.stringify(await p.evaluate(() => [...document.querySelectorAll("[role=alert]")].map(e => e.innerText.slice(0, 50)))))
  for (const [n, v] of [["name", "T"], ["email", "t@seagle.io"], ["subject", "s"]]) await p.locator(`input[name=${n}]`).fill(v)
  await p.locator("textarea[name=message]").fill("m"); await p.locator("form button[type=submit]").click(); await p.waitForTimeout(1500)
  console.log("  réseau coupé alerts=", JSON.stringify(await p.evaluate(() => [...document.querySelectorAll("[role=alert]")].map(e => e.innerText.slice(0, 70)))))
  await c.close()
}
await b.close()
